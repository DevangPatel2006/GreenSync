/**
 * Impact Aggregator Service (Pure Domain Functions)
 * 
 * Aggregates user-level and system-wide environmental and reward metrics
 * from schedule and reward transaction arrays.
 * 
 * DESIGN RULE: Pure in-memory reduction over passed arrays — zero database or network dependencies.
 */

/**
 * Computes individual user impact summary by aggregating schedules and reward transactions.
 * 
 * @param {Array<object>} [schedules=[]] - Array of user's schedule objects
 * @param {Array<object>} [rewardTransactions=[]] - Array of user's reward transaction objects
 * @returns {{
 *   totalEnergyShifted: number,
 *   avgRenewableUtilization: number,
 *   totalPeakReduction: number,
 *   totalCo2Avoided: number,
 *   totalFlexCoins: number
 * }}
 */
function computeUserImpactSummary(schedules = [], rewardTransactions = []) {
  const schedList = Array.isArray(schedules) ? schedules : [];
  const txList = Array.isArray(rewardTransactions) ? rewardTransactions : [];

  let sumEnergy = 0;
  let sumRenewable = 0;
  let sumPeak = 0;
  let sumCo2 = 0;
  let sumScheduleCoins = 0;

  for (let i = 0; i < schedList.length; i += 1) {
    const s = schedList[i] || {};
    sumEnergy += (Number(s.energyShifted) || 0);
    sumRenewable += (Number(s.renewableUtilization) || 0);
    sumPeak += (Number(s.peakReduction) || 0);
    sumCo2 += (Number(s.co2Avoided) || 0);

    const coins = s.flexCoinsEarned !== undefined ? s.flexCoinsEarned : (s.flexCoins || 0);
    sumScheduleCoins += (Number(coins) || 0);
  }

  // Derive total coins: prefer sum from reward transactions if provided, else fallback to schedule documents
  let totalFlexCoins = 0;
  if (txList.length > 0) {
    totalFlexCoins = txList.reduce((acc, tx) => {
      const item = tx || {};
      const amt = item.amount !== undefined ? item.amount : (item.coins !== undefined ? item.coins : (item.flexCoins || 0));
      return acc + (Number(amt) || 0);
    }, 0);
  } else {
    totalFlexCoins = sumScheduleCoins;
  }

  const count = schedList.length;
  const avgRenewable = count > 0 ? sumRenewable / count : 0;

  return {
    totalEnergyShifted: Math.round(sumEnergy * 100) / 100,
    avgRenewableUtilization: Math.round(avgRenewable * 100) / 100,
    totalPeakReduction: Math.round(sumPeak * 100) / 100,
    totalCo2Avoided: Math.round(sumCo2 * 10000) / 10000,
    totalFlexCoins: Math.round(totalFlexCoins),
  };
}

/**
 * Computes administrative overview metrics across all schedules and users.
 * 
 * @param {Array<object>} [allSchedules=[]] - Array of all schedules across the platform
 * @param {Array<object>} [allUsers=[]] - Array of all platform users
 * @returns {{
 *   totalFlexibleLoad: number,
 *   totalEnergyShifted: number,
 *   avgRenewableUtilization: number,
 *   totalPeakReduction: number,
 *   activeUserCount: number,
 *   totalFlexCoinsIssued: number
 * }}
 */
function computeAdminImpactSummary(allSchedules = [], allUsers = []) {
  const schedList = Array.isArray(allSchedules) ? allSchedules : [];
  const userList = Array.isArray(allUsers) ? allUsers : [];

  let sumEnergy = 0;
  let sumRenewable = 0;
  let sumPeak = 0;
  let sumCoins = 0;

  for (let i = 0; i < schedList.length; i += 1) {
    const s = schedList[i] || {};
    sumEnergy += (Number(s.energyShifted) || 0);
    sumRenewable += (Number(s.renewableUtilization) || 0);
    sumPeak += (Number(s.peakReduction) || 0);

    const coins = s.flexCoinsEarned !== undefined ? s.flexCoinsEarned : (s.flexCoins || 0);
    sumCoins += (Number(coins) || 0);
  }

  const count = schedList.length;
  const avgRenewable = count > 0 ? sumRenewable / count : 0;

  // Active user count calculation:
  // If userList has items with explicit `status`, count those where status === 'active'.
  // If userList items don't specify status, count all user entries.
  // If userList is empty, count unique userIds in allSchedules.
  let activeUserCount = 0;
  if (userList.length > 0) {
    const hasStatusProperty = userList.some((u) => u && u.status !== undefined);
    if (hasStatusProperty) {
      activeUserCount = userList.filter((u) => u && u.status === 'active').length;
    } else {
      activeUserCount = userList.length;
    }
  } else if (schedList.length > 0) {
    const distinctUsers = new Set(
      schedList.map((s) => (s.userId ? s.userId.toString() : null)).filter(Boolean)
    );
    activeUserCount = distinctUsers.size;
  }

  return {
    totalFlexibleLoad: Math.round(sumEnergy * 100) / 100,
    totalEnergyShifted: Math.round(sumEnergy * 100) / 100,
    avgRenewableUtilization: Math.round(avgRenewable * 100) / 100,
    totalPeakReduction: Math.round(sumPeak * 100) / 100,
    activeUserCount,
    totalFlexCoinsIssued: Math.round(sumCoins),
  };
}

module.exports = {
  computeUserImpactSummary,
  computeAdminImpactSummary,
};
