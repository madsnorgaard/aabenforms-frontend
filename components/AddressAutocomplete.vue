<template>
  <div class="address-field">
    <label v-if="label" class="address-label">
      {{ label }}<span v-if="required" class="address-required" aria-hidden="true"> *</span>
    </label>
    <div class="address-search-wrap">
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        class="address-input"
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
        class="address-suggestions"
        role="listbox"
      >
        <li
          v-for="(s, i) in suggestions"
          :id="`${listboxId}-${i}`"
          :key="s.id"
          role="option"
          class="address-suggestion"
          :class="{ active: i === activeIndex }"
          :aria-selected="i === activeIndex"
          @mousedown.prevent="select(s)"
          @mouseenter="activeIndex = i"
        >
          {{ s.titel }}
        </li>
      </ul>
      <p
        v-else-if="open && !loading && query.length >= 2"
        class="address-empty"
      >
        {{ $t('form.address.noResults') }}
      </p>
    </div>
    <div v-if="modelValue?.street" class="address-selected" data-testid="address-selected">
      <p class="address-selected-line">{{ modelValue.street }}</p>
      <p class="address-selected-line">{{ modelValue.postal_code }} {{ modelValue.city }}</p>
      <button
        type="button"
        class="address-clear"
        @click="clear"
      >
        {{ $t('form.address.clear') }}
      </button>
    </div>
    <p class="address-attribution">{{ $t('form.address.attribution') }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  useAddressSearch,
  type AddressSuggestion,
  type NormalizedAddress,
} from '~/composables/useAddressSearch'

/** Value held by the field. A superset-compatible subset of {@link NormalizedAddress}. */
export interface AddressValue {
  id: string
  street: string
  postal_code: string
  city: string
  coordinates?: { x: number, y: number } | null
  raw?: unknown
}

const props = withDefaults(defineProps<{
  modelValue?: AddressValue | null
  label?: string
  required?: boolean
  placeholder?: string
  /** Restrict results to a municipality (4-digit kommunekode). */
  kommuneKode?: string
  /** Search access addresses (house numbers) only. */
  adgangsadresserOnly?: boolean
  /** Maximum number of suggestions. */
  maksimum?: number
  /** Include provisional addresses. */
  medtagForeloebige?: boolean
}>(), {
  modelValue: null,
  label: '',
  required: false,
  placeholder: '',
  kommuneKode: undefined,
  adgangsadresserOnly: false,
  maksimum: 10,
  medtagForeloebige: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: NormalizedAddress | null]
}>()

const { t } = useI18n()

const { search, get, isFinal, normalizeAddress } = useAddressSearch({
  kommuneKode: props.kommuneKode,
  adgangsadresserOnly: props.adgangsadresserOnly,
  maksimum: props.maksimum,
  medtagForeloebige: props.medtagForeloebige,
})

const query = ref(props.modelValue?.street ? formatFromModel(props.modelValue) : '')
const suggestions = ref<AddressSuggestion[]>([])
const open = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
const inputEl = ref<HTMLInputElement | null>(null)
const listboxId = `address-listbox-${Math.random().toString(36).slice(2, 9)}`

const placeholderText = computed(() => props.placeholder || t('form.address.searchPlaceholder'))

let abortCtrl: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function formatFromModel(m: AddressValue): string {
  return `${m.street}, ${m.postal_code} ${m.city}`
}

function onInput() {
  // User is typing fresh - any prior selection is stale.
  if (props.modelValue) emit('update:modelValue', null)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchSuggestions(query.value), 200)
}

async function fetchSuggestions(text: string) {
  const q = text.trim()
  if (q.length < 2) {
    suggestions.value = []
    open.value = false
    return
  }
  if (abortCtrl) abortCtrl.abort()
  abortCtrl = new AbortController()
  loading.value = true
  try {
    const fund = await search(q, abortCtrl.signal)
    suggestions.value = fund.slice(0, props.maksimum)
    activeIndex.value = -1
    open.value = true
  }
  catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('Address lookup failed', err)
      suggestions.value = []
    }
  }
  finally {
    loading.value = false
  }
}

async function select(s: AddressSuggestion) {
  // Stepwise narrowing: a street name / named-street-postcode (or a bare house
  // number in address mode) refines the query rather than resolving an address.
  if (!isFinal(s)) {
    query.value = `${s.titel} `
    activeIndex.value = -1
    inputEl.value?.focus()
    await fetchSuggestions(query.value)
    return
  }

  loading.value = true
  try {
    const record = await get(s.id)
    const value = normalizeAddress(record)
    emit('update:modelValue', value)
    query.value = formatFromModel(value)
    suggestions.value = []
    open.value = false
  }
  catch (err) {
    console.warn('Address lookup failed', err)
  }
  finally {
    loading.value = false
  }
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
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }
  else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    select(suggestions.value[activeIndex.value])
  }
  else if (e.key === 'Escape') {
    open.value = false
  }
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortCtrl) abortCtrl.abort()
})
</script>

<style scoped>
.address-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.address-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #262626;
}

.address-required {
  color: #dc2626;
}

.address-search-wrap {
  position: relative;
}

.address-input {
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

.address-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.address-suggestions {
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

.address-suggestion {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  cursor: pointer;
}

.address-suggestion.active,
.address-suggestion:hover {
  background: #f3f4f6;
}

.address-empty {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  color: #6b7280;
}

.address-selected {
  position: relative;
  padding: 0.625rem 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
}

.address-selected-line {
  margin: 0;
  line-height: 1.4;
}

.address-clear {
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

.address-clear:hover {
  color: #111827;
  text-decoration: underline;
}

.address-attribution {
  margin: 0;
  font-size: 0.6875rem;
  color: #9ca3af;
}
</style>
