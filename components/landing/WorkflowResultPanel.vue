<template>
  <div class="rounded-xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 overflow-hidden">
    <!-- Header -->
    <div class="px-6 pt-6 pb-4 border-b border-neutral-100">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
             :class="failed ? 'bg-error-100' : 'bg-success-100'">
          <svg v-if="!failed" class="w-5 h-5 text-success-600" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2">
            <path d="M4 10.5l4.5 4.5L16 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else class="w-5 h-5 text-error-600" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2">
            <path d="M6 6l8 8M14 6l-8 8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div>
          <h3 class="text-base font-bold text-neutral-900">
            {{ failed ? $t('demo.workflow.failedTitle') : $t('demo.workflow.title') }}
          </h3>
          <p class="text-xs text-neutral-500">
            {{ $t('demo.workflow.submissionId') }} #{{ submissionId }}
          </p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="failed ? 'bg-error-500' : 'bg-success-500'"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <p class="text-[11px] text-neutral-400 mt-1.5 font-medium tracking-wide uppercase">
        {{ visibleCount }} / {{ steps.length }} {{ $t('demo.workflow.stepsCompleted') }}
      </p>
    </div>

    <!-- Steps timeline -->
    <div class="px-6 py-5">
      <div class="relative">
        <!-- Timeline rail -->
        <div class="absolute left-[11px] top-3 bottom-3 w-px bg-neutral-200" />

        <TransitionGroup name="step" tag="div" class="space-y-4 relative">
          <div
            v-for="(step, index) in visibleSteps"
            :key="step.id + index"
            class="flex items-start gap-3.5 relative"
          >
            <!-- Step indicator -->
            <div class="relative z-10 flex-shrink-0 mt-0.5">
              <div
                class="w-[23px] h-[23px] rounded-full flex items-center justify-center border-2"
                :class="step.status === 'completed'
                  ? 'bg-success-500 border-success-500'
                  : 'bg-error-500 border-error-500'"
              >
                <svg v-if="step.status === 'completed'" class="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" stroke-width="2.5">
                  <path d="M2 6.5l2.5 2.5L10 3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else class="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 3l6 6M9 3l-6 6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <!-- Step content -->
            <div class="min-w-0 pt-px">
              <p class="text-sm font-semibold text-neutral-900 leading-tight">{{ step.name }}</p>
              <p class="text-xs text-neutral-500 mt-0.5 leading-relaxed">{{ step.description }}</p>
              <p v-if="step.error" class="text-xs text-error-600 mt-0.5">{{ step.error }}</p>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 pb-6">
      <button
        @click="$emit('close')"
        class="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors bg-neutral-900 text-white hover:bg-neutral-800"
      >
        {{ $t('demo.workflow.submitAnother') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'failed'
  error?: string | null
}

const props = defineProps<{
  steps: WorkflowStep[]
  submissionId: string
  workflowName?: string
}>()

defineEmits<{
  close: []
}>()

const visibleCount = ref(0)
const revealTimer = ref<ReturnType<typeof setInterval> | null>(null)

const visibleSteps = computed(() => props.steps.slice(0, visibleCount.value))
const progress = computed(() =>
  props.steps.length ? Math.round((visibleCount.value / props.steps.length) * 100) : 0
)
const failed = computed(() => props.steps.some(s => s.status === 'failed'))

onMounted(() => {
  revealTimer.value = setInterval(() => {
    if (visibleCount.value < props.steps.length) {
      visibleCount.value++
    } else if (revealTimer.value) {
      clearInterval(revealTimer.value)
    }
  }, 500)
})

onUnmounted(() => {
  if (revealTimer.value) clearInterval(revealTimer.value)
})
</script>

<style scoped>
.step-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.step-enter-from {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
