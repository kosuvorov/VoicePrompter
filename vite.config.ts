import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    // base: '/Teleprompter/', // Removed for custom domain
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
            manifest: {
                name: 'VoicePrompter',
                short_name: 'VoicePrompter',
                description: 'A voice-activated teleprompter app',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
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
                main: 'index.html',
                about: 'about.html',
                blog: 'blog/index.html',
                blog_article1: 'blog/best-free-tools-2025.html',
                blog_article2: 'blog/how-to-read-naturally.html',
                blog_article3: 'blog/voice-scrolling-solo-creators.html'
            }
        }
    }
})
