#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): scans written content for accidental secrets.
// Detects AWS keys, GitHub tokens, OpenAI/Stripe keys, private key blocks,
// connection strings with embedded credentials, and hardcoded passwords.
// Exit 2 = block with warning. Exit 0 = allow.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const toolName = input?.tool_name ?? '';
const filePath = String(input?.tool_input?.file_path ?? input?.tool_input?.target_file ?? '');
const isTestOrDoc = /\.(spec|test)\.[tj]sx?$/.test(filePath) || /\.(md|markdown|example|sample)$/.test(filePath);

// Extract the content being written
let content = '';
if (toolName === 'Write') {
  content = input?.tool_input?.content ?? '';
} else if (toolName === 'Edit') {
  content = input?.tool_input?.new_string ?? '';
} else if (toolName === 'MultiEdit') {
  const edits = input?.tool_input?.edits ?? [];
  content = edits.map((e) => e?.new_string ?? '').join('\n');
}

if (!content) process.exit(0);

const matches = [];

// AWS Access Key IDs
if (/AKIA[0-9A-Z]{16}/.test(content)) matches.push('AWS access key (AKIA...)');

// AWS Secret Access Keys
if (/(aws_secret_access_key|secret_key)\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}/i.test(content)) matches.push('AWS secret key');

// GitHub tokens (PAT, OAuth, App)
if (/(ghp_|gho_|ghs_|ghr_|github_pat_)[a-zA-Z0-9_]{20,}/.test(content)) matches.push('GitHub token');

// OpenAI / Stripe / Anthropic style keys (sk-...)
if (/sk-[a-zA-Z0-9]{20,}/.test(content)) matches.push('API key (sk-...)');

// Slack tokens
if (/xox[bpras]-[0-9a-zA-Z-]{10,}/.test(content)) matches.push('Slack token');

// Private key blocks
if (/-----BEGIN\s+(RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/.test(content)) matches.push('private key block');

// Connection strings with embedded credentials
if (/(mongodb|postgres|mysql|redis|amqp|smtp)(\+[a-z]+)?:\/\/[^:\s]+:[^@\s]+@/.test(content)) matches.push('connection string with credentials');

// Generic hardcoded password/secret/token assignments (skip in tests and markdown docs)
if (!isTestOrDoc &&
    /(password|secret|token|api_key|apikey|api_secret)\s*[=:]\s*["'][^"']{8,}["']/i.test(content) &&
    !/(password|secret|token|api_key|apikey|api_secret)\s*[=:]\s*["']?(process\.env|os\.environ|getenv|\$\{|ENV\[|env\(|configService|test|mock|fake|example)/i.test(content)) {
  matches.push('hardcoded credential');
}

if (matches.length > 0) {
  console.error(`WARNING: Possible secrets detected in content: ${matches.join(', ')}. Review carefully.`);
  process.exit(2);
}

process.exit(0);
