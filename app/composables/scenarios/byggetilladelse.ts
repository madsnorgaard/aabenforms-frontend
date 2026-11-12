import type { DemoScenarioConfig } from '~/types/demo'

/**
 * Byggetilladelse (building_permit): the simple scenario.
 *
 * Fetched: name and CPR from the MitID login (live-capable rail), the
 * address from the mock IdP's address claims (DEMO: real MitID does not
 * issue address claims, so the row says so). Typed: the building address if
 * the project is elsewhere, and the project description.
 */
export const byggetilladelseScenario: DemoScenarioConfig = {
  id: 'byggetilladelse',
  webformId: 'building_permit',
  path: '/demo/byggetilladelse',
  available: true,
  difficulty: 'simple',
  persona: { username: 'freja.nielsen', password: 'test1234', name: 'Freja Nielsen' },

  titleKey: 'demo.hub.scenarios.byggetilladelse.title',
  storyKey: 'demo.hub.scenarios.byggetilladelse.story',
  introKey: 'demo.hub.scenarios.byggetilladelse.intro',
  fetchedKeys: [
    'demo.hub.scenarios.byggetilladelse.fetched.name',
    'demo.hub.scenarios.byggetilladelse.fetched.cpr',
    'demo.hub.scenarios.byggetilladelse.fetched.address',
  ],
  typedKeys: [
    'demo.hub.scenarios.byggetilladelse.typed.description',
  ],

  prefillMap: [
    { key: 'applicant_name', labelKey: 'demo.byggetilladelse.form.fields.applicantName' },
    { key: 'cpr', labelKey: 'demo.byggetilladelse.form.fields.cpr' },
    {
      key: 'property_address',
      labelKey: 'demo.byggetilladelse.form.fields.address',
      editable: true,
      editHintKey: 'demo.hub.scenarios.byggetilladelse.addressHint',
      // The prefill endpoint lists property_address under not_asked (it is not
      // an identity element). The mock IdP issues address claims, so the demo
      // fills it from the session and labels the rail DEMO.
      sessionFallback: (user) => {
        const a = user.address
        if (!a) return null
        const line1 = a.street ?? ''
        const line2 = [a.postal_code, a.city].filter(Boolean).join(' ')
        const value = [line1, line2].filter(Boolean).join(', ')
        if (!value) return null
        return {
          value,
          source: {
            register: 'MitID (mock IdP)',
            contract: 'OIDC address claims',
            mode: 'demo',
            label: 'From the mock MitID login',
          },
        }
      },
    },
  ],

  form: [
    {
      key: 'project_description',
      type: 'textarea',
      labelKey: 'demo.byggetilladelse.form.fields.description',
      placeholderKey: 'demo.byggetilladelse.form.fields.descriptionPlaceholder',
      required: true,
      errorKey: 'demo.byggetilladelse.form.validation',
      rows: 4,
      width: 'xl',
    },
  ],

  // The server adds the MitID session (workflow_id) from its HttpOnly cookie;
  // the backend scopes the identity gate to it and fills the CPR from the
  // session.
  submitBody: ({ values, user }) => ({
    data: {
      attributes: {
        data: {
          cpr: user?.cpr,
          applicant_name: user?.name,
          property_address: values.property_address,
          project_description: (values.project_description ?? '').trim(),
        },
      },
    },
  }),

  outcome: {
    letterMatches: (letter) => /byggetilladelse/i.test(letter.subject),
    headingKey: 'demo.byggetilladelse.complete.heading',
    bodyKey: 'demo.byggetilladelse.complete.body',
  },

  commentaryKeys: {
    login: 'demo.byggetilladelse.commentary.auth',
    prefill: 'demo.hub.scenarios.byggetilladelse.commentary.prefill',
    form: 'demo.byggetilladelse.commentary.form',
    workflow: 'demo.byggetilladelse.commentary.workflow',
    letter: 'demo.byggetilladelse.commentary.inbox',
  },
}
