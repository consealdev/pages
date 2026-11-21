---
title: Errors
description: "The error classes of @consealdev/conseal/sync, from CircleError and SyncError down, with what throws each one and what the app does about it."
sidebar:
    order: 8
---

The circle client's errors extend `CircleError`, and everything else extends `SyncError`, except what a keyring throws
when it is locked. Show them in the app's own words.

## The circle

| Error | Thrown when |
|---|---|
| `WrongPassphraseError` | The passphrase doesn't open this device's key, or doesn't match the approving device's passphrase |
| `DeviceNotRegisteredError` | This device holds no keys for the circle, or the server no longer knows it. It has to join or recover |
| `LockedError` | The AEK was asked for while the circle is locked on this device |
| `CommitmentMismatchError` | A key doesn't match the commitment the account published when the circle was created, or the account has no circle to join or recover |
| `UnverifiedKeyError` | A join's AEK can't be shown to come from a device that knows the passphrase: the approval has no passphrase check, or its check vouches for another key. A dishonest server answering the join itself looks like this |
| `JoinExpiredError` | A join request is older than the ceremony allows |
| `JoinStateError` | A join session was asked for something its state doesn't allow, such as finishing a join that isn't `authorized` |

## The engine

| Error | Thrown by | When |
|---|---|---|
| `SyncConfigError` | `defineCollections`, `new SyncEngine` | The registry isn't valid, or names a merge policy that isn't registered |
| `InvalidRecordError` | `save`, the blob calls | A record id or value isn't one the engine can sync, or the server is known to refuse a blob |
| `ImmutableRecordError` | `save`, `remove` | A record in an append-only collection was asked to change or be deleted |
| `UnreadableRecordError` | `openBlob` | A sealed blob doesn't open: it was altered, moved to another record or collection, or sealed under another AEK, or it doesn't match its reference |
| `BlobNotFoundError` | `openBlob` | A blob a record refers to isn't on this device or the server: it was deleted, or never uploaded |
| `KeyringError` | `identity` | The user's identity isn't on this device: the keyring hasn't synced here, the server's keyring doesn't open under this circle's AEK, or it doesn't hold the identity's keys |
| `ArchiveError` | `importAll` | The file isn't an export or a sealed backup this version reads, or it was damaged, cut short or altered |
| `WrongPasscodeError` | `importAll` | A sealed backup's passcode is wrong, or a sealed backup was imported without one |

## The transports

| Error | Thrown when |
|---|---|
| `SyncTransportError` | The server answered with an error status. It has `status`, the body's contract `code` when there is one, and `retryAfter`, the `Retry-After` header in seconds. A `401` means the user has to sign in |
| `SyncProtocolError` | The server answered in a way the contract doesn't allow, such as results that don't match the items pushed, or a success whose body isn't JSON |

`sync()` throws a `SyncTransportError` with status 401 when the user isn't signed in. Any other failure of a collection is
listed in the report's `failed`. A network failure is any error that isn't a `SyncTransportError`.
