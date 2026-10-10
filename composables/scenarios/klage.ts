import type { DemoScenarioConfig } from '~/types/demo'

/**
 * Klage over en afgørelse: the inclusion scenario (issue #70).
 *
 * Mikkel helps his mother Birthe at the kitchen table, but Birthe logs in
 * with her own MitID: the helper never logs in as the parent. Acting on her
 * behalf with fuldmagt is roadmap (backend #241).
 *
 * Fetched: the applicant CPR from the MitID login (live-capable) and Birthe's
 * cases from the AabenForms sagsregister (live) with afgørelse, afgørelsesdato
 * and the computed klagefrist, as a radio choice. Typed: only the reason.
 *
 * The ECA flow (klage_flow) runs mitid_validate -> verify_ownership ->
 * case_appeal; the case status becomes "paaklaget". No Digital Post letter
 * is sent: Birthe is exempt from Digital Post and the physical-letter rail is
 * not built yet (backend #242).
 */

export const klageScenario: DemoScenarioConfig = {
  id: 'klage',
  webformId: 'klage',
  path: '/demo/klage',
  available: true,
  difficulty: 'medium',
  persona: { username: 'birthe.jensen', password: 'test1234', name: 'Birthe Jensen' },

  titleKey: 'demo.klage.title',
  storyKey: 'demo.klage.story',
  introKey: 'demo.klage.intro',
  fetchedKeys: [
    'demo.klage.hub.fetched.cases',
    'demo.klage.hub.fetched.deadline',
    'demo.klage.hub.fetched.cpr',
  ],
  typedKeys: ['demo.klage.hub.typed.reason'],

  loginBodyKey: 'demo.klage.login.body',
  formBodyKey: 'demo.klage.form.body',

  prefillMap: [
    { key: 'applicant_cpr', labelKey: 'demo.klage.fields.applicantCpr' },
    {
      key: 'case_id',
      labelKey: 'demo.klage.fields.case',
      option: {
        valueProp: 'case_id',
        labelProp: 'title',
        hintProps: ['case_id', 'afgoerelse_type', 'afgoerelse_date', 'klagefrist', 'status_label'],
      },
    },
  ],

  form: [
    {
      key: 'klage_begrundelse',
      type: 'textarea',
      labelKey: 'demo.klage.fields.begrundelse',
      hintKey: 'demo.klage.fields.begrundelseHint',
      required: true,
      errorKey: 'demo.klage.validation.begrundelse',
      rows: 6,
      width: 'xl',
    },
  ],

  // applicant_cpr travels masked: the backend fills the real CPR from the
  // MitID session and verify_ownership checks the case belongs to it. No
  // other person's CPR is ever sent from the browser.
  submitBody: ({ values, choices, sessionId }) => ({
    data: {
      workflow_id: sessionId,
      case_id: String(choices.case_id?.case_id ?? ''),
      applicant_cpr: values.applicant_cpr ?? '',
      klage_begrundelse: (values.klage_begrundelse ?? '').trim(),
    },
  }),

  outcome: {
    // The klage flow sends no letter (Digital Post exempt, see #242); the
    // wizard has no "no letter expected" mode yet, so this never matches a
    // stray letter from another scenario.
    letterMatches: (letter) => /klage/i.test(letter.subject),
    headingKey: 'demo.klage.complete.heading',
    bodyKey: 'demo.klage.complete.body',
    type: 'success',
  },

  commentaryKeys: {
    login: 'demo.klage.commentary.login',
    prefill: 'demo.klage.commentary.prefill',
    form: 'demo.klage.commentary.form',
    workflow: 'demo.klage.commentary.workflow',
    letter: 'demo.klage.commentary.letter',
  },
}
