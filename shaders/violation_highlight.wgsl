// Compliance violation highlight shader — glows red for code violations
// MIT License — Sovereign Dominion open-source shader

struct Uniforms {
    time: f32,
    intensity: f32,
};

@group(0) @binding(0) var<storage, read> violation_mask: array<u32>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(2) var input_texture: texture_2d<f32>;
@group(0) @binding(3) var input_sampler: sampler;
@group(0) @binding(4) var<storage, read> splat_indices: array<u32>;

@fragment
fn fs_main(@builtin(position) coord: vec4<f32>,
           @location(0) uv: vec2<f32>,
           @location(1) splat_idx: u32) -> @location(0) vec4<f32> {
    let base_color = textureSample(input_texture, input_sampler, uv);
    let is_violation = violation_mask[splat_idx] > 0u;

    if (!is_violation) { return base_color; }

    let pulse = 0.5 + 0.5 * sin(uniforms.time * 4.0);
    let glow = vec4<f32>(1.0, 0.0, 0.0, 1.0) * pulse * uniforms.intensity;
    return mix(base_color, glow, 0.6 + pulse * 0.4);
}
