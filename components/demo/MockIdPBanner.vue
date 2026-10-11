<template>
  <FdsAlert
    type="warning"
    role="note"
    heading-level="h3"
    :heading="$t('demo.byggetilladelse.mockBanner.title')"
    :text="$t('demo.byggetilladelse.mockBanner.body')"
  />
</template>

<script setup lang="ts">
// Honest-status notice: the demo authenticates against a local Keycloak that
// imitates MitID. DKFDS warning alert; role="note" because it is static
// context, not an interruption.
</script>
