/* tslint:disable */
/* eslint-disable */

/**
 * Beam structural measurement
 */
export class BeamMeasurement {
    free(): void;
    [Symbol.dispose](): void;
    constructor(yield_strength: bigint, elasticity: bigint, deflection_ratio: bigint, fire_rating: bigint);
    deflection_ratio: bigint;
    elasticity: bigint;
    fire_rating: bigint;
    yield_strength: bigint;
}

/**
 * Beam compliance requirements
 */
export class BeamRequirements {
    free(): void;
    [Symbol.dispose](): void;
    constructor(min_yield_strength: bigint, min_elasticity: bigint, max_deflection: bigint, min_fire_rating: bigint);
    max_deflection: bigint;
    min_elasticity: bigint;
    min_fire_rating: bigint;
    min_yield_strength: bigint;
}

/**
 * Generate a QSSM compliance proof for beam structural data.
 * Returns 64 bytes: [32-byte commitment || 32-byte witness]
 */
export function wasm_generate_beam_proof(measurement: BeamMeasurement, requirements: BeamRequirements): Uint8Array;

/**
 * Verify a QSSM beam compliance proof.
 */
export function wasm_verify_beam_proof(proof: Uint8Array, measurement: BeamMeasurement, requirements: BeamRequirements): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_beammeasurement_free: (a: number, b: number) => void;
    readonly __wbg_get_beammeasurement_deflection_ratio: (a: number) => bigint;
    readonly __wbg_get_beammeasurement_elasticity: (a: number) => bigint;
    readonly __wbg_get_beammeasurement_fire_rating: (a: number) => bigint;
    readonly __wbg_get_beammeasurement_yield_strength: (a: number) => bigint;
    readonly __wbg_set_beammeasurement_deflection_ratio: (a: number, b: bigint) => void;
    readonly __wbg_set_beammeasurement_elasticity: (a: number, b: bigint) => void;
    readonly __wbg_set_beammeasurement_fire_rating: (a: number, b: bigint) => void;
    readonly __wbg_set_beammeasurement_yield_strength: (a: number, b: bigint) => void;
    readonly beammeasurement_new: (a: bigint, b: bigint, c: bigint, d: bigint) => number;
    readonly wasm_generate_beam_proof: (a: number, b: number) => [number, number];
    readonly wasm_verify_beam_proof: (a: number, b: number, c: number, d: number) => number;
    readonly __wbg_set_beamrequirements_max_deflection: (a: number, b: bigint) => void;
    readonly __wbg_set_beamrequirements_min_elasticity: (a: number, b: bigint) => void;
    readonly __wbg_set_beamrequirements_min_fire_rating: (a: number, b: bigint) => void;
    readonly __wbg_set_beamrequirements_min_yield_strength: (a: number, b: bigint) => void;
    readonly __wbg_get_beamrequirements_max_deflection: (a: number) => bigint;
    readonly __wbg_get_beamrequirements_min_elasticity: (a: number) => bigint;
    readonly __wbg_get_beamrequirements_min_fire_rating: (a: number) => bigint;
    readonly __wbg_get_beamrequirements_min_yield_strength: (a: number) => bigint;
    readonly beamrequirements_new: (a: bigint, b: bigint, c: bigint, d: bigint) => number;
    readonly __wbg_beamrequirements_free: (a: number, b: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
