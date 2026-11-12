<template>
  <div class="webform-summary">
    <p v-if="!rows.length" class="webform-summary__empty">{{ $t('form.summaryEmpty') }}</p>
    <dl v-else class="webform-summary__list">
      <div
        v-for="row in rows"
        :key="row.key"
        class="webform-summary__row"
        :class="`summary-key-${webformCssSafe(row.key)}`"
      >
        <dt class="webform-summary__label">{{ row.label }}</dt>
        <dd class="webform-summary__value">
          <span :class="{ 'webform-summary__value--empty': row.empty }">{{ row.value }}</span>
        </dd>
        <dd v-if="editable" class="webform-summary__action">
          <a
            class="function-link webform-summary__edit"
            :href="`#${webformFieldId(row.key)}`"
            @click.prevent="$emit('edit', { page: row.page, key: row.key })"
          >
            {{ $t('form.edit') }}<span class="sr-only"> {{ row.label }}</span>
          </a>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
// Opsummering: the visible answers as a definition list, one row per element.
// With `editable` every row has a "Redigér" link that sends the citizen back
// to the page the field lives on (the renderer focuses the field).
import { webformCssSafe, webformFieldId } from '~/composables/useWebformStates'

export interface WebformSummaryRow {
  key: string
  label: string
  value: string
  /** Index of the wizard step that holds the element. */
  page: number
  /** True when the citizen left the field blank (rendered as "Ikke udfyldt"). */
  empty?: boolean
}

withDefaults(defineProps<{
  rows: WebformSummaryRow[]
  editable?: boolean
}>(), {
  editable: true,
})

defineEmits<{
  edit: [target: { page: number; key: string }]
}>()
</script>

<style scoped>
.webform-summary__list {
  margin: 0;
  border-top: 1px solid #bfbfbf;
}

.webform-summary__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: 0.5rem 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #bfbfbf;
}

.webform-summary__label {
  font-weight: 600;
}

.webform-summary__value,
.webform-summary__action {
  margin: 0;
  word-break: break-word;
}

.webform-summary__value--empty {
  color: #454545;
  font-style: italic;
}

@media (max-width: 767px) {
  .webform-summary__row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .webform-summary__value {
    grid-column: 1 / -1;
  }
}

@media print {
  .webform-summary__action {
    display: none;
  }
}
</style>
