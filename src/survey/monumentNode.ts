import * as THREE from 'three';

export interface Monument {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'iron_pin' | 'concrete_monument' | 'pk_nail' | 'brass_cap';
  description: string;
  found: boolean;
}

export function createMonumentMesh(monument: Monument): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
  const material = new THREE.MeshStandardMaterial({
    color: monument.found ? 0xffd700 : 0x888888,
    metalness: 0.8,
    roughness: 0.2,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(monument.position.x, monument.position.y, monument.position.z);
  mesh.userData = { monumentId: monument.id, type: monument.type, found: monument.found };
  return mesh;
}
