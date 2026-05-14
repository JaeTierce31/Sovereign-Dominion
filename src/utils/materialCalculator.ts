export function calcBlockCount(lengthFt: number, heightFt: number, blockWIn = 12, blockHIn = 6): number {
  const wFt = blockWIn / 12;
  const hFt = blockHIn / 12;
  const perCourse = Math.ceil(lengthFt / wFt);
  const courses = Math.ceil(heightFt / hFt);
  return perCourse * courses;
}

export function monteCarloWalledBlocks(
  lengthFt: number, heightFt: number,
  blockWIn = 12, blockHIn = 6,
  curveFactor = 1.0, samples = 1000
): number {
  const base = calcBlockCount(lengthFt, heightFt, blockWIn, blockHIn);
  let simTotal = 0;
  for (let i = 0; i < samples; i++) {
    const effLen = lengthFt * (1 + (Math.random() - 0.5) * (curveFactor - 1) * 0.15);
    simTotal += calcBlockCount(effLen, heightFt, blockWIn, blockHIn);
  }
  const avg = simTotal / samples;
  return Math.ceil(avg * 1.05);
}

export function mulchVolumeFromPolygon(
  polygon: { x: number; y: number }[],
  depthInches: number
): { area: number; bags: number; cubicYards: number } {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
  }
  area = Math.abs(area) / 2;
  const volume = area * (depthInches / 12) * 1.1;
  return { area, bags: Math.ceil(volume / 2), cubicYards: volume / 27 };
}
