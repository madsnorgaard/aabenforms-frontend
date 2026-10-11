/**
 * Shared id plumbing for the DKFDS form components (components/fds/).
 *
 * DKFDS wires hint and error text to the control through
 * `aria-describedby="{id}-hint {id}-error"`, so every field needs a stable id
 * that is identical on the server and in the browser. Vue's useId() gives
 * SSR-safe ids; an explicit `id` prop wins so error-summary links
 * (`href="#id"`) can be authored by hand.
 */
export function useFdsFieldIds(props: { id?: string }) {
  const generated = useId()
  const id = computed(() => props.id || generated)
  const hintId = computed(() => `${id.value}-hint`)
  const errorId = computed(() => `${id.value}-error`)
  return { id, hintId, errorId }
}

/** Joins the describedby parts that apply, or returns undefined so the attribute is omitted. */
export function fdsDescribedBy(parts: Array<string | false | null | undefined>): string | undefined {
  const ids = parts.filter((p): p is string => !!p)
  return ids.length ? ids.join(' ') : undefined
}
