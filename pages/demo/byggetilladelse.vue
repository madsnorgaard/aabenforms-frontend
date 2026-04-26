<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
    <header class="border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2.5 text-sm font-bold text-neutral-900 hover:opacity-80 transition-opacity" :aria-label="$t('demo.byggetilladelse.complete.gotoLanding')">
          <img src="/favicon.svg" alt="" class="w-8 h-8 flex-shrink-0" />
          <span>ÅbenForms</span>
          <span class="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest text-secondary-700 bg-secondary-50 border border-secondary-100">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />
            Live demo
          </span>
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M13 8H3m4-4l-4 4 4 4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ $t('demo.byggetilladelse.complete.gotoLanding') }}
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <template v-if="enabled">
        <div class="mb-10 max-w-2xl">
          <p class="text-xs font-semibold tracking-widest uppercase text-secondary-600 mb-3">
            {{ $t('demo.byggetilladelse.kickoff.eyebrow') }}
          </p>
          <h1 class="text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 mb-4">
            {{ $t('demo.byggetilladelse.kickoff.heading') }}
          </h1>
          <p class="text-lg text-neutral-500 leading-relaxed">
            {{ $t('demo.byggetilladelse.kickoff.lead') }}
          </p>
        </div>

        <DemoByggetilladelseFlow />
      </template>

      <template v-else>
        <div class="max-w-2xl mx-auto py-12 lg:py-16">
          <p class="text-xs font-semibold tracking-widest uppercase text-secondary-600 mb-3">
            {{ $t('demo.byggetilladelse.disabled.eyebrow') }}
          </p>
          <h1 class="text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 mb-5 leading-tight">
            {{ $t('demo.byggetilladelse.disabled.heading') }}
          </h1>
          <p class="text-lg text-neutral-600 leading-relaxed mb-8">
            {{ $t('demo.byggetilladelse.disabled.body') }}
          </p>

          <div class="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-neutral-100 p-7 lg:p-9">
            <div class="flex flex-wrap items-center gap-4">
              <NuxtLink
                to="/kontakt"
                class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-secondary-500 text-white hover:bg-secondary-600 transition-all shadow-lg"
              >
                {{ $t('demo.byggetilladelse.disabled.primary') }}
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path d="M3 8h10m-4-4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </NuxtLink>
              <a
                :href="$t('demo.byggetilladelse.disabled.githubUrl')"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                {{ $t('demo.byggetilladelse.disabled.secondary') }} →
              </a>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({
  title: t('demo.byggetilladelse.kickoff.heading'),
})

const config = useRuntimeConfig()
const enabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))

const { restoreSession } = useAuth()

onMounted(() => {
  // Hydrate any prior MitID session from localStorage so a returning visitor
  // lands directly at the prefilled-form phase.
  restoreSession()
})
</script>
