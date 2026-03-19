## Context

Currently, uncannyuse.com is a static Astro site backed by JSON data files in `src/data/`. The schema matrix for RealityKit components is complex, deeply nested JSON that serves both as:

1. The source of truth for the documentation site
2. A potential data source for future tools (RCP inspectors, diff viewers, etc.)

## Proposal: Structured API Layer

### Why an API?

- **Separation of concerns**: The site becomes a *consumer* of data, not a *coupler* to data structure
- **Reusability**: The same API could power web UI, CLI tools, VS Code extensions, or third-party integrations
- **Flexibility**: Clients can request specific slices (just fields for component X, or matrix filtered by variant count)
- **Evolution**: We can add pagination, filtering, versioning without rebuilding the entire site

### Proposed Architecture

```
src/
├── data/                    # Current JSON files (source of truth)
├── api/                     # New API layer
│   ├── components/
│   │   └── [id]/
│   │       ├── schema.json      # Full schema for one component
│   │       ├── fields.csv       # Flat field list
│   │       └── matrix.csv       # Variant × field matrix
│   ├── features/
│   │   └── index.json           # Feature list with metadata
│   └── claims/
│       └── index.json           # All RCP claims
```

### Implementation Approach

1. **Build-time API generation**: Astro builds generate static JSON/CSV endpoints alongside pages
2. **Optional runtime API**: Could later migrate to a lightweight server (Astro SSR, Cloudflare Workers, or a simple Express/Fastify service)
3. **Type safety**: Use TypeScript throughout with Zod for runtime validation

### Benefits

- **Immediate**: No infrastructure changes - generate static files at build time
- **Future-proof**: Drop-in replacement for a real API when ready
- **Low cost**: Zero additional hosting if using Astro's static generation
- **Observable**: Easy to see what the API *would* look like before committing to runtime

### Scope for v1

- [ ] JSON endpoints for each component schema (`/api/components/[id]/schema.json`)
- [ ] CSV export endpoints for fields and matrix
- [ ] Feature index endpoint (`/api/features/index.json`)
- [ ] Claims index endpoint (`/api/claims/index.json`)
- [ ] Self-describing API root (`/api/index.json` listing available endpoints)

### Open Questions

1. Should we version the API (`/api/v1/...`) from the start?
2. Do we need authentication for any endpoints?
3. Should we support filtering/query params in v1 or just static files?
4. What format for errors? (Currently no errors in static approach)

---

*This is an exploration ticket - implementation can proceed incrementally.*
