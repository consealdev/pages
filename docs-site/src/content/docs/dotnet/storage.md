---
title: Storage
description: "How ConsealDev.Conseal stores records and circles in DynamoDB: the two tables, the guarantee that a pull never skips a write, and the limits that follow."
sidebar:
    order: 2
---

## DynamoDB

`AddDynamoStores` uses two tables. `ConsealSyncDynamoTables.Definitions(prefix)` returns their definitions, for the app's
infrastructure code, and `ConsealSyncDynamoTables.CreateAsync(client, prefix, cancellationToken)` creates any that are
missing, for local development. An `IAmazonDynamoDB` the app has registered already is reused. Otherwise one is made with
the standard AWS credential chain, or for DynamoDB Local when `ServiceUrl` is set.

| Table | Keys | Notes |
|---|---|---|
| `{prefix}conseal-sync-records` | `pk` = `{userId}#{collectionId}`, `sk` = record id | A local index `seq-index` on `seq`, with every attribute |
| `{prefix}conseal-sync-circle` | `pk` = user id, `sk` = `circle`, `device#{id}` or `join#{id}` | Time to live on `ttl` drops stale join requests |

**A pull never skips a write.** Each partition has a counter item, and a write commits the record and the counter's next
value in one transaction, on condition that the counter hasn't moved, so `seq` follows commit order. A pull reads the
counter, then pages `seq-index` up to that value with a strongly consistent read, which a local index allows and a global
one doesn't. Every write up to the counter has committed before the read starts, and a write that commits during it lands
past the bound, so no page shows a write without the ones before it.

**Records are at most 202,752 bytes of ciphertext.** `seq-index` keeps a copy of each record, and DynamoDB counts both
copies against its 400 KB item limit. `GET /` advertises the limit as each collection's `maxRecordBytes`, and anything
larger belongs in a [blob](/docs/dotnet/blobs/). A local index also caps one user's collection at 10 GB.

**Writes to one collection are serialized.** Concurrent writers retry on the counter, and one that can't commit after 25
attempts answers `503` with `Retry-After`. The client treats that as transient and tries again.

## Other storage

Implement `IConsealSyncRecordStore` and `IConsealCircleStore`, and register them in place of the DynamoDB ones.

| Interface | Holds | Has to |
|---|---|---|
| `IConsealSyncRecordStore` | Records: opaque ciphertext keyed by user, collection and record id | Give every write a new version and the collection's next `Seq`, in the order writes commit, and answer each pull from a strongly consistent read, so a pull never skips a write. `MaxRecordBytes` is the storage's item limit less what the rest of a stored record takes |
| `IConsealCircleStore` | Each user's circle: the AEK commitment, the devices with their wrapped AEKs, and the join requests in flight | Make each step of the ceremony atomic. The routes hold the rules |

Their doc comments state what each method must make atomic. A store that can't commit because other writes keep it from
it throws `ConsealSyncStoreBusyException`, which the routes answer as `503` with `Retry-After`.

`AddInMemoryStores()` keeps records and circles in memory, lost when the process ends: for tests and local development
only. Its record limit is DynamoDB's, so an app tested against memory keeps to what the DynamoDB store accepts.
