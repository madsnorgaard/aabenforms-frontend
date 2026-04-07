<template>
  <section class="py-20 lg:py-28 bg-white border-t border-neutral-100">
    <div class="max-w-6xl mx-auto px-6 lg:px-8">
      <div class="max-w-2xl mb-14">
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          {{ $t('features.title') }}
        </h2>
        <p class="text-lg text-neutral-500">
          {{ $t('workflowDemo.eca.description') }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-xl overflow-hidden border border-neutral-200">
        <div
          v-for="cap in capabilities"
          :key="cap.label"
          class="bg-white p-6 lg:p-8 group hover:bg-primary-50/50 transition-colors duration-300"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
               :class="cap.iconBg">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" v-html="cap.iconPath" />
          </div>

          <h3 class="text-base font-bold text-neutral-900 mb-2">
            {{ cap.label }}
          </h3>
          <p class="text-sm text-neutral-500 leading-relaxed">
            {{ cap.desc }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const capabilities = computed(() => [
  {
    iconPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />',
    iconBg: 'bg-warning-50 text-warning-600',
    label: 'ECA Workflows',
    desc: t('features.workflows.description'),
  },
  {
    iconPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />',
    iconBg: 'bg-primary-50 text-primary-600',
    label: 'MitID + CPR/CVR',
    desc: t('features.danish.description'),
  },
  {
    iconPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />',
    iconBg: 'bg-success-50 text-success-600',
    label: t('features.multiTenant.title'),
    desc: t('features.multiTenant.description'),
  },
  {
    iconPath: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />',
    iconBg: 'bg-secondary-50 text-secondary-600',
    label: t('features.security.title'),
    desc: t('features.security.description'),
  },
])
</script>
