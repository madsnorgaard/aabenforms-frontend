<template>
  <!-- Header variant: overflow menu, visible from the lg breakpoint. -->
  <div v-if="variant === 'header'" class="language-switcher-header">
    <div class="container">
      <div class="overflow-menu overflow-menu--open-right">
        <button
          type="button"
          class="button-overflow-menu js-dropdown select-language-button"
          :data-js-target="menuId"
          aria-expanded="false"
          :aria-controls="menuId"
        >
          <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#language" /></svg>{{ currentName }}
        </button>
        <div class="overflow-menu-inner select-language-list collapsed" :id="menuId">
          <ul class="overflow-list">
            <li v-for="loc in availableLocales" :key="loc.code">
              <NuxtLink :to="switchLocalePath(loc.code)" :lang="loc.code" :aria-current="loc.code === locale ? 'true' : undefined">{{ loc.name }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile drawer variant. -->
  <div v-else-if="variant === 'mobile'" class="language-switcher-mobile">
    <h3>{{ $t('fds.language.label') }}</h3>
    <ul>
      <li v-for="loc in availableLocales" :key="loc.code">
        <NuxtLink :to="switchLocalePath(loc.code)" :lang="loc.code" :aria-current="loc.code === locale ? 'true' : undefined">
          <svg v-if="loc.code === locale" class="icon-svg" focusable="false" aria-hidden="true"><use href="#check" /></svg>{{ loc.name }}
        </NuxtLink>
      </li>
    </ul>
  </div>

  <!-- Footer variant: the bar DKFDS places right after div.footer. -->
  <div v-else class="language-switcher">
    <div class="container">
      <ul :aria-label="$t('fds.language.label')">
        <li v-for="loc in availableLocales" :key="loc.code">
          <NuxtLink :to="switchLocalePath(loc.code)" :lang="loc.code" :aria-current="loc.code === locale ? 'true' : undefined">
            <svg v-if="loc.code === locale" class="icon-svg" focusable="false" aria-hidden="true"><use href="#check" /></svg>{{ loc.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// DKFDS Sprogvælger in its three placements. The current language is marked
// with aria-current="true" (and the #check icon in the list variants); each
// link carries lang="" so screen readers switch voice for the language name.
withDefaults(defineProps<{
  variant?: 'header' | 'mobile' | 'footer'
}>(), {
  variant: 'footer',
})

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const menuId = `${useId()}-language`

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name?: string }>).map((l) => ({ code: l.code, name: l.name || l.code })),
)
const currentName = computed(() => availableLocales.value.find((l) => l.code === locale.value)?.name || locale.value)
</script>
