<template>
  <div>
    <FdsHeader :solution-title="$t('fds.header.demoSolutionTitle')" :authority-name="$t('demo.hub.authority')" live-badge />

    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-9">
          <h1>{{ $t('demo.hub.heading') }}</h1>
          <p class="font-lead">{{ $t('demo.hub.lead') }}</p>
          <p>{{ $t('demo.hub.body') }}</p>
        </div>
      </div>

      <ul class="row card-row mt-6 demo-hub__cards">
        <li
          v-for="scenario in scenarios"
          :key="scenario.id"
          class="col-12 col-md-6"
          :data-scenario="scenario.id"
        >
          <div class="card" :class="{ 'demo-hub__card--coming': !scenario.available }">
            <div class="card-content">
              <span class="card-subheading">
                <span class="badge" :class="difficultyBadge(scenario.difficulty)">{{ $t(`demo.hub.difficulty.${scenario.difficulty}`) }}</span>
                <span v-if="!scenario.available" class="badge badge-warning ml-2">{{ $t('demo.hub.coming') }}</span>
                <span class="demo-hub__persona ml-2">{{ $t('demo.hub.persona', { name: scenario.persona.name }) }}</span>
              </span>
              <h2 class="card-heading">{{ $t(scenario.titleKey) }}</h2>
              <p v-if="scenario.tags?.length" class="demo-hub__tags">
                <span v-for="tag in scenario.tags" :key="tag" class="tag demo-hub__tag">{{ $t(tag) }}</span>
              </p>
              <p>{{ $t(scenario.storyKey) }}</p>

              <p class="demo-hub__list-heading">{{ $t('demo.hub.fetched') }}</p>
              <ul class="demo-hub__list">
                <li v-for="key in scenario.fetchedKeys" :key="key">{{ $t(key) }}</li>
              </ul>

              <p class="demo-hub__list-heading">{{ $t('demo.hub.typed') }}</p>
              <ul class="demo-hub__list">
                <li v-for="key in scenario.typedKeys" :key="key">{{ $t(key) }}</li>
              </ul>

              <div v-if="scenario.available && enabled" class="card-actions button-group">
                <NuxtLink :to="localePath({ path: scenario.path })" class="button button-secondary">
                  {{ $t('demo.hub.open', { title: $t(scenario.titleKey) }) }}
                </NuxtLink>
              </div>
              <p v-else-if="scenario.available" class="card-actions demo-hub__offline">{{ $t('demo.hub.offline') }}</p>
              <p v-else class="card-actions demo-hub__offline">{{ $t('demo.hub.comingBody') }}</p>
            </div>
          </div>
        </li>
      </ul>

      <FdsAlert
        type="info"
        heading-level="h2"
        :heading="$t('demo.hub.honestHeading')"
        :text="$t('demo.hub.honestBody')"
        paragraph
        class="mt-4"
      />
    </main>

    <FdsFooter :authority-name="$t('demo.hub.authority')" />
  </div>
</template>

<script setup lang="ts">
// /demo: one DKFDS card per guided scenario (composables/scenarios/index.ts).
// The "Demo-kommune" authority name keeps the header from reading
// "ÅbenForms | ÅbenForms" on demo pages.
import { demoScenarios } from '~/composables/scenarios'
import type { DemoDifficulty } from '~/types/demo'

const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()

useHead({ title: t('demo.hub.heading') })

const scenarios = demoScenarios
const enabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))

function difficultyBadge(d: DemoDifficulty): string {
  if (d === 'simple') return 'badge-success'
  if (d === 'medium') return 'badge-info'
  return ''
}
</script>

<style scoped>
.demo-hub__cards {
  list-style: none;
  padding: 0;
}

.demo-hub__persona {
  color: #454545;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
}

.demo-hub__list-heading {
  font-weight: 600;
  margin-bottom: 0.25rem !important;
}

.demo-hub__list {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
}

.demo-hub__list li {
  margin-top: 0;
}

.demo-hub__tags {
  margin: 0 0 0.75rem;
}

/* A label, not a filter button: no pointer or hover change. */
.demo-hub__tag,
.demo-hub__tag:hover {
  cursor: default;
}

.demo-hub__offline {
  color: #5c5c5c;
  font-size: 0.9375rem;
}

.demo-hub__card--coming {
  background: #f5f5f5;
}
</style>
