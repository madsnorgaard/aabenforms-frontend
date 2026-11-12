<template>
  <main id="main" tabindex="-1" style="max-width: 520px; margin: 40px auto; font-family: sans-serif;">
    <h1 style="font-size: 1.25rem;">Adressevælger test</h1>
    <p style="color:#4b5563;font-size:.85rem">Prøv at skrive fx <code>Rentemester</code>, vælg vejen, vælg så en adresse.</p>
    <ClientOnly>
      <AddressAutocomplete
        v-model="value"
        label="Adresse"
        :required="true"
      />
      <pre data-testid="value" style="margin-top: 1rem; background: #f3f4f6; padding: 0.75rem; border-radius: 6px;">{{ valueJson }}</pre>
    </ClientOnly>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const value = ref<any>(null)
const valueJson = computed(() => {
  if (!value.value) return 'null'
  const { raw, ...rest } = value.value
  return JSON.stringify(rest, null, 2)
})
</script>
