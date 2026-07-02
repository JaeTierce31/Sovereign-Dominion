// Proves hash.js is real SHA-256, not the FNV-1a placeholder it used to be:
// checked against the standard NIST test vectors, then fuzzed against
// Node's own trusted `crypto.createHash('sha256')` across every message
// length that crosses a padding boundary (55/56/57, 63/64/65 mod 64, …) —
// the class of input where a hand-written SHA-256 is most likely to have an
// off-by-one bug.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { hash } from '../src/hash.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

function nodeSha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

// ── 1. Standard test vectors ─────────────────────────────────────────────
{
  const vectors = [
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    ],
  ];
  for (const [input, expected] of vectors) {
    assert.equal(hash(input), expected);
  }
  ok('matches standard SHA-256 test vectors ("", "abc", the 56-char NIST vector)');
}

// ── 2. Fuzzed against node:crypto's real SHA-256 across padding boundaries ──
{
  function randomString(len) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$%^&*()_+-=[]{}|;:,.<>?/\n\t日本語😀';
    let s = '';
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  const lengths = [0, 1, 2, 3, 4, 5, 8, 15, 16, 31, 32, 55, 56, 57, 63, 64, 65, 100, 127, 128, 129, 200, 500, 1000, 4096];
  let fuzzed = 0;
  for (const len of lengths) {
    for (let trial = 0; trial < 5; trial++) {
      const s = randomString(len);
      assert.equal(hash(s), nodeSha256(s), `mismatch at length ${len}, trial ${trial}`);
      fuzzed++;
    }
  }
  ok(`${fuzzed} random fuzz cases across ${lengths.length} padding-boundary lengths match node:crypto's real SHA-256`);
}

// ── 3. Objects hash via stableStringify (order-independent key hashing) ────
{
  assert.equal(hash({ a: 1, b: 2 }), hash({ b: 2, a: 1 }), 'key order must not affect the hash');
  assert.notEqual(hash({ a: 1 }), hash({ a: 2 }), 'different values must hash differently');
  ok('object hashing is key-order-independent via stableStringify');
}

console.log(`\n${passed} checks passed.`);
