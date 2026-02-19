## Summary

- What claim(s) are being added or updated?
- Which component(s) are affected?

## RCP Research Note Checklist

- [ ] Added or updated Markdown claim file(s) under `src/content/rcp-claims/`.
- [ ] `componentId` matches an existing ID from `src/data/features/realitykit-components.json`.
- [ ] All mandatory fields are present:
  - `claim`
  - `summary`
  - `scope`
  - `evidence`
  - `sourceType`
  - `confidence`
  - `status`
  - `author`
  - `date`
  - `rcpVersion`
  - `xcodeBuild`
  - `reproSteps`
- [ ] Claim is atomic (one behavior per claim).
- [ ] Evidence paths and repro steps are concrete enough for another reviewer to verify.
- [ ] Added `evidence.publicUrl` where a public artifact is available.
- [ ] Added `evidence.artifactLabel` for clearer evidence names in UI.
- [ ] If replacing older knowledge, `status`/`supersedes`/`supersededBy` are updated.

## Validation

- [ ] Ran `npm run build` locally.
