---
title: Sync
description: "The @consealdev/conseal/sync entry point: CircleClient joins a device to the circle and SyncEngine moves encrypted records between a user's devices."
sidebar:
    label: Overview
---

`@consealdev/conseal/sync` moves a user's records between their devices through your backend. It calls only your
backend, through the transport your app gives it.

- `CircleClient` runs the join ceremony against the backend.
- `SyncEngine` seals records, sends them, fetches the others and merges them on the client, on plaintext.
- The fetch transports for the backend's routes, and export and backup, are in the same entry point.

The backend orders ciphertext and never opens it. The routes it serves are in the [API](/docs/api/overview/), and
`ConsealDev.Conseal` is a [backend](/docs/dotnet/overview/) for ASP.NET Core.

:::note
This page is a placeholder. Setting up a transport, syncing a first record and handling conflicts come later.
:::
