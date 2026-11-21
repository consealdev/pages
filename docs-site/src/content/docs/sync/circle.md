---
title: The circle client
description: "CircleClient sets up the circle, unlocks a device, joins and approves devices, recovers from the mnemonic and revokes devices, over the app's transport."
sidebar:
    order: 2
---

`CircleClient` is the [circle](/docs/concepts/circle/) ceremony without a screen. It holds the state machine and every
cryptographic step. The app gives it a [transport](/docs/sync/backend/) for the HTTP and a store for the device's keys,
and renders what it reports. The [UI components](/docs/ui/overview/) are screens over it.

```ts
import { CircleClient, IndexedDbCircleStore } from '@consealdev/conseal/sync';

const circle = new CircleClient({
    transport: circleTransport,                  // see Connecting to a backend
    store: new IndexedDbCircleStore('my-app'),   // the default in a browser; MemoryCircleStore in Node
});
```

`IndexedDbCircleStore` takes the name of its database, `conseal-circle` by default. It stores the AEK as a
non-extractable `CryptoKey`, so a script on the page can use it but can't read its bytes. `MemoryCircleStore` keeps
everything in memory, for tests and for processes that join, act and leave.

## The first device, and every visit after

```ts
// First device
const { mnemonic } = await circle.setup(passphrase, { name: 'Phone' });   // show the mnemonic once

// Every later visit
switch (await circle.status())
{
    case 'unlocked': break;
    case 'locked': await circle.unlock(passphrase); break;
    case 'unregistered': /* join or recover */ break;
}

// Sealing data
const aek = await circle.aek();
```

`setup` returns the 24-word mnemonic, the circle's root of trust. Show it to the user once and never store it.

## Methods

| Method | What it does |
|---|---|
| `setup(passphrase, deviceMeta?)` | Creates the circle with this as its first device, and unlocks it. Returns `{ mnemonic, deviceId, aekCommitment }` |
| `status()` | Where this device stands, from what it holds locally: `'unlocked'` (it holds the AEK), `'locked'` (it holds its keys and needs the passphrase) or `'unregistered'` (it holds no keys, so it has to join or recover) |
| `isRegistered()` | Asks the server whether it still knows this device: false when the device never registered or was revoked |
| `deviceId()` | This device's id, once it has created, joined or recovered the circle |
| `unlock(passphrase)` | Unlocks the device with its passphrase |
| `lock()` | Forgets the unlocked AEK. The device keeps its keys and unlocks again with its passphrase |
| `aek()` | The AEK, for sealing the user's data. Throws `LockedError` until the device is unlocked |
| `deriveKey(passphrase, purpose)` | A key for data that only the passphrase opens, [below](#a-key-only-the-passphrase-opens) |
| `recover(mnemonic, newPassphrase, options?)` | Recovers the circle on this device from the mnemonic, [below](#recovering) |
| `startJoin(deviceMeta?)` | Starts joining an existing circle from this device. Returns a [`JoinSession`](#joining-a-device) |
| `pendingJoins()` | The join requests waiting for this device, each with its `verificationCode` |
| `approveJoin(join, passphrase, true)` | Approves a request, once the user has confirmed that the codes match |
| `denyJoin(challengeId)` | Denies a request |
| `devices()` | The circle's devices, each with `deviceId`, `name`, `platform` and `registeredAt` when the server has them, and `current` on this one |
| `revokeDevice(deviceId)` | Revokes a device: it stops syncing. It keeps the AEK it already holds, so revoking isn't taking the key back |

`deviceMeta` is what a device calls itself in the device list: `{ name?, platform? }`. `unlock` throws
`WrongPassphraseError` when the passphrase doesn't open the key, and `DeviceNotRegisteredError` when the device has to join
or recover instead.

## A key only the passphrase opens

The AEK stays unlocked on a device so that it can sync, and a script that uses it can't read its bytes, so it can't make a
key for data that should open only with the passphrase. `deriveKey` unwraps the AEK again with the passphrase, derives a
non-extractable AES-GCM key from it with HKDF-SHA-256 under the `purpose` label, and keeps nothing:

```ts
const key = await circle.deriveKey(passphrase, 'secrets');
```

Every device of the circle derives the same key from the same passphrase, and a different `purpose` gives an unrelated
key. Ask again when the user's unlock begins, and let go of the key when it ends. An empty `purpose` throws a
`TypeError`.

## Joining a device

On the new device:

```ts
const session = await circle.startJoin({ name: 'Laptop' });
session.subscribe(state => render(state));   // show state.verificationCode while it's 'waiting'
await session.check();                       // poll until 'authorized'
await session.finish(passphrase);            // 'done': the device is in the circle and unlocked
```

On a trusted device:

```ts
const [join] = await circle.pendingJoins();
// Show join.verificationCode. Only once the user confirms it matches the new device's code:
await circle.approveJoin(join, passphrase, true);
```

Both codes cover the account's commitment and the new device's key. The new device reads the commitment before it makes
its key pair, and the trusted device uses the one it keeps, so a key or a commitment the server swaps changes one of the
codes. `approveJoin` takes `true` as its third argument to say the user has confirmed the match: approving without the
comparison hands the AEK to whoever posted the request. A request waits five minutes by the server's clock, and
`approveJoin` throws `JoinExpiredError` for an older one.

### The join session

`startJoin` returns a `JoinSession`. It has `challengeId`, `deviceId` and `verificationCode`, a `state` to render,
`subscribe(listener)`, which calls the listener with the current state now and on every change and returns a function that
stops it, `check()`, which asks the server once whether the request was approved, and `finish(passphrase)`.

| `state.scene` | Meaning |
|---|---|
| `waiting` | The request is posted. Show `verificationCode`, and ask the user to approve on a trusted device |
| `authorized` | Approved. Ask for the passphrase and call `finish` |
| `finalizing` | The device is taking the key and registering |
| `done` | The device is in the circle and unlocked, with `deviceId` |
| `expired`, `denied` | The join is over. Start a new one to try again |
| `failed` | The join is over, with the `error`. Start a new one to try again |

`finish` takes the passphrase this device will unlock with, which must be the approving device's. A mismatch throws
`WrongPassphraseError` and the session stays `authorized`, so the user can try again. The key is taken only with the
approving device's passphrase check, which vouches for it: an approval without one, or whose check vouches for another
key, ends the session as `failed` with `UnverifiedKeyError`, and a key that doesn't match the account's commitment ends
it with `CommitmentMismatchError`.

## Recovering

```ts
const { deviceId } = await circle.recover(mnemonic, newPassphrase, { revokeOtherDevices: true });
```

`recover` derives the AEK from the mnemonic and checks it against the account's commitment before anything is registered,
so a mistyped phrase that still passes the BIP-39 checksum throws `CommitmentMismatchError` and replaces nothing. The
device keeps its id when the server still knows it, and wraps the AEK under the new passphrase. `revokeOtherDevices`
revokes every other device once this one is recovered, for when the others may be lost or compromised. It returns
`{ deviceId, aekCommitment }`.

## What the app has to do

The library can't enforce these, so the app must:

- **Show the code on both devices, and require the user to confirm that they match** before `approveJoin`. The
  comparison is the ceremony's defence against a substituted key.
- **Show the errors in the app's own words.** They are listed under [Errors](/docs/sync/errors/).
- **Show the mnemonic once**, and never store it or send it.
