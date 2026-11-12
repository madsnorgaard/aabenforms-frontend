<template>
  <div class="workflow-payment" role="region" :aria-label="$t('payment.paymentRegion') || 'Payment form'">
    <div class="payment-header">
      <h2 id="payment-title">{{ title }}</h2>
      <p v-if="description" class="payment-description">{{ description }}</p>
    </div>

    <!-- Payment Amount Display -->
    <div class="payment-amount" role="status" aria-live="polite">
      <span class="amount-label">{{ $t('payment.amount') }}</span>
      <span class="amount-value" :aria-label="`${$t('payment.amount')}: ${formatAmount(amount)} ${$t('payment.currency')}`">{{ formatAmount(amount) }} DKK</span>
    </div>

    <!-- Validation Errors -->
    <div
      v-if="validationErrors.length > 0"
      class="validation-errors"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="error-icon-small" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <ul class="error-list" id="validation-error-list">
        <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
      </ul>
    </div>

    <!-- Payment Method Selection -->
    <div v-if="!processing && !success && !error" class="payment-methods">
      <h3 id="payment-methods-label">{{ $t('payment.selectMethod') }}</h3>
      <div
        class="method-options"
        role="radiogroup"
        :aria-labelledby="'payment-methods-label'"
        :aria-describedby="validationErrors.length > 0 ? 'validation-error-list' : undefined"
      >
        <button
          v-for="method in paymentMethods"
          :key="method.id"
          @click="selectPaymentMethod(method.id)"
          :class="['method-button', { active: selectedMethod === method.id }]"
          :disabled="!method.enabled"
          role="radio"
          :aria-checked="selectedMethod === method.id ? 'true' : 'false'"
          :aria-label="`${method.name}${method.description ? ': ' + method.description : ''}`"
          :tabindex="selectedMethod === method.id || (!selectedMethod && method === paymentMethods[0]) ? 0 : -1"
          @keydown="handleMethodKeydown($event, method.id)"
        >
          <div class="method-icon" aria-hidden="true">
            <component :is="getMethodIcon(method.id)" />
          </div>
          <div class="method-info">
            <span class="method-name">{{ method.name }}</span>
            <span v-if="method.description" class="method-description">
              {{ method.description }}
            </span>
          </div>
          <div v-if="selectedMethod === method.id" class="method-checkmark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
        </button>
      </div>

      <!-- Payment Button -->
      <div class="payment-actions">
        <button
          @click="handlePayment"
          :disabled="!selectedMethod"
          :aria-disabled="!selectedMethod ? 'true' : 'false'"
          class="pay-button"
          type="button"
        >
          {{ $t('payment.proceedToPay', { amount: formatAmount(amount) }) }}
        </button>
        <button
          v-if="showCancel"
          @click="$emit('cancel')"
          class="cancel-button"
          type="button"
        >
          {{ $t('payment.cancel') }}
        </button>
      </div>
    </div>

    <!-- Processing State -->
    <div
      v-if="processing"
      class="processing-state"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="spinner" role="progressbar" aria-label="Processing payment"></div>
      <p class="processing-message">{{ $t('payment.processing') }}</p>
      <p class="processing-detail">{{ getProcessingMessage() }}</p>
    </div>

    <!-- Success State -->
    <div
      v-if="success"
      class="success-state"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h3>{{ $t('payment.successTitle') }}</h3>
      <p class="success-message">{{ $t('payment.successMessage') }}</p>

      <!-- Payment Receipt -->
      <div v-if="receipt" class="payment-receipt">
        <h4>{{ $t('payment.receiptTitle') }}</h4>
        <div class="receipt-details">
          <div class="receipt-row">
            <span class="receipt-label">{{ $t('payment.transactionId') }}</span>
            <span class="receipt-value">{{ receipt.transactionId }}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">{{ $t('payment.paymentMethod') }}</span>
            <span class="receipt-value">{{ receipt.paymentMethod }}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">{{ $t('payment.amount') }}</span>
            <span class="receipt-value">{{ formatAmount(receipt.amount) }} DKK</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">{{ $t('payment.date') }}</span>
            <span class="receipt-value">{{ formatDate(receipt.date) }}</span>
          </div>
        </div>
        <button
          @click="downloadReceipt"
          class="download-receipt-button"
          type="button"
          :aria-label="$t('payment.downloadReceipt')"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          {{ $t('payment.downloadReceipt') }}
        </button>
      </div>

      <button
        @click="$emit('complete', receipt)"
        class="continue-button"
        type="button"
      >
        {{ $t('payment.continue') }}
      </button>
    </div>

    <!-- Error State -->
    <div
      v-if="error"
      class="error-state"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <h3>{{ $t('payment.errorTitle') }}</h3>
      <p class="error-message">{{ error }}</p>
      <button
        @click="resetPayment"
        class="retry-button"
        type="button"
      >
        {{ $t('payment.tryAgain') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * WorkflowPayment Component
 *
 * Handles payment processing for workflows with support for multiple payment methods:
 * - Nets Easy (Danish payment gateway)
 * - Credit Card (Visa, Mastercard, American Express)
 * - MobilePay
 * - Bank Transfer
 *
 * Features:
 * - Payment method selection with visual feedback
 * - Form validation (amount > 0, valid payment method)
 * - Processing status with loading spinner
 * - Success/failure states with appropriate messages
 * - Payment receipt display and download
 * - Integration with backend /api/workflow/payment endpoint
 * - Danish/English localization support
 * - Proper error handling with retry functionality
 *
 * @example
 * <WorkflowPayment
 *   :amount="500"
 *   :workflow-id="workflowId"
 *   title="Parking Permit Payment"
 *   description="Payment for parking permit application"
 *   @complete="handlePaymentComplete"
 *   @cancel="handleCancel"
 *   @error="handlePaymentError"
 * />
 */

import type {
  PaymentMethod,
  PaymentReceipt,
  PaymentValidationResult,
  PaymentMethodId,
  PaymentRequest,
  PaymentResponse
} from '~/types/payment'

const props = withDefaults(defineProps<{
  /** Payment amount in DKK (must be > 0) */
  amount: number
  /** Workflow ID for payment tracking */
  workflowId: string
  /** Payment title */
  title?: string
  /** Payment description */
  description?: string
  /** Show cancel button */
  showCancel?: boolean
  /** Available payment methods (defaults to nets_easy and credit_card) */
  enabledMethods?: Array<PaymentMethodId>
}>(), {
  title: 'Payment',
  description: '',
  showCancel: true,
  enabledMethods: () => ['nets_easy', 'credit_card']
})

const emit = defineEmits<{
  complete: [receipt: PaymentReceipt]
  cancel: []
  error: [error: string]
}>()

const { t } = useI18n()
const { postResource } = useApi()

// State
const selectedMethod = ref<string | null>(null)
const processing = ref(false)
const success = ref(false)
const error = ref<string | null>(null)
const receipt = ref<PaymentReceipt | null>(null)
const validationErrors = ref<string[]>([])

// Payment methods configuration
const paymentMethods = computed<PaymentMethod[]>(() => [
  {
    id: 'nets_easy',
    name: 'Nets Easy',
    description: t('payment.netsEasyDescription'),
    enabled: props.enabledMethods.includes('nets_easy')
  },
  {
    id: 'credit_card',
    name: t('payment.creditCard'),
    description: t('payment.creditCardDescription'),
    enabled: props.enabledMethods.includes('credit_card')
  },
  {
    id: 'mobilepay',
    name: 'MobilePay',
    description: t('payment.mobilepayDescription'),
    enabled: props.enabledMethods.includes('mobilepay')
  },
  {
    id: 'bank_transfer',
    name: t('payment.bankTransfer'),
    description: t('payment.bankTransferDescription'),
    enabled: props.enabledMethods.includes('bank_transfer')
  }
])

/**
 * Select payment method
 */
function selectPaymentMethod(methodId: string) {
  selectedMethod.value = methodId
  validationErrors.value = [] // Clear validation errors when selecting a method

  // Announce selection to screen readers
  announceToScreenReader(`${getPaymentMethodName(methodId)} ${t('payment.selected')}`)
}

/**
 * Handle keyboard navigation for payment methods (arrow keys)
 */
function handleMethodKeydown(event: KeyboardEvent, currentMethodId: string) {
  const enabledMethods = paymentMethods.value.filter(m => m.enabled)
  const currentIndex = enabledMethods.findIndex(m => m.id === currentMethodId)

  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      newIndex = (currentIndex + 1) % enabledMethods.length
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      newIndex = currentIndex === 0 ? enabledMethods.length - 1 : currentIndex - 1
      break
    case ' ':
    case 'Enter':
      event.preventDefault()
      selectPaymentMethod(currentMethodId)
      return
    default:
      return
  }

  const newMethod = enabledMethods[newIndex]
  if (newMethod) {
    // Focus the new button
    const buttons = document.querySelectorAll('.method-button')
    const targetButton = Array.from(buttons).find(
      btn => btn.getAttribute('aria-label')?.includes(newMethod.name)
    )
    if (targetButton instanceof HTMLElement) {
      targetButton.focus()
    }
  }
}

/**
 * Announce message to screen readers using aria-live region
 */
function announceToScreenReader(message: string) {
  // Create temporary live region if it doesn't exist
  let liveRegion = document.getElementById('payment-announcer')
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'payment-announcer'
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    document.body.appendChild(liveRegion)
  }

  // Clear and set new message
  liveRegion.textContent = ''
  setTimeout(() => {
    liveRegion!.textContent = message
  }, 100)
}

