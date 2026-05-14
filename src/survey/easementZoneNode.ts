import * as THREE from 'three';

export interface EasementZone {
  id: string;
  vertices: { x: number; z: number }[];
  type: 'utility' | 'drainage' | 'access' | 'conservation';
  widthFt: number;
}

export function createEasementMesh(zone: EasementZone): THREE.Mesh {
  const shape = new THREE.Shape();
  if (zone.vertices.length > 0) {
    shape.moveTo(zone.vertices[0].x, zone.vertices[0].z);
    for (let i = 1; i < zone.vertices.length; i++) {
      shape.lineTo(zone.vertices[i].x, zone.vertices[i].z);
    }
    shape.closePath();
  }

  const geometry = new THREE.ShapeGeometry(shape);
  const colorMap: Record<string, number> = {
    utility: 0xff8800,
    drainage: 0x0088ff,
    access: 0x88ff00,
    conservation: 0x00ff88,
  };

  const material = new THREE.MeshBasicMaterial({
    color: colorMap[zone.type] ?? 0xffffff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.userData = { easementId: zone.id, type: zone.type };
  return mesh;
}
