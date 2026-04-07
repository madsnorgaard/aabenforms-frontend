<template>
  <div class="relative rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden">
    <!-- Demo badge -->
    <div class="absolute top-4 right-4 z-10">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-primary-100 text-primary-700 border border-primary-200">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-500" />
        Interactive Demo
      </span>
    </div>

    <div class="p-6 lg:p-8">
      <!-- Step progress indicator -->
      <div class="flex items-center gap-2 mb-2">
        <div
          v-for="n in 4" :key="n"
          class="h-1.5 flex-1 rounded-full transition-all duration-500"
          :class="stepBarClass(n)"
        />
      </div>
      <p class="text-[11px] text-neutral-400 font-medium tracking-wide uppercase mb-6">
        {{ stepLabels[currentStepIndex] }}
      </p>

      <!-- ─── STEP 1: Citizen Form ─── -->
      <Transition name="fade" mode="out-in">
        <div v-if="phase === 'form'" key="form">
          <h3 class="text-lg font-bold text-neutral-900 mb-4">
            {{ $t('demo.forms.permit.title') }}
          </h3>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <UiInput v-model="form.cpr" :label="$t('demo.forms.permit.cpr')" placeholder="DDMMYY-XXXX" :help-text="$t('demo.forms.permit.cprHelp')" required />
            <UiInput v-model="form.address" :label="$t('demo.forms.permit.address')" :placeholder="$t('demo.forms.permit.addressPlaceholder')" required />
            <UiSelect v-model="form.buildingType" :label="$t('demo.forms.permit.buildingType')" :placeholder="$t('demo.forms.permit.selectType')" :options="buildingTypes" required />
            <UiTextarea v-model="form.description" :label="$t('demo.forms.permit.description')" required :rows="3" />
            <UiButton type="submit" variant="primary" full-width :disabled="submitting">
              {{ submitting ? '...' : $t('demo.forms.permit.submit') }}
            </UiButton>
          </form>
        </div>

        <!-- ─── STEP 2: Parent 1 Approval ─── -->
        <div v-else-if="phase === 'parent1'" key="parent1">
          <RoleBadge icon="user" :role="$t('demo.step.parent1')" :name="$t('demo.step.parent1Name')" />
          <ApprovalCard
            :title="$t('demo.step.approvalReceived')"
            :description="$t('demo.step.approvalDesc')"
            :application-summary="applicationSummary"
            :button-label="$t('demo.step.authenticateApprove')"
            :processing="processing"
            @approve="advanceWithDelay('parent2')"
          />
        </div>

        <!-- ─── STEP 3: Parent 2 Approval ─── -->
        <div v-else-if="phase === 'parent2'" key="parent2">
          <RoleBadge icon="user" :role="$t('demo.step.parent2')" :name="$t('demo.step.parent2Name')" />
          <div class="mb-4 flex items-center gap-2 text-xs text-success-600">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2"><path d="M2 7.5l3 3L12 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ $t('demo.step.parent1Name') }} {{ $t('demo.step.approved') }}
          </div>
          <ApprovalCard
            :title="$t('demo.step.approvalReceived')"
            :description="$t('demo.step.approvalDesc')"
            :application-summary="applicationSummary"
            :button-label="$t('demo.step.authenticateApprove')"
            :processing="processing"
            @approve="advanceWithDelay('caseworker')"
          />
        </div>

        <!-- ─── STEP 4: Caseworker Review ─── -->
        <div v-else-if="phase === 'caseworker'" key="caseworker">
          <RoleBadge icon="building" :role="$t('demo.step.caseworker')" :name="$t('demo.step.caseworkerName')" />
          <div class="mb-4 space-y-1.5">
            <div class="flex items-center gap-2 text-xs text-success-600">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2"><path d="M2 7.5l3 3L12 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ $t('demo.step.parent1Name') }} - {{ $t('demo.step.approvedViaMitId') }}
            </div>
            <div class="flex items-center gap-2 text-xs text-success-600">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2"><path d="M2 7.5l3 3L12 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ $t('demo.step.parent2Name') }} - {{ $t('demo.step.approvedViaMitId') }}
            </div>
          </div>
          <ApprovalCard
            :title="$t('demo.step.caseReview')"
            :description="$t('demo.step.caseReviewDesc')"
            :application-summary="applicationSummary"
            :button-label="$t('demo.step.approveApplication')"
            :processing="processing"
            @approve="advanceWithDelay('complete')"
          />
        </div>

        <!-- ─── COMPLETE ─── -->
        <div v-else-if="phase === 'complete'" key="complete">
          <div class="text-center py-4">
            <div class="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-900 mb-2">{{ $t('demo.step.completeTitle') }}</h3>
            <p class="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">{{ $t('demo.step.completeDesc') }}</p>

            <!-- Completed steps summary -->
            <div class="text-left space-y-3 mb-6 border-t border-neutral-200 pt-5">
              <div v-for="(step, i) in completedSteps" :key="i" class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" stroke-width="2.5">
                    <path d="M2 6.5l2.5 2.5L10 3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-neutral-900">{{ step.role }}</p>
                  <p class="text-xs text-neutral-500">{{ step.action }}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 text-xs text-primary-600 mb-6">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.5">
                <path d="M2 4l6 4 6-4M2 4v8l6 4 6-4V4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ $t('demo.step.digitalPost') }}
            </div>

            <UiButton variant="primary" full-width @click="reset">
              {{ $t('demo.step.runAgain') }}
            </UiButton>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Workflow result overlay (after submission, before continuing) -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showOverlay"
          class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
          @click.self="showOverlay = false"
        >
          <div class="max-w-lg w-full">
            <LandingWorkflowResultPanel
              :steps="workflowSteps"
              :lifecycle-steps="lifecycleSteps"
              :submission-id="submissionId"
              :continue-label="$t('demo.workflow.experienceWorkflow')"
              @close="continueDemo"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public

