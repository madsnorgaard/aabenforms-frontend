<template>
  <div class="task-card" :class="`priority-${task.priority}`">
    <div class="task-header">
      <div class="task-info">
        <h3 class="task-title">{{ task.title }}</h3>
        <div class="task-meta">
          <span class="meta-item">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            {{ task.submittedBy }}
          </span>
          <span v-if="task.dueDate" class="meta-item">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            {{ formatDate(task.dueDate) }}
          </span>
        </div>
      </div>

      <div class="task-badges">
        <span class="status-badge" :class="`status-${task.status}`">
          {{ $t(`workflow.status.${task.status}`) }}
        </span>
        <span v-if="task.priority === 'high'" class="priority-badge">
          {{ $t('workflow.highPriority') }}
        </span>
      </div>
    </div>

    <p v-if="task.description" class="task-description">
      {{ task.description }}
    </p>

    <!-- Form Data Preview -->
    <div v-if="Object.keys(task.formData).length > 0" class="form-data-preview">
      <button @click="showFormData = !showFormData" class="toggle-data">
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        {{ $t('workflow.formData') }}
        <svg class="chevron" :class="{ open: showFormData }" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      <div v-if="showFormData" class="form-data-content">
        <dl class="data-list">
          <template v-for="(value, key) in task.formData" :key="key">
            <dt>{{ formatFieldName(key) }}</dt>
            <dd>{{ formatFieldValue(value) }}</dd>
          </template>
        </dl>
      </div>
    </div>

    <!-- Task Actions -->
    <div v-if="task.status === 'pending'" class="task-actions">
      <button
        @click="handleAction('approve')"
        class="action-button approve"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        {{ $t('workflow.approve') }}
      </button>

      <button
        @click="handleAction('reject')"
        class="action-button reject"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        {{ $t('workflow.reject') }}
      </button>

      <button
        @click="showCommentDialog = true"
        class="action-button comment"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
        {{ $t('workflow.addComment') }}
      </button>
    </div>

    <!-- Comment Dialog -->
    <div v-if="showCommentDialog" class="comment-dialog">
      <div class="dialog-overlay" @click="showCommentDialog = false"></div>
      <div class="dialog-content">
        <h4>{{ $t('workflow.addComment') }}</h4>
        <textarea
          v-model="comment"
          :placeholder="$t('workflow.commentPlaceholder')"
          rows="4"
          class="comment-input"
        ></textarea>
        <div class="dialog-actions">
          <button @click="showCommentDialog = false" class="cancel-button">
            {{ $t('workflow.cancel') }}
          </button>
          <button @click="submitComment" class="submit-button">
            {{ $t('workflow.submit') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkflowTask } from '~/types/workflow'

const props = defineProps<{
  task: WorkflowTask
}>()

const emit = defineEmits<{
  action: [{ taskId: string; action: string; comment?: string }]
}>()

const { t } = useI18n()

const showFormData = ref(false)
const showCommentDialog = ref(false)
const comment = ref('')

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return t('workflow.today')
  } else if (diffDays === 1) {
    return t('workflow.yesterday')
  } else if (diffDays < 7) {
    return t('workflow.daysAgo', { days: diffDays })
  } else {
    return date.toLocaleDateString()
  }
}

// Format field name (convert snake_case to Title Case)
function formatFieldName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Format field value for display
function formatFieldValue(value: any): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// Handle task action
function handleAction(action: string) {
  emit('action', {
    taskId: props.task.id,
    action,
  })
}

// Submit comment
function submitComment() {
  if (comment.value.trim()) {
    emit('action', {
      taskId: props.task.id,
      action: 'comment',
      comment: comment.value,
    })
    comment.value = ''
    showCommentDialog.value = false
  }
}
</script>

<style scoped>
.task-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s;
  position: relative;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-card.priority-high {
  border-left: 4px solid #ff6b6b;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.task-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.icon {
  width: 16px;
  height: 16px;
}

.task-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge,
.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.status-approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.priority-badge {
  background: #ff6b6b;
  color: white;
}

.task-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.form-data-preview {
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.toggle-data {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f9f9f9;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  transition: background 0.2s;
}

.toggle-data:hover {
  background: #f0f0f0;
}

.chevron {
  width: 16px;
  height: 16px;
  margin-left: auto;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

.form-data-content {
  padding: 1rem;
  background: white;
}

.data-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  margin: 0;
}

.data-list dt {
  font-weight: 600;
  color: #333;
}

.data-list dd {
  color: #666;
  margin: 0;
}

.task-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-button.approve {
  background: #28a745;
  color: white;
}

.action-button.approve:hover {
  background: #218838;
}

.action-button.reject {
  background: #dc3545;
  color: white;
}

.action-button.reject:hover {
  background: #c82333;
}

.action-button.comment {
  background: #6c757d;
  color: white;
}

.action-button.comment:hover {
  background: #5a6268;
}

.comment-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.dialog-content h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.comment-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
}

.comment-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.submit-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-button {
  background: #e0e0e0;
  color: #333;
}

.cancel-button:hover {
  background: #d0d0d0;
}

.submit-button {
  background: #007acc;
  color: white;
}

.submit-button:hover {
  background: #005a9e;
}
</style>
