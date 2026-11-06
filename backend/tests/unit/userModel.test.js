import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { User } from '../../src/models/User.js';

// The schema is validated without a database connection: we build documents in
// memory and assert on the schema definition + instance methods.
describe('models/User', () => {
  describe('schema definition', () => {
    it('lowercases and trims email and marks it unique', () => {
      const path = User.schema.path('email');
      expect(path.options.lowercase).toBe(true);
      expect(path.options.trim).toBe(true);
      expect(path.options.unique).toBe(true);
      expect(path.options.required[0]).toBe(true);
    });

    it('never selects the password field by default', () => {
      expect(User.schema.path('password').options.select).toBe(false);
      expect(User.schema.path('password').options.minlength).toEqual([6, expect.any(String)]);
    });

    it('requires a name of at least two characters', () => {
      const namePath = User.schema.path('name');
      expect(namePath.options.required[0]).toBe(true);
      expect(namePath.options.minlength).toEqual([2, expect.any(String)]);
    });

    it('enables timestamps', () => {
      expect(User.schema.path('createdAt')).toBeDefined();
      expect(User.schema.path('updatedAt')).toBeDefined();
    });
  });

  describe('validation', () => {
    it('rejects an invalid email', () => {
      const err = new User({ email: 'nope', password: 'secret123', name: 'Ada' }).validateSync();
      expect(err?.errors.email).toBeDefined();
    });

    it('rejects a too-short password', () => {
      const err = new User({ email: 'a@b.com', password: '123', name: 'Ada' }).validateSync();
      expect(err?.errors.password).toBeDefined();
    });

    it('accepts a well-formed user', () => {
      const err = new User({ email: 'a@b.com', password: 'secret123', name: 'Ada' }).validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('comparePassword()', () => {
    it('returns true for the matching plaintext and false otherwise', async () => {
      const user = new User({ email: 'a@b.com', password: 'placeholder', name: 'Ada' });
      user.password = await bcrypt.hash('secret123', 4);

      await expect(user.comparePassword('secret123')).resolves.toBe(true);
      await expect(user.comparePassword('wrong')).resolves.toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('strips the password from the serialised document', () => {
      const user = new User({ email: 'a@b.com', password: 'secret123', name: 'Ada' });
      user.password = 'hashed-value';

      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.email).toBe('a@b.com');
      expect(json.name).toBe('Ada');
    });
  });
});
