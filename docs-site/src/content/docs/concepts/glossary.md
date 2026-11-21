---
title: Glossary
description: "Plain definitions of the terms Conseal uses: AEK, Secret Key, AES-256-GCM, PBKDF2, HKDF, BIP-39, ECDH, ECDSA, JWK, key wrapping and the circle."
sidebar:
    order: 4
---

Quick reference for every acronym and term used in conseal.

## AEK

**Account Encryption Key**

The root AES-256-GCM key of an account, shared by all its devices. `initCircle` derives it from the [mnemonic](/docs/core/mnemonic/); [`init()`](/docs/core/init/) unwraps it on a device and stores it in IndexedDB as a non-extractable `CryptoKey`. All application data is encrypted with the AEK. It leaves a device only wrapped: under a PBKDF2-derived key for the server, or sealed to a joining device's ephemeral key, so the server sees only ciphertext it cannot read.

**Derived / used by:** `initCircle`, `recoverWithMnemonic`, `init`, `wrapKey`, `seal`, `unseal`

## AEK commitment

SHA-256 of the raw AEK, published when the circle is created, so that a joining device can detect a substituted key. A channel has a commitment of its own.

**Made by:** `initCircle`, `createChannel`  
**Checked by:** `createJoinRequest`, `finalizeJoin`

## AES-256-GCM

**Advanced Encryption Standard, 256-bit key, Galois/Counter Mode**

The symmetric cipher used for all data encryption in conseal. AES operates on 128-bit blocks; a 256-bit key makes exhaustive-search attacks computationally infeasible. GCM is an _authenticated_ mode that simultaneously encrypts and produces an integrity tag — any tampering causes decryption to fail with an explicit error rather than silently returning corrupt data.

**Used by:** [`seal`](/docs/core/aes/), `unseal`, `sealMessage`, [`sealEnvelope`](/docs/core/envelope/)

## BIP-39

**Bitcoin Improvement Proposal 39**

A standard that encodes binary entropy as a sequence of common English words drawn from a fixed 2,048-word list. The resulting phrase is far easier to write down and transcribe accurately than a raw hex key. Conseal uses 24-word phrases (256 bits of entropy + 8-bit checksum) to let users back up and restore their AEK across devices.

**Used by:** [`generateMnemonic`](/docs/core/mnemonic/), `recoverWithMnemonic`

## Channel AEK

A random AES-256-GCM key shared by the members of a channel, a shared encrypted space across users. Each member holds it wrapped under their own circle AEK, so every device in their circle can open it. An invite runs the circle's join ceremony between two users, with a verification code that also covers the channel id and the key's commitment.

**Generated / used by:** [`createChannel`](/docs/core/channels/), `unwrapChannelAEK`, `authorizeChannelJoin`, `finalizeChannelJoin`

## Circle

A user's devices that hold the same AEK. The first device creates it from the mnemonic, and a new device joins only when the user confirms the same verification code on it and on a trusted device. See [The circle](/docs/core/circle/).

**Used by:** `initCircle`, `createJoinRequest`, `authorizeJoin`, `finalizeJoin`

## DEK

**Data Encryption Key**

A per-file or per-record AES-256-GCM key. A common pattern is to generate a fresh DEK for every piece of content, encrypt the content with the DEK, then wrap the DEK with the AEK. This means changing a user's AEK only requires re-wrapping the DEKs — not re-encrypting the underlying data.

**Pattern:** `generateAesKey()` → `seal(dek, plaintext)` → wrap DEK with AEK

## ECDH P-256

**Elliptic Curve Diffie-Hellman on the NIST P-256 curve**

A key-agreement protocol that lets two parties independently derive the same shared secret using only their public keys — no prior shared secret required. Conseal generates an ephemeral key pair per message, derives a one-time AES key from it, then discards the ephemeral private key. This provides forward secrecy: compromising a long-term key does not expose past messages.

**Used by:** [`sealMessage`](/docs/core/ecdh/), `unsealMessage`

## ECDSA P-256

**Elliptic Curve Digital Signature Algorithm on the NIST P-256 curve**

A digital signature scheme that proves data was produced by the holder of a specific private key — without revealing that key. Anyone with the corresponding public key can verify the signature. P-256 gives strong security in a compact 64-byte signature and is natively supported by the Web Crypto API in all modern browsers.

**Used by:** [`sign`](/docs/core/ecdsa/), `verify`

## ESM

**ECMAScript Modules**

The native JavaScript module system, using `import` / `export` syntax. Conseal is ESM-only, which enables tree-shaking: bundlers can statically determine which functions are actually used and drop everything else, keeping your production bundle as small as possible.

**Requires:** Node 20+, a modern bundler (Vite, esbuild, webpack 5), or a browser supporting native ESM with `type="module"`.

## GCM

**Galois/Counter Mode**

