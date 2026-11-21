---
title: "The circle: joining a device"
description: "Run the multi-device join with initCircle, createJoinRequest, authorizeJoin and finalizeJoin: a new device gets the account key only after a code is confirmed."
sidebar:
    order: 11
---

The circle is the set of a user's devices that hold the same account key, the AEK. The first device creates it from the
[recovery phrase](/docs/core/mnemonic/), and each later device joins in four steps. These functions do the
cryptography only: your app moves every payload between the devices, through its backend or through `CircleClient`
(see [Sync](/docs/sync/overview/)). The idea behind the steps is on [The circle](/docs/concepts/circle/).

All four functions need a [Secret Key](/docs/core/secret-key/).

## The steps

1. **The founding device, once per account.** `initCircle(mnemonic, passphrase, secretKey)` returns
   `{ wrappedAEK, aekCommitment, deviceId }`. Store `wrappedAEK` and `aekCommitment` on the server.
2. **The new device, after it has taken the circle's commitment.** `createJoinRequest(aekCommitment, deviceMeta?)`
   returns `{ request, ephemeralPrivateKey, verificationCode }`. Send `request`, and keep the private key and the
   commitment in memory only.
3. **A trusted device, once both codes match.** `authorizeJoin(joinRequest, wrappedAEK, passphrase, secretKey, serverReceivedAt)`
   returns a `SealedAEK`. Send it to the new device.
4. **The new device, once both codes match.** `finalizeJoin(sealedAEK, ephemeralPrivateKey, passphrase, secretKey, aekCommitment)`
   returns `{ wrappedAEK }` for this device. It throws if the key doesn't match the commitment.

`deriveVerificationCode(ephemeralPublicKey, aekCommitment)` gives the trusted device the code to show for a request.

## Signatures

```ts
initCircle(mnemonic: string, passphrase: string, secretKey: Uint8Array): Promise<{
  wrappedAEK: WrappedAEK
  aekCommitment: ArrayBuffer
  deviceId: string
}>

createJoinRequest(aekCommitment: ArrayBuffer | Uint8Array, deviceMeta?: { name?: string, platform?: string }): Promise<{
  request: JoinRequest
  ephemeralPrivateKey: CryptoKey
  verificationCode: string
}>

authorizeJoin(joinRequest: JoinRequest, wrappedAEK: WrappedAEK, passphrase: string, secretKey: Uint8Array, serverReceivedAt: number): Promise<SealedAEK>

finalizeJoin(sealedAEK: SealedAEK, ephemeralPrivateKey: CryptoKey, passphrase: string, secretKey: Uint8Array, aekCommitment: ArrayBuffer): Promise<{ wrappedAEK: WrappedAEK }>

deriveVerificationCode(ephemeralPublicKey: JsonWebKey, aekCommitment: ArrayBuffer | Uint8Array): Promise<string>
```

## Types

```ts
interface WrappedAEK {
  wrappedKey: ArrayBuffer
  salt: Uint8Array
}

interface JoinRequest {
  deviceId: string
  ephemeralPublicKey: JsonWebKey
  createdAt: string   // set by the joining device, for display only
  deviceMeta?: { name?: string, platform?: string }
}

interface SealedAEK {
  ciphertext: ArrayBuffer
  iv: Uint8Array
  ephemeralPublicKey: JsonWebKey   // the sealing's own ephemeral key, not the joining device's
}
```

`createdAt` is set by the joining device, so it can be forged: `authorizeJoin` doesn't read it.

## Example

```ts
import {
  generateMnemonic, generateSecretKey, initCircle,
  createJoinRequest, deriveVerificationCode, authorizeJoin, finalizeJoin,
} from '@consealdev/conseal'

// Founding device, once per account
const mnemonic = generateMnemonic()      // show it once, never store it
const secretKey = generateSecretKey()    // keep it on this device, with an offline copy
const { wrappedAEK, aekCommitment } = await initCircle(mnemonic, passphrase, secretKey)
// Send wrappedAEK and aekCommitment to the server

// New device: it has the commitment from the server before it makes its request
const { request, ephemeralPrivateKey, verificationCode } = await createJoinRequest(aekCommitment, { name: 'Phone' })
// Send request to the server. Show verificationCode. Keep ephemeralPrivateKey and aekCommitment in memory.

// Trusted device: the code for that request, from its own commitment
const code = await deriveVerificationCode(request.ephemeralPublicKey, aekCommitment)
// Show code. Only once the user confirms it matches the new device's:
const sealedAEK = await authorizeJoin(request, wrappedAEK, passphrase, secretKey, serverReceivedAt)
// Send sealedAEK to the new device

// New device, once the user has confirmed the codes match
const { wrappedAEK: thisDevice } = await finalizeJoin(sealedAEK, ephemeralPrivateKey, newPassphrase, newSecretKey, aekCommitment)
// Store thisDevice. Discard ephemeralPrivateKey.
```

## The verification code

The code is the first 80 bits of a SHA-256 hash over a fixed label, the circle's commitment and the new device's
ephemeral public key, written as 16 Crockford base32 characters in four groups, such as `7KQ2-M9XD-4RTF-B8NW`. The
alphabet has no `I`, `L`, `O` or `U`.

The new device takes the commitment before its key pair exists, so whoever supplied the commitment can't choose it to
fit the key. The trusted device uses its own commitment. A server that relays the join can put a key pair of its own in
place of the new device's, or give the new device the commitment of a key of its own, and either one changes a code.
To get a match it would need about 2^80 tries, which is out of reach within the five minutes a request lives.

## What your app must do

The library can't enforce these:

- **Show the code on both devices and require the user to confirm it matches**, before `authorizeJoin` and again before
  `finalizeJoin`. Without that confirmation the defence against a server in the middle is gone.
- Give the new device the circle's commitment before `createJoinRequest`, and pass `finalizeJoin` that same commitment.
  The trusted device derives its code from its own commitment, the one `initCircle` returned or the one its own join or
  recovery checked, never one the server supplies with the request.
- Pass `serverReceivedAt` as the server's receipt time in Unix milliseconds, never `joinRequest.createdAt`. A request
  older than 5 minutes is refused.
- Treat `aekCommitment` as immutable once it is stored.
- Keep the ephemeral private key and the commitment in memory only, and discard the key once `finalizeJoin` is done.
- Base64-encode the binary fields on the wire: `wrappedKey`, `salt`, `ciphertext`, `iv` and `aekCommitment`.

`finalizeJoin` throws if the key doesn't match the commitment. Don't store or use anything from that call then.

Running the circle on these functions, without `CircleClient`, has no passphrase check: a server can answer a join with
a key of its own, and the new device finishes only once the user has confirmed matching codes on a trusted device. The
[threat model](/docs/security/circle/) goes through what each layer enforces.
