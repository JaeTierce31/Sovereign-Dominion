export interface SplatData {
  positions: Float32Array;
  scales: Float32Array;
  rotations: Float32Array;
  colors: Float32Array;
  opacities: Float32Array;
  count: number;
}

export async function loadPLY(url: string): Promise<SplatData> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  const lines = text.split('\n');

  let vertexCount = 0;
  let headerEnd = 0;
  const properties: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('element vertex')) vertexCount = parseInt(line.split(' ')[2]);
    else if (line.startsWith('property float')) properties.push(line.split(' ')[2]);
    else if (line === 'end_header') { headerEnd = i + 1; break; }
  }

  const data: SplatData = {
    positions: new Float32Array(vertexCount * 3),
    scales: new Float32Array(vertexCount * 3),
    rotations: new Float32Array(vertexCount * 4),
    colors: new Float32Array(vertexCount * 3),
    opacities: new Float32Array(vertexCount),
    count: vertexCount,
  };

  const propMap: Record<string, { arr: Float32Array; stride: number; offset: number }> = {
    x: { arr: data.positions, stride: 3, offset: 0 },
    y: { arr: data.positions, stride: 3, offset: 1 },
    z: { arr: data.positions, stride: 3, offset: 2 },
    scale_0: { arr: data.scales, stride: 3, offset: 0 },
    scale_1: { arr: data.scales, stride: 3, offset: 1 },
    scale_2: { arr: data.scales, stride: 3, offset: 2 },
    rot_0: { arr: data.rotations, stride: 4, offset: 0 },
    rot_1: { arr: data.rotations, stride: 4, offset: 1 },
    rot_2: { arr: data.rotations, stride: 4, offset: 2 },
    rot_3: { arr: data.rotations, stride: 4, offset: 3 },
    f_dc_0: { arr: data.colors, stride: 3, offset: 0 },
    f_dc_1: { arr: data.colors, stride: 3, offset: 1 },
    f_dc_2: { arr: data.colors, stride: 3, offset: 2 },
    opacity: { arr: data.opacities, stride: 1, offset: 0 },
  };

  for (let i = 0; i < vertexCount; i++) {
    const parts = lines[headerEnd + i].trim().split(/\s+/).map(Number);
    for (let j = 0; j < properties.length; j++) {
      const mapping = propMap[properties[j]];
      if (mapping) mapping.arr[i * mapping.stride + mapping.offset] = parts[j];
    }
  }

  for (let i = 0; i < vertexCount * 3; i++) data.scales[i] = Math.exp(data.scales[i]);
  for (let i = 0; i < vertexCount; i++) data.opacities[i] = 1 / (1 + Math.exp(-data.opacities[i]));

  return data;
}
