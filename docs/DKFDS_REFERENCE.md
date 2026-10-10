# Det Fælles Designsystem (DKFDS) reference for AabenForms

Captured 2026-10-10 from https://designsystem.dk/ and the npm registry. This is the
contract the citizen-facing frontend follows. Verify against the live pages before
changing markup; the component pages carry the authoritative HTML.

## Package

- npm: `dkfds` 11.3.0, licence MIT AND OFL-1.1 AND Apache-2.0, no runtime dependencies.
- Repo: https://github.com/detfaellesdesignsystem/dkfds-components
- Compiled: `dist/css/dkfds.css` (theme-neutral base; borger.dk and Virk theme files
  are shipped alongside it in `dist/css/`, pick one), `dist/js/dkfds.min.js`
  (`import * as DKFDS from "dkfds"; DKFDS.init()`), fonts in `dist/fonts/IBMPlexSans/`.
- SCSS entry: `@use 'node_modules/dkfds/src/stylesheets/dkfds' with ($font-path: ...,
  $image-path: ..., $icons-folder-path: ...)`.
- Intended for self-service solutions on borger.dk and Virk. Kommuner may use the
  system; the borger.dk and Virk logos belong to the portals. AabenForms uses the
  borger.dk theme tokens with the kommune's own logo in the header.

## Theme: borger.dk

| Role | Hex |
|---|---|
| Primary | #44831E |
| Primary dark | #3C5C22 |
| Primary darker | #233614 |
| Link | #004D99 (hover #1A1A1A, visited #800080) |
| Focus | #454545 |
| Success | #358000 (light #DDF7CE) |
| Warning | #FEBB30 (light #FFEECC) |
| Error | #CC0000 (light #FFE0E0) |
| Info | #1B86C3 (light #E2F2FB) |
| Gray 100..600 | #F5F5F5, #DCDCDC, #BFBFBF, #8E8E8E, #707070, #454545 |
| Black / White | #1A1A1A / #FFFFFF |

Virk theme primary is #0059B3 (dark #004993, darker #003972). Not used here.

## Typography and grid

- Font: IBM Plex Sans, self-hosted from the package (Regular, Medium, SemiBold, Bold,
  plus italics), WOFF2 and WOFF. Fallback is the system font. Do not load it from
  Google Fonts in production builds.
- Breakpoints: xs <576, sm >=576, md >=768, lg >=992, xl >=1200. Container max 1200px
  at xl. 12 columns, 32px gutter. 8px vertical rhythm, 4px for icons and type.
- Header collapses below 992px into solution title + menu button + mobile drawer.
- Step indicator switches to a "Trin 2 af 3" button with a bottom-sheet modal below 768px.

## Components we use

### Cookiemeddelelse
Placed directly after `<body>`, before `<header>`. Never a modal. Must render before any
non-essential cookie is set; statistics scripts load only after "Accepter cookies".

```html
<div class="cookie-container" role="complementary" aria-labelledby="cookie-message-heading" aria-describedby="cookie-message-text">
  <div class="cookie-message">
    <div class="cookie-text">
      <h2 class="h3 mt-0 mb-3" id="cookie-message-heading">Fortæl os om du accepterer cookies</h2>
      <p class="mt-0" id="cookie-message-text">Vi indsamler statistik ved hjælp af tredjepartscookies til at forbedre brugeroplevelsen. Alle indsamlede data anonymiseres. <a href="/cookies">Læs mere om vores brug af cookies</a></p>
    </div>
    <div class="cookie-actions">
      <ul class="inline-list">
        <li><button type="button" class="button button-secondary">Accepter cookies</button></li>
        <li><button type="button" class="ml-md-4 button button-secondary">Nej tak til cookies</button></li>
      </ul>
    </div>
  </div>
</div>
```

### Header
Rows 1 and 2 are mandatory: portal/logo row with user name and "Log af", then solution
row with solution title and authority name. Classes: `header`, `portal-info`,
`portal-info-inner container`, `logo`, `portal-user` (`p.user`, `button.function-link.log-off`),
`solution-info`, `solution-info-inner container`, `solution-heading`, `additional-info`,
`strong.authority-name`, plus `overlay` and `mobile-drawer[role=dialog][aria-modal=true]`.

### Footer
`<footer><div class="footer"><div class="container"><div class="row">` with
`col-12 col-sm-12 col-md-3 footer-col` columns. Must carry authority name, contact
(mailto and tel), the tilgængelighedserklæring link (`icon-link`) and the privacy/cookie
policy link. `d-print-none` on non-essential columns.

### Trinindikator
Desktop: `<nav aria-label="Trinindikator" class="d-none d-md-block"><ol class="step-indicator">`.
Completed `li` holds `a.step` with `span.step-icon` and `#check` icon (`aria-label="Trin 1 gennemført"`).
Current `li.current` with `a.step[aria-current=step]` and `span.step-number`. Future
`li.disabled` with a `div.step`. Error `li.error` with `#error` icon. Mobile:
`button.step-indicator-button.d-md-none[aria-haspopup=dialog][data-module=modal][data-target=...]`
and a `div.fds-modal.modal-step-indicator`. Last step is the summary. No sub-steps.

### Form elements
```html
<div class="form-group">
  <label class="form-label" for="x">Label</label>
  <span class="form-hint" id="x-hint">Fx 12345678</span>
  <input type="text" id="x" name="x" class="form-input input-width-m" aria-describedby="x-hint" required>
</div>
```
Error state: `div.form-group.form-error`, `span.form-error-message#x-error` starting with
`<span class="sr-only">Fejl: </span>`, input gets `form-input-error`, `aria-invalid="true"`,
`aria-describedby="x-error"`. Widths `input-width-xxs|xs|s|m|l|xl` (8 to 48rem) and
`input-char-4|8|11|27`. Mark the minority: "(frivilligt)" when most are required.

