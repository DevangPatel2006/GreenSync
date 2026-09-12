const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const app = require('../src/app');
const { success, error } = require('../src/utils/response');
const errorHandler = require('../src/middleware/errorHandler');
const AppError = require('../src/utils/AppError');

describe('GreenSync Backend Foundation Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/health returns {"success": true}', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { success: true });
  });

  test('Response utility: success envelope format', () => {
    let capturedStatus;
    let capturedJson;
    const mockRes = {
      status(s) {
        capturedStatus = s;
        return this;
      },
      json(j) {
        capturedJson = j;
        return this;
      },
    };

    success(mockRes, { item: 1 }, 'Fetched', 200);
    assert.equal(capturedStatus, 200);
    assert.deepEqual(capturedJson, {
      success: true,
      data: { item: 1 },
      message: 'Fetched',
    });

    success(mockRes, {});
    assert.deepEqual(capturedJson, {
      success: true,
      data: {},
    });
  });

  test('Response utility: error envelope format', () => {
    let capturedStatus;
    let capturedJson;
    const mockRes = {
      status(s) {
        capturedStatus = s;
        return this;
      },
      json(j) {
        capturedJson = j;
        return this;
      },
    };

    error(mockRes, 'VALIDATION_ERROR', 'Field missing', 400);
    assert.equal(capturedStatus, 400);
    assert.deepEqual(capturedJson, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Field missing',
      },
    });
  });

  test('Global error handler: 400 maps to VALIDATION_ERROR', () => {
    let status;
    let json;
    const mockRes = {
      status(s) { status = s; return this; },
      json(j) { json = j; return this; },
    };
    const err = new AppError('Invalid input field', 400);

    errorHandler(err, {}, mockRes, () => {});
    assert.equal(status, 400);
    assert.deepEqual(json, {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input field',
      },
    });
  });

  test('Global error handler: 401 maps to UNAUTHORIZED', () => {
    let status;
    let json;
    const mockRes = {
      status(s) { status = s; return this; },
      json(j) { json = j; return this; },
    };
    const err = new AppError('No token provided', 401);

    errorHandler(err, {}, mockRes, () => {});
    assert.equal(status, 401);
    assert.deepEqual(json, {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided',
      },
    });
  });

  test('Global error handler: 403 maps to FORBIDDEN', () => {
    let status;
    let json;
    const mockRes = {
      status(s) { status = s; return this; },
      json(j) { json = j; return this; },
    };
    const err = new AppError('Access denied', 403);

    errorHandler(err, {}, mockRes, () => {});
    assert.equal(status, 403);
    assert.deepEqual(json, {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    });
  });

  test('Global error handler: 404 maps to NOT_FOUND', () => {
    let status;
    let json;
    const mockRes = {
      status(s) { status = s; return this; },
      json(j) { json = j; return this; },
    };
    const err = new AppError('Resource not found', 404);

    errorHandler(err, {}, mockRes, () => {});
    assert.equal(status, 404);
    assert.deepEqual(json, {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  });

  test('Global error handler: 500 maps to SERVER_ERROR', () => {
    let status;
    let json;
    const mockRes = {
      status(s) { status = s; return this; },
      json(j) { json = j; return this; },
    };
    const err = new Error('Database connection failed');

    errorHandler(err, {}, mockRes, () => {});
    assert.equal(status, 500);
    assert.deepEqual(json, {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Database connection failed',
      },
    });
  });

  test('Undefined route returns 404 NOT_FOUND envelope via app', async () => {
    const res = await fetch(`${baseUrl}/api/undefined-endpoint-xyz`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.match(body.error.message, /Resource not found/);
  });

  test('CORS headers allow frontend origin', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});
