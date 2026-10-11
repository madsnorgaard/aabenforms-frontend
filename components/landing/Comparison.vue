<template>
  <section class="landing-section landing-section--gray bg-alternative" aria-labelledby="landing-comparison-heading">
    <div class="container">
      <div class="row">
        <div class="col-12 col-lg-8">
          <p class="subheading mb-3">
            {{ $t('comparison.eyebrow') }}
          </p>
          <h2 id="landing-comparison-heading" class="h1 mt-0 mb-5">
            {{ $t('comparison.heading') }}
          </h2>
          <p class="font-lead mt-0 mb-6">
            {{ $t('comparison.lead') }}
          </p>
        </div>
      </div>

      <!-- DKFDS table; below 768px each row turns into a card with the
           column name printed above every cell (data-title). -->
      <table class="table table--responsive-headers landing-comparison">
        <thead>
          <tr>
            <th scope="col"><span class="sr-only">{{ $t('comparison.topicLabel') }}</span></th>
            <th scope="col">ÅbenForms</th>
            <th scope="col">{{ $t('comparison.themLabel') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <th scope="row" data-title="">{{ row.title }}</th>
            <td data-title="ÅbenForms">
              <span class="landing-comparison__us">
                <svg class="icon-svg landing-comparison__icon" focusable="false" aria-hidden="true"><use href="#check" /></svg>
                <span>{{ row.us }}</span>
              </span>
            </td>
            <td :data-title="$t('comparison.themLabel')">{{ row.them }}</td>
          </tr>
        </tbody>
      </table>

      <p class="mt-6 mb-0 landing-comparison__footnote">
        {{ $t('comparison.footnote') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()

const rows = computed(() => [
  { key: 'r1', title: t('comparison.row1.title'), us: t('comparison.row1.us'), them: t('comparison.row1.them') },
  { key: 'r2', title: t('comparison.row2.title'), us: t('comparison.row2.us'), them: t('comparison.row2.them') },
  { key: 'r3', title: t('comparison.row3.title'), us: t('comparison.row3.us'), them: t('comparison.row3.them') },
  { key: 'r4', title: t('comparison.row4.title'), us: t('comparison.row4.us'), them: t('comparison.row4.them') },
  { key: 'r5', title: t('comparison.row5.title'), us: t('comparison.row5.us'), them: t('comparison.row5.them') },
])
</script>

<style scoped>
.landing-section {
  padding-top: 4rem;
  padding-bottom: 4rem;
}

.landing-section--gray {
  border-top: 1px solid #dcdcdc;
  border-bottom: 1px solid #dcdcdc;
}

.landing-comparison {
  width: 100%;
  background-color: #ffffff;
}

.landing-comparison__us {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.landing-comparison__icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
  fill: #358000;
}

.landing-comparison__footnote {
  max-width: 40rem;
  font-size: 0.875rem;
  color: #454545;
}
</style>