// ─── Types ──────────────────────────────────────────────────────

type Phase = 'form' | 'submitted' | 'parent1' | 'parent2' | 'caseworker' | 'complete'

interface WorkflowStep {
  id: string
  name: string
  description: string
  status: 'completed' | 'failed' | 'next'
}

// ─── State ──────────────────────────────────────────────────────

const phase = ref<Phase>('form')
const submitting = ref(false)
const processing = ref(false)
const showOverlay = ref(false)
const workflowSteps = ref<WorkflowStep[]>([])
const submissionId = ref('')
const errorMessage = ref('')

const form = ref({
  cpr: '',
  address: '',
  buildingType: '',
  description: '',
})

// ─── Computed ───────────────────────────────────────────────────

const currentStepIndex = computed(() => {
  const map: Record<Phase, number> = { form: 0, submitted: 0, parent1: 1, parent2: 2, caseworker: 3, complete: 3 }
  return map[phase.value]
})

const stepLabels = computed(() => [
  `${t('demo.step.step')} 1: ${t('demo.step.citizen')}`,
  `${t('demo.step.step')} 2: ${t('demo.step.parent1')}`,
  `${t('demo.step.step')} 3: ${t('demo.step.parent2')}`,
  `${t('demo.step.step')} 4: ${t('demo.step.caseworker')}`,
])

const applicationSummary = computed(() => ({
  address: form.value.address || 'Vestergade 12, 8000 Aarhus',
  type: form.value.buildingType || 'Extension',
  description: form.value.description || 'New extension to existing building',
}))

const completedSteps = computed(() => [
  { role: t('demo.step.citizen'), action: t('demo.step.citizenAction') },
  { role: t('demo.step.parent1Name'), action: t('demo.step.parentAction') },
  { role: t('demo.step.parent2Name'), action: t('demo.step.parentAction') },
  { role: t('demo.step.caseworkerName'), action: t('demo.step.caseworkerAction') },
])

const lifecycleSteps: WorkflowStep[] = [
  { id: 'lc_email_p1', name: t('demo.step.emailParent1'), description: t('demo.step.emailParentDesc'), status: 'next' },
  { id: 'lc_email_p2', name: t('demo.step.emailParent2'), description: t('demo.step.emailParentDesc'), status: 'next' },
  { id: 'lc_mitid_p1', name: t('demo.step.mitidParent1'), description: t('demo.step.mitidParentDesc'), status: 'next' },
  { id: 'lc_mitid_p2', name: t('demo.step.mitidParent2'), description: t('demo.step.mitidParentDesc'), status: 'next' },
  { id: 'lc_caseworker', name: t('demo.step.caseworkerAssigned'), description: t('demo.step.caseworkerAssignedDesc'), status: 'next' },
  { id: 'lc_decision', name: t('demo.step.decision'), description: t('demo.step.decisionDesc'), status: 'next' },
]

