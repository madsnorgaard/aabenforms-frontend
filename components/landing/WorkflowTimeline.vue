<template>
  <section class="landing-section landing-section--gray bg-alternative" aria-labelledby="landing-timeline-heading">
    <div class="container">
      <div class="row">
        <div class="col-12 col-lg-8">
          <p class="subheading mb-3">
            {{ $t('workflowDemo.example.title') }}
          </p>
          <h2 id="landing-timeline-heading" class="h1 mt-0 mb-5">
            {{ $t('workflowDemo.title') }}
          </h2>
          <p class="font-lead mt-0 mb-7">
            {{ $t('workflowDemo.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Timeline: an ordered list of DKFDS cards on a plain gray rail. -->
      <ol class="nobullet-list landing-timeline">
        <li
          v-for="(step, index) in steps"
          :key="step.actorKey"
          class="landing-timeline__item"
        >
          <span class="landing-timeline__node" aria-hidden="true">{{ index + 1 }}</span>
          <div class="card collapsed-height mb-0">
            <div class="card-content">
              <h3 class="h4 mt-0 mb-2">
                <span class="sr-only">{{ $t('workflowDemo.stepSr', { n: index + 1 }) }} </span>{{ $t(step.actorKey) }}
              </h3>
              <p class="landing-timeline__role">{{ $t(step.roleKey) }}</p>
              <p>{{ $t(step.actionKey) }}</p>
              <p v-if="step.integrations" class="landing-timeline__badges">
                <span
                  v-for="integration in step.integrations"
                  :key="integration"
                  class="badge"
                >{{ $t(`workflowDemo.integrations.${integration}`) }}</span>
              </p>
            </div>
          </div>
        </li>
      </ol>

      <!-- ECA summary -->
      <div class="card collapsed-height mt-8 mb-0 landing-eca">
        <div class="card-content">
          <h3 class="h4 mt-0 mb-4">
            {{ $t('workflowDemo.eca.title') }}
          </h3>
          <ul class="nobullet-list landing-eca__list">
            <li v-for="benefit in ecaBenefits" :key="benefit">
              <svg class="icon-svg landing-eca__icon" focusable="false" aria-hidden="true"><use href="#check" /></svg>
              <span>{{ $t(`workflowDemo.eca.benefits.${benefit}`) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    actorKey: 'workflowDemo.steps.citizen.actor',
    roleKey: 'workflowDemo.steps.citizen.role',
    actionKey: 'workflowDemo.steps.citizen.action',
    integrations: ['mitid', 'cpr', 'address'],
  },
  {
    actorKey: 'workflowDemo.steps.caseworker.actor',
    roleKey: 'workflowDemo.steps.caseworker.role',
    actionKey: 'workflowDemo.steps.caseworker.action',
    integrations: ['sbsys'],
  },
  {
    actorKey: 'workflowDemo.steps.technical.actor',
    roleKey: 'workflowDemo.steps.technical.role',
    actionKey: 'workflowDemo.steps.technical.action',
    integrations: null,
  },
  {
    actorKey: 'workflowDemo.steps.approval.actor',
    roleKey: 'workflowDemo.steps.approval.role',
    actionKey: 'workflowDemo.steps.approval.action',
    integrations: ['digitalpost', 'pdf'],
  },
]

const ecaBenefits = ['visual', 'modern', 'flexible', 'headless']
</script>

<style scoped>
.landing-section {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

.landing-section--gray {
  border-top: 1px solid #dcdcdc;
}

.landing-timeline {
  position: relative;
  max-width: none;
}

/* Rail: DKFDS gray-300, centred under the 2rem nodes. */
.landing-timeline::before {
  content: "";
  position: absolute;
  left: calc(1rem - 1px);
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #bfbfbf;
}

.landing-timeline__item {
  position: relative;
  padding-left: 3rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.landing-timeline__item:last-child {
  margin-bottom: 0;
}

.landing-timeline__node {
  position: absolute;
  left: 0;
  top: 1.25rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #0059b3;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 2rem;
  text-align: center;
}

.landing-timeline .card {
  background-color: #ffffff;
}

.landing-timeline__role {
  color: #454545;
}

.landing-timeline__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.landing-eca {
  background-color: #ffffff;
}

.landing-eca__list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem 2rem;
  max-width: none;
}

@media (min-width: 768px) {
  .landing-eca__list {
    grid-template-columns: 1fr 1fr;
  }
}

.landing-eca__list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0;
}

.landing-eca__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
  fill: #358000;
}
</style>
