<template>
  <section id="demo" class="landing-section bg-normal" aria-labelledby="landing-demo-heading">
    <div class="container">
      <div class="row">
        <!-- Copy column -->
        <div class="col-12 col-lg-6">
          <p class="subheading mb-3">
            {{ $t('landingCta.eyebrow') }}
          </p>
          <h2 id="landing-demo-heading" class="h1 mt-0 mb-5">
            {{ $t('landingCta.heading') }}
          </h2>
          <p class="font-lead mt-0 mb-6">
            {{ $t('landingCta.lead') }}
          </p>

          <ul class="nobullet-list landing-checklist mb-6">
            <li v-for="key in ['bullet1', 'bullet2', 'bullet3']" :key="key">
              <svg class="icon-svg landing-checklist__icon" focusable="false" aria-hidden="true"><use href="#check" /></svg>
              <span>{{ $t(`landingCta.${key}`) }}</span>
            </li>
          </ul>

          <p class="mb-6">
            <a
              href="https://github.com/madsnorgaard/AabenForms/blob/main/docs/DATA-FLOW.md"
              target="_blank"
              rel="noreferrer"
              class="function-link landing-cta-link"
            >{{ $t('landingCta.altCta') }}<svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#open-in-new" /></svg></a>
          </p>
        </div>

        <!-- Preview column: the whole DKFDS card is the link, so the hero CTA
             is not repeated as another button. When the live demo flag is off
             (production today) it routes to /kontakt so visitors do not
             dead-end on the disabled-state page. -->
        <div class="col-12 col-lg-6">
          <NuxtLink
            :to="localePath(demoEnabled ? '/demo/byggetilladelse' : '/kontakt')"
            class="card landing-preview"
          >
            <div class="card-content">
              <span class="card-subheading">/demo/byggetilladelse</span>
              <h3 class="card-heading h3">{{ $t('landingCta.cta') }}</h3>

              <p class="landing-preview__label">{{ $t('landingCta.preview.stepLabel') }}</p>
              <ol class="nobullet-list landing-preview__steps">
                <li>
                  <svg class="icon-svg landing-preview__done" focusable="false" aria-hidden="true"><use href="#check" /></svg>
                  <span><span class="sr-only">{{ $t('landingCta.preview.doneSr') }} </span>{{ $t('landingCta.preview.step1') }}</span>
                </li>
                <li>
                  <svg class="icon-svg landing-preview__done" focusable="false" aria-hidden="true"><use href="#check" /></svg>
                  <span><span class="sr-only">{{ $t('landingCta.preview.doneSr') }} </span>{{ $t('landingCta.preview.step2') }}</span>
                </li>
                <li>
                  <svg class="icon-svg landing-preview__running" focusable="false" aria-hidden="true"><use href="#hourglass" /></svg>
                  <span><span class="sr-only">{{ $t('landingCta.preview.runningSr') }} </span>{{ $t('landingCta.preview.step3') }}</span>
                </li>
              </ol>

              <div class="landing-preview__inbox">
                <p class="landing-preview__label">
                  <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#email" /></svg>
                  {{ $t('landingCta.preview.inboxLabel') }}
                </p>
                <p class="landing-preview__inbox-title">{{ $t('landingCta.preview.inboxTitle') }}</p>
                <p class="landing-preview__inbox-meta">{{ $t('landingCta.preview.inboxMeta') }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const localePath = useLocalePath()
const demoEnabled = computed<boolean>(() => Boolean(config.public.demoByggetilladelseEnabled))
</script>

<style scoped>
.landing-section {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

.landing-checklist li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.landing-checklist__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
  fill: #358000;
}

/* CTA text link: function-link look, never DKFDS visited purple. */
.landing-cta-link,
.landing-cta-link:visited {
  color: #004d99;
}

.landing-preview {
  margin-bottom: 0;
  height: auto;
}

.landing-preview .card-content {
  width: 100%;
}

.landing-preview__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #454545;
  margin: 0 0 0.5rem;
}

.landing-preview__steps {
  width: 100%;
  margin: 0 0 1.5rem;
}

.landing-preview__steps li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.landing-preview__done {
  flex-shrink: 0;
  fill: #358000;
}

.landing-preview__running {
  flex-shrink: 0;
  fill: #0059b3;
}

.landing-preview__inbox {
  width: 100%;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  background-color: #f5f5f5;
  padding: 1rem;
}

.landing-preview__inbox p {
  margin: 0;
}

.landing-preview__inbox-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a1a;
}

.landing-preview__inbox-meta {
  font-size: 0.875rem;
  color: #454545;
}
</style>
