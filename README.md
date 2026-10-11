# ÅbenForms Frontend

**The citizen-facing Nuxt 3 frontend for ÅbenForms, built on Det Fælles Designsystem (DKFDS).**

[![Nuxt](https://img.shields.io/badge/Nuxt-3.21-00DC82)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D)](https://vuejs.org)
[![DKFDS](https://img.shields.io/badge/DKFDS-11.3.0-0059B3)](https://designsystem.dk)
[![Playwright](https://img.shields.io/badge/Playwright-1.63-45ba4b)](https://playwright.dev)
[![License](https://img.shields.io/badge/License-GPL--2.0-green)](LICENSE)

Live at **https://aabenforms.dk**. The backend (Drupal 11 + ECA) runs at https://api.aabenforms.dk. Its code is in [madsnorgaard/AabenForms](https://github.com/madsnorgaard/AabenForms).

## What it does

ÅbenForms shows how a public self-service form can stop asking citizens for things the public sector already knows. The frontend:

- **Renders Drupal webforms** and submits them to the backend, where ECA flows run the case.
- **Prefills known data with provenance.** Each value shows which register it came from, the legal basis, a status (LIVE, LIVE-PARAT or DEMO) and an audit id.
- **Logs citizens in with MitID.** Production uses a mock IdP (Keycloak at auth.aabenforms.dk) until real MitID registration is in place.
- **Shows guided demo scenarios** at `/demo`, covering whole cases from application to decision letter.
- **Follows DKFDS** throughout, with the official Virk theme (#0059B3) and borger.dk green as an accent.

### Status labels used in the demos

| Label | Meaning |
|---|---|
| LIVE | AabenForms' own data, for example the case register |
| LIVE-PARAT | The integration code exists; it needs a certificate and an agreement (MitID, Digital Post) |
| DEMO | The integration is not built yet; the data comes from a demo rail (CPR Familie+, STIL, eIndkomst, NemRefusion) |

## Demo scenarios

| Route | Persona | What the citizen does not have to type |
|---|---|---|
| `/demo/byggetilladelse` | Freja | Name, CPR and address (the simple scenario) |
| `/demo/merudgifter` | Freja | Her children (family register). Income is not fetched, because SEL §41 does not depend on it |
| `/demo/skoleskift` | Freja, Lars, school leader | Custody and the child's current school. Lars co-signs with his own MitID, the school leader decides, and both parents get the decision letter |
| `/demo/klage` | Birthe | Her cases, the decision and the klagefrist. She only types the reason |
| `/demo/sygedagpenge` | Mikkel | Employer and working hours. He only types his limitations |

Each scenario has a one-click persona login on a DKFDS-styled mock MitID page. The demo pages are switched on by `NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true`.

## Stack

| Component | Version |
|---|---|
| Nuxt | 3.21 |
| Vue | 3.5 |
| DKFDS (`dkfds`) | 11.3.0, Virk theme, self-hosted IBM Plex Sans |
| @nuxtjs/i18n | 9 (Danish primary, English translation) |
| Pinia (@pinia/nuxt) | 0.5 |
| Tailwind CSS | 3.4, with preflight off so DKFDS owns base styles |
| Playwright + @axe-core/playwright | 1.63 / 4.12 |
| Node / pnpm | 22 / 9.15.0 |

DKFDS rules for this repo, covering markup, palette and the rem rebase for DKFDS's 62.5% root font size, are in [`docs/DKFDS_REFERENCE.md`](docs/DKFDS_REFERENCE.md).

## Security model

- **The MitID session id is a bearer capability.** Calls to the backend send it as `Authorization: Bearer <id>`, never in a URL.
- **Logout fully ends the session.** It clears local state, then makes a top-level form POST to the backend's `/mitid/logout`, with the session id in the body. The backend revokes the session and ends the IdP session with an `id_token_hint`.
- **CPR numbers reach the browser only masked.** The client never sends another person's CPR; the backend resolves family members from the register.

Still open: the MitID callback hands the session id to the SPA in the return URL, and the SPA keeps it in localStorage (backend [#156](https://github.com/madsnorgaard/AabenForms/issues/156), [#252](https://github.com/madsnorgaard/AabenForms/issues/252)).

## Cookies

The DKFDS cookie notice (`components/fds/FdsCookieBanner.vue`) sits before the header and does not block the page, because consent must be freely given. The choice is stored in the first-party cookie `af_consent` for 12 months. A statistics script, configured with `NUXT_PUBLIC_ANALYTICS_SCRIPT`, loads only after the visitor accepts. The policy page is `/cookies`.

## Local development (DDEV)

```bash
cd frontend
ddev start
ddev exec pnpm install
```

| URL | What |
|---|---|
| https://aabenforms-frontend.ddev.site:3001 | The frontend (a production build served by the DDEV daemon, no HMR) |
| https://aabenforms.ddev.site | Backend (Drupal, separate DDEV project) |
| http://localhost:8080 | Mock MitID (Keycloak, realm `danish-gov-test`) |

DDEV serves a production build, so rebuild after changes:

```bash
ddev exec "NUXT_SKIP_PRERENDER=1 pnpm run build" && ddev restart
```

Personas for the mock MitID are defined in the backend realm file (`backend/.ddev/mocks/keycloak/realms/danish-gov-test.json`).

## Project structure

```
components/
  fds/            DKFDS wrappers (header, footer, inputs, alerts, step indicator, cookie banner)
  demo/           Demo wizard, provenance panel, persona login, Digital Post inbox
  auth/ landing/ ui/ workflow/
composables/
  scenarios/      One config per demo scenario
  useAuth.ts usePrefill.ts useDemoScenario.ts useConsent.ts useApi.ts ...
pages/
  demo/           /demo hub and the five scenarios
  forms/[slug].vue  webform rendering
  cases/inbox.vue   caseworker inbox
  cookies.vue tilgaengelighed.vue kontakt.vue auth/callback.vue
stores/           user, case, form, tenant
i18n/locales/     da.json, en.json
plugins/          consent.client.ts, dkfds.client.ts
tests/e2e/        Playwright specs, a11y/ holds the axe suite
docs/             DKFDS_REFERENCE.md, testing.md, guides/, reports/
```

## Testing

The specs run against a built frontend and the DDEV backend:

```bash
# Every demo spec with real mock-MitID logins (chromium)
BASE_URL=https://aabenforms-frontend.ddev.site:3001 E2E_FULL_AUTH=1 \
  pnpm exec playwright test --project=chromium

# Only the axe (WCAG 2.1 AA) suite
BASE_URL=https://aabenforms-frontend.ddev.site:3001 pnpm test:a11y

# Save screenshots for material
SCREENSHOT_DIR=/tmp/shots BASE_URL=... E2E_FULL_AUTH=1 pnpm exec playwright test tests/e2e/demo-skoleskift.spec.ts --project=chromium
```

Without `E2E_FULL_AUTH=1`, only the smoke tests that need no login run.

**CI** (`.github/workflows/quality.yml`) runs on every pull request and on main: a dependency audit of what ships, a production build, and the Playwright smoke and axe suites without a backend. The full-auth specs run locally against DDEV. See [`docs/testing.md`](docs/testing.md).

## Deployment

Merging to `main` deploys to production: `deploy.yml` dispatches to [contabo-infrastructure](https://github.com/madsnorgaard/contabo-infrastructure), which builds the Docker image on the server. Build-time flags are set per project in that repo's `deploy.yml`:

| Variable | Purpose |
|---|---|
| `API_BASE_URL` | Backend base URL (`https://api.aabenforms.dk` in production) |
| `NUXT_PUBLIC_MITID_ENABLED` | Show MitID login (default on) |
| `NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED` | Enable the `/demo` pages |
| `NUXT_PUBLIC_ANALYTICS_SCRIPT` | Statistics script, loaded only after cookie consent |

The production Keycloak at auth.aabenforms.dk is managed by hand. Manual rollout steps are tracked in [#71](https://github.com/madsnorgaard/aabenforms-frontend/issues/71).

## Related

- **Backend:** [madsnorgaard/AabenForms](https://github.com/madsnorgaard/AabenForms), Drupal 11 with ECA flows, prefill, MitID and Digital Post
- **Deployment:** [contabo-infrastructure](https://github.com/madsnorgaard/contabo-infrastructure)

## License

GPL-2.0. See [LICENSE](LICENSE).
