---
title: Export and import
description: "exportAll and importAll move the user's records to and from a file they keep: a plain ZIP, or a backup sealed under a passcode, streamed and checked first."
sidebar:
    order: 5
---

The user's records, as a file they can keep or take elsewhere. The engine makes it from this device's records, so it
includes changes not yet synced: sync first for a file that matches the server. It works offline, unless records refer to
blobs that have uploaded: those it downloads as it goes.

```ts
// A plain export: a ZIP that anything opens. It is NOT encrypted, so tell the user.
const parts: Uint8Array[] = [];
for await (const chunk of sync.exportAll()) parts.push(chunk);
download(new Blob(parts, { type: 'application/zip' }), 'notes-export.zip');

// A sealed backup: only the passcode opens it.
for await (const chunk of sync.exportAll({ passcode })) await writable.write(chunk);   // a file handle, as it comes

// Import either kind, from the file the user picks
if (await archiveKind(file) === 'backup') passcode = await askForPasscode();
await sync.sync();                                           // so the device holds the server's records first
const report = await sync.importAll(file, { passcode });   // { added, replaced, unchanged, kept, skipped, blobs }
await sync.sync();                                           // pushes what the import added
```

| Call | |
|---|---|
| `exportAll(options?)` | The file as an `AsyncIterable<Uint8Array>`, made as it is read. `options.passcode` seals it as a backup. A passcode that is an empty string throws a `TypeError` |
| `importAll(file, options?)` | Saves the records of a plain export or a sealed backup on this device. `options.passcode` opens a backup, and `options.replace` replaces records the device holds with another value |
| `archiveKind(file)` | `'export'` for a plain export, `'backup'` for a sealed one, and `undefined` for any other file |

## The two files

- **The plain export** is a ZIP with `manifest.json` and each collection's records as JSON parts of up to about 4 MB,
  `notes/0001.json` and on: a list of `{ id, schemaVersion, value }`, one record per line. A collection whose name isn't a
  safe file name goes under `collection-<id>`. Each blob a record refers to is a file of its own,
  `blobs/notes/<recordId>/<blobId>`; one the server no longer holds, or that doesn't open, is left out. The manifest lists
  each collection's name, id, `schemaVersion`, record count, parts and blobs. A ZIP without ZIP64 holds at most 65,535
  files and 4 GiB, which blobs reach first. It is unencrypted plaintext: say so where the user saves it.
- **The sealed backup** is the same export, sealed under the passcode in 1 MiB chunks: a random key wrapped under the
  passcode with PBKDF2 (the core's [`wrapKey`](/docs/core/pbkdf2/)), AES-GCM on each chunk, and each chunk bound to its
  backup, its place and whether it is the last. Pick the passcode rules: a backup in cloud storage is open to offline
  guessing.

**Never in either:** local-only fields, sync state (server versions, pending changes, cursors), and keys, the identity's
included. A file that held the AEK would make every backup a way into the account. A blob's DEK is the one key that goes
in, as part of the reference in its record's value: it opens only that blob, which is in the file beside it.

Both stream. Export reads the store a page at a time and yields each part as it fills, and import reads the file in
slices. Neither holds more than about one part.

## Importing

Import keeps record ids, so importing a file twice, or into the account it came from, adds nothing twice.

| Outcome | When |
|---|---|
| `added` | The device lacks the record, or deleted it |
| `replaced` | The device holds it with another value and `replace` is set |
| `kept` | The device holds it with another value, and `replace` isn't set. An immutable collection's records are always kept |
| `unchanged` | The device holds it with the same value |

What it adds is pending, as after `save`, and the next sync merges it with the server like any change. Sync before
importing: under `lastWriteWins`, a record the device hasn't pulled yet would be replaced by the file's older value. A
collection the registry doesn't have is skipped and reported in `skipped`. The blobs of the records it adds or replaces
are sealed again under the DEKs their references carry, and wait on the device to upload with them: `blobs` counts them.

**A damaged file changes nothing.** Import checks the whole file first: the ZIP's checksums, every record, and each
collection's count against the manifest, and every blob's checksum and size against its reference; for a backup, every
chunk. Only then does it write. It reads only what `exportAll` writes: a ZIP that was unzipped and zipped again, or
compressed, is refused with `ArchiveError`. A sealed backup imported with no passcode, or the wrong one, throws
`WrongPasscodeError`.
