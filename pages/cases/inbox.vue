<template>
  <div class="inbox-page">
    <div class="inbox-container">
      <header class="inbox-header">
        <h1>{{ $t('caseInbox.title') }}</h1>
        <p class="inbox-sub">{{ $t('caseInbox.subtitle') }}</p>
      </header>

      <div class="inbox-filters">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ $t(f.label) }}
        </button>
      </div>

      <p v-if="caseStore.loading" class="inbox-state">{{ $t('caseInbox.loading') }}</p>
      <p v-else-if="caseStore.error" class="inbox-state error">{{ $t('caseInbox.loadError') }}</p>
      <p v-else-if="visibleCases.length === 0" class="inbox-state">{{ $t('caseInbox.empty') }}</p>

      <table v-else class="inbox-table">
        <thead>
          <tr>
            <th>{{ $t('caseInbox.colId') }}</th>
            <th>{{ $t('caseInbox.colTitle') }}</th>
            <th>{{ $t('caseInbox.colType') }}</th>
            <th>{{ $t('caseInbox.colStatus') }}</th>
            <th>{{ $t('caseInbox.colFrist') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in visibleCases" :key="c.id">
            <td>{{ c.id }}</td>
            <td>{{ c.title }}</td>
            <td>{{ c.caseType }}</td>
            <td>
              <span class="status-badge">{{ $t(`caseStatus.${c.status}`) }}</span>
            </td>
            <td>
              <span class="frist-badge" :class="`frist-${stateOf(c)}`">
                {{ fristLabel(c) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fristState } from '~/stores/case'
import type { CaseItem, FristState } from '~/types/case'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const caseStore = useCaseStore()

useHead({ title: () => `${t('caseInbox.title')} - ÅbenForms` })

const filters = [
  { value: 'all', label: 'caseInbox.filterAll' },
  { value: 'open', label: 'caseInbox.filterOpen' },
  { value: 'overdue', label: 'caseInbox.filterOverdue' },
] as const

const activeFilter = ref<'all' | 'open' | 'overdue'>('all')

const nowSeconds = () => Math.floor(Date.now() / 1000)

const stateOf = (c: CaseItem): FristState => fristState(c.fristDue, nowSeconds())

const visibleCases = computed(() => {
  switch (activeFilter.value) {
    case 'open':
      return caseStore.cases.filter(c => c.status !== 'lukket')
    case 'overdue':
      return caseStore.cases.filter(c => stateOf(c) === 'roed')
    default:
      return caseStore.cases
  }
})

const fristLabel = (c: CaseItem): string => {
  if (c.fristDue === null) return '—'
  const d = new Date(c.fristDue * 1000)
  return d.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(() => {
  caseStore.loadCases()
})
</script>

<style scoped>
.inbox-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0;
}
.inbox-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}
.inbox-header h1 {
  margin: 0 0 0.25rem;
}
.inbox-sub {
  color: #555;
  margin: 0 0 1.5rem;
}
.inbox-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.filter-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 999px;
  cursor: pointer;
}
.filter-btn.active {
  background: #1a4d8f;
  color: #fff;
  border-color: #1a4d8f;
}
.inbox-state {
  padding: 1rem 0;
  color: #555;
}
.inbox-state.error {
  color: #b00020;
}
.inbox-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.inbox-table th,
.inbox-table td {
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}
.status-badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #eef2f7;
  font-size: 0.85rem;
}
.frist-badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
}
.frist-groen { background: #e3f6e8; color: #1b7a3a; }
.frist-gul { background: #fdf3d8; color: #8a6d00; }
.frist-roed { background: #fde3e3; color: #b00020; }
.frist-none { background: #eee; color: #777; }
</style>
