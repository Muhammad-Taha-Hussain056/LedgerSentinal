#!/usr/bin/env node
// PostToolUse(Write|Edit|MultiEdit): auto-format TypeScript/JSON files with Prettier. Never blocks.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

try {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const file = String(input?.tool_input?.file_path ?? '');
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  
  // Only run if local prettier exists to prevent npx network hang on empty repos
  const hasLocalPrettier = existsSync(path.join(root, 'node_modules/.bin/prettier')) || existsSync(path.join(root, 'node_modules/.bin/prettier.cmd'));

  if (file && existsSync(file) && hasLocalPrettier && /\.(tsx?|jsx?|mjs|cjs|json|md|ya?ml)$/.test(file)) {
    const isWin = process.platform === 'win32';
    spawnSync(isWin ? 'npx.cmd' : 'npx', ['prettier', '--write', '--ignore-unknown', '--log-level=silent', file], {
      cwd: root,
      timeout: 5000,
      stdio: 'ignore',
      shell: isWin,
    });
  }
} catch {
  /* formatting is best-effort — never block on failure */
}
process.exit(0);
