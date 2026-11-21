---
title: The identity
description: "sync.identity() returns the user's ECDH and ECDSA key pairs, the same on every device in their circle, for receiving sealed messages and signing."
sidebar:
    order: 6
---

`identity()` returns the user's identity: an ECDH key pair that messages to the user are sealed to, and an ECDSA key pair
that signs as the user, the same on every device in the circle. A message sealed to the user opens on any of their
devices, including one that joined after it was sent.

```ts
import { exportPublicKeyAsJwk, sign, unsealMessage } from '@consealdev/conseal';

const { ecdh, ecdsa } = await sync.identity();
await publishPublicKey(await exportPublicKeyAsJwk(ecdh.publicKey));   // where others find it is the app's
const plaintext = await unsealMessage(ecdh.privateKey, ciphertext, iv, ephemeralPublicKey);
const signature = await sign(ecdsa.privateKey, data);
```

Each pair is a `CryptoKeyPair`. Others seal a message to `ecdh.publicKey` with the core's
[`sealMessage`](/docs/core/ecdh/), and check a signature with [`verify`](/docs/core/ecdsa/) and `ecdsa.publicKey`.

- **It travels in the keyring,** a record in the contract's reserved `keyring` collection, sealed under the AEK like any
  other. Every sync pulls it, so a device that joins the circle, or recovers it from the mnemonic, has it after its first
  sync. On a device that doesn't hold it yet, `identity()` syncs first.
- **It is made once.** The first sync that finds no keyring on the server creates one. When two devices create one at once,
  the one whose push conflicts takes the other's, and `identity()` hands out only key pairs the server has taken.
- **It is never exported.** Exports and backups leave the keyring out, and the private keys `identity()` returns can't be
  exported. On the device the keyring sits in the `RecordStore` in plaintext, like every record.
- **It stays out of the app's view.** Sync events and the report's counts leave the keyring out. A keyring that didn't sync
  is listed in `failed` as `keyring`.

`identity()` throws `KeyringError` when the keyring still isn't on the device after that sync: the sync didn't finish, or
the server's keyring doesn't open under this circle's AEK. It also throws whatever `sync` throws.
