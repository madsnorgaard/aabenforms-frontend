<template>
  <div>
    <FdsHeader :solution-title="$t('fds.header.demoSolutionTitle')" :authority-name="$t('demo.hub.authority')" live-badge />

    <main id="main" tabindex="-1" class="container py-8">
      <template v-if="!enabled">
        <div class="row">
          <div class="col-12 col-lg-8">
            <h1>{{ $t('demo.skoleskift.disabled.heading') }}</h1>
            <p class="font-lead">{{ $t('demo.skoleskift.disabled.body') }}</p>
            <div class="button-group">
              <NuxtLink :to="localePath({ path: '/kontakt' })" class="button button-primary">
                {{ $t('demo.skoleskift.disabled.primary') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>

      <!-- Persona 2: Lars reads his Digital Post and co-signs. -->
      <template v-else-if="larsMode">
        <NuxtLink :to="localePath({ path: '/demo' })" class="back-link">{{ $t('demo.hub.allDemos') }}</NuxtLink>
        <div class="row">
          <div class="col-12 col-lg-8">
            <p class="demo-skoleskift__eyebrow">{{ $t('demo.skoleskift.lars.eyebrow') }}</p>
            <h1>{{ $t('demo.skoleskift.lars.heading') }}</h1>
            <p class="font-lead">{{ $t('demo.skoleskift.lars.intro') }}</p>

            <template v-if="!isAuthenticated">
              <DemoPersonaLogin
                name="Lars Andersen"
                :story="$t('demo.skoleskift.lars.loginStory')"
                password="test1234"
                heading-level="h2"
                @login="loginAsLars"
              />
            </template>

            <template v-else>
              <FdsAlert
                v-if="!isLars"
                type="warning"
                :heading="$t('demo.skoleskift.lars.wrongPersonaHeading')"
                :text="$t('demo.skoleskift.lars.wrongPersonaBody', { name: user?.name || '' })"
                class="mb-5"
              />
              <template v-else-if="receipt">
                <FdsAlert
                  v-if="justSigned && receipt.stage !== 'decided'"
                  type="success"
                  role="status"
                  :heading="$t('demo.skoleskift.receipt.successHeading')"
                  :text="$t('demo.skoleskift.receipt.successBody')"
                  class="mb-5"
                  data-testid="skoleskift-cosign-success"
                />

                <section v-if="receipt.stage === 'decided'" class="mb-6" data-testid="skoleskift-ending">
                  <FdsAlert
                    type="success"
                    heading-level="h2"
                    :heading="$t('demo.skoleskift.ending.heading')"
                    :text="receipt.decision_letters_sent_to.length
                      ? $t('demo.skoleskift.ending.body', { names: joinNames(receipt.decision_letters_sent_to) })
                      : $t('demo.skoleskift.ending.pending')"
                    role="status"
                  />
                  <p v-if="receipt.klagefrist" class="mt-4" data-testid="skoleskift-klagefrist">
                    <strong>{{ $t('demo.skoleskift.ending.klagefrist') }}:</strong>
                    {{ $t('demo.skoleskift.ending.klagefristBody', { date: formatDate(receipt.klagefrist) }) }}
                  </p>
                </section>

                <section aria-labelledby="skoleskift-receipt" data-testid="skoleskift-receipt">
                  <h2 id="skoleskift-receipt">{{ $t('demo.skoleskift.receipt.heading') }}</h2>
                  <dl class="demo-skoleskift__receipt">
                    <dt>{{ $t('demo.skoleskift.receipt.caseNumber') }}</dt>
                    <dd data-testid="skoleskift-receipt-case">{{ receipt.case_id ? `#${receipt.case_id}` : '-' }}</dd>
                    <dt>{{ $t('demo.skoleskift.receipt.status') }}</dt>
                    <dd data-testid="skoleskift-receipt-status">{{ statusText }}</dd>
                    <dt>{{ $t('demo.skoleskift.receipt.child') }}</dt>
                    <dd>{{ receipt.child_name }}</dd>
                    <dt>{{ $t('demo.skoleskift.receipt.schools') }}</dt>
                    <dd>{{ $t('demo.skoleskift.receipt.schoolsValue', { from: receipt.current_school, to: receipt.target_school }) }}</dd>
                    <dt>{{ $t('demo.skoleskift.receipt.signedBy') }}</dt>
                    <dd data-testid="skoleskift-receipt-signed">{{ joinNames(receipt.signed_by) }}</dd>
                  </dl>
                </section>

                <section v-if="receipt.stage === 'awaiting_decision'" aria-labelledby="skoleskift-leader-next" class="mt-6">
                  <h2 id="skoleskift-leader-next">{{ $t('demo.skoleskift.leaderNext.heading') }}</h2>
                  <p>{{ $t('demo.skoleskift.leaderNext.body') }}</p>
                  <NuxtLink :to="localePath({ path: '/demo/skoleskift', query: { som: 'skoleleder' } })" class="button button-primary" data-testid="skoleskift-continue-leader">
                    {{ $t('demo.skoleskift.leaderNext.continue') }}
                  </NuxtLink>
                </section>
              </template>
              <FdsAlert
                v-else
                type="info"
                role="status"
                :heading="$t('demo.skoleskift.lars.waitingHeading')"
                :text="$t('demo.skoleskift.lars.waitingBody')"
                class="mb-5"
              />
              <FdsAlert v-if="receiptError" type="error" :text="$t('demo.skoleskift.receipt.loadError')" class="mb-5" />

              <h2 class="mt-6">{{ receipt?.stage === 'decided' ? $t('demo.skoleskift.ending.inboxHeading') : $t('demo.wizard.letter.heading') }}</h2>
              <DemoDigitalPostInbox :letters="larsLetters" :loading="larsLoading" @refresh="loadLarsInbox" />

              <div class="button-group mt-6">
                <FdsButton :variant="receipt?.stage === 'decided' ? 'primary' : 'secondary'" data-testid="skoleskift-restart" @click="restart">
                  {{ receipt?.stage === 'decided' ? $t('demo.skoleskift.ending.restart') : $t('demo.skoleskift.lars.restart') }}
                </FdsButton>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Persona 3: the school leader decides in the municipality's case handling. -->
      <template v-else-if="leaderMode">
        <NuxtLink :to="localePath({ path: '/demo/skoleskift', query: { som: 'lars' } })" class="back-link">{{ $t('demo.skoleskift.leader.back') }}</NuxtLink>
        <div class="row">
          <div class="col-12 col-lg-8">
            <p class="demo-skoleskift__eyebrow">{{ $t('demo.skoleskift.leader.eyebrow') }}</p>
            <h1>{{ $t('demo.skoleskift.leader.heading') }}</h1>
            <p class="font-lead">{{ $t('demo.skoleskift.leader.intro') }}</p>
            <p>{{ $t('demo.skoleskift.leader.story') }}</p>
          </div>
        </div>
        <DemoWorkMailbox
          class="mt-5"
          :case-id="leaderCaseId"
          :link="leaderLoginUrl"
          :account="$t('demo.skoleskift.leader.mailbox')"
        />
        <div class="row">
          <div class="col-12 col-lg-8">
            <FdsAlert
              type="info"
              class="mt-5"
              :heading="$t('demo.skoleskift.leader.staffLoginHeading')"
              :text="$t('demo.skoleskift.leader.staffLogin', { username: 'skoleleder' })"
              data-testid="skoleskift-leader-login"
            />
          </div>
        </div>
      </template>

      <!-- Persona 1: Freja applies on the guided wizard. -->
      <template v-else>
        <NuxtLink :to="localePath({ path: '/demo' })" class="back-link">{{ $t('demo.hub.allDemos') }}</NuxtLink>

        <div class="row">
          <div class="col-12 col-lg-8">
            <h1>{{ $t(scenario.titleKey) }}</h1>
            <p class="font-lead">{{ $t(scenario.introKey) }}</p>
          </div>
        </div>

        <DemoScenarioWizard :config="scenario" class="mt-5">
          <template #afterOutcome>
            <section aria-labelledby="demo-skoleskift-cosign" data-testid="demo-skoleskift-cosign">
              <h3 id="demo-skoleskift-cosign">{{ $t('demo.skoleskift.cosign.heading') }}</h3>
              <p>{{ $t('demo.skoleskift.cosign.body') }}</p>
              <FdsButton variant="primary" @click="continueAsLars">{{ $t('demo.skoleskift.cosign.continue') }}</FdsButton>
            </section>
          </template>
        </DemoScenarioWizard>
      </template>
    </main>

    <FdsFooter :authority-name="$t('demo.hub.authority')" />
  </div>
</template>

<script setup lang="ts">
// Skoleskift med to forældre on the guided scenario shell, plus a second
// persona view (?som=lars). The wizard has one persona, and the co-sign
// invitation lands in Lars' Digital Post, so the page switches persona:
// Freja is logged out, Lars logs in with MitID, reads the invitation in his
// own inbox and follows its link to the backend's /parent-approval route.
import type { DigitalPostLetter } from '~/types/demo'
import { skoleskiftScenario } from '~/composables/scenarios/skoleskift'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const config = useRuntimeConfig()
const userStore = useUserStore()
const { user, sessionId, isAuthenticated, login, restoreSession } = useAuth()

const scenario = skoleskiftScenario
const enabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))
const larsMode = computed(() => route.query.som === 'lars')
const leaderMode = computed(() => route.query.som === 'skoleleder')
// Only a display hint for the success alert; the receipt itself comes from
// the backend, authorised by Lars' own MitID session.
const justSigned = computed(() => route.query.medunderskrevet === '1')
const isLars = computed(() => /lars/i.test(String(user.value?.name ?? '')))
const LARS_RETURN = '/demo/skoleskift?som=lars'
const WIZARD_STORAGE_KEY = `aabenforms-demo:${scenario.id}`

