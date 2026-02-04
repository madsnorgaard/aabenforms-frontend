<template>
  <div class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <transition name="fade">
      <div
        v-if="visible"
        :class="['tooltip', `tooltip-${position}`]"
        role="tooltip"
        :aria-label="content"
      >
        {{ content }}
        <div :class="['tooltip-arrow', `arrow-${position}`]"></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}>(), {
  position: 'top',
  delay: 200
})

const visible = ref(false)
let timer: NodeJS.Timeout | null = null

function show() {
  timer = setTimeout(() => {
    visible.value = true
  }, props.delay)
}

function hide() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  visible.value = false
}

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  z-index: 1000;
  padding: 0.5rem 0.75rem;
  background: #333;
  color: white;
  font-size: 0.875rem;
  line-height: 1.4;
  border-radius: 6px;
  white-space: nowrap;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.tooltip-top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.arrow-top {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px 6px 0 6px;
  border-color: #333 transparent transparent transparent;
}

.arrow-bottom {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent #333 transparent;
}

.arrow-left {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 0 6px 6px;
  border-color: transparent transparent transparent #333;
}

.arrow-right {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 6px 6px 0;
  border-color: transparent #333 transparent transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
