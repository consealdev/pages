---
title: Blobs
description: "attachBlob, openBlob and detachBlob keep content too large for a record, such as a photo or a PDF, sealed on the device and in object storage."
sidebar:
    order: 4
---

Content too large for a record, such as a photo or a PDF, goes in a blob. A blob is sealed on the device under a DEK of its
own, and moved between the device and object storage through URLs the server presigns, so its bytes never pass through the
API. A collection has blobs when the backend gives it a `maxBlobBytes`: with `ConsealDev.Conseal`, that is
[`WithBlobs`](/docs/dotnet/blobs/).

```ts
const ref = await sync.attachBlob('notes', id, new Uint8Array(await file.arrayBuffer()));   // offline too
await sync.save('notes', id, { title: 'receipts', attachments: [{ ...ref, name: file.name, type: file.type }] });
await sync.sync();                                    // uploads the blob, then pushes the note

const bytes = await sync.openBlob('notes', id, note.attachments[0]);   // on any of the user's devices

await sync.save('notes', id, { title: 'receipts', attachments: [] });
await sync.detachBlob('notes', id, ref.id);           // the next sync deletes it from the server
```

| Method | What it does |
|---|---|
| `attachBlob(collection, recordId, bytes)` | Seals the bytes as a blob of the record under a fresh DEK, and keeps the sealed blob on this device until a sync uploads it. Returns the blob's reference |
| `openBlob(collection, recordId, ref)` | The blob's bytes, by the reference in its record's value: from this device while it waits to upload, otherwise downloaded from the server |
| `detachBlob(collection, recordId, blobId)` | Deletes a blob its record no longer refers to, once the record is pushed without it |

## The reference

`attachBlob` returns `{ id, dek, size }`: the blob's id, a random lowercase UUID, its DEK as base64, and its length in bytes
before sealing. Put it in the record's value, alone or among fields of the app's own, such as a file name. The blob's DEK
travels only there, sealed inside the record, so the blob opens only through its record. The engine finds references
anywhere in a value by their shape.

## Rules

- **Offline first.** `attachBlob` seals the blob and keeps it in the `RecordStore` until a sync uploads it, and `openBlob`
  reads it from there meanwhile. A sync uploads a collection's waiting blobs before it pushes the collection's records, so
  no device pulls a reference to a blob that isn't on the server. An upload that fails offline stops that collection's
  sync, and the next sync tries again.
- **Sealed to its place.** A blob's AAD names its collection, record and blob id. One the server moves to another record or
  id doesn't open, and `openBlob` throws `UnreadableRecordError`.
- **Too large is final.** A blob over the collection's `maxBlobBytes`, counted sealed, which is its content plus 28 bytes
  for the IV and the tag, won't upload. The sync drops it and stops the record, reported as `rejected` with
  `blob_too_large`, until the app saves the record without it. Once the engine knows the server's limits, after a first
  sync, `attachBlob` refuses such a blob, and any blob of a collection without blobs, with `InvalidRecordError`. A
  collection without blobs fails its sync while a blob of it waits.
- **Deleting.** `detachBlob` deletes a blob the record no longer refers to, once the record is pushed without it. A blob
  still waiting never uploads. Deleting a record deletes its blobs on the server, with no `detachBlob`. A merge that brings
  a reference back, from another device's change, finds the blob gone: detach only what the merge policy won't keep.
- **Nothing cached.** Once a blob has uploaded, `openBlob` downloads it on every call. Keeping the bytes, and where, is the
  app's.

`openBlob` throws `BlobNotFoundError` when neither the device nor the server holds the blob, `UnreadableRecordError` when
it doesn't open, and whatever the transport throws, offline or on a server error. The ids `attachBlob` and `detachBlob`
take have to be lowercase version 4 UUIDs, or they throw `InvalidRecordError`.
