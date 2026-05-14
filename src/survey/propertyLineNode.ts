import * as THREE from 'three';

export interface PropertyLine {
  id: string;
  vertices: { lat: number; lng: number }[];
  bearing: number;
  length: number;
  type: 'boundary' | 'easement' | 'setback';
}

export function createPropertyLineMesh(
  line: PropertyLine,
  originLat: number,
  originLng: number,
  scale = 111320
): THREE.Line {
  const points = line.vertices.map(v => {
    const x = (v.lng - originLng) * scale * Math.cos((originLat * Math.PI) / 180);
    const y = 0;
    const z = -(v.lat - originLat) * scale;
    return new THREE.Vector3(x, y, z);
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const colorMap: Record<string, number> = {
    boundary: 0xffff00,
    easement: 0xff8800,
    setback: 0x00ff88,
  };
  const material = new THREE.LineBasicMaterial({
    color: colorMap[line.type] ?? 0xffffff,
    linewidth: 2,
  });

  const mesh = new THREE.Line(geometry, material);
  mesh.userData = { propertyLineId: line.id, type: line.type };
  return mesh;
}
