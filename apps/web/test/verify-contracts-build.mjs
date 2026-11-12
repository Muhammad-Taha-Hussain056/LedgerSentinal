import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./fixtures/contracts-consumer/.next/server/app/index.html', import.meta.url), 'utf8');
assert.match(html, /<output[^>]*>10\.00<\/output>/);
