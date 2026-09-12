const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication API (/api/auth)', () => {
  let server;
  let baseUrl;
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalFindById = User.findById;

  // In-memory test user database
  const inMemoryUsers = new Map();

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    User.findById = originalFindById;
    await new Promise((resolve) => server.close(resolve));
  });

  // Setup mock Mongoose operations using in-memory store
  before(() => {
    User.findOne = function (query) {
      const email = query && query.email;
      const user = email ? inMemoryUsers.get(email) : null;
      return {
        select: function () {
          return Promise.resolve(user || null);
        },
        then: function (resolve, reject) {
          return Promise.resolve(user || null).then(resolve, reject);
        },
      };
    };

    User.create = function (data) {
      const id = '65b2f1a9c8e1d2f3a4b5c6d7';
      const userDoc = new User({
        _id: id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || 'user',
        flexCoins: data.flexCoins || 0,
      });
      inMemoryUsers.set(data.email, userDoc);
      return Promise.resolve(userDoc);
    };

    User.findById = function (id) {
      for (const u of inMemoryUsers.values()) {
        if (u._id.toString() === id.toString()) {
          return Promise.resolve(u);
        }
      }
      return Promise.resolve(null);
    };
  });

  describe('POST /api/auth/register', () => {
    test('Fails when password is less than 8 characters', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pass',
          email: 'shortpass@example.com',
          password: 'short',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'VALIDATION_ERROR');
      assert.match(data.error.message, /Password must be at least 8 characters/);
    });

    test('Fails on invalid email format', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Email',
          email: 'invalid-email-address',
          password: 'password123',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'VALIDATION_ERROR');
      assert.match(data.error.message, /valid email address/);
    });

    test('Fails when name is missing', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'noname@example.com',
          password: 'password123',
        }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'VALIDATION_ERROR');
      assert.match(data.error.message, /Name is required/);
    });

    test('Successfully registers a new user, hashes password, returns user & signed JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Green',
          email: 'john.green@example.com',
          password: 'securePassword123!',
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'User registered successfully');
      assert.ok(body.data.token);
      assert.ok(body.data.user);

      // Verify passwordHash is never exposed in response
      assert.equal(body.data.user.passwordHash, undefined);
      assert.equal(body.data.user.email, 'john.green@example.com');
      assert.equal(body.data.user.name, 'John Green');
      assert.equal(body.data.user.role, 'user');

      // Verify JWT payload includes sub and role
      const decoded = jwt.verify(body.data.token, process.env.JWT_SECRET);
      assert.equal(decoded.sub, body.data.user._id);
      assert.equal(decoded.role, 'user');
    });

    test('Rejects duplicate email registration with VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate John',
          email: 'john.green@example.com',
          password: 'anotherPassword123!',
        }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.equal(body.error.message, 'Email is already registered.');
    });
  });

  describe('POST /api/auth/login', () => {
    test('Fails on non-existent email with exact error message', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
      assert.equal(body.error.message, "That email or password doesn't match our records.");
    });

    test('Fails on incorrect password with exact error message', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.green@example.com',
          password: 'wrongPassword123!',
        }),
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
      assert.equal(body.error.message, "That email or password doesn't match our records.");
    });

    test('Succeeds with correct credentials and returns user & signed JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.green@example.com',
          password: 'securePassword123!',
        }),
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.message, 'Logged in successfully');
      assert.ok(body.data.token);
      assert.ok(body.data.user);

      // Verify passwordHash is excluded
      assert.equal(body.data.user.passwordHash, undefined);
      assert.equal(body.data.user.email, 'john.green@example.com');

      // Verify JWT payload includes sub and role
      const decoded = jwt.verify(body.data.token, process.env.JWT_SECRET);
      assert.equal(decoded.sub, body.data.user._id);
      assert.equal(decoded.role, 'user');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Rejects unauthenticated logout request with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('Succeeds when authenticated and returns success response', async () => {
      // First login to get a token
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.green@example.com',
          password: 'securePassword123!',
        }),
      });
      const { data } = await loginRes.json();

      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      assert.equal(logoutRes.status, 200);
      const logoutBody = await logoutRes.json();
      assert.equal(logoutBody.success, true);
      assert.equal(logoutBody.message, 'Logged out successfully');
      assert.deepEqual(logoutBody.data, {});
    });
  });

  describe('GET /api/auth/me', () => {
    test('Rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('Returns profile without passwordHash for authenticated user', async () => {
      // Login to get token
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.green@example.com',
          password: 'securePassword123!',
        }),
      });
      const { data } = await loginRes.json();

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      assert.equal(meRes.status, 200);
      const meBody = await meRes.json();
      assert.equal(meBody.success, true);
      assert.ok(meBody.data.user);
      assert.equal(meBody.data.user.email, 'john.green@example.com');
      assert.equal(meBody.data.user.name, 'John Green');
      assert.equal(meBody.data.user.passwordHash, undefined);
    });
  });
});
