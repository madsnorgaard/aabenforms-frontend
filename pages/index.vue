<template>
  <div class="home">
    <header class="hero">
      <h1>ÅbenForms</h1>
      <p class="tagline">{{ $t('hero.tagline') }}</p>
      <div class="cta-buttons">
        <button class="btn btn-primary">{{ $t('hero.cta.demo') }}</button>
        <button class="btn btn-secondary">{{ $t('hero.cta.learn') }}</button>
      </div>
    </header>

    <section class="features">
      <h2>{{ $t('features.title') }}</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>🔄 {{ $t('features.workflows.title') }}</h3>
          <p>{{ $t('features.workflows.description') }}</p>
        </div>
        <div class="feature-card">
          <h3>🏢 {{ $t('features.multiTenant.title') }}</h3>
          <p>{{ $t('features.multiTenant.description') }}</p>
        </div>
        <div class="feature-card">
          <h3>🇩🇰 {{ $t('features.danish.title') }}</h3>
          <p>{{ $t('features.danish.description') }}</p>
        </div>
        <div class="feature-card">
          <h3>🔐 {{ $t('features.security.title') }}</h3>
          <p>{{ $t('features.security.description') }}</p>
        </div>
      </div>
    </section>

    <section class="status">
      <h2>System Status</h2>
      <div v-if="apiStatus.loading">Loading API connection...</div>
      <div v-else-if="apiStatus.error" class="error">
        API Error: {{ apiStatus.error }}
      </div>
      <div v-else class="success">
        ✓ Connected to backend: {{ apiStatus.data?.meta?.links?.self?.href }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { fetchApiIndex } = useApi()

// Test API connection on mount
const apiStatus = ref<{ loading: boolean; data?: any; error?: string }>({
  loading: true
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

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.tagline {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: white;
  color: #667eea;
  font-weight: 600;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.features {
  margin-bottom: 3rem;
}

.features h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.status {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.success {
  color: #28a745;
  font-weight: 600;
}

.error {
  color: #dc3545;
  font-weight: 600;
}
</style>