See [AES-256-GCM](#aes-256-gcm). GCM combines CTR-mode encryption with a GHASH authentication tag, delivering both confidentiality and integrity in a single pass. The 12-byte IV and 16-byte tag are both critical — the IV must be unique per encryption and the tag must be verified before any plaintext is released.

## HKDF

**HMAC-based Key Derivation Function (RFC 5869)**

Derives a key from input that is already random. Conseal uses HKDF-SHA-256 to turn a mnemonic's 256 bits of entropy into the AEK, with the info label `conseal-mnemonic-aek-v1` to keep that key apart from any other use of the same entropy. Unlike PBKDF2 it is fast, which is safe because the input isn't guessable.

**Used by:** [`recoverWithMnemonic`](/docs/core/mnemonic/), `initCircle`

## IV

**Initialisation Vector, also called a nonce, a number used once**

A random byte sequence used once per encryption and stored with the ciphertext. Encrypting the same plaintext twice with the same key but different IVs produces completely different ciphertexts, preventing pattern analysis. In GCM, the IV must never be reused under the same key; Conseal generates a fresh cryptographically secure random IV per operation using `crypto.getRandomValues`.

**Format:** 12 random bytes per operation. `seal` returns it as `iv`, to store with the ciphertext; `wrapKey` puts it at the start of `wrappedKey`.

## JWK

**JSON Web Key (RFC 7517)**

A standardised JSON representation for cryptographic keys. It encodes the key type, algorithm parameters, and key material in a portable, human-readable object. Conseal uses JWK to distribute ECDH and ECDSA public keys so that any Web Crypto-capable environment can import them without custom serialisation logic.

**Used by:** [`exportPublicKeyAsJwk`](/docs/core/jwk/), `importPublicKeyFromJwk`

## KDF

**Key Derivation Function**

An algorithm that turns input into a fixed-length cryptographic key. Conseal uses [PBKDF2](#pbkdf2) for passphrases, deliberately slow to make brute-force attacks expensive, and [HKDF](#hkdf) for the mnemonic's entropy, which is already random.

## Key wrapping

Encrypting one key with another. Conseal wraps the AEK with AES-GCM under a PBKDF2-derived wrapping key, with a random 12-byte IV at the start of `wrappedKey`. It doesn't use AES-KW (RFC 3394), the algorithm made for this: WebKit doesn't enforce AES-KW's integrity check, so a wrong passphrase could unwrap to garbage instead of throwing. AES-GCM's tag is checked on every engine.

**Used by:** [`wrapKey`](/docs/core/pbkdf2/), `unwrapKey`

## PBKDF2

**Password-Based Key Derivation Function 2 (RFC 8018)**

Stretches a human passphrase into a fixed-length cryptographic key by running HMAC-SHA-256 through many sequential iterations. Conseal uses 600,000 iterations — deliberately slow so that an attacker who captures a wrapped key must spend enormous computation to guess the passphrase. A random salt ensures identical passphrases produce different keys.

**Used by:** [`wrapKey`](/docs/core/pbkdf2/), `unwrapKey`, [`sealEnvelope`](/docs/core/envelope/)

## Secret Key (SK)

A random 128-bit value stored on the device alongside the passphrase. When supplied to `wrapKey` / `unwrapKey`, it is combined with the passphrase by HMAC-SHA-256, keyed by the Secret Key, before PBKDF2 derivation. This means an attacker who steals the server's wrapped key and knows the passphrase still cannot unwrap the AEK without the Secret Key, which never leaves the device.

**Generated by:** [`generateSecretKey`](/docs/core/secret-key/)  
**Used by:** `wrapKey`, `unwrapKey`, `rekey`, `rekeySecretKey`, `init`, and the Circle ceremony

## SHA-256

**Secure Hash Algorithm, 256-bit digest**

A one-way hash function producing a 32-byte fingerprint. Conseal uses it inside HMAC (as PBKDF2's PRF, and to combine a passphrase and Secret Key) and HKDF, for AEK commitments and verification codes, and as a standalone `digest()` utility for content hashing.

**Used by:** [`digest`](/docs/core/digest/), `combinePassphraseAndSecretKey`, PBKDF2 and HKDF internals, the Circle and channel ceremonies

## SubtleCrypto

The browser (and Node 20+) built-in interface that provides all cryptographic primitives: `encrypt`, `decrypt`, `sign`, `verify`, `deriveKey`, `wrapKey`, `unwrapKey`, `importKey`, `exportKey`, `generateKey`, and `digest`. Every Conseal function is a thin, typed wrapper around `crypto.subtle` — no native addons, no WebAssembly, no polyfills.

**Access via:** `globalThis.crypto.subtle` (browser) or `import { webcrypto } from 'node:crypto'` (Node)

## Verification code

16 Crockford base32 characters in four groups, such as `7KQ2-M9XD-4RTF-B8NW`, derived from the AEK commitment and the joining device's ephemeral public key. Both devices show it, and the user confirms the two match before the key moves.

**Derived by:** `deriveVerificationCode`
