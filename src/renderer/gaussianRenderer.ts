import { RadixSortKernel } from 'webgpu-radix-sort';
import { SplatData } from '../splats/plyLoader';
import { getDepthTexture } from '../mobile/lidarSession';

const SHADER_CODE = /* wgsl */ `
struct Uniforms { view_proj: mat4x4<f32>; num_splats: u32; };
struct Splat { pos: vec3<f32>; scale: vec3<f32>; rot: vec4<f32>; color: vec3<f32>; alpha: f32; };

@group(0) @binding(0) var<storage> splats: array<f32>;
@group(0) @binding(1) var<storage> indices: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;
@group(0) @binding(3) var depth_tex: texture_2d<f32>;
@group(0) @binding(4) var depth_sampler: sampler;
@group(0) @binding(5) var<storage> violation_mask: array<u32>;

@vertex fn vert_main(@builtin(vertex_index) vid: u32) -> @builtin(position) vec4<f32> {
    var pos = array(vec2<f32>(-1,-1), vec2<f32>(3,-1), vec2<f32>(-1,3));
    return vec4<f32>(pos[vid], 0.0, 1.0);
}

const ALPHA_THRESHOLD: f32 = 1.0 / 255.0;

@fragment fn frag_main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let screen_uv = coord.xy / vec2<f32>(textureDimensions(depth_tex));
    let real_depth = textureSample(depth_tex, depth_sampler, screen_uv).r;
    var color = vec4<f32>(0.0, 0.0, 0.0, 0.0);

    for (var i: u32 = 0u; i < uniforms.num_splats; i++) {
        let idx = indices[i];
        let off = idx * 14u;
        let pos = vec3<f32>(splats[off], splats[off+1], splats[off+2]);
        let clip = uniforms.view_proj * vec4<f32>(pos, 1.0);
        let ndc_z = clip.z / clip.w;
        if (ndc_z > real_depth + 0.02) { continue; }

        let alpha = splats[off+13];
        if (alpha < ALPHA_THRESHOLD) { continue; }

        let splat_color = vec3<f32>(splats[off+10], splats[off+11], splats[off+12]);
        let contrib = alpha * splat_color;

        if (violation_mask[idx] > 0u) {
            color += vec4<f32>(contrib * vec3<f32>(1.0, 0.1, 0.1), alpha * 0.6);
        } else {
            color += vec4<f32>(contrib, alpha);
        }
        color = vec4<f32>(color.rgb * (1.0 - color.a) + contrib, color.a + alpha * (1.0 - color.a));
        if (color.a > 0.99) { break; }
    }
    return color;
}
`;

export class GaussianRenderer {
  private device: GPUDevice | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private splatBuffer: GPUBuffer | null = null;
  private indexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private violationBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private sortKernel: RadixSortKernel | null = null;
  private numSplats = 0;

  async init(device: GPUDevice, splatData: SplatData) {
    this.device = device;
    this.numSplats = splatData.count;

    const packed = new Float32Array(splatData.count * 14);
    for (let i = 0; i < splatData.count; i++) {
      const off = i * 14;
      packed.set(splatData.positions.subarray(i * 3, i * 3 + 3), off);
      packed.set(splatData.scales.subarray(i * 3, i * 3 + 3), off + 3);
      packed.set(splatData.rotations.subarray(i * 4, i * 4 + 4), off + 6);
      packed.set(splatData.colors.subarray(i * 3, i * 3 + 3), off + 10);
      packed[off + 13] = splatData.opacities[i];
    }

    this.splatBuffer = device.createBuffer({
      size: packed.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.splatBuffer, 0, packed);

    this.indexBuffer = device.createBuffer({
      size: splatData.count * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    this.uniformBuffer = device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.violationBuffer = device.createBuffer({
      size: splatData.count * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.violationBuffer, 0, new Uint32Array(splatData.count));

    this.sortKernel = await RadixSortKernel.create(device);

    const module = device.createShaderModule({ code: SHADER_CODE });
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vert_main' },
      fragment: {
        module, entryPoint: 'frag_main',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  render(viewProj: Float32Array) {
    if (!this.device || !this.pipeline) return;
    this.device.queue.writeBuffer(this.uniformBuffer!, 0, viewProj);

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = (this.device as any).context.getCurrentTexture().createView();
    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [{ view: textureView, loadOp: 'clear', storeOp: 'store' }],
    });
    pass.setPipeline(this.pipeline!);
    pass.setBindGroup(0, this.bindGroup!);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  updateViolations(mask: Uint32Array) {
    this.device?.queue.writeBuffer(this.violationBuffer!, 0, mask);
  }
}
