<template>
  <section class="hero-section relative overflow-hidden">
    <!-- Subtle grid background -->
    <div class="absolute inset-0 grid-bg" aria-hidden="true" />

    <!-- Top bar: accent gradient + language switcher -->
    <div class="relative">
      <div class="h-1 bg-gradient-to-r from-secondary-500 via-secondary-400 to-warning-400" />
      <div class="absolute right-6 lg:right-8 top-3">
        <div class="flex items-center gap-1 text-xs font-medium">
          <NuxtLink
            :to="switchLocalePath('da')"
            class="px-2 py-1 rounded transition-colors"
            :class="locale === 'da' ? 'bg-primary-100 text-primary-700 font-bold' : 'text-neutral-400 hover:text-neutral-600'"
          >DA</NuxtLink>
          <span class="text-neutral-300">|</span>
          <NuxtLink
            :to="switchLocalePath('en')"
            class="px-2 py-1 rounded transition-colors"
            :class="locale === 'en' ? 'bg-primary-100 text-primary-700 font-bold' : 'text-neutral-400 hover:text-neutral-600'"
          >EN</NuxtLink>
        </div>
      </div>
    </div>

    <div class="relative max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
      <div class="max-w-3xl">
        <!-- Badge -->
        <a
          href="https://github.com/madsnorgaard/aabenforms"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-semibold tracking-wide uppercase mb-8 reveal-up hover:bg-primary-100 transition-colors"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
          Open Source - GPL 2.0
        </a>

        <!-- Main heading -->
        <h1 class="text-5xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 mb-6 reveal-up delay-1">
          <span class="block">Åben</span>
          <span class="block text-primary-700">Forms</span>
        </h1>

        <!-- Tagline -->
        <p class="text-xl lg:text-2xl text-neutral-600 leading-relaxed mb-4 max-w-2xl reveal-up delay-2">
          {{ $t('hero.tagline') }}
        </p>

        <!-- Sub-note: understated technical credibility -->
        <p class="text-sm text-neutral-400 font-medium mb-10 reveal-up delay-2">
          Drupal 11 &middot; Nuxt 3 &middot; ECA Workflows &middot; JSON:API
        </p>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-start gap-4 reveal-up delay-3">
          <UiButton size="lg" variant="primary" @click="$emit('scrollToDemo')">
            {{ $t('hero.cta.demo') }}
          </UiButton>
          <ClientOnly v-if="mitidEnabled">
            <AuthLoginButton />
          </ClientOnly>
        </div>
      </div>

      <!-- Right-side decorative element: a simplified workflow diagram -->
      <div class="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-72 opacity-[0.07]" aria-hidden="true">
        <svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="10" width="120" height="50" rx="8" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <line x1="100" y1="60" x2="100" y2="100" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <circle cx="100" cy="120" r="20" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <line x1="100" y1="140" x2="100" y2="180" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <rect x="40" y="180" width="120" height="50" rx="8" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <line x1="100" y1="230" x2="100" y2="270" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <polygon points="80,270 120,270 100,310" stroke="currentColor" stroke-width="2" fill="none" class="text-primary-900"/>
          <line x1="100" y1="310" x2="100" y2="350" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
          <rect x="40" y="350" width="120" height="50" rx="8" stroke="currentColor" stroke-width="2" class="text-primary-900"/>
        </svg>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { public: publicConfig } = useRuntimeConfig()
const mitidEnabled = computed(() => publicConfig.mitidEnabled)

defineEmits<{
  scrollToDemo: []
}>()
</script>

<style scoped>
.hero-section {
  background: linear-gradient(170deg, #fafafa 0%, #f0f7ff 50%, #fafafa 100%);
}

.grid-bg {
  background-image:
    linear-gradient(rgba(0, 113, 201, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 113, 201, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}

.reveal-up {
  animation: revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.35s; }

@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
