use wasm_bindgen::prelude::*;

/// Merkle Mountain Range beam compliance logger.
/// Appends compliance proofs to an append-only MMR structure.
#[wasm_bindgen]
pub struct WasmBeamLogger {
    api_url: String,
    leaves: Vec<[u8; 32]>,
}

#[wasm_bindgen]
impl WasmBeamLogger {
    #[wasm_bindgen(constructor)]
    pub fn new(api_url: &str) -> WasmBeamLogger {
        WasmBeamLogger {
            api_url: api_url.to_string(),
            leaves: Vec::new(),
        }
    }

    /// Append a beam compliance entry to the MMR.
    /// Returns the new MMR root as 32 bytes.
    pub fn log_beam_compliance(
        &mut self,
        beam_id: &str,
        proof: &[u8],
        _measurement_yield: u64,
        _measurement_elasticity: u64,
        color_seal: &str,
    ) -> Vec<u8> {
        // Build leaf: hash of (beam_id || proof_commitment || color)
        let mut leaf = [0u8; 32];
        for (i, b) in beam_id.bytes().enumerate() {
            leaf[i % 32] ^= b;
        }
        if proof.len() >= 32 {
            for i in 0..32 {
                leaf[i] ^= proof[i];
            }
        }
        for (i, b) in color_seal.bytes().enumerate() {
            leaf[(i + 16) % 32] ^= b;
        }
        self.leaves.push(leaf);

        // Compute MMR root via iterative hash-merging
        self.compute_root()
    }

    fn compute_root(&self) -> Vec<u8> {
        if self.leaves.is_empty() {
            return vec![0u8; 32];
        }
        let mut peaks: Vec<[u8; 32]> = Vec::new();
        for leaf in &self.leaves {
            let mut node = *leaf;
            let mut carry = Some(node);
            let mut i = 0;
            while let Some(c) = carry {
                if i < peaks.len() {
                    // Merge with existing peak
                    node = merge_nodes(&peaks[i], &c);
                    peaks[i] = [0u8; 32]; // clear
                    carry = Some(node);
                    i += 1;
                } else {
                    peaks.push(c);
                    carry = None;
                }
            }
        }
        // Bag peaks right-to-left
        let mut root = peaks[peaks.len() - 1];
        for peak in peaks[..peaks.len() - 1].iter().rev() {
            root = merge_nodes(peak, &root);
        }
        root.to_vec()
    }
}

fn merge_nodes(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut result = [0u8; 32];
    for i in 0..32 {
        // Simple hash-like combination (production: use SHA-256 or Poseidon)
        result[i] = left[i].wrapping_add(right[i]).rotate_left(3) ^ right[(i + 7) % 32];
    }
    result
}
