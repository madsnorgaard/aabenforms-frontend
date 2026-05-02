<template>
  <div class="dawa-address-field">
    <label v-if="label" class="dawa-label">
      {{ label }}<span v-if="required" class="dawa-required" aria-hidden="true"> *</span>
    </label>
    <div class="dawa-search-wrap">
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        class="dawa-input"
        :placeholder="placeholderText"
        :required="required && !modelValue"
        :aria-expanded="open"
        :aria-controls="listboxId"
        :aria-activedescendant="activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <ul
        v-if="open && suggestions.length"
        :id="listboxId"
        class="dawa-suggestions"
        role="listbox"
      >
        <li
          v-for="(s, i) in suggestions"
          :id="`${listboxId}-${i}`"
          :key="s.data.id"
          role="option"
          class="dawa-suggestion"
          :class="{ active: i === activeIndex }"
          :aria-selected="i === activeIndex"
          @mousedown.prevent="select(s)"
          @mouseenter="activeIndex = i"
        >
          {{ s.tekst }}
        </li>
      </ul>
      <p
        v-else-if="open && !loading && query.length >= 2"
        class="dawa-empty"
      >
        {{ $t('form.dawa.noResults') }}
      </p>
    </div>
    <div v-if="modelValue?.street" class="dawa-selected" data-testid="dawa-selected">
      <p class="dawa-selected-line">{{ modelValue.street }}</p>
      <p class="dawa-selected-line">{{ modelValue.postal_code }} {{ modelValue.city }}</p>
      <button
        type="button"
        class="dawa-clear"
        @click="clear"
      >
        {{ $t('form.dawa.clear') }}
      </button>
    </div>
    <p class="dawa-attribution">{{ $t('form.dawa.attribution') }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

interface DawaAddress {
  id: string
  street: string
  postal_code: string
  city: string
}

interface DawaSuggestion {
  tekst: string
  data: {
    id: string
    vejnavn: string
    husnr: string
    etage?: string
    dør?: string
    postnr: string
    postnrnavn: string
  }
}

const props = withDefaults(defineProps<{
  modelValue?: DawaAddress | null
  label?: string
  required?: boolean
  placeholder?: string
}>(), {
  modelValue: null,
  label: '',
  required: false,
  placeholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: DawaAddress | null]
}>()

const { t } = useI18n()

const query = ref(props.modelValue?.street ? formatFromModel(props.modelValue) : '')
const suggestions = ref<DawaSuggestion[]>([])
const open = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
const inputEl = ref<HTMLInputElement | null>(null)
const listboxId = `dawa-listbox-${Math.random().toString(36).slice(2, 9)}`

const placeholderText = computed(() => props.placeholder || t('form.dawa.searchPlaceholder'))

let abortCtrl: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function formatFromModel(m: DawaAddress): string {
  return `${m.street}, ${m.postal_code} ${m.city}`
}

function onInput() {
  // User is typing fresh - any prior selection is stale.
  if (props.modelValue) emit('update:modelValue', null)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchSuggestions, 200)
}

async function fetchSuggestions() {
  const q = query.value.trim()
  if (q.length < 2) {
    suggestions.value = []
    open.value = false
    return
  }
  if (abortCtrl) abortCtrl.abort()
  abortCtrl = new AbortController()
  loading.value = true
  try {
    const params = new URLSearchParams({
      q,
      type: 'adresse',
      caretpos: String(q.length),
    })
    const res = await $fetch<DawaSuggestion[]>(
      `https://api.dataforsyningen.dk/autocomplete?${params.toString()}`,
      { signal: abortCtrl.signal },
    )
    suggestions.value = Array.isArray(res) ? res.slice(0, 8) : []
    activeIndex.value = -1
    open.value = true
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('DAWA lookup failed', err)
      suggestions.value = []
    }
  } finally {
    loading.value = false
  }
}

function select(s: DawaSuggestion) {
  const d = s.data
  const street = [
    `${d.vejnavn} ${d.husnr}`,
    d.etage ? `${d.etage}.` : '',
    d.dør || '',
  ].filter(Boolean).join(' ')
  const value: DawaAddress = {
    id: d.id,
    street,
    postal_code: d.postnr,
    city: d.postnrnavn,
  }
  emit('update:modelValue', value)
  query.value = formatFromModel(value)
  suggestions.value = []
  open.value = false
}

function clear() {
  emit('update:modelValue', null)
  query.value = ''
  suggestions.value = []
  open.value = false
  inputEl.value?.focus()
}

function onFocus() {
  if (suggestions.value.length) open.value = true
}

function onBlur() {
  // Delay so a mousedown on a suggestion lands first.
  setTimeout(() => { open.value = false }, 150)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) {
      open.value = suggestions.value.length > 0
      return
    }
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    select(suggestions.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortCtrl) abortCtrl.abort()
})
</script>

<style scoped>
.dawa-address-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dawa-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #262626;
}

.dawa-required {
  color: #dc2626;
}

.dawa-search-wrap {
  position: relative;
}

.dawa-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.875rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  line-height: 1.4;
  background: white;
  color: #111827;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.dawa-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.dawa-suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  max-height: 280px;
  overflow-y: auto;
  z-index: 20;
}

.dawa-suggestion {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  cursor: pointer;
}

.dawa-suggestion.active,
.dawa-suggestion:hover {
  background: #f3f4f6;
}

.dawa-empty {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  color: #6b7280;
}

.dawa-selected {
  position: relative;
  padding: 0.625rem 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
}

.dawa-selected-line {
  margin: 0;
  line-height: 1.4;
}

.dawa-clear {
  position: absolute;
  top: 0.5rem;
  right: 0.625rem;
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  padding: 2px 4px;
}

.dawa-clear:hover {
  color: #111827;
  text-decoration: underline;
}

.dawa-attribution {
  margin: 0;
  font-size: 0.6875rem;
  color: #9ca3af;
}
</style>
