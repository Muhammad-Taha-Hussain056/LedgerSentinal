---
version: alpha
name: LedgerSentinel
description: A calm local workspace for reviewing synthetic financial records.
colors:
  primary: "#244c73"
  background: "#eef3f8"
  surface: "#ffffff"
  foreground: "#182b3b"
  muted: "#526575"
  border: "#aebfce"
typography:
  sans:
    fontFamily: "Segoe UI, system-ui, sans-serif"
  display:
    fontFamily: "Georgia, Times New Roman, serif"
  mono:
    fontFamily: "Cascadia Code, Consolas, monospace"
rounded:
  DEFAULT: "0.75rem"
spacing:
  unit: "0.5rem"
  page-max: "52rem"
components:
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
---

# LedgerSentinel Design System

## Overview

### Creative North Star

The quiet double rail of a ledger sheet: a restrained blue rule beside a clear
title, followed by a readable white work surface. This is a product foundation,
not a marketing page or a financial dashboard with invented results.

### Product context and register

- Audience: one local operator and portfolio reviewers, using synthetic records.
- Evidence: [product scope](docs/product.md) and [architecture](docs/architecture.md).
- Locale: English (`en`); no geographic market is inferred from language or USD.
- Usage: desktop-first review work, readable on narrow screens; WCAG 2.2 AA baseline.
- Register: product. Current scope is a static foundation route with no actions.
- Signature: the double blue ledger rail. Other elements stay quiet.
- Anti-references: trading terminals, promotional financial metrics, inactive controls.
- Token ownership: `packages/ui/src/tokens.css` is the canonical runtime source.
  This document mirrors its values and explains intent; there is no generated adapter.
  Both files change together when a durable design decision changes.

## Colors

Background is cool paper; surface is white; foreground and muted are text roles.
Primary marks identity and focus. Border separates surfaces without shadows.
The current theme is light only. Forced-colors mode uses system scrollbar and
focus colors. Never place raw color values in route components.

## Typography

Georgia is used only for the project title. Segoe UI and system fallbacks carry
working text. Cascadia Code/Consolas carry the environment label. All are local
fonts: the foundation build makes no font download requests. Text is sentence
case, with generous line height and a bounded reading measure.

## Layout

The page has a maximum width of 52rem and at least 1rem inline gutters. Padding
scales with the viewport; the document owns vertical scrolling. No viewport-height
clipping or fixed-width panels. Long text wraps naturally. The single surface
has fluid padding and a 0.75rem radius.

## Elevation & Depth

Use white against cool paper with one border. No shadows, blur, floating layers,
or decorative motion are required for this static foundation.

## Shapes

Surface corners use the shared radius. The title rail is a 6px double rule.
No pill-shaped decorations or icon containers are needed.

## Components

### Foundational visual states

`Surface` is a server-compatible semantic section, with standard HTML attributes
and optional class names. It is static and read-only; it has no hover, selected,
disabled, busy, or click state. An accessible name turns it into a named region.
The page states that the workspace is in preparation, without suggesting live data.

### Buttons and actions

No product actions are implemented by SETUP-01.3. Do not add inactive controls.
Future interactive components require their owning task and full keyboard states.

### Navigation and data display

No navigation, data table, amounts, or charts exist yet. Preserve one main landmark,
one page heading, and clear heading order. Never present fixture totals as real data.

### Forms and overlays

Not applicable to this foundation. No fields, dialogs, validation, or toast system
are introduced before their owning tasks.

### Iconography

No icon library or decorative icon is needed. Text carries the available meaning.

### Motion

No animations or transitions. The static page works with reduced motion enabled.

### Content and data visualization

App-wide foundation copy lives in `apps/web/src/lib/messages.ts`. Future feature
copy lives in each feature's `messages.ts`. State what is available truthfully;
do not claim financial readiness from a successful harness build.

### Runtime mapping and canonical UI map

Color keys map directly to `--primary`, `--background`, `--surface`, `--foreground`,
`--muted`, and `--border`. `--focus` aliases primary. Font roles map to `--font-body`,
`--font-display`, and `--font-mono`; dimensions map to `--radius-surface`,
`--space-unit`, and `--page-max`. The layout imports the shared stylesheet once;
`Surface` and the app stylesheet consume these variables.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Scrollbar | apps/web/src/app/globals.css | DESIGN.md and shared semantic tokens | forced colors | Desktop/mobile browser smoke and static audit |

## Do's and Don'ts

- Do keep source exports explicit and consume UI through `@project/ui`.
- Do preserve readable contrast, natural scrolling, and honest setup status.
- Don't add fake actions, invented data, or future feature screens to a harness task.
- Don't duplicate tokens or fetch fonts during a local foundation build.
