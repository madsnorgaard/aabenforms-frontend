import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Generic webform wizard (components/WebformRenderer.vue) against a mocked
 * backend: GET /api/webform/gedisa_test returns a two-page schema with the
 * GEDISA block, POST /api/session/submit/gedisa_test returns a submission id.
 * No DDEV needed; runs against any built or dev server (BASE_URL).
 *
 * Covers: intro (have_ready, legal basis), steps, a `#states`-driven stop
 * alert that disables Næste, per-step required validation, the opsummering
 * with Redigér links, the erklæring gate on the summary page and the receipt.
 */

const FORM_ID = 'gedisa_test'

const SCHEMA = {
  data: {
    type: 'webform',
    id: FORM_ID,
    attributes: {
      id: FORM_ID,
      title: 'Merudgifter til et barn med handicap',
      description: '',
      requires_mitid: false,
      settings: {
        submit_label: 'Indsend ansøgning',
        confirmation_message: 'Fallback confirmation (not used when gedisa.next_steps is set)',
      },
      pages: [
        { key: 'om_ansoegningen', title: 'Om ansøgningen', description: 'Svar på et par spørgsmål først.', elements: ['screen_barn_under_18', 'stop_barn_over_18'] },
        { key: 'hvem_soeger', title: 'Hvem søger', elements: ['applicant_name', 'applicant_phone', 'applicant_email'] },
        { key: 'opsummering', title: 'Opsummering og erklæring', elements: ['erklaering'] },
      ],
      gedisa: {
        intro: '<p>Du kan søge om dækning af nødvendige merudgifter, når dit barn under 18 år har et handicap.</p>',
        have_ready: ['Dokumentation for udgifterne', 'Barnets CPR-nummer'],
        legal_basis: [
          { title: 'Serviceloven § 41, stk. 1', url: 'https://www.retsinformation.dk/eli/lta/2024/1000#P41' },
          { title: 'Forvaltningsloven § 7' },
        ],
        expected_response: 'Du hører fra os inden for 4 uger.',
        next_steps: '<p>Vi gennemgår din ansøgning og skriver til dig i Digital Post.</p>',
        recipient: { name: 'Demo Kommune', department: 'Familieafdelingen', phone: '12 34 56 78', email: 'familie@demo.dk', hours: 'Mandag til fredag kl. 9-15' },
      },
      elements: {
        om_ansoegningen: { '#type': 'webform_wizard_page', '#title': 'Om ansøgningen' },
        screen_barn_under_18: {
          '#type': 'radios',
          '#title': 'Er barnet under 18 år?',
          '#required': true,
          '#options': { ja: 'Ja', nej: 'Nej' },
          '#webform_parent_key': 'om_ansoegningen',
        },
        stop_barn_over_18: {
          '#type': 'webform_markup',
          '#markup': '<p>Du kan ikke søge merudgifter her, når barnet er fyldt 18. Søg i stedet om merudgifter til voksne.</p>',
          '#attributes': { 'data-aabenforms-alert': 'stop' },
          '#states': { visible: { ':input[name="screen_barn_under_18"]': { value: 'nej' } } },
          '#webform_parent_key': 'om_ansoegningen',
        },
        hvem_soeger: { '#type': 'webform_wizard_page', '#title': 'Hvem søger' },
        applicant_name: { '#type': 'textfield', '#title': 'Dit navn', '#required': true, '#webform_parent_key': 'hvem_soeger' },
        applicant_phone: { '#type': 'tel', '#title': 'Telefonnummer', '#webform_parent_key': 'hvem_soeger' },
        applicant_email: {
          '#type': 'email',
          '#title': 'E-mail',
          '#states': { required: { ':input[name="applicant_phone"]': { empty: true } } },
          '#webform_parent_key': 'hvem_soeger',
        },
        opsummering: { '#type': 'webform_wizard_page', '#title': 'Opsummering og erklæring' },
        erklaering: {
          '#type': 'checkbox',
          '#title': 'Jeg erklærer, at oplysningerne er rigtige, og jeg ved, at kommunen kan kontrollere dem i registre.',
          '#required': true,
          '#webform_parent_key': 'opsummering',
        },
        internal_flag: { '#type': 'hidden', '#default_value': 'web' },
      },
    },
  },
}

