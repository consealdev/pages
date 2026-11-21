---
title: Threat model
description: "What Conseal protects, against whom, and what it relies on: a compromised server, a stolen wrapped key, tampering and the limits of a browser."
sidebar:
    label: Threat model
---

The threat model covers each layer: the keys and how they are wrapped, the circle, channels, sync and the records it
moves. For each it says what Conseal enforces, what it relies on the app or the user for, and what it doesn't do.

Some things are outside it: script running on the page can use stored keys, a weak passphrase is weak, and a browser
cannot promise to wipe key bytes from memory.

The full text is [`threat-model.md`](https://github.com/consealdev/conseal/blob/main/threat-model.md) in the conseal
repository.

:::note
This page is a placeholder. The model's sections come here later, one page for each layer.
:::
