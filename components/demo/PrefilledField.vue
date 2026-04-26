<template>
  <div class="space-y-1.5">
    <div class="flex items-baseline justify-between gap-3">
      <label class="text-xs font-semibold text-neutral-700 tracking-wide uppercase">
        {{ label }}
      </label>
      <span
        v-if="prefilled"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100"
      >
        <svg class="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm2.6 4.4L5.2 7.8 3.4 6a.6.6 0 10-.85.85L4.78 9.07a.6.6 0 00.85 0l3.82-3.82a.6.6 0 10-.85-.85z"/>
        </svg>
        {{ $t('demo.byggetilladelse.form.prefilledPill') }}
      </span>
      <span
        v-else-if="manual"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200"
      >
        {{ $t('demo.byggetilladelse.form.manualPill') }}
      </span>
    </div>

    <div
      v-if="readOnly"
      class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-neutral-50/60"
    >
      <span class="text-sm font-medium text-neutral-900 truncate">
        {{ value || '-' }}
      </span>
      <button
        v-if="editable"
        type="button"
        @click="$emit('edit')"
        class="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
      >
        {{ $t('demo.byggetilladelse.form.editLink') }}
      </button>
    </div>

    <div v-else class="space-y-1.5">
      <input
        :value="value"
        @input="$emit('update:value', ($event.target as HTMLInputElement).value)"
        :placeholder="placeholder"
        :type="inputType"
        class="w-full px-4 py-3 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
      />
      <button
        v-if="editable"
        type="button"
        @click="$emit('lock')"
        class="text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {{ $t('demo.byggetilladelse.form.lockLink') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  label: string
  value: string
  placeholder?: string
  prefilled?: boolean
  manual?: boolean
  readOnly?: boolean
  editable?: boolean
  inputType?: 'text' | 'email' | 'tel'
}>()

defineEmits<{
  (e: 'update:value', v: string): void
  (e: 'edit'): void
  (e: 'lock'): void
}>()

useI18n()
</script>
