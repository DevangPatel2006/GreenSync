const assert = require('assert');
const rewardsConfig = require('./src/config/rewardsConfig');
const { normalize } = require('./src/services/rewards/normalizeModel');
const { deriveWasScarceWindow } = require('./src/services/rewards/scarcityModel');
const {
  calculateFlexCoins,
  classifyImpactType,
  buildRewardExplanation,
} = require('./src/services/rewards/flexCoinEngine');
const {
  computeUserImpactSummary,
  computeAdminImpactSummary,
} = require('./src/services/rewards/impactAggregator');

console.log('=== TEST SUITE: PURE FLEXCOIN & IMPACT ENGINE (Phase 6 Part 1) ===\n');

// -------------------------------------------------------------
// Test Case 1: Correct FlexCoins generated for a high-renewable, high-peak-reduction schedule
// -------------------------------------------------------------
{
  const schedule = {
    renewableUtilization: 90, // 90 * 0.4 = 36 pts
    peakReduction: 40,        // 40 * 0.3 = 12 pts
    energyShifted: 25,        // (25 / 50) * 100 = 50% -> 50 * 0.15 = 7.5 pts
  };

  const device = {
    flexibility: 'high',      // 100 * 0.1 = 10 pts
  };

  // Scarcity check: 90 >= 75 and 40 >= 20 -> wasScarceWindow = true -> 5 pts
  // Expected total = 36 + 12 + 7.5 + 10 + 5 = 70.5 -> Math.round = 71 coins
  const result = calculateFlexCoins(schedule, device, rewardsConfig);

  assert.strictEqual(result.wasScarceWindow, true, 'Window should be flagged as scarce');
  assert.strictEqual(result.breakdown.renewablePoints, 36);
  assert.strictEqual(result.breakdown.peakPoints, 12);
  assert.strictEqual(result.breakdown.shiftPoints, 7.5);
  assert.strictEqual(result.breakdown.flexibilityBonus, 10);
  assert.strictEqual(result.breakdown.urgencyBonus, 5);
  assert.strictEqual(result.coins, 71, `Expected 71 coins, received ${result.coins}`);
  console.log(`PASS: 1. Correct FlexCoins (${result.coins}) generated for high-renewable, high-peak schedule`);
}

// -------------------------------------------------------------
// Test Case 2: Coins never exceed theoretical max derived from config
// -------------------------------------------------------------
{
  // Pathological maximum schedule (100% across all dimensions)
  const maxSchedule = {
    renewableUtilization: 100, // 40 pts
    peakReduction: 100,        // 30 pts
    energyShifted: 1000,       // Clamped to 100% -> 15 pts
  };

  const maxDevice = {
    flexibility: 'high',       // 10 pts
  };

  const result = calculateFlexCoins(maxSchedule, maxDevice, rewardsConfig);
  assert(
    result.coins <= rewardsConfig.theoreticalMaxCoins,
    `Coins (${result.coins}) exceeded theoretical max (${rewardsConfig.theoreticalMaxCoins})`
  );
  assert.strictEqual(result.coins, 100, 'Max schedule should hit theoretical ceiling of 100 coins');
  console.log(`PASS: 2. Coins capped at theoretical max (${result.coins} / ${rewardsConfig.theoreticalMaxCoins})`);
}

// -------------------------------------------------------------
// Test Case 3: Low flex + non-scarce window yields lower score than high flex + scarce window
// -------------------------------------------------------------
{
  const baseSchedule = {
    renewableUtilization: 70, // Below 75 threshold -> non-scarce
    peakReduction: 15,        // Below 20 threshold -> non-scarce
    energyShifted: 10,
  };

  const lowFlexDevice = { flexibility: 'low' };
  const lowResult = calculateFlexCoins(baseSchedule, lowFlexDevice, rewardsConfig);

  const scarceSchedule = {
    renewableUtilization: 85, // Above threshold
    peakReduction: 25,        // Above threshold
    energyShifted: 10,
  };

  const highFlexDevice = { flexibility: 'high' };
  const highResult = calculateFlexCoins(scarceSchedule, highFlexDevice, rewardsConfig);

  assert(
    lowResult.coins < highResult.coins,
    `Expected lowResult.coins (${lowResult.coins}) < highResult.coins (${highResult.coins})`
  );
  assert.strictEqual(lowResult.wasScarceWindow, false, 'lowResult should not be scarce');
  assert.strictEqual(highResult.wasScarceWindow, true, 'highResult should be scarce');
  console.log(`PASS: 3. Low flex/non-scarce (${lowResult.coins}) < High flex/scarce (${highResult.coins})`);
}

