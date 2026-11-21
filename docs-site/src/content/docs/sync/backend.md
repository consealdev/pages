---
title: Connecting to a backend
description: "FetchSyncTransport and FetchCircleTransport send the sync and circle calls over the app's fetch to a backend that serves the contract's routes."
sidebar:
    order: 1
---

`FetchSyncTransport` and `FetchCircleTransport` are the transports for a backend that serves the routes of the
[API](/docs/api/overview/), such as [`ConsealDev.Conseal`](/docs/dotnet/overview/). The sync routes are the contract's
`openapi.yaml`, and the circle routes its `circle.yaml`. Give each transport the URL where the backend maps its route
group, and a `fetch` that signs the request in:

```ts
import { FetchCircleTransport, FetchSyncTransport, type FetchFunction } from '@consealdev/conseal/sync';

// The app's sign-in: here a bearer token, refreshed once when the server says it has expired.
const signedIn: FetchFunction = async (url, init) => {
    const send = async (): Promise<Response> => {
        const headers = new Headers(init.headers);
        headers.set('Authorization', `Bearer ${await auth.token()}`);
        return fetch(url, { ...init, headers });
    };
    const response = await send();
    if (response.status !== 401) return response;
    await auth.refresh();
    return send();
};

const syncTransport = new FetchSyncTransport({ baseUrl: 'https://api.example.com/sync', fetch: signedIn });
const circleTransport = new FetchCircleTransport({ baseUrl: 'https://api.example.com/circle', fetch: signedIn });
```

## Options

| Option | |
|---|---|
| `baseUrl` | The URL of the route group, as the backend maps it, such as `https://api.example.com/sync`. A path such as `/api/sync` works wherever `fetch` resolves one, as in a browser |
| `fetch` | The app's `fetch`, which carries its sign-in. Without it the global `fetch` is used, which sends cookies to its own origin. For a cookie sign-in on another origin, pass `(url, init) => fetch(url, { ...init, credentials: 'include' })` |
| `blobFetch` | `FetchSyncTransport` only. The `fetch` for a blob's storage URL. The global `fetch` by default |

A blob's bytes go to and from object storage directly, through URLs the server presigns. Those carry their own signature,
so `FetchSyncTransport` sends them through `blobFetch`, never through the app's sign-in: storage refuses a request signed
twice. The bucket's CORS rules have to let the app's origin `PUT` and `GET`.

## What an answer throws

| Answer | Throws |
|---|---|
| Any status that isn't a success | `SyncTransportError`, with `status`, the body's contract `code`, and `retryAfter`, the `Retry-After` header in seconds |
| A success the contract doesn't allow, such as a body that isn't JSON | `SyncProtocolError` |
| A network failure | What `fetch` threw, as it threw it |

A `401` from either transport means the same: the user has to sign in. Two reads return `undefined` instead of throwing,
for an answer that means there is nothing to read: `getCommitment` for an account with no circle, and `getWrappedAek`
for a device the server doesn't know or has revoked. A blob that storage doesn't hold comes back from `getBlob` as
`undefined` too.

A backend with routes of its own needs a `SyncTransport` and a `CircleTransport` written for them: see
[Transports and stores](/docs/sync/storage/).
