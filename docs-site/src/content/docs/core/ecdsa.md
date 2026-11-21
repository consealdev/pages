---
title: "Signing: sign and verify"
description: "Sign data and verify the sender with ECDSA P-256 and SHA-256: generateECDSAKeyPair, sign and verify, with signatures in the raw 64-byte format."
sidebar:
    order: 8
---

ECDSA P-256 signing for sender verification.

## Signatures

```ts
generateECDSAKeyPair(): Promise<CryptoKeyPair>
sign(privateKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer>
verify(publicKey: CryptoKey, signature: ArrayBuffer, data: ArrayBuffer): Promise<boolean>
```

## Example

```ts
import { generateECDSAKeyPair, sign, verify } from '@consealdev/conseal'

// One-time: generate key pair
const { publicKey, privateKey } = await generateECDSAKeyPair()

// Sender: sign the ciphertext before sending
const signature = await sign(privateKey, ciphertext)
// POST { ciphertext, iv, signature } to server

// Recipient: verify using sender's registered public key
const valid = await verify(senderPublicKey, signature, ciphertext)
if (!valid) throw new Error('Signature verification failed')
```

## Notes

- Sign the ciphertext, not the plaintext — the recipient verifies before decrypting.
- `verify()` returns `false` for invalid signatures rather than throwing.
- `sign()` and `verify()` throw a `TypeError` for a key that isn't an ECDSA key.
- The signature is 64 raw bytes, `r` followed by `s`, as SubtleCrypto produces it, not DER. A server that verifies it must expect that format.
