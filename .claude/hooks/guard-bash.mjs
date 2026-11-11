#!/usr/bin/env node
// PreToolUse(Bash): hard-blocks (exit 2) dangerous bash patterns.
//  1. Blocked package managers (yarn, bun for backend; npm for frontend)
//  2. Reading real .env files
//  3. Bypassing git hooks with --no-verify
//  4. Destructive DB operations without explicit confirmation
//  5. Force push (allow --force-with-lease)
//  6. Push to main/master directly
//  7. Destructive filesystem operations (rm -rf /, ~)
//  8. Publishing packages (npm publish, etc.)
//  9. Piping curl/wget to shell
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const cmd = String(input?.tool_input?.command ?? '');
const block = (msg) => {
  console.error(`BLOCKED by orchestra hook: ${msg}`);
  process.exit(2);
};

const segments = cmd
  .split(/&&|\|\||;|\|/)
  .map((s) => s.trim().replace(/^(\w+=\S+\s+)+/, '')); // strip leading ENV=1 assignments

for (const seg of segments) {
  // Block wrong package managers
  if (/^(yarn|bun|bunx)([\s]|$)/.test(seg)) {
    block('this repo uses npm (backend) / pnpm (frontend). Use the correct package manager.');
  }

  // Block reading real .env files (allow .env.example) - cross-platform (bash + powershell)
  if (/\b(cat|less|more|head|tail|grep|rg|source|bat|Get-Content|gc|type)\b[^|;&]*\.env(\.[a-zA-Z.-]+)?(\s|$)/i.test(seg) &&
      !/\.env\.(example|sample)\b/.test(seg)) {
    block('real .env files are human-managed secrets. Read `.env.example` instead, or use ConfigService in code.');
  }

  // Block destructive DB operations unless explicitly flagged
  if (/npm run db:reset/.test(seg) && !/--confirm/.test(cmd)) {
    block('`db:reset` destroys all data. Run it manually after confirming.');
  }

  // Block dropping tables directly via drizzle-kit push in production
  if (/drizzle-kit push/.test(seg) && /NODE_ENV=production/.test(cmd)) {
    block('`drizzle-kit push` in production is destructive. Use `db:generate` + `db:migrate` with reviewed migration files.');
  }

  // Block DROP TABLE/DATABASE/SCHEMA
  if (/DROP\s+(TABLE|DATABASE|SCHEMA)\s+/i.test(seg)) {
    block('DROP TABLE/DATABASE/SCHEMA is destructive and irreversible. Run manually if intended.');
  }

  // Block TRUNCATE TABLE
  if (/TRUNCATE\s+TABLE/i.test(seg)) {
    block('TRUNCATE TABLE is destructive and irreversible. Run manually if intended.');
  }

  // Block DELETE FROM without WHERE
  if (/DELETE\s+FROM\s+\w+\s*($|;)/i.test(seg) && !/WHERE/i.test(seg)) {
    block('DELETE FROM without WHERE clause would delete all rows. Add a WHERE clause.');
  }

  // Block rm -rf or PowerShell Remove-Item on root, home, or broad paths (cross-platform)
  if (/\b(rm\s+-[a-zA-Z]*r[a-zA-Z]*f|Remove-Item\s+.*-Recurse|rmdir\s+\/s|del\s+\/s)\b/i.test(seg) &&
      /(\/|\\|\~|\$HOME|\.\.\/\.\.)/.test(seg)) {
    block('recursive force-delete on root/home/parent paths. Specify a safe target directory.');
  }

  // Block publishing packages
  if (/\b(npm|yarn|pnpm|bun)\s+publish\b/.test(seg)) {
    block('publishing packages should be done manually or via CI, not through AI.');
  }

  // Block piping curl/wget to shell
  if (/(curl|wget)\s.*\|\s*(bash|sh|zsh|sudo)/.test(seg)) {
    block('piping downloaded content to a shell is dangerous. Download first, inspect, then execute.');
  }

  // Block chmod 777
  if (/chmod\s+777/.test(seg)) {
    block('chmod 777 gives everyone read/write/execute. Use more restrictive permissions (e.g., 755 or 644).');
  }
}

// Block bypassing git hooks
if (/\bgit\s+(commit|push)\b[^|;&]*--no-verify\b/.test(cmd)) {
  block('--no-verify bypasses pre-commit hooks (lint, type-check). Fix the underlying failure instead.');
}

// Block force push (allow --force-with-lease)
if (/\bgit\s+push\b[^|;&]*(-[a-zA-Z]*f|--force)(\s|$)/.test(cmd) && !/--force-with-lease/.test(cmd)) {
  block('force push is not allowed. Use --force-with-lease if you need to overwrite remote.');
}

// Block push to main/master
if (/\bgit\s+push\b[^|;&]*(origin\s+|:)(main|master)\b/.test(cmd)) {
  block('cannot push directly to main/master. Use a feature branch and create a PR.');
}

// Block git reset --hard
if (/\bgit\s+reset\s+--hard\b/.test(cmd)) {
  block('git reset --hard discards uncommitted changes permanently. Use git stash or git reset --soft instead.');
}

// Block git clean -f
if (/\bgit\s+clean\s+-[a-zA-Z]*f/.test(cmd)) {
  block('git clean -f permanently deletes untracked files. Review with git clean -n first, then run manually.');
}

process.exit(0);
