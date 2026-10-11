<template>
  <div
    v-if="visible"
    class="cookie-container"
    role="complementary"
    aria-labelledby="cookie-message-heading"
    aria-describedby="cookie-message-text"
  >
    <div class="cookie-message">
      <div class="cookie-text">
        <h2 id="cookie-message-heading" class="h3 mt-0 mb-3">{{ $t('cookies.banner.heading') }}</h2>
        <p id="cookie-message-text" class="mt-0">
          {{ $t('cookies.banner.text') }}
          <NuxtLink :to="localePath('/cookies')">{{ $t('cookies.banner.link') }}</NuxtLink>
        </p>
      </div>
      <div class="cookie-actions">
        <ul class="inline-list">
          <li><button type="button" class="button button-secondary" @click="accept">{{ $t('cookies.banner.accept') }}</button></li>
          <li><button type="button" class="ml-md-4 button button-secondary" @click="reject">{{ $t('cookies.banner.reject') }}</button></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// DKFDS Cookiemeddelelse. Markup per docs/DKFDS_REFERENCE.md: placed before
// the header (app.vue), role=complementary labelled by its own heading and
// text, two secondary buttons in an inline-list. It is not a modal: focus is
// never moved into it or trapped, and the page stays fully usable.
//
// Rendered client-side only, after the cookie has been read: the server
// render (prerendered or cached HTML) never includes it, so a returning user
// who already chose does not see it flash, and a first-time visitor gets it
// right after hydration. Status null = no choice stored = show.
const { status, accept, reject } = useConsent()
const localePath = useLocalePath()

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const visible = computed(() => mounted.value && status.value === null)
</script>

<style scoped>
/* The banner is an interactive prompt; it has no place on paper. */
@media print {
  .cookie-container {
    display: none !important;
  }
}
</style>
