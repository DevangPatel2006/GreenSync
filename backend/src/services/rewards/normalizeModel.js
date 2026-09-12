const defaultRewardsConfig = require('../../config/rewardsConfig');

/**
 * Normalizes an energy shifted quantity (kWh) to a 0-100 scale relative to
 * the configured maximum expected energy shift baseline.
 * 
 * Formula:
 *   normalized = (energyShifted / maxExpectedEnergyShiftKwh) * 100
 *   clamped to [0, 100]
 * 
 * NO HARDCODING RULE:
 * The cap is strictly pulled from config.maxExpectedEnergyShiftKwh.
 * 
 * @param {number} energyShifted - Amount of energy shifted in kWh
 * @param {typeof defaultRewardsConfig} [config=defaultRewardsConfig] - Rewards configuration
 * @returns {number} Normalized value in [0, 100]
 */
function normalize(energyShifted, config = defaultRewardsConfig) {
  const maxKwh = (config && typeof config.maxExpectedEnergyShiftKwh === 'number')
    ? config.maxExpectedEnergyShiftKwh
    : defaultRewardsConfig.maxExpectedEnergyShiftKwh;

  if (!maxKwh || maxKwh <= 0) {
    return 0;
  }

  const rawVal = Number(energyShifted);
  if (Number.isNaN(rawVal) || rawVal <= 0) {
    return 0;
  }

  const percentage = (rawVal / maxKwh) * 100;
  const clamped = Math.max(0, Math.min(100, percentage));
  return Math.round(clamped * 100) / 100;
}

module.exports = {
  normalize,
};
