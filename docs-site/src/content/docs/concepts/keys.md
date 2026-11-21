---
title: Keys
description: "The keys behind Conseal: the account key, the Secret Key, the key wrapped under a passphrase, the recovery phrase and the commitment that guards a join."
sidebar:
    label: Keys
    order: 1
---

A user's data is encrypted under one key, shared by all their devices. The server only ever sees ciphertext, wrapped
keys, salts and public keys.

| Term | What it is |
|---|---|
| Account Encryption Key | One AES-256-GCM key for each user. It encrypts the user's data. |
| Secret Key | 16 random bytes, a second factor combined with the passphrase. Kept on the device, with an offline copy. |
| Wrapped key | The account key encrypted under the passphrase and the Secret Key. The server stores it, and it is useless without them. |
| Recovery phrase | 24 BIP-39 words. The account key is derived from it, so it can always be recovered. Shown once, never stored. |
| Commitment | A hash of the account key, published when the circle is created, so a joining device can detect a substituted key. |

## Where each key is covered

- The account key encrypts data with [sealing](/docs/core/aes/), and each record carries its own IV.
- [Passphrase key wrapping](/docs/core/pbkdf2/) protects the account key for the server, and with a
  [Secret Key](/docs/core/secret-key/) a stolen wrapped key can't be guessed at without the device.
- A new device opens the account key with [`init`](/docs/core/init/), and keeps it in
  [IndexedDB](/docs/core/storage/) as a key whose bytes can't be read.
- The [recovery phrase](/docs/core/mnemonic/) derives the account key, so losing the passphrase and the wrapped key
  doesn't lose the data.
- The [commitment](/docs/core/circle/) is made when the circle is created, and checked when a device joins.

The [glossary](/docs/concepts/glossary/) has each term, and the [threat model](/docs/security/keys/) says what the
wrapping protects against.
