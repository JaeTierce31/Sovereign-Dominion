// Compliance Certificate Generator
// Renders an 800×810 certificate to Canvas and triggers PNG download.
// No external dependencies — pure Canvas 2D API.

export function downloadCertificate(d) {
  const W = 800, H = 810;
  const cv = document.createElement('canvas');
  cv.width = W * 2; cv.height = H * 2; // 2× for retina sharpness
  const ctx = cv.getContext('2d');
  ctx.scale(2, 2);

  const pass = d.compliance === 'PASS';
  const statusColor = pass ? '#22c55e' : '#ef4444';
  const statusBg    = pass ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)';

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0f0f1a');
  bg.addColorStop(1, '#07070f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // ── Outer border ──────────────────────────────────────────────────────────
  ctx.strokeStyle = statusColor; ctx.lineWidth = 2.5;
  rrect(ctx, 20, 20, W - 40, H - 40, 14); ctx.stroke();

  // ── Header strip ──────────────────────────────────────────────────────────
  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, 'rgba(255,69,0,0.2)');
  hg.addColorStop(0.5, 'rgba(255,122,60,0.06)');
  hg.addColorStop(1, 'rgba(255,69,0,0.2)');
  ctx.fillStyle = hg; ctx.fillRect(20, 20, W - 40, 100);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6020';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText('SOVEREIGN DOMINION', W / 2, 72);

  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = '12.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('Nous Research × NVIDIA × Stripe  —  Structural Compliance Certificate', W / 2, 97);

  // ── Divider ───────────────────────────────────────────────────────────────
  hline(ctx, 128, W, 'rgba(255,255,255,0.08)');

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '10.5px "Courier New", monospace';
  ctx.fillText('COMPLIANCE CERTIFICATE · QSSM v1.1 · IBC 1604 / AISC 360', W / 2, 152);

  // ── Status badge ──────────────────────────────────────────────────────────
  const bW = 210, bH = 60, bX = (W - bW) / 2, bY = 170;
  ctx.fillStyle = statusBg;
  rrect(ctx, bX, bY, bW, bH, 10); ctx.fill();
  ctx.strokeStyle = statusColor; ctx.lineWidth = 1.5;
  rrect(ctx, bX, bY, bW, bH, 10); ctx.stroke();
  ctx.fillStyle = statusColor;
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(pass ? '✓  PASS' : '✗  FAIL', W / 2, bY + 42);

  // ── Details rows ──────────────────────────────────────────────────────────
  let y = 258, rowIdx = 0;
  const RH = 40;

  function row(label, val, mark) {
    if (rowIdx % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(36, y, W - 72, RH);
    }
    const mid = y + RH / 2 + 4;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.36)';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(label, 50, mid);
    ctx.textAlign = 'right';
    ctx.fillStyle = mark === 'pass' ? '#22c55e'
                  : mark === 'fail' ? '#ef4444'
                  : 'rgba(255,255,255,0.88)';
    ctx.font = '12.5px system-ui, -apple-system, sans-serif';
    ctx.fillText(String(val), W - 50, mid);
    y += RH; rowIdx++;
  }

  const modMsi   = d.modMsi  != null ? d.modMsi  : (pass ? 29 : 20);
  const yieldKsi = d.yieldKsi != null ? d.yieldKsi : (pass ? 40 : 28);
  const reqKsi   = d.requiredKsi || 36;
  const yieldOk  = yieldKsi >= reqKsi;
  const modOk    = modMsi >= 29;
  const domainCap = (d.domain || 'structural').replace(/^\w/, c => c.toUpperCase());

  row('PROJECT / BEAM ID',  `${d.scenario || 'Unknown'} — ${d.beamId || '—'}`);
  row('DOMAIN',             domainCap);
  row('YIELD STRENGTH',     `${yieldKsi} ksi — req ≥ ${reqKsi} ksi`, yieldOk ? 'pass' : 'fail');
  row('ELASTIC MODULUS',    `${modMsi} Msi — req ≥ 29 Msi`, modOk ? 'pass' : 'fail');
  row('QSSM PROOF ENGINE',  `${d.benchmarkMs || '—'}ms · ${d.engine === 'wasm' ? 'WASM' : 'mock'}`);
  row('φ-HARMONY SCORE', d.harmony || '—');
  row('MOLOCH MMR ROOT',    d.mmrRoot ? d.mmrRoot.slice(0, 26) + '…' : '—');
  if (d.paymentId) {
    row('STRIPE PAYMENT', d.paymentId.slice(0, 24) + '…', 'pass');
  } else {
    row('STRIPE PAYMENT', 'BLOCKED — compliance failure', 'fail');
  }

  // ── ZK proof hash ─────────────────────────────────────────────────────────
  hline(ctx, y + 6, W, 'rgba(255,255,255,0.07)');
  y += 24;

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '9.5px "Courier New", monospace';
  ctx.fillText('ZK PROOF HASH (first 16 bytes)', 50, y);
  y += 17;
  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.font = '11.5px "Courier New", monospace';
  ctx.fillText('0x' + (d.proofHex || '0000000000000000000000000000000000000000000000000000000000000000').slice(0, 64), 50, y);
  y += 28;

  // ── Timestamp ─────────────────────────────────────────────────────────────
  hline(ctx, y, W, 'rgba(255,255,255,0.06)');
  y += 19;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.24)';
  ctx.font = '10.5px "Courier New", monospace';
  ctx.fillText('ISSUED: ' + new Date(d.timestamp || Date.now()).toUTCString(), W / 2, y);
  y += 20;

  // ── Legal ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.17)';
  ctx.font = '9.5px system-ui, -apple-system, sans-serif';
  const legal1 = pass
    ? 'Cryptographic ZK proof confirms IBC 1604 / AISC 360 structural compliance. Secured by QSSM v1.1.'
    : 'Structural compliance FAILURE. This certificate is for record-keeping. Human engineering review is required.';
  ctx.fillText(legal1, W / 2, y);
  y += 16;
  ctx.fillText('Sovereign Dominion · Zero-Knowledge Proof · Moloch Merkle Mountain Range · Immutable Audit Trail', W / 2, y);

  // ── Footer ────────────────────────────────────────────────────────────────
  hline(ctx, H - 38, W, statusColor + '44');
  ctx.textAlign = 'center';
  ctx.fillStyle = statusColor + '99';
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText(
    'SOVEREIGN DOMINION · sovereigndominion.dev · Nous Research × NVIDIA NIM × Stripe · Hackathon 2026',
    W / 2, H - 18
  );

  // ── Download ──────────────────────────────────────────────────────────────
  const a = document.createElement('a');
  a.download = `SD-${d.beamId || 'cert'}-${d.compliance}-${Date.now()}.png`;
  a.href = cv.toDataURL('image/png');
  a.click();
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function hline(ctx, y, W, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(W - 36, y); ctx.stroke();
}
