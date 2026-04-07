<template>
  <section class="py-20 lg:py-28 bg-neutral-50 border-t border-neutral-100">
    <div class="max-w-6xl mx-auto px-6 lg:px-8">
      <div class="max-w-2xl mb-14">
        <p class="text-xs font-semibold tracking-widest uppercase text-primary-600 mb-3">
          {{ $t('workflowDemo.example.title') }}
        </p>
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          {{ $t('workflowDemo.title') }}
        </h2>
        <p class="text-lg text-neutral-500">
          {{ $t('workflowDemo.subtitle') }}
        </p>
      </div>

      <!-- Timeline -->
      <div class="relative ml-4 lg:ml-6">
        <!-- Vertical rail (centered on dots at left-[9px]) -->
        <div class="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-400 to-success-400" aria-hidden="true" />

        <div class="space-y-0">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="relative pl-12 pb-10 last:pb-0 group"
          >
            <!-- Node centered on rail -->
            <div
              class="absolute left-0 top-1 w-[20px] h-[20px] rounded-full border-[3px] border-white transition-all duration-300"
              :class="[
                index === activeStep
                  ? 'bg-primary-600 ring-2 ring-primary-300 scale-110'
                  : 'bg-neutral-300 ring-1 ring-neutral-200 group-hover:bg-primary-400 group-hover:ring-primary-200'
              ]"
            />

            <!-- Content card -->
            <div
              class="rounded-xl border bg-white p-6 transition-all duration-300 cursor-default"
              :class="[
                index === activeStep
                  ? 'border-primary-200 shadow-lg shadow-primary-100/50'
                  : 'border-neutral-200 hover:border-primary-200 hover:shadow-md'
              ]"
              @mouseenter="activeStep = index"
            >
              <div class="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {{ String(index + 1).padStart(2, '0') }}
                    </span>
                    <h3 class="text-lg font-bold text-neutral-900">
                      {{ $t(step.actorKey) }}
                    </h3>
                  </div>
                  <p class="text-sm text-neutral-400">{{ $t(step.roleKey) }}</p>
                </div>
              </div>

              <p class="text-sm text-neutral-600 leading-relaxed mb-4">
                {{ $t(step.actionKey) }}
              </p>

              <!-- Integration chips -->
              <div v-if="step.integrations" class="flex flex-wrap gap-1.5">
                <span
                  v-for="integration in step.integrations"
                  :key="integration"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200"
                >
                  {{ $t(`workflowDemo.integrations.${integration}`) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ECA callout -->
      <div class="mt-12 rounded-xl border border-success-200 bg-success-50/50 p-6 lg:p-8 flex gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
          <svg class="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <div>
          <h4 class="text-base font-bold text-neutral-900 mb-1">
            {{ $t('workflowDemo.eca.title') }}
          </h4>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3">
            <li
              v-for="benefit in ecaBenefits"
              :key="benefit"
              class="flex items-start gap-2 text-sm text-neutral-600"
            >
              <svg class="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                <path d="M3 8.5l3.5 3.5L13 4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ $t(`workflowDemo.eca.benefits.${benefit}`) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const activeStep = ref(0)

const steps = [
  {
    actorKey: 'workflowDemo.steps.citizen.actor',
    roleKey: 'workflowDemo.steps.citizen.role',
    actionKey: 'workflowDemo.steps.citizen.action',
    integrations: ['mitid', 'cpr', 'dawa'],
  },
  {
    actorKey: 'workflowDemo.steps.caseworker.actor',
    roleKey: 'workflowDemo.steps.caseworker.role',
    actionKey: 'workflowDemo.steps.caseworker.action',
    integrations: ['digitalpost', 'sbsys'],
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
