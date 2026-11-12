<template>
  <div class="workflow-tracker" role="region" :aria-label="`${workflowName || 'Workflow'} ${$t('tracker.progress') || 'progress tracker'}`">
    <!-- Header -->
    <div class="tracker-header">
      <h2 class="tracker-title" id="tracker-title">{{ workflowName || 'Workflow Progress' }}</h2>
      <div class="tracker-meta">
        <span v-if="execution?.submittedAt" class="meta-item">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          Started {{ formatTimestamp(execution.submittedAt) }}
        </span>
        <span v-if="execution?.id" class="meta-item tracking-id">
          Tracking ID: {{ execution.id.substring(0, 8) }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !execution" class="loading-state">
      <div class="spinner"></div>
      <p>Loading workflow status...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchStatus" class="retry-button">
        Retry
      </button>
    </div>

    <!-- Step Indicator -->
    <div v-else-if="execution && steps.length > 0" class="steps-container">
      <!-- Progress Bar -->
      <div class="progress-bar-container" role="group" :aria-label="$t('tracker.progressBar') || 'Workflow progress'">
        <div
          class="progress-bar"
          role="progressbar"
          :aria-valuenow="progressPercentage"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${progressPercentage}% ${$t('tracker.complete') || 'complete'}`"
        >
          <div
            class="progress-fill"
            :style="{ width: `${progressPercentage}%` }"
            :class="{ 'progress-complete': isComplete, 'progress-failed': hasFailed }"
          ></div>
        </div>
        <div class="progress-label" aria-live="polite" aria-atomic="true">
          {{ completedStepsCount }} of {{ totalSteps }} steps completed
        </div>
      </div>

      <!-- Steps List -->
      <div class="steps-list" role="list" :aria-label="$t('tracker.steps') || 'Workflow steps'">
        <div
          v-for="(step, index) in steps"
          :key="step.id || index"
          class="step-item"
          role="listitem"
          :class="[
            `step-${step.status}`,
            { 'step-branching': step.isBranching }
          ]"
          :aria-current="step.status === 'active' ? 'step' : undefined"
        >
          <!-- Step Indicator -->
          <div class="step-indicator">
            <div class="step-number-container">
              <!-- Completed -->
              <div v-if="step.status === 'completed'" class="step-icon step-completed">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>

              <!-- Failed -->
              <div v-else-if="step.status === 'failed'" class="step-icon step-failed">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </div>

              <!-- Active -->
              <div v-else-if="step.status === 'active'" class="step-icon step-active">
                <div class="step-pulse"></div>
                <span class="step-number">{{ index + 1 }}</span>
              </div>

              <!-- Pending -->
              <div v-else class="step-icon step-pending">
                <span class="step-number">{{ index + 1 }}</span>
              </div>
            </div>

            <!-- Connector Line -->
            <div
              v-if="index < steps.length - 1"
              class="step-connector"
              :class="{ 'connector-completed': step.status === 'completed' }"
            ></div>
          </div>

          <!-- Step Content -->
          <div class="step-content">
            <div class="step-header">
              <h3 class="step-name">{{ step.name }}</h3>
              <span v-if="step.status === 'active'" class="step-badge badge-active">
                In Progress
              </span>
              <span v-else-if="step.status === 'completed'" class="step-badge badge-completed">
                Completed
              </span>
              <span v-else-if="step.status === 'failed'" class="step-badge badge-failed">
                Failed
              </span>
            </div>

            <p v-if="step.description" class="step-description">
              {{ step.description }}
            </p>

            <!-- Timestamps -->
            <div v-if="step.startedAt || step.completedAt" class="step-timestamps">
              <span v-if="step.startedAt" class="timestamp">
                <svg class="icon-small" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
                Started {{ formatTimestamp(step.startedAt) }}
              </span>
              <span v-if="step.completedAt" class="timestamp">
                <svg class="icon-small" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Completed {{ formatTimestamp(step.completedAt) }}
              </span>
              <span v-if="step.duration" class="timestamp duration">
                Duration: {{ formatDuration(step.duration) }}
              </span>
            </div>

            <!-- Error Message -->
            <div v-if="step.error" class="step-error">
              <svg class="icon-small" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {{ step.error }}
            </div>

            <!-- Branching Indicator -->
            <div v-if="step.isBranching && step.branches" class="step-branches">
              <div class="branch-label">
                <svg class="icon-small" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H6V5h7V3H6zm14 4V3l-4 4 4 4V8h-7V6h7z"/>
                </svg>
                Parallel branches
              </div>
              <div class="branch-list">
                <div
                  v-for="branch in step.branches"
                  :key="branch.id"
                  class="branch-item"
                  :class="`branch-${branch.status}`"
                >
                  <span class="branch-name">{{ branch.name }}</span>
                  <span class="branch-status">{{ branch.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Status -->
      <div
        v-if="isComplete || hasFailed"
        class="final-status"
        :class="{ 'status-success': isComplete && !hasFailed, 'status-failed': hasFailed }"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="status-icon" aria-hidden="true">
          <svg v-if="!hasFailed" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
          </svg>
        </div>
        <div class="status-content">
          <h3 class="status-title">
            {{ hasFailed ? 'Workflow Failed' : 'Workflow Completed Successfully' }}
          </h3>
          <p class="status-message">
            {{ finalMessage }}
          </p>
          <div v-if="execution.completedAt" class="status-timestamp">
            Completed {{ formatTimestamp(execution.completedAt) }}
          </div>
        </div>
      </div>

      <!-- Auto-refresh indicator -->
      <div
        v-if="!isComplete && !hasFailed && autoRefreshEnabled"
        class="auto-refresh-indicator"
        role="status"
        aria-live="polite"
      >
        <div class="refresh-pulse" aria-hidden="true"></div>
        <span>Auto-refreshing every {{ refreshInterval / 1000 }} seconds</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = withDefaults(defineProps<{
  executionId?: string
  workflowId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}>(), {
  autoRefresh: true,
  refreshInterval: 2000
})

// Types
interface WorkflowStep {
  id: string
  name: string
  description?: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  duration?: number
  error?: string
  isBranching?: boolean
  branches?: Array<{
    id: string
    name: string
    status: string
  }>
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  submittedAt: string
  completedAt?: string
  steps: WorkflowStep[]
}

// Composables
const { fetchResource } = useApi()

// State
const execution = ref<WorkflowExecution | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const refreshTimer = ref<NodeJS.Timeout | null>(null)
const workflowName = ref<string>('')

// Computed
const steps = computed((): WorkflowStep[] => {
  return execution.value?.steps || []
})

const totalSteps = computed((): number => {
  return steps.value.length
})

const completedStepsCount = computed((): number => {
  return steps.value.filter(step => step.status === 'completed').length
})

const progressPercentage = computed((): number => {
  if (totalSteps.value === 0) return 0
  return Math.round((completedStepsCount.value / totalSteps.value) * 100)
})

const isComplete = computed((): boolean => {
  return execution.value?.status === 'completed'
})

const hasFailed = computed((): boolean => {
  return execution.value?.status === 'failed' ||
         steps.value.some(step => step.status === 'failed')
})

const autoRefreshEnabled = computed((): boolean => {
  return props.autoRefresh && !isComplete.value && !hasFailed.value
})

const finalMessage = computed((): string => {
  if (hasFailed.value) {
    const failedStep = steps.value.find(step => step.status === 'failed')
    return failedStep?.error || 'The workflow encountered an error and could not complete.'
  }
  return 'Your application has been processed successfully. You will receive further updates via email.'
})

// Methods
async function fetchStatus() {
  try {
    error.value = null

    // Build API endpoint
    const endpoint = props.executionId
      ? `workflow/execution/${props.executionId}/status`
      : `workflow/execution/status?workflow_id=${props.workflowId}`

    const response = await fetchResource(endpoint)

    if (response.data) {
      const data = response.data

      // Map API response to execution object
      execution.value = {
        id: data.id || data.attributes?.execution_id || 'unknown',
        workflowId: data.attributes?.workflow_id || props.workflowId || '',
        status: data.attributes?.status || 'running',
        submittedAt: data.attributes?.submitted_at || data.attributes?.created || new Date().toISOString(),
        completedAt: data.attributes?.completed_at,
        steps: mapSteps(data.attributes?.steps || [])
      }

      // Set workflow name from response
      workflowName.value = data.attributes?.workflow_name || getWorkflowDisplayName(execution.value.workflowId)
    }

    loading.value = false

    // Schedule next refresh if needed
    if (autoRefreshEnabled.value) {
      scheduleRefresh()
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load workflow status'
    loading.value = false
  }
}

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
      status: mapStatus(step.status),
      startedAt: step.started_at,
      completedAt: step.completed_at,
      duration,
      error: step.error || step.error_message,
      isBranching: step.is_branching || false,
      branches: step.branches || []
    }
  })
}

function mapStatus(apiStatus: string): 'pending' | 'active' | 'completed' | 'failed' {
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

function getWorkflowDisplayName(workflowId: string): string {
  const names: Record<string, string> = {
    'parking_permit': 'Parking Permit Application',
    'marriage_booking': 'Marriage Booking',
    'building_permit': 'Building Permit Application',
    'contact_form': 'Contact Form',
    'company_verification': 'Company Verification',
    'foi_request': 'Freedom of Information Request',
    'address_change': 'Address Change Request'
  }
  return names[workflowId] || 'Workflow'
}

function formatTimestamp(timestamp: string): string {
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

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

function scheduleRefresh() {
  clearRefreshTimer()

  if (autoRefreshEnabled.value) {
    refreshTimer.value = setTimeout(() => {
      fetchStatus()
    }, props.refreshInterval)
  }
}

function clearRefreshTimer() {
  if (refreshTimer.value) {
    clearTimeout(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  fetchStatus()
})

onUnmounted(() => {
  clearRefreshTimer()
})
</script>

<style scoped>
.workflow-tracker {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.tracker-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.tracker-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.tracker-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #666;
}

.tracking-id {
  padding: 0.25rem 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8125rem;
}

.icon {
  width: 18px;
  height: 18px;
  color: #666;
}

.icon-small {
  width: 14px;
  height: 14px;
  color: inherit;
}

/* Loading & Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 122, 204, 0.2);
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #dc3545;
  margin: 0 auto 1rem;
}

.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.retry-button {
  padding: 0.625rem 1.5rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #005a9e;
}

/* Progress Bar */
.progress-bar-container {
  margin-bottom: 2rem;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007acc, #0098ff);
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}

.progress-fill.progress-complete {
  background: linear-gradient(90deg, #28a745, #34ce57);
}

.progress-fill.progress-failed {
  background: linear-gradient(90deg, #dc3545, #e74c3c);
}

.progress-label {
  text-align: center;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

/* Steps List */
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step-item {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-number-container {
  position: relative;
  z-index: 1;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.step-icon.step-pending {
  background: #f5f5f5;
  border: 2px solid #ddd;
  color: #999;
}

.step-icon.step-active {
  background: #007acc;
  border: 2px solid #007acc;
  color: white;
  position: relative;
}

.step-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #007acc;
  opacity: 0.4;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.step-icon.step-completed {
  background: #28a745;
  border: 2px solid #28a745;
  color: white;
}

.step-icon.step-completed svg {
  width: 24px;
  height: 24px;
}

.step-icon.step-failed {
  background: #dc3545;
  border: 2px solid #dc3545;
  color: white;
}

.step-icon.step-failed svg {
  width: 24px;
  height: 24px;
}

.step-connector {
  width: 2px;
  flex: 1;
  background: #ddd;
  margin-top: 0.5rem;
  transition: background 0.3s ease;
}

.step-connector.connector-completed {
  background: #28a745;
}

.step-content {
  flex: 1;
  padding-bottom: 1.5rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.step-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
}

.step-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-active {
  background: #e3f2fd;
  color: #007acc;
}

.badge-completed {
  background: #d4edda;
  color: #28a745;
}

.badge-failed {
  background: #f8d7da;
  color: #dc3545;
}

.step-description {
  color: #666;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
  font-size: 0.9375rem;
}

.step-timestamps {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #888;
}

.timestamp.duration {
  color: #007acc;
  font-weight: 500;
}

.step-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 0.875rem;
}

/* Branching */
.step-branches {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.branch-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.75rem;
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.branch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #ddd;
  font-size: 0.875rem;
}

.branch-item.branch-completed {
  border-left-color: #28a745;
}

.branch-item.branch-active {
  border-left-color: #007acc;
}

.branch-item.branch-failed {
  border-left-color: #dc3545;
}

.branch-name {
  color: #333;
  font-weight: 500;
}

.branch-status {
  color: #666;
  font-size: 0.8125rem;
  text-transform: capitalize;
}

/* Final Status */
.final-status {
  margin-top: 2rem;
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.final-status.status-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border: 2px solid #28a745;
}

.final-status.status-failed {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 2px solid #dc3545;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon svg {
  width: 48px;
  height: 48px;
}

.status-success .status-icon svg {
  color: #28a745;
}

.status-failed .status-icon svg {
  color: #dc3545;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.status-success .status-title {
  color: #155724;
}

.status-failed .status-title {
  color: #721c24;
}

.status-message {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 0.5rem 0;
}

.status-success .status-message {
  color: #155724;
}

.status-failed .status-message {
  color: #721c24;
}

.status-timestamp {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Auto-refresh indicator */
.auto-refresh-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #666;
}

.refresh-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007acc;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .workflow-tracker {
    padding: 1.5rem 1rem;
  }

  .tracker-title {
    font-size: 1.5rem;
  }

  .step-item {
    gap: 1rem;
  }

  .step-icon {
    width: 36px;
    height: 36px;
  }

  .step-name {
    font-size: 1rem;
  }

  .step-timestamps {
    flex-direction: column;
    gap: 0.5rem;
  }

  .final-status {
    flex-direction: column;
    padding: 1.5rem;
  }

  .status-title {
    font-size: 1.25rem;
  }
}
</style>