// -------------------------------------------------------------
// Test Case 4: deriveWasScarceWindow correctly flags based on threshold boundaries
// -------------------------------------------------------------
{
  const { scarcityRenewableThreshold, scarcityPeakThreshold } = rewardsConfig;

  // Exact boundary condition (both meet threshold)
  assert.strictEqual(
    deriveWasScarceWindow(
      { renewableUtilization: scarcityRenewableThreshold, peakReduction: scarcityPeakThreshold },
      rewardsConfig
    ),
    true,
    'Exact boundary should evaluate to true'
  );

  // Above boundary
  assert.strictEqual(
    deriveWasScarceWindow(
      { renewableUtilization: scarcityRenewableThreshold + 5, peakReduction: scarcityPeakThreshold + 5 },
      rewardsConfig
    ),
    true,
    'Above boundary should evaluate to true'
  );

  // Renewable strictly below threshold
  assert.strictEqual(
    deriveWasScarceWindow(
      { renewableUtilization: scarcityRenewableThreshold - 0.1, peakReduction: scarcityPeakThreshold },
      rewardsConfig
    ),
    false,
    'Sub-threshold renewable must evaluate to false'
  );

  // Peak reduction strictly below threshold
  assert.strictEqual(
    deriveWasScarceWindow(
      { renewableUtilization: scarcityRenewableThreshold, peakReduction: scarcityPeakThreshold - 0.1 },
      rewardsConfig
    ),
    false,
    'Sub-threshold peak reduction must evaluate to false'
  );

  // Null/undefined safety
  assert.strictEqual(deriveWasScarceWindow(null, rewardsConfig), false, 'Null schedule must return false');
  assert.strictEqual(deriveWasScarceWindow({}, rewardsConfig), false, 'Empty schedule must return false');

  console.log('PASS: 4. deriveWasScarceWindow correctly enforces exact threshold boundaries');
}

// -------------------------------------------------------------
// Test Case 5: classifyImpactType picks correct dominant category across 3 breakdowns
// -------------------------------------------------------------
{
  // Breakdown A: Renewable dominates
  const breakdownRenewable = {
    renewablePoints: 36,
    peakPoints: 12,
    shiftPoints: 7.5,
    flexibilityBonus: 6.5,
    urgencyBonus: 5, // total bonus = 11.5
  };
  assert.strictEqual(
    classifyImpactType(breakdownRenewable),
    'renewable',
    'Breakdown A must classify as renewable'
  );

  // Breakdown B: Peak reduction dominates
  const breakdownPeak = {
    renewablePoints: 10,
    peakPoints: 28,
    shiftPoints: 5,
    flexibilityBonus: 3,
    urgencyBonus: 0, // total bonus = 3
  };
  assert.strictEqual(
    classifyImpactType(breakdownPeak),
    'peak_reduction',
    'Breakdown B must classify as peak_reduction'
  );

  // Breakdown C: Bonus dominates (low renewable, low peak, high flexibility + urgency)
  const breakdownBonus = {
    renewablePoints: 4,
    peakPoints: 5,
    shiftPoints: 2,
    flexibilityBonus: 10,
    urgencyBonus: 5, // total bonus = 15 > 5 > 4
  };
  assert.strictEqual(
    classifyImpactType(breakdownBonus),
    'bonus',
    'Breakdown C must classify as bonus'
  );

  console.log('PASS: 5. classifyImpactType correctly resolves dominant category across 3 distinct breakdowns');
}

// -------------------------------------------------------------
// Test Case 6: normalize() clamps correctly above/below configured max
// -------------------------------------------------------------
{
  const maxKwh = rewardsConfig.maxExpectedEnergyShiftKwh; // 50.0

  // 50% midpoint
  assert.strictEqual(normalize(maxKwh / 2, rewardsConfig), 50, 'Midpoint should normalize to 50');

  // Exact ceiling
  assert.strictEqual(normalize(maxKwh, rewardsConfig), 100, 'Exact cap should normalize to 100');

  // Clamped above ceiling (e.g. 150 kWh when cap is 50 kWh)
  assert.strictEqual(normalize(maxKwh * 3, rewardsConfig), 100, 'Excess shift must clamp to 100');

  // Clamped below zero
  assert.strictEqual(normalize(-10, rewardsConfig), 0, 'Negative value must clamp to 0');
  assert.strictEqual(normalize(0, rewardsConfig), 0, 'Zero must normalize to 0');
  assert.strictEqual(normalize(null, rewardsConfig), 0, 'Null must normalize to 0');

  console.log(`PASS: 6. normalize() correctly scales and clamps values within [0, 100] (cap: ${maxKwh} kWh)`);
}

