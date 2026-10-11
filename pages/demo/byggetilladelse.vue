<template>
  <div>
    <FdsHeader :solution-title="$t('fds.header.demoSolutionTitle')" :authority-name="$t('demo.hub.authority')" live-badge />

    <main id="main" tabindex="-1" class="container py-8">
      <template v-if="enabled">
        <NuxtLink :to="localePath({ path: '/demo' })" class="back-link">{{ $t('demo.hub.allDemos') }}</NuxtLink>

        <div class="row">
          <div class="col-12 col-lg-8">
            <h1>{{ $t(scenario.titleKey) }}</h1>
            <p class="font-lead">{{ $t(scenario.introKey) }}</p>
          </div>
        </div>

        <DemoScenarioWizard :config="scenario" class="mt-5" />
      </template>

      <template v-else>
        <div class="row">
          <div class="col-12 col-lg-8">
            <h1>{{ $t('demo.byggetilladelse.disabled.heading') }}</h1>
            <p class="font-lead">{{ $t('demo.byggetilladelse.disabled.body') }}</p>
            <div class="button-group">
              <NuxtLink :to="localePath({ path: '/kontakt' })" class="button button-primary">
                {{ $t('demo.byggetilladelse.disabled.primary') }}
              </NuxtLink>
              <a
                :href="$t('demo.byggetilladelse.disabled.githubUrl')"
                target="_blank"
                rel="noopener"
                class="button button-secondary"
              >
                {{ $t('demo.byggetilladelse.disabled.secondary') }}
              </a>
            </div>
          </div>
        </div>
      </template>
    </main>

    <FdsFooter :authority-name="$t('demo.hub.authority')" />
  </div>
</template>

<script setup lang="ts">
// Byggetilladelse on the guided scenario shell. The flag keeps the page in
// its "we show it live" state on hosts without the mock IdP.
import { byggetilladelseScenario } from '~/composables/scenarios/byggetilladelse'

const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()

const scenario = byggetilladelseScenario
const enabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))

useHead({ title: t(scenario.titleKey) })

const { restoreSession } = useAuth()

onMounted(() => {
  // Hydrate this tab's MitID session (sessionStorage) so a returning visitor
  // (and the callback round-trip) resumes at the right step.
  restoreSession()
})
</script>
