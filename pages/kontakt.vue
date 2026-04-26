<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="border-b border-neutral-200 bg-white">
      <div class="max-w-3xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2.5 text-sm font-bold text-neutral-900 hover:opacity-80 transition-opacity">
          <img src="/favicon.svg" alt="" class="w-8 h-8 flex-shrink-0" />
          <span>ÅbenForms</span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <LanguageSwitcher />
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M13 8H3m4-4l-4 4 4 4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ $t('demo.byggetilladelse.complete.gotoLanding') }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 lg:px-8 py-16">
      <p class="text-xs font-semibold tracking-widest uppercase text-primary-600 mb-3">
        {{ $t('kontakt.title') }}
      </p>
      <h1 class="text-3xl font-bold text-neutral-900 tracking-tight mb-3">
        {{ $t('kontakt.heading') }}
      </h1>
      <p class="text-neutral-600 leading-relaxed mb-8">
        {{ $t('kontakt.lead') }}
      </p>

      <div class="rounded-2xl border border-neutral-200 bg-white p-6 lg:p-8">
        <form v-if="!submitted" @submit.prevent="handleSubmit" class="space-y-4">
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
            :options="subjectOptions"
            required
          />
          <UiTextarea
            v-model="contactForm.message"
            :label="$t('demo.forms.contact.message')"
            :placeholder="$t('demo.forms.contact.messagePlaceholder')"
            required
            :rows="5"
          />
          <UiButton type="submit" variant="primary" full-width :disabled="submitting">
            {{ submitting ? '...' : $t('demo.forms.contact.submit') }}
          </UiButton>
          <p v-if="errorMessage" class="text-sm text-error-700">{{ errorMessage }}</p>
        </form>

        <div v-else class="text-center py-8">
          <div class="inline-flex w-12 h-12 items-center justify-center rounded-full bg-success-100 mb-4">
            <svg class="w-6 h-6 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-neutral-900 mb-2">{{ $t('kontakt.successTitle') }}</h2>
          <p class="text-sm text-neutral-500">{{ $t('kontakt.successMessage') }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public

useHead({ title: t('kontakt.title') })

const contactForm = ref({ name: '', email: '', subject: '', message: '' })
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const subjectOptions = computed(() => [
  { label: t('demo.forms.contact.subjects.general'), value: 'general' },
  { label: t('demo.forms.contact.subjects.support'), value: 'support' },
  { label: t('demo.forms.contact.subjects.demo'), value: 'demo' },
  { label: t('demo.forms.contact.subjects.other'), value: 'other' },
])

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''
  try {
    await $fetch(`${apiBase}/api/webform/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: { data: { ...contactForm.value } },
    })
    submitted.value = true
  }
  catch (e: any) {
    errorMessage.value = e?.data?.message || 'Submission failed - backend may be offline'
  }
  finally {
    submitting.value = false
  }
}
</script>
