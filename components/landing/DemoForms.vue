<template>
  <section id="demo" class="py-20 lg:py-28 bg-white border-t border-neutral-100">
    <div class="max-w-6xl mx-auto px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
        <!-- Copy column -->
        <div>
          <p class="text-xs font-semibold tracking-widest uppercase text-secondary-600 mb-4">
            {{ $t('landingCta.eyebrow') }}
          </p>
          <h2 class="text-3xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-5 leading-[1.05]">
            {{ $t('landingCta.heading') }}
          </h2>
          <p class="text-lg text-neutral-500 leading-relaxed mb-8 max-w-prose">
            {{ $t('landingCta.lead') }}
          </p>

          <ul class="space-y-3 mb-8">
            <li v-for="key in ['bullet1', 'bullet2', 'bullet3']" :key="key" class="flex items-start gap-3">
              <span class="mt-1 inline-flex w-5 h-5 rounded-full bg-success-50 border border-success-200 items-center justify-center flex-shrink-0">
                <svg class="w-2.5 h-2.5 text-success-600" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M2 6.5l2.5 2.5L10 3" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="text-sm text-neutral-700 leading-relaxed">{{ $t(`landingCta.${key}`) }}</span>
            </li>
          </ul>

          <a href="https://github.com/madsnorgaard/aabenforms" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900">
            {{ $t('landingCta.altCta') }} →
          </a>
        </div>

        <!-- Visual column: the whole preview panel is the click target so we
             don't repeat the hero CTA button. When the live demo flag is
             off (production today) we route to /kontakt instead so visitors
             don't dead-end on the disabled-state page. -->
        <NuxtLink :to="demoEnabled ? '/demo/byggetilladelse' : '/kontakt'" class="relative block group" :aria-label="$t('landingCta.cta')">
          <div class="absolute -inset-6 bg-gradient-to-br from-secondary-100/50 to-primary-100/40 rounded-[28px] blur-2xl opacity-60 group-hover:opacity-90 transition-opacity" aria-hidden="true" />
          <div class="relative rounded-2xl border border-neutral-200 bg-neutral-900 text-neutral-100 overflow-hidden shadow-2xl shadow-neutral-900/15 group-hover:shadow-neutral-900/25 group-hover:-translate-y-0.5 transition-all">
            <div class="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-error-400"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-warning-400"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-success-400"></span>
              <span class="ml-3 text-[11px] text-neutral-400 font-mono">/demo/byggetilladelse</span>
            </div>

            <div class="p-6 space-y-5">
              <div class="grid grid-cols-4 gap-1.5">
                <div class="h-1 rounded-full bg-success-500" />
                <div class="h-1 rounded-full bg-success-500" />
                <div class="h-1 rounded-full bg-secondary-500" />
                <div class="h-1 rounded-full bg-white/10" />
              </div>

              <div class="rounded-lg bg-white/5 border border-white/10 p-3.5">
                <p class="text-[10px] uppercase tracking-widest font-semibold text-secondary-300 mb-2">Trin 3 · Workflow kører</p>
                <ol class="space-y-2.5">
                  <li class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
                      <svg class="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <path d="M2 6l3 3 5-5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                    <span class="text-xs text-neutral-200">CPR registry lookup (SF1520)</span>
                  </li>
                  <li class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
                      <svg class="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <path d="M2 6l3 3 5-5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                    <span class="text-xs text-neutral-200">building_permit_submitted audit log</span>
                  </li>
                  <li class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full bg-secondary-500 flex items-center justify-center">
                      <svg class="w-3 h-3 text-white animate-spin" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.4"/>
                        <path d="M10 6a4 4 0 00-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </span>
                    <span class="text-xs text-neutral-200">Send confirmation via Digital Post (SF1601)</span>
                  </li>
                </ol>
              </div>

              <div class="rounded-lg bg-white/5 border border-white/10 p-3.5">
                <div class="flex items-center gap-2 mb-1.5">
                  <svg class="w-4 h-4 text-neutral-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                    <path d="M2.5 5.5h15v9a1 1 0 01-1 1h-13a1 1 0 01-1-1v-9z"/>
                    <path d="M2.8 5.6L10 11l7.2-5.4"/>
                  </svg>
                  <p class="text-[10px] uppercase tracking-widest font-semibold text-neutral-400">Digital Post · Indbakke</p>
                </div>
                <p class="text-xs text-neutral-200 font-semibold">Modtaget: ansøgning om byggetilladelse</p>
                <p class="text-[10px] text-neutral-500 mt-0.5">Test Kommune · transaktion 8a3f12c…</p>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
useI18n()
const config = useRuntimeConfig()
const demoEnabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))
</script>
