---
title: The circle
description: "How a user's devices share one key in Conseal: a new device joins only when the user confirms the same code on it and on a device that holds the key."
sidebar:
    label: The circle
    order: 2
---

The circle is a user's set of devices that hold the account key. The first device creates it, and each later device
joins in four steps:

1. The new device asks to join, and shows a code.
2. A trusted device shows its own code for the request.
3. The user confirms the two codes match, and the trusted device seals the key to the new device.
4. The new device confirms the match, opens the key and checks it against the circle's commitment.

The code is 16 characters, such as `7KQ2-M9XD-4RTF-B8NW`. Showing it on both devices and asking the user to confirm it is
what stops a server from answering a join with a key of its own, so the app has to do it.

The calls for each step, with an example and the rules your app has to keep, are on
[The circle: joining a device](/docs/core/circle/). What the circle enforces, and what it relies on, is in the
[threat model](/docs/security/circle/).
