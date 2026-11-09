/**
 * Composable for lazy loading components with intersection observer
 * Improves initial page load performance by deferring non-critical components
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface UseLazyComponentOptions {
  /**
   * Root margin for intersection observer (default: '50px')
   * Positive values load component before it's visible
   */
  rootMargin?: string

  /**
   * Threshold for intersection observer (default: 0.1)
   * 0.1 means component loads when 10% is visible
   */
  threshold?: number

  /**
   * Whether to unobserve after first intersection (default: true)
   */
  once?: boolean
}

/**
 * Use intersection observer to lazy load components
 *
 * @param options - Configuration options
 * @returns Object with isVisible ref and element ref
 *
 * @example
 * ```vue
 * <script setup>
 * const { isVisible, elementRef } = useLazyComponent()
 * </script>
 *
 * <template>
 *   <div ref="elementRef">
 *     <HeavyComponent v-if="isVisible" />
 *     <Skeleton v-else />
 *   </div>
 * </template>
 * ```
 */
export const useLazyComponent = (options: UseLazyComponentOptions = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true
  } = options

  const isVisible = ref(false)
  const elementRef = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!elementRef.value) return

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: show component immediately if not supported
      isVisible.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true

            // Unobserve if once option is true
            if (once && observer && elementRef.value) {
              observer.unobserve(elementRef.value)
            }
          } else if (!once) {
            // If not once, allow hiding when out of viewport
            isVisible.value = false
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (observer && elementRef.value) {
      observer.unobserve(elementRef.value)
      observer.disconnect()
    }
  })

  return {
    isVisible,
    elementRef
  }
}

/**
 * Preload a component without rendering it
 * Useful for critical path optimization
 *
 * @param componentLoader - Component loader function
 *
 * @example
 * ```ts
 * // In a page component
 * onMounted(() => {
 *   // Preload heavy component that might be needed soon
 *   preloadComponent(() => import('./HeavyComponent.vue'))
 * })
 * ```
 */
export const preloadComponent = async (componentLoader: () => Promise<any>) => {
  try {
    await componentLoader()
  } catch (error) {
    console.warn('Failed to preload component:', error)
  }
}

/**
 * Delay component rendering for a specified time
 * Useful for deferring non-critical content
 *
 * @param delay - Delay in milliseconds (default: 100ms)
 * @returns isReady ref that becomes true after delay
 *
 * @example
 * ```vue
 * <script setup>
 * const { isReady } = useDelayedComponent(500)
 * </script>
 *
 * <template>
 *   <NonCriticalComponent v-if="isReady" />
 * </template>
 * ```
 */
export const useDelayedComponent = (delay: number = 100) => {
  const isReady = ref(false)

  onMounted(() => {
    setTimeout(() => {
      isReady.value = true
    }, delay)
  })

  return {
    isReady
  }
}
