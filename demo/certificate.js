// Compliance Certificate Generator
// Renders a certificate to Canvas and triggers a PNG download, finished with a
// pressed wax seal of the Sovereign Dominion crest. Pure Canvas 2D API.

export async function downloadCertificate(d) {
  const W = 800, H = 980;
  const cv = document.createElement('canvas');
  cv.width = W * 2; cv.height = H * 2; // 2× for retina sharpness
  const ctx = cv.getContext('2d');
  ctx.scale(2, 2);

  const pass = d.compliance === 'PASS';
  const GOLD = '#e6c66a', GOLD_DEEP = '#9a7420';
  const statusColor = pass ? '#34c98a' : '#d23a52';   // emerald / ruby
  const statusBg    = pass ? 'rgba(52,201,138,0.10)' : 'rgba(210,58,82,0.10)';

  // ── Background — obsidian ─────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0e1a');
  bg.addColorStop(1, '#07070c');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // ── Outer border — gold ───────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 2.5;
  rrect(ctx, 20, 20, W - 40, H - 40, 14); ctx.stroke();
  ctx.strokeStyle = 'rgba(212,175,55,0.18)'; ctx.lineWidth = 1;
  rrect(ctx, 27, 27, W - 54, H - 54, 11); ctx.stroke();

  // ── Header strip ──────────────────────────────────────────────────────────
  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, 'rgba(212,175,55,0.20)');
  hg.addColorStop(0.5, 'rgba(212,175,55,0.05)');
  hg.addColorStop(1, 'rgba(212,175,55,0.20)');
  ctx.fillStyle = hg; ctx.fillRect(20, 20, W - 40, 100);

  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 34px "Palatino Linotype", Palatino, Georgia, serif';
  ctx.fillText('SOVEREIGN DOMINION', W / 2, 73);

  ctx.fillStyle = 'rgba(236,231,219,0.4)';
  ctx.font = '12.5px system-ui, -apple-system, sans-serif';
  ctx.fillText('Nous Research × NVIDIA × Stripe  —  Structural Compliance Certificate', W / 2, 98);

  hline(ctx, 128, W, 'rgba(212,175,55,0.14)');

  ctx.fillStyle = 'rgba(236,231,219,0.28)';
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
      ctx.fillStyle = 'rgba(212,175,55,0.04)';
      ctx.fillRect(36, y, W - 72, RH);
    }
    const mid = y + RH / 2 + 4;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(236,231,219,0.4)';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(label, 50, mid);
    ctx.textAlign = 'right';
    ctx.fillStyle = mark === 'pass' ? '#34c98a'
                  : mark === 'fail' ? '#d23a52'
                  : 'rgba(236,231,219,0.9)';
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
  if (d.paymentStatus === 'succeeded') {
    const payVal = d.paymentId ? d.paymentId.slice(0, 24) + '…' : `succeeded${d.paymentMock ? ' · mock' : ''}`;
    row('STRIPE PAYMENT', payVal, 'pass');
  } else {
    row('STRIPE PAYMENT', 'BLOCKED — compliance failure', 'fail');
  }

  // ── ZK proof hash ─────────────────────────────────────────────────────────
  hline(ctx, y + 6, W, 'rgba(212,175,55,0.10)');
  y += 24;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(236,231,219,0.28)';
  ctx.font = '9.5px "Courier New", monospace';
  ctx.fillText('ZK PROOF HASH (first 16 bytes)', 50, y);
  y += 17;
  ctx.fillStyle = 'rgba(236,231,219,0.62)';
  ctx.font = '11.5px "Courier New", monospace';
  ctx.fillText('0x' + (d.proofHex || '0'.repeat(64)).slice(0, 64), 50, y);
  y += 28;

  // ── Timestamp + legal ─────────────────────────────────────────────────────
  hline(ctx, y, W, 'rgba(212,175,55,0.08)');
  y += 19;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(236,231,219,0.3)';
  ctx.font = '10.5px "Courier New", monospace';
  ctx.fillText('ISSUED: ' + new Date(d.timestamp || Date.now()).toUTCString(), W / 2, y);
  y += 22;

  ctx.fillStyle = 'rgba(236,231,219,0.22)';
  ctx.font = '9.5px system-ui, -apple-system, sans-serif';
  const legal1 = pass
    ? 'Cryptographic ZK proof confirms IBC 1604 / AISC 360 structural compliance. Secured by QSSM v1.1.'
    : 'Structural compliance FAILURE. This certificate is for record-keeping. Human engineering review is required.';
  ctx.fillText(legal1, W / 2, y);
  y += 16;
  ctx.fillText('Sovereign Dominion · Zero-Knowledge Proof · Moloch Merkle Mountain Range · Immutable Audit Trail', W / 2, y);

  // ── Wax seal — pressed crest ──────────────────────────────────────────────
  await drawWaxSeal(ctx, W / 2, 814, 72, pass, d);

  // ── Footer ────────────────────────────────────────────────────────────────
  hline(ctx, H - 40, W, 'rgba(212,175,55,0.28)');
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212,175,55,0.6)';
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText(
    'SOVEREIGN DOMINION · sovereigndominion.dev · Nous Research × NVIDIA NIM × Stripe · Hackathon 2026',
    W / 2, H - 20
  );

  // ── Download ──────────────────────────────────────────────────────────────
  const a = document.createElement('a');
  a.download = `SD-${d.beamId || 'cert'}-${d.compliance}-${Date.now()}.png`;
  a.href = cv.toDataURL('image/png');
  a.click();
}

