---
title: Channels
description: "How Conseal shares one key between users: each member holds the channel key wrapped under their own circle key, so all their devices can open it."
sidebar:
    label: Channels
    order: 3
---

A channel is a key shared across users. Each member keeps the channel key wrapped under their own circle key, not under a
passphrase, so a device that joins their circle later opens every channel they are in.

A new member joins with the same kind of ceremony as a device does: both sides see a code and confirm it. Removing a
member is the backend's job. It stops serving them the channel, and they keep what they already had, so a fresh key means
a new channel with new invites.

The calls, an example, the routes a backend serves and what happens when a member leaves are on
[Channels: sharing a key](/docs/core/channels/). The [threat model](/docs/security/channels/) says what a channel
enforces and what the server still learns.
