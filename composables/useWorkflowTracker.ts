/**
 * Composable for workflow execution tracking
 *
 * Provides helper functions for working with the WorkflowExecutionTracker component
 * and managing workflow status polling.
 */

import type { WorkflowExecution, WorkflowStep } from '~/types/workflow'

export function useWorkflowTracker() {
  const { fetchResource } = useApi()

  /**
   * Fetch workflow execution status by ID
   */
  async function fetchExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const response = await fetchResource(`workflow/execution/${executionId}/status`)

      if (response.data) {
        return mapApiResponseToExecution(response.data)
      }

      return null
    } catch (error: any) {
      console.error('Failed to fetch workflow execution status:', error)
      throw error
    }
  }

  /**
   * Fetch workflow execution status by workflow ID
   * (Returns the most recent execution)
   */
  async function fetchWorkflowStatus(workflowId: string): Promise<WorkflowExecution | null> {
    try {
      const response = await fetchResource(`workflow/execution/status`, {
        params: {
          workflow_id: workflowId,
        }
      })

      if (response.data) {
        return mapApiResponseToExecution(response.data)
      }

      return null
    } catch (error: any) {
      console.error('Failed to fetch workflow status:', error)
      throw error
    }
  }

  /**
   * Map API response to WorkflowExecution type
   */
  function mapApiResponseToExecution(data: any): WorkflowExecution {
    const attributes = data.attributes || {}

    return {
      id: data.id || attributes.execution_id || 'unknown',
      workflowId: attributes.workflow_id || '',
      status: attributes.status || 'running',
      submittedAt: attributes.submitted_at || attributes.created || new Date().toISOString(),
      completedAt: attributes.completed_at,
      steps: mapSteps(attributes.steps || []),
      name: attributes.workflow_name,
      submissionId: attributes.submission_id
    }
  }

  /**
   * Map API steps to WorkflowStep array
   */
  function mapSteps(apiSteps: any[]): WorkflowStep[] {
    return apiSteps.map((step, index) => {
      // Calculate duration if both timestamps exist
      let duration: number | undefined
      if (step.started_at && step.completed_at) {
        const start = new Date(step.started_at).getTime()
        const end = new Date(step.completed_at).getTime()
        duration = end - start
      }

      return {
        id: step.id || step.task_id || `step-${index}`,
        name: step.name || step.title || `Step ${index + 1}`,
        description: step.description,
        status: mapStepStatus(step.status),
        startedAt: step.started_at,
        completedAt: step.completed_at,
        duration,
        error: step.error || step.error_message,
        isBranching: step.is_branching || false,
        branches: step.branches || []
      }
    })
  }

  /**
   * Map API status to standard step status
   */
  function mapStepStatus(apiStatus: string): 'pending' | 'active' | 'completed' | 'failed' {
    const status = (apiStatus || 'pending').toLowerCase()

    if (['completed', 'complete', 'success', 'approved'].includes(status)) {
      return 'completed'
    }
    if (['active', 'running', 'in_progress', 'processing'].includes(status)) {
      return 'active'
    }
    if (['failed', 'error', 'rejected'].includes(status)) {
      return 'failed'
    }
    return 'pending'
  }

  /**
   * Calculate overall progress percentage
   */
  function calculateProgress(execution: WorkflowExecution): number {
    if (!execution.steps.length) return 0

    const completedCount = execution.steps.filter(
      step => step.status === 'completed'
    ).length

    return Math.round((completedCount / execution.steps.length) * 100)
  }

  /**
   * Get workflow display name from workflow ID
   */
  function getWorkflowDisplayName(workflowId: string): string {
    const names: Record<string, string> = {
      'parking_permit': 'Parking Permit Application',
      'marriage_booking': 'Marriage Booking',
      'building_permit': 'Building Permit Application',
      'contact_form': 'Contact Form',
      'company_verification': 'Company Verification',
      'foi_request': 'Freedom of Information Request',
      'address_change': 'Address Change Request',
      'daycare_enrollment': 'Daycare Enrollment'
    }
    return names[workflowId] || 'Workflow'
  }

  /**
   * Check if workflow is complete
   */
  function isWorkflowComplete(execution: WorkflowExecution): boolean {
    return execution.status === 'completed'
  }

  /**
   * Check if workflow has failed
   */
  function hasWorkflowFailed(execution: WorkflowExecution): boolean {
    return execution.status === 'failed' ||
           execution.steps.some(step => step.status === 'failed')
  }

  /**
   * Get current active step
   */
  function getCurrentStep(execution: WorkflowExecution): WorkflowStep | null {
    return execution.steps.find(step => step.status === 'active') || null
  }

  /**
   * Get completed steps count
   */
  function getCompletedStepsCount(execution: WorkflowExecution): number {
    return execution.steps.filter(step => step.status === 'completed').length
  }

  /**
   * Format duration in human-readable format
   */
  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Format timestamp in relative format
   */
  function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return 'just now'
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('da-DK', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  return {
    // API methods
    fetchExecutionStatus,
    fetchWorkflowStatus,

    // Helper methods
    calculateProgress,
    getWorkflowDisplayName,
    isWorkflowComplete,
    hasWorkflowFailed,
    getCurrentStep,
    getCompletedStepsCount,

    // Formatting methods
    formatDuration,
    formatRelativeTime
  }
}
