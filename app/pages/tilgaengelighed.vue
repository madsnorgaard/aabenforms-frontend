<template>
  <div>
    <SiteHeader :solution-title="$t('fds.footer.accessibility')" />
    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-8">
          <h1>{{ $t('fds.pages.accessibility.title') }}</h1>
          <p class="font-lead">{{ $t('fds.pages.accessibility.lead') }}</p>

          <h2>{{ $t('fds.pages.accessibility.scopeHeading') }}</h2>
          <p>{{ $t('fds.pages.accessibility.scope') }}</p>
          <p>{{ $t('fds.pages.accessibility.outOfScope') }}</p>

          <FdsAlert
            type="warning"
            :heading="$t('fds.pages.accessibility.statusHeading')"
            :text="$t('fds.pages.accessibility.status')"
            paragraph
            data-testid="a11y-status"
          />

          <h2>{{ $t('fds.pages.accessibility.testedHeading') }}</h2>
          <p>{{ $t('fds.pages.accessibility.testedIntro') }}</p>
          <ul>
            <li v-for="n in 4" :key="`tested${n}`">{{ $t(`fds.pages.accessibility.tested${n}`) }}</li>
          </ul>

          <h2>{{ $t('fds.pages.accessibility.gapsHeading') }}</h2>
          <ul data-testid="a11y-gaps">
            <li v-for="n in 5" :key="`gaps${n}`">{{ $t(`fds.pages.accessibility.gaps${n}`) }}</li>
          </ul>

          <h2>{{ $t('fds.pages.accessibility.methodHeading') }}</h2>
          <p>{{ $t('fds.pages.accessibility.method') }}</p>

          <h2>{{ $t('fds.pages.accessibility.feedbackHeading') }}</h2>
          <i18n-t keypath="fds.pages.accessibility.feedback" tag="p" scope="global">
            <template #email>
              <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
            </template>
          </i18n-t>
          <p>
            <NuxtLink :to="localePath('/kontakt')">{{ $t('fds.pages.accessibility.contactLink') }}</NuxtLink>
          </p>

          <h2>{{ $t('fds.pages.accessibility.complaintHeading') }}</h2>
          <p>{{ $t('fds.pages.accessibility.complaint') }}</p>
          <p>
            <a href="https://www.was.digst.dk" rel="noopener" target="_blank" class="icon-link">
              {{ $t('fds.pages.accessibility.complaintLink') }}
              <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#open-in-new" /></svg>
            </a>
          </p>
        </div>
      </div>
    </main>
    <FdsFooter />
  </div>
</template>

<script setup lang="ts">
// The tilgængelighedserklæring (accessibility statement) every public Danish
// self-service solution must publish (webtilgængelighedsloven). The versioned
// source is backend docs/compliance/TILGAENGELIGHEDSERKLAERING.md; keep the
// two in step when the status changes.
const CONTACT_EMAIL = 'kontakt@aabenforms.dk'
const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: t('fds.pages.accessibility.title') })
</script>
