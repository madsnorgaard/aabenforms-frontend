/**
 * Composable for interacting with the Drupal JSON:API backend
 * Includes caching, retry logic, and request deduplication
 */

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Request deduplication - prevent duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>()

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  /**
   * Generate cache key from URL and params
   */
  const getCacheKey = (url: string, params?: Record<string, any>): string => {
    const paramString = params ? JSON.stringify(params) : ''
    return `${url}${paramString}`
  }

  /**
   * Get data from cache if valid
   */
  const getFromCache = (key: string): any | null => {
    const cached = cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > CACHE_TTL) {
      cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Save data to cache
   */
  const saveToCache = (key: string, data: any): void => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear cache for a specific key or all cache
   */
  const clearCache = (key?: string): void => {
    if (key) {
      cache.delete(key)
    } else {
      cache.clear()
    }
  }

  /**
   * Fetch with retry logic
   */
  const fetchWithRetry = async <T>(
    fetchFn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> => {
    try {
      return await fetchFn()
    } catch (error: any) {
      if (retries > 0 && error?.statusCode >= 500) {
        // Only retry on server errors
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchWithRetry(fetchFn, retries - 1, delay * 2)
      }
      throw error
    }
  }

  /**
   * Fetch the JSON:API index (entry point)
   */
  const fetchApiIndex = async () => {
    const cacheKey = getCacheKey(`${apiBase}/jsonapi`)
    const cached = getFromCache(cacheKey)
    if (cached) return cached

    const response = await fetchWithRetry(() =>
      $fetch(`${apiBase}/jsonapi`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.api+json'
        }
      })
    )

    saveToCache(cacheKey, response)
    return response
  }

  /**
   * Fetch a specific resource from JSON:API with caching and deduplication
   */
  const fetchResource = async (
    resourcePath: string,
    options?: {
      params?: Record<string, any>
      cache?: boolean // Enable/disable caching for this request
    }
  ) => {
    const url = `${apiBase}/jsonapi/${resourcePath}`
    const cacheKey = getCacheKey(url, options?.params)

    // Check cache first (if caching is enabled, default true)
    const useCache = options?.cache !== false
    if (useCache) {
      const cached = getFromCache(cacheKey)
      if (cached) return cached
    }

    // Check if request is already pending (deduplication)
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)
    }

    // Create new request
    const requestPromise = fetchWithRetry(() =>
      $fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.api+json'
        },
        params: options?.params
      })
    ).then((response) => {
      // Save to cache if enabled
      if (useCache) {
        saveToCache(cacheKey, response)
      }
      // Remove from pending requests
      pendingRequests.delete(cacheKey)
      return response
    }).catch((error) => {
      // Remove from pending requests on error
      pendingRequests.delete(cacheKey)
      throw error
    })

    // Store pending request
    pendingRequests.set(cacheKey, requestPromise)

    return requestPromise
  }

  /**
   * Post data to JSON:API with retry logic
   * Note: POST requests are never cached
   */
  const postResource = async (resourcePath: string, data: any) => {
    const response = await fetchWithRetry(() =>
      $fetch(`${apiBase}/jsonapi/${resourcePath}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify(data)
      }),
      2 // Fewer retries for POST requests
    )

    // Clear any cached GET requests for this resource
    const resourceKey = `${apiBase}/jsonapi/${resourcePath}`
    clearCache(resourceKey)

    return response
  }

  return {
    apiBase,
    fetchApiIndex,
    fetchResource,
    postResource,
    clearCache
  }
}