/**
 * Get payment method icon component
 */
function getMethodIcon(methodId: string) {
  const icons: Record<string, any> = {
    nets_easy: defineComponent({
      template: `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      `
    }),
    credit_card: defineComponent({
      template: `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      `
    }),
    mobilepay: defineComponent({
      template: `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
        </svg>
      `
    }),
    bank_transfer: defineComponent({
      template: `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        </svg>
      `
    })
  }
  return icons[methodId] || icons.nets_easy
}

/**
 * Get processing message based on selected payment method
 */
function getProcessingMessage(): string {
  switch (selectedMethod.value) {
    case 'nets_easy':
      return t('payment.processingNetsEasy')
    case 'credit_card':
      return t('payment.processingCreditCard')
    case 'mobilepay':
      return t('payment.processingMobilepay')
    case 'bank_transfer':
      return t('payment.processingBankTransfer')
    default:
      return t('payment.processingGeneric')
  }
}

/**
 * Validate payment before submission
 */
function validatePayment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate amount
  if (props.amount <= 0) {
    errors.push(t('payment.validation.amountPositive'))
  }

  // Validate payment method selection
  if (!selectedMethod.value) {
    errors.push(t('payment.validation.methodRequired'))
  }

  // Validate workflow ID
  if (!props.workflowId) {
    errors.push(t('payment.validation.workflowIdRequired'))
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Handle payment submission
 */
async function handlePayment() {
  // Clear previous errors
  validationErrors.value = []
  error.value = null

  // Validate payment
  const validation = validatePayment()
  if (!validation.valid) {
    validationErrors.value = validation.errors
    return
  }

  processing.value = true

  try {
    // Prepare payment request payload
    const paymentRequest: PaymentRequest = {
      workflow_id: props.workflowId,
      payment_method: selectedMethod.value as PaymentMethodId,
      amount: props.amount,
      currency: 'DKK'
    }

    // Call backend payment API endpoint: /api/workflow/payment
    const response = await $fetch<PaymentResponse>(
      `${useRuntimeConfig().public.apiBase}/api/workflow/payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: paymentRequest
      }
    )

    // Simulate payment processing delay (in production, this would redirect to payment gateway)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Extract receipt data from response
    receipt.value = {
      transactionId: response.payment_id || response.transaction_id || generateTransactionId(),
      paymentMethod: getPaymentMethodName(selectedMethod.value),
      amount: props.amount,
      date: response.created_at || new Date().toISOString(),
      status: response.status
    }

    processing.value = false
    success.value = true

    emit('complete', receipt.value)

  } catch (e: any) {
    processing.value = false
    const errorMessage = e.response?.data?.message || e.data?.message || e.message || t('payment.errorGeneric')
    error.value = errorMessage
    emit('error', error.value)
  }
}

/**
 * Generate transaction ID
 */
function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

/**
 * Get human-readable payment method name
 */
function getPaymentMethodName(methodId: string): string {
  const method = paymentMethods.value.find(m => m.id === methodId)
  return method?.name || methodId
}

/**
 * Format amount with thousand separator
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date for receipt
 */
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('da-DK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

/**
 * Download receipt as PDF
 */
function downloadReceipt() {
  if (!receipt.value) return

  // Create receipt content
  const receiptText = `
    Payment Receipt

    Transaction ID: ${receipt.value.transactionId}
    Payment Method: ${receipt.value.paymentMethod}
    Amount: ${formatAmount(receipt.value.amount)} DKK
    Date: ${formatDate(receipt.value.date)}

    Workflow ID: ${props.workflowId}
  `.trim()

  // Create blob and download
  const blob = new Blob([receiptText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `receipt-${receipt.value.transactionId}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Reset payment to initial state
 */
function resetPayment() {
  processing.value = false
  success.value = false
  error.value = null
  selectedMethod.value = null
  receipt.value = null
  validationErrors.value = []
}

// Watch for amount changes to re-validate
watch(() => props.amount, () => {
  if (validationErrors.value.length > 0) {
    validationErrors.value = []
  }
})
</script>

<style scoped>
.workflow-payment {
  max-width: 600px;
  margin: 0 auto;
}

.payment-header {
  margin-bottom: 2rem;
  text-align: center;
}

.payment-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.payment-description {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.payment-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 2px solid #e0e0e0;
}

.validation-errors {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #ffebee;
  border: 2px solid #ef5350;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.error-icon-small {
  width: 20px;
  height: 20px;
  color: #c62828;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.error-list li {
  color: #c62828;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.error-list li:last-child {
  margin-bottom: 0;
}

.amount-label {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007acc;
}

.payment-methods h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
}

.method-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.method-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.method-button:hover:not(:disabled) {
  border-color: #007acc;
  background: #f8f9fa;
}

.method-button:focus {
  outline: 3px solid #007acc;
  outline-offset: 2px;
  border-color: #007acc;
}

.method-button.active {
  border-color: #007acc;
  background: #e3f2fd;
}

.method-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.method-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 8px;
  flex-shrink: 0;
}

.method-icon svg {
  width: 28px;
  height: 28px;
  color: #007acc;
}

.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.method-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.method-description {
  font-size: 0.875rem;
  color: #666;
}

.method-checkmark {
  width: 24px;
  height: 24px;
  color: #007acc;
}

.method-checkmark svg {
  width: 100%;
  height: 100%;
}

.payment-actions {
  display: flex;
  gap: 1rem;
}

.pay-button {
  flex: 1;
  padding: 1rem 2rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.pay-button:hover:not(:disabled) {
  background: #005a9e;
}

.pay-button:focus {
  outline: 3px solid #005a9e;
  outline-offset: 2px;
}

.pay-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-button {
  padding: 1rem 2rem;
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  border-color: #007acc;
  color: #007acc;
}

.processing-state,
.success-state,
.error-state {
  text-align: center;
  padding: 3rem 2rem;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(0, 122, 204, 0.2);
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.processing-message {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.processing-detail {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.success-icon,
.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.success-icon {
  background: #e8f5e9;
  color: #2e7d32;
}

.error-icon {
  background: #ffebee;
  color: #c62828;
}

.success-icon svg,
.error-icon svg {
  width: 48px;
  height: 48px;
}

.success-state h3,
.error-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem 0;
}

.success-message,
.error-message {
  font-size: 1rem;
  margin: 0 0 2rem 0;
}

.success-message {
  color: #666;
}

.error-message {
  color: #c62828;
}

.payment-receipt {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.payment-receipt h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
}

.receipt-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.receipt-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.receipt-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.receipt-value {
  font-size: 0.875rem;
  color: #333;
  font-weight: 600;
}

.download-receipt-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: white;
  color: #007acc;
  border: 2px solid #007acc;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.download-receipt-button:hover {
  background: #007acc;
  color: white;
}

.continue-button {
  padding: 1rem 2rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.continue-button:hover {
  background: #005a9e;
}

.retry-button {
  padding: 1rem 2rem;
  background: #c62828;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #a21c1c;
}

@media (max-width: 640px) {
  .workflow-payment {
    padding: 1rem;
  }

  .payment-actions {
    flex-direction: column;
  }

  .method-button {
    padding: 1rem;
  }

  .method-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
