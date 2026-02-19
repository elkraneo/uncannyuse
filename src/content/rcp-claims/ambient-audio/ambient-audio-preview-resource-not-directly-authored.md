---
componentId: ambient-audio-component
axis: rcp
claim: AmbientAudio Preview Resource selection is not authored directly on the AmbientAudio component in current fixtures.
summary: Resource choice appears in AudioLibrary resources plus RealityKitAudioFile prims, while AmbientAudio keeps only component-local fields like gain.
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-02-19
rcpVersion: "26.3 RC"
xcodeBuild: "26.2 SDK era (from fixture notes)"
reproSteps:
  - Open Ambient Audio BASE fixture in ComponentFieldExploration.
  - Set Preview Resource in RCP and save as Resource fixture variant.
  - Diff BASE vs Resource USDA.
  - Verify changes land in AudioLibrary and RealityKitAudioFile prims, not on AmbientAudio as a direct resource field.
evidence:
  - type: doc
    artifactLabel: Audio relationship deep dive
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Audio-Component-Library-Relationship.md
    note: Ambient Audio section documents BASE vs Resource authored deltas.
  - type: fixture
    artifactLabel: ComponentFieldExploration fixture root
    path: /Volumes/Plutonian/_Developer/Deconstructed/references/ComponentFieldExploration
    note: Includes Ambient Audio BASE and Resource fixture files used in diffing.
supersedes: []
---

This claim reflects current fixture evidence and should be re-validated when new RCP/Xcode versions are sampled.
