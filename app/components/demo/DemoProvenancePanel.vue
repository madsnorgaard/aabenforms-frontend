<template>
  <div class="demo-provenance">
    <h3 class="h4 mb-3">{{ $t('demo.wizard.prefill.tableHeading') }}</h3>

    <p v-if="loading" class="demo-provenance__loading" role="status">
      <span class="spinner spinner-small" aria-hidden="true" />
      {{ $t('demo.wizard.prefill.loading') }}
    </p>

    <div v-else-if="rows.length" class="table--responsive-scroll">
      <table class="table table--compact table--responsive-headers demo-provenance__table">
        <caption class="sr-only">{{ $t('demo.wizard.prefill.caption') }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ $t('demo.wizard.prefill.col.field') }}</th>
            <th scope="col">{{ $t('demo.wizard.prefill.col.value') }}</th>
            <th scope="col">{{ $t('demo.wizard.prefill.col.source') }}</th>
            <th scope="col">{{ $t('demo.wizard.prefill.col.legal') }}</th>
            <th scope="col">{{ $t('demo.wizard.prefill.col.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key" :data-prefill-key="row.key">
            <td :data-title="$t('demo.wizard.prefill.col.field')">
              <strong>{{ row.label }}</strong>
            </td>
            <td :data-title="$t('demo.wizard.prefill.col.value')">
              <span v-if="row.display">{{ row.display }}</span>
              <span v-else-if="row.options && row.options.length" class="demo-provenance__muted">{{ $t('demo.wizard.prefill.chooseBelow') }}</span>
              <span v-else class="demo-provenance__muted">{{ $t('demo.wizard.prefill.noValue') }}</span>
            </td>
            <td :data-title="$t('demo.wizard.prefill.col.source')">
              {{ row.source.register }}
              <span class="demo-provenance__contract">{{ row.source.contract }}</span>
            </td>
            <td :data-title="$t('demo.wizard.prefill.col.legal')">{{ row.legalBasis || '-' }}</td>
            <td :data-title="$t('demo.wizard.prefill.col.status')">
              <span :class="['badge', modeBadgeClass(row.source.mode)]">{{ modeLabel(row.source.mode) }}</span>
              <span v-if="row.auditId !== null" class="demo-provenance__audit">{{ $t('demo.wizard.prefill.audit', { id: row.auditId }) }}</span>
              <span v-else class="demo-provenance__audit">{{ $t('demo.wizard.prefill.noAudit') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="demo-provenance__muted">{{ $t('demo.wizard.prefill.nothing') }}</p>

    <!-- List sources (children, cases): the citizen picks, the choice carries into step 3. -->
    <template v-for="row in optionRows" :key="`choice-${row.key}`">
      <FdsRadioGroup
        :id="`demo-choice-${row.key}`"
        :legend="$t('demo.wizard.prefill.choose', { field: lowerFirst(row.label) })"
        :hint="$t(row.choiceHintKey || 'demo.wizard.prefill.chooseHint', { register: row.source.register })"
        :options="row.options || []"
        :model-value="choices[row.key] ?? null"
        class="mt-6"
        @update:model-value="(v) => setChoice(row.key, String(v))"
      />
    </template>

    <div class="demo-provenance__typed mt-6">
      <h3 class="h4 mb-2">{{ $t('demo.wizard.prefill.youKnowHeading') }}</h3>
      <p v-if="!typedLabels.length" class="demo-provenance__muted">{{ $t('demo.wizard.prefill.youKnowNone') }}</p>
      <ul v-else class="nobullet-list demo-provenance__typed-list">
        <li v-for="label in typedLabels" :key="label">
          <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#edit" /></svg>
          {{ label }}
        </li>
      </ul>
    </div>

    <p class="demo-provenance__legend mt-5">
      <!-- Only explain the badges that appear in this table. -->
      <span v-if="modesShown.has('live')" class="demo-provenance__legend-item"><span class="badge badge-success">{{ $t('demo.wizard.mode.live') }}</span> {{ $t('demo.wizard.mode.liveHelp') }}</span>
      <span v-if="modesShown.has('live-capable')" class="demo-provenance__legend-item"><span class="badge badge-info">{{ $t('demo.wizard.mode.liveCapable') }}</span> {{ $t('demo.wizard.mode.liveCapableHelp') }}</span>
      <span v-if="modesShown.has('demo')" class="demo-provenance__legend-item"><span class="badge badge-warning">{{ $t('demo.wizard.mode.demo') }}</span> {{ $t('demo.wizard.mode.demoHelp') }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
// "Det spurgte vi ikke om": every prefilled field with its value (masked as
// delivered by the backend), source register + contract, legal basis, honest
// rail status (LIVE / LIVE-PARAT / DEMO) and the audit row id. The DEMO badge
// is never hidden: the readiness board and this table must agree.
import type { DemoProvenanceRow, DemoRailMode } from '~/types/demo'

const props = defineProps<{
  rows: DemoProvenanceRow[]
  /** labels of what the citizen still types ("Det kun du ved") */
  typedLabels: string[]
  choices: Record<string, string>
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:choices': [value: Record<string, string>]
}>()

/** Rail modes present in this table, so the legend never explains an absent badge. */
const modesShown = computed(() => new Set<DemoRailMode>(props.rows.map((r) => r.source.mode)))

const { t } = useI18n()
const { $dkfds } = useNuxtApp()

const optionRows = computed(() => props.rows.filter((r) => r.options && r.options.length > 0))

/** "Barn" -> "barn" inside "Vælg {field}"; acronyms ("CPR-nummer") stay. */
function lowerFirst(label: string): string {
  if (label.length > 1 && label[1] === label[1]!.toUpperCase() && label[1] !== label[1]!.toLowerCase()) return label
  return label.charAt(0).toLocaleLowerCase('da-DK') + label.slice(1)
}

function setChoice(key: string, value: string) {
  emit('update:choices', { ...props.choices, [key]: value })
}

function modeBadgeClass(mode: DemoRailMode): string {
  if (mode === 'live') return 'badge-success'
  if (mode === 'live-capable') return 'badge-info'
  return 'badge-warning'
}

function modeLabel(mode: DemoRailMode): string {
  if (mode === 'live') return t('demo.wizard.mode.live')
  if (mode === 'live-capable') return t('demo.wizard.mode.liveCapable')
  return t('demo.wizard.mode.demo')
}

// The table mounts after the page (async prefill), so bind the DKFDS
// responsive-table behaviour here; init is idempotent per element.
watch(() => props.rows.length, async () => {
  await nextTick()
  const el = document.querySelector('.demo-provenance')
  if (el) $dkfds?.init(el)
})
</script>

<style scoped>
.demo-provenance__table td {
  font-size: 0.9375rem;
}

.demo-provenance__contract,
.demo-provenance__audit {
  display: block;
  color: #5c5c5c;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}

.demo-provenance__muted {
  color: #5c5c5c;
}

.demo-provenance__loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.demo-provenance__typed-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.demo-provenance__legend-item { display: inline-block; margin-right: 1.5rem; }
.demo-provenance__legend {
  font-size: 0.875rem;
  color: #454545;
  line-height: 2;
}
</style>
