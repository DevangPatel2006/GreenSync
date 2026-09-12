/**
 * Scheduling Multi-Objective Scoring Engine
 * 
 * Implements pure, normalized (0 to 1) scoring functions for the 5 objectives
 * defined in Team Handbook Section 17:
 * 1. Renewable availability maximization
 * 2. Grid peak demand reduction
 * 3. Electricity tariff / price minimization
 * 4. Deadline completion buffer / margin
 * 5. Device flexibility positioning suitability
 */

/**
 * 1. Renewable Benefit Score [0, 1]
 * Higher average renewable availability yields higher score.
 * 
 * @param {object} window - Candidate window
 * @param {number} window.avgRenewableAvailability - Average renewable % (0 - 100)
 * @returns {number} Normalized score [0, 1]
 */
function renewableBenefit(window) {
  const renewable = Number(window.avgRenewableAvailability) || 0;
  return Math.max(0, Math.min(1, renewable / 100));
}

/**
 * 2. Peak Reduction Benefit Score [0, 1]
 * Lower average grid demand yields higher score (rewards shifting away from stress peaks).
 * 
 * @param {object} window - Candidate window
 * @param {number} window.avgGridDemand - Average grid demand % (0 - 100)
 * @returns {number} Normalized score [0, 1]
 */
function peakReductionBenefit(window) {
  const demand = Number(window.avgGridDemand) || 0;
  return Math.max(0, Math.min(1, (100 - demand) / 100));
}

/**
 * 3. Price Benefit Score [0, 1]
 * Lower average electricity price yields higher score.
 * Normalized relative to the min/max prices observed across all candidate windows for this evaluation.
 * If prices are unavailable (null/undefined) or uniform, returns a neutral 0.5.
 * 
 * @param {object} window - Candidate window
 * @param {number|null} window.avgPrice - Average price in $/kWh
 * @param {Array<object>} allCandidateWindows - Full set of candidate windows
 * @returns {number} Normalized score [0, 1]
 */
function priceBenefit(window, allCandidateWindows) {
  if (window.avgPrice === null || window.avgPrice === undefined || Number.isNaN(window.avgPrice)) {
    return 0.5; // Neutral score when price is not provided
  }

  if (!Array.isArray(allCandidateWindows) || allCandidateWindows.length === 0) {
    return 0.5;
  }

  const validPrices = allCandidateWindows
    .map((w) => w.avgPrice)
    .filter((p) => typeof p === 'number' && !Number.isNaN(p));

  if (validPrices.length === 0) {
    return 0.5;
  }

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);

  // If all candidate windows share identical price, they benefit equally
  if (Math.abs(maxPrice - minPrice) < 0.00001) {
    return 1.0;
  }

  // Lower price -> closer to 1
  const normalized = (maxPrice - window.avgPrice) / (maxPrice - minPrice);
  return Math.max(0, Math.min(1, normalized));
}

/**
 * 4. Deadline Feasibility Score [0, 1]
 * Rewards scheduling margin between window completion and user deadline.
 * A window finishing comfortably before the deadline scores higher than one finishing at the deadline wire.
 * 
 * @param {object} window - Candidate window
 * @param {Date} window.start - Window start timestamp
 * @param {Date} window.end - Window end timestamp
 * @param {object} device - Device constraints
 * @param {Date|string} device.earliestStart - Earliest start boundary
 * @param {Date|string} device.deadline - Strict completion deadline
 * @returns {number} Normalized score [0, 1]
 */
function deadlineFeasibility(window, device) {
  const earliest = new Date(device.earliestStart).getTime();
  const deadline = new Date(device.deadline).getTime();
  const winStart = new Date(window.start).getTime();
  const winEnd = new Date(window.end).getTime();

  const totalSpan = deadline - earliest;
  const windowDuration = winEnd - winStart;
  const maxPossibleSlack = totalSpan - windowDuration;

  // If the window fills the entire earliestStart-deadline span with zero slack
  if (maxPossibleSlack <= 0) {
    return winEnd <= deadline ? 1.0 : 0.0;
  }

  const actualSlack = deadline - winEnd;
  const ratio = actualSlack / maxPossibleSlack;
  return Math.max(0, Math.min(1, ratio));
}

/**
 * 5. Flexibility Suitability Score [0, 1]
 * Evaluates how appropriately a window's position aligns with the device's operational flexibility:
 * - 'low': Expected to run close to earliest opportunity (penalizes deferral).
 * - 'medium': Tolerates moderate shifting with mild preference for earlier completion.
 * - 'high': Fully unconstrained; free to float to the absolute best renewable window anywhere in span.
 * 
 * @param {object} window - Candidate window
 * @param {object} device - Device constraints
 * @param {string|number} [device.flexibility='medium'] - Flexibility level ('low'|'medium'|'high' or 0-1)
 * @param {Array<object>} allCandidateWindows - Full set of candidate windows
 * @returns {number} Normalized score [0, 1]
 */
function flexibilitySuitability(window, device, allCandidateWindows) {
  if (!Array.isArray(allCandidateWindows) || allCandidateWindows.length <= 1) {
    return 1.0;
  }

  // Sort candidates chronologically to determine sequential positioning
  const sorted = [...allCandidateWindows].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const idx = sorted.findIndex(
    (w) =>
      new Date(w.start).getTime() === new Date(window.start).getTime() &&
      new Date(w.end).getTime() === new Date(window.end).getTime()
  );

  if (idx === -1) {
    return 1.0;
  }

  // Position index normalized: 0.0 (earliest possible window) to 1.0 (latest possible window)
  const pos = idx / (sorted.length - 1);

  // Map flexibility to a numeric factor [0 (low), 0.5 (medium), 1.0 (high)]
  let flexFactor = 0.5;
  if (typeof device.flexibility === 'number') {
    flexFactor = Math.max(0, Math.min(1, device.flexibility));
  } else if (typeof device.flexibility === 'string') {
    const lower = device.flexibility.trim().toLowerCase();
    if (lower === 'low') flexFactor = 0.0;
    else if (lower === 'high') flexFactor = 1.0;
    else flexFactor = 0.5;
  }

  // Formula: low flexibility penalizes deferral (1 - pos); high flexibility yields 1.0 everywhere
  const suitability = 1.0 - (1.0 - flexFactor) * pos;
  return Math.max(0, Math.min(1, suitability));
}

module.exports = {
  renewableBenefit,
  peakReductionBenefit,
  priceBenefit,
  deadlineFeasibility,
  flexibilitySuitability,
};
