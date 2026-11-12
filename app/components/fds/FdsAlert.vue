<template>
  <div
    v-if="visible"
    :class="['alert', `alert-${type}`, { 'alert--paragraph': paragraph, 'has-close': dismissible }]"
    :role="role"
  >
    <svg class="icon-svg alert-icon" :aria-label="iconLabel" focusable="false"><use :href="`#${type}`" /></svg>
    <div class="alert-body">
      <component :is="headingLevel" v-if="heading" :class="['alert-heading', { 'pr-7': dismissible }]">{{ heading }}</component>
      <div v-if="$slots.default" class="alert-text"><slot /></div>
      <p v-else-if="text" class="alert-text">{{ text }}</p>
      <button v-if="dismissible" type="button" class="alert-close" @click="close">
        <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#close" /></svg>{{ $t('fds.alert.close') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// DKFDS Beskeder: div.alert.alert-{info|success|warning|error} > svg.alert-icon
// + div.alert-body (heading + p.alert-text). role="alert" only on warning and
// error; `paragraph` constrains the width; `dismissible` adds has-close +
// alert-close. Status-type messages (success/info) that should still be
// announced can pass role="status" explicitly.
const props = withDefaults(defineProps<{
  type?: 'info' | 'success' | 'warning' | 'error'
  heading?: string
  headingLevel?: 'h2' | 'h3' | 'h4'
  text?: string
  paragraph?: boolean
  dismissible?: boolean
  role?: string
}>(), {
  type: 'info',
  headingLevel: 'h3',
  paragraph: false,
  dismissible: false,
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const visible = ref(true)
const role = computed(() => props.role ?? (props.type === 'warning' || props.type === 'error' ? 'alert' : undefined))
const iconLabel = computed(() => t(`fds.alert.${props.type}`))

function close() {
  visible.value = false
  emit('close')
}
</script>
