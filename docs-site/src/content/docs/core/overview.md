---
title: Crypto core
description: "The @consealdev/conseal entry point: AES-256-GCM sealing, passphrase key wrapping, ECDH and ECDSA, BIP-39 recovery and key storage on SubtleCrypto."
sidebar:
    label: Overview
---

`@consealdev/conseal` is the crypto core. It is built only on SubtleCrypto, plus a BIP-39 library for the recovery
phrase, and it makes no network calls: your app owns the transport and the storage of every payload.

| Part | What it does |
|---|---|
| Sealing | AES-256-GCM, with a random IV for each record |
| Key wrapping | The account key under a passphrase and a Secret Key, with PBKDF2 |
| Keys | ECDH and ECDSA pairs, and their public keys as JWK |
| Recovery | A 24-word BIP-39 phrase that derives the account key |
| Envelopes | Data for someone without an account, opened with a passcode |
| Storage | Keys kept in IndexedDB, where a non-extractable key stays non-extractable |
| Circle and channels | The calls behind the [join ceremony](/docs/concepts/circle/) and [shared keys](/docs/concepts/channels/) |

:::note
This page is a placeholder. A page for each part comes later.
:::
