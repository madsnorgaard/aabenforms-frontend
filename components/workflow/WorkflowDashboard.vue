<template>
  <div class="workflow-dashboard">
    <div class="dashboard-header">
      <h1>{{ $t('workflow.myTasks') }}</h1>
      <p class="subtitle">{{ $t('workflow.taskCount', { count: tasks.length }) }}</p>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="activeFilter = filter.value"
        :class="['filter-tab', { active: activeFilter === filter.value }]"
      >
        {{ filter.label }}
        <span v-if="filter.count > 0" class="badge">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('workflow.loadingTasks') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p class="error-message">{{ error }}</p>
      <button @click="loadTasks" class="retry-button">
        {{ $t('workflow.retry') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v3h10V5h2v14z"/>
      </svg>
      <p>{{ $t('workflow.noTasks') }}</p>
    </div>

    <!-- Task List -->
    <div v-else class="task-list">
      <WorkflowTaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        @action="handleTaskAction"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="pagination-button"
      >
        {{ $t('workflow.previous') }}
      </button>
      <span class="pagination-info">
        {{ $t('workflow.pageInfo', { current: currentPage, total: totalPages }) }}
      </span>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="pagination-button"
      >
        {{ $t('workflow.next') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkflowTask } from '~/types/workflow'

const { fetchResource, postResource } = useApi()
const { t } = useI18n()

// State
const tasks = ref<WorkflowTask[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending')
const currentPage = ref(1)
const pageSize = 10

// Filters
const filters = computed(() => [
  {
    value: 'all',
    label: t('workflow.filterAll'),
    count: tasks.value.length,
  },
  {
    value: 'pending',
    label: t('workflow.filterPending'),
    count: tasks.value.filter(t => t.status === 'pending').length,
  },
  {
    value: 'approved',
    label: t('workflow.filterApproved'),
    count: tasks.value.filter(t => t.status === 'approved').length,
  },
  {
    value: 'rejected',
    label: t('workflow.filterRejected'),
    count: tasks.value.filter(t => t.status === 'rejected').length,
  },
])

// Filtered tasks based on active filter
const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (activeFilter.value !== 'all') {
    filtered = filtered.filter(task => task.status === activeFilter.value)
  }

  // Paginate
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filtered.slice(start, end)
})

// Total pages for pagination
const totalPages = computed(() => {
  const filtered = activeFilter.value === 'all'
    ? tasks.value
    : tasks.value.filter(task => task.status === activeFilter.value)
  return Math.ceil(filtered.length / pageSize)
})

// Load tasks from backend
async function loadTasks() {
  loading.value = true
  error.value = null

  try {
    // Fetch workflow tasks assigned to current user
    const response = await fetchResource('workflow_task/workflow_task', {
      params: {
        'filter[assigned_to]': 'current_user',
        'sort': '-created',
      },
    })

    if (response.data) {
      tasks.value = Array.isArray(response.data)
        ? response.data.map(mapTaskFromApi)
        : [mapTaskFromApi(response.data)]
    }
  } catch (e: any) {
    error.value = e.message || t('workflow.loadError')
  } finally {
    loading.value = false
  }
}

// Map API response to WorkflowTask type
function mapTaskFromApi(apiTask: any): WorkflowTask {
  return {
    id: apiTask.id,
    title: apiTask.attributes.title || 'Untitled Task',
    description: apiTask.attributes.description || '',
    status: apiTask.attributes.status || 'pending',
    priority: apiTask.attributes.priority || 'normal',
    dueDate: apiTask.attributes.due_date,
    assignedTo: apiTask.attributes.assigned_to,
    submittedBy: apiTask.attributes.submitted_by,
    formData: apiTask.attributes.form_data || {},
    workflowId: apiTask.attributes.workflow_id,
    created: apiTask.attributes.created,
  }
}

// Handle task action (approve, reject, etc.)
async function handleTaskAction(action: { taskId: string; action: string; comment?: string }) {
  try {
    loading.value = true

    await postResource(`workflow_task/workflow_task/${action.taskId}/action`, {
      data: {
        type: 'workflow_task_action',
        attributes: {
          action: action.action,
          comment: action.comment || '',
        },
      },
    })

    // Reload tasks after action
    await loadTasks()

    // Show success message
    // TODO: Add toast notification
  } catch (e: any) {
    error.value = e.message || t('workflow.actionError')
  } finally {
    loading.value = false
  }
}

// Load tasks on mount
onMounted(() => {
  loadTasks()
})

// Reset to page 1 when filter changes
watch(activeFilter, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.workflow-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.filter-tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-tab:hover {
  color: #007acc;
  background: #f5f5f5;
}

.filter-tab.active {
  color: #007acc;
  border-bottom-color: #007acc;
}

.badge {
  background: #007acc;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-tab.active .badge {
  background: white;
  color: #007acc;
}

.loading-state,
.error-state,
.empty-state {
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

.error-icon,
.empty-icon {
  width: 64px;
  height: 64px;
  color: #999;
  margin: 0 auto 1rem;
}

.error-icon {
  color: #c00;
}

.error-message {
  color: #c00;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.5rem 1.5rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #005a9e;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #007acc;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #666;
}
</style>
