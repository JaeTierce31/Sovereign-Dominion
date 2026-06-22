/* @ts-self-types="./qssm_rs.d.ts" */

/**
 * Beam structural measurement
 */
export class BeamMeasurement {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BeamMeasurementFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_beammeasurement_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    get deflection_ratio() {
        const ret = wasm.__wbg_get_beammeasurement_deflection_ratio(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {bigint}
     */
    get elasticity() {
        const ret = wasm.__wbg_get_beammeasurement_elasticity(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {bigint}
     */
    get fire_rating() {
        const ret = wasm.__wbg_get_beammeasurement_fire_rating(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {bigint}
     */
    get yield_strength() {
        const ret = wasm.__wbg_get_beammeasurement_yield_strength(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set deflection_ratio(arg0) {
        wasm.__wbg_set_beammeasurement_deflection_ratio(this.__wbg_ptr, arg0);
    }
    /**
     * @param {bigint} arg0
     */
    set elasticity(arg0) {
        wasm.__wbg_set_beammeasurement_elasticity(this.__wbg_ptr, arg0);
    }
    /**
     * @param {bigint} arg0
     */
    set fire_rating(arg0) {
        wasm.__wbg_set_beammeasurement_fire_rating(this.__wbg_ptr, arg0);
    }
    /**
     * @param {bigint} arg0
     */
    set yield_strength(arg0) {
        wasm.__wbg_set_beammeasurement_yield_strength(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) BeamMeasurement.prototype[Symbol.dispose] = BeamMeasurement.prototype.free;

/**
 * Beam compliance requirements
 */
export class BeamRequirements {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BeamRequirementsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_beamrequirements_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    get max_deflection() {
        const ret = wasm.__wbg_get_beamrequirements_max_deflection(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {bigint}
     */
    get min_elasticity() {
        const ret = wasm.__wbg_get_beamrequirements_min_elasticity(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {bigint}
     */
    get min_fire_rating() {
        const ret = wasm.__wbg_get_beamrequirements_min_fire_rating(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {bigint}
     */
    get min_yield_strength() {
        const ret = wasm.__wbg_get_beamrequirements_min_yield_strength(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set max_deflection(arg0) {
        wasm.__wbg_set_beamrequirements_max_deflection(this.__wbg_ptr, arg0);
    }
    /**
     * @param {bigint} arg0
     */
    set min_elasticity(arg0) {
        wasm.__wbg_set_beamrequirements_min_elasticity(this.__wbg_ptr, arg0);
    }
    /**
     * @param {bigint} arg0
     */
    set min_fire_rating(arg0) {
        wasm.__wbg_set_beamrequirements_min_fire_rating(this.__wbg_ptr, arg0);
    }
    /**
     * @param {bigint} arg0
     */
    set min_yield_strength(arg0) {
        wasm.__wbg_set_beamrequirements_min_yield_strength(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) BeamRequirements.prototype[Symbol.dispose] = BeamRequirements.prototype.free;

/**
 * Generate a QSSM compliance proof for beam structural data.
 * Returns 64 bytes: [32-byte commitment || 32-byte witness]
 * @param {BeamMeasurement} measurement
 * @param {BeamRequirements} requirements
 * @returns {Uint8Array}
 */
export function wasm_generate_beam_proof(measurement, requirements) {
    _assertClass(measurement, BeamMeasurement);
    _assertClass(requirements, BeamRequirements);
    const ret = wasm.wasm_generate_beam_proof(measurement.__wbg_ptr, requirements.__wbg_ptr);
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
}

/**
 * Verify a QSSM beam compliance proof.
 * @param {Uint8Array} proof
 * @param {BeamMeasurement} measurement
 * @param {BeamRequirements} requirements
 * @returns {boolean}
 */
export function wasm_verify_beam_proof(proof, measurement, requirements) {
    const ptr0 = passArray8ToWasm0(proof, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(measurement, BeamMeasurement);
    _assertClass(requirements, BeamRequirements);
    const ret = wasm.wasm_verify_beam_proof(ptr0, len0, measurement.__wbg_ptr, requirements.__wbg_ptr);
    return ret !== 0;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_ea4887a5f8f9a9db: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./qssm_rs_bg.js": import0,
    };
}

const BeamMeasurementFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_beammeasurement_free(ptr, 1));
const BeamRequirementsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_beamrequirements_free(ptr, 1));

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('qssm_rs_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
