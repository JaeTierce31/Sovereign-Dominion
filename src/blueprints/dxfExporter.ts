export interface DXFElement {
  type: 'wall' | 'patio' | 'deck';
  vertices: { x: number; y: number }[];
  layer: string;
}

export function exportDXF(elements: DXFElement[], projectName: string): string {
  const lines: string[] = [];

  lines.push('0\nSECTION\n2\nHEADER\n0\nENDSEC');
  lines.push('0\nSECTION\n2\nTABLES\n0\nENDSEC');
  lines.push('0\nSECTION\n2\nENTITIES');

  for (const el of elements) {
    if (el.vertices.length >= 2) {
      for (let i = 0; i < el.vertices.length - 1; i++) {
        lines.push('0\nLINE');
        lines.push(`8\n${el.layer}`);
        lines.push(`10\n${el.vertices[i].x}`);
        lines.push(`20\n${el.vertices[i].y}`);
        lines.push(`30\n0.0`);
        lines.push(`11\n${el.vertices[i + 1].x}`);
        lines.push(`21\n${el.vertices[i + 1].y}`);
        lines.push(`31\n0.0`);
      }
    }
  }

  lines.push('0\nENDSEC\n0\nEOF');
  return lines.join('\n');
}

export function downloadDXF(dxfContent: string, filename = 'project.dxf') {
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
