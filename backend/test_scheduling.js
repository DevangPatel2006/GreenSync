const assert = require('assert');
const schedulingConfig = require('./src/config/schedulingConfig');
const { computeRequiredDurationMinutes } = require('./src/services/scheduling/durationModel');
const { generateCandidateWindows } = require('./src/services/scheduling/candidateGenerator');
const {
  validateSchedulingRequest,
  recommendSchedule,
} = require('./src/services/scheduling/engine');

console.log('=== TEST SUITE: PURE SCHEDULING ENGINE (Phase 5 Part 1) ===\n');

function makeSlot(isoStart, isoEnd, renewable, demand, price = 0.15) {
  return {
    start: new Date(isoStart),
    end: new Date(isoEnd),
    renewableAvailability: renewable,
    gridDemand: demand,
    price,
    source: 'simulated',
  };
}

// -------------------------------------------------------------
// Test Case 1: Valid schedule returned for a feasible device
// -------------------------------------------------------------
{
  const device = {
    type: 'washing_machine', // 1.5 kW
    energyRequired: 3.0,     // 3.0 kWh -> 2 hours = 120 mins
    earliestStart: new Date('2026-09-12T10:00:00Z'),
    deadline: new Date('2026-09-12T14:00:00Z'), // 4 hours window
    status: 'active',
    flexibility: 'medium',
  };

  const slots = [
    makeSlot('2026-09-12T10:00:00Z', '2026-09-12T10:30:00Z', 70, 40),
    makeSlot('2026-09-12T10:30:00Z', '2026-09-12T11:00:00Z', 80, 35),
    makeSlot('2026-09-12T11:00:00Z', '2026-09-12T11:30:00Z', 85, 30),
    makeSlot('2026-09-12T11:30:00Z', '2026-09-12T12:00:00Z', 90, 30),
    makeSlot('2026-09-12T12:00:00Z', '2026-09-12T12:30:00Z', 80, 35),
    makeSlot('2026-09-12T12:30:00Z', '2026-09-12T13:00:00Z', 60, 50),
    makeSlot('2026-09-12T13:00:00Z', '2026-09-12T13:30:00Z', 40, 65),
    makeSlot('2026-09-12T13:30:00Z', '2026-09-12T14:00:00Z', 20, 75),
  ];

  const now = new Date('2026-09-12T09:00:00Z');
  const result = recommendSchedule(device, slots, schedulingConfig, now);
  assert.strictEqual(result.outcome, 'OK', 'Expected outcome OK');
  assert(result.window, 'Window must be present');
  assert(typeof result.score === 'number', 'Score must be a number');
  assert(result.score >= 0 && result.score <= 1, 'Score must be between 0 and 1');
  assert.strictEqual(typeof result.isBestEffort, 'boolean', 'isBestEffort must be boolean');
  assert(result.reason && result.reason.length > 10, 'Reason must be non-empty');
  console.log('PASS: 1. Valid schedule returned for a feasible device');
}

// -------------------------------------------------------------
// Test Case 2: Deadline is never exceeded by the returned window
// -------------------------------------------------------------
{
  const deadline = new Date('2026-09-12T13:00:00Z');
  const device = {
    type: 'water_heater', // 4.0 kW
    energyRequired: 4.0,   // 1 hour = 60 mins
    earliestStart: new Date('2026-09-12T10:00:00Z'),
    deadline: deadline,
    status: 'active',
    flexibility: 'low',
  };

  const slots = [
    makeSlot('2026-09-12T10:00:00Z', '2026-09-12T11:00:00Z', 50, 50),
    makeSlot('2026-09-12T11:00:00Z', '2026-09-12T12:00:00Z', 60, 45),
    makeSlot('2026-09-12T12:00:00Z', '2026-09-12T13:00:00Z', 85, 30),
    makeSlot('2026-09-12T13:00:00Z', '2026-09-12T14:00:00Z', 95, 20), // Outside deadline
  ];

  const now = new Date('2026-09-12T09:00:00Z');
  const result = recommendSchedule(device, slots, schedulingConfig, now);
  assert.strictEqual(result.outcome, 'OK');
  assert(new Date(result.window.end).getTime() <= deadline.getTime(), 'Window end must be <= deadline');
  console.log('PASS: 2. Deadline is never exceeded by the returned window');
}

// -------------------------------------------------------------
// Test Case 3: earliestStart constraint is respected
// -------------------------------------------------------------
{
  const earliestStart = new Date('2026-09-12T11:00:00Z');
  const device = {
    type: 'ev_charging', // 7.2 kW
    energyRequired: 7.2,  // 1 hour = 60 mins
    earliestStart: earliestStart,
    deadline: new Date('2026-09-12T15:00:00Z'),
    status: 'active',
    flexibility: 'high',
  };

  const slots = [
    makeSlot('2026-09-12T09:00:00Z', '2026-09-12T10:00:00Z', 99, 10), // Before earliestStart!
    makeSlot('2026-09-12T10:00:00Z', '2026-09-12T11:00:00Z', 99, 10), // Before earliestStart!
    makeSlot('2026-09-12T11:00:00Z', '2026-09-12T12:00:00Z', 80, 30),
    makeSlot('2026-09-12T12:00:00Z', '2026-09-12T13:00:00Z', 75, 35),
  ];

  const now = new Date('2026-09-12T09:00:00Z');
  const result = recommendSchedule(device, slots, schedulingConfig, now);
  assert.strictEqual(result.outcome, 'OK');
  assert(new Date(result.window.start).getTime() >= earliestStart.getTime(), 'Window start must be >= earliestStart');
  console.log('PASS: 3. earliestStart constraint is respected');
}

