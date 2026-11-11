#!/usr/bin/env node
// SessionStart: prints fullstack project config + pinned versions so Claude never assumes a version.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
};

const config = readJson(path.join(root, '.claude/orchestra.config.json'));

// Collect package.json deps from root, all app dirs, and packages
const appDirs = Object.values(config?.apps ?? {}).map((a) => (typeof a === 'string' ? a : a?.path)).filter(Boolean);
const pkgDirs = Object.values(config?.packages ?? {}).filter(Boolean);
const dirs = [root, ...appDirs.map((p) => path.join(root, p)), ...pkgDirs.map((p) => path.join(root, p))];

const deps = {};
for (const d of dirs) {
  const pkg = readJson(path.join(d, 'package.json'));
  Object.assign(deps, pkg?.devDependencies, pkg?.dependencies);
}

const BACKEND_WATCH = [
  '@nestjs/core', '@nestjs/common', '@nestjs/platform-express',
  '@nestjs/cqrs', '@nestjs/event-emitter', '@nestjs/config',
  '@nestjs/passport', '@nestjs/jwt', '@nestjs/swagger',
  '@nestjs/throttler', '@nestjs/testing',
  'drizzle-orm', 'drizzle-kit',
  'typeorm', 'prisma', '@prisma/client',
  'mongoose', '@nestjs/mongoose',
  'class-validator', 'class-transformer',
  'rxjs',
];

const FRONTEND_WATCH = [
  'next', 'react', 'react-dom',
  '@tanstack/react-query', '@tanstack/react-table',
  'react-hook-form', '@hookform/resolvers', 'zustand', '@reduxjs/toolkit',
  'tailwindcss', 'date-fns', 'next-intl',
  'vitest', '@testing-library/react', '@playwright/test', 'msw',
];

const SHARED_WATCH = ['typescript', 'zod'];

const bLines = BACKEND_WATCH.filter((n) => deps[n]).map((n) => `  ${n}: ${deps[n]}`);
const fLines = FRONTEND_WATCH.filter((n) => deps[n]).map((n) => `  ${n}: ${deps[n]}`);
const sLines = SHARED_WATCH.filter((n) => deps[n]).map((n) => `  ${n}: ${deps[n]}`);

console.log('## Full-Stack Orchestra context (NestJS + Next.js)');
if (config) {
  console.log(`[Backend]  framework: ${config.stack?.framework ?? 'nestjs'} | orm: ${config.stack?.orm} | db: ${config.stack?.database} | auth: ${config.stack?.authStrategy}`);
  console.log(`[Frontend] framework: nextjs (app router) | packageManager: ${config.frontendPackageManager ?? config.packageManager ?? 'pnpm'} | scope: ${config.scope ?? '@scope'}`);
  console.log(`[Apps]     ${Object.keys(config.apps ?? {}).join(', ') || 'api, web'}`);
  console.log(`[Toggles]  cqrs=${config.toggles?.cqrs} | events=${config.toggles?.eventEmitter} | tenancy=${config.toggles?.multiTenant} | microservices=${config.toggles?.microservices}`);
} else {
  console.log('WARNING: .claude/orchestra.config.json missing or invalid.');
}

const allLines = [...bLines, ...fLines, ...sLines];
console.log(allLines.length
  ? 'Pinned versions (verify version-specific APIs against these):\n' + allLines.join('\n')
  : 'No dependency versions found yet. Pin versions at scaffold time.');

if (!existsSync(path.join(root, 'nest-cli.json')) && !existsSync(path.join(root, 'pnpm-workspace.yaml'))) {
  console.log('Note: Neither nest-cli.json nor pnpm-workspace.yaml found — repository may not be scaffolded yet.');
}

process.exit(0);
