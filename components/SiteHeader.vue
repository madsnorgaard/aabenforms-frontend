<template>
  <FdsHeader :live-badge="liveBadge">
    <template v-if="$slots['nav-extra']" #navigation>
      <div class="container py-3">
        <slot name="nav-extra" />
      </div>
    </template>
  </FdsHeader>
</template>

<script setup lang="ts">
// Site header = DKFDS header (components/fds/FdsHeader). The props of the
// previous Tailwind header are still accepted so existing pages compile:
// maxWidthClass, sticky and backLink have no DKFDS equivalent (the solution
// title links to the front page, the header is not sticky) and are ignored.
withDefaults(defineProps<{
  maxWidthClass?: string
  sticky?: boolean
  liveBadge?: boolean
  backLink?: boolean
}>(), {
  maxWidthClass: '',
  sticky: false,
  liveBadge: false,
  backLink: true,
})
</script>
