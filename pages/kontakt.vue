<template>
  <div>
    <SiteHeader />

    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-8">
          <FdsErrorSummary :errors="summaryErrors" />

          <h1>{{ $t('kontakt.heading') }}</h1>
          <p class="font-lead">{{ $t('kontakt.lead') }}</p>

          <form v-if="!submitted" novalidate @submit.prevent="handleSubmit">
            <FdsInput
              id="kontakt-name"
              v-model="contactForm.name"
              :label="$t('demo.forms.contact.name')"
              :error="fieldErrors.name"
              autocomplete="name"
              width="l"
              required
            />
            <FdsInput
              id="kontakt-email"
              v-model="contactForm.email"
              type="email"
              :label="$t('demo.forms.contact.email')"
              :error="fieldErrors.email"
              autocomplete="email"
              inputmode="email"
              width="l"
              required
            />
            <FdsSelect
              id="kontakt-subject"
              v-model="contactForm.subject"
              :label="$t('demo.forms.contact.subject')"
              :placeholder="$t('demo.forms.contact.selectSubject')"
              :options="subjectOptions"
              :error="fieldErrors.subject"
              width="l"
              required
            />
            <FdsTextarea
              id="kontakt-message"
              v-model="contactForm.message"
              :label="$t('demo.forms.contact.message')"
              :error="fieldErrors.message"
              :rows="6"
              width="xl"
              required
            />

            <FdsAlert
              v-if="errorMessage"
              type="error"
              :heading="$t('form.submitError')"
              :text="errorMessage"
              class="mb-5"
            />

            <FdsButton type="submit" variant="primary" :disabled="submitting">
              {{ submitting ? $t('form.submitting') : $t('demo.forms.contact.submit') }}
            </FdsButton>
          </form>

          <FdsAlert
            v-else
            type="success"
            role="status"
            :heading="$t('kontakt.successTitle')"
            :text="$t('kontakt.successMessage')"
          />
        </div>
      </div>
    </main>

    <FdsFooter />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FdsErrorSummaryItem } from '~/components/fds/FdsErrorSummary.vue'

const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public

useHead({ title: t('kontakt.title') })

type ContactField = 'name' | 'email' | 'subject' | 'message'

const contactForm = ref<Record<ContactField, string>>({ name: '', email: '', subject: '', message: '' })
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Partial<Record<ContactField, string>>>({})
const summaryErrors = ref<FdsErrorSummaryItem[]>([])

const subjectOptions = computed(() => [
  { label: t('demo.forms.contact.subjects.general'), value: 'general' },
  { label: t('demo.forms.contact.subjects.support'), value: 'support' },
  { label: t('demo.forms.contact.subjects.demo'), value: 'demo' },
  { label: t('demo.forms.contact.subjects.other'), value: 'other' },
])

const FIELD_IDS: Record<ContactField, string> = {
  name: 'kontakt-name',
  email: 'kontakt-email',
  subject: 'kontakt-subject',
  message: 'kontakt-message',
}

// A field's own error clears as soon as the citizen edits it; the summary
// stays until the next submit (DKFDS Fejlopsummering pattern).
for (const key of Object.keys(FIELD_IDS) as ContactField[]) {
  watch(() => contactForm.value[key], () => {
    if (fieldErrors.value[key]) {
      delete fieldErrors.value[key]
    }
  })
}

function validate(): boolean {
  const errors: Partial<Record<ContactField, string>> = {}
  const form = contactForm.value
  if (!form.name.trim()) errors.name = t('fds.validation.nameRequired')
  if (!form.email.trim()) errors.email = t('fds.validation.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = t('fds.validation.emailInvalid')
  if (!form.subject) errors.subject = t('fds.validation.subjectRequired')
  if (!form.message.trim()) errors.message = t('fds.validation.messageRequired')

  fieldErrors.value = errors
  summaryErrors.value = (Object.keys(errors) as ContactField[]).map((key) => ({
    id: FIELD_IDS[key],
    message: errors[key] as string,
  }))
  return summaryErrors.value.length === 0
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validate()) {
    return
  }
  submitting.value = true
  try {
    await $fetch(`${apiBase}/api/webform/contact/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: { data: { ...contactForm.value } },
    })
    submitted.value = true
  }
  catch (e: any) {
    errorMessage.value = e?.data?.message || t('form.submitError')
  }
  finally {
    submitting.value = false
  }
}
</script>
