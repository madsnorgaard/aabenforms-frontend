<template>
  <div>
    <FdsHeader :solution-title="$t('errors.page.solution')" />
    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-8">
          <h1>{{ notFound ? $t('errors.page.notFoundHeading') : $t('errors.page.heading') }}</h1>
          <p class="font-lead">{{ notFound ? $t('errors.page.notFoundBody') : $t('errors.page.body') }}</p>
          <div class="button-group mt-5">
            <FdsButton variant="primary" @click="goHome">{{ $t('errors.page.home') }}</FdsButton>
            <FdsButton v-if="!notFound" variant="secondary" @click="retry">{{ $t('errors.page.retry') }}</FdsButton>
          </div>
        </div>
      </div>
    </main>
    <FdsFooter />
  </div>
</template>

<script setup lang="ts">
// DKFDS error page. Never indexed: a search engine that renders the page
// during a deploy or an outage must not keep the error as the result.
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const localePath = useLocalePath()

const notFound = computed(() => props.error?.statusCode === 404)

useHead({
  title: notFound.value ? t('errors.page.notFoundHeading') : t('errors.page.heading'),
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

function goHome() {
  clearError({ redirect: localePath('/') })
}

function retry() {
  reloadNuxtApp({ persistState: false })
}
</script>
