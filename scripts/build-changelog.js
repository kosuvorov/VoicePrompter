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

// Split the markdown into platform sections on level-2 headings.
// Each `## Heading` becomes a tab; new sections in changelog.md become tabs automatically.
function tabMeta(heading) {
    if (/apple|ios|mac/i.test(heading)) return { id: 'apple', label: 'Apple Apps' };
    if (/web/i.test(heading)) return { id: 'web', label: 'Web App' };
    if (/windows/i.test(heading)) return { id: 'windows', label: 'Windows' };
    if (/android/i.test(heading)) return { id: 'android', label: 'Android' };
    const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { id: slug, label: heading.split('(')[0].trim() };
}

const rawSections = markdownContent.split(/^## /m).slice(1);
const sections = rawSections.map((raw) => {
    const heading = raw.split('\n')[0].trim();
    const body = raw.slice(raw.indexOf('\n') + 1).replace(/^---\s*$/m, '');
    const { id, label } = tabMeta(heading);
    return { id, label, heading, html: marked(body) };
});

if (sections.length === 0) {
    console.error('❌ Error: no "## " sections found in changelog.md');
    process.exit(1);
}

const tabsHtml = sections.map((s, i) =>
    `<button class="changelog-tab${i === 0 ? ' active' : ''}" id="tab-${s.id}" role="tab" aria-selected="${i === 0}" aria-controls="panel-${s.id}" data-panel="${s.id}">${s.label}</button>`
).join('\n            ');

const panelsHtml = sections.map((s, i) => `
        <section class="changelog-panel${i === 0 ? ' active' : ''}" id="panel-${s.id}" role="tabpanel" aria-labelledby="tab-${s.id}">
            <h2 class="changelog-section-title">${s.heading}</h2>
            ${s.html}
        </section>`).join('\n');

const htmlContent = `
        <div class="changelog-tabs" role="tablist" aria-label="Platform">
            ${tabsHtml}
        </div>
${panelsHtml}
        <script>
        (function () {
            const tabs = document.querySelectorAll('.changelog-tab');
            const panels = document.querySelectorAll('.changelog-panel');
            function activate(id, updateHash) {
                tabs.forEach(t => {
                    const on = t.dataset.panel === id;
                    t.classList.toggle('active', on);
                    t.setAttribute('aria-selected', on);
                });
                panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + id));
                if (updateHash) history.replaceState(null, '', '#' + id);
            }
            tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.panel, true)));
            const fromHash = location.hash.slice(1);
            if (fromHash && document.getElementById('panel-' + fromHash)) activate(fromHash, false);
        })();
        </script>`;

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