// -------------------------------------------------------------
// Test Case 4: deadline in the past -> validateSchedulingRequest rejects it
// -------------------------------------------------------------
{
  const now = new Date('2026-09-12T12:00:00Z');
  const pastDevice = {
    type: 'battery',
    energyRequired: 3.3,
    earliestStart: new Date('2026-09-12T08:00:00Z'),
    deadline: new Date('2026-09-12T10:00:00Z'), // in past relative to now
    status: 'active',
  };

  const validation = validateSchedulingRequest(pastDevice, now);
  assert.strictEqual(validation.valid, false, 'Expected validation failure');
  assert.strictEqual(validation.reason, 'deadline is in the past');

  const engineResult = recommendSchedule(pastDevice, [], schedulingConfig, now);
  assert.strictEqual(engineResult.outcome, 'INVALID_REQUEST');
  assert.strictEqual(engineResult.reason, 'deadline is in the past');
  console.log('PASS: 4. deadline in the past -> validateSchedulingRequest rejects it');
}

// -------------------------------------------------------------
// Test Case 5: Renewable-rich window is preferred over high-grid-demand window
// -------------------------------------------------------------
{
  const device = {
    type: 'water_heater', // 4.0 kW
    energyRequired: 4.0,   // 60 mins duration
    earliestStart: new Date('2026-09-12T10:00:00Z'),
    deadline: new Date('2026-09-12T12:00:00Z'), // 2 hours
    status: 'active',
    flexibility: 'high', // High flexibility ensures position does not penalize later slot
  };

  // Window 1: 10:00-11:00: High grid demand (85%), low renewable (15%), price $0.15
  // Window 2: 11:00-12:00: Low grid demand (25%), high renewable (90%), price $0.15
  const slots = [
    makeSlot('2026-09-12T10:00:00Z', '2026-09-12T11:00:00Z', 15, 85, 0.15),
    makeSlot('2026-09-12T11:00:00Z', '2026-09-12T12:00:00Z', 90, 25, 0.15),
  ];

  const now = new Date('2026-09-12T09:00:00Z');
  const result = recommendSchedule(device, slots, schedulingConfig, now);
  assert.strictEqual(result.outcome, 'OK');
  assert.strictEqual(
    new Date(result.window.start).toISOString(),
    '2026-09-12T11:00:00.000Z',
    'Must select the 11:00-12:00 renewable-rich, low-demand window'
  );
  assert.strictEqual(result.window.avgRenewableAvailability, 90);
  assert.strictEqual(result.window.avgGridDemand, 25);
  console.log('PASS: 5. Renewable-rich window is preferred over high-grid-demand window');
}

// -------------------------------------------------------------
// Test Case 6: Fallback/best-effort triggers when no candidate clears minIdealScore
// -------------------------------------------------------------
{
  const device = {
    type: 'washing_machine', // 1.5 kW
    energyRequired: 1.5,     // 60 mins
    earliestStart: new Date('2026-09-12T20:00:00Z'),
    deadline: new Date('2026-09-12T21:00:00Z'), // Exactly 1 hour
    status: 'active',
    flexibility: 'low',
  };

  // Unfavorable conditions: 0% renewable, 95% demand, finish at deadline wire (0 slack)
  const slots = [
    makeSlot('2026-09-12T20:00:00Z', '2026-09-12T21:00:00Z', 0, 95, 0.25),
  ];

  const now = new Date('2026-09-12T19:00:00Z');
  const result = recommendSchedule(device, slots, schedulingConfig, now);
  assert.strictEqual(result.outcome, 'OK');
  assert.strictEqual(result.isBestEffort, true, 'Must trigger isBestEffort: true');
  assert(
    result.reason.toLowerCase().includes('best-effort'),
    'Reason text must explicitly announce best-effort compromise'
  );
  console.log(`PASS: 6. Fallback/best-effort triggers when score < minIdealScore (Reason: "${result.reason.slice(0, 65)}...")`);
}

// -------------------------------------------------------------
// Test Case 7: NO_FEASIBLE_SLOT triggers when window is shorter than required duration
// -------------------------------------------------------------
{
  const device = {
    type: 'ev_charging', // 7.2 kW
    energyRequired: 14.4, // 14.4 kWh -> 2 hours = 120 mins required
    earliestStart: new Date('2026-09-12T10:00:00Z'),
    deadline: new Date('2026-09-12T11:00:00Z'), // Window is only 1 hour!
    status: 'active',
    flexibility: 'medium',
  };

  const slots = [
    makeSlot('2026-09-12T10:00:00Z', '2026-09-12T10:30:00Z', 80, 30),
    makeSlot('2026-09-12T10:30:00Z', '2026-09-12T11:00:00Z', 85, 30),
  ];

  const now = new Date('2026-09-12T09:00:00Z');
  const result = recommendSchedule(device, slots, schedulingConfig, now);
  assert.strictEqual(result.outcome, 'NO_FEASIBLE_SLOT', 'Must return NO_FEASIBLE_SLOT');
  assert.strictEqual(result.window, undefined, 'Window must be undefined on NO_FEASIBLE_SLOT');
  console.log('PASS: 7. NO_FEASIBLE_SLOT triggers when window is shorter than required duration');
}

console.log('\n=== ALL 7 SECTION 27 SCHEDULING TESTS PASSED! ===');
