import dkfdsRemRebase from './postcss/dkfds-rem-rebase.mjs'

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

  // DKFDS (borger.dk theme) is the design system. @nuxtjs/tailwindcss injects
  // its own stylesheet first, so DKFDS loads after the Tailwind utilities and
  // wins on any shared class name. See docs/DKFDS_REFERENCE.md.
  css: ['~/assets/css/dkfds.scss'],

  hooks: {
    // Rescales DKFDS rem values from its 10px root to our 16px root. Pushed
    // onto the resolved PostCSS chain here because `postcss.plugins` entries
    // are resolved by name through jiti, which silently drops local files.
    'vite:extendConfig'(config) {
      config.css ??= {}
      if (!config.css.postcss || typeof config.css.postcss === 'string') {
        config.css.postcss = { plugins: [] }
      }
      ;(config.css.postcss.plugins ??= []).push(dkfdsRemRebase())
    },
  },

  features: {
    // Emit the (Tailwind + DKFDS, ~250 KB) global CSS as cacheable files
    // instead of inlining it into every SSR response.
    inlineStyles: false,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'da' },
      title: 'AabenForms',
      titleTemplate: (title?: string) =>
        title && title !== 'AabenForms' ? `${title} · AabenForms` : 'AabenForms',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Åben kildekode til digital selvbetjening i danske kommuner. Borgeren logger ind med MitID, og det, kommunen allerede ved, bliver hentet i stedet for at blive spurgt om igen.',
        },
        { name: 'theme-color', content: '#0059B3' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'AabenForms' },
        { property: 'og:title', content: 'AabenForms' },
        {
          property: 'og:description',
          content: 'Åben kildekode til digital selvbetjening i danske kommuner. Borgeren logger ind med MitID, og det, kommunen allerede ved, bliver hentet i stedet for at blive spurgt om igen.',
        },
        { property: 'og:url', content: 'https://aabenforms.dk' },
        { property: 'og:image', content: 'https://aabenforms.dk/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'AabenForms' },
        {
          name: 'twitter:description',
          content: 'Åben kildekode til digital selvbetjening i danske kommuner. Borgeren logger ind med MitID, og det, kommunen allerede ved, bliver hentet i stedet for at blive spurgt om igen.',
        },
        { name: 'twitter:image', content: 'https://aabenforms.dk/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },

  runtimeConfig: {
    // Server-only: Adressevælger access token, injected by the proxy route so it
    // never reaches the browser. Defaults to our own unique token (never the shared
    // demo token), swappable for a registered token when KDS Brugerstyring launches.
    adressevaelgerToken: process.env.NUXT_ADRESSEVAELGER_TOKEN || 'aabenforms-adr-2026',
    adressevaelgerApiUrl: process.env.NUXT_ADRESSEVAELGER_API_URL || 'https://adressevaelger.dk',
    // Server-only: where the session routes reach Drupal without the public
    // proxy, so Drupal sees the citizen's IP in X-Forwarded-For (production:
    // http://aabenforms_drupal on the shared docker network). Empty = apiBase.
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || '',
    public: {
      apiBase: process.env.API_BASE_URL || 'https://aabenforms.ddev.site',
      mitidEnabled: process.env.NUXT_PUBLIC_MITID_ENABLED !== 'false',
      demoByggetilladelseEnabled: process.env.NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED === 'true',
      // URL of a statistics script. Empty (default) = none. When set it is
      // injected by plugins/consent.client.ts only after cookie acceptance.
      analyticsScript: process.env.NUXT_PUBLIC_ANALYTICS_SCRIPT || ''
    }
  },

  i18n: {
    locales: [
      { code: 'da', language: 'da-DK', name: 'Dansk', file: 'da.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'da',
    strategy: 'prefix_except_default',
    // Absolute URLs for hreflang alternates and og:url (useLocaleHead in app.vue).
    baseUrl: 'https://aabenforms.dk',
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
  // Note: do NOT transpile 'vue' here - it drags the CJS compiler through
  // interop and breaks the server build ("entities/decode" default export).
  build: {
    transpile: ['pinia'],
  },

  // Nitro configuration for production
  // NUXT_SKIP_PRERENDER=1 builds without prerendering, for environments where
  // the backend is not reachable at build time (e.g. local demo builds).
  nitro: {
    compressPublicAssets: true,
    prerender: process.env.NUXT_SKIP_PRERENDER
      ? { crawlLinks: false, routes: [] }
      : {
          crawlLinks: true,
          routes: ['/'],
        },
  },

  // Route rules for caching and optimization
  routeRules: {
    // Static pages - cache for 1 hour
    '/': { prerender: !process.env.NUXT_SKIP_PRERENDER },

    // The MitID callback depends on ?session=...; a prerendered copy hydrates with a
    // query-less page route and stalls the login flow.
    '/auth/callback': { prerender: false },
    '/en/auth/callback': { prerender: false },

    // Server API routes - no caching. The session routes hold the MitID
    // session cookie: never cached, and no CORS headers at all.
    '/api/adressevaelger/**': { cors: true, headers: { 'cache-control': 'no-cache' } },
    '/api/session/**': { headers: { 'cache-control': 'no-store, private' } },

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
      include: ['vue', '@vueuse/core', 'ofetch', 'dkfds'],
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
