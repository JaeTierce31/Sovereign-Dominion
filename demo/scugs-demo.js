// SCUGS Tier-1 Chromatic Gating Render
export function renderSCUGS(hexColor) {
  const canvas = document.getElementById('scugs-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth * 2;
  canvas.height = canvas.clientHeight * 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const color = hexToRgb(hexColor);
  const splats = [
    { x: 0.3, y: 0.4, r: 80, alpha: 0.9 },
    { x: 0.7, y: 0.5, r: 100, alpha: 0.8 },
    { x: 0.5, y: 0.3, r: 60, alpha: 0.95 }
  ];
  splats.forEach(s => {
    const gradient = ctx.createRadialGradient(
      s.x * canvas.width, s.y * canvas.height, 0,
      s.x * canvas.width, s.y * canvas.height, s.r
    );
    gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${s.alpha})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      s.x * canvas.width - s.r,
      s.y * canvas.height - s.r,
      s.r * 2,
      s.r * 2
    );
  });

  // Draw compliance label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${canvas.width * 0.04}px monospace`;
  ctx.fillText('SCUGS TIER-1 ● BEAM B-001 ● COMPLIANT', canvas.width * 0.05, canvas.height * 0.9);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 69, b: 0 };
}
