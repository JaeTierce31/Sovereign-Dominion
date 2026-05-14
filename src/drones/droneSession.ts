export interface DroneFrame {
  imageData: ImageData;
  altitude: number;
  gps: { lat: number; lng: number };
  timestamp: number;
  gimbalPitch: number;
}

export interface ProgressDelta {
  changedPixels: number;
  percentComplete: number;
  heatmap: Float32Array;
}

export class DroneSession {
  private baselineFrame: ImageData | null = null;
  private frames: DroneFrame[] = [];

  setBaseline(frame: DroneFrame) {
    this.baselineFrame = frame.imageData;
  }

  addFrame(frame: DroneFrame): ProgressDelta {
    this.frames.push(frame);

    if (!this.baselineFrame) {
      return { changedPixels: 0, percentComplete: 0, heatmap: new Float32Array(0) };
    }

    const w = frame.imageData.width;
    const h = frame.imageData.height;
    const heatmap = new Float32Array(w * h);
    let changed = 0;

    for (let i = 0; i < w * h; i++) {
      const dr = frame.imageData.data[i * 4] - this.baselineFrame.data[i * 4];
      const dg = frame.imageData.data[i * 4 + 1] - this.baselineFrame.data[i * 4 + 1];
      const db = frame.imageData.data[i * 4 + 2] - this.baselineFrame.data[i * 4 + 2];
      const diff = Math.sqrt(dr * dr + dg * dg + db * db);
      heatmap[i] = diff / 441.67;
      if (diff > 30) changed++;
    }

    return { changedPixels: changed, percentComplete: (changed / (w * h)) * 100, heatmap };
  }

  getFrameCount() { return this.frames.length; }
}
