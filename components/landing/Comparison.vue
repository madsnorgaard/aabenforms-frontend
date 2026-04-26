<template>
  <section class="py-20 lg:py-24 bg-neutral-50 border-t border-neutral-100">
    <div class="max-w-5xl mx-auto px-6 lg:px-8">
      <div class="max-w-2xl mb-10">
        <p class="text-xs font-semibold tracking-widest uppercase text-secondary-600 mb-3">
          {{ $t('comparison.eyebrow') }}
        </p>
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
          {{ $t('comparison.heading') }}
        </h2>
        <p class="text-lg text-neutral-500 leading-relaxed">
          {{ $t('comparison.lead') }}
        </p>
      </div>

      <div class="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div class="grid grid-cols-[1fr_minmax(0,1.2fr)_minmax(0,1.2fr)] text-sm">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-neutral-200 bg-neutral-50/60 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            &nbsp;
          </div>
          <div class="px-5 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary-400"></span>
              <span class="text-xs font-bold uppercase tracking-widest">ÅbenForms</span>
            </div>
          </div>
          <div class="px-5 py-4 border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {{ $t('comparison.themLabel') }}
          </div>

          <!-- Rows -->
          <template v-for="row in rows" :key="row.key">
            <div class="px-5 py-4 border-b border-neutral-100 bg-neutral-50/60 font-semibold text-neutral-900">
              {{ row.title }}
            </div>
            <div class="px-5 py-4 border-b border-neutral-100 bg-white">
              <div class="flex items-start gap-2">
                <span class="mt-0.5 inline-flex w-4 h-4 rounded-full bg-success-50 border border-success-200 items-center justify-center flex-shrink-0">
                  <svg class="w-2 h-2 text-success-600" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M2 6.5l2.5 2.5L10 3" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="text-neutral-800">{{ row.us }}</span>
              </div>
            </div>
            <div class="px-5 py-4 border-b border-neutral-100 bg-neutral-50/40 text-neutral-500">
              {{ row.them }}
            </div>
          </template>
        </div>
      </div>

      <p class="mt-6 text-sm text-neutral-500 italic max-w-prose">
        {{ $t('comparison.footnote') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rows = computed(() => [
  { key: 'r1', title: t('comparison.row1.title'), us: t('comparison.row1.us'), them: t('comparison.row1.them') },
  { key: 'r2', title: t('comparison.row2.title'), us: t('comparison.row2.us'), them: t('comparison.row2.them') },
  { key: 'r3', title: t('comparison.row3.title'), us: t('comparison.row3.us'), them: t('comparison.row3.them') },
  { key: 'r4', title: t('comparison.row4.title'), us: t('comparison.row4.us'), them: t('comparison.row4.them') },
  { key: 'r5', title: t('comparison.row5.title'), us: t('comparison.row5.us'), them: t('comparison.row5.them') },
])
</script>
