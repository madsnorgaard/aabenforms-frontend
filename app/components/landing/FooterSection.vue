<template>
  <div>
    <!-- CTA band: kept above the DKFDS footer, restyled on the DKFDS palette. -->
    <section class="fds-cta-band" aria-labelledby="cta-heading">
      <div class="container py-8">
        <div class="fds-cta-band__inner">
          <div class="fds-cta-band__copy">
            <h2 id="cta-heading" class="mt-0 mb-3">{{ $t('cta.title') }}</h2>
            <p class="mb-0">{{ $t('cta.subtitle') }}</p>
          </div>
          <div class="button-group">
            <FdsButton variant="primary" @click="showDemoModal = true">
              {{ $t('cta.button') }}
            </FdsButton>
            <a
              href="https://github.com/madsnorgaard/aabenforms"
              target="_blank"
              rel="noopener"
              class="button button-secondary"
            >
              GitHub<svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#open-in-new" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <FdsFooter>
      <template #extra>
        <h2 class="h5 mb-3">{{ $t('fds.footer.status') }}</h2>
        <p>
          {{ $t('footer.apiStatus') }}:
          <span v-if="apiStatus.loading">{{ $t('footer.connecting') }}...</span>
          <span v-else-if="apiStatus.error">{{ $t('footer.offline') }}</span>
          <span v-else>{{ $t('footer.online') }}</span>
        </p>
      </template>
    </FdsFooter>

    <!-- Demo request modal -->
    <LandingDemoRequestModal :open="showDemoModal" @close="showDemoModal = false" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  apiStatus: { loading: boolean; data?: any; error?: string }
}>()

const showDemoModal = ref(false)
</script>

<style scoped>
.fds-cta-band {
  background-color: #f1f1f1;
  border-top: 1px solid #dcdcdc;
}

.fds-cta-band__inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.fds-cta-band__copy {
  max-width: 36rem;
}

@media (min-width: 992px) {
  .fds-cta-band__inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
