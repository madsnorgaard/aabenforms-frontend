# Testing

Playwright runs against a **production build** of the frontend, never the Nuxt dev server. That way it tests what deploys, including build-time problems the dev server skips.

## In CI (every pull request and main)

`.github/workflows/quality.yml` runs two jobs:

- **dependency audit:** `pnpm audit --prod --audit-level=high`. Advisories without a usable fix are listed in `package.json` under `pnpm.auditConfig.ignoreGhsas`. None of them ships in `.output`: they come from `@nuxt/devtools` (simple-git), the dev server (node-forge) and build tooling (braces). Re-check the list when Nuxt is upgraded.
- **e2e smoke + axe:**
  - builds with `NUXT_SKIP_PRERENDER=1`, starts `node .output/server/index.mjs`, and runs the smoke specs and the axe suite (`tests/e2e/a11y`, WCAG 2.0 and 2.1 A + AA) in Chromium;
  - runs with no backend and no mock MitID, so the specs that need a logged-in persona skip themselves (`E2E_FULL_AUTH`);
  - uploads `test-results/` on failure.

`build-check.yml` also builds the production Docker image.

## Locally, with the full backend (DDEV)

The full-auth specs log in with real mock-MitID personas and need the backend DDEV project and Keycloak running.

```bash
# DDEV serves a production build: rebuild after every change.
ddev exec "NUXT_SKIP_PRERENDER=1 pnpm run build" && ddev restart

# Everything, with logins (chromium).
BASE_URL=https://aabenforms-frontend.ddev.site:3001 E2E_FULL_AUTH=1 \
  pnpm exec playwright test --project=chromium --workers=1

# One scenario, with screenshots for material.
SCREENSHOT_DIR=/tmp/shots BASE_URL=https://aabenforms-frontend.ddev.site:3001 E2E_FULL_AUTH=1 \
  pnpm exec playwright test tests/e2e/demo-skoleskift.spec.ts --project=chromium
```

Personas: `freja.nielsen`, `lars.andersen`, `mikkel.jensen`, `sofie.hansen`, `birthe.jensen`, password `test1234`.

Many test logins inside one minute can hit the backend's rate limits (#142). Clear them locally with:

```bash
cd ../backend && ddev drush sqlq "DELETE FROM flood WHERE event LIKE 'aabenforms%'"
```

## What is covered

| Area | Specs |
|---|---|
| Front page, cookie banner, accessibility statement | `landing.spec.ts`, `cookies.spec.ts`, `a11y/` |
| Demo hub and every scenario | `demo-hub.spec.ts`, `byggetilladelse-demo.spec.ts`, `demo-*.spec.ts` |
| Logout, session handling | `logout.spec.ts` |
| Backend API contracts (protected forms refuse anonymous submits) | `workflows.spec.ts`, `specs/` |
| Caseworker inbox | `cases-inbox.spec.ts` |
| Screenshots for presentation material | `pitch-screens.spec.ts`, `school-family-*.spec.ts` |
