# RCP Reverse-Engineering Claims

This project supports PR-based, evidence-driven RCP research claims as a domain distinct from API/platform compatibility tables.

## Authoring Flow

1. Create a branch and add one or more Markdown files under `src/content/rcp-claims/`.
2. Use one file per atomic claim.
3. Open a PR and complete the checklist in `.github/pull_request_template.md`.
4. CI runs `npm run build`, which validates claim schema and component IDs.
5. After merge to `main`, deploy rebuild publishes the updated site.

## Required Frontmatter

```yaml
componentId: billboard-component
claim: Billboard component authors a top-level float blendFactor value in USDA.
summary: One-sentence evidence-backed summary shown on component pages.
scope: USDA authored
sourceType: direct-diff
confidence: high
status: confirmed
author: your-name
date: 2026-02-19
rcpVersion: "26.3 RC"
xcodeBuild: "26C..."
reproSteps:
  - Step 1
evidence:
  - type: diff
    path: /absolute/or/repo/path
    note: optional
supersedes: []
supersededBy:
```

## Allowed Values

- `scope`: `RCP UI`, `USDA authored`, `runtime behavior`
- `sourceType`: `direct-diff`, `inference`, `hypothesis`
- `confidence`: `low`, `medium`, `high`
- `status`: `confirmed`, `disputed`, `superseded`

`summary` is required and should be a short reviewer-facing synopsis.

## Component ID Source

Use a valid `componentId` from:

- `src/data/features/realitykit-components.json`

Invalid IDs fail build validation.
