<template>
  <section id="demo" class="py-20 lg:py-28 bg-white border-t border-neutral-100">
    <div class="max-w-6xl mx-auto px-6 lg:px-8">
      <div class="max-w-2xl mb-14">
        <p class="text-xs font-semibold tracking-widest uppercase text-primary-600 mb-3">
          {{ $t('demo.interactive') }}
        </p>
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          {{ $t('demo.forms.contact.title') }} &amp; {{ $t('demo.forms.permit.sectionTitle') }}
        </h2>
        <p class="text-lg text-neutral-500">
          {{ $t('demo.security.message') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Contact Form -->
        <div class="relative rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden">
          <!-- Demo badge -->
          <div class="absolute top-4 right-4 z-10">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-warning-100 text-warning-700 border border-warning-200">
              <span class="w-1.5 h-1.5 rounded-full bg-warning-500" />
              Demo
            </span>
          </div>

          <div class="p-6 lg:p-8">
            <h3 class="text-lg font-bold text-neutral-900 mb-6">
              {{ $t('demo.forms.contact.title') }}
            </h3>
            <form @submit.prevent="handleContactSubmit" class="space-y-4">
              <UiInput
                v-model="contactForm.name"
                :label="$t('demo.forms.contact.name')"
                :placeholder="$t('demo.forms.contact.namePlaceholder')"
                required
              />
              <UiInput
                v-model="contactForm.email"
                type="email"
                :label="$t('demo.forms.contact.email')"
                :placeholder="$t('demo.forms.contact.emailPlaceholder')"
                required
              />
              <UiSelect
                v-model="contactForm.subject"
                :label="$t('demo.forms.contact.subject')"
                :placeholder="$t('demo.forms.contact.selectSubject')"
                :options="contactSubjects"
                required
              />
              <UiTextarea
                v-model="contactForm.message"
                :label="$t('demo.forms.contact.message')"
                :placeholder="$t('demo.forms.contact.messagePlaceholder')"
                required
                :rows="4"
              />
              <UiButton type="submit" variant="primary" full-width :disabled="submitting">
                {{ submitting ? '...' : $t('demo.forms.contact.submit') }}
              </UiButton>
            </form>
          </div>
        </div>

        <!-- Building Permit Interactive Workflow Demo -->
        <LandingWorkflowDemo />
      </div>

      <!-- Error display -->
      <div v-if="errorMessage" class="mt-6 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
        {{ errorMessage }}
      </div>

      <!-- Workflow result modal -->
      <Transition name="modal">
        <div
          v-if="workflowResult"
          class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
          @click.self="workflowResult = null"
        >
          <div class="max-w-lg w-full">
            <LandingWorkflowResultPanel
              :steps="workflowResult.steps"
              :lifecycle-steps="workflowResult.lifecycleSteps"
              :submission-id="workflowResult.submissionId"
              @close="workflowResult = null"
            />
          </div>
        </div>
      </Transition>

      <!-- Success toast (fallback when no workflow data) -->
      <Transition name="toast">
        <div v-if="showSuccess" class="fixed bottom-6 right-6 z-50 max-w-sm">
          <div class="rounded-xl border border-success-200 bg-white shadow-xl shadow-neutral-900/10 p-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-success-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                <path d="M3 8.5l3.5 3.5L13 4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-neutral-900">{{ successMessage }}</p>
              <p class="text-xs text-neutral-500 mt-0.5">{{ $t('demo.success.message') }}</p>
            </div>
            <button
              @click="showSuccess = false"
              class="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              :aria-label="$t('demo.success.close')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public

interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'failed'
  error?: string | null
}

interface SubmissionResponse {
  data: { id: string }
  workflow?: { status: string; step_count: number; steps: WorkflowStep[] }
}

const contactForm = ref({ name: '', email: '', subject: '', message: '' })
const showSuccess = ref(false)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const workflowResult = ref<{ steps: WorkflowStep[]; lifecycleSteps: WorkflowStep[]; submissionId: string } | null>(null)

const contactLifecycle: WorkflowStep[] = [
  { id: 'lc_notify', name: 'Caseworker Notification', description: 'Case assigned to available caseworker via task queue', status: 'next' },
  { id: 'lc_response', name: 'Response via Digital Post', description: 'Citizen receives official response in their Digital Post inbox', status: 'next' },
]

const contactSubjects = computed(() => [
  { label: t('demo.forms.contact.subjects.general'), value: 'general' },
  { label: t('demo.forms.contact.subjects.support'), value: 'support' },
  { label: t('demo.forms.contact.subjects.demo'), value: 'demo' },
  { label: t('demo.forms.contact.subjects.other'), value: 'other' },
])

let successTimeout: ReturnType<typeof setTimeout> | null = null

const dismissSuccess = () => {
  showSuccess.value = false
  if (successTimeout) clearTimeout(successTimeout)
}

const showSuccessToast = (msg: string) => {
  successMessage.value = msg
  errorMessage.value = ''
  showSuccess.value = true
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(dismissSuccess, 6000)
}

const handleWorkflowResponse = (res: SubmissionResponse, resetForm: () => void) => {
  if (res.workflow?.steps?.length) {
    workflowResult.value = {
      steps: res.workflow.steps,
      lifecycleSteps: contactLifecycle,
      submissionId: String(res.data?.id),
    }
  } else {
    showSuccessToast(`Submission #${res.data?.id} created`)
  }
  resetForm()
}

const handleContactSubmit = async () => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<SubmissionResponse>(`${apiBase}/api/webform/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: { data: { ...contactForm.value } },
    })
    handleWorkflowResponse(res, () => {
      contactForm.value = { name: '', email: '', subject: '', message: '' }
    })
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Submission failed - backend may be offline'
  } finally {
    submitting.value = false
  }
}

</script>

<style scoped>
.toast-enter-active {
  animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  animation: toastOut 0.3s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.97); }
}

.modal-enter-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active > div {
  animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(24px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
