---
title: Quick start
description: "Seal and open a first record with the Conseal crypto core: generate a key, encrypt with AES-256-GCM and decrypt it again, in the browser."
sidebar:
    label: Quick start
---

The crypto core is built only on the browser's SubtleCrypto. Generate a key, seal a record with it and open it again:

```ts
import { generateAesKey, seal, unseal } from '@consealdev/conseal';

const key = await generateAesKey();
const { ciphertext, iv } = await seal(key, plaintext);

const opened = await unseal(key, ciphertext, iv);
```

`seal` gives each record a fresh random IV, which is stored beside its ciphertext. `unseal` throws if the key is wrong or
the data was changed.

The sync and UI entry points are not published yet.

:::note
This page is a placeholder. Installing the package, wrapping the key with a passphrase and syncing a record come later.
:::
