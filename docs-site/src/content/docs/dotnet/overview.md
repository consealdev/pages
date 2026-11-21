---
title: .NET backend
description: "ConsealDev.Conseal, the ASP.NET Core backend for Conseal: it serves the sync and circle routes and stores the ciphertext it is sent."
sidebar:
    label: Overview
    order: 0
---

`ConsealDev.Conseal` is a NuGet package for ASP.NET Core. It serves the routes the client's
[sync](/docs/sync/overview/) and circle calls use, over DynamoDB, and stores and orders what it is sent: ciphertext,
wrapped keys, salts and public keys. It has no key that opens any of it. Sealing, opening and merging run on the client, in
[`@consealdev/conseal/sync`](/docs/sync/overview/).

The routes follow the [API](/docs/api/overview/), so a backend in another language can stand in for it.

## Install

```sh
dotnet add package ConsealDev.Conseal
```

It targets .NET 10.

## Setup

```csharp
// Sign-in is the app's own, AuthStack or any other: Conseal Sync has no identity of its own.
builder.Services.AddAuthentication(/* ... */);
builder.Services.AddAuthorization();

builder.Services
    .AddConsealSync(builder.Configuration)
    .WithCollections("7f3a9c21", "b4e70118")     // the ids from the app's collection registry, never names
    .AddDynamoStores(o => o.TablePrefix = "myapp-")
    .WithBlobs(o =>                               // optional: blobs for the collections named
    {
        o.BucketName = "myapp-blobs";
        o.Collections.Add("7f3a9c21");
    })
    .WithHooks<MyCircleNotifications>();          // optional

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapConsealSyncRoutes("sync");
app.MapConsealCircleRoutes("circle");
```

Every route requires an authenticated user, whose id the routes read from the app's sign-in: the `sub` claim by default.
Each route group comes back from `Map…`, so the app adds its own conventions, such as `.RequireRateLimiting("sync")`: the
spec's `429` is the app's to send.

The collection ids are the ones in the client's [registry](/docs/sync/records/#collections), never the names. The app also
needs a signing key for the pull cursors: the [configuration](/docs/dotnet/configuration/) lists it with the rest.

| Builder call | |
|---|---|
| `WithCollections(...)` | The collection ids the server accepts, beside any in `ConsealSync:Collections` |
| `AddDynamoStores(...)` | Stores records and circles in [DynamoDB](/docs/dotnet/storage/) |
| `AddInMemoryStores()` | Stores them in memory, for tests and local development |
| `WithBlobs(...)` | Turns on the [blob routes](/docs/dotnet/blobs/) for the collections named |
| `WithHooks<T>()` | Registers [hooks](/docs/dotnet/hooks/) that hear about changes to a user's circle |

## The routes

`MapConsealSyncRoutes` serves the sync routes of `openapi.yaml` under its prefix, `sync` by default:

| Route | |
|---|---|
| `GET /` | The collections the server accepts, and the limits |
| `GET /{collectionId}` | Pulls a page of records |
| `POST /{collectionId}` | Pushes a batch of records |
| `POST`, `GET` and `DELETE /{collectionId}/{recordId}/blobs/{blobId}` | A blob's upload URL, download URL, and deletion. A collection without blobs answers `404 blobs_disabled` |

`MapConsealCircleRoutes` serves the circle routes of `circle.yaml` under its prefix, `circle` by default:

| Route | |
|---|---|
| `GET /` and `POST /` | The AEK commitment, and creating the circle |
| `GET /devices`, `DELETE /devices/{deviceId}` | The devices, and revoking one |
| `GET` and `PUT /devices/{deviceId}/wrapped-aek` | A device's wrapped AEK |
| `GET /joins` and `POST /joins` | The pending join requests, and a new request |
| `GET /joins/{challengeId}` | One request's state |
| `POST /joins/{challengeId}/authorize` and `/deny` | Approving or denying a request |

Both throw an `InvalidOperationException` at startup when no store is registered: add `AddDynamoStores` or
`AddInMemoryStores` first.
