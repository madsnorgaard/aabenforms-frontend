<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div
          :class="['modal-container', sizeClass]"
          @click.stop
          ref="modalRef"
        >
          <!-- Header -->
          <div class="modal-header">
            <h2 :id="titleId" class="modal-title">
              <slot name="title">{{ title }}</slot>
            </h2>
            <button
              @click="close"
              class="modal-close"
              type="button"
              :aria-label="$t('common.close') || 'Close'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer || showFooter" class="modal-footer">
            <slot name="footer">
              <button
                v-if="showCancel"
                @click="cancel"
                class="modal-button modal-button-secondary"
                type="button"
              >
                {{ cancelText }}
              </button>
              <button
                v-if="showConfirm"
                @click="confirm"
                class="modal-button modal-button-primary"
                type="button"
              >
                {{ confirmText }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdrop?: boolean
  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  cancelText?: string
  confirmText?: string
}>(), {
  size: 'md',
  closeOnBackdrop: true,
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  cancelText: 'Cancel',
  confirmText: 'Confirm'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
  close: []
}>()

const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`
const modalRef = ref<HTMLElement | null>(null)

// Focus trap for accessibility
const { activate, deactivate } = useFocusTrap(modalRef, {
  immediate: true,
  allowOutsideClick: true,
  escapeDeactivates: true
})

const sizeClass = computed(() => `modal-${props.size}`)

function close() {
  emit('update:modelValue', false)
  emit('close')
  deactivate()
}

function cancel() {
  emit('cancel')
  close()
}

function confirm() {
  emit('confirm')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    close()
  }
}

// Handle ESC key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    close()
  }
}

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    activate()
  } else {
    document.body.style.overflow = ''
    deactivate()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
  deactivate()
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  overflow-y: auto;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: auto;
}

/* Sizes */
.modal-sm {
  max-width: 400px;
}

.modal-md {
  max-width: 600px;
}

.modal-lg {
  max-width: 800px;
}

.modal-xl {
  max-width: 1200px;
}

.modal-full {
  max-width: 95vw;
  max-height: 95vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.modal-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-close:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.modal-close svg {
  width: 24px;
  height: 24px;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.modal-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-height: 44px;
  min-width: 88px;
}

.modal-button-primary {
  background: #007acc;
  color: white;
}

.modal-button-primary:hover {
  background: #005a9e;
}

.modal-button-primary:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

.modal-button-secondary {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
}

.modal-button-secondary:hover {
  border-color: #999;
  color: #333;
}

.modal-button-secondary:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .modal-container {
    max-height: 95vh;
    margin: 0;
    border-radius: 12px 12px 0 0;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-button {
    width: 100%;
  }
}
</style>
