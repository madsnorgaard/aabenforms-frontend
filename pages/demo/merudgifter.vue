<template>
  <div>
    <FdsHeader :authority-name="$t('demo.hub.authority')" live-badge />

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
            <h1>{{ $t('demo.merudgifter.disabled.heading') }}</h1>
            <p class="font-lead">{{ $t('demo.merudgifter.disabled.body') }}</p>
            <div class="button-group">
              <NuxtLink :to="localePath({ path: '/kontakt' })" class="button button-primary">
                {{ $t('demo.merudgifter.disabled.primary') }}
              </NuxtLink>
              <a
                :href="$t('demo.merudgifter.disabled.githubUrl')"
                target="_blank"
                rel="noopener"
                class="button button-secondary"
              >
                {{ $t('demo.merudgifter.disabled.secondary') }}
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
// Merudgifter (SEL §41) on the guided scenario shell. Shares the demo
// flag with byggetilladelse: both need the mock IdP.
import { merudgifterScenario } from '~/composables/scenarios/merudgifter'

const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()

const scenario = merudgifterScenario
const enabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))

useHead({ title: t(scenario.titleKey) })

const { restoreSession } = useAuth()

onMounted(() => {
  // Hydrate any prior MitID session from localStorage so a returning visitor
  // (and the callback round-trip) resumes at the right step.
  restoreSession()
})
</script>
