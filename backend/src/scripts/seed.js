const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Device = require('../models/Device');
const Schedule = require('../models/Schedule');
const RewardTransaction = require('../models/RewardTransaction');
const EnergyData = require('../models/EnergyData');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/greensync';

async function seedDatabase() {
  try {
    logger.info(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB successfully.');

    // 1. Clean previous demo seed data for idempotency
    const demoEmails = ['alex.chen@gridflow-energy.org', 'operator@greensync.energy'];
    const existingUsers = await User.find({ email: { $in: demoEmails } });
    const userIds = existingUsers.map((u) => u._id);

    if (userIds.length > 0) {
      await Device.deleteMany({ userId: { $in: userIds } });
      await Schedule.deleteMany({ userId: { $in: userIds } });
      await RewardTransaction.deleteMany({ userId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      logger.info('Cleaned previous demo seed records.');
    }

    // 2. Hash default password
    const plainPassword = 'DemandResponse2025!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    // 3. Create Demo Users
    // Primary residential demo user matching frontend sign-in defaults
    const demoUser = await User.create({
      name: 'Alex Chen',
      email: 'alex.chen@gridflow-energy.org',
      passwordHash,
      role: 'user',
      flexCoins: 1420,
    });

    // Admin user for grid operator console verification
    const adminUser = await User.create({
      name: 'Grid Operator Admin',
      email: 'operator@greensync.energy',
      passwordHash,
      role: 'admin',
      flexCoins: 2500,
    });

    logger.info(`Created demo user: ${demoUser.email} (role: ${demoUser.role})`);
    logger.info(`Created admin user: ${adminUser.email} (role: ${adminUser.role})`);

    // 4. Create Devices across categories for the demo user
    const now = new Date();
    const todayEvening = new Date(now);
    todayEvening.setHours(20, 0, 0, 0);

    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(6, 30, 0, 0);

    const afternoonStart = new Date(now);
    afternoonStart.setHours(12, 0, 0, 0);

    const eveningDeadline = new Date(now);
    eveningDeadline.setHours(18, 0, 0, 0);

    const devices = await Device.create([
      {
        userId: demoUser._id,
        name: 'Tesla Model 3',
        type: 'ev_charging',
        energyRequired: 38.5,
        currentState: 'idle',
        earliestStart: todayEvening,
        deadline: tomorrowMorning,
        flexibility: 'high',
        priority: 'normal',
        status: 'active',
      },
      {
        userId: demoUser._id,
        name: 'Rheem ProTerra Hybrid',
        type: 'water_heater',
        energyRequired: 14.2,
        currentState: 'idle',
        earliestStart: afternoonStart,
        deadline: eveningDeadline,
        flexibility: 'medium',
        priority: 'high',
        status: 'active',
      },
      {
        userId: demoUser._id,
        name: 'Daikin VRV Heat Pump',
        type: 'battery',
        energyRequired: 22.0,
        currentState: 'idle',
        earliestStart: afternoonStart,
        deadline: eveningDeadline,
        flexibility: 'medium',
        priority: 'normal',
        status: 'active',
      },
      {
        userId: demoUser._id,
        name: 'Bosch 800 Series Dishwasher',
        type: 'washing_machine',
        energyRequired: 3.2,
        currentState: 'idle',
        earliestStart: todayEvening,
        deadline: tomorrowMorning,
        flexibility: 'high',
        priority: 'low',
        status: 'active',
      },
      {
        userId: demoUser._id,
        name: 'Commercial Refrigeration Bank',
        type: 'industrial',
        energyRequired: 65.0,
        currentState: 'idle',
        earliestStart: afternoonStart,
        deadline: tomorrowMorning,
        flexibility: 'low',
        priority: 'high',
        status: 'active',
      },
    ]);

    logger.info(`Created ${devices.length} demo devices for ${demoUser.email}.`);

    const evDevice = devices.find((d) => d.type === 'ev_charging');
    const waterHeater = devices.find((d) => d.type === 'water_heater');

    // 5. Create 1 Completed Schedule + RewardTransaction
    const completedStart = new Date(now.getTime() - 4 * 3600 * 1000);
    const completedEnd = new Date(now.getTime() - 2 * 3600 * 1000);

    const completedSchedule = await Schedule.create({
      userId: demoUser._id,
      deviceId: waterHeater._id,
      recommendedStart: completedStart,
      recommendedEnd: completedEnd,
      energyShifted: 14.2,
      renewableUtilization: 88.5,
      peakReduction: 3.8,
      co2Avoided: 6.4,
      flexCoinsEarned: 65,
      reason: 'Shifted water heating cycle to peak solar availability window, avoiding 3.8 kW grid peak demand.',
      status: 'completed',
    });

    const rewardTx = await RewardTransaction.create({
      userId: demoUser._id,
      scheduleId: completedSchedule._id,
      coins: 65,
      reason: 'Shifted water heating cycle to peak solar availability window, avoiding 3.8 kW grid peak demand.',
      impactType: 'renewable',
    });

    logger.info(`Created 1 completed schedule (${completedSchedule._id}) with RewardTransaction (${rewardTx.coins} FC).`);

    // 6. Create 1 Pending Recommendation (status: 'proposed') for 1-click pitch demo
    const pendingStart = new Date(now.getTime() + 2 * 3600 * 1000);
    const pendingEnd = new Date(now.getTime() + 6 * 3600 * 1000);

    const pendingRecommendation = await Schedule.create({
      userId: demoUser._id,
      deviceId: evDevice._id,
      recommendedStart: pendingStart,
      recommendedEnd: pendingEnd,
      energyShifted: 38.5,
      renewableUtilization: 94.0,
      peakReduction: 9.6,
      co2Avoided: 18.2,
      flexCoinsEarned: 120,
      reason: 'Regional wind generation surges overnight. Shifting charging reduces wholesale grid cost and cuts carbon intensity by 80%.',
      status: 'proposed',
    });

    logger.info(`Created 1 pending recommendation (${pendingRecommendation._id}) ready to be accepted.`);

    // 7. Seed 24-Hour Energy Forecast Points
    await EnergyData.deleteMany({ source: 'simulated' });
    const forecastPoints = [];
    const baseHour = new Date(now);
    baseHour.setMinutes(0, 0, 0);

    for (let h = 0; h < 24; h++) {
      const pointTime = new Date(baseHour.getTime() + h * 3600 * 1000);
      const hourOfDay = pointTime.getHours();

      // Realistic diurnal curve: high solar 10 AM - 4 PM; high wind late night; peak demand 6 PM - 9 PM
      let renewable = 40;
      if (hourOfDay >= 9 && hourOfDay <= 16) {
        renewable = 70 + Math.sin(((hourOfDay - 9) / 7) * Math.PI) * 22;
      } else if (hourOfDay >= 22 || hourOfDay <= 5) {
        renewable = 55 + Math.random() * 10;
      } else {
        renewable = 35 + Math.random() * 10;
      }

      let demand = 45;
      if (hourOfDay >= 17 && hourOfDay <= 21) {
        demand = 75 + Math.sin(((hourOfDay - 17) / 4) * Math.PI) * 15;
      } else if (hourOfDay >= 8 && hourOfDay <= 16) {
        demand = 55 + Math.random() * 8;
      } else {
        demand = 30 + Math.random() * 10;
      }

      forecastPoints.push({
        timestamp: pointTime,
        renewableAvailability: Math.min(100, Math.max(0, Math.round(renewable))),
        gridDemand: Math.min(100, Math.max(0, Math.round(demand))),
        price: Number((0.12 + (demand / 100) * 0.18).toFixed(3)),
        source: 'simulated',
      });
    }

    await EnergyData.insertMany(forecastPoints);
    logger.info(`Seeded ${forecastPoints.length} simulated hourly energy forecast records.`);

    console.log('\n========================================');
    console.log(' GREENYSNC SEED COMPLETED SUCCESSFULLY! ');
    console.log('========================================');
    console.log(`Demo User:      ${demoUser.email} / ${plainPassword}`);
    console.log(`Admin User:     ${adminUser.email} / ${plainPassword}`);
    console.log(`Devices:        ${devices.length} created`);
    console.log(`Completed:      1 schedule + 1 reward transaction (${rewardTx.coins} FC)`);
    console.log(`Pending Rec:    1 recommendation ready to accept (Schedule ID: ${pendingRecommendation._id})`);
    console.log(`Energy Data:    24 hourly forecast data points`);
    console.log('========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
