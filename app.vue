<template>
  <div id="app">
    <!-- Skip link: the first focusable element, jumps a keyboard/AT user
         straight past the branding to the page content (WCAG 2.4.1). -->
    <a href="#main" class="skip-link">{{ $t('a11y.skipToContent') }}</a>

    <!-- Apply tenant-specific branding -->
    <TenantBranding />

    <!-- Each page renders its own header, <main id="main">, and footer so the
         banner/main/contentinfo landmarks stay siblings. The skip link + the
         route-change focus move both target that per-page #main. -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// This is the root component of the Nuxt app.
// Pages own their landmarks; TenantBranding injects tenant styling (no heading
// of its own, so each page keeps a single h1).
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #262626;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Visually-hidden content that stays available to screen readers. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip link: off-screen until focused, then pinned top-left. */
.skip-link {
  position: absolute;
  left: 0.5rem;
  top: -3rem;
  z-index: 1000;
  padding: 0.75rem 1rem;
  background: #0071c9;
  color: #ffffff;
  border-radius: 0 0 6px 6px;
  text-decoration: none;
  transition: top 0.15s ease-in-out;
}

.skip-link:focus {
  top: 0;
}

/* A consistent, visible keyboard focus indicator (WCAG 2.4.7). */
:focus-visible {
  outline: 3px solid #0071c9;
  outline-offset: 2px;
}

/* Honour a reduced-motion preference (WCAG 2.3.3). */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

#main:focus {
  outline: none;
}
</style>
