---
componentId: audio-mix-groups-component
axis: rcp
claim: "Audio Mix Groups is a mixer-driven component: the inspector launches the editor, but the authored state lives outside a normal inline parameter block."
summary: "Fixture diffs show the inspector card is only a launcher. Real state lands in child `RealityKitAudioMixGroup` prims (`gain`, `mute`, `speed`) plus external `RealityKitAudioFile` prims routed with `rel mixGroup`."
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-03-13
rcpVersion: "26.3"
xcodeBuild: "Xcode 26.4 (17C529)"
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

Audio Mix Groups behaves differently from the usual Reality Composer Pro component pattern. The inspector does not expose an inline field list to edit. Instead, it hands off authoring to the Audio Mixer.

The clean fixture diffs show a two-part authored shape:

- The component prim itself is mostly structural: `RealityKit.AudioMixGroups`.
- Group controls are authored as child `RealityKitAudioMixGroup` prims with `gain`, `mute`, and `speed`.
- File routing is authored separately as top-level `RealityKitAudioFile` prims that point back to a mix group through `rel mixGroup`.

That means the interesting authored state is split across child mixer-group prims and external audio-file prims, not stored as a flat set of component attributes in the inspector card.
