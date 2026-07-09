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

// Strip light markdown (links, emphasis, code marks) to plain text for schema fields.
function stripMd(s) {
    return s
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
        .replace(/\*\*([^*]+)\*\*/g, '$1')       // **bold** -> bold
        .replace(/[*_`]/g, '')                    // stray emphasis/code marks
        .trim();
}

// Extract FAQ pairs from a "## Frequently asked questions" (or "## FAQ") section so we
// can emit FAQPage JSON-LD. Convention (see the seo skill's writing-content.md): each
// item is a single paragraph that opens with a bold question, e.g.
//   **Does VoicePrompter work offline?** Yes — speech recognition runs on-device.
function extractFaqs(md) {
    const faqs = [];
    let inFaq = false;
    for (const line of md.split('\n')) {
        const h2 = line.match(/^##\s+(.*\S)\s*$/);
        if (h2) {
            inFaq = /frequently asked|faq/i.test(h2[1].trim());
            continue;
        }
        if (/^#{1,6}\s/.test(line)) { inFaq = false; continue; } // any other heading ends the section
        if (!inFaq) continue;
        const m = line.match(/^\s*\*\*(.+?)\*\*[:.\s]*(.+\S)\s*$/);
        if (m) faqs.push({ question: stripMd(m[1]), answer: stripMd(m[2]) });
    }
    return faqs;
}

const articles = [];

// Process each markdown file
mdFiles.forEach(file => {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter and content
    const { data: frontmatter, content } = matter(fileContent);

    // The template renders the frontmatter title as the page <h1>; strip a leading
    // markdown H1 from the body so posts don't ship two h1 tags.
    const contentWithoutH1 = content.replace(/^\s*# .*\n+/, '');

    // Pre-process Obsidian wiki-style links → standard markdown
    const processedContent = convertWikiLinks(contentWithoutH1);

    // Convert markdown to HTML
    let htmlContent = marked(processedContent);
    
    // Convert internal markdown links (.md) to HTML links (.html)
    htmlContent = htmlContent.replace(/href="(\.[^"]*)\.md"/g, 'href="$1.html"');

    // Performance: lazy-load + async-decode content images, but keep the first image
    // eager (it's usually the hero / LCP element) and give it high fetch priority.
    let imgCount = 0;
    htmlContent = htmlContent.replace(/<img\b([^>]*)>/g, (full, attrs) => {
        if (/\bloading=/.test(attrs)) return full; // respect any explicit setting
        imgCount += 1;
        return imgCount === 1
            ? `<img${attrs} decoding="async" fetchpriority="high">`
            : `<img${attrs} loading="lazy" decoding="async">`;
    });

    // Add ids to h2 headings and build a small table of contents for long posts
    const tocEntries = [];
    htmlContent = htmlContent.replace(/<h2>([^<]+)<\/h2>/g, (full, text) => {
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        tocEntries.push({ id, text });
        return `<h2 id="${id}">${text}</h2>`;
    });
    const tocHtml = tocEntries.length >= 4
        ? `<nav class="article-toc" aria-label="Contents"><strong>In this article</strong><ul>${tocEntries
              .map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`)
              .join('')}</ul></nav>`
        : '';

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
        content: htmlContent,
        toc: tocHtml,
        video: Boolean(frontmatter.video && frontmatter.video.videoId)
    };

    // Generate JSON-LD Schema
    const isoDate = (() => {
        const d = new Date(article.date);
        return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
    })();
    article.isoDate = isoDate;

    articles.push(article);
    
    const schemas = [];
    
    const SITE = 'https://voiceprompter.app';
    const pageUrl = `${SITE}/blog/${article.slug}.html`;

    // dateModified powers the freshness signal when a post is refreshed. Set an
    // `updated:` (or `dateModified:`) frontmatter field on a refresh; otherwise it
    // mirrors the publish date.
    const modifiedIso = (() => {
        const src = frontmatter.updated || frontmatter.dateModified;
        if (src) { const d = new Date(src); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]; }
        return isoDate;
    })();

    // Article Schema (enriched: dateModified, author entity, publisher)
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.description,
        "image": article.image || `${SITE}/og-image.png`,
        "datePublished": isoDate,
        "dateModified": modifiedIso,
        "author": {
            "@type": "Person",
            "name": "Konstantin Suvorov",
            "url": `${SITE}/about.html`
        },
        "publisher": {
            "@type": "Organization",
            "name": "VoicePrompter",
            "url": `${SITE}/`,
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE}/logo-no-bg.png`
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": pageUrl
        }
    };
    schemas.push(articleSchema);

    // Breadcrumb Schema (Home › Blog › Article) — aids SERP breadcrumbs and crawl context
    schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE}/` },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE}/blog/` },
            { "@type": "ListItem", "position": 3, "name": article.title, "item": pageUrl }
        ]
    });

    // FAQPage Schema — generated from the post's FAQ section when present (see extractFaqs)
    const faqs = extractFaqs(content);
    if (faqs.length) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": { "@type": "Answer", "text": f.answer }
            }))
        });
    }

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
        .replace(/\{\{TOC\}\}/g, article.toc || '')
        .replace(/\{\{HERO\}\}/g,
            article.image && !article.video && !/ytimg\.com/.test(article.image)
                ? `<img class="article-hero" src="${article.image}" alt="" decoding="async" fetchpriority="high">`
                : '')
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

// Blog + FAQPage JSON-LD for the index page
const blogSchema = [
    {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": "https://voiceprompter.app/blog/",
        "name": "VoicePrompter Blog",
        "description": "Hands-on guides to voice-tracking teleprompters, natural on-camera delivery, and faster video production.",
        "url": "https://voiceprompter.app/blog/",
        "dateModified": new Date().toISOString().split('T')[0],
        "author": {
            "@type": "Person",
            "name": "Konstantin Suvorov",
            "url": "https://voiceprompter.app/about.html"
        },
        "publisher": {
            "@type": "Organization",
            "name": "VoicePrompter",
            "url": "https://voiceprompter.app/",
            "logo": { "@type": "ImageObject", "url": "https://voiceprompter.app/logo-no-bg.png" }
        },
        "blogPost": articles.slice(0, 30).map(a => ({
            "@type": "BlogPosting",
            "headline": a.title,
            "url": `https://voiceprompter.app/blog/${a.slug}.html`,
            "datePublished": a.isoDate || undefined
        }))
    },
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is a voice-scrolling teleprompter?",
                "acceptedAnswer": { "@type": "Answer", "text": "A teleprompter that uses speech recognition to follow your actual words and advance the script as you speak, pausing when you pause, instead of crawling at a fixed speed." }
            },
            {
                "@type": "Question",
                "name": "Can I use a teleprompter with Zoom or Google Meet?",
                "acceptedAnswer": { "@type": "Answer", "text": "Yes. On a Mac, VoicePrompter floats above the call and stays invisible during screen sharing, so participants and recordings never see your script." }
            },
            {
                "@type": "Question",
                "name": "Is there a free teleprompter app?",
                "acceptedAnswer": { "@type": "Answer", "text": "Yes. The VoicePrompter web app is completely free in any browser, and the native Mac, iPhone, and iPad apps have a free tier that includes full voice tracking with 3 custom scripts." }
            }
        ]
    }
];
const blogSchemaBlock = `<script type="application/ld+json">\n${JSON.stringify(blogSchema, null, 2)}\n</script>`;

const indexHtml = indexTemplate
    .replace('/*BLOG_SCHEMA*/', blogSchemaBlock)
    .replace('/*ARTICLES_HTML*/', articleCards);
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
    <loc>https://voiceprompter.app/ios/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.app/ipad/</loc>
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
    `  <url>
    <loc>https://voiceprompter.app/changelog.html</loc>
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
