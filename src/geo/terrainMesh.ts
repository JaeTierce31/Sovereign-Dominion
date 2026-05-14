import * as THREE from 'three';

export function buildTerrainMesh(
  elevationData: Float32Array,
  width: number,
  height: number,
  scaleX = 1,
  scaleY = 1,
  scaleZ = 0.0001
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(
    width * scaleX,
    height * scaleY,
    width - 1,
    height - 1
  );

  const posAttr = geometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setZ(i, elevationData[i] * scaleZ);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x8fbc8f,
    wireframe: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
