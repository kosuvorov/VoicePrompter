import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const USE_CASES_JSON_PATH = path.join(__dirname, 'use-cases.json');
const TEMPLATE_PATH = path.join(__dirname, 'use-case-template.html');
const FAQS_PATH = path.join(__dirname, 'default-faqs.json');
const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'public/sitemap.xml');

// Load configurations
if (!fs.existsSync(USE_CASES_JSON_PATH)) {
    console.error(`❌ Configuration not found: ${USE_CASES_JSON_PATH}`);
    process.exit(1);
}
if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
}
if (!fs.existsSync(FAQS_PATH)) {
    console.error(`❌ FAQs configuration not found: ${FAQS_PATH}`);
    process.exit(1);
}

const useCases = JSON.parse(fs.readFileSync(USE_CASES_JSON_PATH, 'utf-8'));
const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const defaultFaqs = JSON.parse(fs.readFileSync(FAQS_PATH, 'utf-8'));

console.log(`🚀 Starting use-case pages generation (${useCases.length} configs)...`);

const generatedPaths = [];

useCases.forEach((useCase) => {
    let html = templateHtml;

    // 1. Process Video Embed Fallback
    let videoEmbed = useCase.heroVideoEmbed;
    const localVideoMatch = videoEmbed.match(/src="(\/videos\/[^"]+)"/);
    if (localVideoMatch) {
        const relativeVideoPath = localVideoMatch[1]; // e.g., /videos/google-meet-demo.mp4
        const physicalVideoPath = path.join(ROOT_DIR, 'public', relativeVideoPath);
        
        if (!fs.existsSync(physicalVideoPath)) {
            console.warn(`⚠️ Warning: Local video file not found at ${physicalVideoPath}. Falling back to default YouTube embed for ${useCase.name}.`);
            // Fallback default YouTube embed
            videoEmbed = `<div class="video-responsive"><iframe src="https://www.youtube.com/embed/07Xnj7q2c9Y" title="VoicePrompter for ${useCase.name}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
        }
    }

    // 2. Placeholder replacements
    let eyebrowOrBadge = '';
    if (useCase.isRootMac) {
        eyebrowOrBadge = `<p class="eyebrow">${useCase.eyebrow}</p>`;
    } else {
        eyebrowOrBadge = `
        <div class="platform-badge">
            <img src="${useCase.logo}" class="platform-badge-icon" alt="${useCase.name}">
        </div>`;
    }

    html = html
        .replace(/\{\{META_TITLE\}\}/g, useCase.metaTitle)
        .replace(/\{\{META_DESCRIPTION\}\}/g, useCase.metaDescription)
        .replace(/\{\{CANONICAL_URL\}\}/g, useCase.canonicalUrl)
        .replace(/\{\{HERO_TITLE\}\}/g, useCase.heroTitle)
        .replace(/\{\{HERO_SUBTITLE\}\}/g, useCase.heroSubtitle)
        .replace(/\{\{HERO_VIDEO_EMBED\}\}/g, videoEmbed)
        .replace(/\{\{PLATFORM_NAME\}\}/g, useCase.platformName || useCase.name)
        .replace(/\{\{HERO_EYEBROW_OR_BADGE\}\}/g, eyebrowOrBadge);

    // Footer CTA headline
    const footerCtaHeadline = useCase.footerCtaHeadline || 'Ready to stop memorizing?';
    html = html.replace(/\{\{FOOTER_CTA_HEADLINE\}\}/g, footerCtaHeadline);

    // Audience items HTML generation
    const iconSvgs = {
        users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        video: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>',
        book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
        mic: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
        globe: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
        monitor: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        briefcase: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
        clipboard: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
        star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    };

    let audienceHtml = '';
    if (useCase.audienceItems && useCase.audienceItems.length > 0) {
        const items = useCase.audienceItems.map(item => {
            const svg = iconSvgs[item.icon] || iconSvgs['users'];
            return `            <div class="audience-item">
                <div class="audience-icon">${svg}</div>
                <p><strong>${item.title}</strong> ${item.description}</p>
            </div>`;
        }).join('\n');
        audienceHtml = `        <h2>Who is this for?</h2>\n        <div class="audience-grid">\n${items}\n        </div>`;
    } else {
        // Fallback to generic copy
        audienceHtml = `        <h2>Who is this for?</h2>\n        <p class="audience-sub">VoicePrompter is built for anyone on a Mac who speaks on camera or on calls.</p>`;
    }
    html = html.replace(/\{\{AUDIENCE_ITEMS\}\}/g, audienceHtml);

    // Windows CTA block (only for non-root pages)
    const windowsCtaHtml = useCase.isRootMac ? '' : `    <!-- ═══════════════════════ Windows CTA ═══════════════════════ -->
    <div class="windows-cta container">
        <button class="btn-windows" id="windows-waitlist-btn" onclick="document.getElementById('windows-waitlist-dialog').classList.add('open')" data-umami-event="windows-waitlist-cta">
            <svg width="14" height="14" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="4" width="38" height="38" rx="3" fill="#F25022"/><rect x="46" y="4" width="38" height="38" rx="3" fill="#7FBA00"/><rect x="4" y="46" width="38" height="38" rx="3" fill="#00A4EF"/><rect x="46" y="46" width="38" height="38" rx="3" fill="#FFB900"/></svg>
            Download for Windows
        </button>
    </div>

    <!-- Windows Waitlist Modal -->
    <div class="windows-dialog" id="windows-waitlist-dialog" role="dialog" aria-modal="true" aria-labelledby="windows-dialog-title">
        <div class="windows-dialog-backdrop" onclick="document.getElementById('windows-waitlist-dialog').classList.remove('open')"></div>
        <div class="windows-dialog-box">
            <button class="windows-dialog-close" onclick="document.getElementById('windows-waitlist-dialog').classList.remove('open')" aria-label="Close">&times;</button>
            <div class="windows-dialog-header">
                <svg class="windows-dialog-icon" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="4" y="4" width="38" height="38" rx="4" fill="#F25022"/>
                    <rect x="46" y="4" width="38" height="38" rx="4" fill="#7FBA00"/>
                    <rect x="4" y="46" width="38" height="38" rx="4" fill="#00A4EF"/>
                    <rect x="46" y="46" width="38" height="38" rx="4" fill="#FFB900"/>
                </svg>
                <h3 id="windows-dialog-title">VoicePrompter for Windows</h3>
            </div>
            <p>We're working on it! Join the waitlist and get an exclusive <strong style="color:var(--pop)">50% early adopter discount</strong> when it launches.</p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeJ1tA_UMXZIDzTBs9j5uatMiEf97UkcBDHc2PSnAsTVtExNA/viewform?usp=dialog" target="_blank" rel="noopener" class="btn-primary" data-umami-event="windows-waitlist-open" onclick="document.getElementById('windows-waitlist-dialog').classList.remove('open')">
                Join the Waitlist
            </a>
            <p class="windows-dialog-note">No spam. One email when it's ready.</p>
        </div>
    </div>

    <script>
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') document.getElementById('windows-waitlist-dialog').classList.remove('open');
        });
    </script>`;
    html = html.replace(/\{\{WINDOWS_CTA_BLOCK\}\}/g, windowsCtaHtml);

    // Replace active integration logo classes
    const platforms = ['google-meet', 'zoom', 'microsoft-teams', 'loom', 'riverside'];
    platforms.forEach((p) => {
        const placeholder = `{{ACTIVE_${p.toUpperCase().replace(/-/g, '_')}}}`;
        const isActive = (useCase.slug === p) ? 'active' : '';
        html = html.replace(new RegExp(placeholder, 'g'), isActive);
    });

    // 2.5 Dynamic App Store campaign tracking codes based on page slug
    if (useCase.isRootMac) {
        html = html
            .replace(/ct=mac-landing-hero/g, 'ct=mac-landing-hero')
            .replace(/ct=mac-landing-footer/g, 'ct=mac-landing-footer')
            .replace(/ct=mac-landing\b/g, 'ct=mac-landing');
    } else {
        html = html
            .replace(/ct=mac-landing-hero/g, `ct=mac-${useCase.slug}-landing-hero`)
            .replace(/ct=mac-landing-footer/g, `ct=mac-${useCase.slug}-landing-footer`)
            .replace(/ct=mac-landing\b/g, `ct=mac-${useCase.slug}-landing`);
    }

    // 3. Section Toggles (hideSections)
    if (useCase.hideSections && useCase.hideSections.length > 0) {
        useCase.hideSections.forEach((section) => {
            const sectionKey = section.toUpperCase();
            const regex = new RegExp(`<!-- SECTION_${sectionKey}_START -->[\\s\\S]*?<!-- SECTION_${sectionKey}_END -->`, 'g');
            html = html.replace(regex, '');
            console.log(`   - Stripped section: ${section} from ${useCase.slug}`);
        });
    }

    // 4. FAQ Generation & Adaptation
    const faqOverrides = useCase.faqOverrides || {};
    const platformName = useCase.platformName || useCase.name;
    
    // Choose offline/privacy text based on whether it is the root macOS landing page
    const isOnlineTool = ['google-meet', 'zoom', 'microsoft-teams', 'loom', 'riverside'].includes(useCase.slug);
    let offlineOrPrivacyText = '';
    if (useCase.isRootMac) {
        offlineOrPrivacyText = 'Everything happens entirely on your device - no audio is ever sent to any server. It works offline and requires no internet connection after the initial app download.';
    } else {
        // For platform-specific pages, use the privacy-focused version with no offline mention
        offlineOrPrivacyText = 'Everything happens entirely on your device - no audio is ever sent to any server, ensuring 100% privacy and security.';
    }

    // Setup array for JSON-LD FAQ structured entities
    const schemaFaqs = [];

    const processedFaqsHtml = defaultFaqs.map((defaultFaq) => {
        // Retrieve override if exists
        const faq = faqOverrides[defaultFaq.id] ? { ...defaultFaq, ...faqOverrides[defaultFaq.id] } : defaultFaq;
        
        let question = faq.q.replace(/\{\{PLATFORM_NAME\}\}/g, platformName);
        let answer = faq.a
            .replace(/\{\{PLATFORM_NAME\}\}/g, platformName)
            .replace(/\{\{FAQ_OFFLINE_OR_PRIVACY\}\}/g, offlineOrPrivacyText);
        
        // Push structured question & clean text answer to schema list
        schemaFaqs.push({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": answer.replace(/<[^>]*>/g, '') // Strip HTML tags
            }
        });
        
        return `            <details class="faq-item">
                <summary>${question}</summary>
                <div class="faq-content">
                    ${answer}
                </div>
            </details>`;
    }).join('\n');

    // Append extra use-case specific FAQs if present
    let extraFaqsHtml = '';
    if (useCase.extraFaqs && useCase.extraFaqs.length > 0) {
        extraFaqsHtml = useCase.extraFaqs.map((extraFaq) => {
            let question = extraFaq.q.replace(/\{\{PLATFORM_NAME\}\}/g, platformName);
            let answer = extraFaq.a
                .replace(/\{\{PLATFORM_NAME\}\}/g, platformName)
                .replace(/\{\{FAQ_OFFLINE_OR_PRIVACY\}\}/g, offlineOrPrivacyText);
            
            // Push to schema list
            schemaFaqs.push({
                "@type": "Question",
                "name": question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": answer.replace(/<[^>]*>/g, '')
                }
            });
            
            return `            <details class="faq-item">
                <summary>${question}</summary>
                <div class="faq-content">
                    ${answer}
                </div>
            </details>`;
        }).join('\n');
    }

    const finalFaqsHtml = [processedFaqsHtml, extraFaqsHtml].filter(Boolean).join('\n');

    // Replace default faq items inside the container
    html = html.replace(/<!-- DEFAULT_FAQ_START -->[\s\S]*?<!-- DEFAULT_FAQ_END -->/, `<!-- DEFAULT_FAQ_START -->\n${finalFaqsHtml}\n            <!-- DEFAULT_FAQ_END -->`);

    // 5. JSON-LD Structured Schema Generation
    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": useCase.isRootMac ? "VoicePrompter" : `VoicePrompter for ${useCase.name}`,
        "operatingSystem": "macOS",
        "applicationCategory": "MultimediaApplication",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": useCase.metaDescription
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": schemaFaqs
    };

    const schemaBlock = `<script type="application/ld+json">\n${JSON.stringify([softwareSchema, faqSchema], null, 2)}\n</script>`;
    html = html.replace(/\{\{JSON_LD_SCHEMA\}\}/g, schemaBlock);

    // 6. Output file generation
    let outputDir;
    let outputPath;

    if (useCase.isRootMac) {
        outputDir = path.join(ROOT_DIR, 'mac');
        outputPath = path.join(outputDir, 'index.html');
    } else {
        outputDir = path.join(ROOT_DIR, 'mac', useCase.slug);
        outputPath = path.join(outputDir, 'index.html');
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`✓ Generated: ${path.relative(ROOT_DIR, outputPath)}`);
    generatedPaths.push(useCase.canonicalUrl);
});

// 7. Update sitemap.xml dynamically
if (fs.existsSync(SITEMAP_PATH)) {
    let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const today = new Date().toISOString().split('T')[0];

    // Filter out entries that are already in the sitemap to avoid duplicates
    const newEntries = useCases
        .filter(uc => !uc.isRootMac) // mac is already in default sitemap
        .filter(uc => !sitemap.includes(uc.canonicalUrl))
        .map(uc => `  <url>
    <loc>${uc.canonicalUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);

    if (newEntries.length > 0) {
        const entriesStr = newEntries.join('\n');
        // Inject before the closing </urlset> tag
        sitemap = sitemap.replace('</urlset>', `${entriesStr}\n</urlset>`);
        fs.writeFileSync(SITEMAP_PATH, sitemap);
        console.log(`✓ Appended ${newEntries.length} use-case paths to sitemap.xml`);
    }
} else {
    console.warn(`⚠️ Sitemap not found at ${SITEMAP_PATH}. It will be created during the next npm run build.`);
}

console.log('🎉 Use-case pages build complete.');
