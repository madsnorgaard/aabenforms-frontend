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

/**
 * Workflow execution step
 */
export interface WorkflowStep {
  /**
   * Step ID (UUID or task ID)
   */
  id: string

  /**
   * Step name/title
   */
  name: string

  /**
   * Step description
   */
  description?: string

  /**
   * Current status of the step
   */
  status: 'pending' | 'active' | 'completed' | 'failed'

  /**
   * When the step started (ISO 8601)
   */
  startedAt?: string

  /**
   * When the step completed (ISO 8601)
   */
  completedAt?: string

  /**
   * Step duration in milliseconds
   */
  duration?: number

  /**
   * Error message if failed
   */
  error?: string

  /**
   * Whether this step represents a branching point
   */
  isBranching?: boolean

  /**
   * Parallel branches if this is a branching step
   */
  branches?: Array<{
    id: string
    name: string
    status: string
  }>
}

/**
 * Workflow execution tracking
 */
export interface WorkflowExecution {
  /**
   * Execution ID (UUID)
   */
  id: string

  /**
   * Workflow ID this execution belongs to
   */
  workflowId: string

  /**
   * Overall execution status
   */
  status: 'running' | 'completed' | 'failed'

  /**
   * When the workflow was submitted (ISO 8601)
   */
  submittedAt: string

  /**
   * When the workflow completed (ISO 8601)
   */
  completedAt?: string

  /**
   * Array of workflow steps
   */
  steps: WorkflowStep[]

  /**
   * Workflow name/title
   */
  name?: string

  /**
   * Form submission ID if triggered by a form
   */
  submissionId?: string
}
