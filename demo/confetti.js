// Enhanced confetti burst — 150 particles with wobble physics + compliance seal overlay.
export function launchConfetti() {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  showSealOverlay();

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '998'
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = window.innerWidth, H = window.innerHeight;
  const colors = ['#ff4500', '#ffaa00', '#22c55e', '#635bff', '#FFD700', '#00aaff', '#e63939', '#76b900', '#ff69b4', '#00ffcc'];

  const particles = Array.from({ length: 150 }, (_, i) => ({
    x: W * (0.15 + Math.random() * 0.7),
    y: -12 - Math.random() * 70,
    vx: (Math.random() - 0.5) * 9,
    vy: Math.random() * 3.5 + 1.2,
    size: Math.random() * 7 + 2.5,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.28,
    color: colors[i % colors.length],
    shape: i % 3 === 0 ? 'circle' : 'rect',
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.03 + Math.random() * 0.08,
    drag: 0.99 + Math.random() * 0.005
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    particles.forEach(p => {
      p.wobble += p.wobbleSpeed;
      p.vx += Math.sin(p.wobble) * 0.045;
      p.vx *= p.drag;
      p.x += p.vx; p.y += p.vy; p.vy += 0.052; p.rot += p.vrot;
      if (p.y < H + 20) alive = true;
      const alpha = Math.min(1, Math.max(0, (H * 0.85 - p.y) / (H * 0.25)));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.6);
      }
      ctx.restore();
    });
    frame++;
    if (alive && frame < 320) requestAnimationFrame(draw);
    else canvas.remove();
  }
  requestAnimationFrame(draw);
}

function showSealOverlay() {
  const existing = document.getElementById('seal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'seal-overlay';
  overlay.innerHTML = `
    <div class="seal-inner">
      <div class="seal-eagle"><svg class="ic"><use href="#i-emblem"></use></svg></div>
      <div class="seal-title">COMPLIANCE SEAL ISSUED</div>
      <div class="seal-sub">Sovereign Dominion · Cryptographically Verified</div>
    </div>
  `;
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: '999', pointerEvents: 'none'
  });
  document.body.appendChild(overlay);

  // Inject animation keyframes if not already present
  if (!document.getElementById('seal-styles')) {
    const style = document.createElement('style');
    style.id = 'seal-styles';
    style.textContent = `
      #seal-overlay { animation: sealFadeIn 0.45s cubic-bezier(.22,1,.36,1) both; }
      @keyframes sealFadeIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
      @keyframes sealFadeOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(1.05); } }
      .seal-inner { text-align:center; padding:2rem 2.5rem; background:linear-gradient(135deg,rgba(34,197,94,0.14),rgba(255,69,0,0.08)); border:1px solid rgba(34,197,94,0.45); border-radius:18px; backdrop-filter:blur(14px); box-shadow:0 0 50px rgba(34,197,94,0.22),0 0 0 1px rgba(255,255,255,0.06); }
      .seal-eagle { font-size:2.8rem; color:#22c55e; margin-bottom:0.5rem; filter:drop-shadow(0 0 16px rgba(34,197,94,0.5)); animation:pulse 0.7s ease; }
      .seal-title { font-family:ui-monospace,monospace; font-size:1rem; font-weight:700; letter-spacing:0.14em; color:#22c55e; text-shadow:0 0 22px rgba(34,197,94,0.7); }
      .seal-sub { font-family:ui-monospace,monospace; font-size:0.68rem; opacity:0.55; margin-top:0.4rem; letter-spacing:0.06em; }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    overlay.style.animation = 'sealFadeOut 0.55s ease forwards';
    setTimeout(() => overlay.remove(), 550);
  }, 2400);
}
