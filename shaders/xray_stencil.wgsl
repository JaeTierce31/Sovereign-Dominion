// X-ray underground utility visualization shader
// MIT License — Sovereign Dominion open-source shader

struct XRayUniforms {
    depth_scale: f32,
    opacity: f32,
    color_r: f32,
    color_g: f32,
    color_b: f32,
    _pad0: f32,
    _pad1: f32,
    _pad2: f32,
};

@group(0) @binding(0) var<uniform> uniforms: XRayUniforms;
@group(0) @binding(1) var depth_tex: texture_2d<f32>;
@group(0) @binding(2) var depth_sampler: sampler;

@fragment
fn fs_main(@builtin(position) coord: vec4<f32>,
           @location(0) world_pos: vec3<f32>,
           @location(1) utility_depth: f32) -> @location(0) vec4<f32> {
    let uv = coord.xy / vec2<f32>(textureDimensions(depth_tex));
    let surface_depth = textureSample(depth_tex, depth_sampler, uv).r;

    if (utility_depth * uniforms.depth_scale > surface_depth) { discard; }

    let depth_fade = 1.0 - saturate(utility_depth / 3.0);
    let scan_line = 0.5 + 0.5 * sin(world_pos.y * 20.0 + coord.x * 0.5);
    let alpha = uniforms.opacity * depth_fade * (0.7 + scan_line * 0.3);

    return vec4<f32>(uniforms.color_r, uniforms.color_g, uniforms.color_b, alpha);
}
