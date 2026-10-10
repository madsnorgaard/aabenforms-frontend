<template>
  <nav v-if="errors.length" ref="root" :aria-labelledby="headingId">
    <div
      ref="alert"
      class="alert alert-error mt-0 mb-8"
      role="alert"
      data-module="error-summary"
      tabindex="-1"
    >
      <svg class="icon-svg alert-icon" :aria-label="$t('fds.alert.error')" focusable="false"><use href="#error" /></svg>
      <div class="alert-body">
        <h2 class="alert-heading" :id="headingId">{{ heading || $t('fds.errorSummary.heading') }}</h2>
        <ul class="alert-text nobullet-list">
          <li v-for="item in errors" :key="item.id">
            <a class="function-link" :href="`#${item.id}`">{{ item.message }}</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
// DKFDS Fejlopsummering. Render it above the h1 (below any back link) and
// feed it the same messages the fields show. Whenever the list is (re)filled
// the summary takes focus; clicking an entry scrolls the field's label into
// view and focuses the control (DKFDS ErrorSummary, bound through $dkfds).
export interface FdsErrorSummaryItem {
  /** id of the form control the message belongs to (href="#id"). */
  id: string
  message: string
}

const props = defineProps<{
  errors: FdsErrorSummaryItem[]
  heading?: string
}>()

const headingId = `${useId()}-heading`
const root = ref<HTMLElement | null>(null)
const alert = ref<HTMLElement | null>(null)

const { $dkfds } = useNuxtApp()

watch(
  () => props.errors,
  async (list) => {
    if (!list.length) return
    await nextTick()
    if (root.value) {
      $dkfds?.init(root.value)
    }
    alert.value?.focus()
  },
  { immediate: true, deep: true },
)
</script>
