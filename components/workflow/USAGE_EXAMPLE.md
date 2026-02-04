# WorkflowPayment Component - Usage Examples

## Example 1: Parking Permit Payment

```vue
<template>
  <div class="page-container">
    <h1>Parking Permit Application</h1>

    <WorkflowPayment
      :amount="750"
      :workflow-id="parkingWorkflowId"
      title="Parkeringskort Betaling"
      description="Betaling for parkeringskort ansøgning"
      :enabled-methods="['nets_easy', 'credit_card', 'mobilepay']"
      @complete="handlePaymentSuccess"
      @cancel="returnToApplication"
      @error="showPaymentError"
    />
  </div>
</template>

<script setup lang="ts">
import type { PaymentReceipt } from '~/types/payment'

const parkingWorkflowId = ref('parking-workflow-abc123')

async function handlePaymentSuccess(receipt: PaymentReceipt) {
  console.log('Payment completed:', receipt)

  // Show success notification
  useNotification().success('Betaling gennemført!')

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Navigate to confirmation page
  navigateTo(`/workflows/${parkingWorkflowId.value}/confirmation`)
}

function returnToApplication() {
  navigateTo(`/workflows/${parkingWorkflowId.value}/review`)
}

function showPaymentError(errorMessage: string) {
  useNotification().error(errorMessage)
}
</script>
```

## Example 2: Building Permit Fee (Custom Amount)

```vue
<template>
  <div class="payment-page">
    <WorkflowPayment
      :amount="calculatedFee"
      :workflow-id="buildingPermitId"
      title="Byggetilladelse Gebyr"
      :description="`Gebyr for ${applicationData.buildingType}`"
      :show-cancel="true"
      :enabled-methods="['nets_easy', 'credit_card', 'bank_transfer']"
      @complete="processPaymentComplete"
      @cancel="goBack"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const buildingPermitId = route.params.workflowId as string

// Calculate fee based on application data
const applicationData = ref({
  buildingType: 'Tilbygning',
  squareMeters: 50
})

const calculatedFee = computed(() => {
  const baseRate = 100
  const perSquareMeter = 15
  return baseRate + (applicationData.value.squareMeters * perSquareMeter)
})

function processPaymentComplete(receipt: PaymentReceipt) {
  // Store receipt in workflow
  saveReceiptToWorkflow(buildingPermitId, receipt)

  // Show receipt and next steps
  navigateTo(`/workflows/${buildingPermitId}/receipt?txn=${receipt.transactionId}`)
}

function goBack() {
  navigateTo(`/workflows/${buildingPermitId}`)
}
</script>
```

## Example 3: Marriage Booking with Deposit

```vue
<template>
  <div class="marriage-booking">
    <div v-if="!paymentCompleted">
      <h2>Bekræft Booking og Betal Depositum</h2>

      <div class="booking-summary">
        <p><strong>Dato:</strong> {{ selectedSlot.date }}</p>
        <p><strong>Tid:</strong> {{ selectedSlot.time }}</p>
        <p><strong>Lokation:</strong> Rådhuset, Aarhus</p>
      </div>

      <WorkflowPayment
        :amount="500"
        :workflow-id="marriageWorkflowId"
        title="Depositum for Vielsesceremoni"
        description="Depositum tilbagebetales ikke ved aflysning indenfor 14 dage før ceremonien"
        :enabled-methods="['nets_easy', 'credit_card', 'mobilepay']"
        @complete="handleDepositPaid"
      />
    </div>

    <div v-else>
      <h2>Booking Bekræftet!</h2>
      <p>Du vil modtage en bekræftelse via e-mail og Digital Post.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const marriageWorkflowId = ref('marriage-workflow-xyz')
const paymentCompleted = ref(false)
const selectedSlot = ref({
  date: '15. Juni 2024',
  time: '14:00'
})

async function handleDepositPaid(receipt: PaymentReceipt) {
  // Mark payment as completed
  paymentCompleted.value = true

  // Send confirmation email
  await sendBookingConfirmation(marriageWorkflowId.value, receipt)

  // Update workflow status
  await updateWorkflowStatus(marriageWorkflowId.value, 'payment_received')
}
</script>
```

## Example 4: Dynamic Workflow Payment Integration

