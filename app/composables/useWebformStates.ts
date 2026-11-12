/**
 * Webform `#states` evaluated in the browser.
 *
 * Drupal/Webform conditional logic is declared on the element:
 *
 *   '#states':
 *     visible:
 *       ':input[name="screen_barn_under_18"]': { value: 'nej' }
 *     required:
 *       - ':input[name="a"]': { checked: true }
 *       - 'or'
 *       - ':input[name="b"]': { filled: true }
 *
 * Supported states: visible, invisible (and the -slide variants), required,
 * optional. Supported triggers: value, !value, checked, unchecked, empty,
 * filled, pattern, !pattern. Selectors in one object are AND; an array with
 * the string 'or' between its groups is OR (Webform's syntax), 'xor' is
 * exclusive. Anything else evaluates to "no change" so an unknown rule never
 * hides a field the citizen must fill in.
 *
 * Pure functions: no Vue state, so they are reusable from the renderer, the
 * summary and the submit payload builder alike.
 */

export type WebformElement = Record<string, any>
export type WebformData = Record<string, any>

export interface WebformTrigger {
  value?: unknown
  '!value'?: unknown
  checked?: boolean
  unchecked?: boolean
  empty?: boolean
  filled?: boolean
  pattern?: string
  '!pattern'?: string
}

/** `{ selector: trigger, selector: trigger }`: all selectors must match. */
export type WebformConditionGroup = Record<string, WebformTrigger>
/** A group, or groups joined by 'or' / 'and' / 'xor' strings. */
export type WebformCondition = WebformConditionGroup | Array<WebformConditionGroup | 'or' | 'and' | 'xor'>

export interface WebformStateResult {
  visible: boolean
  required: boolean
}

/** Element types that only group other elements and never hold a value. */
export const WEBFORM_CONTAINER_TYPES = new Set([
  'webform_wizard_page',
  'fieldset',
  'container',
  'details',
  'webform_flexbox',
  'webform_section',
  'webform_card',
  'webform_actions',
])

/** Markup-only element types: rendered, never validated or submitted. */
export const WEBFORM_MARKUP_TYPES = new Set(['webform_markup', 'processed_text', 'webform_horizontal_rule'])

export function isContainerElement(element: WebformElement | undefined): boolean {
  return !!element && WEBFORM_CONTAINER_TYPES.has(element['#type'])
}

export function isMarkupElement(element: WebformElement | undefined): boolean {
  return !!element && WEBFORM_MARKUP_TYPES.has(element['#type'])
}

/**
 * The element key a selector points at. Handles `:input[name="key"]`,
 * `:input[name="key[option]"]` (checkboxes: returns `{ key, option }`) and
 * the single-quoted / unquoted variants Webform accepts.
 */
export function parseSelector(selector: string): { key: string; option?: string } | null {
  const match = /\[name=["']?([^"'\]]+)["']?\]/.exec(selector)
  if (!match) {
    return null
  }
  const name = match[1]
  const sub = /^([^[]+)\[([^\]]*)\]$/.exec(name)
  if (sub) {
    return { key: sub[1], option: sub[2] }
  }
  return { key: name }
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === false) {
    return true
  }
  if (Array.isArray(value)) {
    return value.length === 0
  }
  return String(value).trim() === ''
}

function isCheckedValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'on'
}

function valueMatches(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return expected.some((e) => valueMatches(actual, e))
  }
  if (expected !== null && typeof expected === 'object') {
    const obj = expected as Record<string, unknown>
    if (typeof obj.pattern === 'string') {
      return !isEmptyValue(actual) && new RegExp(obj.pattern).test(String(actual))
    }
    if (typeof obj['!pattern'] === 'string') {
      return isEmptyValue(actual) || !new RegExp(obj['!pattern']).test(String(actual))
    }
    return false
  }
  if (Array.isArray(actual)) {
    return actual.some((a) => String(a) === String(expected))
  }
  if (typeof actual === 'boolean') {
    const token = String(expected ?? '').toLowerCase()
    return actual ? ['1', 'true', 'on'].includes(token) : ['0', 'false', ''].includes(token)
  }
  return String(actual ?? '') === String(expected ?? '')
}

/** The current value a selector refers to (an option of a checkboxes element when named). */
function valueFor(data: WebformData, target: { key: string; option?: string }): unknown {
  const value = data[target.key]
  if (target.option === undefined) {
    return value
  }
  if (Array.isArray(value)) {
    return value.includes(target.option)
  }
  if (value && typeof value === 'object') {
    return !!(value as Record<string, unknown>)[target.option]
  }
  return String(value ?? '') === target.option
}

