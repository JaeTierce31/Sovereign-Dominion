// Merkle Mountain Range — known-answer, exhaustive-inclusion, fuzz, and
// adversarial forgery tests. Run: node test/mmr.test.mjs   (or npm test)
//
// The MMR is real crypto (SHA-256), so it is held to the same bar as hash.js:
// determinism, every-leaf inclusion across every peak configuration, and
// explicit forgery attempts that must all fail.

import assert from 'node:assert/strict';
import { MerkleMountainRange, verifyMmrProof, hash } from '../src/index.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

// Deterministic leaf data: real SHA-256 of a label → even-length hex, a valid leaf.
const leaf = (i) => hash(`leaf-${i}`);

// ── 1. Determinism + empty root stability ───────────────────────────────────
{
  const a = new MerkleMountainRange();
  const b = new MerkleMountainRange();
  const empty = a.root();
  assert.equal(empty, b.root(), 'empty root is a fixed constant');
  for (let i = 0; i < 7; i++) { a.append(leaf(i)); b.append(leaf(i)); }
  assert.equal(a.root(), b.root(), 'same leaves → same root');
  assert.notEqual(a.root(), empty, 'a populated root differs from empty');
  assert.equal(a.size, 7);
  ok('MMR roots are deterministic and the empty root is stable');
}

// ── 2. Root evolves on every append (append-only tamper-evidence) ───────────
{
  const m = new MerkleMountainRange();
  const roots = new Set();
  for (let i = 0; i < 20; i++) { const { root } = m.append(leaf(i)); roots.add(root); }
  assert.equal(roots.size, 20, 'each append produced a distinct root');
  ok('every append advances the root (no silent no-op)');
}

// ── 3. Exhaustive inclusion: every leaf of every size 1..17 verifies ────────
// Sizes 1..17 exercise every peak shape: powers of two, and all the mixed
// carry configurations between them.
{
  for (let n = 1; n <= 17; n++) {
    const m = new MerkleMountainRange();
    for (let i = 0; i < n; i++) m.append(leaf(i));
    const root = m.root();
    for (let i = 0; i < n; i++) {
      const proof = m.proof(i);
      assert.equal(verifyMmrProof(leaf(i), proof, root), true, `size ${n}, leaf ${i} includes`);
      assert.equal(m.verify(i), true, `size ${n}, leaf ${i} self-verifies`);
    }
  }
  ok('every leaf of every MMR size 1..17 has a valid inclusion proof');
}

// ── 4. Adversarial: wrong leaf data for a valid proof must fail ─────────────
{
  const m = new MerkleMountainRange();
  for (let i = 0; i < 11; i++) m.append(leaf(i));
  const root = m.root();
  const proof = m.proof(5);
  assert.equal(verifyMmrProof(leaf(5), proof, root), true, 'honest leaf verifies');
  assert.equal(verifyMmrProof(leaf(6), proof, root), false, 'a different leaf under leaf-5 proof is rejected');
  assert.equal(verifyMmrProof(hash('forged'), proof, root), false, 'forged leaf is rejected');
  ok('a valid proof cannot be reused to prove a different leaf');
}

// ── 5. Adversarial: proof against the wrong root must fail ──────────────────
{
  const m1 = new MerkleMountainRange();
  const m2 = new MerkleMountainRange();
  for (let i = 0; i < 9; i++) { m1.append(leaf(i)); m2.append(leaf(i + 100)); }
  const proof = m1.proof(3);
  assert.equal(verifyMmrProof(leaf(3), proof, m1.root()), true, 'proof verifies against its own root');
  assert.equal(verifyMmrProof(leaf(3), proof, m2.root()), false, 'proof is rejected against a foreign root');
  ok('an inclusion proof is bound to its own root');
}

// ── 6. Adversarial: tampering with any proof field must fail ────────────────
{
  const m = new MerkleMountainRange();
  for (let i = 0; i < 13; i++) m.append(leaf(i));
  const root = m.root();
  const base = m.proof(6);

  // 6a. flip a sibling side
  if (base.intra.length) {
    const p = structuredClone(base);
    p.intra[0].side = p.intra[0].side === 'left' ? 'right' : 'left';
    assert.equal(verifyMmrProof(leaf(6), p, root), false, 'flipping a sibling side breaks the proof');
  }
  // 6b. corrupt a sibling hash
  {
    const p = structuredClone(base);
    if (p.intra.length) p.intra[0].hash = hash('tamper');
    assert.equal(verifyMmrProof(leaf(6), p, root), false, 'corrupting a sibling hash breaks the proof');
  }
  // 6c. corrupt the right bag
  {
    const p = structuredClone(base);
    p.rightBag = hash('evil-bag');
    assert.equal(verifyMmrProof(leaf(6), p, root), false, 'corrupting the right bag breaks the proof');
  }
  // 6d. drop a left peak
  {
    const p = structuredClone(base);
    if (p.leftPeaks.length) { p.leftPeaks.pop(); assert.equal(verifyMmrProof(leaf(6), p, root), false, 'dropping a left peak breaks the proof'); }
  }
  ok('tampering with any proof component (side, sibling, right-bag, left-peak) is detected');
}

// ── 7. Randomized fuzz: honest proofs pass, single-byte tamper fails ────────
{
  let checked = 0, tampers = 0;
  for (let trial = 0; trial < 200; trial++) {
    const n = 1 + Math.floor(Math.random() * 40);
    const m = new MerkleMountainRange();
    for (let i = 0; i < n; i++) m.append(hash(`t${trial}-${i}`));
    const root = m.root();
    const idx = Math.floor(Math.random() * n);
    const data = hash(`t${trial}-${idx}`);
    assert.equal(verifyMmrProof(data, m.proof(idx), root), true);
    checked++;
    // Tamper the root by one hex nibble → must fail.
    const badRoot = (root[0] === '0' ? '1' : '0') + root.slice(1);
    if (badRoot !== root) { assert.equal(verifyMmrProof(data, m.proof(idx), badRoot), false); tampers++; }
  }
  assert.ok(checked === 200 && tampers === 200, 'all fuzz trials behaved');
  ok('200 randomized trials: honest proofs verify, one-nibble root tamper always fails');
}

// ── 8. Malformed inputs never throw; return false ───────────────────────────
{
  const m = new MerkleMountainRange();
  for (let i = 0; i < 4; i++) m.append(leaf(i));
  const root = m.root();
  assert.equal(verifyMmrProof('nothex!!', m.proof(0), root), false, 'non-hex leaf data → false, no throw');
  assert.equal(verifyMmrProof(leaf(0), null, root), false, 'null proof → false');
  assert.equal(verifyMmrProof(leaf(0), { intra: [{ side: 'sideways', hash: root }], leftPeaks: [] }, root), false, 'bad side enum → false');
  assert.throws(() => m.proof(99), RangeError, 'out-of-range proof index throws RangeError');
  assert.throws(() => m.append('xyz'), TypeError, 'non-hex leaf append throws TypeError');
  ok('malformed proof inputs fail closed (false / typed throw), never crash silently');
}

console.log(`\n${passed} checks passed.`);
