# uncannyuse

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elkraneo)

**Can I use it?** — Apple platform compatibility reference for RealityKit, ARKit, Metal, and hardware-gated features across iOS, visionOS, and macOS.

→ [uncannyuse.com](https://uncannyuse.com)

## What it is

A [caniuse.com](https://caniuse.com)-style compatibility matrix for Apple developer APIs, verified directly from Xcode SDK `.swiftinterface` files — not documentation.

Currently covers **62 public RealityKit `Component` types** from Xcode 26.3 RC with:

- iOS / visionOS / macOS version support (minimum SDK version)
- Reality Composer Pro Add Component menu coverage (28/62)
- Platform-exclusive flags (5 visionOS-only, 1 iOS-only)
- New in 26.0 callouts (7 components)

Also includes a PR-driven **RCP reverse-engineering claims** domain for authored behavior discoveries, separate from API availability tables.

## Data source

All data is extracted from `RealityFoundation.swiftinterface` files in the Xcode 26.3 RC SDK and from binary string analysis of `RealityToolsFoundation.framework`. macOS versions are inferred from SDK era — verify against Apple documentation.

## Stack

- [Astro 5](https://astro.build) — static site generation
- [Tailwind v4](https://tailwindcss.com) — via `@tailwindcss/vite`
- SF Mono — system font, zero network requests
- Dark mode default + `prefers-color-scheme` light mode

## Roadmap

- [ ] ARKit — session configs, anchor types, hardware tiers (LiDAR, chip generation)
- [ ] Metal — GPU feature sets, ray tracing, mesh shaders per Apple GPU family
- [ ] Hardware tier dimension (A-series chip, LiDAR, camera)
- [ ] Compare view

## Commands

```sh
npm install
npm run dev      # localhost:4321
npm run build
npm run preview
```

## Contributing RCP research notes

Use Markdown claim entries under `src/content/rcp-claims/` with strict frontmatter validation.

See `docs/rcp-research-notes.md`.

## Support

If this saves you time, [buy me a coffee](https://ko-fi.com/elkraneo) ☕
