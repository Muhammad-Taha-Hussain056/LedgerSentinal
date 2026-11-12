import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name) => readFileSync(path.join(root, name), 'utf8');
const source = () => parse(read('docker-compose.yml'));
const VALIDATION_PASSWORD = 'validation-only';

function runCompose(password) {
  const env = { ...process.env };
  for (const key of ['COMPOSE_FILE', 'COMPOSE_PROJECT_NAME', 'COMPOSE_PROFILES', 'COMPOSE_ENV_FILES']) {
    delete env[key];
  }
  if (password === undefined) delete env.POSTGRES_PASSWORD;
  else env.POSTGRES_PASSWORD = password;
  return spawnSync('docker', [
    'compose', '--project-directory', root,
    '--file', path.join(root, 'docker-compose.yml'),
    '--env-file', path.join(root, '.env.example'),
    'config', '--format', 'json',
  ], { cwd: root, env, encoding: 'utf8', timeout: 20_000 });
}

function normalized() {
  const result = runCompose(VALIDATION_PASSWORD);
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return JSON.parse(result.stdout);
}

test('defines only PostgreSQL and Redis in a dedicated fixed test namespace', () => {
  const config = source();
  assert.equal(config.name, 'ledgersentinel-test');
  assert.deepEqual(Object.keys(config.services).sort(), ['postgres', 'redis']);
  assert.equal(config.services.postgres.environment.POSTGRES_DB, 'ledgersentinel_test');
  assert.equal(config.services.postgres.environment.POSTGRES_USER, 'ledger_test');
  assert.match(config.services.postgres.environment.POSTGRES_PASSWORD, /\$\{POSTGRES_PASSWORD:\?/);
});

test('pins official patch images and immutable digests without variable image overrides', () => {
  const { services } = source();
  assert.match(services.postgres.image, /^postgres:16\.\d+-alpine\d+\.\d+@sha256:[a-f0-9]{64}$/);
  assert.match(services.redis.image, /^redis:7\.2\.\d+-alpine\d+\.\d+@sha256:[a-f0-9]{64}$/);
});

test('Compose accepts the real file and publishes only isolated loopback test ports', () => {
  const config = normalized();
  assert.equal(config.name, 'ledgersentinel-test');
  for (const [name, target, published] of [['postgres', 5432, '55432'], ['redis', 6379, '56379']]) {
    const service = config.services[name];
    assert.equal(service.ports.length, 1);
    assert.equal(service.ports[0].host_ip, '127.0.0.1');
    assert.equal(service.ports[0].target, target);
    assert.equal(service.ports[0].published, published);
    assert.notEqual(service.network_mode, 'host');
    assert.notEqual(service.privileged, true);
    assert.equal(service.container_name, undefined);
  }
});

test('uses bounded health probes and distinct project-owned test volumes without bind mounts', () => {
  const config = normalized();
  const volumes = new Set();
  for (const [name, target] of [['postgres', '/var/lib/postgresql/data'], ['redis', '/data']]) {
    const service = config.services[name];
    assert.equal(service.volumes.length, 1);
    assert.equal(service.volumes[0].type, 'volume');
    assert.equal(service.volumes[0].target, target);
    const volume = service.volumes[0].source;
    assert.match(volume, /_test_data$/);
    assert.notEqual(config.volumes[volume].external, true);
    assert.ok(config.volumes[volume].name.startsWith('ledgersentinel-test_'));
    volumes.add(volume);
    assert.ok(service.healthcheck.retries > 0 && service.healthcheck.retries <= 20);
    for (const key of ['interval', 'timeout', 'start_period']) {
      const duration = service.healthcheck[key];
      assert.match(duration, /^\d+s$/);
      assert.ok(Number(duration.slice(0, -1)) > 0 && Number(duration.slice(0, -1)) <= 30);
    }
  }
  assert.equal(volumes.size, 2);
  const pgProbe = source().services.postgres.healthcheck.test.join(' ');
  assert.ok(pgProbe.includes('$$POSTGRES_USER') && pgProbe.includes('$$POSTGRES_DB'));
  assert.match(config.services.redis.healthcheck.test.join(' '), /redis-cli.*ping/);
  assert.ok(config.services.redis.command.includes('--appendonly'));
});

test('refuses missing and empty credentials instead of providing a working default', () => {
  for (const password of [undefined, '']) {
    const result = runCompose(password);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /POSTGRES_PASSWORD/);
  }
});

test('example environment documents empty variable names without usable credentials', () => {
  const entries = read('.env.example').split(/\r?\n/).filter((line) => line && !line.startsWith('#'));
  assert.ok(entries.includes('POSTGRES_PASSWORD='));
  assert.ok(entries.includes('TEST_DATABASE_URL='));
  assert.ok(entries.includes('TEST_REDIS_URL='));
  for (const line of entries) assert.match(line, /^[A-Z][A-Z0-9_]*=$/);
});
