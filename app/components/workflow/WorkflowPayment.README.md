# WorkflowPayment Component

A comprehensive Vue 3 payment component for ÅbenForms workflows with support for multiple payment methods, form validation, and Danish/English localization.

## Features

- **Multiple Payment Methods**: Nets Easy, Credit Card, MobilePay, Bank Transfer
- **Form Validation**: Amount > 0, valid payment method selection
- **Processing States**: Loading spinner with payment-specific messages
- **Success/Error Handling**: Confirmation receipt with download, retry on failure
- **Backend Integration**: `/api/workflow/payment` endpoint
- **Localization**: Danish and English translations (i18n)
- **TypeScript**: Full type safety with proper interfaces
- **Responsive Design**: Mobile-friendly UI with Tailwind-inspired styling

## Usage

### Basic Example

```vue
<template>
  <WorkflowPayment
    :amount="500"
    :workflow-id="workflowId"
    title="Parking Permit Payment"
    @complete="handlePaymentComplete"
  />
</template>

<script setup lang="ts">
import type { PaymentReceipt } from '~/types/payment'

const workflowId = ref('workflow-123')

function handlePaymentComplete(receipt: PaymentReceipt) {
  console.log('Payment completed:', receipt)
  // Navigate to next step or show confirmation
}
</script>
```

### Advanced Example with All Options

```vue
<template>
  <WorkflowPayment
    :amount="1250"
    :workflow-id="workflowId"
    title="Building Permit Application Fee"
    description="Payment for building permit processing"
    :show-cancel="true"
    :enabled-methods="['nets_easy', 'credit_card']"
    @complete="handleComplete"
    @cancel="handleCancel"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import type { PaymentReceipt } from '~/types/payment'

const workflowId = ref('workflow-456')

function handleComplete(receipt: PaymentReceipt) {
  console.log('Payment successful:', receipt)
  navigateTo(`/workflow/${workflowId.value}/confirmation`)
}

function handleCancel() {
  console.log('Payment cancelled')
  navigateTo('/workflow/tasks')
}

function handleError(error: string) {
  console.error('Payment error:', error)
  // Show error notification
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `amount` | `number` | **required** | Payment amount in DKK (must be > 0) |
| `workflowId` | `string` | **required** | Workflow ID for payment tracking |
| `title` | `string` | `'Payment'` | Payment form title |
| `description` | `string` | `''` | Optional description text |
| `showCancel` | `boolean` | `true` | Show cancel button |
| `enabledMethods` | `PaymentMethodId[]` | `['nets_easy', 'credit_card']` | Available payment methods |

### Payment Method IDs

- `'nets_easy'` - Nets Easy (Dankort, Visa, Mastercard)
- `'credit_card'` - Credit Card (Visa, Mastercard, Amex)
- `'mobilepay'` - MobilePay
- `'bank_transfer'` - Bank Transfer/Invoice

## Events

### `@complete`

Emitted when payment is successfully processed.

**Payload**: `PaymentReceipt`

```typescript
interface PaymentReceipt {
  transactionId: string
  paymentMethod: string
  amount: number
  date: string
  status?: 'success' | 'pending' | 'failed'
}
```

### `@cancel`

Emitted when user clicks the cancel button.

**Payload**: none

### `@error`

Emitted when payment processing fails.

**Payload**: `string` (error message)

## Validation

The component validates:

1. **Amount**: Must be greater than 0
2. **Payment Method**: Must be selected
3. **Workflow ID**: Must be provided

Validation errors are displayed inline above the payment methods.

## Backend API Integration

The component calls the backend payment endpoint:

```
POST /api/workflow/payment
```

**Request Body**:

```json
{
  "workflow_id": "workflow-123",
  "payment_method": "nets_easy",
  "amount": 500,
  "currency": "DKK"
}
```

**Expected Response**:

```json
{
  "payment_id": "pay_abc123",
  "transaction_id": "txn_xyz789",
  "status": "success",
  "amount": 500,
  "currency": "DKK",
  "payment_method": "nets_easy",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## States

### 1. Initial State
- Display payment amount
- Show payment method selection
- Pay and Cancel buttons

### 2. Processing State
- Loading spinner
- Method-specific processing message
- User cannot interact

### 3. Success State
- Success icon and message
- Payment receipt with:
  - Transaction ID
  - Payment method
  - Amount
  - Date/time
- Download receipt button
- Continue button

### 4. Error State
- Error icon and message
- Retry button to return to initial state

## Localization

The component uses i18n for all user-facing text. Translations are in:

- Danish: `/locales/da.json` under `payment.*`
- English: `/locales/en.json` under `payment.*`

### Adding Custom Translations

```json
{
  "payment": {
    "amount": "Amount",
    "selectMethod": "Select payment method",
    "processing": "Processing payment...",
    "successTitle": "Payment Successful!",
    "errorTitle": "Payment Failed"
  }
}
```

## Styling

The component uses scoped CSS with CSS variables for easy theming. Key classes:

- `.workflow-payment` - Root container
- `.payment-amount` - Amount display box
- `.method-button` - Payment method selector
- `.processing-state` - Loading state
- `.success-state` - Success confirmation
- `.error-state` - Error display

### Customization

Override styles in your page:

```vue
<style>
.workflow-payment {
  --primary-color: #007acc;
  --error-color: #c62828;
  --success-color: #2e7d32;
}
</style>
```

## TypeScript Types

Import types from `~/types/payment`:

```typescript
import type {
  PaymentMethod,
  PaymentReceipt,
  PaymentMethodId,
  PaymentRequest,
  PaymentResponse
} from '~/types/payment'
```

## Accessibility

- Keyboard navigation support
- ARIA labels on buttons
- Screen reader friendly error messages
- Focus management during state changes

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Related Components

- `WorkflowDashboard.vue` - Task management dashboard
- `TaskCard.vue` - Individual task display
- `AppointmentPicker.vue` - Appointment scheduling

## License

GPL-2.0 - Part of ÅbenForms
