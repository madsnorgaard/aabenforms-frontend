<template>
  <section class="landing-hero bg-alternative">
    <div class="container landing-hero__inner">
      <div class="row">
        <div class="col-12 col-lg-8">
          <p class="mt-0 mb-6">
            <a
              href="https://github.com/madsnorgaard/aabenforms"
              target="_blank"
              rel="noopener"
              class="badge badge-success landing-hero__badge"
            >{{ $t('hero.badge') }}</a>
          </p>

          <h1 class="landing-hero__title mt-0 mb-5">
            <span class="d-block">Åben</span>
            <span class="d-block landing-hero__title-accent">Forms</span>
          </h1>

          <p class="font-lead mt-0 mb-4">
            {{ $t('hero.tagline') }}
          </p>

          <p class="landing-hero__stack mt-0 mb-7">
            Drupal 11 &middot; Nuxt 3 &middot; ECA &middot; JSON:API
          </p>

          <!-- Primary jumps straight into the live demo when it is enabled
               (DDEV); on production the demo route is gated, so the primary
               CTA goes to /kontakt for a walkthrough instead of dead-ending
               on the disabled-state page. -->
          <div class="button-group">
            <NuxtLink
              :to="localePath(demoEnabled ? '/demo/byggetilladelse' : '/kontakt')"
              class="button button-primary"
            >
              {{ demoEnabled ? $t('hero.cta.demo') : $t('hero.cta.demoOffline') }}<svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#arrow-forward" /></svg>
            </NuxtLink>
            <NuxtLink
              v-if="demoEnabled"
              :to="localePath('/kontakt')"
              class="button button-secondary"
            >
              {{ $t('hero.cta.book') }}
            </NuxtLink>
            <NuxtLink
              :to="localePath('/demo')"
              class="button button-tertiary"
            >
              {{ $t('demo.hub.allDemos') }}
            </NuxtLink>
          </div>
        </div>

        <!-- Decorative: a simplified workflow diagram, hidden from assistive tech. -->
        <div class="d-none d-lg-block col-lg-4" aria-hidden="true">
          <svg class="landing-hero__diagram" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="10" width="120" height="50" rx="4" stroke="currentColor" stroke-width="2" />
            <line x1="100" y1="60" x2="100" y2="100" stroke="currentColor" stroke-width="2" />
            <circle cx="100" cy="120" r="20" stroke="currentColor" stroke-width="2" />
            <line x1="100" y1="140" x2="100" y2="180" stroke="currentColor" stroke-width="2" />
            <rect x="40" y="180" width="120" height="50" rx="4" stroke="currentColor" stroke-width="2" />
            <line x1="100" y1="230" x2="100" y2="270" stroke="currentColor" stroke-width="2" />
            <polygon points="80,270 120,270 100,310" stroke="currentColor" stroke-width="2" fill="none" />
            <line x1="100" y1="310" x2="100" y2="350" stroke="currentColor" stroke-width="2" />
            <rect x="40" y="350" width="120" height="50" rx="4" stroke="currentColor" stroke-width="2" />
          </svg>
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
/* DKFDS alternative (gray-100) band with the gray-200 rule. */
.landing-hero {
  border-bottom: 1px solid #dcdcdc;
}

.landing-hero__inner {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

@media (min-width: 992px) {
  .landing-hero__inner {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }
}

/* The open source badge is a link: keep the badge colours after a visit. */
.landing-hero__badge,
.landing-hero__badge:visited,
.landing-hero__badge:hover {
  text-decoration: none;
}

.landing-hero__badge:hover {
  text-decoration: underline;
}

.landing-hero__title {
  font-size: 3rem;
  line-height: 1.05;
  font-weight: 700;
  color: #1a1a1a;
}

@media (min-width: 992px) {
  .landing-hero__title {
    font-size: 4.5rem;
  }
}

.landing-hero__title-accent {
  color: #0059b3;
}

.landing-hero__stack {
  font-size: 0.875rem;
  font-weight: 500;
  color: #454545;
}

.landing-hero__diagram {
  display: block;
  width: 100%;
  max-width: 18rem;
  margin-left: auto;
  color: #dcdcdc;
}
</style>
