<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-5xl md:text-6xl font-bold mb-6">
            ÅbenForms
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            {{ $t('hero.tagline') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UiButton
              size="lg"
              variant="secondary"
              @click="scrollToDemo"
            >
              {{ $t('hero.cta.demo') }}
            </UiButton>
            <UiButton
              size="lg"
              variant="outline"
              class="!bg-white/10 !text-white !border-white hover:!bg-white/20"
            >
              {{ $t('hero.cta.learn') }}
            </UiButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center text-neutral-900 mb-12">
          {{ $t('features.title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="feature in features"
            :key="feature.icon"
            class="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300 border border-neutral-200"
          >
            <div class="text-4xl mb-4">{{ feature.icon }}</div>
            <h3 class="text-xl font-semibold text-neutral-900 mb-2">
              {{ $t(feature.titleKey) }}
            </h3>
            <p class="text-neutral-600">
              {{ $t(feature.descKey) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Demo Forms Section -->
    <section id="demo" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center text-neutral-900 mb-4">
          {{ $t('demo.title') }}
        </h2>
        <p class="text-xl text-center text-neutral-600 mb-12 max-w-3xl mx-auto">
          {{ $t('demo.subtitle') }}
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Contact Form Example -->
          <div class="bg-neutral-50 rounded-xl p-8 border-2 border-primary-200">
            <h3 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <span class="text-primary-600">📝</span>
              {{ $t('demo.forms.contact.title') }}
            </h3>
            <form @submit.prevent="handleContactSubmit" class="space-y-4">
              <UiInput
                v-model="contactForm.name"
                :label="$t('demo.forms.contact.name')"
                required
                placeholder="Anders Jensen"
              />
              <UiInput
                v-model="contactForm.email"
                type="email"
                :label="$t('demo.forms.contact.email')"
                required
                placeholder="anders@example.dk"
              />
              <UiSelect
                v-model="contactForm.subject"
                :label="$t('demo.forms.contact.subject')"
                :options="subjectOptions"
                required
                :placeholder="$t('demo.forms.contact.selectSubject')"
              />
              <UiTextarea
                v-model="contactForm.message"
                :label="$t('demo.forms.contact.message')"
                required
                :placeholder="$t('demo.forms.contact.messagePlaceholder')"
                :rows="5"
              />
              <UiButton type="submit" size="lg" full-width>
                {{ $t('demo.forms.contact.submit') }}
              </UiButton>
            </form>
          </div>

          <!-- Application Form Example -->
          <div class="bg-neutral-50 rounded-xl p-8 border-2 border-success-200">
            <h3 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <span class="text-success-600">📋</span>
              {{ $t('demo.forms.application.title') }}
            </h3>
            <form @submit.prevent="handleApplicationSubmit" class="space-y-4">
              <UiInput
                v-model="applicationForm.cpr"
                :label="$t('demo.forms.application.cpr')"
                required
                placeholder="DDMMÅÅ-XXXX"
                :help-text="$t('demo.forms.application.cprHelp')"
              />
              <UiInput
                v-model="applicationForm.address"
                :label="$t('demo.forms.application.address')"
                required
                placeholder="Rådhuspladsen 1, 1550 København"
              />
              <UiSelect
                v-model="applicationForm.category"
                :label="$t('demo.forms.application.category')"
                :options="categoryOptions"
                required
                :placeholder="$t('demo.forms.application.selectCategory')"
              />
              <UiTextarea
                v-model="applicationForm.description"
                :label="$t('demo.forms.application.description')"
                required
                :rows="6"
              />
              <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p class="text-sm text-primary-900">
                  <strong class="font-semibold">🔐 {{ $t('demo.security.title') }}:</strong>
                  {{ $t('demo.security.message') }}
                </p>
              </div>
              <UiButton type="submit" size="lg" full-width variant="secondary">
                {{ $t('demo.forms.application.submit') }}
              </UiButton>
            </form>
          </div>
        </div>

        <!-- Demo Success Message -->
        <div v-if="showSuccess" class="mt-8 bg-success-50 border border-success-200 rounded-lg p-6 text-center">
          <div class="text-4xl mb-2">✅</div>
          <h4 class="text-xl font-semibold text-success-900 mb-2">
            {{ $t('demo.success.title') }}
          </h4>
          <p class="text-success-700">
            {{ $t('demo.success.message') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Use Cases Section -->
    <section class="py-20 bg-neutral-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-4xl font-bold text-center text-neutral-900 mb-12">
          {{ $t('useCases.title') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="useCase in useCases"
            :key="useCase.icon"
            class="bg-white rounded-xl p-8 shadow-md"
          >
            <div class="text-5xl mb-4">{{ useCase.icon }}</div>
            <h3 class="text-2xl font-semibold text-neutral-900 mb-3">
              {{ $t(useCase.titleKey) }}
            </h3>
            <p class="text-neutral-600 mb-4">
              {{ $t(useCase.descKey) }}
            </p>
            <ul class="space-y-2">
              <li
                v-for="example in useCase.examples"
                :key="example"
                class="text-sm text-neutral-700 flex items-start gap-2"
              >
                <span class="text-primary-600 mt-1">•</span>
                {{ $t(example) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-primary-600 text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl font-bold mb-6">
          {{ $t('cta.title') }}
        </h2>
        <p class="text-xl mb-8 text-primary-100">
          {{ $t('cta.subtitle') }}
        </p>
        <UiButton size="lg" variant="secondary">
          {{ $t('cta.button') }}
        </UiButton>
      </div>
    </section>

    <!-- API Status Footer -->
    <section class="py-8 bg-neutral-900 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-sm text-neutral-400">
            © 2026 ÅbenForms. {{ $t('footer.license') }}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-neutral-400">{{ $t('footer.apiStatus') }}:</span>
            <span v-if="apiStatus.loading" class="text-warning-400">{{ $t('footer.connecting') }}...</span>
            <span v-else-if="apiStatus.error" class="text-error-400">{{ $t('footer.offline') }}</span>
            <span v-else class="flex items-center gap-2 text-success-400">
              <span class="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
              {{ $t('footer.online') }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { fetchApiIndex } = useApi()

// Test API connection
const apiStatus = ref<{ loading: boolean; data?: any; error?: string }>({
  loading: true
})

const showSuccess = ref(false)

onMounted(async () => {
  try {
    const data = await fetchApiIndex()
    apiStatus.value = { loading: false, data }
  } catch (error: any) {
    apiStatus.value = { loading: false, error: error.message }
  }
})

// Feature cards
const features = [
  { icon: '🔄', titleKey: 'features.workflows.title', descKey: 'features.workflows.description' },
  { icon: '🏢', titleKey: 'features.multiTenant.title', descKey: 'features.multiTenant.description' },
  { icon: '🇩🇰', titleKey: 'features.danish.title', descKey: 'features.danish.description' },
  { icon: '🔐', titleKey: 'features.security.title', descKey: 'features.security.description' }
]

// Use cases
const useCases = [
  {
    icon: '🏛️',
    titleKey: 'useCases.municipal.title',
    descKey: 'useCases.municipal.desc',
    examples: ['useCases.municipal.ex1', 'useCases.municipal.ex2', 'useCases.municipal.ex3']
  },
  {
    icon: '🏢',
    titleKey: 'useCases.business.title',
    descKey: 'useCases.business.desc',
    examples: ['useCases.business.ex1', 'useCases.business.ex2', 'useCases.business.ex3']
  },
  {
    icon: '🎓',
    titleKey: 'useCases.education.title',
    descKey: 'useCases.education.desc',
    examples: ['useCases.education.ex1', 'useCases.education.ex2', 'useCases.education.ex3']
  }
]

// Demo forms
const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const applicationForm = ref({
  cpr: '',
  address: '',
  category: '',
  description: ''
})

const subjectOptions = [
  { value: 'general', label: t('demo.forms.contact.subjects.general') },
  { value: 'support', label: t('demo.forms.contact.subjects.support') },
  { value: 'demo', label: t('demo.forms.contact.subjects.demo') },
  { value: 'other', label: t('demo.forms.contact.subjects.other') }
]

const categoryOptions = [
  { value: 'building', label: t('demo.forms.application.categories.building') },
  { value: 'social', label: t('demo.forms.application.categories.social') },
  { value: 'education', label: t('demo.forms.application.categories.education') },
  { value: 'other', label: t('demo.forms.application.categories.other') }
]

const handleContactSubmit = () => {
  console.log('Contact form submitted:', contactForm.value)
  showSuccess.value = true
  setTimeout(() => (showSuccess.value = false), 5000)
  contactForm.value = { name: '', email: '', subject: '', message: '' }
}

const handleApplicationSubmit = () => {
  console.log('Application form submitted:', applicationForm.value)
  showSuccess.value = true
  setTimeout(() => (showSuccess.value = false), 5000)
  applicationForm.value = { cpr: '', address: '', category: '', description: '' }
}

const scrollToDemo = () => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
}
</script>