### Fejlopsummering
```html
<nav aria-labelledby="error-summary-heading">
  <div class="alert alert-error mt-0 mb-8" role="alert" data-module="error-summary">
    <svg class="icon-svg alert-icon" aria-label="Fejl" focusable="false"><use href="#error"></use></svg>
    <div class="alert-body">
      <h2 class="alert-heading" id="error-summary-heading">Der er problemer</h2>
      <ul class="alert-text nobullet-list"><li><a class="function-link" href="#x">Same text as the field error</a></li></ul>
    </div>
  </div>
</nav>
```
Above the h1, below back links. Focus moves to it on submit. Init via `DKFDS.init()` or
`new DKFDS.ErrorSummary(el).init()`.

### Beskeder (alerts)
`div.alert.alert-{info|success|warning|error}` > `svg.icon-svg.alert-icon` + `div.alert-body`
> `h3.alert-heading` + `p.alert-text`. `role="alert"` only on warning and error.
`alert--paragraph` constrains width; `has-close` + `alert-close` for dismissible.

### Knapper
`button.button.button-{primary|secondary|tertiary|warning}`, `button-icon-only`,
`xs-full-width`, grouped in `.button-group`. One primary per view. Buttons act, links
navigate. Warning only for irreversible actions.

## Writing rules that apply to copy
Plain Danish, "du" form, one idea per sentence, the citizen's words not the system's.
Mark required/optional per the minority rule. Error text says what to do, not what
went wrong in system terms.

## Integration in this repo (frontend)

Installed 2026-10-10, issue #64.

- Package: `dkfds@11.3.0` (dependencies) and `sass` (devDependencies, compiles the
  SCSS entry).
- CSS entry: `assets/css/dkfds.scss` uses the borger.dk theme
  (`node_modules/dkfds/src/stylesheets/dkfds-borgerdk`) with `$font-path`,
  `$image-path` and `$icons-folder-path` pointing at `public/dkfds/`. It is loaded
  globally from `nuxt.config.ts` `css`.
- Vendored assets: `public/dkfds/fonts/IBMPlexSans/complete/{woff,woff2}` (plus the
  Regular eot/ttf the Regular face references) and `public/dkfds/img/` (logos,
  `svg-icons/` for CSS background icons, `all-svg-icons.svg` sprite). Refresh after a
  dkfds upgrade with the `cp` commands in the header of `assets/css/dkfds.scss`.
- Icon sprite: `app.vue` inlines `public/dkfds/img/all-svg-icons.svg` once (hidden by
  `.fds-icon-sprite`), so `<svg class="icon-svg" focusable="false" aria-hidden="true">
  <use href="#check"></use></svg>` works on every page.
- JS: `plugins/dkfds.client.ts` imports `dkfds` and initialises every component with
  a per-element guard (`data-fds-init`) on `app:mounted` and `page:finish`. DKFDS's own
  `init()` is not idempotent, so do not call it yourself; for markup mounted after the
  page (async wizard steps, error summaries) call `useNuxtApp().$dkfds.init(el)`.
  `$dkfds.lib` is the raw module (e.g. `new $dkfds.lib.Modal(el).show()`).

### Rem base

DKFDS sets `html { font-size: 62.5% }` and authors every rem against a 10px root; the
rest of this app (Tailwind utilities, scoped styles) is authored against the 16px
browser root. `postcss/dkfds-rem-rebase.mjs` (registered through the
`vite:extendConfig` hook) multiplies every rem in the output of `assets/css/dkfds.scss`
by 0.625, and the entry resets `html { font-size: 100% }` (76.8% for print). DKFDS
therefore renders pixel-identical while nothing else shrinks. Consequence: author our
own CSS in normal 16px rem; never copy a DKFDS rem value verbatim (DKFDS `1.6rem` is
our `1rem`).

### Tailwind during the migration

- `tailwind.config.ts`: `corePlugins.preflight = false` (DKFDS owns the reset and element
  styles) and `corePlugins.container = false` (DKFDS owns `.container`). The theme
  palette is the borger.dk palette above, font is IBM Plex Sans.
- Load order: `@nuxtjs/tailwindcss` injects its stylesheet first, `assets/css/dkfds.scss`
  comes after, so on a shared class name DKFDS wins.
- No `tw-` prefix: the codebase has ~760 `class=""` attributes (thousands of utility
  tokens), far above the threshold for a mechanical rename.
- Shared names where DKFDS has a different value and wins (its spacing utilities are
  `!important`): `mt|mb|ml|mr|mx|my|p|px|py|pt|pb|pl|pr-{n}` use the DKFDS 8px scale
  (1=2px, 2=4px, 3=8px, 4=16px, 5=24px, 6=32px, 7=40px, 8=48px, 9=56px) instead of
  Tailwind's 4px scale, and `container`, `row`, `col-*`, `d-none`, `d-*-block`,
  `badge`, `icon`, `italic`, `uppercase`, `sr-only`, `mx-auto`, `flex-wrap` are DKFDS
  classes. In DKFDS markup use DKFDS classes only; in the remaining Tailwind sections
  treat those spacing names as DKFDS values (or use arbitrary values like `p-[24px]`
  when the exact Tailwind pixel matters).