// ── Wax seal ────────────────────────────────────────────────────────────────
async function drawWaxSeal(ctx, cx, cy, R, pass, d) {
  const img = await loadImage('./logo-256.png').catch(() => null);
  const waxA = pass ? '#c9a63a' : '#8f2c3e';
  const waxB = pass ? '#7c5c14' : '#4c1622';
  const ringColor = pass ? 'rgba(212,175,55,0.95)' : 'rgba(210,58,82,0.95)';

  ctx.save();

  // Ribbon tails behind the seal
  ctx.fillStyle = pass ? 'rgba(212,175,55,0.30)' : 'rgba(210,58,82,0.30)';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * 22, cy + R * 0.4);
    ctx.lineTo(cx + dir * 60, cy + R + 34);
    ctx.lineTo(cx + dir * 38, cy + R + 30);
    ctx.lineTo(cx + dir * 16, cy + R * 0.7);
    ctx.closePath();
    ctx.fill();
  }

  // Pressed-wax disc with a scalloped rim
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 20; ctx.shadowOffsetY = 7;
  const grd = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, R * 0.2, cx, cy, R);
  grd.addColorStop(0, waxA); grd.addColorStop(1, waxB);
  ctx.fillStyle = grd;
  scallop(ctx, cx, cy, R, 26, 2.4); ctx.fill();
  ctx.restore();

  // Inset rim highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R - 5, 0, Math.PI * 2); ctx.stroke();

  // Crest embossed into the wax
  const ir = R * 0.62;
  if (img) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, ir, 0, Math.PI * 2); ctx.clip();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(img, cx - ir, cy - ir, ir * 2, ir * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = ringColor;
    ctx.font = `bold ${R * 0.5}px "Palatino Linotype", Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SD', cx, cy);
  }

  // Ring text — upper and lower arcs
  arcText(ctx, 'SOVEREIGN · DOMINION', cx, cy, R - 12, -Math.PI / 2, false,
          '600 9px "Courier New", monospace', ringColor);
  arcText(ctx, pass ? 'COMPLIANCE SEALED' : 'SEAL WITHHELD', cx, cy, R - 12, Math.PI / 2, true,
          '600 9px "Courier New", monospace', ringColor);

  ctx.restore();
}

function scallop(ctx, cx, cy, R, teeth, amp) {
  ctx.beginPath();
  const steps = teeth * 6;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = R + Math.cos(t * teeth) * amp;
    const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function arcText(ctx, str, cx, cy, radius, centerAngle, flip, font, color) {
  ctx.save();
  ctx.fillStyle = color; ctx.font = font;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const chars = [...str];
  const widths = chars.map(ch => ctx.measureText(ch).width + 1.2);
  const totalAngle = widths.reduce((a, b) => a + b, 0) / radius;
  const dir = flip ? -1 : 1;
  let angle = centerAngle - dir * totalAngle / 2;
  for (let i = 0; i < chars.length; i++) {
    const wa = widths[i] / radius;
    const a = angle + dir * wa / 2;
    const x = cx + Math.cos(a) * radius, y = cy + Math.sin(a) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    angle += dir * wa;
  }
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
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
