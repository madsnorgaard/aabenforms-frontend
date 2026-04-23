# End-to-end testing

Playwright runs against a containerized production preview build, not
the Nuxt dev server. This doc explains why, how to run it, and what is
and isn't covered today.

## Why not the dev server

Nuxt 3.15 paired with vue-router 4.6.4 has a reproducible SSR crash in
dev mode:

```
Cannot read properties of undefined (reading 'value')
  at ComputedRefImpl.fn (node_modules/vue-router/dist/vue-router.mjs:903:98)
```

It surfaces after a handful of rapid page renders - tests pass in
isolation but the suite locks up the dev server. The dev server can
stay alive for interactive browser testing; it just isn't a reliable
Playwright target.

Running against a prod-like `nuxt preview` build sidesteps the crash
and also catches build-time issues that dev mode skips.

## Prerequisites

- DDEV backend must be running. From the backend repo:
  ```bash
  ddev start
  ```
  This boots Drupal, Keycloak, WireMock, and exposes the
  `ddev_default` docker network the test containers attach to.
- Docker must be able to reach the `ddev_default` network. The runner
  script refuses to start if it isn't present.

## Running the suite

From the frontend repo root:

```bash
# Default: landing + workflows specs on chromium (fast, green today)
bash run-e2e-container.sh

# All specs including auth (auth has a known limitation, see below)
bash run-e2e-container.sh all

# Drop into the Playwright container shell
bash run-e2e-container.sh shell
```

The script sits on top of `docker-compose.test.yml`. Raw compose works
too:

```bash
docker compose -f docker-compose.test.yml up --build \
  --abort-on-container-exit --exit-code-from playwright
```

## What's in the suite

As of Apr 23, 2026:

| File | Tests | Status |
|------|-------|--------|
| `tests/e2e/landing.spec.ts` | 11 | Green |
| `tests/e2e/workflows.spec.ts` | 3 UI + 3 backend API | Green |
| `tests/e2e/auth.spec.ts` | 5 describe blocks for MitID flow | Blocked inside container |

## Known limitation: auth tests inside the container

`auth.spec.ts` asserts on `localhost:8080` for the Keycloak redirect.
Drupal on DDEV emits that URL to the browser. When Playwright's browser
runs inside the container, `localhost:8080` resolves to the Playwright
container itself, not Keycloak. The assertion fails.

Two fixes are known (neither applied yet):

1. Run the Playwright service with `network_mode: host` and expose the
   preview on a free host port.
2. Make Drupal's `authorization_endpoint` configurable via an
   `AUTH_BASE_URL` env var, emit the Keycloak container hostname
   (`ddev-aabenforms-keycloak:8080`) in the test environment, and
   relax the spec's URL regex accordingly.

Option 2 is cleaner and survives Playwright running from anywhere.

## Adding a new spec

The existing specs use a shared-page pattern to survive the dev server
(kept in place here as a belt-and-braces habit and because some specs
still hit the Nuxt runtime from browser contexts):

```ts
test.describe('Feature', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    // Elements wrapped in <ClientOnly> need an explicit hydration wait:
    await sharedPage.waitForSelector('button:has-text("MitID")', { timeout: 15000 })
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('asserts something', async () => {
    await expect(sharedPage.getByRole('button', { name: /MitID/i })).toBeVisible()
  })
})
```

One describe block = one page load. Tests inside the block read state
from that single page. Serial mode prevents Playwright from opening
parallel pages that would hit the Nitro server's limits.

## i18n reminder

Danish locale strings in `locales/da.json` must use proper Unicode
(æ/ø/å). A lint-style check worth running before adding new strings:

```bash
grep -nE "Foralder|faelles|foraeldre|kraever|Gennemga[^å]|bekraefte|ansoeg|afgoer|gennemfort|Fortael|spoergsmaal|Proev|lovmaessig" locales/da.json
```

Anything this matches is probably a character-encoding slip and should
be fixed before shipping.
