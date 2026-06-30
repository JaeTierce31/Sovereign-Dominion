/* tslint:disable */
/* eslint-disable */

/**
 * Merkle Mountain Range beam compliance logger.
 * Appends compliance proofs to an append-only MMR structure.
 */
export class WasmBeamLogger {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Append a beam compliance entry to the MMR.
     * Returns the new MMR root as 32 bytes.
     */
    log_beam_compliance(beam_id: string, proof: Uint8Array, _measurement_yield: bigint, _measurement_elasticity: bigint, color_seal: string): Uint8Array;
    constructor(api_url: string);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmbeamlogger_free: (a: number, b: number) => void;
    readonly wasmbeamlogger_log_beam_compliance: (a: number, b: number, c: number, d: number, e: number, f: bigint, g: bigint, h: number, i: number) => [number, number];
    readonly wasmbeamlogger_new: (a: number, b: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
