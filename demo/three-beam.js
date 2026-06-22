// Three.js 3D I-beam visualization for the SCUGS step.
// Loaded dynamically; if Three.js (via import map / CDN) is unavailable,
// callers fall back to the 2D canvas renderer in scugs-demo.js.

let THREE = null;
let scene, camera, renderer, beam, rafId;
let ready = false;

export async function initBeam(container) {
  if (ready) return true;
  if (!container) return false;
  try {
    THREE = await import('three');
  } catch (e) {
    console.warn('⚠️ Three.js unavailable, falling back to 2D SCUGS:', e.message);
    return false;
  }

  const w = container.clientWidth || 360;
  const h = container.clientHeight || 200;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(1.6, 1.4, 3);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.borderRadius = '8px';
  container.appendChild(renderer.domElement);

  // I-beam cross-section extruded along Z
  const s = new THREE.Shape();
  s.moveTo(-0.2, -0.4); s.lineTo(0.2, -0.4); s.lineTo(0.2, -0.3);
  s.lineTo(0.4, -0.3); s.lineTo(0.4, 0.3); s.lineTo(0.2, 0.3);
  s.lineTo(0.2, 0.4); s.lineTo(-0.2, 0.4); s.lineTo(-0.2, 0.3);
  s.lineTo(-0.4, 0.3); s.lineTo(-0.4, -0.3); s.lineTo(-0.2, -0.3);
  s.closePath();
  const geometry = new THREE.ExtrudeGeometry(s, { steps: 1, depth: 1.6, bevelEnabled: false });
  geometry.center();
  const material = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.45, roughness: 0.45 });
  beam = new THREE.Mesh(geometry, material);
  scene.add(beam);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a3c, 0.6);
  rim.position.set(-2, -1, -2);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x404048, 1));

  const animate = () => {
    rafId = requestAnimationFrame(animate);
    if (beam) beam.rotation.y += 0.006;
    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener('resize', onResize);
  ready = true;
  return true;
}

function onResize() {
  if (!renderer || !camera) return;
  const c = renderer.domElement.parentElement;
  if (!c) return;
  const w = c.clientWidth, h = c.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

export function setBeamColor(compliant) {
  if (!beam || !THREE) return;
  beam.material.color.set(compliant ? 0x22c55e : 0xef4444);
  beam.material.emissive = new THREE.Color(compliant ? 0x0c3a1c : 0x3a0c0c);
}

export function isBeamReady() {
  return ready;
}
