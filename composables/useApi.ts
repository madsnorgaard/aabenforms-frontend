/**
 * Composable for interacting with the Drupal JSON:API backend
 */
export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  /**
   * Fetch the JSON:API index (entry point)
   */
  const fetchApiIndex = async () => {
    const response = await $fetch(`${apiBase}/jsonapi`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.api+json'
      }
    })
    return response
  }

  /**
   * Fetch a specific resource from JSON:API
   */
  const fetchResource = async (resourcePath: string) => {
    const response = await $fetch(`${apiBase}/jsonapi/${resourcePath}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.api+json'
      }
    })
    return response
  }

  /**
   * Post data to JSON:API
   */
  const postResource = async (resourcePath: string, data: any) => {
    const response = await $fetch(`${apiBase}/jsonapi/${resourcePath}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify(data)
    })
    return response
  }

  return {
    apiBase,
    fetchApiIndex,
    fetchResource,
    postResource
  }
}
