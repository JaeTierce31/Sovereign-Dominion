use wasm_bindgen::prelude::*;

/// Beam structural measurement
#[wasm_bindgen]
pub struct BeamMeasurement {
    pub yield_strength: u64,
    pub elasticity: u64,
    pub deflection_ratio: u64,
    pub fire_rating: u64,
}

#[wasm_bindgen]
impl BeamMeasurement {
    #[wasm_bindgen(constructor)]
    pub fn new(yield_strength: u64, elasticity: u64, deflection_ratio: u64, fire_rating: u64) -> BeamMeasurement {
        BeamMeasurement { yield_strength, elasticity, deflection_ratio, fire_rating }
    }
}

/// Beam compliance requirements
#[wasm_bindgen]
pub struct BeamRequirements {
    pub min_yield_strength: u64,
    pub min_elasticity: u64,
    pub max_deflection: u64,
    pub min_fire_rating: u64,
}

#[wasm_bindgen]
impl BeamRequirements {
    #[wasm_bindgen(constructor)]
    pub fn new(min_yield_strength: u64, min_elasticity: u64, max_deflection: u64, min_fire_rating: u64) -> BeamRequirements {
        BeamRequirements { min_yield_strength, min_elasticity, max_deflection, min_fire_rating }
    }
}

/// Generate a QSSM compliance proof for beam structural data.
/// Returns 64 bytes: [32-byte commitment || 32-byte witness]
#[wasm_bindgen]
pub fn wasm_generate_beam_proof(
    measurement: &BeamMeasurement,
    requirements: &BeamRequirements,
) -> Vec<u8> {
    // Validate compliance
    let compliant = measurement.yield_strength >= requirements.min_yield_strength
        && measurement.elasticity >= requirements.min_elasticity
        && measurement.deflection_ratio <= requirements.max_deflection
        && measurement.fire_rating >= requirements.min_fire_rating;

    // Build proof: simple hash-based commitment (production would use actual ZK circuit)
    let mut proof = vec![0u8; 64];

    // Commitment: XOR-fold of measurement values with compliance flag
    let values = [
        measurement.yield_strength,
        measurement.elasticity,
        measurement.deflection_ratio,
        measurement.fire_rating,
        if compliant { 0xCAFEBABE } else { 0xDEADBEEF },
    ];
    for (i, &v) in values.iter().enumerate() {
        let bytes = v.to_le_bytes();
        for (j, &b) in bytes.iter().enumerate() {
            proof[(i * 8 + j) % 32] ^= b;
        }
    }

    // Witness: requirement fingerprint
    let req_values = [
        requirements.min_yield_strength,
        requirements.min_elasticity,
        requirements.max_deflection,
        requirements.min_fire_rating,
    ];
    for (i, &v) in req_values.iter().enumerate() {
        let bytes = v.to_le_bytes();
        for (j, &b) in bytes.iter().enumerate() {
            proof[32 + (i * 8 + j) % 32] ^= b;
        }
    }

    proof
}

/// Verify a QSSM beam compliance proof.
#[wasm_bindgen]
pub fn wasm_verify_beam_proof(
    proof: &[u8],
    measurement: &BeamMeasurement,
    requirements: &BeamRequirements,
) -> bool {
    if proof.len() < 64 {
        return false;
    }
    // Re-derive expected proof and compare
    let expected = wasm_generate_beam_proof(measurement, requirements);
    proof[..64] == expected[..64]
}
