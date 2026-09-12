const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const Device = require('../src/models/Device');

describe('Device CRUD API (/api/devices)', () => {
  let server;
  let baseUrl;
  const originalFind = Device.find;
  const originalFindById = Device.findById;
  const originalCreate = Device.create;
  const originalFindByIdAndDelete = Device.findByIdAndDelete;

  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();
  const secret = 'device_test_secret_key_123';

  // In-memory devices store
  const inMemoryDevices = new Map();

  before(async () => {
    process.env.JWT_SECRET = secret;

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });

    Device.find = function (query) {
      const results = [];
      for (const d of inMemoryDevices.values()) {
        if (query.userId && d.userId.toString() === query.userId.toString()) {
          results.push(d);
        }
      }
      return Promise.resolve(results);
    };

    Device.findById = function (id) {
      const d = inMemoryDevices.get(id.toString());
      if (d) {
        d.save = function () {
          return Promise.resolve(this);
        };
        return Promise.resolve(d);
      }
      return Promise.resolve(null);
    };

    Device.create = function (data) {
      const id = new mongoose.Types.ObjectId().toString();
      const doc = new Device({
        _id: id,
        ...data,
      });
      doc.save = function () {
        return Promise.resolve(this);
      };
      inMemoryDevices.set(id, doc);
      return Promise.resolve(doc);
    };

    Device.findByIdAndDelete = function (id) {
      const existed = inMemoryDevices.delete(id.toString());
      return Promise.resolve(existed ? { _id: id } : null);
    };
  });

  after(async () => {
    Device.find = originalFind;
    Device.findById = originalFindById;
    Device.create = originalCreate;
    Device.findByIdAndDelete = originalFindByIdAndDelete;
    await new Promise((resolve) => server.close(resolve));
  });

  const getAuthHeader = (userId) => {
    const token = jwt.sign({ sub: userId, role: 'user' }, secret);
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  describe('GET /api/devices', () => {
    test('Rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/devices`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('Returns only devices belonging to req.user.id', async () => {
      // Seed devices for User A and User B
      await Device.create({
        userId: userA_Id,
        name: "User A's EV",
        type: 'ev_charging',
        energyRequired: 30,
      });

      await Device.create({
        userId: userB_Id,
        name: "User B's Washer",
        type: 'washing_machine',
        energyRequired: 2,
      });

      const res = await fetch(`${baseUrl}/api/devices`, {
        headers: getAuthHeader(userA_Id),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.devices));
      assert.equal(body.data.devices.length, 1);
      assert.equal(body.data.devices[0].name, "User A's EV");
      assert.equal(body.data.devices[0].userId.toString(), userA_Id);
    });
  });

  describe('POST /api/devices', () => {
    test('Fails on missing required fields (name, type, energyRequired)', async () => {
      const res = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          type: 'ev_charging',
        }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.match(body.error.message, /Device name is required/);
    });

    test('Fails when energyRequired is negative or zero', async () => {
      const resZero = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          name: 'Invalid Energy Device',
          type: 'water_heater',
          energyRequired: 0,
        }),
      });
      assert.equal(resZero.status, 400);
      const bodyZero = await resZero.json();
      assert.equal(bodyZero.error.code, 'VALIDATION_ERROR');
      assert.match(bodyZero.error.message, /positive number/);

      const resNeg = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          name: 'Invalid Energy Device',
          type: 'water_heater',
          energyRequired: -5,
        }),
      });
      assert.equal(resNeg.status, 400);
      const bodyNeg = await resNeg.json();
      assert.equal(bodyNeg.error.code, 'VALIDATION_ERROR');
    });

    test('Fails on invalid enum values (type, flexibility, priority)', async () => {
      const res = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          name: 'Bad Enum Device',
          type: 'invalid_type',
          energyRequired: 10,
        }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.match(body.error.message, /Device type is required/);
    });

    test('Fails when deadline is earlier than earliestStart', async () => {
      const res = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          name: 'Time Travel EV',
          type: 'ev_charging',
          energyRequired: 15,
          earliestStart: '2026-09-12T18:00:00Z',
          deadline: '2026-09-12T12:00:00Z',
        }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.match(body.error.message, /earlier than earliestStart/);
    });

    test('Creates device owned by req.user.id, ignoring spoofed client userId', async () => {
      const res = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          userId: userB_Id, // Attempting to spoof owner
          name: 'Home Battery',
          type: 'battery',
          energyRequired: 13.5,
          flexibility: 'medium',
          priority: 'high',
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'Device created successfully');
      assert.ok(body.data.device);
      assert.equal(body.data.device.name, 'Home Battery');
      assert.equal(body.data.device.userId.toString(), userA_Id); // Confirmed derived from req.user.id
      assert.equal(body.data.device.energyRequired, 13.5);
    });
  });

  describe('PUT /api/devices/:id', () => {
    let createdDevice;

    before(async () => {
      createdDevice = await Device.create({
        userId: userA_Id,
        name: 'Initial Device',
        type: 'water_heater',
        energyRequired: 5,
        priority: 'normal',
      });
    });

    test('Returns 404 NOT_FOUND for non-existent device ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await fetch(`${baseUrl}/api/devices/${nonExistentId}`, {
        method: 'PUT',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({ name: 'New Name' }),
      });

      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    test('Returns 403 FORBIDDEN when user attempts to update another user device', async () => {
      const res = await fetch(`${baseUrl}/api/devices/${createdDevice._id}`, {
        method: 'PUT',
        headers: getAuthHeader(userB_Id), // User B attempting to update User A's device
        body: JSON.stringify({ name: 'Hacked Name' }),
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error.code, 'FORBIDDEN');
      assert.match(body.error.message, /do not own/);
    });

    test('Returns 400 VALIDATION_ERROR on invalid partial update values', async () => {
      const res = await fetch(`${baseUrl}/api/devices/${createdDevice._id}`, {
        method: 'PUT',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({ energyRequired: -10 }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    test('Successfully updates device for owner with partial fields', async () => {
      const res = await fetch(`${baseUrl}/api/devices/${createdDevice._id}`, {
        method: 'PUT',
        headers: getAuthHeader(userA_Id),
        body: JSON.stringify({
          name: 'Updated Water Heater',
          energyRequired: 8.5,
          priority: 'high',
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.device.name, 'Updated Water Heater');
      assert.equal(body.data.device.energyRequired, 8.5);
      assert.equal(body.data.device.priority, 'high');
      assert.equal(body.data.device.type, 'water_heater'); // Unchanged
    });
  });

  describe('DELETE /api/devices/:id', () => {
    let targetDevice;

    before(async () => {
      targetDevice = await Device.create({
        userId: userA_Id,
        name: 'Device To Delete',
        type: 'washing_machine',
        energyRequired: 1.5,
      });
    });

    test('Returns 404 NOT_FOUND for non-existent device ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await fetch(`${baseUrl}/api/devices/${nonExistentId}`, {
        method: 'DELETE',
        headers: getAuthHeader(userA_Id),
      });

      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.error.code, 'NOT_FOUND');
    });

    test('Returns 403 FORBIDDEN when user attempts to delete another user device', async () => {
      const res = await fetch(`${baseUrl}/api/devices/${targetDevice._id}`, {
        method: 'DELETE',
        headers: getAuthHeader(userB_Id), // User B attempting to delete User A's device
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error.code, 'FORBIDDEN');
      assert.match(body.error.message, /do not own/);
    });

    test('Successfully deletes device for owner', async () => {
      const res = await fetch(`${baseUrl}/api/devices/${targetDevice._id}`, {
        method: 'DELETE',
        headers: getAuthHeader(userA_Id),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'Device deleted successfully');

      // Verify device is gone
      const verifyRes = await fetch(`${baseUrl}/api/devices/${targetDevice._id}`, {
        method: 'DELETE',
        headers: getAuthHeader(userA_Id),
      });
      assert.equal(verifyRes.status, 404);
    });
  });
});
