/**
 * DKFDS JavaScript bootstrap.
 *
 * DKFDS ships `init()` for server-rendered pages: it is not idempotent (every
 * call re-binds listeners on elements it already touched), so calling it on
 * each client-side navigation would double-bind the components that survive
 * a route change. `initDkfds(scope)` does the same work with a per-element
 * guard (`data-fds-init`) and is therefore safe to call as often as needed:
 * on app:mounted, on every page:finish, and from any Fds component that
 * mounts later than the page (FdsErrorSummary, FdsStepIndicator, modals
 * inside async wizard steps): `useNuxtApp().$dkfds.init(el)`.
 */
import * as DKFDSNamespace from 'dkfds'

type AnyCtor = new (el: Element) => { init?: () => void }

// The package is a UMD bundle; depending on the bundler's CJS interop the
// members live on the namespace or on `default`.
const DKFDS: typeof DKFDSNamespace =
  typeof (DKFDSNamespace as any).init === 'function'
    ? DKFDSNamespace
    : ((DKFDSNamespace as any).default as typeof DKFDSNamespace)

const GUARD = 'fdsInit'

const COMPONENTS: Array<[string, AnyCtor]> = [
  ['.accordion, .accordion-bordered:not(.accordion)', DKFDS.Accordion],
  ['.alert.has-close', DKFDS.Alert],
  ['.back-to-top-button', DKFDS.BackToTop],
  ['.form-limit', DKFDS.CharacterLimit],
  ['.js-checkbox-toggle-content', DKFDS.CheckboxToggleContent],
  ['.js-dropdown', DKFDS.Dropdown],
  ['.overflow-menu--sort', DKFDS.DropdownSort],
  ['[data-module="error-summary"]', DKFDS.ErrorSummary],
  ['.fds-modal', DKFDS.Modal],
  ['.js-menudropdown', DKFDS.MenuDropdown],
  ['.js-radio-toggle-group', DKFDS.RadioToggleGroup],
  [
    'table.table--responsive-headers, table.table-sm-responsive-headers, table.table-md-responsive-headers, table.table-lg-responsive-headers',
    DKFDS.ResponsiveTable as unknown as AnyCtor,
  ],
  ['table.table--selectable', DKFDS.TableSelectableRows],
  ['div.tab-container', DKFDS.Tabs],
  ['.tooltip-wrapper', DKFDS.Tooltip],
]

function initElement(el: Element, Ctor: AnyCtor) {
  const node = el as HTMLElement
  if (node.dataset[GUARD]) {
    return
  }
  node.dataset[GUARD] = '1'
  try {
    const instance = new Ctor(el)
    instance.init?.()
  } catch (err) {
    console.warn('[dkfds] component init failed', el, err)
  }
}

function initDkfds(scope: Element | Document = document) {
  for (const [selector, Ctor] of COMPONENTS) {
    if (!Ctor) continue
    scope.querySelectorAll(selector).forEach((el) => initElement(el, Ctor))
  }

  if (scope.querySelector('.date-picker')) {
    try {
      DKFDS.datePicker.on(scope)
    } catch (err) {
      console.warn('[dkfds] date picker init failed', err)
    }
  }

  // The header's mobile drawer. DKFDS binds the same function references each
  // time, so re-running is a no-op for already-bound elements.
  if (document.querySelector('.js-menu-open')) {
    try {
      new DKFDS.Navigation().init()
    } catch (err) {
      console.warn('[dkfds] navigation init failed', err)
    }
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  let scheduled = false
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    nextTick(() => {
      scheduled = false
      initDkfds(document)
    })
  }

  nuxtApp.hook('app:mounted', schedule)
  nuxtApp.hook('page:finish', schedule)

  return {
    provide: {
      dkfds: {
        /** Idempotent init of every DKFDS component inside `scope`. */
        init: initDkfds,
        /** The raw dkfds module, for one-off use (e.g. `new $dkfds.lib.Modal(el).show()`). */
        lib: DKFDS,
      },
    },
  }
})
