const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Users API (/api/users)', () => {
  let server;
  let baseUrl;
  const originalFindById = User.findById;

  const mockUser = new User({
    _id: '65b2f1a9c8e1d2f3a4b5c6d7',
    name: 'Initial Name',
    email: 'user@example.com',
    passwordHash: 'hashed_password_string',
    role: 'user',
    flexCoins: 25,
  });

  // Stub save to avoid database network calls in unit/integration tests
  mockUser.save = function () {
    return Promise.resolve(this);
  };

  const secret = 'users_test_jwt_secret_987';

  before(async () => {
    process.env.JWT_SECRET = secret;

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });

    User.findById = function (id) {
      if (id && id.toString() === mockUser._id.toString()) {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    };
  });

  after(async () => {
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  });

  const getValidToken = (userId = mockUser._id, role = mockUser.role) => {
    return jwt.sign({ sub: userId, role }, secret);
  };

  describe('GET /api/users/profile', () => {
    test('Rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/users/profile`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('Returns profile without passwordHash for authenticated user', async () => {
      const token = getValidToken();
      const res = await fetch(`${baseUrl}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.user);
      assert.equal(body.data.user.name, 'Initial Name');
      assert.equal(body.data.user.email, 'user@example.com');
      assert.equal(body.data.user.role, 'user');
      assert.equal(body.data.user.flexCoins, 25);
      assert.equal(body.data.user.passwordHash, undefined);
    });

    test('Returns 404 NOT_FOUND if user does not exist in DB', async () => {
      const ghostToken = getValidToken('65b2f1a9c8e1d2f3a4b5c6d0');
      const res = await fetch(`${baseUrl}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${ghostToken}`,
        },
      });

      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'NOT_FOUND');
      assert.match(body.error.message, /User not found/);
    });
  });

  describe('PUT /api/users/profile', () => {
    test('Rejects unauthenticated update request with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('Fails when name is missing or empty string with 400 VALIDATION_ERROR', async () => {
      const token = getValidToken();
      const res = await fetch(`${baseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: '   ' }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.match(body.error.message, /Name is required/);
    });

    test('Updates name only and returns updated profile without passwordHash', async () => {
      const token = getValidToken();
      const res = await fetch(`${baseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Updated Name Only',
          role: 'admin', // Should be ignored
          email: 'hacked@example.com', // Should be ignored
          flexCoins: 9999, // Should be ignored
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'Profile updated successfully');
      assert.ok(body.data.user);
      assert.equal(body.data.user.name, 'Updated Name Only');
      assert.equal(body.data.user.email, 'user@example.com'); // Unchanged
      assert.equal(body.data.user.role, 'user'); // Unchanged
      assert.equal(body.data.user.flexCoins, 25); // Unchanged
      assert.equal(body.data.user.passwordHash, undefined);
    });
  });
});
