<template>
  <div
    role="note"
    class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 items-start"
  >
    <svg
      class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.515 2.625H3.72c-1.345 0-2.188-1.458-1.515-2.625l6.28-10.875zM10 6a1 1 0 011 1v3a1 1 0 11-2 0V7a1 1 0 011-1zm0 8a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
        clip-rule="evenodd"
      />
    </svg>
    <div class="text-sm leading-relaxed">
      <p class="font-semibold text-amber-900">{{ $t('demo.byggetilladelse.mockBanner.title') }}</p>
      <p class="text-amber-800 mt-0.5">{{ $t('demo.byggetilladelse.mockBanner.body') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
useI18n()
</script>
