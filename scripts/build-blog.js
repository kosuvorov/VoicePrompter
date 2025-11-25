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

const articles = [];

// Process each markdown file
mdFiles.forEach(file => {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter and content
    const { data: frontmatter, content } = matter(fileContent);

    // Convert markdown to HTML
    const htmlContent = marked(content);

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

    // Generate HTML from template
    let html = articleTemplate
        .replace(/\{\{TITLE\}\}/g, article.title)
        .replace(/\{\{DESCRIPTION\}\}/g, article.description)
        .replace(/\{\{DATE\}\}/g, article.date)
        .replace(/\{\{CONTENT\}\}/g, article.content)
        .replace(/\{\{KEYWORDS\}\}/g, article.keywords.join(', '))
        .replace(/\{\{SLUG\}\}/g, article.slug)
        .replace(/\{\{IMAGE\}\}/g, article.image || 'https://voiceprompter.xyz/og-image.png');

    // Write HTML file
    const outputPath = path.join(BLOG_DIR, `${slug}.html`);
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Generated ${slug}.html`);
});

// Generate blog index
const articleCards = articles.map(article => `
    {
        slug: '${article.slug}',
        title: '${article.title.replace(/'/g, "\\'")}',
        description: '${article.description.replace(/'/g, "\\'")}',
        date: '${article.date}',
        image: '${article.image}'
    }`).join(',\n');

const indexHtml = indexTemplate.replace('/*ARTICLES_DATA*/', articleCards);
fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexHtml);
console.log(`✓ Generated blog index with ${articles.length} articles`);

// Generate sitemap.xml
const today = new Date().toISOString().split('T')[0];
const sitemapEntries = [
    `  <url>
    <loc>https://voiceprompter.xyz/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.xyz/about.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
    `  <url>
    <loc>https://voiceprompter.xyz/blog/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    ...articles.map(article => `  <url>
    <loc>https://voiceprompter.xyz/blog/${article.slug}.html</loc>
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
