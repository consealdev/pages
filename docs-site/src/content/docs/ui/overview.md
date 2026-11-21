---
title: UI components
description: "The @consealdev/conseal/ui entry point: the circle ceremony's screens as Lit components over CircleClient, for any web app that has lit."
sidebar:
    label: Overview
    order: 0
---

`@consealdev/conseal/ui` has the screens of the [circle ceremony](/docs/concepts/circle/) as Lit components, each a card in
its own shadow root. They call only the [`CircleClient`](/docs/sync/circle/), with no crypto or HTTP of their own, and fire a
DOM event when a step is done. Which screen comes next is the app's to decide.

They are the places where the user sees a code and confirms that it matches, which a join needs on both devices before a key
moves.

```sh
npm install @consealdev/conseal lit
```

`lit` is an optional peer dependency: an app that doesn't import `/ui` doesn't need it. The components need a browser.
Importing the entry point registers the elements:

```ts
import type { SetupDoneDetail } from '@consealdev/conseal/ui';
import '@consealdev/conseal/ui';   // registers the elements

html`
    <conseal-setup
        app-name="Pinner"
        .circle=${circle}
        .deviceMeta=${{ name: 'Laptop' }}
        @setup-done=${(event: CustomEvent<SetupDoneDetail>) => this.showPhrase(event.detail.mnemonic)}
    ></conseal-setup>
`;
```

Without a framework, set the properties on the element and listen for its events:

```ts
const setup = document.querySelector('conseal-setup')!;
setup.circle = circle;
setup.addEventListener('setup-done', event => showPhrase(event.detail.mnemonic));
```

## Which screen, when

| The user is | Show | The element tells the app | Then |
|---|---|---|---|
| Creating the circle on a first device | [`<conseal-setup>`](/docs/ui/elements/#conseal-setup) | `setup-done`, with the mnemonic | `<conseal-phrase>`, until `phrase-confirmed` |
| Opening the app on a device the circle knows | [`<conseal-unlock>`](/docs/ui/elements/#conseal-unlock) | `unlock-done` | The app |
| Opening the app on a device the circle doesn't know | `<conseal-unlock>`, which offers to join or recover | `needs-join`, or `unlock-done` after a recovery | `<conseal-join>` for a join |
| Adding this device from another one | [`<conseal-join>`](/docs/ui/elements/#conseal-join) | `join-done` | The app |
| Approving a new device, on one that is in the circle | [`<conseal-approve-join>`](/docs/ui/elements/#conseal-approve-join) | `approve-done` or `deny-done` | The app |
| Looking at their devices | [`<conseal-devices>`](/docs/ui/elements/#conseal-devices) | `device-revoked` | The app |

The elements and their properties are on [the next page](/docs/ui/elements/), and how to restyle them under
[Theming](/docs/ui/theming/).

The verification-code comparison is the part of the ceremony that stops a substituted key, and these screens are where it
happens: read the [circle's security page](/docs/security/circle/) before replacing them with your own.
