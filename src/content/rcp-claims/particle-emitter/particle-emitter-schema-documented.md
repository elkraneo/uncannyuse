---
componentId: particle-emitter-component
axis: rcp
claim: "ParticleEmitterComponent uses RealityKit.VFXEmitter with a two-tier schema: top-level timing/shape/spawning on currentState, and particle properties inside mainEmitter/spawnedEmitter structs."
summary: "The particle emitter fixtures reveal 62 USDA-authorable fields organized across three inspector tabs. The component prim name is VFXEmitter not ParticleEmitter. Most fields are not authored in the baseline fixture, following a sparse authoring pattern."
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: elkraneo
date: 2026-03-19
rcpVersion: "26.3"
xcodeBuild: "Xcode 26.3 (17C529)"
reproSteps:
  - Open the Particle Emitter fixture set in Reality Composer Pro.
  - Explore fixtures across Timing, Shape, Spawning, and Particles subfolders.
  - Save and diff USDA variants against the clean BASE.
  - Verify field authorship patterns and nested struct locations.
evidence:
  - type: doc
    artifactLabel: Verified field matrix
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/Deconstructed/Docs/Inspector-Verified-Field-Matrix-ParticleEmitter.md
    note: Comprehensive field matrix with 62 fields across Emitter, Particles, and Spawning tabs.
  - type: fixture
    artifactLabel: Particle Emitter fixture set
    path: /Volumes/Plutonian/_Developer/Deconstructed/source/RCPComponentDiffFixtures/Sources/RCPComponentDiffFixtures/RCPComponentDiffFixtures.rkassets/Particle Emitter
    note: 107 fixture files organized in Timing, Shape, Spawning, and Particles subfolders.
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

## Field Summary (62 total fields)

### Emitter Tab Fields (currentState)

| Category | Field Count | Key Fields |
|----------|-------------|------------|
| Timing | 7 | `loops`, `emissionDuration`, `idleDuration`, `warmupDuration`, `simulationSpeed` |
| Shape | 9 | `emitterShape`, `birthLocation`, `birthDirection`, `shapeSize`, `isLocal`, `isLocalFields` |
| Spawning | 6 | `spawnOccasion`, `spawnVelocityFactor`, `spawnSpreadFactor`, `spawnInheritParentColor` |

### Particles Tab Fields (mainEmitter/spawnedEmitter)

| Category | Field Count | Key Fields |
|----------|-------------|------------|
| Main | 4 | `birthRate`, `birthRateVariation`, `burstCount`, `burstCountVariation` |
| Properties | 10 | `particleSize`, `particleLifeSpan`, `particleMass`, `billboardMode`, `particleAngle` |
| Color | 9 | `startColorA`, `startColorB`, `endColorA`, `endColorB`, `opacityOverLife` |
| Textures | 5 | `particleImage`, `blendMode`, `isAnimated`, `frameRate`, `rowCount`, `columnCount` |
| Motion | 6 | `acceleration`, `dampingFactor`, `spreadingAngle`, `particleAngularVelocity` |
| Rendering | 2 | `isLightingEnabled`, `sortOrder` |
| Force Fields | 6 | `radialGravityCenter`, `vortexDirection`, `noiseStrength`, `noiseScale` |

### Token Enumerations

- **Emitter Shape:** `Box`, `Sphere`, `Cone`, `Cylinder`, `Plane`, `Point`, `Torus`
- **Orientation Mode:** `Billboard`, `BillboardYAligned`, `Free`
- **Opacity Over Life:** `Constant`, `EaseFadeIn`, `EaseFadeOut`, `GradualFadeInOut`, `LinearFadeIn`, `LinearFadeOut`, `QuickFadeInOut`
- **Blend Mode:** `Alpha`, `Additive`, `Opaque`
- **Sort Order:** `Unsorted`, `IncreasingID`, `DecreasingID`, `IncreasingAge`, `DecreasingAge`, `IncreasingDepth`, `DecreasingDepth`

## Sparse Authoring Pattern

The baseline fixture shows **no fields authored**:

- All fields default to `omitted` in `BASE.usda`
- Fields are only written when they differ from their default or are explicitly set
- Variation fields (e.g., `particleSizeVariation`) co-author their base field when set
- Shape-specific fields (e.g., `torusInnerRadius`) only appear with matching shape selection

## Secondary Emitter

The `spawnedEmitter` struct shares the **same schema** as `mainEmitter`. The `isSpawningEnabled` bool on `currentState` gates whether `spawnedEmitter` fields are authored.

## Notes

- The component prim is named `VFXEmitter` in USDA, not `ParticleEmitter`
- Internal USD type uses `RealityKitStruct` for nested state containers
- 107 fixture files provide comprehensive coverage across all field variations
