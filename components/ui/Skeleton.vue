<template>
  <div :class="['skeleton', variantClass, sizeClass]" :style="customStyle">
    <div class="skeleton-shimmer"></div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string
  height?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  variant: 'text',
  size: 'md'
})

const variantClass = computed(() => {
  const variants = {
    text: 'skeleton-text',
    circular: 'skeleton-circular',
    rectangular: 'skeleton-rectangular',
    rounded: 'skeleton-rounded'
  }
  return variants[props.variant]
})

const sizeClass = computed(() => {
  if (props.width || props.height) return ''

  const sizes = {
    sm: 'skeleton-sm',
    md: 'skeleton-md',
    lg: 'skeleton-lg',
    xl: 'skeleton-xl'
  }
  return sizes[props.size]
})

const customStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.width) style.width = props.width
  if (props.height) style.height = props.height
  return style
})
</script>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
  background: #e0e0e0;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Variants */
.skeleton-text {
  border-radius: 4px;
  height: 1em;
}

.skeleton-circular {
  border-radius: 50%;
  aspect-ratio: 1;
}

.skeleton-rectangular {
  border-radius: 0;
}

.skeleton-rounded {
  border-radius: 8px;
}

/* Sizes */
.skeleton-sm {
  height: 20px;
}

.skeleton-md {
  height: 40px;
}

.skeleton-lg {
  height: 60px;
}

.skeleton-xl {
  height: 80px;
}
</style>
