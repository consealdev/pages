---
title: License
description: "Conseal is available under the GNU AGPL, version 3 or later, or a Commercial License: when the AGPL is enough, when an app needs the other, and how to ask."
sidebar:
    order: 3
---

Conseal's two packages, `@consealdev/conseal` and `ConsealDev.Conseal`, are available under two licenses, and an app uses
them under one. The licenses decide: this page says what they mean for an app, and where it and they differ, they win.

## The AGPL

The [GNU Affero General Public License, version 3 or any later version](https://www.gnu.org/licenses/agpl-3.0.html) costs
nothing. An app whose source is fully open under the AGPL, or under a license compatible with it, needs no other license.
Both packages run inside the app, so the AGPL's terms reach the app too.

## The Commercial License

An app needs the [Conseal Commercial License](/license/) when it is closed-source, when it is a web service whose source
isn't public under a compatible open-source license, or when it can't meet the AGPL's terms for another reason. The license
lets the app use both packages without publishing its source. One license covers both packages, for one production app: a
frontend and the sync backend that serves only it count as one app.

It doesn't cover building a hosted sync or key service for other companies' apps to use: the license names that as outside
what it allows.

Trying Conseal in an environment that no real user's data reaches needs no commercial license for 30 days.

To ask for a license, write to [license@conseal.dev](mailto:license@conseal.dev).

## The spec

The [API](/docs/api/overview/) the packages follow is under the MIT License. A backend or a client you write to it needs no
license from Conseal.
