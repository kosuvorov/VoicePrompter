import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Dynamically gather all generated blog HTML files
const blogDir = path.resolve(__dirname, 'blog');
const blogInputs: Record<string, string> = {};
if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');
    blogFiles.forEach((file, index) => {
        blogInputs[`blog_article${index + 1}`] = `blog/${file}`;
    });
}

export default defineConfig({
    appType: 'mpa',
    // base: '/Teleprompter/', // Removed for custom domain
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                navigateFallbackDenylist: [/^\/mac/, /^\/web/, /^\/about/, /^\/blog/]
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
            manifest: {
                name: 'VoicePrompter',
                short_name: 'VoicePrompter',
                description: 'A voice-activated teleprompter app',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                start_url: '/app/',
                scope: '/app/',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    build: {
        rollupOptions: {
            input: {
                hub: 'index.html',
                app: 'app/index.html',
                about: 'about.html',
                blog: 'blog/index.html',
                mac: 'mac/index.html',
                web: 'web/index.html',
                ...blogInputs
            }
        }
    }
})
