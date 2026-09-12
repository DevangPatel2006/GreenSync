const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const Device = require('./src/models/Device');
const Schedule = require('./src/models/Schedule');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const user1Id = new mongoose.Types.ObjectId();
const user2Id = new mongoose.Types.ObjectId();

const user1Token = jwt.sign({ id: user1Id.toString(), email: 'user1@greensync.local' }, JWT_SECRET);
const user2Token = jwt.sign({ id: user2Id.toString(), email: 'user2@greensync.local' }, JWT_SECRET);

async function runSmokeTest() {
  console.log('=== LIVE IN-PROCESS HTTP SMOKE TEST (Phase 5 Part 2) ===\n');

  await mongoose.connect('mongodb://localhost:27017/greensync');
  console.log('Connected to MongoDB.');

  // Clean up any test artifacts from prior runs
  await Device.deleteMany({ name: { $regex: /^SMOKE_TEST_/ } });
  await Schedule.deleteMany({ userId: { $in: [user1Id, user2Id] } });

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Express server running on ephemeral port ${port}.\n`);

  async function apiPost(endpoint, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { status: res.status, body: json };
  }

  async function apiGet(endpoint, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, { headers });
    const json = await res.json();
    return { status: res.status, body: json };
  }

  try {
    // -------------------------------------------------------------------
    // 1. Feasible Device Recommendation (201 Created)
    // -------------------------------------------------------------------
    console.log('--- TEST 1: Feasible Device Schedule Recommendation ---');
    const earliestStart = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now
    const deadline = new Date(Date.now() + 8 * 3600 * 1000);    // 8 hours from now

    const feasibleDevice = await Device.create({
      userId: user1Id,
      name: 'SMOKE_TEST_EV_Charger',
      type: 'ev_charging',
      energyRequired: 7.2, // 1 hour duration
      earliestStart,
      deadline,
      status: 'active',
      flexibility: 'high',
    });

    const recRes = await apiPost('/api/schedule/recommend', { deviceId: feasibleDevice._id.toString() }, user1Token);
    console.log('HTTP Status:', recRes.status);
    console.log('Response envelope:', { success: recRes.body.success, message: recRes.body.message });
    console.log('Schedule Data:', {
      id: recRes.body.data?._id,
      recommendedStart: recRes.body.data?.recommendedStart,
      recommendedEnd: recRes.body.data?.recommendedEnd,
      energyShifted: recRes.body.data?.energyShifted,
      renewableUtilization: recRes.body.data?.renewableUtilization,
      peakReduction: recRes.body.data?.peakReduction,
      co2Avoided: recRes.body.data?.co2Avoided,
      status: recRes.body.data?.status,
      reason: recRes.body.data?.reason,
    });

    if (recRes.status !== 201) throw new Error(`Expected 201, got ${recRes.status}`);
    if (!recRes.body.data) throw new Error('Expected schedule document in data');
    const createdScheduleId = recRes.body.data._id;

    const schedStart = new Date(recRes.body.data.recommendedStart).getTime();
    const schedEnd = new Date(recRes.body.data.recommendedEnd).getTime();
    if (schedStart < earliestStart.getTime()) throw new Error('recommendedStart < earliestStart!');
    if (schedEnd > deadline.getTime()) throw new Error('recommendedEnd > deadline!');
    console.log('PASS: 1. Returned 201 with valid schedule respecting all temporal constraints.\n');

    // -------------------------------------------------------------------
    // 2. Impossible Deadline in Past (400 VALIDATION_ERROR)
    // -------------------------------------------------------------------
    console.log('--- TEST 2: Device with Past Deadline ---');
    const pastDevice = await Device.create({
      userId: user1Id,
      name: 'SMOKE_TEST_Past_WaterHeater',
      type: 'water_heater',
      energyRequired: 4.0,
      earliestStart: new Date(Date.now() - 4 * 3600 * 1000),
      deadline: new Date(Date.now() - 1 * 3600 * 1000), // In past
      status: 'active',
      flexibility: 'medium',
    });

    const initialScheduleCount = await Schedule.countDocuments({ deviceId: pastDevice._id });
    const pastRes = await apiPost('/api/schedule/recommend', { deviceId: pastDevice._id.toString() }, user1Token);
    console.log('HTTP Status:', pastRes.status);
    console.log('Error envelope:', pastRes.body);

    if (pastRes.status !== 400 || pastRes.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR, got ${pastRes.status}`);
    }

    const postScheduleCount = await Schedule.countDocuments({ deviceId: pastDevice._id });
    if (initialScheduleCount !== postScheduleCount) {
      throw new Error('Schedule document was mistakenly created for invalid device!');
    }
    console.log('PASS: 2. Returned 400 VALIDATION_ERROR with no Schedule document persisted.\n');

    // -------------------------------------------------------------------
    // 3. Narrow Infeasible Window (200 OK with data: null)
    // -------------------------------------------------------------------
    console.log('--- TEST 3: Narrow Window (NO_FEASIBLE_SLOT Sentinel) ---');
    const narrowDevice = await Device.create({
      userId: user1Id,
      name: 'SMOKE_TEST_Narrow_Industrial',
      type: 'industrial', // 15 kW
      energyRequired: 30.0, // 2 hours required
      earliestStart: new Date(Date.now() + 10 * 60 * 1000),
      deadline: new Date(Date.now() + 40 * 60 * 1000), // Only 30 min window
      status: 'active',
      flexibility: 'low',
    });

    const narrowRes = await apiPost('/api/schedule/recommend', { deviceId: narrowDevice._id.toString() }, user1Token);
    console.log('HTTP Status:', narrowRes.status);
    console.log('Response body:', narrowRes.body);

    if (narrowRes.status !== 200 || narrowRes.body.success !== true || narrowRes.body.data !== null) {
      throw new Error(`Expected 200 with data: null, got ${narrowRes.status}`);
    }
    console.log('PASS: 3. Returned 200 with data: null per Section 15 contract.\n');

    // -------------------------------------------------------------------
    // 4. Accept Schedule by Owner (200 OK -> status: accepted)
    // -------------------------------------------------------------------
    console.log('--- TEST 4: Accept Schedule as Owner ---');
    const acceptRes = await apiPost(`/api/schedule/${createdScheduleId}/accept`, {}, user1Token);
    console.log('HTTP Status:', acceptRes.status);
    console.log('Updated Status:', acceptRes.body.data?.status);

    if (acceptRes.status !== 200 || acceptRes.body.data?.status !== 'accepted') {
      throw new Error(`Expected 200 with status: accepted, got ${acceptRes.status}`);
    }
    console.log('PASS: 4. Owner accepted schedule, status updated to "accepted".\n');

    // -------------------------------------------------------------------
    // 5. Accept Schedule as Different User (403 FORBIDDEN)
    // -------------------------------------------------------------------
    console.log('--- TEST 5: Accept Schedule as Unauthorized User ---');
    const forbiddenRes = await apiPost(`/api/schedule/${createdScheduleId}/accept`, {}, user2Token);
    console.log('HTTP Status:', forbiddenRes.status);
    console.log('Error envelope:', forbiddenRes.body);

    if (forbiddenRes.status !== 403 || forbiddenRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN, got ${forbiddenRes.status}`);
    }
    console.log('PASS: 5. Rejection with 403 FORBIDDEN on unauthorized schedule modification.\n');

    // -------------------------------------------------------------------
    // 6. Schedule History (200 OK)
    // -------------------------------------------------------------------
    console.log('--- TEST 6: Get Schedule History ---');
    const historyRes = await apiGet('/api/schedule/history', user1Token);
    console.log('HTTP Status:', historyRes.status);
    console.log('History count for user1:', historyRes.body.data?.length);
    console.log('First record ID:', historyRes.body.data[0]?._id);

    if (historyRes.status !== 200 || !Array.isArray(historyRes.body.data) || historyRes.body.data.length === 0) {
      throw new Error(`Expected 200 with history array, got ${historyRes.status}`);
    }
    console.log('PASS: 6. History returned successfully for authenticated user.\n');

    console.log('=== ALL 6 END-TO-END SMOKE TEST SCENARIOS PASSED! ===');
  } finally {
    // Cleanup
    await Device.deleteMany({ name: { $regex: /^SMOKE_TEST_/ } });
    await Schedule.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await mongoose.disconnect();
    server.close();
  }
}

runSmokeTest().catch((err) => {
  console.error('Smoke test failure:', err);
  process.exit(1);
});
