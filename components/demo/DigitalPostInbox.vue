<template>
  <div class="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
    <header class="px-5 py-4 border-b border-neutral-100 bg-gradient-to-br from-neutral-50 to-white flex items-start justify-between gap-3">
      <div class="flex gap-3 items-start">
        <div class="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-primary-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M2.5 5.5h15v9a1 1 0 01-1 1h-13a1 1 0 01-1-1v-9z" />
            <path d="M2.8 5.6L10 11l7.2-5.4" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-bold text-neutral-900">Digital Post</h3>
          <p class="text-xs text-neutral-500">{{ $t('demo.byggetilladelse.inbox.from') }}: Test Kommune (CVR 12345678)</p>
        </div>
      </div>
      <button
        type="button"
        @click="$emit('refresh')"
        :disabled="loading"
        class="text-xs font-semibold text-neutral-500 hover:text-neutral-800 disabled:opacity-50 inline-flex items-center gap-1.5"
      >
        <svg
          class="w-3.5 h-3.5"
          :class="{ 'animate-spin': loading }"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path d="M2 8a6 6 0 0110.5-3.95L14 3" stroke-linecap="round" />
          <path d="M14 3v3h-3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ loading ? $t('demo.byggetilladelse.inbox.refreshing') : $t('demo.byggetilladelse.inbox.refresh') }}
      </button>
    </header>

    <ul v-if="letters.length > 0" class="divide-y divide-neutral-100">
      <li
        v-for="letter in letters"
        :key="letter.transaction_id"
        class="px-5 py-4 hover:bg-neutral-50/60 transition-colors"
      >
        <button
          type="button"
          @click="toggle(letter.transaction_id)"
          class="w-full text-left flex items-start gap-4"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-neutral-900 truncate">{{ letter.subject }}</p>
            <p class="text-xs text-neutral-500 mt-0.5">
              {{ $t('demo.byggetilladelse.inbox.received') }}
              {{ formatDateTime(letter.created_iso) }}
              · {{ $t('demo.byggetilladelse.inbox.transactionId') }} {{ letter.transaction_id.slice(0, 8) }}
            </p>
          </div>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            :class="statusClass(letter.status)"
          >
            {{ letter.status }}
          </span>
          <svg
            class="w-4 h-4 text-neutral-400 transition-transform"
            :class="{ 'rotate-180': expanded === letter.transaction_id }"
            viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <Transition name="letter-body">
          <div
            v-if="expanded === letter.transaction_id"
            class="mt-4 ml-1 pl-5 border-l-2 border-primary-100"
          >
            <article
              class="prose prose-sm max-w-none text-neutral-700"
              v-html="letter.body_html || '<p>(Tomt brevindhold)</p>'"
            />
          </div>
        </Transition>
      </li>
    </ul>

    <div v-else class="px-5 py-10 text-center">
      <div class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-neutral-100 mb-3">
        <svg class="w-6 h-6 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-5 9 5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="text-sm text-neutral-500">{{ $t('demo.byggetilladelse.inbox.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DigitalPostLetter } from '~/composables/useByggetilladelseDemo'

defineProps<{
  letters: DigitalPostLetter[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()

useI18n()

const expanded = ref<string | null>(null)

function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}

function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function statusClass(status: string): string {
  if (status === 'success') return 'bg-success-50 text-success-700 border border-success-100'
  if (status === 'failure') return 'bg-error-50 text-error-700 border border-error-100'
  return 'bg-neutral-100 text-neutral-700 border border-neutral-200'
}
</script>

<style scoped>
.letter-body-enter-active { transition: all 220ms cubic-bezier(0.16, 1, 0.3, 1); }
.letter-body-leave-active { transition: all 160ms ease; }
.letter-body-enter-from, .letter-body-leave-to { opacity: 0; max-height: 0; transform: translateY(-4px); }
.letter-body-enter-to, .letter-body-leave-from { opacity: 1; max-height: 600px; }
</style>
