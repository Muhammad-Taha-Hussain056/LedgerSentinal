import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name) => readFileSync(path.join(root, name), 'utf8');
const json = (name) => JSON.parse(read(name));

test('workspace is private and pins compatible installed tooling', () => {
  const manifest = json('package.json');
  assert.equal(manifest.private, true);
  assert.equal(manifest.packageManager, 'pnpm@10.24.0');
  assert.equal(manifest.engines.node, '>=24.10.0 <25');
  assert.equal(manifest.engines.pnpm, '10.24.0');
  const [major, minor] = process.versions.node.split('.').map(Number);
  assert.ok(major === 24 && minor >= 10, 'run verification with Node 24.10+');
  const pnpm = spawnSync('pnpm --version', { cwd: root, shell: true, encoding: 'utf8' });
  assert.equal(pnpm.status, 0, pnpm.stderr);
  assert.equal(pnpm.stdout.trim(), '10.24.0');
  assert.deepEqual(Object.keys(manifest.dependencies ?? {}), []);
  for (const version of Object.values(manifest.devDependencies)) {
    assert.match(version, /^\d+\.\d+\.\d+$/, 'tool dependencies must be exact');
  }
});

test('real workspace globs admit direct members and exclude nested/outside paths', async () => {
  const { parse } = await import('yaml');
  const workspace = parse(read('pnpm-workspace.yaml'));
  const admits = (member) => workspace.packages.some((glob) => path.posix.matchesGlob(member, glob));
  for (const member of ['apps/api', 'apps/web', 'packages/contracts', 'packages/ui']) {
    assert.ok(admits(member), `${member} must be a workspace member`);
  }
  for (const member of ['apps/web/src', 'docs', '../external', 'tools/verification']) {
    assert.equal(admits(member), false, `${member} must not be a workspace member`);
  }
  assert.equal(workspace.engineStrict, true);
});

test('pnpm lockfile resolves the exact declared tools without another package manager', async () => {
  const { parse } = await import('yaml');
  const lock = parse(read('pnpm-lock.yaml'));
  for (const [name, version] of Object.entries(json('package.json').devDependencies)) {
    assert.equal(lock.importers['.'].devDependencies[name].specifier, version);
    assert.equal(lock.importers['.'].devDependencies[name].version, version);
  }
  for (const name of ['package-lock.json', 'yarn.lock']) {
    assert.throws(() => read(name), { code: 'ENOENT' });
  }
});

test('task graph orders dependencies and keeps development uncached', () => {
  const { tasks } = json('turbo.json');
  assert.ok(tasks.build.dependsOn.includes('^build'));
  assert.ok(tasks.typecheck.dependsOn.includes('^typecheck'));
  assert.ok(tasks.test.dependsOn.includes('^build'));
  assert.ok(tasks.build.outputs.includes('dist/**'));
  assert.ok(tasks.build.outputs.includes('.next/**'));
  assert.ok(tasks.build.outputs.includes('!.next/cache/**'));
  assert.equal(tasks.dev.cache, false);
  assert.equal(tasks.dev.persistent, true);
  for (const task of ['build', 'typecheck', 'lint', 'test', 'dev']) {
    assert.equal(json('package.json').scripts[task], `turbo run ${task}`);
  }
});

test('installed Turborepo accepts the real graph before later package manifests exist', () => {
  const result = spawnSync(process.execPath, [
    path.join(root, 'node_modules/turbo/bin/turbo'),
    'run', 'build', 'typecheck', 'lint', 'test', '--dry=json',
  ], { cwd: root, encoding: 'utf8', env: { ...process.env, TURBO_TELEMETRY_DISABLED: '1' } });
  assert.equal(result.status, 0, result.stderr);
  const graph = JSON.parse(result.stdout);
  assert.ok(Array.isArray(graph.packages));
  assert.ok(Array.isArray(graph.tasks));
});

test('shared TypeScript settings compile valid code and reject unsafe code', async () => {
  const { default: ts } = await import('typescript');
  const config = ts.readConfigFile(path.join(root, 'tsconfig.base.json'), ts.sys.readFile);
  assert.equal(config.error, undefined);
  const converted = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, root);
  assert.deepEqual(converted.errors, []);
  const directory = mkdtempSync(path.join(tmpdir(), 'ledger-workspace-'));
  const filename = path.join(directory, 'policy.ts');
  const diagnostics = (source) => {
    writeFileSync(filename, source);
    const program = ts.createProgram([filename], { ...converted.options, noEmit: true, types: [] });
    return ts.getPreEmitDiagnostics(program);
  };
  try {
    assert.deepEqual(diagnostics('export const amount: bigint = 10n;'), []);
    const unsafe = diagnostics([
      'export function identity(value) { return value; }',
      'export const label: string = null;',
      'export const first: string = ([] as string[])[0];',
      'export const optional: { value?: string } = { value: undefined };',
    ].join('\n'));
    assert.deepEqual(unsafe.map((entry) => entry.code).sort(), [2322, 2322, 2375, 7006]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
