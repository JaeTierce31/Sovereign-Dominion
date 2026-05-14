// 3DGS splat rendering with LiDAR depth occlusion
// MIT License — Sovereign Dominion open-source shader

struct Uniforms {
    view_proj: mat4x4<f32>,
    num_splats: u32,
    screen_width: f32,
    screen_height: f32,
    _pad: f32,
};

@group(0) @binding(0) var<storage, read> splat_data: array<f32>;
@group(0) @binding(1) var<storage, read> sorted_indices: array<u32>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;
@group(0) @binding(3) var depth_texture: texture_2d<f32>;
@group(0) @binding(4) var depth_sampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) splat_idx: u32,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOutput {
    let splat_idx = sorted_indices[iid];
    let base = splat_idx * 14u;

    let pos_world = vec3<f32>(splat_data[base], splat_data[base + 1u], splat_data[base + 2u]);
    let color = vec3<f32>(splat_data[base + 10u], splat_data[base + 11u], splat_data[base + 12u]);
    let alpha = splat_data[base + 13u];

    let clip = uniforms.view_proj * vec4<f32>(pos_world, 1.0);
    let quad_verts = array(vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0),
                           vec2<f32>(-1.0,  1.0), vec2<f32>(1.0,  1.0));
    let scale_screen = 0.008;

    var out: VertexOutput;
    out.position = clip + vec4<f32>(quad_verts[vid] * scale_screen, 0.0, 0.0);
    out.color = vec4<f32>(color, alpha);
    out.uv = quad_verts[vid] * 0.5 + 0.5;
    out.splat_idx = splat_idx;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let uv = in.position.xy / vec2<f32>(uniforms.screen_width, uniforms.screen_height);
    let lidar_depth = textureSample(depth_texture, depth_sampler, uv).r;

    let ndc_depth = in.position.z / in.position.w;
    if (ndc_depth > lidar_depth + 0.01) { discard; }

    let r2 = dot(in.uv - 0.5, in.uv - 0.5) * 4.0;
    let gaussian = exp(-r2 * 2.0);

    return vec4<f32>(in.color.rgb, in.color.a * gaussian);
}
