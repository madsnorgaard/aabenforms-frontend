<template>
  <div class="callback-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>{{ $t('auth.loggingIn') }}</p>
      </div>

      <div v-else-if="error" class="error">
        <h2>{{ $t('auth.loginFailed') }}</h2>
        <p>{{ error }}</p>
        <UiButton @click="navigateTo('/')">
          {{ $t('auth.returnHome') }}
        </UiButton>
      </div>

      <div v-else class="success">
        <p>{{ $t('auth.loginSuccess') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { handleCallback, error } = useAuth()
const loading = ref(true)

// Handle MitID callback on mount
onMounted(async () => {
  const success = await handleCallback()

  if (success) {
    // Redirect handled by handleCallback
  } else {
    loading.value = false
  }
})

// Set page meta
useHead({
  title: 'Authenticating...',
})
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.container {
  max-width: 500px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 122, 204, 0.2);
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #c00;
}

.error h2 {
  margin-top: 0;
}

.success {
  color: #060;
}
</style>
