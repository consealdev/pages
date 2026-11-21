---
title: Quick start
description: "Seal and open a first record with the Conseal crypto core: generate a key, encrypt with AES-256-GCM and decrypt it again, in the browser."
sidebar:
    label: Quick start
    order: 2
---

```sh
npm install @consealdev/conseal
```

The crypto core is built only on the browser's SubtleCrypto. Generate a key, seal a record with it and open it again:

```ts
import { generateAesKey, seal, unseal } from '@consealdev/conseal';

const key = await generateAesKey();
const { ciphertext, iv } = await seal(key, plaintext);

const opened = await unseal(key, ciphertext, iv);
```

`seal` gives each record a fresh random IV, which is stored beside its ciphertext. `unseal` throws if the key is wrong or
the data was changed.

To share the key between a user's devices and sync records between them, see [Sync](/docs/sync/overview/).

:::note
This page is a placeholder. Wrapping the key with a passphrase comes later.
:::
