const Schedule = require('../../models/Schedule');
const schedulingService = require('./schedulingService');
const energyService = require('../energy/energyService');
const logger = require('../../utils/logger');

let workerInterval = null;

/**
 * Starts the GreenSync background worker:
 * 1. Emits periodic real-time energy telemetry to MongoDB.
 * 2. Scans for accepted schedules whose execution window has completed,
 *    and auto-completes them, calculating and awarding FlexCoins in real-time.
 */
function startScheduleWorker(intervalMs = 30000) {
  if (workerInterval) return;

  logger.info(`[ScheduleWorker] Starting background worker with ${intervalMs}ms interval...`);

  const runTick = async () => {
    try {
      // 1. Emit live condition snapshot into EnergyData collection
      await energyService.getCurrentConditions();

      // 2. Scan for accepted schedules whose recommendedEnd has passed
      const now = new Date();
      const expiredAccepted = await Schedule.find({
        status: 'accepted',
        recommendedEnd: { $lte: now },
      });

      for (const schedule of expiredAccepted) {
        try {
          logger.info(`[ScheduleWorker] Auto-completing elapsed schedule ${schedule._id} for user ${schedule.userId}...`);
          await schedulingService.completeSchedule(schedule.userId.toString(), schedule._id.toString());
        } catch (err) {
          logger.error(`[ScheduleWorker] Error auto-completing schedule ${schedule._id}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.debug(`[ScheduleWorker] Background tick error: ${err.message}`);
    }
  };

  // Run initial tick after 5 seconds, then recurring
  setTimeout(runTick, 5000);
  workerInterval = setInterval(runTick, intervalMs);
}

function stopScheduleWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    logger.info('[ScheduleWorker] Stopped background worker.');
  }
}

module.exports = {
  startScheduleWorker,
  stopScheduleWorker,
};
