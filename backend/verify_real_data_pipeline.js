const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runVerification() {
  console.log('=== Step 1: Register a fresh test user with 0 devices ===');
  const timestamp = Date.now();
  const testEmail = `zero_user_${timestamp}@greensync.test`;
  const testPassword = 'Password123!';

  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    name: 'Zero State User',
    email: testEmail,
    password: testPassword,
    role: 'user',
  });
  console.log('Registered user status:', regRes.status);
  const token = regRes.data?.data?.token || regRes.data?.token;
  console.log('Got JWT Token:', Boolean(token));

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  console.log('\n=== Step 2: Query initial state (Must genuinely be 0 / empty) ===');
  const [devicesRes, balanceRes, impactRes, pendingRes] = await Promise.all([
    axios.get(`${API_BASE}/devices`, { headers: authHeaders }),
    axios.get(`${API_BASE}/rewards/balance`, { headers: authHeaders }),
    axios.get(`${API_BASE}/impact/summary`, { headers: authHeaders }),
    axios.get(`${API_BASE}/schedule/pending`, { headers: authHeaders }),
  ]);

  const devices = devicesRes.data?.data?.devices || devicesRes.data?.devices || (Array.isArray(devicesRes.data?.data) ? devicesRes.data?.data : []);
  const balance = balanceRes.data?.data?.balance ?? balanceRes.data?.balance ?? 0;
  const impact = impactRes.data?.data || impactRes.data;
  const pending = pendingRes.data?.data;

  console.log('Devices array length:', devices.length);
  console.log('FlexCoin Balance:', balance);
  console.log('Impact Summary:', {
    totalEnergyShifted: impact.totalEnergyShifted,
    totalCo2Avoided: impact.totalCo2Avoided,
    totalFlexCoins: impact.totalFlexCoins,
    avgRenewableUtilization: impact.avgRenewableUtilization,
    totalPeakReduction: impact.totalPeakReduction,
  });
  console.log('Pending Schedule Recommendation:', pending);

  if (devices.length !== 0 || balance !== 0 || impact.totalEnergyShifted !== 0) {
    throw new Error('Verification failed: initial user data is not 0!');
  }
  console.log('>>> PASSED: Initial state is genuinely 0 across all endpoints!');

  console.log('\n=== Step 3: Add a real device to the user account ===');
  const now = new Date();
  const devRes = await axios.post(
    `${API_BASE}/devices`,
    {
      name: 'Residential EV Charger Station',
      type: 'ev_charging',
      energyRequired: 22.0,
      earliestStart: new Date(now.getTime() - 3600 * 1000).toISOString(),
      deadline: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
      flexibility: 'high',
      priority: 'high',
    },
    { headers: authHeaders }
  );

  const device = devRes.data?.data?.device || devRes.data?.data || devRes.data;
  console.log('Created device:', {
    id: device._id || device.id,
    name: device.name,
    type: device.type,
    energyRequired: device.energyRequired,
  });

  console.log('\n=== Step 4: Request real recommendation for this device ===');
  const recRes = await axios.post(
    `${API_BASE}/schedule/recommend`,
    { deviceId: device._id || device.id },
    { headers: authHeaders }
  );

  const recommendation = recRes.data?.data?.schedule || recRes.data?.data || recRes.data;
  const schedId = recommendation._id || recommendation.id;
  console.log('Generated real recommendation:', {
    scheduleId: schedId,
    deviceId: recommendation.deviceId,
    energyShifted: recommendation.energyShifted,
    flexCoinsEarned: recommendation.flexCoinsEarned || recommendation.flexCoins,
    co2Avoided: recommendation.co2Avoided,
    status: recommendation.status,
    recommendedStart: recommendation.recommendedStart,
    recommendedEnd: recommendation.recommendedEnd,
  });

  console.log('\n=== Step 5: Accept this real recommendation ===');
  const acceptRes = await axios.post(
    `${API_BASE}/schedule/${schedId}/accept`,
    {},
    { headers: authHeaders }
  );
  console.log('Accept response:', acceptRes.data?.message || acceptRes.data);

  console.log('\n=== Step 6: Complete the schedule to trigger real reward & impact pipeline ===');
  const completeRes = await axios.post(
    `${API_BASE}/schedule/${schedId}/complete`,
    {},
    { headers: authHeaders }
  );
  console.log('Complete response:', completeRes.data?.message || completeRes.data);

  console.log('\n=== Step 7: Verify updated real metrics after transaction ===');
  const [updatedBalanceRes, updatedImpactRes, historyRes] = await Promise.all([
    axios.get(`${API_BASE}/rewards/balance`, { headers: authHeaders }),
    axios.get(`${API_BASE}/impact/summary`, { headers: authHeaders }),
    axios.get(`${API_BASE}/rewards/history`, { headers: authHeaders }),
  ]);

  const newBalance = updatedBalanceRes.data?.data?.balance ?? updatedBalanceRes.data?.balance;
  const newImpact = updatedImpactRes.data?.data || updatedImpactRes.data;
  const history = historyRes.data?.data || historyRes.data;

  console.log('New FlexCoin Balance:', newBalance);
  console.log('New Impact Summary:', {
    totalEnergyShifted: newImpact.totalEnergyShifted,
    totalCo2Avoided: newImpact.totalCo2Avoided,
    totalFlexCoins: newImpact.totalFlexCoins,
    avgRenewableUtilization: newImpact.avgRenewableUtilization,
    totalPeakReduction: newImpact.totalPeakReduction,
  });
  console.log('Reward Transactions count:', Array.isArray(history) ? history.length : history);
  if (Array.isArray(history) && history.length > 0) {
    console.log('Latest Transaction:', {
      type: history[0].type,
      amount: history[0].amount,
      reason: history[0].reason,
      createdAt: history[0].createdAt,
    });
  }

  if (newBalance <= 0 || newImpact.totalEnergyShifted <= 0) {
    throw new Error('Verification failed: Balance or Impact was not updated by real transaction!');
  }

  console.log('\n>>> PASSED: Pipeline is 100% real end-to-end!');
  console.log('User credentials for browser verification:');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log(`Token: ${token}`);
}

runVerification().catch((err) => {
  console.error('Verification error:', err.response?.data || err.message);
  process.exit(1);
});
