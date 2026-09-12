const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const auth = require('../src/middleware/auth');
const { requireAdmin } = require('../src/middleware/auth');

describe('Auth Middleware Unit Tests', () => {
  const secret = 'test_secret_for_middleware_123';

  before(() => {
    process.env.JWT_SECRET = secret;
  });

  test('Fails when Authorization header is missing', (t, done) => {
    const req = { headers: {} };
    const res = {};

    auth(req, res, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'UNAUTHORIZED');
      assert.match(err.message, /Authorization token required/);
      done();
    });
  });

  test('Fails when Authorization header is malformed (not Bearer)', (t, done) => {
    const req = { headers: { authorization: 'Basic mytoken123' } };
    const res = {};

    auth(req, res, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'UNAUTHORIZED');
      assert.match(err.message, /Malformed authorization header/);
      done();
    });
  });

  test('Fails when Authorization header is missing token string', (t, done) => {
    const req = { headers: { authorization: 'Bearer ' } };
    const res = {};

    auth(req, res, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'UNAUTHORIZED');
      assert.match(err.message, /Malformed authorization header/);
      done();
    });
  });

  test('Fails when token signature is invalid', (t, done) => {
    const fakeToken = jwt.sign({ sub: 'user123', role: 'user' }, 'wrong_secret');
    const req = { headers: { authorization: `Bearer ${fakeToken}` } };
    const res = {};

    auth(req, res, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'UNAUTHORIZED');
      assert.match(err.message, /Invalid or malformed token/);
      done();
    });
  });

  test('Fails when token has expired', (t, done) => {
    const expiredToken = jwt.sign(
      { sub: 'user123', role: 'user' },
      secret,
      { expiresIn: '-1s' }
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = {};

    auth(req, res, (err) => {
      assert.ok(err);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'UNAUTHORIZED');
      assert.match(err.message, /Token has expired/);
      done();
    });
  });

  test('Succeeds with valid token and populates req.user', (t, done) => {
    const validToken = jwt.sign({ sub: 'user456', role: 'user' }, secret);
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};

    auth(req, res, (err) => {
      assert.equal(err, undefined);
      assert.ok(req.user);
      assert.equal(req.user.id, 'user456');
      assert.equal(req.user.role, 'user');
      done();
    });
  });

  describe('requireAdmin helper', () => {
    test('Rejects when req.user is not present', (t, done) => {
      const req = {};
      const res = {};

      requireAdmin(req, res, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'FORBIDDEN');
        assert.match(err.message, /Admins only/);
        done();
      });
    });

    test('Rejects when user role is "user"', (t, done) => {
      const req = { user: { id: 'user1', role: 'user' } };
      const res = {};

      requireAdmin(req, res, (err) => {
        assert.ok(err);
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'FORBIDDEN');
        assert.match(err.message, /Admins only/);
        done();
      });
    });

    test('Allows access when user role is "admin"', (t, done) => {
      const req = { user: { id: 'admin1', role: 'admin' } };
      const res = {};

      requireAdmin(req, res, (err) => {
        assert.equal(err, undefined);
        done();
      });
    });
  });
});
