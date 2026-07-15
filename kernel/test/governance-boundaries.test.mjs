// Enforces GOVERNANCE.md §1/§2 as executable checks (VALIDATION.md domains 001/003):
// the kernel stays domain-agnostic (no domain nouns in code), interpreter-safe
// (no eval / new Function), dependency-free, and self-contained (no imports that
// escape kernel/src). Comments and JSDoc are stripped before the noun/eval scans —
// the rule is about code (identifiers, strings, logic), and doc comments legitimately
// name the domains the kernel serves.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

const kernelRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(kernelRoot, 'src');
const srcFiles = readdirSync(srcDir).filter((f) => f.endsWith('.js'));

// Character-level scanner: removes // and /* */ comments while respecting
// '…', "…", and `…` string bodies (so a "//" inside a string is not a comment).
function stripComments(code) {
  let out = '';
  let state = 'code'; // code | line | block | single | double | template
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = code[i + 1];
    if (state === 'code') {
      if (c === '/' && next === '/') { state = 'line'; i++; continue; }
      if (c === '/' && next === '*') { state = 'block'; i++; continue; }
      if (c === "'") state = 'single';
      else if (c === '"') state = 'double';
      else if (c === '`') state = 'template';
      out += c;
    } else if (state === 'line') {
      if (c === '\n') { state = 'code'; out += c; }
    } else if (state === 'block') {
      if (c === '*' && next === '/') { state = 'code'; i++; }
      else if (c === '\n') out += c; // keep line numbers stable
    } else { // inside a string
      out += c;
      if (c === '\\') { out += next ?? ''; i++; continue; }
      if ((state === 'single' && c === "'") || (state === 'double' && c === '"') || (state === 'template' && c === '`')) {
        state = 'code';
      }
    }
  }
  return out;
}

const stripped = new Map(
  srcFiles.map((f) => [f, stripComments(readFileSync(join(srcDir, f), 'utf8'))]),
);

// ── 1. No domain nouns in kernel code (GOVERNANCE §1 forbidden list) ───────
// Substring match, not \b-bounded: camelCase identifiers like `patientRecord`
// have no word boundary at the noun, and comments are already stripped.
{
  const forbidden = /patient|inspection|inspector|dwelling|tenant|clinical|nspire|housing|deploy/i;
  for (const [file, code] of stripped) {
    const m = code.match(forbidden);
    assert.ok(!m, `${file} contains domain noun "${m && m[0]}" in code — domain logic must stay in the domain layer`);
  }
  ok(`no domain nouns in code across ${srcFiles.length} kernel/src modules (comments excluded)`);
}

// ── 2. No eval / new Function anywhere in kernel code ──────────────────────
{
  const dynamicExec = /\beval\s*\(|\bnew\s+Function\b/;
  for (const [file, code] of stripped) {
    const m = code.match(dynamicExec);
    assert.ok(!m, `${file} uses dynamic code execution ("${m && m[0]}") — the charter evaluator must stay a hand-written interpreter`);
  }
  ok('no eval / new Function in any kernel/src module');
}

// ── 3. Kernel package declares zero runtime dependencies ───────────────────
{
  const pkg = JSON.parse(readFileSync(join(kernelRoot, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {});
  assert.deepEqual(deps, [], `kernel must be dependency-free; found runtime deps: ${deps.join(', ')}`);
  ok('kernel package.json declares zero runtime dependencies');
}

// ── 4. Imports never escape kernel/src (dependency direction, GOVERNANCE §2) ──
{
  const importSpec = /(?:^|\n)\s*(?:import\s[^'"]*|export\s[^'"]*from\s*)['"]([^'"]+)['"]/g;
  for (const [file, code] of stripped) {
    for (const m of code.matchAll(importSpec)) {
      const spec = m[1];
      const allowed = spec.startsWith('./') || spec.startsWith('node:');
      assert.ok(allowed, `${file} imports "${spec}" — kernel/src may import only sibling modules (./x.js) or node: builtins`);
    }
  }
  ok('all kernel/src imports stay inside kernel/src (or node: builtins)');
}

console.log(`\n${passed} checks passed.`);
