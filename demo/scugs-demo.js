// SCUGS Tier-1 Chromatic Beam Stress Render — I-beam cross-section with IBC compliance overlay
// Accepts an options object or a legacy hex color string for backward compatibility.
export function renderSCUGS(colorOrOptions) {
  const canvas = document.getElementById('scugs-canvas');
  if (!canvas) return;

  // Normalize input
  const opts = typeof colorOrOptions === 'string'
    ? { compliant: colorOrOptions !== '#FF0000', beamId: 'B-001', domain: 'structural', yieldKsi: 40, requiredKsi: 36 }
    : colorOrOptions;
  const { compliant = true, beamId = 'B-001', domain = 'structural', yieldKsi = 40, requiredKsi = 36 } = opts;

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  ctx.clearRect(0, 0, W, H);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0a18');
  bg.addColorStop(1, '#0d0d20');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid backdrop
  ctx.strokeStyle = 'rgba(255,69,0,0.06)';
  ctx.lineWidth = 0.5;
  const gs = 18;
  for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ── I-beam geometry ──────────────────────────────────────────────────
  const cx = W * 0.34;
  const cy = H * 0.5;
  const beamH = H * 0.62;
  const flangeW = W * 0.23;
  const flangeH = beamH * 0.13;
  const webW = flangeW * 0.20;
  const webH = beamH - flangeH * 2;

  function stressColor(absRelY, alpha = 1) {
    // absRelY: 0 = neutral axis (no stress), 1 = extreme fiber (max stress)
    const rawStress = absRelY;
    const stress = compliant ? rawStress * 0.88 : rawStress * 1.15;
    const r = Math.min(255, Math.round(stress * 2.2 * 255));
    const g = compliant
      ? Math.round(Math.max(0, (1 - stress * 0.9) * 190))
      : Math.round(Math.max(0, (1 - stress) * 60));
    const b = compliant ? Math.round((1 - stress) * 50) : 20;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Web — linear stress gradient (zero at center, max at flanges)
  const webGrad = ctx.createLinearGradient(cx, cy - webH / 2, cx, cy + webH / 2);
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const relY = Math.abs(t - 0.5) * 2; // 0 at center, 1 at top/bottom
    webGrad.addColorStop(t, stressColor(relY, 0.88));
  }
  ctx.fillStyle = webGrad;
  ctx.fillRect(cx - webW / 2, cy - webH / 2, webW, webH);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - webW / 2, cy - webH / 2, webW, webH);

  // Top flange (extreme fiber — max stress)
  const topGrad = ctx.createLinearGradient(cx, cy - webH / 2 - flangeH, cx, cy - webH / 2);
  topGrad.addColorStop(0, stressColor(1.0, 0.92));
  topGrad.addColorStop(1, stressColor(0.7, 0.80));
  ctx.fillStyle = topGrad;
  ctx.fillRect(cx - flangeW / 2, cy - webH / 2 - flangeH, flangeW, flangeH);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(cx - flangeW / 2, cy - webH / 2 - flangeH, flangeW, flangeH);

  // Bottom flange
  const botGrad = ctx.createLinearGradient(cx, cy + webH / 2, cx, cy + webH / 2 + flangeH);
  botGrad.addColorStop(0, stressColor(0.7, 0.80));
  botGrad.addColorStop(1, stressColor(1.0, 0.92));
  ctx.fillStyle = botGrad;
  ctx.fillRect(cx - flangeW / 2, cy + webH / 2, flangeW, flangeH);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.strokeRect(cx - flangeW / 2, cy + webH / 2, flangeW, flangeH);

  // Neutral axis
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(cx - flangeW / 2 - 6, cy);
  ctx.lineTo(cx + flangeW / 2 + 6, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Stress distribution diagram (right side) ─────────────────────────
  const diagX = W * 0.65;
  const diagW = W * 0.26;
  const bars = 14;
  const barH = beamH / bars;

  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    const absRelY = Math.abs(t - 0.5) * 2;
    const bLen = absRelY * diagW * (compliant ? 0.84 : 1.08);
    const by = cy - beamH / 2 + i * barH;
    const r = Math.min(255, Math.round(absRelY * (compliant ? 1.6 : 2.4) * 255));
    const g = Math.round((1 - absRelY) * (compliant ? 185 : 55));
    ctx.fillStyle = `rgba(${r},${g},25,0.72)`;
    ctx.fillRect(diagX, by + 0.5, Math.max(1, bLen), barH - 1);
  }

  // IBC threshold line on diagram
  const ratio = Math.min(yieldKsi, requiredKsi) / Math.max(yieldKsi, requiredKsi);
  const threshX = diagX + diagW * 0.84 * ratio;
  ctx.strokeStyle = compliant ? 'rgba(34,197,94,0.88)' : 'rgba(255,69,0,0.88)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(threshX, cy - beamH / 2 - 5);
  ctx.lineTo(threshX, cy + beamH / 2 + 5);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Labels ────────────────────────────────────────────────────────────
  const fs = Math.max(9, W * 0.025);
  ctx.textAlign = 'left';

  // Beam ID + compliance status
  ctx.font = `bold ${fs + 1}px monospace`;
  ctx.fillStyle = compliant ? '#22c55e' : '#ff6b6b';
  ctx.fillText(`${beamId}  ${compliant ? '✓ PASS' : '✗ FAIL'}`, W * 0.03, H * 0.1);

  ctx.font = `${fs - 1}px monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(`IBC 1604 · ${domain.toUpperCase()}`, W * 0.03, H * 0.19);

  // Yield label
  ctx.font = `${fs}px monospace`;
  ctx.fillStyle = compliant ? '#22c55e' : '#ff6b6b';
  ctx.fillText(`σy = ${yieldKsi} ksi`, W * 0.03, H * 0.87);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillText(`req ≥ ${requiredKsi} ksi`, W * 0.03, H * 0.94);

  // N.A. label
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillText('N.A.', cx + flangeW / 2 + 5, cy + 4);

  // Diagram header
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fillText('σ', diagX, cy - beamH / 2 - 7);

  // Threshold value
  ctx.fillStyle = compliant ? '#22c55e' : '#ff6b6b';
  ctx.fillText(`${requiredKsi}k`, threshX - fs * 1.2, cy + beamH / 2 + fs + 4);

  // FAIL hotspot — pulsing glow at top extreme fiber
  if (!compliant) {
    const hx = cx, hy = cy - beamH / 2 + flangeH * 0.5;
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 20);
    glow.addColorStop(0, 'rgba(255,69,0,0.65)');
    glow.addColorStop(1, 'rgba(255,69,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(hx, hy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,69,0,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hx, hy, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ff6b6b';
    ctx.font = `bold ${fs}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('!', hx, hy + fs * 0.35);
    ctx.textAlign = 'left';
  }
}
