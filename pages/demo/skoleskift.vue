<template>
  <div>
    <FdsHeader :authority-name="$t('demo.hub.authority')" live-badge />

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
              <FdsAlert type="info" :heading="$t('demo.wizard.login.personaHeading')" heading-level="h2" class="mb-5">
                <p class="mb-2">{{ $t('demo.wizard.login.personaBody', { name: 'Lars Andersen' }) }}</p>
                <dl class="demo-skoleskift__creds">
                  <dt>{{ $t('demo.wizard.login.username') }}</dt>
                  <dd><code>lars.andersen</code></dd>
                  <dt>{{ $t('demo.wizard.login.password') }}</dt>
                  <dd><code>test1234</code></dd>
                </dl>
              </FdsAlert>
              <FdsButton variant="primary" @click="loginAsLars">{{ $t('demo.skoleskift.lars.login') }}</FdsButton>
            </template>

            <template v-else>
              <FdsAlert
                v-if="!isLars"
                type="warning"
                :heading="$t('demo.skoleskift.lars.wrongPersonaHeading')"
                :text="$t('demo.skoleskift.lars.wrongPersonaBody', { name: user?.name || '' })"
                class="mb-5"
              />
              <FdsAlert
                v-else
                type="info"
                role="status"
                :heading="$t('demo.skoleskift.lars.waitingHeading')"
                :text="$t('demo.skoleskift.lars.waitingBody')"
                class="mb-5"
              />

              <h2>{{ $t('demo.wizard.letter.heading') }}</h2>
              <DemoDigitalPostInbox :letters="larsLetters" :loading="larsLoading" @refresh="loadLarsInbox" />

              <div class="button-group mt-6">
                <FdsButton variant="secondary" @click="restart">{{ $t('demo.skoleskift.lars.restart') }}</FdsButton>
              </div>
            </template>
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

        <DemoScenarioWizard :config="scenario" class="mt-5" />

        <section
          v-if="wizardComplete"
          class="row mt-8"
          aria-labelledby="demo-skoleskift-cosign"
        >
          <div class="col-12 col-lg-8">
            <h2 id="demo-skoleskift-cosign">{{ $t('demo.skoleskift.cosign.heading') }}</h2>
            <FdsAlert
              type="info"
              :heading="$t('demo.skoleskift.cosign.waitingHeading')"
              :text="$t('demo.skoleskift.cosign.waitingBody')"
              class="mb-5"
            />
            <p>{{ $t('demo.skoleskift.cosign.body') }}</p>
            <FdsButton variant="primary" @click="continueAsLars">{{ $t('demo.skoleskift.cosign.continue') }}</FdsButton>
          </div>
        </section>
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
const isLars = computed(() => /lars/i.test(String(user.value?.name ?? '')))
const LARS_RETURN = '/demo/skoleskift?som=lars'
const WIZARD_STORAGE_KEY = `aabenforms-demo:${scenario.id}`

useHead({ title: t(scenario.titleKey) })

// --- Freja: show the co-sign hand-over once the wizard reached step 5 -----

// The wizard keeps its state to itself; it persists the phase to
// sessionStorage, which is the only signal the page can read.
const wizardComplete = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

function readWizardPhase() {
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY)
    wizardComplete.value = raw ? JSON.parse(raw)?.phase === 'complete' : false
  }
  catch {
    wizardComplete.value = false
  }
}

async function continueAsLars() {
  await userStore.logout()
  login(LARS_RETURN)
}

// --- Lars: his own Digital Post ---------------------------------------------

const larsLetters = ref<DigitalPostLetter[]>([])
const larsLoading = ref(false)

async function loadLarsInbox() {
  if (!sessionId.value) return
  larsLoading.value = true
  try {
    const res = await $fetch<{ data?: DigitalPostLetter[] }>(
      `${config.public.apiBase}/api/digital-post/recent?session=${encodeURIComponent(sessionId.value)}&limit=5`,
      { headers: { Accept: 'application/json' } },
    )
    larsLetters.value = res.data ?? []
  }
  catch (e) {
    console.error('Inbox fetch failed:', e)
  }
  finally {
    larsLoading.value = false
  }
}

function loginAsLars() {
  login(LARS_RETURN)
}

async function restart() {
  await userStore.logout()
  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY)
  }
  catch { /* private mode */ }
  await navigateTo(localePath({ path: '/demo/skoleskift' }))
}

watch([larsMode, isAuthenticated], ([lars, authed]) => {
  if (lars && authed) loadLarsInbox()
})

onMounted(() => {
  // Hydrate any prior MitID session from localStorage so a returning visitor
  // (and the callback round-trip) resumes at the right step.
  restoreSession()
  if (larsMode.value && isAuthenticated.value) loadLarsInbox()
  readWizardPhase()
  pollTimer = setInterval(readWizardPhase, 800)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
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

.demo-skoleskift__creds {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.2rem 1.2rem;
  margin: 0;
}

.demo-skoleskift__creds dd {
  margin: 0;
}
</style>
