/**
 * PostCSS plugin: rescale rem values in the compiled DKFDS stylesheet.
 *
 * DKFDS authors its rem values against html { font-size: 62.5% } (10px).
 * assets/css/dkfds.scss resets the root to 100% (16px) so the rest of the app
 * keeps its 16px-based rem values; this plugin multiplies every rem in the
 * DKFDS output by 10/16 so the design system still renders at its intended
 * pixel sizes. Only declarations are touched (DKFDS media queries are px).
 *
 * Only files whose path matches `test` are processed; everything else passes
 * through untouched.
 */
const REM_RE = /(-?\d*\.?\d+)rem\b/g

function round(n) {
  return String(Math.round(n * 10000) / 10000)
}

export default function dkfdsRemRebase(options = {}) {
  const factor = options.factor ?? 0.625
  const test = options.test ?? /assets[\\/]css[\\/]dkfds\.scss$/

  return {
    postcssPlugin: 'dkfds-rem-rebase',
    Once(root) {
      const file = root.source?.input?.file || ''
      if (!test.test(file)) {
        return
      }
      root.walkDecls((decl) => {
        if (decl.value.includes('rem')) {
          decl.value = decl.value.replace(REM_RE, (_m, num) => `${round(parseFloat(num) * factor)}rem`)
        }
      })
    },
  }
}
dkfdsRemRebase.postcss = true
