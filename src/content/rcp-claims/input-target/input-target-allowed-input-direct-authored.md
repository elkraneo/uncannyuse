---
componentId: input-target-component
claim: InputTarget with Allowed Input = Direct authors `allowsDirectInput = 1` and `allowsIndirectInput = 0`.
summary: Fixture deltas show Direct mode serializes as explicit booleans on the InputTarget component prim.
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-02-19
rcpVersion: "26.3 RC"
xcodeBuild: "26.2 SDK era (from fixture notes)"
reproSteps:
  - Open the Input Target fixture in ComponentFieldExploration.
  - Set Allowed Input to Direct.
  - Save and diff USDA against the base fixture.
  - Verify `allowsDirectInput = 1` and `allowsIndirectInput = 0` on `RealityKit.InputTarget`.
evidence:
  - type: doc
    artifactLabel: Inspector verified field matrix
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Inspector-Verified-Field-Matrix.md
    note: Section "RealityKit.InputTarget" documents authored deltas for Allowed Input modes.
  - type: fixture
    artifactLabel: ComponentFieldExploration fixture root
    path: /Volumes/Plutonian/_Developer/Deconstructed/references/ComponentFieldExploration
    note: Contains AllowedInput base/direct/indirect fixture variants.
supersedes: []
---

This claim is scoped to authored scene data only and does not assert runtime interaction behavior.
