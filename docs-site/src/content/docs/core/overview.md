---
title: Crypto core
description: "The @consealdev/conseal entry point: AES-256-GCM sealing, passphrase key wrapping, ECDH and ECDSA, BIP-39 recovery and key storage on SubtleCrypto."
sidebar:
    label: Overview
    order: 0
---

`@consealdev/conseal` is the crypto core. It is built only on SubtleCrypto, plus a BIP-39 library for the recovery
phrase, and it makes no network calls: your app owns the transport and the storage of every payload. It is ESM only, and
runs in browsers and in Node 20 or newer, anything with `crypto.subtle`. Key storage needs IndexedDB.

```ts
import { generateAesKey, seal, unseal } from '@consealdev/conseal';
```

## What each page covers

- [Sealing](/docs/core/aes/): AES-256-GCM, with a random IV for each record. Calls: `seal`, `unseal`, `generateAesKey`, `importAesKey`.
- [Passphrase key wrapping](/docs/core/pbkdf2/): The account key under a passphrase, with PBKDF2. Calls: `wrapKey`, `unwrapKey`, `rekey`, `rekeySecretKey`.
- [Secret Key](/docs/core/secret-key/): A second factor combined with the passphrase. Calls: `generateSecretKey`, `combinePassphraseAndSecretKey`.
- [Setting up a device](/docs/core/init/): Unwrap the account key and keep it on the device. Calls: `init`, `AEK_KEY_ID`.
- [Key storage](/docs/core/storage/): Keys in IndexedDB, where a non-extractable key stays non-extractable. Calls: `saveCryptoKey`, `loadCryptoKey`, `deleteCryptoKey`.
- [Recovery phrase](/docs/core/mnemonic/): A 24-word BIP-39 phrase that derives the account key. Calls: `generateMnemonic`, `recoverWithMnemonic`.
- [Encrypting to a public key](/docs/core/ecdh/): ECDH P-256, for data sent to another account. Calls: `generateECDHKeyPair`, `sealMessage`, `unsealMessage`.
- [Signing](/docs/core/ecdsa/): ECDSA P-256, to verify the sender. Calls: `generateECDSAKeyPair`, `sign`, `verify`.
- [Public keys as JWK](/docs/core/jwk/): Public keys as JSON, to register and fetch. Calls: `exportPublicKeyAsJwk`, `importPublicKeyFromJwk`.
- [Passcode envelopes](/docs/core/envelope/): Data for someone without an account, opened with a passcode. Calls: `sealEnvelope`, `unsealEnvelope`, `encodeEnvelope`, `decodeEnvelope`.
- [The circle](/docs/core/circle/): A user's devices sharing one key, joined by a confirmed code. Calls: `initCircle`, `createJoinRequest`, `authorizeJoin`, `finalizeJoin`, `deriveVerificationCode`.
- [Channels](/docs/core/channels/): A key shared between users. Calls: `createChannel`, `unwrapChannelAEK` and the channel join calls.
- [Base64](/docs/core/base64/) and [digest](/docs/core/digest/): Encoding and SHA-256. Calls: `toBase64`, `fromBase64`, `toBase64Url`, `fromBase64Url`, `digest`.

The terms are in the [glossary](/docs/concepts/glossary/).

## Rules that hold on every page

- **Binary in, binary out.** Functions take `ArrayBuffer` or `Uint8Array`, not strings or `File`. Convert at the edge,
  with `await file.arrayBuffer()` or `TextEncoder`.
- **Keep keys non-extractable** unless they must be wrapped or transferred. Only the key given to `wrapKey` and the
  keys in the circle ceremony need to be extractable.
- **Store each `iv`, `salt` and `ephemeralPublicKey` with its ciphertext.** None of them is secret, and all of them are
  needed to decrypt.
- **A wrong passphrase or a tampered record throws.** SubtleCrypto raises an `OperationError`. Catch it at the screen
  and say "wrong passphrase", not the raw error.
- **Some risks are the app's.** Script running on your page can use keys the page stored, a weak passphrase is weak,
  and JavaScript can't wipe key bytes from memory. The [threat model](/docs/security/limits/) lists them, and the app's
  copy shouldn't claim otherwise.
