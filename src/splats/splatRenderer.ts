import { SplatData } from './plyLoader';

export class SplatRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(data: SplatData, viewMatrix: Float32Array) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < data.count; i++) {
      const x = data.positions[i * 3];
      const y = data.positions[i * 3 + 1];
      const z = data.positions[i * 3 + 2];

      const clipX = viewMatrix[0] * x + viewMatrix[4] * y + viewMatrix[8] * z + viewMatrix[12];
      const clipY = viewMatrix[1] * x + viewMatrix[5] * y + viewMatrix[9] * z + viewMatrix[13];
      const clipW = viewMatrix[3] * x + viewMatrix[7] * y + viewMatrix[11] * z + viewMatrix[15];

      if (clipW <= 0) continue;

      const ndcX = clipX / clipW;
      const ndcY = clipY / clipW;
      const screenX = (ndcX * 0.5 + 0.5) * this.canvas.width;
      const screenY = (1 - (ndcY * 0.5 + 0.5)) * this.canvas.height;

      const r = Math.floor(data.colors[i * 3] * 255);
      const g = Math.floor(data.colors[i * 3 + 1] * 255);
      const b = Math.floor(data.colors[i * 3 + 2] * 255);
      const a = data.opacities[i];

      this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      this.ctx.fillRect(screenX, screenY, 2, 2);
    }
  }
}