const buildingTypes = computed(() => [
  { label: t('demo.forms.permit.types.extension'), value: 'extension' },
  { label: t('demo.forms.permit.types.garage'), value: 'garage' },
  { label: t('demo.forms.permit.types.carport'), value: 'carport' },
  { label: t('demo.forms.permit.types.other'), value: 'other' },
])

// ─── Methods ────────────────────────────────────────────────────

function stepBarClass(n: number) {
  const idx = n - 1
  if (idx < currentStepIndex.value) return 'bg-success-500'
  if (idx === currentStepIndex.value) return 'bg-primary-500 animate-pulse'
  return 'bg-neutral-200'
}

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<any>(`${apiBase}/api/webform/parent_request_form/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: {
        data: {
          child_name: form.value.address,
          child_cpr: form.value.cpr.replace(/[^0-9]/g, ''),
          parent1_email: 'demo@aabenforms.dk',
          parent2_email: 'demo@aabenforms.dk',
          parents_together: 'together',
          request_details: `${form.value.buildingType}: ${form.value.description}`,
        },
      },
    })
    submissionId.value = String(res.data?.id || '')
    workflowSteps.value = res.workflow?.steps || []
    phase.value = 'submitted'
    showOverlay.value = true
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Submission failed'
  } finally {
    submitting.value = false
  }
}

function continueDemo() {
  showOverlay.value = false
  phase.value = 'parent1'
}

function advanceWithDelay(nextPhase: Phase) {
  processing.value = true
  setTimeout(() => {
    processing.value = false
    phase.value = nextPhase
  }, 1500)
}

function reset() {
  phase.value = 'form'
  form.value = { cpr: '', address: '', buildingType: '', description: '' }
  workflowSteps.value = []
  submissionId.value = ''
}
</script>

<!-- ─── Sub-components (inline, used only here) ────────────── -->

<script lang="ts">
const RoleBadge = defineComponent({
  props: {
    icon: { type: String, required: true },
    role: { type: String, required: true },
    name: { type: String, required: true },
  },
  template: `
    <div class="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-200">
      <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <svg v-if="icon === 'user'" class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
          <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 0112 0" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
          <path d="M3 7l7-4 7 4v6l-7 4-7-4V7z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-widest text-primary-600">{{ role }}</p>
        <p class="text-sm font-bold text-neutral-900">{{ name }}</p>
      </div>
    </div>
  `,
})

const ApprovalCard = defineComponent({
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    applicationSummary: { type: Object, required: true },
    buttonLabel: { type: String, required: true },
    processing: { type: Boolean, default: false },
  },
  emits: ['approve'],
  template: `
    <div>
      <h3 class="text-base font-bold text-neutral-900 mb-2">{{ title }}</h3>
      <p class="text-sm text-neutral-500 mb-5">{{ description }}</p>
      <div class="bg-white rounded-lg border border-neutral-200 p-4 mb-5 space-y-2">
        <div class="flex justify-between text-xs">
          <span class="text-neutral-500">Address</span>
          <span class="font-medium text-neutral-900">{{ applicationSummary.address }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-neutral-500">Type</span>
          <span class="font-medium text-neutral-900">{{ applicationSummary.type }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-neutral-500">Description</span>
          <span class="font-medium text-neutral-900 text-right max-w-[60%]">{{ applicationSummary.description }}</span>
        </div>
      </div>
      <button
        @click="$emit('approve')"
        :disabled="processing"
        class="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        :class="processing
          ? 'bg-neutral-200 text-neutral-500 cursor-wait'
          : 'bg-primary-600 text-white hover:bg-primary-700'"
      >
        <svg v-if="processing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {{ processing ? 'Processing...' : buttonLabel }}
      </button>
    </div>
  `,
})
</script>

<style scoped>
.fade-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.modal-enter-active { transition: opacity 0.25s ease; }
.modal-enter-active > div { animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@keyframes modalIn {
  from { opacity: 0; transform: translateY(24px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
