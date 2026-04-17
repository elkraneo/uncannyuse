---
componentId: custom-component-types
axis: general
claim: "The complete set of supported custom component field types is bounded by OpenUSD's finite type system, not Swift's infinite one."
summary: "OpenUSD has a closed, enumerable set of SdfValueTypeNames. Swift's type system is open-ended and Turing-complete. RCP cannot support all Swift types — it supports the USD-serializable subset: Swift types that map directly to SdfValueTypeNames, plus special cases like enums, arrays, and optionals."
scope: USDA authored
sourceType: inference
confidence: high
status: confirmed
author: elkraneo
date: 2026-04-17
rcpVersion: "26.3"
xcodeBuild: "Xcode 26.4 (17C529)"
reproSteps:
  - "Enumerate all SdfValueTypeNames from the OpenUSD specification (bool, int8-uint64, half/float/double, string/token/asset, vec2-4, quat, mat2-4, timecode, rel, arrays)."
  - "Enumerate Swift's type categories (primitives, standard library, user-defined, generic, function types, protocol existentials)."
  - "Observe that OpenUSD types are finite (~40 base types) while Swift types are infinite."
  - "Intersect empirically: compile custom components with each Swift type in RCP and observe which ones survive codegen."
  - "Confirm that supported types correspond 1:1 with SdfValueTypeNames mappings."
evidence:
  - type: doc
    path: https://openusd.org/release/api/sdf_page_front.html
    artifactLabel: OpenUSD SdfValueTypeNames reference
    note: Official documentation of the finite set of USD value types
  - type: fixture
    path: /Volumes/Plutonian/_Developer/uncannyuse-Workspace/source/uncannyuse.com/src/data/features/custom-component-types.json
    artifactLabel: Empirical type support matrix
    note: 52 Swift types tested against RCP — 28 supported, 16 unsupported, 8 untested
supersedes: []
---

## OpenUSD Types: Finite and Documented

OpenUSD has a closed, well-documented set of `SdfValueTypeNames`. The core types are:

- **Bool:** `bool`
- **Integers:** `int8`, `int16`, `int32`, `int64`, `uint8`, `uint16`, `uint32`, `uint64`
- **Floats:** `half` (16-bit), `float`, `double`
- **Strings:** `string`, `token`, `asset`
- **Vectors:** `vec2h/f/d/i`, `vec3h/f/d/i`, `vec4h/f/d/i`
- **Quaternions:** `quath`, `quatf`, `quatd`
- **Matrices:** `mat2d`, `mat3d`, `mat4d`
- **Special:** `frame4d`, `timecode`, `rel`, arrays of all above

Plus USD-specific concepts like `path`, `variantset`, etc.

Source: [OpenUSD SdfValueTypeNames](https://openusd.org/release/api/sdf_page_front.html)

## Swift Types: Infinite

Swift has:

- Built-in primitives (`Bool`, `Int`, `Float`, `String`, etc.)
- Standard library types (`Array`, `Dictionary`, `Optional`, `URL`, `UUID`, `Date`, `Data`)
- User-defined types (structs, enums, classes — infinitely many)
- Generic types (also infinite)
- Function types, closures
- Protocol existentials

Swift's type system is Turing-complete — you can write Swift code that generates new types at compile time.

## The Critical Realization

This means RCP cannot support "all Swift types" — it must be doing one of these:

1. **Whitelist approach:** Only specific Swift types are allowed, everything else is rejected at compile-time
2. **USD-serializable subset:** Only types that map to OpenUSD `SdfValueTypeNames` work
3. **Codable derivation:** Uses Swift's `Codable` synthesis, but only for types whose encoded form maps to USD types

Since OpenUSD types are finite and known, the complete list of supported custom component types is **bounded by OpenUSD's type system, not Swift's**.

RCP likely supports exactly those Swift types that have a direct mapping to OpenUSD `SdfValueTypeNames`, plus some special cases like:

- Custom enums (map to `token` or `string`)
- Arrays (map to USD arrays)
- Optionals (map to nullable values)
