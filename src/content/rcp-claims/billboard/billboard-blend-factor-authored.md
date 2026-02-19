---
componentId: billboard-component
axis: rcp
claim: Billboard component authors a top-level `float blendFactor` value in USDA.
summary: Fixture diff evidence shows Billboard writes one scalar field (`blendFactor`) directly on the component prim.
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-02-19
rcpVersion: "26.3 RC"
xcodeBuild: "26.2 SDK era (from fixture notes)"
reproSteps:
  - Open the ComponentFieldExploration fixture in Reality Composer Pro.
  - Add or select a Billboard component.
  - Save and diff USDA against baseline.
  - Confirm component prim authors `float blendFactor` on `RealityKit.Billboard`.
evidence:
  - type: doc
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Inspector-Verified-Field-Matrix.md
    note: Canonical matrix section "RealityKit.Billboard"
  - type: fixture
    path: /Volumes/Plutonian/_Developer/Deconstructed/references/ComponentFieldExploration
    note: Fixture root referenced by matrix
supersedes: []
---

Directly observed in fixture diffs and documented as a field-level authored value.
