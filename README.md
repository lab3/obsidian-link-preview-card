# Link Preview Card

An [Obsidian](https://obsidian.md) plugin that renders rich link preview cards for image-link syntax — like the previews you see in iMessage or Signal.

## How it works

When you write an image link pointing to a web URL, the plugin fetches the page's Open Graph metadata and renders a card in its place:

```markdown
![Some article](https://example.com/article)
```

This renders as a compact horizontal card showing the page title, description, thumbnail image, and domain — instead of a broken image or raw URL.

Works in both **Live Preview** and **Reading View**.

## Features

- Fetches Open Graph metadata (title, description, image, site name)
- Compact horizontal card layout with thumbnail
- Favicon fallback when no OG image is available
- Collapse/expand toggle — state is persisted per URL across sessions
- Loading skeleton while fetching
- Graceful error state with a fallback link
- "Collapse previews by default" setting

## Settings

| Setting | Description |
|---|---|
| Collapse previews by default | When enabled, all cards start collapsed and must be manually expanded |


## License

[MIT](LICENSE)
