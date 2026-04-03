<template>
  <div class="min-h-screen">
    <LandingHeroSection @scroll-to-demo="scrollToDemo" />
    <LandingCapabilitiesGrid />
    <LandingWorkflowTimeline />
    <LandingDemoForms />
    <LandingFooterSection :api-status="apiStatus" />
  </div>
</template>

<script setup lang="ts">
const { fetchApiIndex } = useApi()

const apiStatus = ref<{ loading: boolean; data?: any; error?: string }>({
  loading: true,
})

const scrollToDemo = () => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(async () => {
  try {
    const data = await fetchApiIndex()
    apiStatus.value = { loading: false, data }
  } catch (error: any) {
    apiStatus.value = { loading: false, error: error.message }
  }
})
</script>
