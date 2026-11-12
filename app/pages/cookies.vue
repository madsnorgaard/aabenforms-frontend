<template>
  <div>
    <SiteHeader solution-title="Cookies" />
    <main id="main" tabindex="-1" class="container py-8">
      <div class="row">
        <div class="col-12 col-lg-8">
          <h1>{{ $t('cookies.page.title') }}</h1>
          <p class="font-lead">{{ $t('cookies.page.lead') }}</p>

          <h2>{{ $t('cookies.page.whatHeading') }}</h2>
          <p>{{ $t('cookies.page.whatBody') }}</p>

          <h2>{{ $t('cookies.page.listHeading') }}</h2>
          <p>{{ $t('cookies.page.listIntro') }}</p>
          <table class="table table--responsive-headers">
            <thead>
              <tr>
                <th scope="col">{{ $t('cookies.page.colName') }}</th>
                <th scope="col">{{ $t('cookies.page.colPurpose') }}</th>
                <th scope="col">{{ $t('cookies.page.colType') }}</th>
                <th scope="col">{{ $t('cookies.page.colExpiry') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td :data-title="$t('cookies.page.colName')"><code>i18n_redirected</code></td>
                <td :data-title="$t('cookies.page.colPurpose')">{{ $t('cookies.page.i18nPurpose') }}</td>
                <td :data-title="$t('cookies.page.colType')">{{ $t('cookies.page.necessary') }}</td>
                <td :data-title="$t('cookies.page.colExpiry')">{{ $t('cookies.page.oneYear') }}</td>
              </tr>
              <tr>
                <td :data-title="$t('cookies.page.colName')"><code>af_consent</code></td>
                <td :data-title="$t('cookies.page.colPurpose')">{{ $t('cookies.page.consentPurpose') }}</td>
                <td :data-title="$t('cookies.page.colType')">{{ $t('cookies.page.necessary') }}</td>
                <td :data-title="$t('cookies.page.colExpiry')">{{ $t('cookies.page.oneYear') }}</td>
              </tr>
            </tbody>
          </table>

          <h2>{{ $t('cookies.page.necessaryHeading') }}</h2>
          <p>{{ $t('cookies.page.necessaryBody') }}</p>

          <h2>{{ $t('cookies.page.mitidHeading') }}</h2>
          <p>{{ $t('cookies.page.mitidBody') }}</p>

          <h2>{{ $t('cookies.page.statsHeading') }}</h2>
          <p>{{ $t('cookies.page.statsBody') }}</p>

          <h2>{{ $t('cookies.page.choiceHeading') }}</h2>
          <ClientOnly>
            <p>
              {{ $t('cookies.page.choiceCurrent') }}
              <strong>{{ choiceLabel }}</strong>
            </p>
            <p v-if="resetDone" role="status">{{ $t('cookies.page.resetDone') }}</p>
            <FdsButton variant="secondary" :disabled="!hasChoice" @click="changeChoice">
              {{ $t('cookies.page.changeChoice') }}
            </FdsButton>
          </ClientOnly>
        </div>
      </div>
    </main>
    <FdsFooter />
  </div>
</template>

<script setup lang="ts">
// Cookie policy, linked from the footer and from the DKFDS cookiemeddelelse.
// Lists the cookies the frontend really sets (i18n_redirected, af_consent),
// states that the MitID session is not a cookie and that no statistics
// cookies exist today. "Ændr dit valg" clears af_consent so the banner
// (app.vue) shows again; the choice block is ClientOnly because the consent
// state is only known in the browser.
const { t } = useI18n()
useHead({ title: t('cookies.page.title') })

const { status, hasChoice, reset } = useConsent()
const resetDone = ref(false)

const choiceLabel = computed(() => {
  if (status.value === 'accepted') return t('cookies.page.choiceAccepted')
  if (status.value === 'rejected') return t('cookies.page.choiceRejected')
  return t('cookies.page.choiceNone')
})

function changeChoice() {
  reset()
  resetDone.value = true
}
</script>
