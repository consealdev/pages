---
title: Transports and stores
description: "The SyncTransport, CircleTransport, RecordStore and CircleStore interfaces to implement for routes or local storage of your own, and what each method does."
sidebar:
    order: 7
---

The engine and the circle client hold every cryptographic step and all of the logic. What they leave to the app is two
kinds of thing: the HTTP, as a transport, and the local storage, as a store. The package has a ready-made one of each
that fits the common case: the [fetch transports](/docs/sync/backend/), `IndexedDbCircleStore`, and for tests and Node,
`MemoryCircleStore` and `MemoryRecordStore`. This page is for an app whose backend has routes of its own, or whose records
live somewhere other than memory.

## SyncTransport

A `SyncTransport` carries the sync contract's requests and answers, and a blob's bytes to and from the storage URLs the
server presigns. It throws `SyncTransportError` with the status and the body's `code` for every answer that isn't a
success, and lets network errors through.

| Method | Route |
|---|---|
| `getConfig()` | `GET /`: the collections the server accepts, each with its `maxRecordBytes` and `maxBlobBytes`, and the `maxBatchItems` and `maxPageItems` the client keeps to |
| `pull(collectionId, cursor, limit)` | `GET /{collectionId}`: one page of records, its `cursor` and `hasMore` |
| `push(collectionId, items)` | `POST /{collectionId}`: the result of each item: a version, or a conflict with the server's current record, or an error |
| `putBlob(collectionId, recordId, blobId, sealed)` | `POST /{collectionId}/{recordId}/blobs/{blobId}` with the size, then the upload to the storage URL that returns |
| `getBlob(collectionId, recordId, blobId)` | `GET` on the same route, then the download from the storage URL. `undefined` when storage holds no such blob |
| `deleteBlob(collectionId, recordId, blobId)` | `DELETE` on the same route. Deleting a blob that isn't there succeeds |

## CircleTransport

A `CircleTransport` has one method for each circle route: create the circle, read the commitment, store and read a
device's wrapped AEK, post and poll a join request, approve or deny it, list and revoke devices. Every value it moves is
already encoded for JSON. Every method acts for the signed-in user, and throws for an answer that isn't a success, except
where it returns `undefined`.

| Method | Route |
|---|---|
| `createCircle(circle)` | `POST /`: registers the founding device and the AEK commitment |
| `getCommitment()` | `GET /`: the commitment, or `undefined` when the account has no circle |
| `getWrappedAek(deviceId)` | `GET /devices/{deviceId}/wrapped-aek`: or `undefined` when the server doesn't know the device or it was revoked |
| `saveWrappedAek(deviceId, wrappedAek, deviceMeta, challengeId?)` | `PUT /devices/{deviceId}/wrapped-aek`. `challengeId` is set when the device joined through the ceremony, and absent after a recovery |
| `createJoin(request)` | `POST /joins`: returns the challenge's id and the account's commitment |
| `getJoinStatus(challengeId)` | `GET /joins/{challengeId}`: `pending`, `authorized` with the sealed AEK and its passphrase check, `expired` or `denied` |
| `listPendingJoins()` | `GET /joins`: each request with its `receivedAt`, the server's time in Unix milliseconds, never the request's own |
| `authorizeJoin(challengeId, sealedAek, passphraseCheck)` | `POST /joins/{challengeId}/authorize` |
| `denyJoin(challengeId)` | `POST /joins/{challengeId}/deny` |
| `listDevices()` | `GET /devices` |
| `revokeDevice(deviceId)` | `DELETE /devices/{deviceId}` |

The commitment is the SHA-256 of the raw AEK, in base64. It is written once: a server that lets it change allows key
substitution.

## RecordStore

A `RecordStore` keeps each record's plaintext and sync state, and the pull cursor of each collection, on the device:
IndexedDB, OPFS or memory. The engine reads and writes only through these methods, and keeps nothing else. It names a
collection by the registry's name, which never leaves the device, and by `keyring`, the engine's own for the
[identity](/docs/sync/identity/): a store that sets up a place per collection, such as an IndexedDB object store, sets up
that one too.

| Method | |
|---|---|
| `get(collection, id)` | One record, or `undefined` |
| `put(collection, id, record, expectedRev)` | Writes the record, or deletes the stored one when `record` is `undefined`, only if the stored record's `rev` is still `expectedRev` (`undefined`: no stored record). Returns whether it wrote. The check and the write are one atomic step, such as one IndexedDB transaction |
| `pending(collection)` | The records with `pending` set |
| `list(collection, after, limit)` | Up to `limit` of the collection's records in id order, from the first id after `after`, or from the start when it is `undefined`. Export pages through a collection with it, so a page needn't be one consistent snapshot |
| `getCursor(collection)`, `setCursor(collection, cursor)` | Where the collection's next pull starts. `undefined` starts from the beginning |
| `getBlob`, `putBlob`, `removeBlob`, `pendingBlobs` | The collection's blob changes that wait for a sync: sealed blobs to upload, and blobs to delete. A blob attached offline stays on the device until it uploads |

A `LocalRecord` is `{ id, value, version, schemaVersion, pending, rejected, rev }`: the plaintext, local-only fields
included, and `undefined` when the device deleted it and the delete isn't pushed; the server version the copy builds on;
whether the value has a change the server doesn't have; the code the engine stopped retrying with; and `rev`, which rises
on every write to the record, so no write overwrites one it didn't see.

## CircleStore

A `CircleStore` keeps what a device holds for the circle, in values that survive a structured clone:

| Key | Holds |
|---|---|
| `deviceId` | This device's id in the circle |
| `secretKey` | Its Secret Key, as raw bytes |
| `wrappedAek` | Its wrapped AEK, encoded |
| `aekCommitment` | The circle's AEK commitment, base64, as this device took it with the AEK. Its join codes cover it |
| `aek` | The unlocked AEK, a non-extractable `CryptoKey`, while the device is unlocked |

It has `get(key)`, `put(key, value)` and `delete(key)`.
