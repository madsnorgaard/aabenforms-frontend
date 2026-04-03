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
          v-for="(cap, i) in capabilities"
          :key="cap.label"
          class="bg-white p-6 lg:p-8 group hover:bg-primary-50/50 transition-colors duration-300"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-5"
               :class="cap.iconBg">
            {{ cap.icon }}
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
    icon: '⚡',
    iconBg: 'bg-warning-50 text-warning-600',
    label: 'ECA Workflows',
    desc: t('features.workflows.description'),
  },
  {
    icon: '🔐',
    iconBg: 'bg-primary-50 text-primary-600',
    label: 'MitID + CPR/CVR',
    desc: t('features.danish.description'),
  },
  {
    icon: '🏢',
    iconBg: 'bg-success-50 text-success-600',
    label: t('features.multiTenant.title'),
    desc: t('features.multiTenant.description'),
  },
  {
    icon: '🛡',
    iconBg: 'bg-secondary-50 text-secondary-600',
    label: t('features.security.title'),
    desc: t('features.security.description'),
  },
])
</script>
