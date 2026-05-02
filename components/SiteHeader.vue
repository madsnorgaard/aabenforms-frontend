<template>
  <header :class="[
    'border-b border-neutral-200',
    sticky ? 'bg-white/80 backdrop-blur sticky top-0 z-30' : 'bg-white',
  ]">
    <div :class="[
      'mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4',
      maxWidthClass,
    ]">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 sm:gap-2.5 text-sm font-bold text-neutral-900 hover:opacity-80 transition-opacity min-w-0"
        :aria-label="$t('siteHeader.gotoLanding')"
      >
        <img src="/favicon.svg" alt="" class="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" />
        <span class="truncate">ÅbenForms</span>
        <span
          v-if="liveBadge"
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest text-secondary-700 bg-secondary-50 border border-secondary-100 flex-shrink-0"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />
          <span class="hidden sm:inline">{{ $t('siteHeader.liveDemo') }}</span>
          <span class="sm:hidden">{{ $t('siteHeader.liveDemoShort') }}</span>
        </span>
      </NuxtLink>
      <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <LanguageSwitcher />
        <NuxtLink
          v-if="backLink"
          to="/"
          class="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-lg text-sm font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          :aria-label="$t('siteHeader.gotoLanding')"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M13 8H3m4-4l-4 4 4 4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">{{ $t('siteHeader.gotoLanding') }}</span>
        </NuxtLink>
        <slot name="nav-extra" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  maxWidthClass?: string
  sticky?: boolean
  liveBadge?: boolean
  backLink?: boolean
}>(), {
  maxWidthClass: 'max-w-6xl',
  sticky: false,
  liveBadge: false,
  backLink: true,
})
</script>
