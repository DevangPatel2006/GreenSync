const defaultRewardsConfig = require('../../config/rewardsConfig');

/**
 * Derives whether an execution window occurred during a critical grid scarcity window.
 * 
 * ARCHITECTURAL DESIGN NOTE (Handbook Section 13):
 * Schedule and RewardTransaction schemas are FROZEN. Do not add fields to either model.
 * There is no `wasScarceWindow` persisted column on Schedule — this pure function derives it
 * on-the-fly from renewableUtilization and peakReduction crossing configurable thresholds.
 * 
 * Condition:
 *   schedule.renewableUtilization >= config.scarcityRenewableThreshold AND
 *   schedule.peakReduction >= config.scarcityPeakThreshold
 * 
 * @param {object} schedule - Schedule entity or calculation payload
 * @param {number} schedule.renewableUtilization - Percentage 0-100
 * @param {number} schedule.peakReduction - Percentage 0-100
 * @param {typeof defaultRewardsConfig} [config=defaultRewardsConfig] - Rewards configuration
 * @returns {boolean} True if both renewable and peak reduction meet or exceed scarcity thresholds
 */
function deriveWasScarceWindow(schedule, config = defaultRewardsConfig) {
  if (!schedule || typeof schedule !== 'object') {
    return false;
  }

  const renThreshold = (config && typeof config.scarcityRenewableThreshold === 'number')
    ? config.scarcityRenewableThreshold
    : defaultRewardsConfig.scarcityRenewableThreshold;

  const peakThreshold = (config && typeof config.scarcityPeakThreshold === 'number')
    ? config.scarcityPeakThreshold
    : defaultRewardsConfig.scarcityPeakThreshold;

  const ren = Number(schedule.renewableUtilization);
  const peak = Number(schedule.peakReduction);

  if (Number.isNaN(ren) || Number.isNaN(peak)) {
    return false;
  }

  return ren >= renThreshold && peak >= peakThreshold;
}

module.exports = {
  deriveWasScarceWindow,
};
