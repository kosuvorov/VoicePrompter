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
        .replace(/\{\{KEYWORDS\}\}/g, article.keywords.join(', '));

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

// Generate vite config entries
const viteEntries = articles.map((article, index) =>
    `                blog_article${index + 1}: 'blog/${article.slug}.html'`
).join(',\n');

console.log('\n📝 Add these to vite.config.ts:\n');
console.log(viteEntries);
