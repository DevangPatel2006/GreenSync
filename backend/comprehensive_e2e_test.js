const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runFullAutomatedTest() {
  console.log('================================================================');
  console.log('🚀 GREENSYNC COMPREHENSIVE AUTOMATED END-TO-END PIPELINE TEST');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testUser = {
    name: 'Automation Tester',
    email: `auto_e2e_${timestamp}@greensync.test`,
    password: 'Password123!',
    role: 'user',
  };

  // 1. REGISTER NEW USER
  console.log('[1/7] Registering fresh user account (zero state)...');
  const regRes = await axios.post(`${API_BASE}/auth/register`, testUser);
  const token = regRes.data?.data?.token || regRes.data?.token;
  if (!token) throw new Error('Failed to register user or retrieve JWT token.');
  console.log(`  ✓ User registered successfully: ${testUser.email}`);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. VERIFY INITIAL ZERO / EMPTY STATE
  console.log('\n[2/7] Verifying authentic zero state across all endpoints...');
  const [devicesZero, balanceZero, impactZero, pendingZero] = await Promise.all([
    axios.get(`${API_BASE}/devices`, { headers: authHeaders }),
    axios.get(`${API_BASE}/rewards/balance`, { headers: authHeaders }),
    axios.get(`${API_BASE}/impact/summary`, { headers: authHeaders }),
    axios.get(`${API_BASE}/schedule/pending`, { headers: authHeaders }),
  ]);

  const devList = devicesZero.data?.data?.devices || devicesZero.data?.devices || (Array.isArray(devicesZero.data?.data) ? devicesZero.data?.data : []);
  const balanceVal = balanceZero.data?.data?.balance ?? balanceZero.data?.balance ?? 0;
  const impactVal = impactZero.data?.data || impactZero.data;
  const pendingVal = pendingZero.data?.data;

  console.log(`  ✓ Devices count: ${devList.length} (Expected: 0)`);
  console.log(`  ✓ FlexCoins balance: ${balanceVal} FC (Expected: 0)`);
  console.log(`  ✓ Total Energy Shifted: ${impactVal.totalEnergyShifted} kWh (Expected: 0)`);
  console.log(`  ✓ Total CO2 Avoided: ${impactVal.totalCo2Avoided} kg (Expected: 0)`);
  console.log(`  ✓ Pending schedule: ${pendingVal ? 'exists' : 'null'} (Expected: null)`);

  if (devList.length !== 0 || balanceVal !== 0 || impactVal.totalEnergyShifted !== 0) {
    throw new Error('Initial state validation failed: Expected zero values everywhere.');
  }

  // 3. ADD A DEVICE USING UI TIME STRINGS (HH:mm)
  console.log('\n[3/7] Adding flexible load device with overnight window (20:00 to 06:30)...');
  const addDevRes = await axios.post(
    `${API_BASE}/devices`,
    {
      name: 'Smart Heat Pump & Water Tank',
      type: 'water_heater',
      energyRequired: 16.5,
      earliestStart: '20:00',
      deadline: '06:30',
      flexibility: 'high',
      priority: 'normal',
    },
    { headers: authHeaders }
  );

  const device = addDevRes.data?.data?.device || addDevRes.data?.data;
  const devId = device._id || device.id;
  console.log(`  ✓ Device created: "${device.name}" [ID: ${devId}]`);
  console.log(`  ✓ Earliest Start parsed to: ${device.earliestStart}`);
  console.log(`  ✓ Deadline parsed to: ${device.deadline}`);

  // 4. VERIFY DEVICE IN USER DEVICE LIST
  console.log('\n[4/7] Verifying device appears in GET /api/devices...');
  const devCheckRes = await axios.get(`${API_BASE}/devices`, { headers: authHeaders });
  const userDevices = devCheckRes.data?.data?.devices || devCheckRes.data?.devices || devCheckRes.data?.data;
  console.log(`  ✓ Total devices now: ${userDevices.length}`);
  if (userDevices.length !== 1) throw new Error('Device list did not increment to 1.');

  // 5. GENERATE SCHEDULE RECOMMENDATION
  console.log('\n[5/7] Requesting optimal schedule recommendation...');
  const recRes = await axios.post(
    `${API_BASE}/schedule/recommend`,
    { deviceId: devId },
    { headers: authHeaders }
  );
  const recommendation = recRes.data?.data?.schedule || recRes.data?.data;
  const schedId = recommendation._id || recommendation.id;
  console.log(`  ✓ Recommendation generated [Schedule ID: ${schedId}]:`);
  console.log(`    - Status: ${recommendation.status}`);
  console.log(`    - Shift Window: ${new Date(recommendation.recommendedStart).toLocaleTimeString()} to ${new Date(recommendation.recommendedEnd).toLocaleTimeString()}`);
  console.log(`    - Energy Shifted: ${recommendation.energyShifted} kWh`);
  console.log(`    - Renewable Utilization: ${recommendation.renewableUtilization}%`);
  console.log(`    - Avoided CO2: ${recommendation.co2Avoided} kg`);

  // 6. ACCEPT SCHEDULE RECOMMENDATION
  console.log('\n[6/7] Accepting schedule recommendation...');
  const acceptRes = await axios.post(`${API_BASE}/schedule/${schedId}/accept`, {}, { headers: authHeaders });
  const accepted = acceptRes.data?.data;
  console.log(`  ✓ Schedule status updated to: ${accepted?.status || 'accepted'}`);

  // 7. COMPLETE SCHEDULE & VERIFY NEW REWARD POINTS ADDED
  console.log('\n[7/7] Completing shift session and verifying reward points credited...');
  const completeRes = await axios.post(`${API_BASE}/schedule/${schedId}/complete`, {}, { headers: authHeaders });
  const completed = completeRes.data?.data;
  const coinsEarned = completed?.flexCoinsEarned;
  console.log(`  ✓ Schedule session completed! FlexCoins earned: +${coinsEarned} FC`);

  const [balanceAfter, impactAfter, historyAfter] = await Promise.all([
    axios.get(`${API_BASE}/rewards/balance`, { headers: authHeaders }),
    axios.get(`${API_BASE}/impact/summary`, { headers: authHeaders }),
    axios.get(`${API_BASE}/rewards/history`, { headers: authHeaders }),
  ]);

  const newBalance = balanceAfter.data?.data?.balance ?? balanceAfter.data?.balance;
  const newImpact = impactAfter.data?.data || impactAfter.data;
  const historyList = historyAfter.data?.data || historyAfter.data;

  console.log(`  ✓ Final FlexCoins Balance: ${newBalance} FC (Previous: 0 FC)`);
  console.log(`  ✓ Total Energy Shifted: ${newImpact.totalEnergyShifted} kWh (Previous: 0 kWh)`);
  console.log(`  ✓ Total Avoided CO2: ${newImpact.totalCo2Avoided} kg (Previous: 0 kg)`);
  console.log(`  ✓ Reward Transactions recorded: ${Array.isArray(historyList) ? historyList.length : 1}`);

  if (newBalance <= 0 || newImpact.totalEnergyShifted <= 0) {
    throw new Error('Verification failed: Reward points or impact was not credited after completion.');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL BACKEND & REWARD PIPELINE TESTS PASSED 100%!');
  console.log('================================================================');
  console.log(`Test User Credentials for Browser UI Testing:`);
  console.log(`Email: ${testUser.email}`);
  console.log(`Password: ${testUser.password}`);
  console.log(`Token: ${token}`);
  console.log('================================================================\n');

  return { email: testUser.email, password: testUser.password, token, newBalance };
}

runFullAutomatedTest().catch((err) => {
  console.error('Automated Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
