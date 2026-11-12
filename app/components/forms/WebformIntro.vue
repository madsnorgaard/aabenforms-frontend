<template>
  <div v-if="hasContent" class="webform-intro">
    <div v-if="gedisa.intro" class="webform-intro__text" v-html="gedisa.intro" />
    <p v-else-if="description" class="webform-intro__text">{{ description }}</p>

    <section v-if="haveReady.length" class="webform-intro__section" :aria-labelledby="`${baseId}-ready`">
      <h2 :id="`${baseId}-ready`" class="h4">{{ $t('form.haveReady') }}</h2>
      <ul class="webform-intro__list">
        <li v-for="(item, i) in haveReady" :key="i">{{ item }}</li>
      </ul>
    </section>

    <section v-if="legalBasis.length" class="webform-intro__section" :aria-labelledby="`${baseId}-legal`">
      <h2 :id="`${baseId}-legal`" class="h4">{{ $t('form.legalBasis') }}</h2>
      <ul class="webform-intro__list">
        <li v-for="(law, i) in legalBasis" :key="i">
          <a v-if="law.url" :href="law.url" rel="noopener" target="_blank">{{ law.title }}<span class="sr-only"> {{ $t('form.opensNewWindow') }}</span></a>
          <template v-else>{{ law.title }}</template>
        </li>
      </ul>
    </section>

    <p v-if="gedisa.recipient?.name" class="webform-intro__recipient">
      {{ $t('form.sentTo', { name: recipientLabel }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
// Intro block before step 1 (KL components 1, 2 and 8): what the form is
// about, what to have ready, the legal basis and who receives the
// application. Everything comes from the webform's gedisa settings; without
// them only the form description (when any) is shown.
export interface WebformGedisa {
  intro?: string | null
  have_ready?: string[] | null
  legal_basis?: Array<{ title: string; url?: string | null }> | null
  expected_response?: string | null
  next_steps?: string | null
  recipient?: {
    name?: string | null
    department?: string | null
    phone?: string | null
    email?: string | null
    hours?: string | null
  } | null
}

const props = defineProps<{
  gedisa: WebformGedisa
  description?: string | null
}>()

const baseId = `${useId()}-intro`

const haveReady = computed<string[]>(() => (props.gedisa.have_ready || []).filter((s) => !!s))
const legalBasis = computed(() => (props.gedisa.legal_basis || []).filter((l) => !!l?.title))
const recipientLabel = computed(() => {
  const r = props.gedisa.recipient
  return r?.department ? `${r.name}, ${r.department}` : (r?.name || '')
})
const hasContent = computed(() =>
  !!(props.gedisa.intro || props.description || haveReady.value.length || legalBasis.value.length || props.gedisa.recipient?.name),
)
</script>

<style scoped>
.webform-intro {
  margin-bottom: 2rem;
}

.webform-intro__section {
  margin-top: 1.5rem;
}

.webform-intro__list {
  margin: 0.5rem 0 0;
}

.webform-intro__recipient {
  margin: 1.5rem 0 0;
}
</style>
