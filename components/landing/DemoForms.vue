<template>
  <section id="demo" class="py-20 lg:py-28 bg-white border-t border-neutral-100">
    <div class="max-w-6xl mx-auto px-6 lg:px-8">
      <div class="max-w-2xl mb-14">
        <p class="text-xs font-semibold tracking-widest uppercase text-primary-600 mb-3">
          Interactive
        </p>
        <h2 class="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
          {{ $t('demo.forms.contact.title') }} &amp; {{ $t('demo.forms.permit.title') }}
        </h2>
        <p class="text-lg text-neutral-500">
          {{ $t('demo.security.message') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Contact Form -->
        <div class="relative rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden">
          <!-- Demo badge -->
          <div class="absolute top-4 right-4 z-10">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-warning-100 text-warning-700 border border-warning-200">
              <span class="w-1.5 h-1.5 rounded-full bg-warning-500" />
              Demo
            </span>
          </div>

          <div class="p-6 lg:p-8">
            <h3 class="text-lg font-bold text-neutral-900 mb-6">
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
                :rows="4"
              />
              <UiButton type="submit" variant="primary" full-width :disabled="submitting">
                {{ submitting ? '...' : $t('demo.forms.contact.submit') }}
              </UiButton>
            </form>
          </div>
        </div>

        <!-- Building Permit Form -->
        <div class="relative rounded-xl border border-neutral-200 bg-neutral-50/50 overflow-hidden">
          <!-- Demo badge -->
          <div class="absolute top-4 right-4 z-10">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-warning-100 text-warning-700 border border-warning-200">
              <span class="w-1.5 h-1.5 rounded-full bg-warning-500" />
              Demo
            </span>
          </div>

          <div class="p-6 lg:p-8">
            <h3 class="text-lg font-bold text-neutral-900 mb-2">
              {{ $t('demo.forms.permit.title') }}
            </h3>

            <!-- Step indicator -->
            <div class="flex items-center gap-2 mb-6">
              <div v-for="n in 4" :key="n"
                   class="h-1 flex-1 rounded-full"
                   :class="n === 1 ? 'bg-primary-500' : 'bg-neutral-200'" />
            </div>

            <form @submit.prevent="handlePermitSubmit" class="space-y-4">
              <UiInput
                v-model="permitForm.cpr"
                :label="$t('demo.forms.permit.cpr')"
                placeholder="DDMMYY-XXXX"
                :help-text="$t('demo.forms.permit.cprHelp')"
                required
              />
              <UiInput
                v-model="permitForm.address"
                :label="$t('demo.forms.permit.address')"
                :placeholder="$t('demo.forms.permit.addressPlaceholder')"
                :help-text="$t('demo.forms.permit.addressHelp')"
                required
              />
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
                :rows="3"
              />

              <!-- File upload area -->
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-1.5">
                  {{ $t('demo.forms.permit.documents') }}
                </label>
                <div class="border-2 border-dashed border-neutral-300 rounded-lg p-5 text-center hover:border-primary-300 transition-colors cursor-pointer bg-white">
                  <p class="text-sm text-neutral-500">{{ $t('demo.forms.permit.uploadHelp') }}</p>
                  <p class="text-xs text-neutral-400 mt-1">{{ $t('demo.forms.permit.uploadFormats') }}</p>
                </div>
              </div>

              <UiButton type="submit" variant="primary" full-width :disabled="submitting">
                {{ submitting ? '...' : $t('demo.forms.permit.submit') }}
              </UiButton>
            </form>
          </div>
        </div>
      </div>

      <!-- Error display -->
      <div v-if="errorMessage" class="mt-6 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
        {{ errorMessage }}
      </div>

      <!-- Success toast -->
      <Transition name="toast">
        <div v-if="showSuccess" class="fixed bottom-6 right-6 z-50 max-w-sm">
          <div class="rounded-xl border border-success-200 bg-white shadow-xl shadow-neutral-900/10 p-4 flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-success-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                <path d="M3 8.5l3.5 3.5L13 4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-neutral-900">{{ successMessage }}</p>
              <p class="text-xs text-neutral-500 mt-0.5">{{ $t('demo.success.message') }}</p>
            </div>
            <button
              @click="showSuccess = false"
              class="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              :aria-label="$t('demo.success.close')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public

const contactForm = ref({ name: '', email: '', subject: '', message: '' })
const permitForm = ref({ cpr: '', address: '', buildingType: '', description: '' })
const showSuccess = ref(false)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const contactSubjects = computed(() => [
  { label: t('demo.forms.contact.subjects.general'), value: 'general' },
  { label: t('demo.forms.contact.subjects.support'), value: 'support' },
  { label: t('demo.forms.contact.subjects.demo'), value: 'demo' },
  { label: t('demo.forms.contact.subjects.other'), value: 'other' },
])

const buildingTypes = computed(() => [
  { label: t('demo.forms.permit.types.extension'), value: 'extension' },
  { label: t('demo.forms.permit.types.garage'), value: 'garage' },
  { label: t('demo.forms.permit.types.carport'), value: 'carport' },
  { label: t('demo.forms.permit.types.other'), value: 'other' },
])

let successTimeout: ReturnType<typeof setTimeout> | null = null

const dismissSuccess = () => {
  showSuccess.value = false
  if (successTimeout) clearTimeout(successTimeout)
}

const showSuccessToast = (msg: string) => {
  successMessage.value = msg
  errorMessage.value = ''
  showSuccess.value = true
  if (successTimeout) clearTimeout(successTimeout)
  successTimeout = setTimeout(dismissSuccess, 6000)
}

const handleContactSubmit = async () => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<{ data: { id: string } }>(`${apiBase}/api/webform/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: { data: { ...contactForm.value } },
    })
    showSuccessToast(`Submission #${res.data?.id} created`)
    contactForm.value = { name: '', email: '', subject: '', message: '' }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Submission failed - backend may be offline'
  } finally {
    submitting.value = false
  }
}

const handlePermitSubmit = async () => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<{ data: { id: string } }>(`${apiBase}/api/webform/parent_request_form/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: {
        data: {
          child_name: permitForm.value.address,
          child_cpr: permitForm.value.cpr.replace(/[^0-9]/g, ''),
          parent1_email: 'demo@aabenforms.dk',
          parent2_email: 'demo@aabenforms.dk',
          parents_together: 'together',
          request_details: `${permitForm.value.buildingType}: ${permitForm.value.description}`,
        },
      },
    })
    showSuccessToast(`Submission #${res.data?.id} created - workflow triggered`)
    permitForm.value = { cpr: '', address: '', buildingType: '', description: '' }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Submission failed - backend may be offline'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.toast-enter-active {
  animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  animation: toastOut 0.3s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.97); }
}
</style>
