<template>
  <div ref="root" class="fds-step-indicator">
    <nav :aria-label="$t('fds.steps.label')" class="d-none d-md-block">
      <ol class="step-indicator">
        <li v-for="(step, index) in steps" :key="index" :class="itemClass(step)">
          <a
            v-if="step.state !== 'upcoming'"
            class="step"
            href="#"
            :aria-current="step.state === 'current' ? 'step' : undefined"
            @click.prevent="select(index)"
          >
            <span v-if="step.state === 'current'" class="step-number"><span>{{ index + 1 }}</span></span>
            <span v-else class="step-icon">
              <svg class="icon-svg" :aria-label="iconLabel(step, index)" focusable="false"><use :href="step.state === 'error' ? '#error' : '#check'" /></svg>
            </span>
            <div>
              <span class="step-title">{{ step.title }}</span>
              <span v-if="step.hint" class="step-information">{{ step.hint }}</span>
            </div>
          </a>
          <div v-else class="step">
            <span class="step-number"><span>{{ index + 1 }}</span></span>
            <div>
              <span class="step-title">{{ step.title }}</span>
              <span v-if="step.hint" class="step-information">{{ step.hint }}</span>
            </div>
          </div>
        </li>
      </ol>
    </nav>

    <button
      class="step-indicator-button d-md-none"
      aria-haspopup="dialog"
      type="button"
      data-module="modal"
      :data-target="modalId"
    >
      <span>{{ $t('fds.steps.step') }}<strong> {{ currentNumber }} </strong>{{ $t('fds.steps.of') }} {{ steps.length }}</span>
    </button>

    <div
      ref="modal"
      class="fds-modal modal-step-indicator"
      :id="modalId"
      aria-hidden="true"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${modalId}-heading`"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" :id="`${modalId}-heading`">{{ $t('fds.steps.heading') }}</h2>
          <button type="button" class="modal-close function-link" data-modal-close>
            <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#close" /></svg>{{ $t('fds.steps.close') }}
          </button>
        </div>
        <div class="modal-body">
          <ol class="step-indicator">
            <li v-for="(step, index) in steps" :key="index" :class="itemClass(step)">
              <a
                v-if="step.state !== 'upcoming'"
                class="step"
                href="#"
                :aria-current="step.state === 'current' ? 'step' : undefined"
                @click.prevent="selectFromModal(index)"
              >
                <span v-if="step.state === 'current'" class="step-number"><span>{{ index + 1 }}</span></span>
                <span v-else class="step-icon">
                  <svg class="icon-svg" :aria-label="iconLabel(step, index)" focusable="false"><use :href="step.state === 'error' ? '#error' : '#check'" /></svg>
                </span>
                <div>
                  <span class="step-title">{{ step.title }}</span>
                  <span v-if="step.hint" class="step-information">{{ step.hint }}</span>
                </div>
              </a>
              <div v-else class="step">
                <span class="step-number"><span>{{ index + 1 }}</span></span>
                <div>
                  <span class="step-title">{{ step.title }}</span>
                  <span v-if="step.hint" class="step-information">{{ step.hint }}</span>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// DKFDS Trinindikator. Desktop (md+): nav > ol.step-indicator with completed
// (a.step + #check icon), current (li.current, aria-current="step", number),
// upcoming (li.disabled, div.step) and error (li.error, #error icon) steps.
// Below md: a "Trin 2 af 3" button that opens the same list in a bottom-sheet
// fds-modal. The last step is the summary; no sub-steps.
//
// Completed and error steps are links so the citizen can go back; `select`
// carries the index. Upcoming steps are not interactive.
export interface FdsStep {
  title: string
  state: 'completed' | 'current' | 'upcoming' | 'error'
  hint?: string
}

const props = defineProps<{
  steps: FdsStep[]
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

const { t } = useI18n()
const { $dkfds } = useNuxtApp()

const baseId = useId()
const modalId = `${baseId}-modal`
const root = ref<HTMLElement | null>(null)
const modal = ref<HTMLElement | null>(null)

const currentNumber = computed(() => {
  const i = props.steps.findIndex((s) => s.state === 'current')
  return (i === -1 ? props.steps.length : i) + 1
})

function itemClass(step: FdsStep) {
  return {
    current: step.state === 'current',
    disabled: step.state === 'upcoming',
    error: step.state === 'error',
  }
}

function iconLabel(step: FdsStep, index: number) {
  return step.state === 'error'
    ? t('fds.steps.errorIn', { n: index + 1 })
    : t('fds.steps.completed', { n: index + 1 })
}

function select(index: number) {
  if (props.steps[index]?.state !== 'upcoming') {
    emit('select', index)
  }
}

function selectFromModal(index: number) {
  if (modal.value && $dkfds) {
    new $dkfds.lib.Modal(modal.value).hide()
  }
  select(index)
}

// The plugin initialises modals on page:finish; this covers a step indicator
// mounted later (async wizard steps). $dkfds.init is idempotent per element.
onMounted(() => {
  if (root.value) {
    $dkfds?.init(root.value)
  }
})
</script>
