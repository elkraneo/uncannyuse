# Contributing Resources

This project accepts curated resource links for RealityKit components.

## File to Edit

- `src/data/resources/realitykit-resources.json`

## Data Shape

```json
{
  "resources": {
    "component-id": [
      {
        "title": "Optional manual title override for the preview card",
        "url": "https://example.com/resource",
        "type": "official-docs | sample | article | video | issue",
        "source": "Apple | GitHub | Forum | Community",
        "verifiedAt": "YYYY-MM-DD",
        "description": "Optional manual description override for the preview card",
        "image": "https://example.com/preview-image.jpg"
      }
    ]
  }
}
```

## Rules

- Use a valid existing component id from `src/data/features/realitykit-components.json`.
- Prefer primary sources first (Apple docs, official sample code, official forums).
- Avoid duplicate URLs for the same component.
- `title`, `description`, and `image` are optional overrides.
- If omitted, preview values are fetched from OG/Twitter/meta tags at build time.
- Keep manual titles concise and specific when you provide them.
- Set `verifiedAt` to the date you checked the link.

## PR Checklist

- Resource opens without auth paywall.
- Resource clearly relates to the selected component.
- JSON remains valid.
