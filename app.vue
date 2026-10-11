<template>
  <div id="app">
    <!-- DKFDS cookiemeddelelse: first in the document, before the skip link
         and every page's header. Renders only when no af_consent choice is
         stored (client-side, after reading the cookie), never as a modal. -->
    <FdsCookieBanner />

    <!-- Skip link: the first focusable element after the cookie prompt, jumps
         a keyboard/AT user straight past the branding to the page content
         (WCAG 2.4.1). -->
    <FdsSkipLink target="main" />

    <!-- DKFDS icon sprite, inlined once so every <use href="#icon"> on the
         page resolves. Hidden via .fds-icon-sprite (assets/css/dkfds.scss). -->
    <div class="fds-icon-sprite" aria-hidden="true" v-html="iconSprite" />

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
import spriteSource from '~/public/dkfds/img/all-svg-icons.svg?raw'

// Strip the XML prolog/doctype and mark the root so it is inert for AT.
const iconSprite = spriteSource
  .replace(/^[\s\S]*?<svg\b/, '<svg')
  .replace('<svg xmlns="http://www.w3.org/2000/svg">', '<svg xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">')
</script>

<style>
/* Typography, colours, focus ring and .sr-only come from DKFDS
   (assets/css/dkfds.scss, self-hosted IBM Plex Sans). Tailwind preflight is
   off, so this zero-margin reset keeps the Tailwind-built landing sections
   behaving; DKFDS element selectors (p, h1, ul...) are more specific and
   still win where the design system sets its own rhythm. */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
