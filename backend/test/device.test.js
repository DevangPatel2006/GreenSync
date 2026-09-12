const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Device = require('../src/models/Device');

describe('Device Model Schema Verification', () => {
  const validUserId = new mongoose.Types.ObjectId();

  test('Instantiates valid device with defaults', () => {
    const device = new Device({
      userId: validUserId,
      name: 'My EV',
      type: 'ev_charging',
      energyRequired: 45.5,
      currentState: 'idle',
      earliestStart: new Date('2026-09-12T12:00:00Z'),
      deadline: new Date('2026-09-12T18:00:00Z'),
      flexibility: 'high',
      priority: 'normal',
    });

    assert.equal(device.userId.toString(), validUserId.toString());
    assert.equal(device.name, 'My EV');
    assert.equal(device.type, 'ev_charging');
    assert.equal(device.energyRequired, 45.5);
    assert.equal(device.currentState, 'idle');
    assert.equal(device.flexibility, 'high');
    assert.equal(device.priority, 'normal');
    assert.equal(device.status, 'active'); // Default
    assert.equal(device.validateSync(), undefined);
  });

  test('Requires userId', () => {
    const device = new Device({
      name: 'Washing Machine',
    });

    const validationError = device.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.userId);
  });

  test('Rejects invalid type enum', () => {
    const device = new Device({
      userId: validUserId,
      type: 'microwave',
    });

    const validationError = device.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.type);
  });

  test('Rejects invalid currentState enum', () => {
    const device = new Device({
      userId: validUserId,
      currentState: 'paused',
    });

    const validationError = device.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.currentState);
  });

  test('Rejects invalid flexibility enum', () => {
    const device = new Device({
      userId: validUserId,
      flexibility: 'extreme',
    });

    const validationError = device.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.flexibility);
  });

  test('Rejects invalid priority enum', () => {
    const device = new Device({
      userId: validUserId,
      priority: 'urgent',
    });

    const validationError = device.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.priority);
  });

  test('Rejects invalid status enum', () => {
    const device = new Device({
      userId: validUserId,
      status: 'pending',
    });

    const validationError = device.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.status);
  });

  test('Accepts all allowed type enums', () => {
    const allowedTypes = ['ev_charging', 'washing_machine', 'water_heater', 'battery', 'industrial', 'other'];
    for (const t of allowedTypes) {
      const device = new Device({
        userId: validUserId,
        type: t,
      });
      const error = device.validateSync();
      assert.equal(error?.errors?.type, undefined);
    }
  });

  test('userId references User model', () => {
    const userIdPath = Device.schema.paths.userId;
    assert.equal(userIdPath.options.ref, 'User');
  });

  test('Schema contains exactly the expected fields', () => {
    const expectedFields = [
      'userId',
      'name',
      'type',
      'energyRequired',
      'currentState',
      'earliestStart',
      'deadline',
      'flexibility',
      'priority',
      'status',
      '_id',
      'createdAt',
      'updatedAt',
      '__v',
    ];
    const actualFields = Object.keys(Device.schema.paths);
    assert.deepEqual(actualFields.sort(), expectedFields.sort());
  });
});
