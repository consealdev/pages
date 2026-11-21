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

:::note
This page is a placeholder. How each key is made, wrapped and rotated comes later.
:::
