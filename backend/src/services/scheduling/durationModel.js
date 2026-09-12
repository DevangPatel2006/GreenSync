const defaultSchedulingConfig = require('../../config/schedulingConfig');

/**
 * Computes the required continuous operating duration in minutes for a device.
 * 
 * Formula:
 *   requiredHours = energyRequired (kWh) / powerRating (kW)
 *   requiredMinutes = requiredHours * 60
 * 
 * Rounded UP to the nearest slotSearchGranularityMinutes multiple so the device
 * operates across discrete, complete settlement intervals.
 * 
 * @param {object} device - Device entity with energyRequired and type
 * @param {number} device.energyRequired - Energy required in kWh
 * @param {string} device.type - Device type category (e.g. 'ev_charging', 'washing_machine')
 * @param {typeof defaultSchedulingConfig} [config=defaultSchedulingConfig] - Scheduling configuration
 * @returns {number} Duration in minutes rounded up to slot granularity
 */
function computeRequiredDurationMinutes(device, config = defaultSchedulingConfig) {
  if (!device || typeof device !== 'object') {
    throw new Error('Invalid device object provided to computeRequiredDurationMinutes');
  }

  const powerMap = (config && config.assumedPowerRatingKw) || defaultSchedulingConfig.assumedPowerRatingKw;
  const granularity = (config && config.slotSearchGranularityMinutes) || defaultSchedulingConfig.slotSearchGranularityMinutes;

  // Resolve power rating with fallback to 'other'
  const powerRatingKw = (device.type && powerMap[device.type]) ? powerMap[device.type] : powerMap.other;

  const energyKwh = Math.max(0.1, Number(device.energyRequired) || 1.0);
  const rawHours = energyKwh / powerRatingKw;
  const rawMinutes = rawHours * 60;

  // Round UP to the nearest slot granularity multiple
  const roundedMinutes = Math.ceil(rawMinutes / granularity) * granularity;

  return Math.max(granularity, roundedMinutes);
}

module.exports = {
  computeRequiredDurationMinutes,
};
