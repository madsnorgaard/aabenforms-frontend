<template>
  <!-- DKFDS modal (fds-modal). Opened and closed through the DKFDS Modal
       class, which owns the backdrop, the Escape key, body scroll lock and
       the focus trap (it makes every other body child inert, hence the
       fds-modal-container wrapper). -->
  <ClientOnly>
    <Teleport to="body">
      <div class="fds-modal-container">
        <div
          :id="modalId"
          ref="modalEl"
          class="fds-modal"
          aria-hidden="true"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`${modalId}-title`"
        >
          <div class="modal-content landing-demo-modal">
            <div class="modal-header">
              <h2 :id="`${modalId}-title`" class="modal-title">{{ $t('demoRequest.title') }}</h2>
              <button type="button" class="modal-close function-link" @click="hide">
                <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#close" /></svg>{{ $t('fds.header.close') }}
              </button>
            </div>
  
            <div class="modal-body">
              <FdsAlert
                v-if="submitted"
                type="success"
                role="status"
                heading-level="h3"
                :heading="$t('demoRequest.successTitle')"
                :text="$t('demoRequest.successMessage')"
              />
  
              <template v-else>
                <p>{{ $t('demoRequest.subtitle') }}</p>
  
                <form :id="`${modalId}-form`" @submit.prevent="handleSubmit">
                  <UiInput
                    v-model="form.name"
                    :label="$t('demoRequest.name')"
                    autocomplete="name"
                    required
                  />
                  <UiInput
                    v-model="form.email"
                    type="email"
                    :label="$t('demoRequest.email')"
                    autocomplete="email"
                    required
                  />
                  <UiInput
                    v-model="form.organization"
                    :label="$t('demoRequest.organization')"
                    autocomplete="organization"
                    required
                  />
                  <UiTextarea
                    v-model="form.message"
                    :label="$t('demoRequest.message')"
                    :rows="3"
                  />
  
                  <FdsAlert
                    v-if="errorMessage"
                    type="error"
                    :text="errorMessage"
                    class="mt-5"
                  />
                </form>
              </template>
            </div>
  
            <div class="modal-footer">
              <FdsButton
                v-if="!submitted"
                type="submit"
                variant="primary"
                :form="`${modalId}-form`"
                :disabled="submitting"
              >
                {{ submitting ? $t('demoRequest.submitting') : $t('demoRequest.submit') }}
              </FdsButton>
              <FdsButton v-else variant="secondary" @click="hide">
                {{ $t('fds.header.close') }}
              </FdsButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { apiBase } = useRuntimeConfig().public
const { $dkfds } = useNuxtApp() as any

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const modalId = 'landing-demo-request'
const modalEl = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null

const form = ref({ name: '', email: '', organization: '', message: '' })
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

function modal() {
  return modalEl.value && $dkfds ? new $dkfds.lib.Modal(modalEl.value) : null
}

function show() {
  opener = document.activeElement as HTMLElement | null
  modal()?.show()
}

function hide() {
  if (modalEl.value?.getAttribute('aria-hidden') === 'false') {
    modal()?.hide()
  }
}

// DKFDS fires this for the close button, Escape and a backdrop click alike.
// It fires before the inert attributes are lifted, so focus the opener on
// the next tick.
function onHidden() {
  const target = opener
  opener = null
  setTimeout(() => target?.focus(), 0)
  emit('close')
}

watch(() => props.open, (isOpen) => {
  if (isOpen) show()
  else hide()
})

// ClientOnly renders the modal after this component mounts, so bind the
// listener when the element appears rather than in onMounted.
watch(modalEl, (el, previous) => {
  previous?.removeEventListener('fds.modal.hidden', onHidden)
  el?.addEventListener('fds.modal.hidden', onHidden)
})

onBeforeUnmount(() => {
  modalEl.value?.removeEventListener('fds.modal.hidden', onHidden)
  hide()
})

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''
  try {
    await $fetch(`${apiBase}/api/webform/demo_request/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: { data: { ...form.value } },
    })
    submitted.value = true
  } catch (e: any) {
    errorMessage.value = e?.data?.message || t('demoRequest.error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.landing-demo-modal {
  max-width: 36rem;
}
</style>
