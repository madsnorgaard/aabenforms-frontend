<template>
  <div>
    <p class="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">
      {{ $t('demo.byggetilladelse.capabilities.title') }}
    </p>
    <ul class="flex flex-wrap gap-2">
      <li v-for="cap in capabilities" :key="cap.key">
        <button
          type="button"
          @click="toggle(cap.key)"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
          :class="active === cap.key
            ? 'bg-neutral-900 text-white border-neutral-900'
            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="active === cap.key ? 'bg-secondary-400' : 'bg-primary-500'"
          />
          {{ cap.label }}
        </button>
      </li>
    </ul>
    <Transition name="cap-explainer">
      <p
        v-if="activeDesc"
        :key="active"
        class="mt-3 text-xs text-neutral-600 leading-relaxed max-w-prose"
      >
        {{ activeDesc }}
      </p>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const capabilities = computed(() => [
  { key: 'bpmn', label: t('demo.byggetilladelse.capabilities.bpmn'), desc: t('demo.byggetilladelse.capabilities.bpmnDesc') },
  { key: 'eca', label: t('demo.byggetilladelse.capabilities.eca'), desc: t('demo.byggetilladelse.capabilities.ecaDesc') },
  { key: 'mitid', label: t('demo.byggetilladelse.capabilities.mitid'), desc: t('demo.byggetilladelse.capabilities.mitidDesc') },
  { key: 'digitalPost', label: t('demo.byggetilladelse.capabilities.digitalPost'), desc: t('demo.byggetilladelse.capabilities.digitalPostDesc') },
  { key: 'gdpr', label: t('demo.byggetilladelse.capabilities.gdpr'), desc: t('demo.byggetilladelse.capabilities.gdprDesc') },
])

const active = ref<string | null>(null)
const activeDesc = computed(() => capabilities.value.find(c => c.key === active.value)?.desc ?? '')

function toggle(key: string) {
  active.value = active.value === key ? null : key
}
</script>

<style scoped>
.cap-explainer-enter-active { transition: all 180ms ease; }
.cap-explainer-leave-active { transition: all 120ms ease; }
.cap-explainer-enter-from, .cap-explainer-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
