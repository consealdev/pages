---
title: Hooks
description: "IConsealSyncHooks reports changes to a user's circle after they are stored: a device joined, a device was revoked, or a revoked device made contact."
sidebar:
    order: 4
---

`IConsealSyncHooks` is for an app that wants to hear about changes to a user's circle, such as to email the user when a
device joins or a revoked one tries to reach the server. Register an implementation with `WithHooks<T>()`: it is resolved
for each request, and without one the hooks do nothing.

```csharp
public sealed class MyCircleNotifications : IConsealSyncHooks
{
    public async Task OnDeviceJoinedAsync(string userId, string deviceId, DeviceJoinKind kind, CancellationToken cancellationToken)
    {
        if (kind == DeviceJoinKind.Recovery)
        {
            // Tell the user: this can't be told apart from someone with their sign-in adding a device.
        }
    }

    public Task OnDeviceRevokedAsync(string userId, string deviceId, CancellationToken cancellationToken) => Task.CompletedTask;

    public Task OnRevokedDeviceContactAsync(string userId, string deviceId, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

| Hook | When |
|---|---|
| `OnDeviceJoinedAsync` | A device joined the user's circle. `kind` says how: `Founding` when it created the circle, `Ceremony` when a trusted device approved its request, and `Recovery` when it saved a wrapped AEK without a join request. The server can't tell a recovery from someone with the user's sign-in adding a device, so tell the user |
| `OnDeviceRevokedAsync` | A device was revoked |
| `OnRevokedDeviceContactAsync` | A request named a revoked device: it asked for its wrapped AEK, saved one, or asked to join again. The server refuses it, and the device still holds the AEK it had |

Each hook runs after the change is stored. A hook that throws is logged, and the request still succeeds, so a broken
notification can't leave a device halfway through the ceremony. The `CancellationToken` is cancelled when the request is
aborted.
