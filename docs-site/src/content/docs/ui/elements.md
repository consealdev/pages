---
title: The elements
description: "The ceremony elements <conseal-setup>, <conseal-phrase>, <conseal-unlock>, <conseal-join>, <conseal-approve-join> and <conseal-devices>: properties and events."
sidebar:
    order: 1
---

| Element | Shows | Events |
|---|---|---|
| `<conseal-setup>` | Creating the circle: a new passphrase, confirmed and rated | `setup-done`, with `{ mnemonic, deviceId, aekCommitment }` |
| `<conseal-phrase>` | The recovery phrase, until the user confirms they wrote it down; then it forgets the phrase | `phrase-confirmed` |
| `<conseal-unlock>` | The passphrase. A device the circle doesn't know gets the choice to join or recover; recovery removes the other devices | `unlock-done`, with `{ recovered }`; `needs-join` |
| `<conseal-join>` | A new device's request and its verification code, then the passphrase once approved | `join-done`, with `{ deviceId }` |
| `<conseal-approve-join>` | A waiting request and its code. Approve works only once the user confirms the codes match | `approve-done`, with `{ deviceId }`; `deny-done` |
| `<conseal-devices>` | The circle's devices, and removing any but this one. Optional: no key material passes through it | `device-revoked`, with `{ deviceId }` |

## Properties

Every element takes:

| Property | |
|---|---|
| `circle` | The app's [`CircleClient`](/docs/sync/circle/), as a property, before or after the element is added to the page. The element starts when it has one |
| `app-name` | The name its text uses, such as `Pinner`. `this app` by default |

The others belong to some elements:

| Property | On | Meaning |
|---|---|---|
| `min-passphrase-length` | `<conseal-setup>`, `<conseal-unlock>` | The shortest passphrase the user may choose, `12` by default. `<conseal-unlock>` uses it for the new passphrase of a recovery |
| `deviceMeta` | `<conseal-setup>`, `<conseal-unlock>`, `<conseal-join>` | What the device calls itself in the device list: `{ name?, platform? }`. A property, never an attribute. `<conseal-unlock>` uses it after a recovery |
| `poll-interval` | `<conseal-join>` | How often to ask whether the request was approved, in milliseconds, `3000` by default |
| `mnemonic` | `<conseal-phrase>` | The recovery phrase to show. A property, never an attribute, so the phrase stays out of the page's markup |

`<conseal-approve-join>` and `<conseal-devices>` have a `reload()` method that asks the server again.

## Events

The events are DOM events that bubble and cross the shadow root, so the app listens on the element or on anything above it.

| Event | `detail` |
|---|---|
| `setup-done` | `SetupDoneDetail`: `{ mnemonic, deviceId, aekCommitment }`. Pass `mnemonic` to `<conseal-phrase>`, and never store it |
| `phrase-confirmed` | None |
| `unlock-done` | `UnlockDoneDetail`: `{ recovered: false }` after an unlock with the passphrase, `{ recovered: true, deviceId, aekCommitment }` after a recovery |
| `needs-join` | None |
| `join-done` | `JoinDoneDetail`: `{ deviceId }` |
| `approve-done` | `ApproveDoneDetail`: `{ deviceId }`, the device that can now finish joining |
| `deny-done` | None |
| `device-revoked` | `DeviceRevokedDetail`: `{ deviceId }` |

The detail types are exported from `@consealdev/conseal/ui`.

## `<conseal-setup>`

Creates the user's circle with this device as its first. The user chooses a passphrase and confirms it, with a strength
meter, and the device unlocks. Show `<conseal-phrase>` with the mnemonic next.

## `<conseal-phrase>`

Shows the 24 words once, with a button to copy them, and asks the user to confirm they wrote the phrase down. When they do,
the element forgets the phrase and fires `phrase-confirmed`.

```ts
html`
    <conseal-phrase
        app-name="Pinner"
        .mnemonic=${mnemonic}
        @phrase-confirmed=${() => this.showApp()}
    ></conseal-phrase>
`;
```

## `<conseal-unlock>`

Unlocks this device with its passphrase. A device that holds no keys, or one the server no longer knows, is offered the two
ways in: joining from another device, which fires `needs-join` for the app to show `<conseal-join>`, or recovering from the
recovery phrase, here. A recovery removes the circle's other devices, since they may be lost. When the server can't be
reached, the element asks for the passphrase and reports the problem there.

## `<conseal-join>`

Adds this device to the circle from another one. It posts a join request when it first renders, shows its verification code,
which the user compares on the approving device's `<conseal-approve-join>`, and asks for the passphrase once the request is
approved. It asks the server for the answer every `poll-interval` milliseconds while it is on the page, and has a "Check
now" button. A request that expires, is denied or fails ends with a button to start again with a new code.

## `<conseal-approve-join>`

Approves or denies a new device's join request, on a device that is in the circle. It shows the first waiting request and
how many are waiting: the device's name and platform, when it asked, and the request's verification code. The Approve
button works only once the user ticks that the code matches the one on the new device and enters their passphrase. That
comparison is the ceremony's defence against someone posting a request of their own.

## `<conseal-devices>`

Lists the circle's devices, marks this one, and lets the user remove any of the others. It is optional: no key material
passes through it. Revoking a device stops it syncing, and it keeps the AEK it holds.
