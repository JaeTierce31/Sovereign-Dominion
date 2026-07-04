// Ed25519 signing adapter — real asymmetric, non-repudiable signatures.
//
// This is the one module that reaches for a platform crypto primitive (Node's
// native, synchronous Ed25519 via `node:crypto`). Isolating it here keeps the
// dependency in one place and makes this file the **KMS/HSM seam**: swap
// `createEd25519Signer` for a signer whose `sign()` calls a cloud KMS or an HSM
// and nothing else in the kernel changes — seal.js only ever sees the
// `{ alg, keyId, publicKey, sign(msg) }` interface.
//
// Ed25519 is a "pure" one-shot scheme (no pre-hash, no separate digest algo),
// so Node's API takes `null` for the algorithm argument. Signatures are 64
// bytes; the public key is exported as SPKI DER (44 bytes) and carried in the
// seal as hex, which is exactly what a remote verifier needs — no key registry
// required for the raw signature check (trust anchoring is a separate concern,
// handled by verifySeal's optional `trustedPublicKeys`).
//
// Honesty note: the *key management* is dev-grade — an ephemeral keypair is
// generated per process unless a PEM is supplied. Non-repudiation is only as
// strong as custody of the private key; production must hold it in a KMS/HSM
// with a rotation policy (ROADMAP §1 #4). The signature scheme itself is real.

import {
  generateKeyPairSync, createPrivateKey, createPublicKey,
  sign as nodeSign, verify as nodeVerify,
} from 'node:crypto';
import { hash } from './hash.js';

function spkiHex(publicKeyObj) {
  return publicKeyObj.export({ format: 'der', type: 'spki' }).toString('hex');
}

/**
 * Build an Ed25519 signer.
 * @param {object} [opts]
 * @param {string} [opts.privateKeyPem]  PKCS#8 PEM to load; otherwise an ephemeral key is generated.
 * @param {string} [opts.keyId]          override the derived key id.
 * @returns {{ alg:'ed25519', keyId:string, publicKey:string, sign:(msg:string|Uint8Array)=>string, exportPrivateKeyPem:()=>string }}
 */
export function createEd25519Signer(opts = {}) {
  let publicKeyObj, privateKeyObj;
  if (opts.privateKeyPem) {
    privateKeyObj = createPrivateKey(opts.privateKeyPem);
    publicKeyObj = createPublicKey(privateKeyObj);
  } else {
    ({ publicKey: publicKeyObj, privateKey: privateKeyObj } = generateKeyPairSync('ed25519'));
  }
  const publicKey = spkiHex(publicKeyObj);
  // A stable, public fingerprint of the key — safe to log, not the key itself.
  const keyId = opts.keyId || `ed25519:${hash(publicKey).slice(0, 16)}`;

  return Object.freeze({
    alg: 'ed25519',
    keyId,
    publicKey,
    sign(message) {
      const msg = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message);
      return nodeSign(null, msg, privateKeyObj).toString('hex');
    },
    exportPrivateKeyPem() {
      return privateKeyObj.export({ format: 'pem', type: 'pkcs8' }).toString();
    },
  });
}

/**
 * Verify an Ed25519 signature against a SPKI-DER-hex public key.
 * @param {string} publicKeyHex  SPKI DER, hex-encoded (as carried in a seal)
 * @param {string|Uint8Array} message
 * @param {string} signatureHex  64-byte signature, hex-encoded
 * @returns {boolean}  false on any malformed input — never throws.
 */
export function verifyEd25519(publicKeyHex, message, signatureHex) {
  try {
    const pub = createPublicKey({ key: Buffer.from(publicKeyHex, 'hex'), format: 'der', type: 'spki' });
    const msg = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message);
    return nodeVerify(null, msg, pub, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}
