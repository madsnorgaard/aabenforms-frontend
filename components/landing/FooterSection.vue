<template>
  <footer class="border-t border-neutral-200 bg-neutral-900">
    <!-- CTA band -->
    <div class="border-b border-neutral-800">
      <div class="max-w-6xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div class="max-w-lg">
            <h2 class="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-3">
              {{ $t('cta.title') }}
            </h2>
            <p class="text-neutral-400 text-base">
              {{ $t('cta.subtitle') }}
            </p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <UiButton variant="secondary" size="lg">
              {{ $t('cta.button') }}
            </UiButton>
            <UiButton variant="ghost" size="lg" class="!text-neutral-300 hover:!text-white hover:!bg-neutral-800">
              GitHub
              <svg class="w-4 h-4 ml-1.5 -mr-0.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                <path d="M4 12l8-8M6 4h6v6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="max-w-6xl mx-auto px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-neutral-500">ÅbenForms</span>
          <span class="text-neutral-700">&middot;</span>
          <span class="text-xs text-neutral-500">{{ $t('footer.license') }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-neutral-500">{{ $t('footer.apiStatus') }}</span>
          <span v-if="apiStatus.loading" class="text-warning-400">{{ $t('footer.connecting') }}...</span>
          <span v-else-if="apiStatus.error" class="inline-flex items-center gap-1 text-error-400">
            <span class="w-1.5 h-1.5 rounded-full bg-error-400" />
            {{ $t('footer.offline') }}
          </span>
          <span v-else class="inline-flex items-center gap-1 text-success-400">
            <span class="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
            {{ $t('footer.online') }}
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
defineProps<{
  apiStatus: { loading: boolean; data?: any; error?: string }
}>()
</script>