useHead({ title: t(scenario.titleKey) })

// --- Freja: the co-sign hand-over sits in the wizard's afterOutcome slot ---

async function continueAsLars() {
  // Full logout: revoke Freja's session AND end her IdP (mock-MitID) session,
  // otherwise Keycloak re-authenticates Freja even with a login_hint for Lars.
  // Lands on Lars' own one-click login card (?som=lars).
  await userStore.logout({ returnPath: LARS_RETURN })
}

// --- Lars: his receipt, authorised by his own MitID session ---------------

interface SkoleskiftReceipt {
  case_id: number | null
  /** Unix time the case was submitted; letters before it belong to older runs. */
  submitted: number
  child_name: string
  current_school: string
  target_school: string
  stage: 'awaiting_decision' | 'decided' | 'in_progress'
  afgoerelse_type: 'medhold' | 'afslag' | null
  klagefrist: string | null
  signed_by: string[]
  decision_letters_sent_to: string[]
}

const receipt = ref<SkoleskiftReceipt | null>(null)
const receiptError = ref(false)

async function loadReceipt() {
  if (!sessionId.value) return
  receiptError.value = false
  try {
    // The MitID session travels in the Authorization header, never the URL.
    const res = await $fetch<{ data: SkoleskiftReceipt }>(`${config.public.apiBase}/api/skoleskift/medunderskrift`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionId.value}` },
    })
    receipt.value = res.data
    rememberCaseId(res.data.case_id)
  }
  catch (e: any) {
    receipt.value = null
    // 404: Lars has not co-signed yet - the waiting view is the right one.
    if (e?.response?.status !== 404) receiptError.value = true
  }
}

const statusText = computed(() => {
  const r = receipt.value
  if (!r) return ''
  if (r.stage === 'decided' && r.afgoerelse_type) return t(`demo.skoleskift.receipt.decision.${r.afgoerelse_type}`)
  return t(`demo.skoleskift.receipt.stage.${r.stage}`)
})

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} ${t('demo.skoleskift.receipt.and')} ${names[names.length - 1]}`
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- School leader: staff login on the backend (Drupal account, not MitID) --

// The case number for the leader's work mail. Display only, never used to
// authorise anything: the staff login decides what the leader may see.
const LEADER_CASE_KEY = 'aabenforms-demo:skoleskift:case'
const leaderCaseId = ref<number | null>(null)

function rememberCaseId(id: number | null) {
  try {
    if (id) sessionStorage.setItem(LEADER_CASE_KEY, String(id))
  }
  catch { /* private mode */ }
}

function readCaseId(): number | null {
  try {
    const id = Number(sessionStorage.getItem(LEADER_CASE_KEY))
    return Number.isInteger(id) && id > 0 ? id : null
  }
  catch {
    return null
  }
}

// Fixed backend paths; Drupal only follows a local destination.
const leaderLoginUrl = computed(() => `${config.public.apiBase}/da/user/login?destination=${encodeURIComponent('/da/sagsbehandling/skoleskift')}`)

// --- Lars: his own Digital Post ---------------------------------------------

const larsInbox = ref<DigitalPostLetter[]>([])
const larsLoading = ref(false)
const CASE_LETTER = /medunderskrift|afgørelse: skoleskift/i

// Only this case's letters (invitation and decision), never the rest of
// Lars' mailbox or earlier demo runs. With a receipt the case's submit time
// is known; before Lars has co-signed only the newest invitation is his.
const larsLetters = computed<DigitalPostLetter[]>(() => {
  const caseLetters = larsInbox.value.filter((l) => CASE_LETTER.test(l.subject))
  const submitted = receipt.value?.submitted
  if (submitted) return caseLetters.filter((l) => l.created >= submitted - 5)
  const invitation = caseLetters.find((l) => /medunderskrift/i.test(l.subject))
  return invitation ? [invitation] : []
})

async function loadLarsInbox() {
  if (!sessionId.value) return
  larsLoading.value = true
  try {
    const res = await $fetch<{ data?: DigitalPostLetter[] }>(
      `${config.public.apiBase}/api/digital-post/recent?limit=10`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${sessionId.value}` } },
    )
    // Newest first, as the backend orders them.
    larsInbox.value = res.data ?? []
  }
  catch (e) {
    console.error('Inbox fetch failed:', e)
  }
  finally {
    larsLoading.value = false
  }
}

function loginAsLars() {
  login(LARS_RETURN, { fresh: true, loginHint: 'lars.andersen' })
}

async function restart() {
  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY)
    sessionStorage.removeItem(LEADER_CASE_KEY)
  }
  catch { /* private mode */ }
  await userStore.logout({ returnPath: localePath({ path: '/demo/skoleskift' }) })
}

watch([larsMode, isAuthenticated, isLars], ([lars, authed, okLars]) => {
  if (lars && authed && okLars) {
    loadLarsInbox()
    loadReceipt()
  }
})

// Someone other than Lars on Lars' page (e.g. Freja still signed in): end that
// session fully and come back to Lars' login card instead of asking the
// visitor to open a private window. Once per page load, so a failed logout
// falls back to the warning instead of looping.
let autoSwitched = false
watch([larsMode, isAuthenticated, isLars], ([lars, authed, okLars]) => {
  if (import.meta.client && lars && authed && !okLars && !autoSwitched) {
    autoSwitched = true
    userStore.logout({ returnPath: LARS_RETURN })
  }
}, { immediate: true })

onMounted(() => {
  // Hydrate this tab's MitID session (sessionStorage) so a returning visitor
  // (and the callback round-trip) resumes at the right step.
  restoreSession()
  leaderCaseId.value = readCaseId()
  if (larsMode.value && isAuthenticated.value && isLars.value) {
    loadLarsInbox()
    loadReceipt()
  }
})
</script>

<style scoped>
.demo-skoleskift__eyebrow {
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}

.demo-skoleskift__receipt {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.8rem 2.4rem;
  margin: 0;
}

.demo-skoleskift__receipt dt {
  font-weight: 600;
}

.demo-skoleskift__receipt dd {
  margin: 0;
}

@media (max-width: 575px) {
  .demo-skoleskift__receipt {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }

  .demo-skoleskift__receipt dd {
    margin-bottom: 0.8rem;
  }
}
</style>
