import type { DemoScenarioConfig } from '~/types/demo'

/**
 * Klage over en afgørelse: the inclusion scenario (issue #70).
 *
 * Mikkel helps his mother Birthe at the kitchen table, but Birthe logs in
 * with her own MitID: the helper never logs in as the parent. Acting on her
 * behalf with digital fuldmagt is its own scenario (klageFuldmagt.ts).
 *
 * Fetched: the applicant CPR from the MitID login (live-capable) and Birthe's
 * cases from the AabenForms sagsregister (live) with afgørelse, afgørelsesdato
 * and the computed klagefrist, as a radio choice. Typed: only the reason.
 *
 * The ECA flow (klage_flow) runs mitid_validate -> verify_ownership ->
 * case_appeal -> send_receipt; the case status becomes "paaklaget". Birthe
 * is exempt from Digital Post, so the receipt goes as a physical letter
 * (backend #242, DEMO print rail) and her digital inbox stays empty. Step 5
 * therefore shows a receipt instead of waiting for a letter.
 */

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

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
  tags: ['demo.klage.hub.tags.inclusion'],

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
        // A case past its klagefrist or already appealed stays visible but disabled.
        disabledWhen: (o) => !o.appealable,
        hintFormat: (o, t, d) => {
          const parts = [
            o.afgoerelse_type ? t('demo.klage.option.decision', { type: str(o.afgoerelse_type) }) : '',
            o.afgoerelse_date ? t('demo.klage.option.decided', { date: d(o.afgoerelse_date) }) : '',
            o.klagefrist ? t('demo.klage.option.deadline', { date: d(o.klagefrist) }) : '',
            !o.appealable && o.status_label ? t('demo.klage.option.status', { status: str(o.status_label) }) : '',
          ]
          return parts.filter(Boolean).join(' · ')
        },
        choiceHintKey: 'demo.klage.option.chooseHint',
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
  submitBody: ({ values, choices }) => ({
    data: {
      case_id: String(choices.case_id?.case_id ?? ''),
      applicant_cpr: values.applicant_cpr ?? '',
      klage_begrundelse: (values.klage_begrundelse ?? '').trim(),
    },
  }),

  // Birthe is exempt from Digital Post: her letters go on paper (#242).
  prefillAlert: (prefill) =>
    prefill.session.digital_post_exempt ? { type: 'info', textKey: 'demo.klage.prefill.exempt' } : null,

  outcome: {
    // No digital letter: Digital Post exempt, the receipt goes on paper (#242).
    expectLetter: false,
    headingKey: 'demo.klage.complete.heading',
    bodyKey: 'demo.klage.complete.body',
    type: 'success',
    // Only shown when every workflow step completed (case_appeal included).
    receipt: ({ choices, t, d }) => [
      { labelKey: 'demo.klage.receipt.caseNumber', value: str(choices.case_id?.case_id) },
      { labelKey: 'demo.klage.receipt.status', value: t('demo.klage.receipt.statusValue') },
      { labelKey: 'demo.klage.receipt.deadline', value: d(choices.case_id?.klagefrist) },
    ],
  },

  commentaryKeys: {
    login: 'demo.klage.commentary.login',
    prefill: 'demo.klage.commentary.prefill',
    form: 'demo.klage.commentary.form',
    workflow: 'demo.klage.commentary.workflow',
    letter: 'demo.klage.commentary.letter',
  },
}
