# Blog System

The blog uses markdown files that are automatically converted to HTML during build.

## File Structure

```
blog/
├── *.md                        # Article markdown files (source of truth)
├── index.html                  # Auto-generated blog hub
└── *.html                      # Auto-generated article pages

scripts/
├── build-blog.js               # Build script
├── article-template.html       # Template for all article pages
└── blog-index-template.html    # Template for blog hub
```

## Adding a New Article

1. Create a new markdown file in `blog/`:

```markdown
---
title: "Your Article Title"
description: "A brief description for SEO and preview cards"
keywords: ["keyword1", "keyword2", "keyword3"]
date: "Month DD, YYYY"
image: "https://images.unsplash.com/photo-xxxx"
---

# Your Article Title

Your markdown content here...
```

2. Run the build:

```bash
npm run build:blog
```

3. The script automatically:
   - Generates `your-article-slug.html`
   - Updates `blog/index.html` with the new article card
   - Prints vite config entries (copy to `vite.config.ts` if needed)

## Changing the Design

To change the design for **all articles**, edit one file:

- **Article pages**: `scripts/article-template.html`
- **Blog hub**: `scripts/blog-index-template.html`

Then run `npm run build:blog` to regenerate all pages.

## Build Process

The build happens automatically:
```bash
npm run build  # Runs build:blog → tsc → vite build
```

## Template Variables

Article template uses:
- `{{TITLE}}` - Article title
- `{{DESCRIPTION}}` - Article description
- `{{DATE}}` - Publication date
- `{{KEYWORDS}}` - Comma-separated keywords
- `{{CONTENT}}` - Rendered HTML from markdown
