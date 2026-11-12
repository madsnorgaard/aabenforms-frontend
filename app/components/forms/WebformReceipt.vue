<template>
  <section
    class="webform-receipt success"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :aria-label="$t('form.receiptHeading')"
  >
    <FdsAlert type="success" :heading="$t('form.receiptHeading')" heading-level="h2" class="webform-receipt__alert">
      <p v-if="formTitle" class="webform-receipt__form-title">{{ formTitle }}</p>
      <p v-else class="webform-receipt__form-title">{{ $t('form.receiptLead') }}</p>
    </FdsAlert>

    <dl class="webform-receipt__meta">
      <div class="webform-receipt__meta-row">
        <dt>{{ $t('form.receiptReceivedAt') }}</dt>
        <dd><time :datetime="submittedAt.toISOString()">{{ formattedDate }}</time></dd>
      </div>
      <div v-if="reference" class="webform-receipt__meta-row">
        <dt>{{ $t('form.receiptReference') }}</dt>
        <dd class="webform-receipt__reference">{{ reference }}</dd>
      </div>
      <div v-if="recipient?.name" class="webform-receipt__meta-row">
        <dt>{{ $t('form.recipient') }}</dt>
        <dd>{{ recipient.name }}<template v-if="recipient.department">, {{ recipient.department }}</template></dd>
      </div>
    </dl>

    <section v-if="rows.length" class="webform-receipt__section" :aria-labelledby="`${headingId}-sent`">
      <h3 :id="`${headingId}-sent`">{{ $t('form.youSent') }}</h3>
      <WebformSummary :rows="rows" :editable="false" />
    </section>

    <section class="webform-receipt__section" :aria-labelledby="`${headingId}-next`">
      <h3 :id="`${headingId}-next`">{{ $t('form.whatHappensNow') }}</h3>
      <div v-if="nextStepsHtml" class="webform-receipt__next" v-html="nextStepsHtml" />
      <p v-else>{{ $t('form.receiptDefaultNext') }}</p>
      <p v-if="expectedResponse" class="webform-receipt__expected">
        <strong>{{ $t('form.expectedResponse') }}:</strong> {{ expectedResponse }}
      </p>
    </section>

    <section v-if="hasContact" class="webform-receipt__section" :aria-labelledby="`${headingId}-contact`">
      <h3 :id="`${headingId}-contact`">{{ $t('form.contactHeading') }}</h3>
      <p class="webform-receipt__contact">
        <span v-if="recipient?.name" class="webform-receipt__contact-line">{{ recipient.name }}<template v-if="recipient.department">, {{ recipient.department }}</template></span>
        <span v-if="recipient?.phone" class="webform-receipt__contact-line">{{ $t('form.contactPhone') }}: <a :href="`tel:${telHref(recipient.phone)}`">{{ recipient.phone }}</a></span>
        <span v-if="recipient?.email" class="webform-receipt__contact-line">{{ $t('form.contactEmail') }}: <a :href="`mailto:${recipient.email}`">{{ recipient.email }}</a></span>
        <span v-if="recipient?.hours" class="webform-receipt__contact-line">{{ $t('form.contactHours') }}: {{ recipient.hours }}</span>
      </p>
    </section>

    <div class="webform-receipt__actions">
      <FdsButton type="button" variant="secondary" class="webform-receipt__print" @click="print">
        {{ $t('form.printReceipt') }}
      </FdsButton>
    </div>
  </section>
</template>

<script setup lang="ts">
// Kvittering after a successful submit. Replaces the form; the landmark is
// role="status" with aria-live so a screen reader announces the receipt. No
// vendor content: only what the citizen needs (KL component 10).
import { useI18n } from 'vue-i18n'
import WebformSummary, { type WebformSummaryRow } from '~/components/forms/WebformSummary.vue'

export interface WebformRecipient {
  name?: string | null
  department?: string | null
  phone?: string | null
  email?: string | null
  hours?: string | null
}

const props = defineProps<{
  formTitle?: string
  submittedAt: Date
  reference?: string | null
  rows: WebformSummaryRow[]
  /** Trusted admin HTML (gedisa.next_steps or settings.confirmation_message). */
  nextStepsHtml?: string | null
  expectedResponse?: string | null
  recipient?: WebformRecipient | null
}>()

const { locale } = useI18n()
const headingId = `${useId()}-receipt`

const formattedDate = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'da-DK', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(props.submittedAt),
)

const hasContact = computed(() =>
  !!(props.recipient?.phone || props.recipient?.email || props.recipient?.hours),
)

function telHref(phone: string): string {
  return phone.replace(/[^+\d]/g, '')
}

function print() {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
</script>

<style scoped>
.webform-receipt__form-title {
  margin: 0;
}

.webform-receipt__meta {
  margin: 1.5rem 0 0;
}

.webform-receipt__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1rem;
  padding: 0.25rem 0;
}

.webform-receipt__meta-row dt {
  font-weight: 600;
  min-width: 8rem;
}

.webform-receipt__meta-row dd {
  margin: 0;
}

.webform-receipt__reference {
  font-variant-numeric: tabular-nums;
}

.webform-receipt__section {
  margin-top: 2rem;
}

.webform-receipt__contact-line {
  display: block;
}

.webform-receipt__actions {
  margin-top: 2rem;
}

@media print {
  .webform-receipt__actions {
    display: none;
  }
}
</style>
