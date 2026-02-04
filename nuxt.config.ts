// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'https://aabenforms.ddev.site'
    }
  },

  i18n: {
    locales: [
      { code: 'da', iso: 'da-DK', name: 'Dansk', file: 'da.json' },
      { code: 'en', iso: 'en-GB', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'da',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  },

  typescript: {
    strict: true,
    typeCheck: false // Disable for now to avoid vite-plugin-checker issues
  },

  // Enable SSR for better initial load performance
  ssr: true,

  // Production build optimizations
  build: {
    transpile: ['vue', 'pinia'],
  },

  // Nitro configuration for production
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },

  // Route rules for caching and optimization
  routeRules: {
    // Static pages - cache for 1 hour
    '/': { prerender: true },

    // API routes - no caching
    '/api/**': { cors: true, headers: { 'cache-control': 'no-cache' } },

    // Form pages - SSR with short cache
    '/forms/**': { swr: 3600 },

    // Workflow pages - SSR, no cache (user-specific data)
    '/workflows/**': { ssr: true },
  },

  // Vite configuration
  vite: {
    build: {
      // Chunk size warning limit (in KB)
      chunkSizeWarningLimit: 1000,

      // Manual chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vendor-vue': ['vue', '@vueuse/core', '@vueuse/nuxt'],
            'vendor-i18n': ['@nuxtjs/i18n'],

            // UI components
            'ui-components': [
              './components/ui/Button.vue',
              './components/ui/Input.vue',
              './components/ui/Select.vue',
              './components/ui/Modal.vue',
              './components/ui/Alert.vue',
              './components/ui/Skeleton.vue',
              './components/ui/Spinner.vue',
              './components/ui/Textarea.vue',
              './components/ui/Tooltip.vue',
            ],
          },
        },
      },
    },

    // CSS code splitting
    css: {
      devSourcemap: true,
    },

    server: {
      host: true, // Listen on all addresses
      strictPort: false,
      hmr: {
        protocol: 'wss',
        clientPort: 3001
      },
      watch: {
        usePolling: true // Needed for DDEV file watching
      }
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', '@vueuse/core', 'ofetch'],
    },
  },

  // Experimental features for better performance
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    typedPages: true,
  },

  // Disable host check in development
  devServer: {
    host: '0.0.0.0'
  }
})
