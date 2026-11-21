---
title: .NET backend
description: "ConsealDev.Conseal, the ASP.NET Core backend for Conseal: it serves the sync and circle routes and stores the ciphertext it is sent."
sidebar:
    label: Overview
---

`ConsealDev.Conseal` is a NuGet package for ASP.NET Core. It serves the routes the client's
[sync](/docs/sync/overview/) and circle calls use, and stores and orders what it is sent: ciphertext, wrapped keys, salts
and public keys. It has no key that opens any of it.

The routes follow the [API](/docs/api/overview/), so a backend in another language can stand in for it.

No `ConsealDev.Conseal` package is published yet.

:::note
This page is a placeholder. Setup, storage and configuration come later.
:::
