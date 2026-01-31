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

            <!-- Login Button -->
            <div class="sm:ml-4">
              <LoginButton />
            </div>
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

    <!-- Workflow Demo Section -->
    <section id="demo" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-neutral-900 mb-4">
            {{ $t('workflow.title') }}
          </h2>
          <p class="text-xl text-neutral-600 max-w-3xl mx-auto">
            {{ $t('workflow.subtitle') }}
          </p>
        </div>

        <!-- Workflow Visualization -->
        <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 mb-12 border-2 border-primary-200">
          <h3 class="text-2xl font-bold text-neutral-900 mb-6 text-center">
            {{ $t('workflow.example.title') }}
          </h3>

          <!-- Multi-Party Workflow Steps -->
          <div class="space-y-6">
            <div
              v-for="(step, index) in workflowSteps"
              :key="index"
              class="flex items-start gap-4"
            >
              <!-- Step Number -->
              <div class="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {{ index + 1 }}
              </div>

              <!-- Step Content -->
              <div class="flex-1 bg-white rounded-lg p-6 shadow-sm border border-primary-200">
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-3xl">{{ step.icon }}</span>
                  <div>
                    <h4 class="text-lg font-semibold text-neutral-900">
                      {{ $t(step.actorKey) }}
                    </h4>
                    <p class="text-sm text-neutral-600">{{ $t(step.roleKey) }}</p>
                  </div>
                </div>
                <p class="text-neutral-700 mb-3">
                  {{ $t(step.actionKey) }}
                </p>

                <!-- Integrations Used -->
                <div v-if="step.integrations" class="flex flex-wrap gap-2">
                  <span
                    v-for="integration in step.integrations"
                    :key="integration"
                    class="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                  >
                    <span>{{ getIntegrationIcon(integration) }}</span>
                    {{ $t(`workflow.integrations.${integration}`) }}
                  </span>
                </div>
              </div>

              <!-- Arrow to next step -->
              <div v-if="index < workflowSteps.length - 1" class="flex-shrink-0 w-12 flex justify-center">
                <div class="text-2xl text-primary-400">↓</div>
              </div>
            </div>
          </div>

          <!-- ECA Highlight -->
          <div class="mt-8 bg-success-50 border-2 border-success-200 rounded-lg p-6">
            <div class="flex items-start gap-3">
              <span class="text-3xl">⚡</span>
              <div>
                <h4 class="text-lg font-semibold text-success-900 mb-2">
                  {{ $t('workflow.eca.title') }}
                </h4>
                <p class="text-success-800 mb-3">
                  {{ $t('workflow.eca.description') }}
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="benefit in ecaBenefits"
                    :key="benefit"
                    class="flex items-start gap-2 text-sm text-success-900"
                  >
                    <span class="text-success-600 font-bold">✓</span>
                    {{ $t(`workflow.eca.benefits.${benefit}`) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive Demo Forms -->
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
                :placeholder="$t('demo.forms.contact.namePlaceholder')"
                required
              />
              <UiInput
                v-model="contactForm.email"
                type="email"
                :label="$t('demo.forms.contact.email')"
                :placeholder="$t('demo.forms.contact.emailPlaceholder')"
                required
              />
              <UiSelect
                v-model="contactForm.subject"
                :label="$t('demo.forms.contact.subject')"
                :placeholder="$t('demo.forms.contact.selectSubject')"
                :options="contactSubjects"
                required
              />
              <UiTextarea
                v-model="contactForm.message"
                :label="$t('demo.forms.contact.message')"
                :placeholder="$t('demo.forms.contact.messagePlaceholder')"
                required
                :rows="5"
              />
              <UiButton type="submit" variant="primary" size="lg" full-width>
                {{ $t('demo.forms.contact.submit') }}
              </UiButton>
            </form>
          </div>

          <!-- Building Permit Step 1 Demo -->
          <div class="bg-neutral-50 rounded-xl p-8 border-2 border-success-200">
            <h3 class="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <span class="text-success-600">🏗️</span>
              {{ $t('demo.forms.permit.title') }}
            </h3>
            <div class="mb-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p class="text-sm text-primary-900">
                <strong>{{ $t('demo.forms.permit.step') }}</strong> {{ $t('demo.forms.permit.stepInfo') }}
              </p>
            </div>
            <form @submit.prevent="handlePermitSubmit" class="space-y-4">
              <UiInput
                v-model="permitForm.cpr"
                :label="$t('demo.forms.permit.cpr')"
                placeholder="DDMMÅÅ-XXXX"
                required
              >
                <template #help>
                  <span class="text-xs text-primary-600">
                    🔐 {{ $t('demo.forms.permit.cprHelp') }}
                  </span>
                </template>
              </UiInput>
              <UiInput
                v-model="permitForm.address"
                :label="$t('demo.forms.permit.address')"
                :placeholder="$t('demo.forms.permit.addressPlaceholder')"
                required
              >
                <template #help>
                  <span class="text-xs text-neutral-500">
                    {{ $t('demo.forms.permit.addressHelp') }}
                  </span>
                </template>
              </UiInput>
              <UiSelect
                v-model="permitForm.buildingType"
                :label="$t('demo.forms.permit.buildingType')"
                :placeholder="$t('demo.forms.permit.selectType')"
                :options="buildingTypes"
                required
              />
              <UiTextarea
                v-model="permitForm.description"
                :label="$t('demo.forms.permit.description')"
                required
                :rows="4"
              />

              <!-- File Upload Simulation -->
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  {{ $t('demo.forms.permit.documents') }}
                </label>
                <div class="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer">
                  <span class="text-4xl mb-2 block">📎</span>
                  <p class="text-sm text-neutral-600">{{ $t('demo.forms.permit.uploadHelp') }}</p>
                  <p class="text-xs text-neutral-500 mt-1">{{ $t('demo.forms.permit.uploadFormats') }}</p>
                </div>
              </div>

              <div class="bg-success-50 border border-success-200 rounded-lg p-4">
                <p class="text-sm text-success-900">
                  <strong class="font-semibold">{{ $t('demo.security.title') }}:</strong>
                  {{ $t('demo.security.message') }}
                </p>
              </div>

              <UiButton type="submit" variant="secondary" size="lg" full-width>
                {{ $t('demo.forms.permit.submit') }}
              </UiButton>
            </form>
          </div>
        </div>

        <!-- Demo Success Message -->
        <div v-if="showSuccess" class="mt-8 bg-success-100 border-2 border-success-300 rounded-lg p-8 text-center">
          <div class="text-5xl mb-4">✅</div>
          <h3 class="text-2xl font-bold text-success-900 mb-3">
            {{ $t('demo.success.title') }}
          </h3>
          <p class="text-success-800 mb-4">
            {{ $t('demo.success.message') }}
          </p>
          <UiButton variant="secondary" @click="showSuccess = false">
            {{ $t('demo.success.close') }}
          </UiButton>
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
        <UiButton variant="secondary" size="lg">
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
            <span v-else class="text-success-400">{{ $t('footer.online') }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { fetchApiIndex } = useApi()

// Features data
const features = [
  { icon: '🔄', titleKey: 'features.workflows.title', descKey: 'features.workflows.description' },
  { icon: '🏢', titleKey: 'features.multiTenant.title', descKey: 'features.multiTenant.description' },
  { icon: '🇩🇰', titleKey: 'features.danish.title', descKey: 'features.danish.description' },
  { icon: '🔐', titleKey: 'features.security.title', descKey: 'features.security.description' }
]

// Workflow steps for building permit
const workflowSteps = [
  {
    icon: '👤',
    actorKey: 'workflow.steps.citizen.actor',
    roleKey: 'workflow.steps.citizen.role',
    actionKey: 'workflow.steps.citizen.action',
    integrations: ['mitid', 'cpr', 'dawa']
  },
  {
    icon: '👔',
    actorKey: 'workflow.steps.caseworker.actor',
    roleKey: 'workflow.steps.caseworker.role',
    actionKey: 'workflow.steps.caseworker.action',
    integrations: ['digitalpost', 'sbsys']
  },
  {
    icon: '🔧',
    actorKey: 'workflow.steps.technical.actor',
    roleKey: 'workflow.steps.technical.role',
    actionKey: 'workflow.steps.technical.action',
    integrations: null
  },
  {
    icon: '✅',
    actorKey: 'workflow.steps.approval.actor',
    roleKey: 'workflow.steps.approval.role',
    actionKey: 'workflow.steps.approval.action',
    integrations: ['digitalpost', 'pdf']
  }
]

// ECA benefits
const ecaBenefits = [
  'visual',
  'modern',
  'flexible',
  'headless'
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

// Form data
const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const permitForm = ref({
  cpr: '',
  address: '',
  buildingType: '',
  description: ''
})

const contactSubjects = [
  { label: t('demo.forms.contact.subjects.general'), value: 'general' },
  { label: t('demo.forms.contact.subjects.support'), value: 'support' },
  { label: t('demo.forms.contact.subjects.demo'), value: 'demo' },
  { label: t('demo.forms.contact.subjects.other'), value: 'other' }
]

const buildingTypes = [
  { label: t('demo.forms.permit.types.extension'), value: 'extension' },
  { label: t('demo.forms.permit.types.garage'), value: 'garage' },
  { label: t('demo.forms.permit.types.carport'), value: 'carport' },
  { label: t('demo.forms.permit.types.other'), value: 'other' }
]

const showSuccess = ref(false)

// API status
const apiStatus = ref<{ loading: boolean; data?: any; error?: string }>({
  loading: true
})

// Methods
const scrollToDemo = () => {
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
}

const handleContactSubmit = () => {
  showSuccess.value = true
  contactForm.value = { name: '', email: '', subject: '', message: '' }
}

const handlePermitSubmit = () => {
  showSuccess.value = true
  permitForm.value = { cpr: '', address: '', buildingType: '', description: '' }
}

const getIntegrationIcon = (integration: string): string => {
  const icons: Record<string, string> = {
    mitid: '🔐',
    cpr: '👤',
    cvr: '🏢',
    dawa: '📍',
    digitalpost: '✉️',
    sbsys: '📋',
    pdf: '📄'
  }
  return icons[integration] || '🔧'
}

// Check API status on mount
onMounted(async () => {
  try {
    const data = await fetchApiIndex()
    apiStatus.value = { loading: false, data }
  } catch (error: any) {
    apiStatus.value = { loading: false, error: error.message }
  }
})
</script>
