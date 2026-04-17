---
componentId: particle-emitter-component
axis: rcp
claim: "ParticleEmitterComponent uses RealityKit.VFXEmitter with a two-tier schema: top-level timing/shape/spawning on currentState, and particle properties inside mainEmitter/spawnedEmitter structs."
summary: "The particle emitter fixture set is large and sparse-authored. The canonical shape is `RealityKit.VFXEmitter` with `currentState`, `mainEmitter`, and `spawnedEmitter`, and the most useful public references are now the schema page plus per-component CSV exports."
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-03-19
rcpVersion: "26.3"
xcodeBuild: "Xcode 26.4 (17C529)"
reproSteps:
  - Open the Particle Emitter fixture set in Reality Composer Pro.
  - Explore fixtures across Timing, Shape, Spawning, and Particles subfolders.
  - Save and diff USDA variants against the clean BASE.
  - Verify field authorship patterns and nested struct locations.
evidence:
  - type: doc
    artifactLabel: Verified field matrix
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Inspector-Verified-Field-Matrix-ParticleEmitter.md
    note: Fixture-backed field matrix and authoring notes for the particle emitter component.
  - type: fixture
    artifactLabel: Particle Emitter fixture set
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/RCPComponentDiffFixtures/Sources/RCPComponentDiffFixtures/RCPComponentDiffFixtures.rkassets/Particle Emitter
    note: 108 fixture files organized across Timing, Shape, Spawning, and Particles subfolders.
  - type: fixture
    artifactLabel: Secondary Emitter All fixture
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/RCPComponentDiffFixtures/Sources/RCPComponentDiffFixtures/RCPComponentDiffFixtures.rkassets/Particle Emitter/Particles/Secondary Emitter All.usda
    note: Shows complete spawnedEmitter struct schema.
supersedes: []
---

## Schema Architecture

The ParticleEmitterComponent maps to `RealityKit.VFXEmitter` in USDA. The schema uses a two-tier structure:

```
def RealityKitComponent "VFXEmitter" {
    uniform token info:id = "RealityKit.VFXEmitter"
    
    def RealityKitStruct "currentState" {
        // Emitter Tab fields (timing, shape, spawning)
        
        def RealityKitStruct "mainEmitter" {
            // Particles Tab fields (primary emitter)
        }
        
        def RealityKitStruct "spawnedEmitter" {
            // Secondary emitter (same schema as mainEmitter)
        }
    }
}
```

## Why This Matters

This fixture set is too large to understand comfortably from prose alone. The current public source of truth should be:

- the schema page at `/features/particle-emitter-component/schema`
- the per-component exports under `/api/components/particle-emitter-component/`
- especially `fixtures.csv`, which flattens authored USDA rows by fixture path, UI section, struct scope, field name, and value

That is more trustworthy than repeating a hand-maintained total field count inside this note.

## Sparse Authoring Pattern

The canonical baseline fixture is `BASE.usda`, and it shows **no authored particle-emitter fields**:

- All fields default to `omitted` in `BASE.usda`
- Fields are only written when they differ from their default or are explicitly set
- Variation fields (e.g., `particleSizeVariation`) co-author their base field when set
- Shape-specific fields (e.g., `torusInnerRadius`) only appear with matching shape selection
- Several other fixture files are baseline-equivalent scaffolds and should not be treated as the canonical baseline

## Secondary Emitter

The `spawnedEmitter` struct shares the **same schema** as `mainEmitter`. The `isSpawningEnabled` bool on `currentState` gates whether `spawnedEmitter` fields are authored.

## Notes

- The component prim is named `VFXEmitter` in USDA, not `ParticleEmitter`
- Internal USD type uses `RealityKitStruct` for nested state containers
- `spawnedEmitter` is not a separate schema; it mirrors the particle field layout used by `mainEmitter`
- The fixture set currently contains 108 `.usda` files
