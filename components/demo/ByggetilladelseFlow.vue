<template>
  <div class="space-y-8">
    <DemoMockIdPBanner />

    <!-- Phase indicator strip -->
    <div class="grid grid-cols-4 gap-2">
      <div
        v-for="(stepKey, idx) in phaseSteps"
        :key="stepKey"
        class="space-y-1.5"
      >
        <div
          class="h-1.5 rounded-full transition-all duration-500"
          :class="phaseBarClass(idx)"
        />
        <p
          class="text-[10px] font-semibold tracking-widest uppercase"
          :class="idx <= currentPhaseIdx ? 'text-neutral-900' : 'text-neutral-400'"
        >
          {{ $t(`demo.byggetilladelse.steps.${stepKey}`) }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
      <!-- Main column -->
      <div class="space-y-6 min-w-0">
        <Transition name="phase" mode="out-in">
          <!-- ─── Idle: kickoff ─── -->
          <section v-if="phase === 'idle'" key="idle" class="rounded-2xl border border-neutral-200 bg-white p-8">
            <h2 class="text-2xl font-bold text-neutral-900 tracking-tight mb-3">
              {{ $t('demo.byggetilladelse.auth.heading') }}
            </h2>
            <p class="text-neutral-600 leading-relaxed mb-6 max-w-prose">
              {{ $t('demo.byggetilladelse.auth.body') }}
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                @click="kickoff"
                class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-sm"
              >
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="2" y="3" width="12" height="10" rx="2" />
                  <path d="M5 13v1.5M11 13v1.5M2 7h12" stroke-linecap="round" />
                </svg>
                {{ $t('demo.byggetilladelse.auth.cta') }}
              </button>
              <span class="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <span class="w-1.5 h-1.5 rounded-full bg-success-500" />
                {{ $t('demo.byggetilladelse.kickoff.runtime') }}
              </span>
            </div>
          </section>

          <!-- ─── Callback loading ─── -->
          <section v-else-if="phase === 'callback-loading'" key="callback" class="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
            <div class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-primary-50 mb-4">
              <svg class="w-6 h-6 text-primary-600 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.2" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
            </div>
            <p class="text-sm text-neutral-700 font-medium">{{ $t('demo.byggetilladelse.auth.callbackProcessing') }}</p>
          </section>

          <!-- ─── Prefilled form ─── -->
          <section v-else-if="phase === 'prefilled-form' || phase === 'submitting'" key="form" class="rounded-2xl border border-neutral-200 bg-white p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-neutral-900 tracking-tight mb-1.5">
                  {{ $t('demo.byggetilladelse.form.heading') }}
                </h2>
                <p class="text-sm text-neutral-500 max-w-prose">
                  {{ $t('demo.byggetilladelse.form.body') }}
                </p>
              </div>
              <button
                type="button"
                @click="logoutAndReset"
                class="text-xs font-semibold text-neutral-500 hover:text-neutral-800 flex-shrink-0"
              >
                {{ $t('demo.byggetilladelse.form.logout') }}
              </button>
            </div>

            <div v-if="user" class="mb-5 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {{ initials(user.name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-neutral-900 truncate">{{ user.name }}</p>
                <p class="text-xs text-neutral-500 truncate">
                  {{ user.email }}
                  <template v-if="user.assurance_level">
                    · {{ $t('demo.byggetilladelse.assurance.label') }}: {{ assuranceLabel(user.assurance_level) }}
                  </template>
                </p>
              </div>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <DemoPrefilledField
                :label="$t('demo.byggetilladelse.form.fields.cpr')"
                :value="maskedCpr"
                :prefilled="true"
                read-only
                :editable="false"
              />
              <DemoPrefilledField
                :label="$t('demo.byggetilladelse.form.fields.applicantName')"
                :value="user?.name || ''"
                :prefilled="true"
                read-only
                :editable="false"
              />
              <DemoPrefilledField
                :label="$t('demo.byggetilladelse.form.fields.address')"
                :value="effectiveAddress"
                :placeholder="$t('demo.byggetilladelse.form.fields.addressPlaceholder')"
                :prefilled="addressIsPrefilled && !editingAddress"
                :manual="!addressIsPrefilled || editingAddress"
                :read-only="!editingAddress && addressIsPrefilled"
                :editable="addressIsPrefilled"
                @edit="startOverride"
                @lock="lockAddress"
                @update:value="(v: string) => addressOverride = v"
              />

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-neutral-700 tracking-wide uppercase">
                  {{ $t('demo.byggetilladelse.form.fields.description') }}
                </label>
                <textarea
                  v-model="projectDescription"
                  :placeholder="$t('demo.byggetilladelse.form.fields.descriptionPlaceholder')"
                  rows="4"
                  class="w-full px-4 py-3 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all resize-y"
                />
              </div>

              <div v-if="error === 'validation'" class="px-4 py-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">
                {{ $t('demo.byggetilladelse.form.validation') }}
              </div>
              <div v-else-if="error" class="px-4 py-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">
                {{ error }}
              </div>

              <button
                type="submit"
                :disabled="phase === 'submitting'"
                class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-secondary-500 text-white hover:bg-secondary-600 disabled:opacity-60 disabled:cursor-wait transition-all"
              >
                <svg
                  v-if="phase === 'submitting'"
                  class="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24" fill="none" aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
                {{ phase === 'submitting' ? $t('demo.byggetilladelse.form.submitting') : $t('demo.byggetilladelse.form.submit') }}
                <svg v-if="phase !== 'submitting'" class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M3 8h10m-4-4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </form>
          </section>

          <!-- ─── Workflow running ─── -->
          <section v-else-if="phase === 'workflow-running'" key="workflow" class="rounded-2xl border border-neutral-200 bg-white p-8">
            <h2 class="text-xl font-bold text-neutral-900 tracking-tight mb-2">
              {{ $t('demo.byggetilladelse.workflow.heading') }}
            </h2>
            <p class="text-sm text-neutral-500 mb-6 max-w-prose">
              {{ $t('demo.byggetilladelse.workflow.body') }}
            </p>

            <ol v-if="workflowSteps.length > 0" class="space-y-3">
              <li
                v-for="(step, idx) in workflowSteps"
                :key="step.id"
                class="flex items-start gap-4 p-4 rounded-xl border transition-all duration-500"
                :class="stepCardClass(idx, step)"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  :class="stepIndicatorClass(idx, step)"
                >
                  <svg v-if="idx < animatedStepIndex || (idx === animatedStepIndex && step.status === 'completed')" class="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M3 8.5l3 3L13 4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else-if="idx === animatedStepIndex" class="w-4 h-4 text-white animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-opacity="0.35" />
                    <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                  <span v-else class="text-xs font-bold text-neutral-500">{{ idx + 1 }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-neutral-900">{{ step.name }}</p>
                  <p v-if="step.description" class="text-xs text-neutral-500 mt-0.5">{{ step.description }}</p>
                  <p v-if="step.error" class="text-xs text-error-600 mt-1">{{ step.error }}</p>
                </div>
              </li>
            </ol>
            <p v-else class="text-sm text-neutral-500">{{ $t('demo.byggetilladelse.workflow.noSteps') }}</p>
          </section>

          <!-- ─── Fetching letter / complete ─── -->
          <section
            v-else-if="phase === 'fetching-letter' || phase === 'complete'"
            key="inbox"
            class="space-y-6"
          >
            <div class="rounded-2xl border border-neutral-200 bg-white p-8">
              <div class="flex items-start gap-4 mb-6">
                <div class="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-success-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M4 10.5l3.5 3.5L16 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-neutral-900 tracking-tight mb-1">
                    {{ phase === 'complete' ? $t('demo.byggetilladelse.complete.heading') : $t('demo.byggetilladelse.inbox.heading') }}
                  </h2>
                  <p class="text-sm text-neutral-500 max-w-prose">
                    {{ phase === 'complete' ? $t('demo.byggetilladelse.complete.body') : $t('demo.byggetilladelse.inbox.body') }}
                  </p>
                </div>
              </div>

              <DemoDigitalPostInbox
                :letters="inboxLetters"
                :loading="inboxLoading"
                @refresh="refreshInbox"
              />
            </div>

            <!-- High-intent contact CTA - the user just watched the wow
                 moment, this is the moment to ask. Auto-scrolled into
                 viewport when phase becomes 'complete'. -->
            <div
              v-if="phase === 'complete'"
              ref="contactCtaRef"
              class="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-neutral-100 p-8 lg:p-10 shadow-xl"
            >
              <p class="text-[11px] font-bold tracking-widest uppercase text-secondary-400 mb-3">
                {{ $t('demo.byggetilladelse.contactCta.eyebrow') }}
              </p>
              <h3 class="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-3">
                {{ $t('demo.byggetilladelse.contactCta.heading') }}
              </h3>
              <p class="text-base text-neutral-300 leading-relaxed mb-6 max-w-prose">
                {{ $t('demo.byggetilladelse.contactCta.body') }}
              </p>
              <div class="flex flex-wrap items-center gap-4">
                <NuxtLink
                  to="/kontakt"
                  class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-secondary-500 text-white hover:bg-secondary-600 transition-all shadow-lg"
                >
                  {{ $t('demo.byggetilladelse.contactCta.primary') }}
                  <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path d="M3 8h10m-4-4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </NuxtLink>
                <a
                  :href="`mailto:${$t('demo.byggetilladelse.contactCta.secondaryEmail')}?subject=AabenForms POC`"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  {{ $t('demo.byggetilladelse.contactCta.secondary') }} →
                </a>
              </div>
            </div>

            <div v-if="phase === 'complete'" class="flex flex-wrap gap-3">
              <button
                type="button"
                @click="reset"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 transition-all"
              >
                {{ $t('demo.byggetilladelse.complete.runAgain') }}
              </button>
              <NuxtLink
                to="/"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-all"
              >
                {{ $t('demo.byggetilladelse.complete.gotoLanding') }}
              </NuxtLink>
            </div>
          </section>
        </Transition>
      </div>

      <!-- Sidebar: behind-the-scenes commentary -->
      <aside class="lg:sticky lg:top-24 space-y-4">
        <div class="rounded-2xl border border-neutral-200 bg-neutral-900 text-neutral-100 p-5">
          <p class="text-[10px] font-bold tracking-widest uppercase text-secondary-400 mb-3">
            {{ $t('demo.byggetilladelse.commentary.title') }}
          </p>
          <p class="text-sm leading-relaxed text-neutral-200">
            {{ commentaryForPhase }}
          </p>
        </div>
        <DemoCapabilityBadgeRow />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const {
  phase,
  projectDescription,
  addressOverride,
  editingAddress,
  workflowSteps,
  animatedStepIndex,
  inboxLetters,
  inboxLoading,
  error,
  user,
  isAuthenticated,
  effectiveAddress,
  addressIsPrefilled,
  kickoff,
  syncFromAuth,
  reset,
  logoutAndReset,
  startOverride,
  lockAddress,
  submit,
  refreshInbox,
} = useByggetilladelseDemo()

const phaseSteps = ['auth', 'form', 'workflow', 'inbox'] as const

const phaseToIdx: Record<string, number> = {
  'idle': 0,
  'callback-loading': 0,
  'prefilled-form': 1,
  'submitting': 1,
  'workflow-running': 2,
  'fetching-letter': 3,
  'complete': 3,
}
const currentPhaseIdx = computed(() => phaseToIdx[phase.value] ?? 0)

const maskedCpr = computed(() => {
  const c = user.value?.cpr ?? ''
  if (c.length < 6) return c
  return `${c.slice(0, 6)}-****`
})

function phaseBarClass(idx: number): string {
  if (idx < currentPhaseIdx.value) return 'bg-success-500'
  if (idx === currentPhaseIdx.value) return 'bg-secondary-500'
  return 'bg-neutral-200'
}

function stepCardClass(idx: number, _step: any): string {
  if (idx < animatedStepIndex.value) return 'bg-success-50/40 border-success-100'
  if (idx === animatedStepIndex.value) return 'bg-primary-50 border-primary-200 shadow-sm'
  return 'bg-neutral-50/40 border-neutral-100 opacity-60'
}

function stepIndicatorClass(idx: number, step: any): string {
  if (idx < animatedStepIndex.value || (idx === animatedStepIndex.value && step.status === 'completed')) {
    return 'bg-success-500'
  }
  if (idx === animatedStepIndex.value) return 'bg-primary-500'
  return 'bg-neutral-200'
}

const commentaryForPhase = computed(() => {
  if (phase.value === 'idle' || phase.value === 'callback-loading') return t('demo.byggetilladelse.commentary.auth')
  if (phase.value === 'prefilled-form' || phase.value === 'submitting') return t('demo.byggetilladelse.commentary.form')
  if (phase.value === 'workflow-running') return t('demo.byggetilladelse.commentary.workflow')
  return t('demo.byggetilladelse.commentary.inbox')
})

function assuranceLabel(acr: string): string {
  if (acr.endsWith('high')) return t('demo.byggetilladelse.assurance.high')
  if (acr.endsWith('substantial')) return t('demo.byggetilladelse.assurance.substantial')
  if (acr.endsWith('low')) return t('demo.byggetilladelse.assurance.low')
  return acr
}

function initials(name: string): string {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')
}

async function handleSubmit() {
  await submit()
}

const contactCtaRef = ref<HTMLElement | null>(null)

onMounted(() => {
  syncFromAuth()
})

watch(isAuthenticated, () => {
  syncFromAuth()
})

// When the flow completes, slide the contact CTA into view so visitors
// don't have to scroll to find it - the wow-moment is the highest-intent
// instant in the funnel, we shouldn't waste it.
watch(phase, async (next) => {
  if (next === 'complete') {
    await nextTick()
    contactCtaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})
</script>

<style scoped>
.phase-enter-active { transition: all 320ms cubic-bezier(0.16, 1, 0.3, 1); }
.phase-leave-active { transition: all 200ms ease; }
.phase-enter-from { opacity: 0; transform: translateY(12px); }
.phase-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
