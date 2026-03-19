# uncannyuse

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elkraneo)

**Can I use it?** — Apple platform compatibility reference for RealityKit, ARKit, Metal, and hardware-gated features across iOS, visionOS, and macOS.

→ [uncannyuse.com](https://uncannyuse.com)

## What it is

A [caniuse.com](https://caniuse.com)-style compatibility matrix for Apple developer APIs, verified directly from Xcode SDK `.swiftinterface` files — not documentation.

Currently covers **62 public RealityKit `Component` types** from Xcode 26.3 with:

- iOS / visionOS / macOS version support (minimum SDK version)
- Reality Composer Pro Add Component menu coverage (28/62)
- Platform-exclusive flags (5 visionOS-only, 1 iOS-only)
- New in 26.0 callouts (7 components)

Also includes:

- **RCP development notes** — PR-driven documentation of Reality Composer Pro authored behavior (USDA schema internals, field matrices). Browse at `/research` on the site.
- **Fixture schema exports** — Machine-readable CSV/JSON data for all 28 documented components, including 62-field particle-emitter schema. Available at `/data/schemas/`.

## Data source

All data is extracted from `RealityFoundation.swiftinterface` files in the Xcode 26.3 SDK and from binary string analysis of `RealityToolsFoundation.framework`. macOS versions are inferred from SDK era — verify against Apple documentation.

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
- [ ] API layer for programmatic access (see [#12](https://github.com/elkraneo/uncannyuse/issues/12))
- [ ] Interactive schema lookup page

## Commands

```sh
npm install
npm run dev           # localhost:4321
npm run build         # Build site
npm run build:all     # Build + regenerate schemas + CSV exports
npm run generate:schemas  # Regenerate fixture schemas from Deconstructed fixtures
npm run generate:csv      # Generate CSV exports (fields.csv, matrix.csv)
npm run preview
```

## Contributing RCP research notes

Use Markdown note entries under `src/content/rcp-claims/` with strict frontmatter validation.

See `docs/rcp-research-notes.md`.

## Support

If this saves you time, [buy me a coffee](https://ko-fi.com/elkraneo) ☕
