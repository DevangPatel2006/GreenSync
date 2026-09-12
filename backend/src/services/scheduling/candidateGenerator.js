/**
 * Candidate Window Generator
 * 
 * Slices discrete time slots into candidate scheduling windows of contiguous execution
 * matching the required device duration.
 */

/**
 * Generates all valid, contiguous candidate execution windows from an array of time slots.
 * 
 * @param {Array<{
 *   start: Date|string,
 *   end: Date|string,
 *   renewableAvailability: number,
 *   gridDemand: number,
 *   price?: number|null,
 *   source: string
 * }>} timeSlots - Array of discrete evaluation slots
 * @param {number} requiredDurationMinutes - Total continuous run time required in minutes
 * @param {number} [slotMinutes=30] - Duration of a single slot in minutes
 * @returns {Array<{
 *   start: Date,
 *   end: Date,
 *   avgRenewableAvailability: number,
 *   avgGridDemand: number,
 *   avgPrice: number|null,
 *   source: string,
 *   slots: Array<object>
 * }>} List of candidate execution windows
 */
function generateCandidateWindows(timeSlots, requiredDurationMinutes, slotMinutes = 30) {
  if (!Array.isArray(timeSlots) || timeSlots.length === 0 || requiredDurationMinutes <= 0) {
    return [];
  }

  // Normalize slot dates and sort chronologically by start timestamp
  const sortedSlots = timeSlots
    .map((s) => ({
      ...s,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const candidates = [];

  // Slide across slots to find all contiguous combinations satisfying requiredDurationMinutes
  for (let i = 0; i < sortedSlots.length; i += 1) {
    const currentRun = [sortedSlots[i]];
    let totalMinutes = (sortedSlots[i].end.getTime() - sortedSlots[i].start.getTime()) / (60 * 1000);

    // If a single slot already fulfills or exceeds required duration
    if (totalMinutes >= requiredDurationMinutes) {
      candidates.push(_buildCandidateWindow(currentRun));
      continue;
    }

    // Accumulate consecutive adjacent slots
    for (let j = i + 1; j < sortedSlots.length; j += 1) {
      const prevSlot = sortedSlots[j - 1];
      const nextSlot = sortedSlots[j];

      // Contiguity check: next slot start must exactly match previous slot end
      if (nextSlot.start.getTime() !== prevSlot.end.getTime()) {
        break; // Gap detected; cannot span across discontinuous slots
      }

      currentRun.push(nextSlot);
      totalMinutes += (nextSlot.end.getTime() - nextSlot.start.getTime()) / (60 * 1000);

      if (totalMinutes >= requiredDurationMinutes) {
        candidates.push(_buildCandidateWindow(currentRun));
        break; // Reached minimal contiguous span satisfying duration for starting index i
      }
    }
  }

  return candidates;
}

/**
 * Aggregates a contiguous sequence of slots into a candidate window with averaged metrics.
 * 
 * @private
 * @param {Array<object>} run - Contiguous list of slots
 * @returns {object} Aggregated candidate window
 */
function _buildCandidateWindow(run) {
  const count = run.length;
  let sumRenewable = 0;
  let sumDemand = 0;
  let sumPrice = 0;
  let priceCount = 0;

  for (let k = 0; k < count; k += 1) {
    const slot = run[k];
    sumRenewable += (typeof slot.renewableAvailability === 'number' ? slot.renewableAvailability : 0);
    sumDemand += (typeof slot.gridDemand === 'number' ? slot.gridDemand : 0);

    if (typeof slot.price === 'number' && !Number.isNaN(slot.price)) {
      sumPrice += slot.price;
      priceCount += 1;
    }
  }

  const avgRenewable = Math.round((sumRenewable / count) * 100) / 100;
  const avgDemand = Math.round((sumDemand / count) * 100) / 100;
  const avgPrice = priceCount > 0 ? Math.round((sumPrice / priceCount) * 10000) / 10000 : null;

  return {
    start: run[0].start,
    end: run[count - 1].end,
    avgRenewableAvailability: avgRenewable,
    avgGridDemand: avgDemand,
    avgPrice,
    source: run[0].source || 'simulated',
    slots: run,
  };
}

module.exports = {
  generateCandidateWindows,
};
