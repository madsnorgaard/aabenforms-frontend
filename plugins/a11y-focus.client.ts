/**
 * Accessibility: move focus to the main landmark on client-side navigation.
 *
 * A single-page-app route change does not move keyboard focus by default, so a
 * keyboard or screen-reader user stays stranded on the old page's last control.
 * After each navigation (but not the initial load, where focus should stay put)
 * we move focus to the page's <main id="main" tabindex="-1">, so the next Tab
 * starts from the new content and screen readers re-announce it (WCAG 2.4.3).
 */
export default defineNuxtPlugin((nuxtApp) => {
  let initialLoad = true

  nuxtApp.hook('page:finish', () => {
    if (initialLoad) {
      initialLoad = false
      return
    }
    // Defer to the next tick so the new page's #main is in the DOM.
    requestAnimationFrame(() => {
      const main = document.getElementById('main')
      if (main) {
        main.focus()
      }
    })
  })
})
