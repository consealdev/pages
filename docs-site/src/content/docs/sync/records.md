---
title: Syncing records
description: "SyncEngine saves records in plaintext, seals and pushes what changed, pulls the other devices' writes and merges them with each collection's policy."
sidebar:
    order: 3
---

`SyncEngine` syncs an app's records between the user's devices through a server that can't read them. The app saves and
deletes records in it, in plaintext. A sync seals what changed, pushes it, pulls what the other devices wrote, opens it and
merges it into this device's copy with the collection's merge policy. A conflict on push is a merge, never a failure.

It does no HTTP of its own and never holds the AEK: the AEK comes from a keyring, the requests go through the app's
[`SyncTransport`](/docs/sync/backend/), and the records live in the app's [`RecordStore`](/docs/sync/storage/).

```ts
import { SyncEngine, defineCollections, newRecordId, type MergePolicyFactory } from '@consealdev/conseal/sync';

// The app's collections. The names stay on the device; the server only ever sees the ids.
const collections = defineCollections<{ notes: Note; plays: Play }>({
    notes: { id: '7f3a9c21', merge: { fn: 'myapp.notes' }, localOnly: ['downloaded'], schemaVersion: 1 },
    plays: { id: 'b4e70118', immutable: true, schemaVersion: 1 },
});

const sync = new SyncEngine<{ notes: Note; plays: Play }>({
    collections,
    transport: syncTransport,         // see Connecting to a backend
    store: myRecordStore,             // the app's local storage; MemoryRecordStore in tests
    keyring: circle,                  // anything with aek(): a CircleClient
    mergePolicies: { 'myapp.notes': notesPolicy },
});

const id = newRecordId();
await sync.save('notes', id, { title: 'groceries' });
await sync.remove('notes', otherId);

sync.subscribe(event => {
    // 'changed': another device's write, or a merge, changed a record here (value undefined: deleted)
    // 'rejected': the server refused a record for good, until it changes again
    // 'unreadable': a record from the server doesn't open, and was skipped
});
const report = await sync.sync();     // { pushed, pulled, merged, failed }
```

## Records

A record is a JSON object in a collection, with an id that is a random lowercase version 4 UUID: make one with
`newRecordId()`, and test one with `isRecordId(id)`.

| Method | What it does |
|---|---|
| `get(collection, id)` | The record's value on this device. `undefined` when there is none, or it is deleted |
| `save(collection, id, value)` | Saves the record on this device, creating it when `id` is new, and marks it for the next sync |
| `remove(collection, id)` | Deletes the record on this device. The next sync tells the server, which keeps a tombstone so the other devices delete it too |
| `sync()` | Pushes this device's changes and pulls the other devices', collection by collection |
| `subscribe(listener)` | Calls the listener for every [event](#events) of every sync. Returns a function that stops it |

The value is plain JSON data, with no `schemaVersion` field: the engine seals that in. `save` throws
`InvalidRecordError` for an id that isn't a version 4 UUID, a value that isn't a plain object, or a `schemaVersion`
field, and `ImmutableRecordError` when the collection is immutable and the record exists. `remove` throws
`ImmutableRecordError` for an immutable collection.

## Syncing

When and how often to sync is the app's: on start, on focus, after a save, on a timer. One sync runs at a time, and a call
while one runs gets that run's report. A conflict on push is merged and pushed again, up to three rounds in one sync, and
what is left waits for the next one.

`sync()` returns a report:

| Field | |
|---|---|
| `pushed` | Writes and deletes the server accepted |
| `pulled` | Records pulled, this device's own writes coming back included |
| `merged` | Pushes the server answered with a conflict, merged and pushed again |
| `failed` | The collections that didn't finish, each as `{ collection, error }`. They pick up where they stopped on the next sync |

A collection that fails, offline or on a server error, is listed in `failed` and the others carry on. When the server's
configuration can't be read, every collection is listed. `sync()` throws what the keyring throws when the device is
locked, before anything is sent, and a `SyncTransportError` with status 401 when the user isn't signed in.

### Events

| `event.type` | Fields | Meaning |
|---|---|---|
| `changed` | `collection`, `id`, `value` | Another device's write, or a merge, changed or deleted (`value` undefined) a record here |
| `rejected` | `collection`, `id`, `code` | The engine stopped retrying the record's pending change. The next local change to it tries again |
| `unreadable` | `collection`, `id` | A record from the server doesn't open, and was skipped |

A `rejected` event's `code` says why:

| `code` | |
|---|---|
| `invalid_record` | The server refused the record as malformed |
| `record_too_large` | The sealed record is over the collection's `maxRecordBytes`: move content to a [blob](/docs/sync/blobs/), or split the record |
| `blob_too_large` | A blob the record refers to is over the collection's `maxBlobBytes`. It won't upload: save the record without it |
| `unreadable_conflict` | The server answered a push with a conflict whose current record doesn't open, so there is nothing to merge |

## Collections

`defineCollections` declares the app's collections, typed by the value each one holds, and checks them. A table the
registry doesn't name stays on the device: leaving it out is how an app keeps it local.

| Field | |
|---|---|
| `id` | The collection's identity on the wire and in storage: an id the app assigns and never changes, such as `7f3a9c21`, never its name, so the server, its logs and its metrics never hold the app's vocabulary. 1 to 64 of `A-Z`, `a-z`, `0-9`, `_` and `-` |
| `schemaVersion` | The version of the record's shape, a whole number from 1, sealed into every record |
| `merge` | The policy that combines a remote change with this device's copy, by name: `{ fn, args? }`. `lastWriteWins` when absent |
| `localOnly` | Top-level fields that never leave the device, such as whether a file is downloaded here. They are kept from the local copy on a merge |
| `immutable` | An append-only collection: records are created once, never changed or deleted, and never conflict. It names no merge policy |

`keyring` is the engine's own, for the [identity](/docs/sync/identity/), so no collection takes it as its name or id.
`defineCollections` and the engine's constructor throw `SyncConfigError` for an id that is invalid or repeated, a
`schemaVersion` that isn't a whole number from 1, `schemaVersion` as a local-only field, an immutable collection that
names a merge policy, and a merge policy that isn't registered.

## Merge policies

A policy gets the local and remote values, in plaintext, and whether the local one has a change the server doesn't. It
returns the value to keep, or `undefined` to delete. It runs for every remote change to a record the device holds, and for
every conflict on push. The engine seals the result afresh and pushes it when it differs from the server's.

```ts
const notesPolicy: MergePolicyFactory = () => ({ local, remote, pending }) => {
    if (local === undefined || remote === undefined) return pending ? local : remote;
    return mergeFieldByField(local as Note, remote as Note);
};
```

| Input | |
|---|---|
| `local` | This device's value. `undefined` when it deleted the record and hasn't pushed the delete yet |
| `remote` | The server's value. `undefined` when the server holds a tombstone, or no record |
| `pending` | Whether `local` has a change the server doesn't have yet. When false, `local` is an earlier server state, and a policy that can tell versions apart, such as a field-level clock, can keep it against a stale `remote` |

A policy is a pure function of its input, runs on plaintext and touches no keys. A factory makes it from the `args` of the
collection's `merge` descriptor, and the app registers its factories by name in `mergePolicies`. `lastWriteWins` is built
in and can't be registered again: the write that reaches the server last wins, so a change this device hasn't pushed
wins, a delete included, and with nothing pending the remote value wins. It compares no clocks, so it can't tell a stale
remote value from a new one. The choice of policy decides whether a stale record from the server can replace a newer one.
