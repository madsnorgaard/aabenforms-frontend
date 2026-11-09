<template>
  <div class="demo-capabilities">
    <h2 class="h5">{{ $t('demo.byggetilladelse.capabilities.title') }}</h2>
    <ul class="nobullet-list demo-capabilities__list">
      <li v-for="cap in capabilities" :key="cap.key">
        <button
          type="button"
          class="tag"
          :class="{ 'tag-active': active === cap.key }"
          :aria-pressed="active === cap.key ? 'true' : 'false'"
          :aria-describedby="active === cap.key ? descId : undefined"
          @click="toggle(cap.key)"
        >
          {{ cap.label }}
        </button>
      </li>
    </ul>
    <p v-if="activeDesc" :id="descId" class="demo-capabilities__desc">{{ activeDesc }}</p>
  </div>
</template>

<script setup lang="ts">
// DKFDS tags as toggle buttons: press one to read what the capability is.
const { t } = useI18n()
const descId = `${useId()}-desc`

const capabilities = computed(() => [
  { key: 'bpmn', label: t('demo.byggetilladelse.capabilities.bpmn'), desc: t('demo.byggetilladelse.capabilities.bpmnDesc') },
  { key: 'eca', label: t('demo.byggetilladelse.capabilities.eca'), desc: t('demo.byggetilladelse.capabilities.ecaDesc') },
  { key: 'mitid', label: t('demo.byggetilladelse.capabilities.mitid'), desc: t('demo.byggetilladelse.capabilities.mitidDesc') },
  { key: 'digitalPost', label: t('demo.byggetilladelse.capabilities.digitalPost'), desc: t('demo.byggetilladelse.capabilities.digitalPostDesc') },
  { key: 'gdpr', label: t('demo.byggetilladelse.capabilities.gdpr'), desc: t('demo.byggetilladelse.capabilities.gdprDesc') },
])

const active = ref<string | null>(null)
const activeDesc = computed(() => capabilities.value.find((c) => c.key === active.value)?.desc ?? '')

function toggle(key: string) {
  active.value = active.value === key ? null : key
}
</script>

<style scoped>
.demo-capabilities__list {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
}

.demo-capabilities__list li {
  margin-top: 0;
}

.demo-capabilities__desc {
  font-size: 0.9375rem;
  color: #454545;
  margin: 0;
}
</style>
