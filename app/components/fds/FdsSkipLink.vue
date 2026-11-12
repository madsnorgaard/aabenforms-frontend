<template>
  <a class="skipnav" :href="`#${target}`"><slot>{{ $t('a11y.skipToContent') }}</slot></a>
</template>

<script setup lang="ts">
// DKFDS Skip-link: first focusable element on the page, jumps past the
// header to the page content (WCAG 2.4.1). Pages render <main id="main"
// tabindex="-1">, which is the default target.
withDefaults(defineProps<{
  target?: string
}>(), {
  target: 'main',
})
</script>
