---
title: Sync
description: "The @consealdev/conseal/sync entry point: CircleClient joins a device to the circle and SyncEngine moves encrypted records between a user's devices."
sidebar:
    label: Overview
    order: 0
---

`@consealdev/conseal/sync` is encrypted sync for a user's own devices, built on the [crypto core](/docs/core/overview/).
It has no DOM and no HTTP of its own, so it runs in a browser, in Node, or behind any UI framework.

It holds two parts:

- **`CircleClient`** runs the [circle ceremony](/docs/sync/circle/): creating the circle, unlocking a device, joining
  one, approving one, recovering from the mnemonic and managing devices. The app renders what it reports.
- **`SyncEngine`** is the data plane. The app [saves and deletes records](/docs/sync/records/) in plaintext. A sync seals
  what changed, pushes it, pulls what the other devices wrote and merges it in. Content too large for a record, such as a
  file, goes in a [blob](/docs/sync/blobs/). [`exportAll` and `importAll`](/docs/sync/export-import/) move the user's
  records to and from a file they keep, and [`identity`](/docs/sync/identity/) gives every device the user's key pairs.

The app supplies the HTTP and the local storage:

| Part | The app gives it | Ready-made |
|---|---|---|
| `CircleClient` | A `CircleTransport` and a `CircleStore` | `FetchCircleTransport`, `IndexedDbCircleStore`, `MemoryCircleStore` |
| `SyncEngine` | A `SyncTransport`, a `RecordStore`, and a keyring: anything with an `aek()` method, such as a `CircleClient` | `FetchSyncTransport`, `MemoryRecordStore` |

The fetch transports talk to a [backend](/docs/dotnet/overview/) that serves the routes of the [API](/docs/api/overview/),
such as `ConsealDev.Conseal`. A backend with routes of its own needs [a transport written for them](/docs/sync/storage/).

## From nothing to a synced record

```ts
import {
    CircleClient, FetchCircleTransport, FetchSyncTransport, MemoryRecordStore,
    SyncEngine, defineCollections, newRecordId,
} from '@consealdev/conseal/sync';

type Notes = { notes: { title: string } };

const circle = new CircleClient({ transport: new FetchCircleTransport({ baseUrl: '/api/circle' }) });
const { mnemonic } = await circle.setup(passphrase);   // the first device only: show the mnemonic once

const collections = defineCollections<Notes>({ notes: { id: '7f3a9c21', schemaVersion: 1 } });
const sync = new SyncEngine<Notes>({
    collections,
    transport: new FetchSyncTransport({ baseUrl: '/api/sync' }),
    store: new MemoryRecordStore(),   // the app's own RecordStore in production
    keyring: circle,
});

await sync.save('notes', newRecordId(), { title: 'groceries' });
await sync.sync();
```

A second device joins the circle instead of calling `setup`: see [the circle client](/docs/sync/circle/#joining-a-device).

## Where to go next

| Page | Covers |
|---|---|
| [Connecting to a backend](/docs/sync/backend/) | The fetch transports, the app's sign-in, and what an answer that isn't a success throws |
| [The circle client](/docs/sync/circle/) | Setup, unlock, recovery, joining and approving a device, and the device list |
| [Syncing records](/docs/sync/records/) | Collections, saving and deleting, merge policies, events and the report |
| [Blobs](/docs/sync/blobs/) | Content too large for a record |
| [Export and import](/docs/sync/export-import/) | The user's records as a file, plain or sealed under a passcode |
| [The identity](/docs/sync/identity/) | The user's ECDH and ECDSA key pairs, the same on every device |
| [Transports and stores](/docs/sync/storage/) | The interfaces to implement for routes or storage of your own |
| [Errors](/docs/sync/errors/) | Every error class, and what throws it |

## Security

The [threat model](/docs/security/threat-model/) says what the ceremony and the data plane protect and what they rely on.
Read the pages on the [circle](/docs/security/circle/) and on [sync](/docs/security/sync/) before building a UI on this
package: the verification-code comparison is the app's to show, and the choice of merge policy decides whether a stale
record from the server can replace a newer one.
