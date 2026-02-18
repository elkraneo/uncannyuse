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
        "title": "Human-readable resource title",
        "url": "https://example.com/resource",
        "type": "official-docs | sample | article | video | issue",
        "source": "Apple | GitHub | Forum | Community",
        "verifiedAt": "YYYY-MM-DD"
      }
    ]
  }
}
```

## Rules

- Use a valid existing component id from `src/data/features/realitykit-components.json`.
- Prefer primary sources first (Apple docs, official sample code, official forums).
- Avoid duplicate URLs for the same component.
- Keep titles concise and specific.
- Set `verifiedAt` to the date you checked the link.

## PR Checklist

- Resource opens without auth paywall.
- Resource clearly relates to the selected component.
- JSON remains valid.
