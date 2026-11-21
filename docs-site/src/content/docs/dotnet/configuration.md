---
title: Configuration
description: "The ConsealSync and ConsealSync:Blobs settings of ConsealDev.Conseal: the cursor signing key, collections, limits and blob storage, checked at startup."
sidebar:
    order: 1
---

The settings bind from the `ConsealSync` section, and `ConsealSync:Blobs` once `WithBlobs` turns the blob routes on. Both
are checked at startup, so a typo is a startup error and not a failed request.

```json
{
  "ConsealSync": {
    "CursorSigningKey": "…",
    "Collections": ["7f3a9c21", "b4e70118"],
    "Blobs": {
      "BucketName": "myapp-blobs",
      "Collections": ["7f3a9c21"]
    }
  }
}
```

## ConsealSync

| Key | Default | Meaning |
|---|---|---|
| `CursorSigningKey` | none | Base64 of at least 32 random bytes (`openssl rand -base64 32`). Signs pull cursors; changing it sends clients back to the start |
| `Collections` | `[]` | Collection ids, beside those from `WithCollections`. At least one is needed. Each is 1 to 64 of `A-Z`, `a-z`, `0-9`, `_` and `-`, and none is listed twice. Any other id answers `404 unknown_collection`. The spec reserves `keyring`, for the user's identity: the routes always accept it, and it can't be configured |
| `UserIdClaim` | `sub` | The claim holding the user's id. With `sub`, `NameIdentifier` is read when `sub` is absent, since ASP.NET's JWT handler renames `sub` unless inbound claim mapping is off |
| `MaxBatchItems` | `100` | The most items one push carries. More answers `413 too_many_items` |
| `MaxPageItems` | `1000` | The most items one pull returns, whatever `limit` the client asks for |
| `MaxRequestBytes` | 5 MB | The largest push body, at least 1 MB. A larger one answers `413 request_too_large`, and the client sends fewer items. The default is under AWS Lambda's 6 MB payload limit |

A user id is at most 256 bytes: it is part of every storage key and cursor. A longer one answers `401`.

## ConsealSync:Blobs

With `WithBlobs`, from the `ConsealSync:Blobs` section too:

| Key | Default | Meaning |
|---|---|---|
| `Collections` | `[]` | The ids of the collections that have blobs, each one of `ConsealSync:Collections`. At least one is needed |
| `BucketName` | none | The S3 bucket that holds the blobs |
| `KeyPrefix` | `""` | Put before every object key, such as `blobs/`, when the bucket holds other things too |
| `MaxBlobBytes` | 10 MiB | The largest sealed blob: its content plus 28 bytes of IV and tag. From 28 bytes to 5 GiB, the most one `PUT` takes. A larger upload answers `413 blob_too_large` |
| `UrlLifetime` | 5 minutes | How long a presigned URL works: long enough for one upload or download, at most 7 days |
| `ServiceUrl` | `""` | An S3-compatible endpoint for local development, such as LocalStack's. Empty for AWS, with the region and credentials from the standard AWS chain |

The `WithBlobs` callback sets the same options in code, so `o.Collections.Add(...)` and `o.BucketName = ...` come on top of
what the section holds.

## DynamoDB

`AddDynamoStores` takes its own options in code:

| Option | |
|---|---|
| `TablePrefix` | Put before both table names, such as `myapp-` for `myapp-conseal-sync-records`. Include the separator. Each app deploys its own tables from the same definition, never a shared one |
| `ServiceUrl` | The DynamoDB endpoint, for DynamoDB Local in development. Empty in production |
