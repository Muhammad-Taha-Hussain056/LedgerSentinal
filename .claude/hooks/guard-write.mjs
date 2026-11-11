#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): hard-blocks (exit 2) secrets, ORM-in-service violations,
// and cross-module imports that break architecture rules.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const ti = input?.tool_input ?? {};
const filePath = String(ti.file_path ?? '').replace(/\\/g, '/');
const text = [ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e?.new_string) : [])]
  .filter((v) => typeof v === 'string')
  .join('\n');

const block = (msg) => {
  console.error(`BLOCKED by orchestra hook: ${msg}`);
  process.exit(2);
};

// ---- 1. Secrets ---------------------------------------------------------------
const base = path.posix.basename(filePath);
if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample)$/.test(base)) {
  block(`${base} holds real secrets and is human-managed. Edit .env.example (names only, no values) instead.`);
}

const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, 'private key'],
  [/sk_live_[0-9a-zA-Z]{16,}/, 'Stripe live secret key'],
  [/gh[pousr]_[0-9A-Za-z]{36,}/, 'GitHub token'],
  [/xox[baprs]-[0-9A-Za-z-]{10,}/, 'Slack token'],
];
for (const [re, label] of SECRET_PATTERNS) {
  if (re.test(text)) block(`content looks like a ${label}. Use environment variables via ConfigService.`);
}

const isTestLike = /\.(spec|test)\.[tj]sx?$/.test(filePath);
if (!isTestLike) {
  const generic = /(api[_-]?key|secret|token|password)\s*[:=]\s*['"]([^'"\s]{20,})['"]/i.exec(text);
  if (generic && !/process\.env|configService|config\.get|example|placeholder|xxxx/i.test(generic[0])) {
    block('hard-coded credential-like value detected. Use ConfigService and read from validated environment variables.');
  }
}

// ---- 2. ORM imports in service files ------------------------------------------
const isServiceFile = /\.service\.[tj]s$/.test(filePath) && !/\.spec\.[tj]s$/.test(filePath);
if (isServiceFile) {
  const ormImports = [
    { re: /from ['"]drizzle-orm['"]/, label: 'drizzle-orm' },
    { re: /from ['"]typeorm['"]/, label: 'typeorm' },
    { re: /from ['"]@prisma\/client['"]/, label: '@prisma/client' },
    { re: /from ['"]mongoose['"]/, label: 'mongoose' },
    { re: /from ['"]@nestjs\/mongoose['"]/, label: '@nestjs/mongoose' },
    { re: /InjectRepository|getRepository|EntityManager/, label: 'TypeORM EntityManager/Repository' },
    { re: /InjectModel|getModelToken/, label: 'Mongoose InjectModel/Model' },
  ];
  for (const { re, label } of ormImports) {
    if (re.test(text)) {
      block(
        `Service files must not import ORM directly (found: ${label}). ` +
        'All data access goes through a repository. Inject the repository token instead. See: .claude/skills/database/repository-pattern/SKILL.md'
      );
    }
  }
}

// ---- 3. Controller files must not contain business logic -----------------------
const isControllerFile = /\.controller\.[tj]s$/.test(filePath) && !/\.spec\.[tj]s$/.test(filePath);
if (isControllerFile) {
  // Detect injected repositories in controllers (repos belong in services)
  if (/Inject\([A-Z_]+_REPOSITORY\)/.test(text)) {
    block(
      'Controllers must not inject repositories directly. Controllers call services; services call repositories. ' +
      'Move the repository injection to the service layer.'
    );
  }
}

// ---- 4. Module-level cross-boundary import detection --------------------------
const moduleMatch = /src\/(?:modules|features|apps)\/([^/]+)\//.exec(filePath);
const ownModule = moduleMatch?.[1];
if (ownModule && /\.[mc]?[tj]sx?$/.test(filePath) && !isTestLike) {
  const importRe = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"](\.\.\/\.\.\/[^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(text))) {
    const spec = m[1];
    const crossModule = /(?:modules|features|apps)\/([^/'"\s]+)/.exec(spec)?.[1];
    if (crossModule && crossModule !== ownModule) {
      block(
        `Module "${ownModule}" imports directly from module "${crossModule}" via relative path ("${spec}"). ` +
        'Modules communicate through exported service interfaces only. ' +
        'Import the service through DI (inject it via module imports/exports), not via direct file path.'
      );
    }
  }
}

process.exit(0);
