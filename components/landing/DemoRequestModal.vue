<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
        @click.self="$emit('close')"
      >
        <div class="max-w-md w-full rounded-xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 overflow-hidden">
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 border-b border-neutral-100">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-neutral-900">{{ $t('demoRequest.title') }}</h3>
              <button @click="$emit('close')" class="text-neutral-400 hover:text-neutral-600 transition-colors p-1">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="2">
                  <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <p class="text-sm text-neutral-500 mt-1">{{ $t('demoRequest.subtitle') }}</p>
          </div>

          <!-- Success state -->
          <div v-if="submitted" class="px-6 py-10 text-center">
            <div class="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-neutral-900 mb-2">{{ $t('demoRequest.successTitle') }}</h3>
            <p class="text-sm text-neutral-500">{{ $t('demoRequest.successMessage') }}</p>
          </div>

          <!-- Form -->
          <form v-else @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
            <UiInput
              v-model="form.name"
              :label="$t('demoRequest.name')"
              :placeholder="$t('demoRequest.namePlaceholder')"
              required
            />
            <UiInput
              v-model="form.email"
              type="email"
              :label="$t('demoRequest.email')"
              :placeholder="$t('demoRequest.emailPlaceholder')"
              required
            />
            <UiInput
              v-model="form.organization"
              :label="$t('demoRequest.organization')"
              :placeholder="$t('demoRequest.organizationPlaceholder')"
              required
            />
            <UiTextarea
              v-model="form.message"
              :label="$t('demoRequest.message')"
              :placeholder="$t('demoRequest.messagePlaceholder')"
              :rows="3"
            />

            <div v-if="errorMessage" class="rounded-lg border border-error-200 bg-error-50 p-3 text-xs text-error-700">
              {{ errorMessage }}
            </div>

            <UiButton type="submit" variant="primary" full-width :disabled="submitting">
              {{ submitting ? $t('demoRequest.submitting') : $t('demoRequest.submit') }}
            </UiButton>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const form = ref({ name: '', email: '', organization: '', message: '' })
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''
  try {
    await $fetch(`${apiBase}/api/webform/demo_request/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: { data: { ...form.value } },
    })
    submitted.value = true
  } catch (e: any) {
    errorMessage.value = e?.data?.message || t('demoRequest.error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-enter-active { transition: opacity 0.25s ease; }
.modal-enter-active > div { animation: modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@keyframes modalIn {
  from { opacity: 0; transform: translateY(24px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
