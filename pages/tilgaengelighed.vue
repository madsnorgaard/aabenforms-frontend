<template>
  <div>
    <SiteHeader :solution-title="$t('fds.footer.accessibility')" />
    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-8">
          <h1>{{ $t('fds.pages.accessibility.title') }}</h1>
          <p class="font-lead">{{ $t('fds.pages.accessibility.lead') }}</p>
          <FdsAlert type="info" :heading="$t('fds.pages.placeholderHeading')" :text="$t('fds.pages.accessibility.placeholder')" paragraph />
          <p>{{ $t('fds.pages.accessibility.body') }}</p>
        </div>
      </div>
    </main>
    <FdsFooter />
  </div>
</template>

<script setup lang="ts">
// Placeholder for the tilgængelighedserklæring (accessibility statement) that
// every public Danish self-service solution must publish (lov om
// tilgængelighed af offentlige organers websteder). The final statement is
// produced on was.digst.dk and pasted in here.
const { t } = useI18n()
useHead({ title: t('fds.pages.accessibility.title') })
</script>
