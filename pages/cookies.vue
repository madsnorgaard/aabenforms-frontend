<template>
  <div>
    <SiteHeader />
    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-8">
          <h1>{{ $t('fds.pages.cookies.title') }}</h1>
          <p class="font-lead">{{ $t('fds.pages.cookies.lead') }}</p>
          <FdsAlert type="info" :heading="$t('fds.pages.placeholderHeading')" :text="$t('fds.pages.cookies.placeholder')" paragraph />
          <p>{{ $t('fds.pages.cookies.body') }}</p>
        </div>
      </div>
    </main>
    <FdsFooter />
  </div>
</template>

<script setup lang="ts">
// Placeholder cookie policy linked from the footer and (later) the DKFDS
// cookiemeddelelse. Today the frontend only sets the i18n_redirected cookie.
const { t } = useI18n()
useHead({ title: t('fds.pages.cookies.title') })
</script>
