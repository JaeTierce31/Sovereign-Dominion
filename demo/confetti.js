// Lightweight confetti burst — no dependencies, self-cleaning canvas.
export function launchConfetti() {
  if (typeof document === 'undefined') return;
  // Respect reduced-motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '999'
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = window.innerWidth, H = window.innerHeight;
  const colors = ['#ff4500', '#ffaa00', '#22c55e', '#1E3A8A', '#FFD700', '#e63939'];
  const particles = Array.from({ length: 90 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4,
    y: -10 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 3 + 2,
    size: Math.random() * 6 + 3,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  let frame = 0;
  const maxFrames = 220;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.rot += p.vrot;
      if (p.y < H + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    frame++;
    if (alive && frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(draw);
}
