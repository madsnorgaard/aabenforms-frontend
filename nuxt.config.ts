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
      apiBase: process.env.API_BASE_URL || 'https://aabenforms.ddev.site',
      mitidEnabled: process.env.NUXT_PUBLIC_MITID_ENABLED !== 'false'
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

      // Let Nuxt handle chunk splitting automatically
    },

    // CSS code splitting
    css: {
      devSourcemap: true,
    },

    server: {
      host: true,
      strictPort: false,
      allowedHosts: ['aabenforms-frontend.ddev.site', 'localhost', '127.0.0.1'],
      hmr: {
        protocol: 'wss',
        clientPort: 3001
      },
      watch: {
        usePolling: true
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
