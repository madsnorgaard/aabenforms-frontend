/**
 * Webform schema structure from Drupal
 */
export interface WebformSchema {
  id: string
  title: string
  description: string | null
  elements: Record<string, WebformElement>
  settings?: Record<string, any>
}

/**
 * Individual webform element configuration
 */
export interface WebformElement {
  '#type': string
  '#title'?: string
  '#description'?: string
  '#required'?: boolean
  '#default_value'?: any
  '#placeholder'?: string
  '#options'?: Record<string, string>
  '#multiple'?: boolean
  '#min'?: number
  '#max'?: number
  '#rows'?: number
  '#pattern'?: string
  '#states'?: Record<string, any>
  [key: string]: any
}

/**
 * Webform submission
 */
export interface WebformSubmission {
  id: string
  webformId: string
  data: Record<string, any>
  submittedAt: string
  status: 'draft' | 'completed' | 'locked'
  submittedBy?: string
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Form field types supported by the frontend
 */
export type FieldType =
  | 'textfield'
  | 'textarea'
  | 'email'
  | 'number'
  | 'tel'
  | 'select'
  | 'radios'
  | 'checkboxes'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'cpr'
  | 'cvr'
  | 'dawa_address'
  | 'hidden'
