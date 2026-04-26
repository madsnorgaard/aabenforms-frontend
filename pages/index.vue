<template>
  <div class="min-h-screen">
    <LandingHeroSection />
    <!-- Order is conversion-tuned: demo CTA is the punchline so it goes
         right after the hero. Comparison creates instant relevance for the
         exact buyers we want. CapabilitiesGrid is proof. WorkflowTimeline
         is the deeper-dive narrative for stakeholders who want to read on. -->
    <LandingDemoForms />
    <LandingComparison />
    <LandingCapabilitiesGrid />
    <LandingWorkflowTimeline />
    <LandingFooterSection :api-status="apiStatus" />
  </div>
</template>

<script setup lang="ts">
const { fetchApiIndex } = useApi()

const apiStatus = ref<{ loading: boolean; data?: any; error?: string }>({
  loading: true,
})

onMounted(async () => {
  try {
    const data = await fetchApiIndex()
    apiStatus.value = { loading: false, data }
  } catch (error: any) {
    apiStatus.value = { loading: false, error: error.message }
  }
})
</script>
