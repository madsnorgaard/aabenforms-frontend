/**
 * Payment-related TypeScript types for ÅbenForms
 */

/**
 * Supported payment methods
 */
export type PaymentMethodId = 'nets_easy' | 'credit_card' | 'mobilepay' | 'bank_transfer'

/**
 * Payment method configuration
 */
export interface PaymentMethod {
  id: PaymentMethodId
  name: string
  description?: string
  enabled: boolean
}

/**
 * Payment receipt/confirmation
 */
export interface PaymentReceipt {
  transactionId: string
  paymentMethod: string
  amount: number
  date: string
  status?: 'success' | 'pending' | 'failed'
  workflowId?: string
}

/**
 * Payment validation result
 */
export interface PaymentValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Payment request payload for backend API
 */
export interface PaymentRequest {
  workflow_id: string
  payment_method: PaymentMethodId
  amount: number
  currency: 'DKK' | 'EUR' | 'USD'
  metadata?: Record<string, any>
}

/**
 * Payment response from backend API
 */
export interface PaymentResponse {
  payment_id: string
  transaction_id: string
  status: 'success' | 'pending' | 'failed'
  amount: number
  currency: string
  payment_method: string
  created_at: string
  redirect_url?: string
  error_message?: string
}

/**
 * Payment error response
 */
export interface PaymentError {
  message: string
  code?: string
  details?: Record<string, any>
}