/** Whether a single trigger holds for the value it watches. */
export function evaluateTrigger(value: unknown, trigger: WebformTrigger | undefined | null): boolean {
  if (!trigger || typeof trigger !== 'object') {
    return false
  }
  const checks: boolean[] = []
  if ('value' in trigger) {
    checks.push(valueMatches(value, trigger.value))
  }
  if ('!value' in trigger) {
    checks.push(!valueMatches(value, trigger['!value']))
  }
  if ('checked' in trigger) {
    checks.push(isCheckedValue(value) === (trigger.checked !== false))
  }
  if ('unchecked' in trigger) {
    checks.push(isCheckedValue(value) !== (trigger.unchecked !== false))
  }
  if ('empty' in trigger) {
    checks.push(isEmptyValue(value) === (trigger.empty !== false))
  }
  if ('filled' in trigger) {
    checks.push(isEmptyValue(value) !== (trigger.filled !== false))
  }
  if ('pattern' in trigger && typeof trigger.pattern === 'string') {
    checks.push(!isEmptyValue(value) && new RegExp(trigger.pattern).test(String(value)))
  }
  if ('!pattern' in trigger && typeof trigger['!pattern'] === 'string') {
    checks.push(isEmptyValue(value) || !new RegExp(trigger['!pattern']).test(String(value)))
  }
  return checks.length > 0 && checks.every(Boolean)
}

/** All selectors in a group must match (AND). */
export function evaluateConditionGroup(group: WebformConditionGroup, data: WebformData): boolean {
  const entries = Object.entries(group || {})
  if (entries.length === 0) {
    return false
  }
  return entries.every(([selector, trigger]) => {
    const target = parseSelector(selector)
    if (!target) {
      return false
    }
    return evaluateTrigger(valueFor(data, target), trigger)
  })
}

/**
 * A full condition: a group (AND), or Webform's array form where groups are
 * separated by 'or' / 'and' / 'xor'. Groups in an array without a separator
 * are AND, like Drupal's states API.
 */
export function evaluateCondition(condition: WebformCondition | undefined | null, data: WebformData): boolean {
  if (!condition) {
    return false
  }
  if (!Array.isArray(condition)) {
    return evaluateConditionGroup(condition, data)
  }
  let operator: 'and' | 'or' | 'xor' = 'and'
  const results: boolean[] = []
  for (const part of condition) {
    if (typeof part === 'string') {
      const op = part.toLowerCase()
      if (op === 'or' || op === 'and' || op === 'xor') {
        operator = op
      }
      continue
    }
    results.push(evaluateConditionGroup(part, data))
  }
  if (results.length === 0) {
    return false
  }
  if (operator === 'or') {
    return results.some(Boolean)
  }
  if (operator === 'xor') {
    return results.filter(Boolean).length === 1
  }
  return results.every(Boolean)
}

/**
 * The element's effective visibility and required-ness for the given data.
 * Starts from the static `#required`; `visible`/`invisible` and
 * `required`/`optional` states adjust it.
 */
export function evaluateStates(element: WebformElement | undefined, data: WebformData): WebformStateResult {
  const states = (element?.['#states'] || {}) as Record<string, WebformCondition>
  let visible = true
  let required = !!element?.['#required']

  const visibleRule = states.visible ?? states['visible-slide']
  if (visibleRule) {
    visible = evaluateCondition(visibleRule, data)
  }
  const invisibleRule = states.invisible ?? states['invisible-slide']
  if (invisibleRule && evaluateCondition(invisibleRule, data)) {
    visible = false
  }
  if (states.required && evaluateCondition(states.required, data)) {
    required = true
  }
  if (states.optional && evaluateCondition(states.optional, data)) {
    required = false
  }
  return { visible, required }
}

/**
 * Visibility including the element's ancestors: a field inside a container
 * whose own `#states` hide it is hidden too. `#webform_parent_key` is the
 * flattened tree's parent pointer.
 */
export function isElementVisible(key: string, elements: Record<string, WebformElement>, data: WebformData): boolean {
  const seen = new Set<string>()
  let current: string | undefined = key
  while (current && elements[current] && !seen.has(current)) {
    seen.add(current)
    const element: WebformElement = elements[current]
    if (element['#type'] === 'hidden' || element['#access'] === false) {
      return false
    }
    if (!evaluateStates(element, data).visible) {
      return false
    }
    current = element['#webform_parent_key'] || undefined
  }
  return true
}

/** Effective required flag (static or via `#states`). */
export function isElementRequired(element: WebformElement | undefined, data: WebformData): boolean {
  return evaluateStates(element, data).required
}

/** A CSS-attribute-safe version of an element key (class names, ids). */
export function webformCssSafe(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '-')
}

/** Stable DOM id per element key: error-summary and Redigér links target it. */
export function webformFieldId(key: string): string {
  return `wf-${webformCssSafe(key)}`
}
