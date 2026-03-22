import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
                blog_article1: 'blog/best-free-tools-2025.html',
                blog_article2: 'blog/best-teleprompter-app-for-mac.html',
                blog_article3: 'blog/free-voice-activated-teleprompter.html',
                blog_article4: 'blog/how-to-look-confident-on-camera.html',
                blog_article5: 'blog/how-to-read-naturally.html',
                blog_article6: 'blog/how-to-read-script-without-looking-like-reading.html',
                blog_article7: 'blog/how-to-record-product-demo-video.html',
                blog_article8: 'blog/how-to-record-webinars-and-podcasts.html',
                blog_article9: 'blog/how-to-use-teleprompter-naturally.html',
                blog_article10: 'blog/multilingual-teleprompter-60-languages.html',
                blog_article11: 'blog/record-tutorial-videos-faster.html',
                blog_article12: 'blog/stop-memorizing-your-script.html',
                blog_article13: 'blog/teleprompter-for-zoom-invisible.html',
                blog_article14: 'blog/video-interview-preparation-tips.html',
                blog_article15: 'blog/voice-scrolling-solo-creators.html',
                blog_article16: 'blog/voiceprompter-complete-guide-2025.html',
                blog_article17: 'blog/why-all-teleprompter-apps-suck.html',
                blog_article18: 'blog/zoom-presentation-tips-sales-calls.html',
                mac: 'mac/index.html',
                web: 'web/index.html'
            }
        }
    }
})
