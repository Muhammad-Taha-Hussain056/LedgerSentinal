#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): blocks edits to sensitive or generated files.
// Blocks: .env files, private keys, lock files, generated files, .git/, hook scripts.
// Exit 2 = block. Exit 0 = allow.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = String(input?.tool_input?.file_path ?? input?.tool_input?.target_file ?? '');

if (!filePath) process.exit(0);

const block = (msg) => {
  console.error(`BLOCKED by orchestra hook: ${msg}`);
  process.exit(2);
};

// Allow exceptions — skill files should always be editable
if (/[/\\]\.claude[/\\]skills[/\\]/.test(filePath)) process.exit(0);

const base = basename(filePath);

// Protected file patterns
const protectedPatterns = [
  [/^\.env(\.[a-zA-Z.-]+)?$/, 'Cannot edit .env files — secrets are human-managed', (b) => !/^\.env\.(example|sample)$/.test(b)],
  [/\.(pem|key|crt|p12|pfx)$/, 'Cannot edit certificate/key files'],
  [/^(id_rsa|id_ed25519)$/, 'Cannot edit SSH key files'],
  [/^credentials\.json$/, 'Cannot edit credentials files'],
  [/^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/, 'Cannot edit lock files — run the package manager to update them'],
  [/\.(gen|generated)\.\w+$/, 'Cannot edit generated files — update the generator instead'],
  [/\.min\.(js|css)$/, 'Cannot edit minified files'],
];

for (const [pattern, msg, condition] of protectedPatterns) {
  if (pattern.test(base) && (!condition || condition(base))) block(msg);
}

// Protected directories
if (/[/\\]\.git[/\\]/.test(filePath)) block('Cannot edit files inside .git/');
if (/[/\\]secrets[/\\]/.test(filePath)) block('Cannot edit files inside secrets/');
if (/[/\\]\.claude[/\\]hooks[/\\]/.test(filePath)) block('Cannot edit hook scripts — these enforce security boundaries');
if (/[/\\]node_modules[/\\]/.test(filePath)) block('Cannot edit files inside node_modules/');

process.exit(0);
