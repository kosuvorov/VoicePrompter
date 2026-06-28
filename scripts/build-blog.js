import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const BLOG_DIR = path.join(__dirname, '../blog');
const TEMPLATE_PATH = path.join(__dirname, 'article-template.html');
const INDEX_TEMPLATE_PATH = path.join(__dirname, 'blog-index-template.html');

// Read templates
const articleTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const indexTemplate = fs.readFileSync(INDEX_TEMPLATE_PATH, 'utf-8');

// Get all markdown files
const mdFiles = fs.readdirSync(BLOG_DIR)
    .filter(file => file.endsWith('.md'))
    .sort();

// Build a lookup of available slugs (filename without .md) so wiki links can
// match either "Display Title" or "actual-slug-name"
const slugify = (s) => s.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
const availableSlugs = new Set(mdFiles.map(f => f.replace('.md', '')));

// Convert Obsidian-style wiki links to standard markdown before marked() runs.
// Supports:
//   [[note]]                 → [note](note.html)
//   [[note|text]]            → [text](note.html)
//   [[note#heading]]         → [note](note.html#heading)
//   [[Some Title]]           → [Some Title](some-title.html)  (slugified)
//   ![[image.png]]           → <img src="image.png" alt="image.png">
//   ![[image.png|300]]       → <img src="image.png" alt="image.png" width="300">
function convertWikiLinks(md) {
    // Embedded images first (the leading ! distinguishes them from links)
    md = md.replace(/!\[\[([^\]|]+\.(png|jpg|jpeg|gif|webp|svg))(?:\|([^\]]+))?\]\]/gi,
        (_match, filename, sizeOrAlt) => {
            const widthAttr = /^\d+$/.test(sizeOrAlt || '') ? ` width="${sizeOrAlt}"` : '';
            return `<img src="${filename}" alt="${filename}"${widthAttr}>`;
        });

    // Note links
    md = md.replace(/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g,
        (_match, target, heading, display) => {
            const targetTrim = target.trim();
            // If it matches an existing slug exactly, use as-is; otherwise slugify
            const slug = availableSlugs.has(targetTrim) ? targetTrim : slugify(targetTrim);
            const text = (display || targetTrim).trim();
            const anchor = heading ? `#${slugify(heading)}` : '';
            return `[${text}](${slug}.html${anchor})`;
        });

    return md;
}

const articles = [];

// Process each markdown file
mdFiles.forEach(file => {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter and content
    const { data: frontmatter, content } = matter(fileContent);

    // Pre-process Obsidian wiki-style links → standard markdown
    const processedContent = convertWikiLinks(content);

    // Convert markdown to HTML
    let htmlContent = marked(processedContent);
    
    // Convert internal markdown links (.md) to HTML links (.html)
    htmlContent = htmlContent.replace(/href="(\.[^"]*)\.md"/g, 'href="$1.html"');

    // Generate slug from filename
    const slug = file.replace('.md', '');

    // Create article data
    const article = {
        slug,
        title: frontmatter.title || 'Untitled',
        description: frontmatter.description || '',
        date: frontmatter.date || 'Unknown date',
        image: frontmatter.image || '',
        keywords: frontmatter.keywords || [],
        content: htmlContent
    };

    articles.push(article);

    // Generate JSON-LD Schema
    const isoDate = (() => {
        const d = new Date(article.date);
        return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
    })();
    
    const schemas = [];
    
    // Article Schema
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.description,
        "image": article.image || 'https://voiceprompter.app/og-image.png',
        "datePublished": isoDate,
        "author": {
            "@type": "Person",
            "name": "Konstantin Suvorov"
        }
    };
    schemas.push(articleSchema);

    // Generate VideoObject JSON-LD schema if frontmatter declares a video
    if (frontmatter.video && frontmatter.video.videoId) {
        const videoId = frontmatter.video.videoId;
        const videoSchema = {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": article.title,
            "description": article.description,
            "thumbnailUrl": [`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`],
            "uploadDate": frontmatter.video.uploadDate || isoDate,
            "contentUrl": `https://youtu.be/${videoId}`,
            "embedUrl": `https://www.youtube.com/embed/${videoId}`,
            ...(frontmatter.video.duration ? { duration: frontmatter.video.duration } : {})
        };
        schemas.push(videoSchema);
    }
    
    const jsonLdBlock = `<script type="application/ld+json">\n${JSON.stringify(schemas, null, 2)}\n</script>`;

    // Generate HTML from template
    let html = articleTemplate
        .replace(/\{\{TITLE\}\}/g, article.title)
        .replace(/\{\{DESCRIPTION\}\}/g, article.description)
        .replace(/\{\{DATE\}\}/g, article.date)
        .replace(/\{\{CONTENT\}\}/g, article.content)
        .replace(/\{\{KEYWORDS\}\}/g, article.keywords.join(', '))
        .replace(/\{\{SLUG\}\}/g, article.slug)
        .replace(/\{\{IMAGE\}\}/g, article.image || 'https://voiceprompter.app/og-image.png')
        .replace(/\{\{JSON_LD_SCHEMA\}\}/g, jsonLdBlock);

    // Write HTML file
    const outputPath = path.join(BLOG_DIR, `${slug}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Generated ${slug}.html`);
});

// Sort articles by date (newest first)
articles.sort((a, b) => new Date(b.date) - new Date(a.date));

// Generate blog index HTML for SEO
const articleCards = articles.map(article => `
            <a href="/blog/${article.slug}.html" class="article-card">
                <img src="${article.image || 'https://voiceprompter.app/og-image.png'}" alt="${article.title.replace(/"/g, '&quot;')}" class="article-thumb" loading="lazy">
                <div class="article-body">
                    <div class="article-date">${article.date}</div>
                    <h2 class="article-title">${article.title}</h2>
                    <p class="article-desc">${article.description}</p>
                    <span class="article-cta">Read article →</span>
                </div>
            </a>`).join('\n');

const indexHtml = indexTemplate.replace('/*ARTICLES_HTML*/', articleCards);
fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexHtml);
console.log(`✓ Generated static blog index with ${articles.length} articles`);

// Generate sitemap.xml
const today = new Date().toISOString().split('T')[0];
const sitemapEntries = [
    `  <url>
    <loc>https://voiceprompter.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
    // Note: /app/ is intentionally excluded — it's the live PWA UI and is noindexed.
    `  <url>
    <loc>https://voiceprompter.app/web/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.app/mac/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.app/about.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.app/privacy.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.app/terms.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.app/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    ...articles.map(article => `  <url>
    <loc>https://voiceprompter.app/blog/${article.slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</urlset>
`;

const publicDir = path.join(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
console.log(`✓ Generated sitemap.xml with ${sitemapEntries.length} URLs`);

// Generate vite config entries
const viteEntries = articles.map((article, index) =>
    `                blog_article${index + 1}: 'blog/${article.slug}.html'`
).join(',\n');

console.log('\n📝 Add these to vite.config.ts:\n');
console.log(viteEntries);