```vue
<template>
  <div v-if="workflow">
    <WorkflowPayment
      v-if="workflow.requiresPayment"
      :amount="workflow.paymentAmount"
      :workflow-id="workflow.id"
      :title="workflow.paymentTitle"
      :description="workflow.paymentDescription"
      :enabled-methods="workflow.allowedPaymentMethods"
      :show-cancel="workflow.allowCancel"
      @complete="onPaymentComplete"
      @cancel="onPaymentCancel"
      @error="onPaymentError"
    />
  </div>
</template>

<script setup lang="ts">
import type { Workflow } from '~/types/workflow'
import type { PaymentReceipt, PaymentMethodId } from '~/types/payment'

const route = useRoute()
const workflowId = route.params.id as string

// Fetch workflow data from backend
const { data: workflow } = await useFetch<Workflow & {
  requiresPayment: boolean
  paymentAmount: number
  paymentTitle: string
  paymentDescription: string
  allowedPaymentMethods: PaymentMethodId[]
  allowCancel: boolean
}>(`/api/workflows/${workflowId}`)

async function onPaymentComplete(receipt: PaymentReceipt) {
  // Update workflow with payment info
  await $fetch(`/api/workflows/${workflowId}/complete-payment`, {
    method: 'POST',
    body: {
      receipt
    }
  })

  // Navigate to next workflow step
  navigateTo(`/workflows/${workflowId}/next-step`)
}

function onPaymentCancel() {
  navigateTo(`/workflows/${workflowId}`)
}

function onPaymentError(error: string) {
  console.error('Payment failed:', error)
}
</script>
```

## Example 5: Testing with Mock Data

```vue
<template>
  <div class="test-payment">
    <h1>Payment Component Test</h1>

    <div class="controls">
      <label>
        Amount:
        <input v-model.number="testAmount" type="number" min="1" />
      </label>

      <label>
        <input v-model="showCancel" type="checkbox" />
        Show Cancel Button
      </label>

      <label>
        Payment Methods:
        <select v-model="selectedMethods" multiple>
          <option value="nets_easy">Nets Easy</option>
          <option value="credit_card">Credit Card</option>
          <option value="mobilepay">MobilePay</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </label>
    </div>

    <WorkflowPayment
      :amount="testAmount"
      workflow-id="test-workflow-123"
      title="Test Payment"
      description="This is a test payment form"
      :show-cancel="showCancel"
      :enabled-methods="selectedMethods"
      @complete="logPaymentComplete"
      @cancel="logPaymentCancel"
      @error="logPaymentError"
    />
  </div>
</template>

<script setup lang="ts">
import type { PaymentReceipt, PaymentMethodId } from '~/types/payment'

const testAmount = ref(500)
const showCancel = ref(true)
const selectedMethods = ref<PaymentMethodId[]>(['nets_easy', 'credit_card'])

function logPaymentComplete(receipt: PaymentReceipt) {
  console.log(' Payment Complete:', receipt)
  alert(`Payment successful! Transaction ID: ${receipt.transactionId}`)
}

function logPaymentCancel() {
  console.log(' Payment Cancelled')
  alert('Payment was cancelled')
}

function logPaymentError(error: string) {
  console.error(' Payment Error:', error)
  alert(`Payment failed: ${error}`)
}
</script>

<style scoped>
.controls {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.controls label {
  display: block;
  margin-bottom: 1rem;
}

.controls input,
.controls select {
  margin-left: 0.5rem;
  padding: 0.5rem;
}

.controls select[multiple] {
  height: 120px;
}
</style>
```

## Integration with Backend API

### Backend Endpoint Implementation (Drupal)

The component expects a backend endpoint at `/api/workflow/payment` that handles payment processing:

```php
// In a custom Drupal module (e.g., aabenforms_workflow)

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Handles workflow payment processing.
 *
 * @return \Symfony\Component\HttpFoundation\JsonResponse
 */
public function processPayment(Request $request) {
  $data = json_decode($request->getContent(), TRUE);

  $workflow_id = $data['workflow_id'];
  $payment_method = $data['payment_method'];
  $amount = $data['amount'];
  $currency = $data['currency'];

  // Process payment with payment gateway
  $payment_result = $this->paymentService->process([
    'workflow_id' => $workflow_id,
    'payment_method' => $payment_method,
    'amount' => $amount,
    'currency' => $currency,
  ]);

  if ($payment_result['status'] === 'success') {
    return new JsonResponse([
      'payment_id' => $payment_result['payment_id'],
      'transaction_id' => $payment_result['transaction_id'],
      'status' => 'success',
      'amount' => $amount,
      'currency' => $currency,
      'payment_method' => $payment_method,
      'created_at' => date('c'),
    ], 200);
  }

  return new JsonResponse([
    'message' => 'Payment failed',
    'error' => $payment_result['error'],
  ], 400);
}
```

## Environment Configuration

Make sure your Nuxt config has the API base URL configured:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'https://aabenforms.ddev.site'
    }
  }
})
```

```bash
# .env
API_BASE_URL=https://aabenforms.ddev.site
```
