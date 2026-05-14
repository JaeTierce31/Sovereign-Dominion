import * as THREE from 'three';
import { SplatData } from '../splats/plyLoader';

export class WebGL2FallbackRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private points: THREE.Points | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.z = 3;
  }

  loadSplats(data: SplatData) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));

    const material = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.02,
      sizeAttenuation: true,
    });

    if (this.points) this.scene.remove(this.points);
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  render(viewMatrix: Float32Array) {
    this.camera.matrixWorldInverse.fromArray(viewMatrix);
    this.renderer.render(this.scene, this.camera);
  }
}
