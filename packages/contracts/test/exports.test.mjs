import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const esm = await import('@project/contracts');
const cjs = require('@project/contracts');

for (const [format, contracts] of [['ESM', esm], ['CommonJS', cjs]]) {
  test(`${format} resolves compiled public exports and performs exact serialization`, () => {
    const cents = contracts.moneyToCents('0.10') + contracts.moneyToCents('0.20');
    assert.equal(cents, 30n);
    assert.equal(contracts.centsToMoney(cents), '0.30');
    assert.equal(contracts.moneySchema.parse('9999999999999999.99'), '9999999999999999.99');
    assert.equal(contracts.moneySchema.safeParse('1e2').success, false);
    assert.deepEqual(contracts.paginationQuerySchema.parse({}), { page: 1, limit: 20 });
  });
}

test('formats expose identical named APIs and deny private source imports', async () => {
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
  assert.throws(() => require('@project/contracts/src/money'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
  await assert.rejects(import('@project/contracts/src/money'), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
});
