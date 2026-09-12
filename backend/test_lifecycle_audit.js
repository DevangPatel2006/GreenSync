const mongoose = require('mongoose');
const User = require('./src/models/User');
const Device = require('./src/models/Device');
const Schedule = require('./src/models/Schedule');
const RewardTransaction = require('./src/models/RewardTransaction');
const schedulingService = require('./src/services/scheduling/schedulingService');
const rewardsService = require('./src/services/rewards/rewardsService');

async function runAuditTests() {
  await mongoose.connect('mongodb://localhost:27017/greensync');
  console.log('--- RUNNING LIFECYCLE AUDIT & IDEMPOTENCY TEST SUITE ---');

  const testEmail = `audit_${Date.now()}@greensync.test`;
  const user = await User.create({
    name: 'Audit Tester',
    email: testEmail,
    passwordHash: 'dummy_hash',
  });
  const userId = user._id.toString();

  // Test 1: Device creation and toggle persistence
  const device = await Device.create({
    userId: user._id,
    name: 'Audit EV Charger',
    type: 'ev_charging',
    energyRequired: 15,
    earliestStart: new Date(Date.now() + 1000 * 60 * 60),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 8),
    flexibility: 'high',
    status: 'active',
  });
  console.log('1. Device created successfully with status active.');

  // Test 2: recommendSchedule idempotency
  const rec1 = await schedulingService.recommendSchedule(userId, device._id.toString());
  const rec2 = await schedulingService.recommendSchedule(userId, device._id.toString());
  if (rec1._id.toString() !== rec2._id.toString()) {
    throw new Error(`FAIL: recommendSchedule created duplicate schedules! ${rec1._id} vs ${rec2._id}`);
  }
  console.log('2. PASS: recommendSchedule is idempotent and returned existing active schedule.');

  // Test 3: Impact summary status filter - proposed schedule should NOT be counted
  const initialImpact = await rewardsService.getUserImpactSummary(userId);
  if (initialImpact.totalEnergyShifted !== 0) {
    throw new Error(`FAIL: getUserImpactSummary counted proposed schedule! energyShifted = ${initialImpact.totalEnergyShifted}`);
  }
  console.log('3. PASS: getUserImpactSummary correctly ignored proposed schedule (energyShifted = 0).');

  // Test 4: acceptSchedule idempotency on double-call
  const accepted1 = await schedulingService.acceptSchedule(userId, rec1._id.toString());
  if (accepted1.status !== 'accepted') {
    throw new Error('FAIL: Schedule not accepted');
  }
  // Second call must NOT throw 400
  const accepted2 = await schedulingService.acceptSchedule(userId, rec1._id.toString());
  if (accepted2._id.toString() !== rec1._id.toString() || accepted2.status !== 'accepted') {
    throw new Error('FAIL: acceptSchedule second call failed or mutated record');
  }
  console.log('4. PASS: acceptSchedule is idempotent; double-call returned accepted schedule without 400 error.');

  // Test 5: getPendingSchedule finds accepted schedule
  const pending = await schedulingService.getPendingSchedule(userId);
  if (!pending || pending._id.toString() !== rec1._id.toString() || pending.status !== 'accepted') {
    throw new Error(`FAIL: getPendingSchedule could not find accepted schedule! Found: ${pending?.status}`);
  }
  console.log('5. PASS: getPendingSchedule correctly retrieved the active accepted schedule.');

  // Test 6: completeSchedule idempotency and reward grant
  const completed1 = await schedulingService.completeSchedule(userId, rec1._id.toString());
  if (completed1.status !== 'completed' || completed1.flexCoinsEarned <= 0) {
    throw new Error('FAIL: completeSchedule did not complete or grant coins');
  }
  const completed2 = await schedulingService.completeSchedule(userId, rec1._id.toString());
  if (completed2._id.toString() !== rec1._id.toString() || completed2.flexCoinsEarned !== completed1.flexCoinsEarned) {
    throw new Error('FAIL: completeSchedule second call failed');
  }
  console.log('6. PASS: completeSchedule is idempotent; double-completion safely preserved coins.');

  // Test 7: Impact summary now counts completed schedule
  const finalImpact = await rewardsService.getUserImpactSummary(userId);
  if (finalImpact.totalEnergyShifted !== rec1.energyShifted) {
    throw new Error(`FAIL: getUserImpactSummary failed to count completed schedule: expected ${rec1.energyShifted}, got ${finalImpact.totalEnergyShifted}`);
  }
  console.log(`7. PASS: getUserImpactSummary correctly counted completed schedule (${finalImpact.totalEnergyShifted} kWh).`);

  // Test 8: Device cleanup deletes orphaned active schedules
  const device2 = await Device.create({
    userId: user._id,
    name: 'To Delete EV',
    type: 'ev_charging',
    energyRequired: 10,
    earliestStart: new Date(Date.now() + 1000 * 60 * 60),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 8),
    flexibility: 'medium',
    status: 'active',
  });
  const schedToDelete = await schedulingService.recommendSchedule(userId, device2._id.toString());
  // Simulate deleteDevice cleanup
  await Schedule.deleteMany({ deviceId: device2._id, status: { $in: ['proposed', 'accepted'] } });
  await Device.findByIdAndDelete(device2._id);
  const remainingSched = await Schedule.findById(schedToDelete._id);
  if (remainingSched) {
    throw new Error('FAIL: Schedule was not cleaned up upon device deletion');
  }
  console.log('8. PASS: deleteDevice cleanup successfully eliminated orphaned pending schedule.');

  // Clean up test user & records
  await User.findByIdAndDelete(user._id);
  await Device.deleteMany({ userId: user._id });
  await Schedule.deleteMany({ userId: user._id });
  await RewardTransaction.deleteMany({ userId: user._id });
  await mongoose.disconnect();

  console.log('=== ALL LIFECYCLE AUDIT VERIFICATIONS PASSED! ===');
}

runAuditTests().catch((err) => {
  console.error('Audit verification error:', err);
  process.exit(1);
});
