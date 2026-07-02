// Adversarial security regression tests for the charter compiler.
//
// The compiler evaluates charter-authored expression strings. Even though it
// never uses eval/new Function, a tree-walking interpreter can still (a) leak
// a path to arbitrary code execution, (b) fail OPEN on malformed input, or
// (c) be driven to exhaust resources. These tests lock in the guarantees that
// an adversarial audit established, so a future refactor can't silently
// regress them.

import assert from 'node:assert/strict';
import { compilePredicate } from '../src/charter-compiler.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

const run = (src, ctx = { intent: {}, subject: {} }) => compilePredicate(src)(ctx);

// ── A. No sandbox escape: nothing reachable via the grammar can be CALLED
//        except the whitelisted scope fns (now/sha256/all/any) and the
//        whitelisted array methods (every/some/includes). ─────────────────
{
  globalThis.__CHARTER_PWNED__ = false;
  const escapes = [
    "intent.constructor.constructor('globalThis.__CHARTER_PWNED__=true')()",
    "subject['constructor']['constructor']('globalThis.__CHARTER_PWNED__=true')()",
    "now.constructor('globalThis.__CHARTER_PWNED__=true')()",
    "sha256.constructor('return 1')()",
    "all.constructor('return 1')()",
  ];
  for (const src of escapes) {
    assert.throws(() => run(src), /Unsupported call target|is not callable|not supported/i, `should refuse: ${src}`);
  }
  assert.equal(globalThis.__CHARTER_PWNED__, false, 'no escape may execute attacker code');
  delete globalThis.__CHARTER_PWNED__;
  ok('every constructor/Function-reflection escape is refused; no attacker code runs');
}

// ── B. Reading a property is fine; only CALLING non-whitelisted things is
//        blocked — so the grammar stays useful without being exploitable. ──
{
  assert.equal(run('intent.constructor != null'), true, 'reading .constructor is allowed (just not callable)');
  assert.equal(run('intent.a.b.c'), false, 'a fully-undefined member chain is falsy, not a crash');
  ok('property reads (incl. .constructor) work; they simply cannot be invoked');
}

// ── C. Ordinal comparisons FAIL CLOSED on unknown enum members ────────────
//        (the confirmed fail-open: lexicographic fallback let a malformed
//        severity satisfy a `>=` disclosure gate).
{
  const ord = { low: 0, moderate: 1, severe: 2, life_threatening: 3 };
  const cmp = (a, b) => compilePredicate('intent.a >= intent.b', { ordinals: ord })({ intent: { a, b }, subject: {} });

  // Known members: real ordinal ranking (not lexicographic).
  assert.equal(cmp('life_threatening', 'low'), true);
  assert.equal(cmp('low', 'life_threatening'), false, 'a genuine downgrade is still caught');

  // Unknown members: must THROW (→ gate treats as violation → Intent blocked),
  // NOT silently return true via lexicographic order.
  assert.throws(() => cmp('lo', 'life_threatening'), /unknown value/i, "typo'd severity must fail closed");
  assert.throws(() => cmp('zzz', 'severe'), /unknown value/i, 'garbage severity must fail closed');
  assert.throws(() => cmp('severe', 'SEVERE'), /unknown value/i, 'wrong-case severity must fail closed');
  ok('ordinal comparison fails closed (throws) on any unknown enum member — no lexicographic bypass');
}

// ── D. Mixed-type comparisons are unaffected by ordinal mode ──────────────
//        (`now() < expiresAt` must keep working whether expiresAt is a number
//        or a numeric string; only string-vs-string enters the enum branch).
{
  const ord = { low: 0, moderate: 1, severe: 2, life_threatening: 3 };
  const p = compilePredicate('now() < intent.exp', { ordinals: ord });
  assert.equal(p({ intent: { exp: Date.now() + 1e7 }, now: () => Date.now(), subject: {} }), true, 'number vs number');
  assert.equal(p({ intent: { exp: String(Date.now() + 1e7) }, now: () => Date.now(), subject: {} }), true, 'number vs numeric-string');
  ok('mixed-type (numeric) comparisons still work under ordinal mode');
}

// ── E. Resource bound: over-long predicate is refused with a clear error,
//        not a stack overflow. ────────────────────────────────────────────
{
  const huge = '('.repeat(5000) + 'true' + ')'.repeat(5000);
  assert.throws(() => compilePredicate(huge), /too long/i, 'over-length predicate must be refused cleanly');
  assert.throws(() => compilePredicate(42), /must be a string/i, 'non-string source must be rejected');
  ok('over-long / non-string predicate sources are refused with a clear error (no RangeError)');
}

console.log(`\n${passed} checks passed.`);
