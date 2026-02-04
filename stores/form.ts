import { defineStore } from 'pinia'
import type { WebformSchema, WebformSubmission, ValidationError } from '~/types/webform'

interface FormState {
  // Current form being viewed/edited
  currentForm: WebformSchema | null
  currentFormId: string | null

  // Form data
  formData: Record<string, any>

  // Submission state
  submitting: boolean
  submitted: boolean

  // Error handling
  validationErrors: ValidationError[]
  submitError: string | null

  // Loading state
  loading: boolean

  // Cache of loaded forms
  formCache: Map<string, WebformSchema>

  // Submission history for current session
  submissions: WebformSubmission[]
}

/**
 * Form store for managing webform state
 * Handles form loading, data management, validation, and submission
 */
export const useFormStore = defineStore('form', {
  state: (): FormState => ({
    currentForm: null,
    currentFormId: null,
    formData: {},
    submitting: false,
    submitted: false,
    validationErrors: [],
    submitError: null,
    loading: false,
    formCache: new Map(),
    submissions: []
  }),

  getters: {
    /**
     * Check if current form is loaded
     */
    isFormLoaded: (state): boolean => {
      return state.currentForm !== null
    },

    /**
     * Get form title
     */
    formTitle: (state): string => {
      return state.currentForm?.title || 'Untitled Form'
    },

    /**
     * Get form description
     */
    formDescription: (state): string | null => {
      return state.currentForm?.description || null
    },

    /**
     * Check if form has validation errors
     */
    hasErrors: (state): boolean => {
      return state.validationErrors.length > 0
    },

    /**
     * Get errors for a specific field
     */
    getFieldErrors: (state) => (fieldName: string): string[] => {
      return state.validationErrors
        .filter(error => error.field === fieldName)
        .map(error => error.message)
    },

    /**
     * Check if form data is valid (client-side validation)
     */
    isValid: (state): boolean => {
      if (!state.currentForm) return false

      // Check required fields
      for (const [key, field] of Object.entries(state.currentForm.elements)) {
        if (field['#required'] && !state.formData[key]) {
          return false
        }
      }

      return true
    },

    /**
     * Get submission count for current session
     */
    submissionCount: (state): number => {
      return state.submissions.length
    }
  },

  actions: {
    /**
     * Load form schema from backend
     */
    async loadForm(formId: string, forceReload = false) {
      this.loading = true
      this.submitError = null
      this.validationErrors = []

      try {
        // Check cache first
        if (!forceReload && this.formCache.has(formId)) {
          const cached = this.formCache.get(formId)!
          this.currentForm = cached
          this.currentFormId = formId
          this.loading = false
          return cached
        }

        // Fetch from backend
        const { fetchResource } = useApi()
        const response = await fetchResource(`webform/webform/${formId}`)

        if (response.data) {
          const schema: WebformSchema = {
            id: response.data.id,
            title: response.data.attributes.title || formId,
            description: response.data.attributes.description || null,
            elements: response.data.attributes.elements || {},
            settings: response.data.attributes.settings || {}
          }

          // Cache the form
          this.formCache.set(formId, schema)

          this.currentForm = schema
          this.currentFormId = formId

          // Reset form data
          this.resetFormData()

          return schema
        }
      } catch (error) {
        console.error('Failed to load form:', error)
        this.submitError = 'Failed to load form. Please try again.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Set form field value
     */
    setFieldValue(fieldName: string, value: any) {
      this.formData[fieldName] = value

      // Clear validation errors for this field
      this.validationErrors = this.validationErrors.filter(
        error => error.field !== fieldName
      )
    },

    /**
     * Set multiple field values
     */
    setFormData(data: Record<string, any>) {
      this.formData = { ...this.formData, ...data }
    },

    /**
     * Reset form data to empty
     */
    resetFormData() {
      this.formData = {}
      this.validationErrors = []
      this.submitError = null
      this.submitted = false
    },

    /**
     * Validate form data
     */
    validateForm(): boolean {
      this.validationErrors = []

      if (!this.currentForm) {
        return false
      }

      // Validate required fields
      for (const [key, field] of Object.entries(this.currentForm.elements)) {
        if (field['#required'] && !this.formData[key]) {
          this.validationErrors.push({
            field: key,
            message: `${field['#title']} is required`
          })
        }

        // Email validation
        if (field['#type'] === 'email' && this.formData[key]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(this.formData[key])) {
            this.validationErrors.push({
              field: key,
              message: 'Please enter a valid email address'
            })
          }
        }
      }

      return this.validationErrors.length === 0
    },

    /**
     * Submit form to backend
     */
    async submitForm(): Promise<WebformSubmission | null> {
      if (!this.currentFormId || !this.currentForm) {
        throw new Error('No form loaded')
      }

      // Validate before submitting
      if (!this.validateForm()) {
        return null
      }

      this.submitting = true
      this.submitError = null

      try {
        const { postResource } = useApi()

        const payload = {
          data: {
            type: `webform_submission--${this.currentFormId}`,
            attributes: {
              webform_id: this.currentFormId,
              data: this.formData,
              in_draft: false
            }
          }
        }

        const response = await postResource(
          `webform_submission/${this.currentFormId}`,
          payload
        )

        if (response.data) {
          const submission: WebformSubmission = {
            id: response.data.id,
            webformId: this.currentFormId,
            data: this.formData,
            submittedAt: new Date().toISOString(),
            status: 'completed'
          }

          // Add to submission history
          this.submissions.push(submission)

          // Mark as submitted
          this.submitted = true

          // Reset form data after successful submission
          this.resetFormData()

          return submission
        }

        return null
      } catch (error: any) {
        console.error('Form submission failed:', error)

        // Handle validation errors from backend
        if (error.response?.data?.errors) {
          this.validationErrors = error.response.data.errors.map((err: any) => ({
            field: err.source?.pointer?.split('/').pop() || 'general',
            message: err.detail || 'Validation error'
          }))
          this.submitError = 'Please correct the errors below'
        } else {
          this.submitError = 'Submission failed. Please try again.'
        }

        throw error
      } finally {
        this.submitting = false
      }
    },

    /**
     * Save form as draft (for authenticated users)
     */
    async saveDraft(): Promise<boolean> {
      if (!this.currentFormId) {
        return false
      }

      try {
        const { postResource } = useApi()

        await postResource(`webform_submission/${this.currentFormId}`, {
          data: {
            type: `webform_submission--${this.currentFormId}`,
            attributes: {
              webform_id: this.currentFormId,
              data: this.formData,
              in_draft: true
            }
          }
        })

        return true
      } catch (error) {
        console.error('Failed to save draft:', error)
        return false
      }
    },

    /**
     * Load draft for authenticated user
     */
    async loadDraft(draftId: string) {
      try {
        const { fetchResource } = useApi()
        const response = await fetchResource(`webform_submission/webform_submission/${draftId}`)

        if (response.data) {
          this.formData = response.data.attributes.data || {}
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
        throw error
      }
    },

    /**
     * Clear current form
     */
    clearCurrentForm() {
      this.currentForm = null
      this.currentFormId = null
      this.resetFormData()
    },

    /**
     * Clear form cache
     */
    clearCache() {
      this.formCache.clear()
    }
  }
})
