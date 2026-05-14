// Radix sort for 3D Gaussian Splatting depth ordering
// MIT License — Sovereign Dominion open-source shader

struct SortUniforms {
    num_elements: u32,
    bit_shift: u32,
};

@group(0) @binding(0) var<storage, read> keys_in: array<f32>;
@group(0) @binding(1) var<storage, read_write> keys_out: array<f32>;
@group(0) @binding(2) var<storage, read> vals_in: array<u32>;
@group(0) @binding(3) var<storage, read_write> vals_out: array<u32>;
@group(0) @binding(4) var<storage, read_write> histogram: array<atomic<u32>>;
@group(0) @binding(5) var<uniform> uniforms: SortUniforms;

var<workgroup> local_hist: array<atomic<u32>, 256>;

@compute @workgroup_size(256)
fn count_pass(@builtin(global_invocation_id) gid: vec3<u32>,
              @builtin(local_invocation_index) lid: u32) {
    atomicStore(&local_hist[lid], 0u);
    workgroupBarrier();

    let idx = gid.x;
    if (idx < uniforms.num_elements) {
        let key_bits = bitcast<u32>(keys_in[idx]);
        let bucket = (key_bits >> uniforms.bit_shift) & 0xffu;
        atomicAdd(&local_hist[bucket], 1u);
    }
    workgroupBarrier();

    atomicAdd(&histogram[lid], atomicLoad(&local_hist[lid]));
}

@compute @workgroup_size(256)
fn scatter_pass(@builtin(global_invocation_id) gid: vec3<u32>) {
    let idx = gid.x;
    if (idx >= uniforms.num_elements) { return; }

    let key_bits = bitcast<u32>(keys_in[idx]);
    let bucket = (key_bits >> uniforms.bit_shift) & 0xffu;
    let dest = atomicAdd(&histogram[bucket], 1u);
    keys_out[dest] = keys_in[idx];
    vals_out[dest] = vals_in[idx];
}