let submitted: any[] = []

async function mockBackend(page: Page) {
  submitted = []
  // Catch-all for the API host first (Playwright matches the last route
  // registered first), so unrelated calls fail fast instead of hanging.
  await page.route('https://api.aabenforms.dk/**', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"errors":[]}' }),
  )
  await page.route(`**/api/webform/${FORM_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/vnd.api+json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(SCHEMA),
    }),
  )
  await page.route(`**/api/session/submit/${FORM_ID}`, async (route) => {
    submitted.push(route.request().postDataJSON())
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, submission_id: 123, data: { type: 'webform_submission', id: '123', attributes: { case_number: 'SAG-2026-00123' } } }),
    })
  })
}

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
  expect(violations, formatViolations(violations)).toEqual([])
}

const nextButton = (page: Page) => page.getByRole('button', { name: 'Næste' })
const stepHeading = (page: Page) => page.locator('.webform-step__heading')

async function openForm(page: Page) {
  await mockBackend(page)
  await page.goto(`/forms/${FORM_ID}`, { waitUntil: 'commit', timeout: 30000 })
  await expect(page.locator('.form-fields h1')).toHaveText('Merudgifter til et barn med handicap', { timeout: 20000 })
}

test.describe('Generic webform wizard', () => {
  test('intro renders the GEDISA block before step 1', async ({ page }) => {
    await openForm(page)
    const intro = page.locator('.webform-intro')
    await expect(intro).toContainText('Du kan søge om dækning af nødvendige merudgifter')
    await expect(intro.getByRole('heading', { name: 'Det skal du have klar' })).toBeVisible()
    await expect(intro.locator('li', { hasText: 'Dokumentation for udgifterne' })).toBeVisible()
    await expect(intro.getByRole('heading', { name: 'Lovgrundlag' })).toBeVisible()
    await expect(intro.getByRole('link', { name: /Serviceloven § 41, stk\. 1/ })).toHaveAttribute('href', /retsinformation\.dk/)
    await expect(intro.locator('li', { hasText: 'Forvaltningsloven § 7' })).toBeVisible()
    await expect(intro).toContainText('Demo Kommune')

    // Step 1 is current in the indicator, with the summary as the last step.
    const steps = page.locator('nav ol.step-indicator li')
    await expect(steps).toHaveCount(3)
    await expect(steps.nth(0)).toHaveClass(/current/)
    await expect(steps.nth(0).locator('a')).toHaveAttribute('aria-current', 'step')
    await expect(steps.nth(2)).toContainText('Opsummering og erklæring')
    await expect(stepHeading(page)).toContainText('Om ansøgningen')
    await expect(page.locator('.webform-step__description')).toHaveText('Svar på et par spørgsmål først.')
  })

  test('a stop alert via #states blocks Næste until the answer changes', async ({ page }) => {
    await openForm(page)
    await expect(page.locator('[data-aabenforms-alert="stop"]')).toHaveCount(0)
    await expect(nextButton(page)).toBeEnabled()

    await page.getByRole('radio', { name: 'Nej' }).check()
    const stop = page.locator('[data-aabenforms-alert="stop"]')
    await expect(stop).toBeVisible()
    await expect(stop.locator('.alert-error')).toContainText('Du kan ikke søge merudgifter her')
    await expect(nextButton(page)).toBeDisabled()
    await expect(page.locator('.webform-stop-notice')).toHaveText('Du kan ikke fortsætte, før du har rettet svaret ovenfor')

    await page.getByRole('radio', { name: 'Ja' }).check()
    await expect(stop).toHaveCount(0)
    await expect(nextButton(page)).toBeEnabled()
  })

  test('Næste validates the current step and moves focus to the next heading', async ({ page }) => {
    await openForm(page)
    await nextButton(page).click()
    const summary = page.locator('[data-module="error-summary"]')
    await expect(summary).toBeVisible()
    await expect(summary).toBeFocused()
    await expect(summary.getByRole('link', { name: 'Er barnet under 18 år? skal udfyldes' })).toHaveAttribute('href', '#wf-screen_barn_under_18')
    await expect(page.locator('.field-key-screen_barn_under_18 .form-error-message')).toContainText('skal udfyldes')
    await expect(stepHeading(page)).toContainText('Om ansøgningen')

    await page.getByRole('radio', { name: 'Ja' }).check()
    await nextButton(page).click()
    await expect(summary).toHaveCount(0)
    await expect(stepHeading(page)).toContainText('Hvem søger')
    await expect(stepHeading(page)).toBeFocused()
    await expect(page.locator('nav ol.step-indicator li').nth(1)).toHaveClass(/current/)

    // #states required: e-mail is required while the phone is empty.
    await page.getByLabel('Dit navn').fill('Freja Nielsen')
    await nextButton(page).click()
    await expect(page.locator('[data-module="error-summary"]').getByRole('link', { name: 'E-mail skal udfyldes' })).toBeVisible()
    await page.getByLabel('Telefonnummer').fill('12345678')
    await nextButton(page).click()
    await expect(stepHeading(page)).toContainText('Opsummering og erklæring')
  })

  test('summary lists the answers with Redigér, the erklæring gates the submit, and the receipt follows', async ({ page }) => {
    await openForm(page)
    await page.getByRole('radio', { name: 'Ja' }).check()
    await nextButton(page).click()
    await page.getByLabel('Dit navn').fill('Freja Nielsen')
    await page.getByLabel('E-mail').fill('freja@example.dk')
    await nextButton(page).click()

    await expect(stepHeading(page)).toContainText('Opsummering og erklæring')
    const rows = page.locator('.webform-summary__row')
    await expect(rows).toHaveCount(4)
    await expect(page.locator('.summary-key-screen_barn_under_18 .webform-summary__value')).toHaveText('Ja')
    await expect(page.locator('.summary-key-applicant_name .webform-summary__value')).toHaveText('Freja Nielsen')
    await expect(page.locator('.summary-key-applicant_phone .webform-summary__value')).toHaveText('Ikke udfyldt')
    await expect(page.locator('.summary-key-applicant_email .webform-summary__value')).toHaveText('freja@example.dk')
    // The stop markup and the erklæring (below the list) are not rows.
    await expect(page.locator('.summary-key-stop_barn_over_18')).toHaveCount(0)
    await expect(page.locator('.summary-key-erklaering')).toHaveCount(0)

    // Redigér goes back to the page and focuses the field.
    await page.locator('.summary-key-applicant_name .webform-summary__edit').click()
    await expect(stepHeading(page)).toContainText('Hvem søger')
    await expect(page.getByLabel('Dit navn')).toBeFocused()
    await page.getByLabel('Dit navn').fill('Freja Nielsen Hansen')
    // Forward through the indicator (the step was reached before).
    await page.locator('nav ol.step-indicator li').nth(2).locator('a').click()
    await expect(stepHeading(page)).toContainText('Opsummering og erklæring')
    await expect(page.locator('.summary-key-applicant_name .webform-summary__value')).toHaveText('Freja Nielsen Hansen')

    // Submit without the erklæring: validation error, no request sent.
    const submit = page.getByRole('button', { name: 'Indsend ansøgning' })
    await expect(submit).toBeEnabled()
    await submit.click()
    await expect(page.locator('[data-module="error-summary"]')).toContainText('Jeg erklærer, at oplysningerne er rigtige')
    expect(submitted).toHaveLength(0)

    await page.getByRole('checkbox', { name: /Jeg erklærer/ }).check()
    await submit.click()

    // Receipt replaces the form.
    const receipt = page.locator('.webform-receipt')
    await expect(receipt).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.form-fields')).toHaveCount(0)
    await expect(receipt).toHaveAttribute('role', 'status')
    await expect(receipt.getByRole('heading', { name: 'Vi har modtaget din ansøgning' })).toBeVisible()
    await expect(receipt.locator('.webform-receipt__reference')).toHaveText('SAG-2026-00123')
    await expect(receipt.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/)
    await expect(receipt.getByRole('heading', { name: 'Det sendte du' })).toBeVisible()
    await expect(receipt.locator('.summary-key-erklaering .webform-summary__value')).toHaveText('Ja')
    await expect(receipt.locator('.webform-summary__edit')).toHaveCount(0)
    await expect(receipt.getByRole('heading', { name: 'Hvad sker der nu' })).toBeVisible()
    await expect(receipt).toContainText('Vi gennemgår din ansøgning og skriver til dig i Digital Post.')
    await expect(receipt).toContainText('Du hører fra os inden for 4 uger.')
    await expect(receipt).toContainText('Demo Kommune, Familieafdelingen')
    await expect(receipt.getByRole('link', { name: '12 34 56 78' })).toHaveAttribute('href', 'tel:12345678')
    await expect(receipt.getByRole('button', { name: 'Udskriv kvittering' })).toBeVisible()
    await expect(receipt).not.toContainText('Book et')

    // The payload holds the answers plus the hidden default, not the markup.
    expect(submitted).toHaveLength(1)
    const data = submitted[0].data.attributes.data
    expect(data).toMatchObject({
      screen_barn_under_18: 'ja',
      applicant_name: 'Freja Nielsen Hansen',
      applicant_email: 'freja@example.dk',
      erklaering: 1,
      internal_flag: 'web',
    })
    expect(data).not.toHaveProperty('stop_barn_over_18')
  })

  test('a 422 field error from the backend lands on the erklæring checkbox', async ({ page }) => {
    await openForm(page)
    await page.route(`**/api/session/submit/${FORM_ID}`, (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Validation failed', field: 'erklaering', errors: { erklaering: 'Du skal erklære, at oplysningerne er rigtige.' } }),
      }),
    )
    await page.getByRole('radio', { name: 'Ja' }).check()
    await nextButton(page).click()
    await page.getByLabel('Dit navn').fill('Freja Nielsen')
    await page.getByLabel('E-mail').fill('freja@example.dk')
    await nextButton(page).click()
    await page.getByRole('checkbox', { name: /Jeg erklærer/ }).check()
    await page.getByRole('button', { name: 'Indsend ansøgning' }).click()

    const field = page.locator('.field-key-erklaering')
    await expect(field.locator('.form-error-message')).toContainText('Du skal erklære, at oplysningerne er rigtige.')
    await expect(field.locator('input#wf-erklaering')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('[data-module="error-summary"]').getByRole('link', { name: 'Du skal erklære, at oplysningerne er rigtige.' })).toHaveAttribute('href', '#wf-erklaering')
    await expect(page.locator('.validation-errors')).toHaveCount(0)
    await expect(page.locator('.webform-receipt')).toHaveCount(0)
  })

  test('wizard, summary and receipt have no WCAG 2.1 AA violations', async ({ page }) => {
    await openForm(page)
    await page.getByRole('radio', { name: 'Nej' }).check()
    await expect(page.locator('[data-aabenforms-alert="stop"]')).toBeVisible()
    await scan(page)

    await page.getByRole('radio', { name: 'Ja' }).check()
    await nextButton(page).click()
    await nextButton(page).click()
    await expect(page.locator('[data-module="error-summary"]')).toBeVisible()
    await scan(page)

    await page.getByLabel('Dit navn').fill('Freja Nielsen')
    await page.getByLabel('E-mail').fill('freja@example.dk')
    await nextButton(page).click()
    await expect(stepHeading(page)).toContainText('Opsummering og erklæring')
    await scan(page)

    await page.getByRole('checkbox', { name: /Jeg erklærer/ }).check()
    await page.getByRole('button', { name: 'Indsend ansøgning' }).click()
    await expect(page.locator('.webform-receipt')).toBeVisible({ timeout: 15000 })
    await scan(page)
  })

  test('a schema without pages renders one step plus the summary', async ({ page }) => {
    await mockBackend(page)
    const flat = JSON.parse(JSON.stringify(SCHEMA))
    flat.data.attributes.pages = []
    delete flat.data.attributes.gedisa
    await page.route(`**/api/webform/${FORM_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/vnd.api+json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(flat) }),
    )
    await page.goto(`/forms/${FORM_ID}`, { waitUntil: 'commit', timeout: 30000 })
    await expect(page.locator('.form-fields h1')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.webform-intro')).toHaveCount(0)
    const steps = page.locator('nav ol.step-indicator li')
    await expect(steps).toHaveCount(2)
    await expect(steps.nth(1)).toContainText('Opsummering')
    await expect(page.getByLabel('Dit navn')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Jeg erklærer/ })).toBeVisible()
  })
})
