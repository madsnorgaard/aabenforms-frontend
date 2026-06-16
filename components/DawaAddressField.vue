<!--
  Compatibility wrapper around <AddressAutocomplete> for the webform renderer.

  Keeps the legacy `{ id, street, postal_code, city }` model that
  WebformRenderer folds into `<key>_street` / `_postal_code` / `_city` / `_id`,
  while the underlying engine now uses the Klimadatastyrelsen Adressevælger
  service (DAWA's successor). The `dawa_address` field type id is unchanged.
-->
<template>
  <AddressAutocomplete
    :model-value="modelValue"
    :label="label"
    :required="required"
    :placeholder="placeholder"
    :kommune-kode="kommuneKode"
    @update:model-value="onUpdate"
  />
</template>

<script setup lang="ts">
import type { NormalizedAddress } from '~/composables/useAddressSearch'

interface DawaAddress {
  id: string
  street: string
  postal_code: string
  city: string
}

withDefaults(defineProps<{
  modelValue?: DawaAddress | null
  label?: string
  required?: boolean
  placeholder?: string
  /** Optional municipality scoping (4-digit kommunekode). */
  kommuneKode?: string
}>(), {
  modelValue: null,
  label: '',
  required: false,
  placeholder: '',
  kommuneKode: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: DawaAddress | null]
}>()

function onUpdate(value: NormalizedAddress | null) {
  emit('update:modelValue', value
    ? { id: value.id, street: value.street, postal_code: value.postal_code, city: value.city }
    : null)
}
</script>
