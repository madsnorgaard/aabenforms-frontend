<template>
  <section class="landing-section bg-normal" aria-labelledby="landing-capabilities-heading">
    <div class="container">
      <div class="row">
        <div class="col-12 col-lg-8">
          <h2 id="landing-capabilities-heading" class="h1 mt-0 mb-5">
            {{ $t('features.title') }}
          </h2>
          <p class="font-lead mt-0 mb-6">
            {{ $t('workflowDemo.eca.description') }}
          </p>
        </div>
      </div>

      <ul class="row card-row">
        <li
          v-for="cap in capabilities"
          :key="cap.label"
          class="col-12 col-sm-6 col-lg-3"
        >
          <div class="card">
            <div class="card-content">
              <svg class="icon-svg landing-capability__icon mb-4" focusable="false" aria-hidden="true"><use :href="`#${cap.icon}`" /></svg>
              <h3 class="h4 mt-0 mb-3">{{ cap.label }}</h3>
              <p>{{ cap.desc }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Icons come from the DKFDS sprite inlined in app.vue.
const capabilities = computed(() => [
  { icon: 'list-check', label: t('features.workflows.title'), desc: t('features.workflows.description') },
  { icon: 'lock', label: t('features.multiTenant.title'), desc: t('features.multiTenant.description') },
  { icon: 'email', label: t('features.danish.title'), desc: t('features.danish.description') },
  { icon: 'how-to-reg', label: t('features.security.title'), desc: t('features.security.description') },
])
</script>

<style scoped>
.landing-section {
  padding-top: 4rem;
  padding-bottom: 2.5rem;
}

.landing-capability__icon {
  width: 2rem;
  height: 2rem;
  fill: #0059b3;
}
</style>
