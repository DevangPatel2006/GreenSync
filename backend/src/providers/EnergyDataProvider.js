/**
 * EnergyDataProvider Base Class
 * 
 * Defines the strict provider interface contract per Team Handbook Section 16/17
 * and Hard Rule 7. Concrete implementations (e.g. LiveEnergyProvider, SimulatedEnergyProvider)
 * must implement all three abstract methods.
 * 
 * Direct invocations or missing overrides throw an explicit Error during execution
 * to fail loudly during development.
 */
class EnergyDataProvider {
  /**
   * Retrieves the current, real-time energy conditions.
   * 
   * @returns {Promise<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live' | 'simulated'
   * }>} Point-in-time condition reading
   * @throws {Error} If not implemented by the inheriting subclass
   */
  async getCurrentConditions() {
    throw new Error('Not implemented: EnergyDataProvider.getCurrentConditions() must be implemented by subclass');
  }

  /**
   * Retrieves forward-looking energy forecasts for a given horizon starting from the present.
   * 
   * @param {number} hours - Number of forecast hours to project into the future
   * @returns {Promise<Array<{
   *   timestamp: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live' | 'simulated'
   * }>>} Chronological array of forecasted hourly conditions
   * @throws {Error} If not implemented by the inheriting subclass
   */
  async getForecast(hours) {
    throw new Error('Not implemented: EnergyDataProvider.getForecast(hours) must be implemented by subclass');
  }

  /**
   * Discretizes a given time window into fixed-length slots and evaluates conditions at each slot's midpoint.
   * Directly consumed by Phase 5 Scheduling Engine for candidate window scoring.
   * 
   * @param {Date} windowStart - Start timestamp of the evaluation window
   * @param {Date} windowEnd - End timestamp of the evaluation window
   * @param {number} slotMinutes - Slot duration in minutes (e.g. 15, 30, 60)
   * @returns {Promise<Array<{
   *   start: Date,
   *   end: Date,
   *   renewableAvailability: number,
   *   gridDemand: number,
   *   price?: number,
   *   source: 'live' | 'simulated'
   * }>>} List of discrete evaluation time slots with projected conditions
   * @throws {Error} If not implemented by the inheriting subclass
   */
  async getTimeSlots(windowStart, windowEnd, slotMinutes) {
    throw new Error('Not implemented: EnergyDataProvider.getTimeSlots(windowStart, windowEnd, slotMinutes) must be implemented by subclass');
  }
}

module.exports = EnergyDataProvider;
