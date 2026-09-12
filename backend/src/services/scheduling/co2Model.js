const defaultSchedulingConfig = require('../../config/schedulingConfig');

/**
 * Estimates the greenhouse gas emissions (in kg CO2) avoided by shifting device consumption
 * into a window with higher renewable energy availability compared to average grid mix.
 * 
 * Formula:
 *   co2AvoidedKg = energyShifted (kWh) * (renewableUtilization / 100) * gridCarbonIntensity (kg CO2/kWh)
 * 
 * Scaled dynamically to the actual energy requirements and renewable availability of each schedule recommendation.
 * 
 * @param {number} energyShifted - Electrical energy consumed during window in kWh
 * @param {number} renewableUtilizationPercent - Renewable energy availability percentage (0 - 100)
 * @param {typeof defaultSchedulingConfig} [config=defaultSchedulingConfig] - Scheduling configuration
 * @returns {number} Estimated avoided CO2 emissions in kg rounded to 4 decimal places
 */
function estimateCo2AvoidedKg(
  energyShifted,
  renewableUtilizationPercent,
  config = defaultSchedulingConfig
) {
  const energyKwh = Math.max(0, Number(energyShifted) || 0);
  const renewableRatio = Math.max(0, Math.min(1, (Number(renewableUtilizationPercent) || 0) / 100));
  const intensity =
    (config && typeof config.gridCarbonIntensityKgPerKwh === 'number')
      ? config.gridCarbonIntensityKgPerKwh
      : defaultSchedulingConfig.gridCarbonIntensityKgPerKwh;

  const co2Avoided = energyKwh * renewableRatio * intensity;
  return Math.round(co2Avoided * 10000) / 10000;
}

module.exports = {
  estimateCo2AvoidedKg,
};
