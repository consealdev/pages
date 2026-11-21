---
title: Blobs
description: "WithBlobs turns on the blob routes: the client seals a blob and moves it straight to and from S3 through presigned URLs, so its bytes never reach the app."
sidebar:
    order: 3
---

Content too large for a record goes in a blob, which the client seals and moves straight to and from S3 through URLs the
routes presign, so its bytes never pass through the app. `WithBlobs` turns the routes on for the collections it names.
Without it they answer `404 blobs_disabled` and the app needs no bucket. `GET /` gives each collection with blobs its
`maxBlobBytes`, and `null` to the rest. The settings are under [Configuration](/docs/dotnet/configuration/#consealsyncblobs).

| Route | Answers |
|---|---|
| `POST /{collectionId}/{recordId}/blobs/{blobId}` with `{"size": n}` | A URL to `PUT` exactly n bytes to. Over `MaxBlobBytes` answers `413 blob_too_large` |
| `GET /{collectionId}/{recordId}/blobs/{blobId}` | A URL to `GET` the blob from. A missing blob is the storage's own `404` |
| `DELETE /{collectionId}/{recordId}/blobs/{blobId}` | `204`, whether the blob was there or not |

- **Keys.** `{KeyPrefix}{userId}/{collectionId}/{recordId}/{blobId}`, the user id escaped as a URI component, so a record's
  blobs share a prefix.
- **A tombstone deletes the record's blobs,** listing and deleting under its prefix after the tombstone is written. When
  that fails, the push still succeeds and the failure is logged: a blob left behind costs storage, not privacy.
- **Signature Version 4, with the size signed.** An upload URL signs `Content-Length`, so S3 refuses an upload of any other
  size. The AWS SDK presigns with version 2 in us-east-1 unless `AWSConfigsS3.UseSignatureVersion4` is set, so `WithBlobs`
  sets it for the process.
- **The client.** An `IAmazonS3` the app has registered already is used. Otherwise one is made with the standard AWS
  credential chain, or for an S3-compatible endpoint when `ServiceUrl` is set.

## The bucket

- **CORS.** Its rules must let the app's origins `PUT` and `GET`: the browser sends the blob straight to the bucket.
- **Permissions.** The role that presigns needs `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` and `s3:ListBucket` on the
  prefix. Without `ListBucket`, S3 answers a missing blob with `403` rather than `404`.
- **A lifecycle rule** can delete what a client uploaded and never pushed a record for, which the server can't tell apart
  from a blob in use.

## Other storage

Blobs can go elsewhere through an `IConsealSyncBlobStore` registered after `WithBlobs`, as long as it presigns. It makes an
upload URL signed for an exact size, a download URL, and deletes one blob or every blob of a record. Each blob is opaque
ciphertext, sealed by the client.
