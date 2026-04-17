---
componentId: custom-component-types
axis: general
claim: "WWDC 2023 officially documented that custom components support only 'simpler data' types — scalars, strings, SIMD values, and enums — with Xcode build-time errors for unsupported types."
summary: "Apple's WWDC 2023 session 'Work with Reality Composer Pro content in Xcode' explicitly defines custom component type constraints. The session demonstrates PointOfInterestComponent with String, custom enum, and Optional<String> fields, and warns that Xcode produces errors for types RCP cannot serialize."
scope: USDA authored
sourceType: inference
confidence: high
status: confirmed
author: elkraneo
date: 2026-04-17
rcpVersion: "26.4"
xcodeBuild: "Xcode 26.4 (17C529)"
reproSteps:
  - "Watch WWDC 2023 session 'Work with Reality Composer Pro content in Xcode' (wwdc2023-10273)."
  - "Navigate to ~22:31 where the speaker discusses custom component type constraints."
  - "Observe the PointOfInterestComponent example showing String, enum, and Optional<String> fields."
  - "Note the explicit warning: 'You'll see an error in your Xcode project if you add a property to your custom component that's of a type that Reality Composer Pro won't serialize.'"
  - "Cross-reference demonstrated types with the USD-serializable subset (bool, int, uint, float, double, string, token, float2/3/4, quatf)."
evidence:
  - type: doc
    path: https://developer.apple.com/videos/play/wwdc2023/10273/
    artifactLabel: "WWDC 2023 — Work with Reality Composer Pro content in Xcode"
    note: "Official Apple session documenting custom component type constraints at ~22:31"
    publicUrl: https://developer.apple.com/videos/play/wwdc2023/10273/
  - type: doc
    path: /Volumes/Plutonian/_Developer/uncannyuse-Workspace/source/uncannyuse.com/src/data/features/custom-component-types.json
    artifactLabel: "Custom component type support matrix"
    note: "52 Swift types tested against RCP — confirms the 'simpler data' constraint"
    publicUrl: https://uncannyuse.com/features/custom-component-types
supersedes: []
---

## Official Statement from Apple

At WWDC 2023, Apple explicitly defined the boundaries of custom component type support in the session **"Work with Reality Composer Pro content in Xcode"** (wwdc2023-10273).

At approximately **22:31**, the speaker states:

> **"Design-time components are for housing simpler data, such as ints, strings, and SIMD values, things that 3D artists and designers will make use of."**

And crucially:

> **"You'll see an error in your Xcode project if you add a property to your custom component that's of a type that Reality Composer Pro won't serialize."**

## Verified Types from the Session

The session demonstrates a `PointOfInterestComponent` example:

```swift
public struct PointOfInterestComponent: Component, Codable {
    public var region: Region = .yosemite  // Custom enum (serializes as string/token)
    public var name: String = "Ribbon Beach"
    public var description: String?        // Optional String
}
```

## Supported Type Categories

| Category | Swift Types | USD Type | Status |
|----------|-------------|----------|--------|
| **Scalars** | `Bool`, `Int`, `UInt`, `Float`, `Double`, `String` | `bool`, `int`, `uint`, `float`, `double`, `string` | ✓ Supported |
| **Optionals** | `String?`, scalar optionals | Same as base type | ✓ Supported |
| **SIMD** | `SIMD2<Float>`, `SIMD3<Float>`, `SIMD4<Float>`, `simd_quatf` | `float2`, `float3`, `float4`, `quatf` | ✓ Supported |
| **Enums** | Custom string-based enums | `token` | ✓ Supported |
| **Arrays** | `[Bool]`, `[Int]`, `[Float]`, etc. | `bool[]`, `int[]`, `float[]` | ✗ Not supported |

## What to Avoid

The session's "simpler data" constraint explicitly excludes:

| Unsupported Type | Example | Why It Fails |
|------------------|---------|--------------|
| **Entity references** | `Entity?` | Use `rel` relationships instead |
| **Complex nested structs** | Nested `Codable` | Only simple enums serialize |
| **Runtime-only types** | `ObjectIdentifier` | Not USD-serializable |
| **Half-precision SIMD** | `SIMD3<Float16>` | No `half3` support in RCP |
| **Integer vectors** | `SIMD3<Int32>` | No `int3` support in RCP |

## Build-Time Validation

Unlike runtime errors, RCP provides **compile-time feedback** through Xcode:

```
RCP generates Swift code from the USD schema
        ↓
Xcode attempts to compile the generated code
        ↓
Build fails with clear error for unsupported types
```

This makes custom components self-documenting — the supported types are exactly those that survive the codegen → compile pipeline.

## Inspector-Safe Type Palette

For custom component field editing in Deconstructed, use these verified types:

| # | Category | Swift Types |
|---|----------|-------------|
| 1 | **Scalars** | `Bool`, `Int`, `UInt`, `Float`, `Double`, `String` |
| 2 | **Optionals** | `Bool?`, `Int?`, `Float?`, `String?` |
| 3 | **SIMD** | `SIMD2<Float>`, `SIMD3<Float>`, `SIMD4<Float>`, `simd_quatf` |
| 4 | **Enums** | `String` or `Int` raw-value enums |
| 5 | **Arrays** | ⚠️ Currently unsupported in RCP |