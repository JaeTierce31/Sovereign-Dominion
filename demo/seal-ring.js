// The Living Seal — the crest is the instrument.
// A horological ring of 7 arcs wraps the medallion; each arc ignites as its
// pipeline stage executes, then the ring fuses into a solid gold seal on
// success (or breaks to ruby on a compliance failure). Brand === status.

const N = 7;
const R = 52;                 // ring radius within a 120×120 viewBox
const C = 2 * Math.PI * R;    // circumference
const SECTOR = C / N;         // arc length per stage
const GAP = 0.20;             // 20% of each sector is empty (the notch between arcs)
const ARC = SECTOR * (1 - GAP);
const SECTOR_DEG = 360 / N;
const BASE_DEG = -90 + (SECTOR_DEG * GAP) / 2;   // start at 12 o'clock, centred in sector

// Stage labels, in pipeline order (1‑indexed by caller).
const NAMES = ['Voice', 'ZK Proof', 'Merkle Log', 'Beam Scan', 'Council', 'Payment', 'Seal'];

let host = null;
let capEl = null;
const segs = [];

export function initSealRing(container) {
  if (!container || host) return;
  host = container;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'seal-ring');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < N; i++) {
    const seg = document.createElementNS(svgNS, 'circle');
    seg.setAttribute('cx', '60');
    seg.setAttribute('cy', '60');
    seg.setAttribute('r', String(R));
    seg.setAttribute('class', 'seal-seg');
    seg.setAttribute('stroke-dasharray', `${ARC} ${C - ARC}`);
    seg.setAttribute('transform', `rotate(${BASE_DEG + i * SECTOR_DEG} 60 60)`);
    svg.appendChild(seg);
    segs.push(seg);
  }

  // Ring sits behind the crest image; crest stays centred on top.
  host.insertBefore(svg, host.firstChild);

  capEl = document.createElement('div');
  capEl.className = 'seal-cap';
  host.appendChild(capEl);
}

export function resetSeal() {
  host?.classList.remove('sealed', 'broken');
  segs.forEach(s => (s.setAttribute('class', 'seal-seg')));
  if (capEl) { capEl.textContent = ''; capEl.classList.remove('show'); }
}

// n is 1‑indexed (matches activateStep). Prior arcs lock 'done', arc n glows 'active'.
export function setSealStep(n) {
  if (!segs.length) return;
  for (let i = 0; i < N; i++) {
    segs[i].setAttribute('class',
      i < n - 1 ? 'seal-seg done' : (i === n - 1 ? 'seal-seg active' : 'seal-seg'));
  }
  if (capEl && NAMES[n - 1]) {
    capEl.textContent = `SEALING · ${NAMES[n - 1].toUpperCase()}`;
    capEl.classList.add('show');
  }
}

// ok=true → the ring fuses into a complete gold seal; ok=false → it breaks.
export function sealComplete(ok) {
  if (!segs.length) return;
  if (ok) {
    segs.forEach(s => s.setAttribute('class', 'seal-seg done'));
    host?.classList.add('sealed');
    if (capEl) { capEl.textContent = 'SEALED'; capEl.classList.add('show'); }
  } else {
    // Keep completed arcs gold; the unresolved arc turns ruby.
    const firstOpen = segs.findIndex(s => !s.classList.contains('done'));
    const idx = firstOpen === -1 ? N - 1 : firstOpen;
    segs[idx].setAttribute('class', 'seal-seg fail');
    host?.classList.add('broken');
    if (capEl) { capEl.textContent = 'SEAL WITHHELD'; capEl.classList.add('show'); }
  }
}
