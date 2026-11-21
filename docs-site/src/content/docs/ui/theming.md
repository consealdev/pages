---
title: Theming
description: "Restyle the ceremony elements with the custom properties on the page: colors, corner radii and padding. The layout and the verification code stay fixed."
sidebar:
    order: 2
---

The elements are fully styled with no setup. To restyle them, set these custom properties on the page or on any ancestor of
an element. They are the whole theming surface:

```css
conseal-setup, conseal-unlock, conseal-join, conseal-approve-join, conseal-devices, conseal-phrase {
    --color-primary: #0f766e;
    --color-focus: #0f766e;
    --radius-lg: 8px;
}
```

| Property | Colors or shapes | Default |
|---|---|---|
| `--color-text` | Text | `#1e293b` |
| `--color-muted` | Secondary text and labels | `#64748b` |
| `--color-surface` | The card and its fields | `#fff` |
| `--color-bg` | Behind the verification code | `#f8fafc` |
| `--color-border` | Borders, and the secondary buttons | `#e2e8f0` |
| `--color-border-hover` | A secondary button under the pointer | `#cbd5e1` |
| `--color-primary` | The main buttons, the code's border, and the links and the "This device" badge unless set below | `#6366f1` |
| `--color-primary-text` | The label on the main buttons | `#fff` |
| `--color-link` | The link buttons ("Cancel", "Forgot your passphrase?") | `--color-primary` |
| `--color-danger` | Deny, Remove, and errors | `#ef4444` |
| `--color-danger-text` | The label on Deny and Remove | `#fff` |
| `--color-warning` | The recovery button | `#ea580c` |
| `--color-warning-text` | The label on the recovery button | `#fff` |
| `--color-notice-text` | The text of the boxes that warn about the phrase and the code | `#92400e` |
| `--color-notice-bg` | Their background | `#fef3c7` |
| `--color-notice-border` | Their border | `#fbbf24` |
| `--color-badge-text` | The text of the "This device" badge | `--color-primary` |
| `--color-badge-bg` | Its background | `#eef2ff` |
| `--color-focus` | The focus ring | `#6366f1` |
| `--radius-lg` | The card's corners | `12px` |
| `--radius-sm` | Fields, buttons and the code | `6px` |
| `--space-8` | The card's padding | `32px` |

## What stays fixed

The layout, the flow between steps, and the security-critical text aren't configurable: the verification code, the warnings
about the phrase and the code, and the mismatch errors. The shadow root keeps the page's own CSS from reaching them, so a
page can't hide or shrink the code the user has to compare. The colors of the passphrase strength meter are fixed too.

Check the contrast of the colors you choose against the surfaces they sit on: the defaults are a light card, and a dark page
needs `--color-surface`, `--color-text`, `--color-bg` and `--color-border` set together.
