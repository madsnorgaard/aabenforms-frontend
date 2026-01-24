// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  modules: [
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

  // Enable SSR for production, can disable for development if needed
  ssr: true,

  // Vite configuration
  vite: {
    server: {
      watch: {
        usePolling: true // Needed for DDEV file watching
      }
    }
  }
})
