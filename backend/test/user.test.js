const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');

describe('User Model Schema Verification', () => {
  test('Instantiates user with default values and lowercase email', () => {
    const user = new User({
      name: 'John Doe',
      email: 'John.DOE@Example.COM',
      passwordHash: 'secret_bcrypt_hash',
    });

    assert.equal(user.name, 'John Doe');
    assert.equal(user.email, 'john.doe@example.com');
    assert.equal(user.role, 'user');
    assert.equal(user.flexCoins, 0);
  });

  test('Rejects invalid role', () => {
    const user = new User({
      name: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash: 'secret_bcrypt_hash',
      role: 'superadmin',
    });

    const validationError = user.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.role);
  });

  test('Requires name, email, and passwordHash', () => {
    const user = new User({});
    const validationError = user.validateSync();
    assert.ok(validationError);
    assert.ok(validationError.errors.name);
    assert.ok(validationError.errors.email);
    assert.ok(validationError.errors.passwordHash);
  });

  test('passwordHash has select: false in schema definition', () => {
    const passwordHashField = User.schema.paths.passwordHash;
    assert.equal(passwordHashField.options.select, false);
  });

  test('passwordHash is excluded in toJSON output', () => {
    const user = new User({
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: 'secret_bcrypt_hash',
    });

    const json = user.toJSON();
    assert.equal(json.passwordHash, undefined);
    assert.equal(json.name, 'Alice');
    assert.equal(json.email, 'alice@example.com');
  });

  test('Schema has timestamps enabled', () => {
    assert.ok(User.schema.options.timestamps);
  });

  test('Schema contains only the expected fields', () => {
    const expectedFields = ['name', 'email', 'passwordHash', 'role', 'flexCoins', '_id', 'createdAt', 'updatedAt', '__v'];
    const actualFields = Object.keys(User.schema.paths);
    assert.deepEqual(actualFields.sort(), expectedFields.sort());
  });
});
