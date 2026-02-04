/**
 * Composable for debounced input handling
 * Prevents excessive API calls and improves performance
 */

import { ref, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * Create a debounced version of an input value
 *
 * @param value - The reactive value to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced value ref
 */
export const useDebouncedInput = <T>(value: Ref<T>, delay: number = 300): Ref<T> => {
  const debouncedValue = ref<T>(value.value) as Ref<T>
  let timeout: NodeJS.Timeout | null = null

  watch(value, (newValue) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}

/**
 * Create a debounced callback function
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced function
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      callback(...args)
    }, delay)
  }
}

/**
 * Create a throttled callback function
 * Ensures callback is called at most once per delay period
 *
 * @param callback - Function to throttle
 * @param delay - Throttle delay in milliseconds (default: 300ms)
 * @returns Throttled function
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let isThrottled = false

  return (...args: Parameters<T>) => {
    if (isThrottled) return

    callback(...args)
    isThrottled = true

    setTimeout(() => {
      isThrottled = false
    }, delay)
  }
}