// -------------------------------------------------------------
// Test Case 7: computeUserImpactSummary & computeAdminImpactSummary produce correct sums/averages
// -------------------------------------------------------------
{
  const fixtureSchedules = [
    {
      userId: 'user_1',
      energyShifted: 10.0,
      renewableUtilization: 80.0,
      peakReduction: 20.0,
      co2Avoided: 3.2,
      flexCoinsEarned: 50,
    },
    {
      userId: 'user_1',
      energyShifted: 20.0,
      renewableUtilization: 60.0,
      peakReduction: 30.0,
      co2Avoided: 4.8,
      flexCoinsEarned: 60,
    },
  ];

  const fixtureTransactions = [
    { amount: 50 },
    { amount: 60 },
  ];

  const userSummary = computeUserImpactSummary(fixtureSchedules, fixtureTransactions);
  assert.strictEqual(userSummary.totalEnergyShifted, 30.0);
  assert.strictEqual(userSummary.avgRenewableUtilization, 70.0);
  assert.strictEqual(userSummary.totalPeakReduction, 50.0);
  assert.strictEqual(userSummary.totalCo2Avoided, 8.0);
  assert.strictEqual(userSummary.totalFlexCoins, 110);

  // Zero-schedules edge case (guards against division by zero)
  const emptyUserSummary = computeUserImpactSummary([], []);
  assert.strictEqual(emptyUserSummary.totalEnergyShifted, 0);
  assert.strictEqual(emptyUserSummary.avgRenewableUtilization, 0);
  assert.strictEqual(emptyUserSummary.totalPeakReduction, 0);
  assert.strictEqual(emptyUserSummary.totalCo2Avoided, 0);
  assert.strictEqual(emptyUserSummary.totalFlexCoins, 0);

  // Admin summary with mock user accounts
  const fixtureUsers = [
    { id: 'user_1', status: 'active' },
    { id: 'user_2', status: 'active' },
    { id: 'user_3', status: 'inactive' },
  ];

  const adminSummary = computeAdminImpactSummary(fixtureSchedules, fixtureUsers);
  assert.strictEqual(adminSummary.totalFlexibleLoad, 30.0);
  assert.strictEqual(adminSummary.totalEnergyShifted, 30.0);
  assert.strictEqual(adminSummary.avgRenewableUtilization, 70.0);
  assert.strictEqual(adminSummary.totalPeakReduction, 50.0);
  assert.strictEqual(adminSummary.activeUserCount, 2, 'Should count only active users (2 of 3)');
  assert.strictEqual(adminSummary.totalFlexCoinsIssued, 110);

  // Admin summary empty edge case
  const emptyAdminSummary = computeAdminImpactSummary([], []);
  assert.strictEqual(emptyAdminSummary.totalFlexibleLoad, 0);
  assert.strictEqual(emptyAdminSummary.totalEnergyShifted, 0);
  assert.strictEqual(emptyAdminSummary.avgRenewableUtilization, 0);
  assert.strictEqual(emptyAdminSummary.totalPeakReduction, 0);
  assert.strictEqual(emptyAdminSummary.activeUserCount, 0);
  assert.strictEqual(emptyAdminSummary.totalFlexCoinsIssued, 0);

  console.log('PASS: 7. computeUserImpactSummary and computeAdminImpactSummary aggregate accurately (including zero edge cases)');
}

// -------------------------------------------------------------
// Test Case 8: buildRewardExplanation frames FlexCoins as "Impact Simulation" (Handbook Section 6)
// -------------------------------------------------------------
{
  const schedule = {
    renewableUtilization: 90,
    peakReduction: 40,
    energyShifted: 14.4,
  };
  const breakdown = {
    renewablePoints: 36,
    peakPoints: 12,
    shiftPoints: 4.3,
    flexibilityBonus: 6.5,
    urgencyBonus: 5,
  };
  const explanation = buildRewardExplanation(schedule, breakdown, 64);

  assert(typeof explanation === 'string' && explanation.length > 20, 'Explanation must be a valid string');
  assert(explanation.includes('Impact Simulation'), 'Must explicitly mention "Impact Simulation"');
  assert(!explanation.toLowerCase().includes('donated'), 'Must never imply money/donation was donated');
  assert(!explanation.toLowerCase().includes('ngo'), 'Must never mention NGO donation');

  console.log(`PASS: 8. buildRewardExplanation satisfies Handbook Section 6 compliance:\n   "${explanation}"`);
}

console.log('\n=== ALL 8 SECTION 27 REWARDS TESTS PASSED! ===\n');
