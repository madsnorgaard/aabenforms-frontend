<template>
  <header class="header">
    <FdsLanguageSwitcher v-if="languageSwitcher" variant="header" />

    <!-- Row 1: portal/logo row with the signed-in user and "Log af". -->
    <div class="portal-info">
      <div class="portal-info-inner container">
        <NuxtLink :to="localePath(logoHref)" class="logo" :aria-label="$t('fds.header.logoLabel')">
          <slot name="logo">
            <img src="/favicon.svg" alt="" class="fds-logo-mark" width="32" height="32">
            <span class="fds-logo-text">ÅbenForms</span>
          </slot>
        </NuxtLink>
        <button type="button" class="function-link button-menu-open js-menu-open ml-auto d-print-none" aria-haspopup="dialog">
          <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#menu" /></svg>{{ $t('fds.header.menu') }}
        </button>
        <div v-if="authenticated" class="portal-user">
          <p class="user">{{ userName }}</p>
          <button type="button" class="function-link d-print-none log-off" @click="logOff">
            <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#lock" /></svg>{{ $t('fds.header.logOff') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Row 2: solution title and authority. -->
    <div class="solution-info">
      <div class="solution-info-inner container">
        <div class="solution-heading">
          <NuxtLink :to="localePath(logoHref)">{{ solutionTitle || $t('fds.header.solutionTitle') }}</NuxtLink>
          <span v-if="liveBadge" class="badge ml-3">{{ $t('fds.header.liveDemo') }}</span>
        </div>
        <div class="additional-info">
          <p><strong class="authority-name">{{ authorityName || $t('fds.header.authorityName') }}</strong></p>
          <p v-if="authorityText">{{ authorityText }}</p>
        </div>
      </div>
    </div>

    <slot name="navigation" />

    <!-- Mobile drawer (below lg): opened by the Menu button, closed by Luk,
         the overlay or Escape; focus is trapped by DKFDS Navigation. -->
    <div class="overlay" />
    <div class="mobile-drawer" role="dialog" aria-modal="true" :aria-labelledby="menuHeadingId">
      <div class="menu-top">
        <h2 :id="menuHeadingId" class="menu-heading">{{ $t('fds.header.menu') }}</h2>
        <button type="button" class="function-link button-menu-close js-menu-close" :aria-label="$t('fds.header.closeMenu')">
          <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#close" /></svg>{{ $t('fds.header.close') }}
        </button>
      </div>
      <div v-if="authenticated" class="portal-info-mobile">
        <h3 class="sr-only">{{ $t('fds.header.userHeading') }}</h3>
        <p class="user">{{ userName }}</p>
        <p>
          <button type="button" class="function-link d-print-none log-off" @click="logOff">
            <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#lock" /></svg>{{ $t('fds.header.logOff') }}
          </button>
        </p>
      </div>
      <nav v-if="menuItems.length" class="navigation-menu-mobile" :aria-label="$t('fds.header.mainMenu')">
        <ul class="mainmenu">
          <li v-for="item in menuItems" :key="item.to" :class="{ active: isCurrent(item.to), current: isCurrent(item.to) }">
            <NuxtLink :to="localePath(item.to)" class="nav-link" :aria-current="isCurrent(item.to) ? 'page' : undefined">
              <span>{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <FdsLanguageSwitcher v-if="languageSwitcher" variant="mobile" />
      <div class="solution-info-mobile">
        <h3 class="sr-only">{{ $t('fds.header.authorityHeading') }}</h3>
        <p class="mb-2"><strong class="authority-name">{{ authorityName || $t('fds.header.authorityName') }}</strong></p>
        <p v-if="authorityText">{{ authorityText }}</p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// DKFDS Header, rows 1 and 2 (mandatory) plus the mobile drawer. Row 3
// (desktop navigation) can be provided through the `navigation` slot with
// DKFDS navigation-menu markup. The logo slot defaults to the ÅbenForms
// wordmark; a kommune drops its own <img> in.
export interface FdsMenuItem {
  to: string
  label: string
}

const props = withDefaults(defineProps<{
  solutionTitle?: string
  authorityName?: string
  authorityText?: string
  logoHref?: string
  menuItems?: FdsMenuItem[]
  languageSwitcher?: boolean
  liveBadge?: boolean
}>(), {
  logoHref: '/',
  languageSwitcher: true,
  liveBadge: false,
})

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const userStore = useUserStore()

const menuHeadingId = `${useId()}-menu-heading`

const authenticated = computed(() => userStore.isAuthenticated)
const userName = computed(() => userStore.user?.name || userStore.displayName)

const menuItems = computed<FdsMenuItem[]>(() => props.menuItems ?? [
  { to: '/', label: t('fds.nav.home') },
  { to: '/kontakt', label: t('fds.nav.contact') },
])

function isCurrent(to: string) {
  return route.path === localePath(to)
}

async function logOff() {
  await userStore.logout()
}

// Pick up an existing MitID session (localStorage) so the user row renders
// on every page, not only the ones that mount a form.
onMounted(() => {
  if (!userStore.isAuthenticated) {
    userStore.restoreSession()
  }
})
</script>

<style scoped>
/* The kommune/solution logo replaces the portal background image DKFDS
   expects for borger.dk; keep the link, drop the image and show the slot. */
.header .portal-info .logo {
  background-image: none;
  width: auto;
  height: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #1a1a1a;
}

.header .portal-info .logo span {
  display: inline;
}

.fds-logo-mark {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.fds-logo-text {
  font-weight: 700;
  font-size: 1.125rem;
  line-height: 1;
}
</style>
