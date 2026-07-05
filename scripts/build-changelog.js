import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const CHANGELOG_MD_PATH = path.join(ROOT_DIR, 'changelog.md');
const TEMPLATE_PATH = path.join(__dirname, 'changelog-template.html');
const OUTPUT_PATH = path.join(ROOT_DIR, 'changelog.html');

console.log('🚀 Generating changelog.html...');

if (!fs.existsSync(CHANGELOG_MD_PATH)) {
    console.error(`❌ Error: changelog.md not found at ${CHANGELOG_MD_PATH}`);
    process.exit(1);
}

if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Error: Template not found at ${TEMPLATE_PATH}`);
    process.exit(1);
}

// Read template and markdown source
const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const markdownContent = fs.readFileSync(CHANGELOG_MD_PATH, 'utf-8');

// Parse markdown to HTML
const htmlContent = marked(markdownContent);

// Metadata variables
const title = 'What\'s New';
const description = 'Latest updates, feature releases, and version history for VoicePrompter iOS, macOS, iPadOS, and Web apps.';
const keywords = 'voiceprompter changelog, whats new, updates, release notes, teleprompter updates';
const siteUrl = 'https://voiceprompter.app';
const changelogUrl = `${siteUrl}/changelog.html`;

// Generate JSON-LD Schema
const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "VoicePrompter",
        "operatingSystem": "iOS, macOS, iPadOS, Web",
        "applicationCategory": "MultimediaApplication",
        "softwareVersion": "3.3",
        "releaseNotes": changelogUrl,
        "author": {
            "@type": "Person",
            "name": "Konstantin Suvorov",
            "url": `${siteUrl}/about.html`
        },
        "publisher": {
            "@type": "Organization",
            "name": "VoicePrompter",
            "url": siteUrl
        }
    },
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}/` },
            { "@type": "ListItem", "position": 2, "name": "Changelog", "item": changelogUrl }
        ]
    }
];

const jsonLdBlock = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;

// Replace placeholders in template
const finalHtml = templateHtml
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{DESCRIPTION\}\}/g, description)
    .replace(/\{\{KEYWORDS\}\}/g, keywords)
    .replace(/\{\{IMAGE\}\}/g, `${siteUrl}/og-image.png`)
    .replace(/\{\{JSON_LD_SCHEMA\}\}/g, jsonLdBlock)
    .replace(/\{\{CONTENT\}\}/g, htmlContent);

// Write to root changelog.html
fs.writeFileSync(OUTPUT_PATH, finalHtml);
console.log('✓ Generated changelog.html successfully!');
