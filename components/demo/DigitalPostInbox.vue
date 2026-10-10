<template>
  <section class="demo-inbox" :aria-labelledby="headingId">
    <div class="demo-inbox__header">
      <div>
        <h3 :id="headingId" class="h5 mb-0">
          <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#email" /></svg>
          Digital Post
        </h3>
        <p class="demo-inbox__from mb-0">{{ $t('demo.byggetilladelse.inbox.from') }}: Test Kommune (CVR 12345678)</p>
      </div>
      <button type="button" class="function-link" :disabled="loading || undefined" @click="$emit('refresh')">
        <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#refresh" /></svg>
        {{ loading ? $t('demo.byggetilladelse.inbox.refreshing') : $t('demo.byggetilladelse.inbox.refresh') }}
      </button>
    </div>

    <ul v-if="letters.length > 0" class="nobullet-list demo-inbox__list">
      <li v-for="letter in letters" :key="letter.transaction_id" class="demo-inbox__item">
        <details class="details">
          <summary class="details-summary">
            <span class="details-summary-text">
              <strong>{{ letter.subject }}</strong>
              <span class="demo-inbox__meta">
                {{ $t('demo.byggetilladelse.inbox.received') }}
                {{ formatDateTime(letter.created_iso) }}
                - {{ $t('demo.byggetilladelse.inbox.transactionId') }} {{ letter.transaction_id.slice(0, 8) }}
              </span>
            </span>
            <span :class="['badge', statusClass(letter.status)]">{{ statusLabel(letter.status) }}</span>
          </summary>
          <div class="details-text">
            <article class="demo-inbox__body" v-html="letter.body_html || '<p>(Tomt brevindhold)</p>'" />
          </div>
        </details>
      </li>
    </ul>

    <p v-else class="demo-inbox__empty">{{ $t('demo.byggetilladelse.inbox.empty') }}</p>
  </section>
</template>

<script setup lang="ts">
// The citizen's Digital Post inbox (demo log): DKFDS Detaljer per letter,
// status as a badge, "Opdater" as a function link.
import type { DigitalPostLetter } from '~/types/demo'

defineProps<{
  letters: DigitalPostLetter[]
  loading?: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()

const { t } = useI18n()
const headingId = `${useId()}-heading`

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
  if (status === 'success') return 'badge-success'
  if (status === 'failure') return 'badge-error'
  return ''
}

function statusLabel(status: string): string {
  if (status === 'success') return t('demo.wizard.inboxStatus.success')
  if (status === 'failure') return t('demo.wizard.inboxStatus.failure')
  return status
}
</script>

<style scoped>
.demo-inbox {
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  background: #fff;
}

.demo-inbox__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #dcdcdc;
  background: #f5f5f5;
}

.demo-inbox__header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-inbox__from,
.demo-inbox__meta,
.demo-inbox__empty {
  color: #454545;
  font-size: 0.875rem;
}

.demo-inbox__meta {
  display: block;
  font-weight: 400;
}

.demo-inbox__list {
  margin: 0;
  padding: 0 1.25rem;
}

.demo-inbox__item {
  margin-top: 0;
  border-bottom: 1px solid #dcdcdc;
}

.demo-inbox__item:last-child {
  border-bottom: 0;
}

.demo-inbox__item .details {
  margin: 0;
}

.demo-inbox__item .details-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.demo-inbox__item .details-summary .badge {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.demo-inbox__empty {
  padding: 1.5rem 1.25rem;
  margin: 0;
}

.demo-inbox__body :deep(p) {
  margin-bottom: 0.75rem;
}
</style>
