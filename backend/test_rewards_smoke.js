const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const Device = require('./src/models/Device');
const Schedule = require('./src/models/Schedule');
const User = require('./src/models/User');
const RewardTransaction = require('./src/models/RewardTransaction');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const user1Id = new mongoose.Types.ObjectId();
const user2Id = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();

const user1Token = jwt.sign({ id: user1Id.toString(), email: 'user1@greensync.local' }, JWT_SECRET);
const user2Token = jwt.sign({ id: user2Id.toString(), email: 'user2@greensync.local' }, JWT_SECRET);
const adminToken = jwt.sign({ id: adminId.toString(), email: 'admin@greensync.local' }, JWT_SECRET);

async function runSmokeTest() {
  console.log('=== LIVE IN-PROCESS HTTP SMOKE TEST (Phase 6 Part 2) ===\n');

  await mongoose.connect('mongodb://localhost:27017/greensync');
  console.log('Connected to MongoDB.');

  // Clean up any test artifacts from prior runs
  await Device.deleteMany({ name: { $regex: /^REWARDS_SMOKE_/ } });
  await Schedule.deleteMany({ userId: { $in: [user1Id, user2Id, adminId] } });
  await RewardTransaction.deleteMany({ userId: { $in: [user1Id, user2Id, adminId] } });
  await User.deleteMany({ _id: { $in: [user1Id, user2Id, adminId] } });

  // Seed user records (User 1: regular, User 2: regular, Admin: admin role)
  await User.create([
    { _id: user1Id, name: 'Test User 1', passwordHash: 'mockhash123', email: 'user1@greensync.local', role: 'user', flexCoins: 0, status: 'active' },
    { _id: user2Id, name: 'Test User 2', passwordHash: 'mockhash123', email: 'user2@greensync.local', role: 'user', flexCoins: 0, status: 'active' },
    { _id: adminId, name: 'Test Admin', passwordHash: 'mockhash123', email: 'admin@greensync.local', role: 'admin', flexCoins: 0, status: 'active' },
  ]);

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
    // 1. Full Happy Path: Recommend -> Accept -> Complete -> Reward Transaction
    // -------------------------------------------------------------------
    console.log('--- TEST 1: Full Lifecycle: Recommend -> Accept -> Complete ---');
    const earliestStart = new Date(Date.now() + 5 * 60 * 1000); // 5 mins ahead
    const deadline = new Date(Date.now() + 8 * 3600 * 1000);    // 8 hours ahead

    const device = await Device.create({
      userId: user1Id,
      name: 'REWARDS_SMOKE_EV',
      type: 'ev_charging',
      energyRequired: 14.4,
      earliestStart,
      deadline,
      status: 'active',
      flexibility: 'high',
    });

    // 1a. Recommend
    const recRes = await apiPost('/api/schedule/recommend', { deviceId: device._id.toString() }, user1Token);
    if (recRes.status !== 201 || !recRes.body.data) {
      throw new Error(`Expected 201 Created from /recommend, got ${recRes.status}: ${JSON.stringify(recRes.body)}`);
    }
    const scheduleId = recRes.body.data._id;
    console.log('Generated Schedule ID:', scheduleId);

    // 1b. Accept
    const acceptRes = await apiPost(`/api/schedule/${scheduleId}/accept`, {}, user1Token);
    if (acceptRes.status !== 200 || acceptRes.body.data?.status !== 'accepted') {
      throw new Error(`Expected 200 accepted, got ${acceptRes.status}`);
    }
    console.log('Accepted Schedule Status:', acceptRes.body.data.status);

    // 1c. Complete
    const completeRes = await apiPost(`/api/schedule/${scheduleId}/complete`, {}, user1Token);
    console.log('HTTP Complete Status:', completeRes.status);
    console.log('Completed Schedule Data:', {
      status: completeRes.body.data?.status,
      flexCoinsEarned: completeRes.body.data?.flexCoinsEarned,
    });

    if (completeRes.status !== 200) {
      throw new Error(`Expected 200 OK from /complete, got ${completeRes.status}: ${JSON.stringify(completeRes.body)}`);
    }
    if (completeRes.body.data?.status !== 'completed') {
      throw new Error(`Expected status 'completed', got ${completeRes.body.data?.status}`);
    }
    if (typeof completeRes.body.data?.flexCoinsEarned !== 'number' || completeRes.body.data.flexCoinsEarned <= 0) {
      throw new Error(`Expected positive flexCoinsEarned, got ${completeRes.body.data?.flexCoinsEarned}`);
    }

    const earnedCoins = completeRes.body.data.flexCoinsEarned;

    // Verify RewardTransaction persisted in DB
    const rewardTx = await RewardTransaction.findOne({ scheduleId });
    if (!rewardTx) {
      throw new Error(`Expected RewardTransaction document in DB for schedule ${scheduleId}`);
    }
    console.log('RewardTransaction persisted:', {
      id: rewardTx._id.toString(),
      coins: rewardTx.coins,
      impactType: rewardTx.impactType,
      reason: rewardTx.reason.slice(0, 60) + '...',
    });

    if (rewardTx.coins !== earnedCoins) {
      throw new Error(`RewardTransaction.coins (${rewardTx.coins}) !== schedule.flexCoinsEarned (${earnedCoins})`);
    }
    if (!['renewable', 'peak_reduction', 'bonus'].includes(rewardTx.impactType)) {
      throw new Error(`Invalid impactType: ${rewardTx.impactType}`);
    }
    if (!rewardTx.reason.includes('Impact Simulation')) {
      throw new Error('RewardTransaction reason must explicitly mention "Impact Simulation" (Section 6)');
    }
    if (rewardTx.reason.toLowerCase().includes('donated') || rewardTx.reason.toLowerCase().includes('ngo')) {
      throw new Error('RewardTransaction reason must never mention donated/NGO (Section 6)');
    }

    // Verify User.flexCoins was incremented
    const userDoc = await User.findById(user1Id);
    if (userDoc.flexCoins !== earnedCoins) {
      throw new Error(`Expected User.flexCoins to equal ${earnedCoins}, got ${userDoc.flexCoins}`);
    }

    console.log('PASS: 1. Full lifecycle completed with verified RewardTransaction & User coin increment.\n');

    // -------------------------------------------------------------------
    // 2. Idempotency: Calling complete twice on same schedule
    // -------------------------------------------------------------------
    console.log('--- TEST 2: Idempotency on Repeated /complete Calls ---');
    const repeatRes = await apiPost(`/api/schedule/${scheduleId}/complete`, {}, user1Token);
    console.log('Repeat Complete Status:', repeatRes.status);
    console.log('Repeat Complete Body:', repeatRes.body);

    if (repeatRes.status !== 200) {
      throw new Error(`Expected 200 on repeat complete, got ${repeatRes.status}`);
    }

    // Verify count of RewardTransactions is still strictly 1
    const txCount = await RewardTransaction.countDocuments({ scheduleId });
    if (txCount !== 1) {
      throw new Error(`Expected exactly 1 RewardTransaction for schedule ${scheduleId}, found ${txCount}`);
    }

    // Verify User.flexCoins was NOT double incremented
    const userDocAfterRepeat = await User.findById(user1Id);
    if (userDocAfterRepeat.flexCoins !== earnedCoins) {
      throw new Error(`User.flexCoins double-incremented! Expected ${earnedCoins}, got ${userDocAfterRepeat.flexCoins}`);
    }

    console.log('PASS: 2. Calling complete twice created 0 duplicate transactions and 0 double increments.\n');

    // -------------------------------------------------------------------
    // 3. Completing a Proposed (Non-Accepted) Schedule (400 VALIDATION_ERROR)
    // -------------------------------------------------------------------
    console.log('--- TEST 3: Completing Proposed Schedule (Transition Guard) ---');
    const proposedDevice = await Device.create({
      userId: user1Id,
      name: 'REWARDS_SMOKE_WaterHeater',
      type: 'water_heater',
      energyRequired: 4.0,
      earliestStart,
      deadline,
      status: 'active',
      flexibility: 'medium',
    });

    const proposedRecRes = await apiPost('/api/schedule/recommend', { deviceId: proposedDevice._id.toString() }, user1Token);
    const proposedScheduleId = proposedRecRes.body.data._id;

    const invalidCompleteRes = await apiPost(`/api/schedule/${proposedScheduleId}/complete`, {}, user1Token);
    console.log('Invalid Complete Status:', invalidCompleteRes.status);
    console.log('Error envelope:', invalidCompleteRes.body);

    if (invalidCompleteRes.status !== 400 || invalidCompleteRes.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR, got ${invalidCompleteRes.status}`);
    }

    const unearnedTxCount = await RewardTransaction.countDocuments({ scheduleId: proposedScheduleId });
    if (unearnedTxCount !== 0) {
      throw new Error('RewardTransaction was mistakenly created for proposed schedule!');
    }

    console.log('PASS: 3. Correctly rejected completion of non-accepted schedule with 400 VALIDATION_ERROR.\n');

    // -------------------------------------------------------------------
    // 4. Completing Another User\'s Schedule (403 FORBIDDEN)
    // -------------------------------------------------------------------
    console.log('--- TEST 4: Completing Schedule as Unauthorized User ---');
    const crossUserRes = await apiPost(`/api/schedule/${scheduleId}/complete`, {}, user2Token);
    console.log('Cross User Complete Status:', crossUserRes.status);
    console.log('Cross User Error:', crossUserRes.body);

    if (crossUserRes.status !== 403 || crossUserRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on unauthorized completion, got ${crossUserRes.status}`);
    }

    console.log('PASS: 4. Rejection with 403 FORBIDDEN on unauthorized schedule completion.\n');

    // -------------------------------------------------------------------
    // 5. GET /api/rewards/balance
    // -------------------------------------------------------------------
    console.log('--- TEST 5: GET /api/rewards/balance ---');
    const balanceRes = await apiGet('/api/rewards/balance', user1Token);
    console.log('Balance Response Status:', balanceRes.status);
    console.log('Balance Response Body:', balanceRes.body);

    if (balanceRes.status !== 200 || !balanceRes.body.success) {
      throw new Error(`Expected 200 OK for balance, got ${balanceRes.status}`);
    }
    if (balanceRes.body.data?.balance !== earnedCoins) {
      throw new Error(`Expected balance of ${earnedCoins}, got ${balanceRes.body.data?.balance}`);
    }

    console.log(`PASS: 5. Balance endpoint successfully reconciled with transactions sum (${earnedCoins} FC).\n`);

    // -------------------------------------------------------------------
    // 6. GET /api/impact/summary
    // -------------------------------------------------------------------
    console.log('--- TEST 6: GET /api/impact/summary ---');
    const summaryRes = await apiGet('/api/impact/summary', user1Token);
    console.log('Impact Summary Status:', summaryRes.status);
    console.log('Impact Summary Body:', summaryRes.body);

    if (summaryRes.status !== 200 || !summaryRes.body.success) {
      throw new Error(`Expected 200 OK for impact summary, got ${summaryRes.status}`);
    }

    const summaryData = summaryRes.body.data;
    if (summaryData.totalFlexCoins !== earnedCoins) {
      throw new Error(`Impact summary coins (${summaryData.totalFlexCoins}) !== earnedCoins (${earnedCoins})`);
    }
    if (summaryData.totalEnergyShifted <= 0) {
      throw new Error(`Expected positive totalEnergyShifted, got ${summaryData.totalEnergyShifted}`);
    }
    if (summaryData.avgRenewableUtilization <= 0) {
      throw new Error(`Expected positive avgRenewableUtilization, got ${summaryData.avgRenewableUtilization}`);
    }

    console.log('PASS: 6. Personal impact summary reconciled with schedule & reward data.\n');

    // -------------------------------------------------------------------
    // 7. GET /api/impact/admin (Security & Server-side Role Check)
    // -------------------------------------------------------------------
    console.log('--- TEST 7: GET /api/impact/admin (Role Verification) ---');
    // 7a. Non-admin user access (forbidden)
    const nonAdminRes = await apiGet('/api/impact/admin', user1Token);
    console.log('Non-admin Admin Route Status:', nonAdminRes.status);
    console.log('Non-admin Error Body:', nonAdminRes.body);

    if (nonAdminRes.status !== 403 || nonAdminRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for non-admin on /impact/admin, got ${nonAdminRes.status}`);
    }

    // 7b. Admin user access (authorized)
    const adminRes = await apiGet('/api/impact/admin', adminToken);
    console.log('Admin Route Status:', adminRes.status);
    console.log('Admin Metrics Data:', adminRes.body.data);

    if (adminRes.status !== 200 || !adminRes.body.success) {
      throw new Error(`Expected 200 OK for admin on /impact/admin, got ${adminRes.status}`);
    }

    const adminData = adminRes.body.data;
    if (typeof adminData.totalFlexibleLoad !== 'number' || adminData.totalFlexibleLoad <= 0) {
      throw new Error(`Expected positive totalFlexibleLoad, got ${adminData.totalFlexibleLoad}`);
    }
    if (typeof adminData.activeUserCount !== 'number' || adminData.activeUserCount < 1) {
      throw new Error(`Expected activeUserCount >= 1, got ${adminData.activeUserCount}`);
    }
    if (adminData.totalFlexCoinsIssued !== earnedCoins) {
      throw new Error(`Expected totalFlexCoinsIssued (${adminData.totalFlexCoinsIssued}) === ${earnedCoins}`);
    }

    console.log('PASS: 7. Role-based server-side verification: 403 for non-admin, 200 with platform metrics for admin.\n');

    console.log('=== ALL 7 END-TO-END REWARDS & IMPACT SMOKE TEST SCENARIOS PASSED! ===');
  } finally {
    // Cleanup
    await Device.deleteMany({ name: { $regex: /^REWARDS_SMOKE_/ } });
    await Schedule.deleteMany({ userId: { $in: [user1Id, user2Id, adminId] } });
    await RewardTransaction.deleteMany({ userId: { $in: [user1Id, user2Id, adminId] } });
    await User.deleteMany({ _id: { $in: [user1Id, user2Id, adminId] } });
    await mongoose.disconnect();
    server.close();
  }
}

runSmokeTest().catch((err) => {
  console.error('Rewards smoke test failure:', err);
  process.exit(1);
});
