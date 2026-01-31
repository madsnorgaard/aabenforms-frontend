/**
 * Workflow task assigned to a user for processing
 */
export interface WorkflowTask {
  /**
   * Task ID (UUID)
   */
  id: string

  /**
   * Task title/summary
   */
  title: string

  /**
   * Detailed description
   */
  description: string

  /**
   * Task status
   */
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'

  /**
   * Priority level
   */
  priority: 'low' | 'normal' | 'high' | 'urgent'

  /**
   * Due date (ISO 8601)
   */
  dueDate?: string

  /**
   * User ID the task is assigned to
   */
  assignedTo: string

  /**
   * User who submitted the original form
   */
  submittedBy: string

  /**
   * Form submission data
   */
  formData: Record<string, any>

  /**
   * Workflow ID this task belongs to
   */
  workflowId: string

  /**
   * Task creation timestamp
   */
  created: string
}

/**
 * Workflow definition from backend
 */
export interface Workflow {
  /**
   * Workflow ID
   */
  id: string

  /**
   * Workflow name
   */
  name: string

  /**
   * Description
   */
  description: string

  /**
   * BPMN definition
   */
  bpmn?: string

  /**
   * Enabled status
   */
  enabled: boolean

  /**
   * Associated webform ID
   */
  webformId?: string
}

/**
 * Task action types
 */
export type TaskAction = 'approve' | 'reject' | 'comment' | 'assign' | 'escalate'

/**
 * Task action payload
 */
export interface TaskActionPayload {
  taskId: string
  action: TaskAction
  comment?: string
  assignTo?: string
}
