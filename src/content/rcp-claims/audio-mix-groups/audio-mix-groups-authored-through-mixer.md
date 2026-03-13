---
componentId: audio-mix-groups-component
axis: rcp
claim: Audio Mix Groups is authored through the Audio Mixer editor, not as inline inspector parameters.
summary: Fixture diffs show the inspector card acts as a launcher while authored data lands in child `RealityKitAudioMixGroup` prims and external `RealityKitAudioFile` prims related by `mixGroup`.
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-03-13
rcpVersion: "26.3 RC"
xcodeBuild: "26.2 SDK era (from fixture notes)"
reproSteps:
  - Open the Audio Mix Groups component in Reality Composer Pro.
  - Use Open Audio Mixer from the inspector card.
  - Add a mix group, assign one or more audio files, then change gain, mute, or speed.
  - Save fixture variants and diff USDA against the clean BASE.
  - Verify the component prim stays structural while authored values land in mix-group and audio-file prims.
evidence:
  - type: doc
    artifactLabel: Verified field matrix
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Inspector-Verified-Field-Matrix.md
    note: Documents Audio Mix Groups as mixer-driven with group children and external audio file routing.
  - type: doc
    artifactLabel: Component research log
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Inspector-Components-Research-Log.md
    note: Tracks Audio Mix Groups fixture coverage and revised missing-fixture count.
  - type: fixture
    artifactLabel: Audio Mix Groups fixture set
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/RCPComponentDiffFixtures/Sources/RCPComponentDiffFixtures/RCPComponentDiffFixtures.rkassets/Audio Mix Groups
    note: Includes BASE, AddMixGroup, assignment, and gain/mute/speed variants.
supersedes: []
---

The current evidence supports treating Audio Mix Groups as a mixer-backed authoring flow rather than a standard inline inspector parameter block.
