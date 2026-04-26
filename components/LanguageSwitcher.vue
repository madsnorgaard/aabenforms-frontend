<template>
  <div class="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-white/70 border border-neutral-200 backdrop-blur text-xs font-semibold">
    <NuxtLink
      v-for="loc in locales"
      :key="loc.code"
      :to="switchLocalePath(loc.code)"
      class="px-3 py-1.5 rounded-md transition-colors"
      :class="locale === loc.code
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'"
    >{{ loc.label }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const locales = [
  { code: 'da', label: 'DA' },
  { code: 'en', label: 'EN' },
] as const
</script>
