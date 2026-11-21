---
title: Introduction
description: "What Conseal does for a web app that stores user data: it seals the data on the device, so the server holds ciphertext, and shares keys only on approval."
sidebar:
    label: Introduction
---

Conseal is end-to-end encryption for web apps. Data is sealed on the user's device before it leaves it. The server
stores and orders ciphertext it can't open. A key reaches a new device only when the user approves it on a device that
already holds it, and merging runs on the client, on plaintext.

It comes in two packages:

| Package | For | Holds |
|---|---|---|
| `@consealdev/conseal` | The browser | The [crypto core](/docs/core/overview/), [sync](/docs/sync/overview/) and the [ceremony screens](/docs/ui/overview/) |
| `ConsealDev.Conseal` | ASP.NET Core | The [backend](/docs/dotnet/overview/) for the sync and circle routes |

The crypto core makes no network calls: your app owns the transport and the storage of every payload. The
[threat model](/docs/security/threat-model/) says what Conseal covers and what it doesn't.

:::note
This page is a placeholder. The guides, from a first sealed record to a synced app, come later.
:::
