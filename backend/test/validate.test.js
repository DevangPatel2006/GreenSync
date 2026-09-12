const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateRegister,
  validateDeviceCreate,
  validateDeviceUpdate,
} = require('../src/middleware/validate');

describe('Validation Middleware Unit Tests (src/middleware/validate.js)', () => {
  describe('validateRegister', () => {
    test('Fails on missing/empty name', (t, done) => {
      const req = { body: { email: 'user@example.com', password: 'password123' } };
      validateRegister(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'Name is required.');
        done();
      });
    });

    test('Fails on invalid email format', (t, done) => {
      const req = { body: { name: 'Alice', email: 'not-an-email', password: 'password123' } };
      validateRegister(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'Please provide a valid email address.');
        done();
      });
    });

    test('Fails on password length < 8', (t, done) => {
      const req = { body: { name: 'Alice', email: 'alice@example.com', password: '123' } };
      validateRegister(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'Password must be at least 8 characters long.');
        done();
      });
    });

    test('Passes on valid register payload', (t, done) => {
      const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'password123' } };
      validateRegister(req, {}, (err) => {
        assert.equal(err, undefined);
        done();
      });
    });
  });

  describe('validateDeviceCreate', () => {
    test('Fails on missing name', (t, done) => {
      const req = { body: { type: 'ev_charging', energyRequired: 10 } };
      validateDeviceCreate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'Device name is required.');
        done();
      });
    });

    test('Fails on invalid device type', (t, done) => {
      const req = { body: { name: 'My EV', type: 'toaster', energyRequired: 10 } };
      validateDeviceCreate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.match(err.message, /Device type is required and must be one of/);
        done();
      });
    });

    test('Fails on non-positive energyRequired (0, negative, string)', (t, done) => {
      const req = { body: { name: 'My EV', type: 'ev_charging', energyRequired: 0 } };
      validateDeviceCreate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'energyRequired must be a positive number.');
        done();
      });
    });

    test('Fails when deadline is before earliestStart', (t, done) => {
      const req = {
        body: {
          name: 'My EV',
          type: 'ev_charging',
          energyRequired: 20,
          earliestStart: '2026-09-12T18:00:00Z',
          deadline: '2026-09-12T12:00:00Z',
        },
      };
      validateDeviceCreate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'deadline cannot be earlier than earliestStart.');
        done();
      });
    });

    test('Fails on invalid flexibility enum', (t, done) => {
      const req = {
        body: {
          name: 'My EV',
          type: 'ev_charging',
          energyRequired: 20,
          flexibility: 'super_flexible',
        },
      };
      validateDeviceCreate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.match(err.message, /flexibility must be one of/);
        done();
      });
    });

    test('Passes on valid device creation payload', (t, done) => {
      const req = {
        body: {
          name: 'My EV',
          type: 'ev_charging',
          energyRequired: 20,
          earliestStart: '2026-09-12T12:00:00Z',
          deadline: '2026-09-12T18:00:00Z',
          flexibility: 'high',
          priority: 'normal',
          currentState: 'idle',
        },
      };
      validateDeviceCreate(req, {}, (err) => {
        assert.equal(err, undefined);
        done();
      });
    });
  });

  describe('validateDeviceUpdate', () => {
    test('Fails when updating energyRequired to a negative number', (t, done) => {
      const req = { body: { energyRequired: -5 } };
      validateDeviceUpdate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'energyRequired must be a positive number.');
        done();
      });
    });

    test('Fails when updating name to empty string', (t, done) => {
      const req = { body: { name: '   ' } };
      validateDeviceUpdate(req, {}, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'VALIDATION_ERROR');
        assert.equal(err.message, 'Device name cannot be empty.');
        done();
      });
    });

    test('Passes on valid partial update payload', (t, done) => {
      const req = { body: { energyRequired: 15.5, priority: 'high' } };
      validateDeviceUpdate(req, {}, (err) => {
        assert.equal(err, undefined);
        done();
      });
    });
  });
});
