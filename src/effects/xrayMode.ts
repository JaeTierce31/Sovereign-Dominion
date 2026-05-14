import * as THREE from 'three';

export interface UtilityLine {
  type: 'water' | 'gas' | 'electric' | 'sewer' | 'telecom';
  depth: number;
  path: { x: number; y: number; z: number }[];
  color: string;
}

const UTILITY_COLORS: Record<string, number> = {
  water: 0x0000ff,
  gas: 0xffff00,
  electric: 0xff0000,
  sewer: 0x00ff00,
  telecom: 0xff8800,
};

export function createXRayOverlay(utilities: UtilityLine[], scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  group.name = 'xray-overlay';

  for (const util of utilities) {
    const points = util.path.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: UTILITY_COLORS[util.type] ?? 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);
  }

  scene.add(group);
  return group;
}

export function toggleXRayMode(group: THREE.Group, enabled: boolean) {
  group.visible = enabled;
}
