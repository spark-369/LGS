import { jest } from '@jest/globals';

/**
 * Build a chainable Mongoose query double.
 *
 * Controllers call fluent builders (`Model.find(...).sort(...).skip(...)...
 * .lean()`). This helper returns an object that supports the whole chain and
 * resolves to `result` at every terminal, so both
 *   `await Model.findOne(filter)`            and
 *   `await Model.find(filter).lean()`
 * behave the way the controllers expect.
 *
 * @param {*} result value the query should resolve to
 */
export const makeQuery = (result) => {
  const query = {};
  for (const method of ['sort', 'skip', 'limit', 'select', 'populate', 'collation']) {
    query[method] = jest.fn(() => query);
  }
  query.lean = jest.fn(async () => result);
  query.exec = jest.fn(async () => result);
  // Make the query itself awaitable (thenable), mirroring Mongoose docs.
  query.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  query.catch = (onRejected) => Promise.resolve(result).catch(onRejected);
  return query;
};
