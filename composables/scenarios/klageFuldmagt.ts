import type { DemoScenarioConfig, WorkflowStep } from '~/types/demo'

/**
 * Klage med digital fuldmagt: Mikkel helps his mother Birthe (backend #241).
 *
 * Mikkel logs in with his OWN MitID. His login carries a digital fuldmagt
 * from Birthe (mock IdP claim standing in for NemLog-in Digital Fuldmagt),
 * covering appeals and copies of her letters. The prefill runs for Birthe
 * (?subject=0 only points into the fuldmagt the verified session holds), so
 * her cases are fetched and Mikkel types only the reason.
 *
 * The backend makes Birthe the applicant and records Mikkel as actor with
 * the basis; klage_flow re-checks the fuldmagt from the session before the
 * case becomes "paaklaget". The receipt goes to Birthe, who is exempt from
 * Digital Post, so it is sent as a physical letter (backend #242, DEMO
 * print rail). Mikkel gets a copy in his own Digital Post because the
 * fuldmagt allows it.
 */

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))

const stepText = (s: WorkflowStep): string => `${s.name} ${s.description ?? ''}`

/**
 * How Birthe's receipt went, from the steps the flow actually ran: the copy
 * to Mikkel is always digital, so a physical step can only be hers.
 */
function receiptChannel(steps: WorkflowStep[]): 'physical' | 'digital' | null {
  const letters = steps.filter((s) => s.status === 'completed' && /letter|brev|digital post/i.test(stepText(s)))
  if (letters.some((s) => /physical|fysisk/i.test(stepText(s)))) return 'physical'
  return letters.length ? 'digital' : null
}

export const klageFuldmagtScenario: DemoScenarioConfig = {
  id: 'klage-fuldmagt',
  webformId: 'klage',
  path: '/demo/klage-fuldmagt',
  available: true,
  difficulty: 'medium',
  persona: { username: 'mikkel.jensen', password: 'test1234', name: 'Mikkel Jensen' },

  titleKey: 'demo.klageFuldmagt.title',
  storyKey: 'demo.klageFuldmagt.story',
  introKey: 'demo.klageFuldmagt.intro',
  fetchedKeys: [
    'demo.klageFuldmagt.hub.fetched.fuldmagt',
    'demo.klage.hub.fetched.cases',
    'demo.klage.hub.fetched.deadline',
  ],
  typedKeys: ['demo.klage.hub.typed.reason'],
  tags: ['demo.klage.hub.tags.inclusion', 'demo.klageFuldmagt.hub.tags.onBehalf'],

  loginBodyKey: 'demo.klageFuldmagt.login.body',
  formBodyKey: 'demo.klageFuldmagt.form.body',

  // Act for the first (and in the demo only) person Mikkel's fuldmagt covers.
  prefillQuery: { subject: '0' },

  prefillMap: [
    { key: 'applicant_cpr', labelKey: 'demo.klageFuldmagt.fields.applicantCpr' },
    {
      key: 'case_id',
      labelKey: 'demo.klage.fields.case',
      option: {
        valueProp: 'case_id',
        labelProp: 'title',
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
      hintKey: 'demo.klageFuldmagt.fields.begrundelseHint',
      required: true,
      errorKey: 'demo.klage.validation.begrundelse',
      rows: 6,
      width: 'xl',
    },
  ],

  // Only an index into the verified fuldmagt goes up, plus Birthe's masked
  // CPR as shown. The backend resolves her CPR from Mikkel's session and
  // records him as the actor; no CPR leaves the browser.
  submitBody: ({ values, choices }) => ({
    data: {
      on_behalf_of: '0',
      case_id: String(choices.case_id?.case_id ?? ''),
      applicant_cpr: values.applicant_cpr ?? '',
      klage_begrundelse: (values.klage_begrundelse ?? '').trim(),
    },
  }),

  prefillAlert: (prefill) =>
    prefill.acting_for
      ? { type: 'info', textKey: 'demo.klageFuldmagt.prefill.actingFor', textParams: { name: prefill.acting_for.name, cpr: prefill.acting_for.cpr } }
      : { type: 'warning', textKey: 'demo.klageFuldmagt.prefill.noFuldmagt' },

  outcome: {
    // Mikkel's own inbox gets the copy; Birthe's receipt goes on paper.
    letterMatches: (letter) => /^Kopi: klage/.test(letter.subject),
    headingKey: 'demo.klageFuldmagt.complete.heading',
    bodyKey: 'demo.klageFuldmagt.complete.body',
    type: 'success',
    receipt: ({ choices, steps, t, d }) => {
      const channel = receiptChannel(steps)
      return [
        { labelKey: 'demo.klage.receipt.caseNumber', value: str(choices.case_id?.case_id) },
        { labelKey: 'demo.klage.receipt.status', value: t('demo.klage.receipt.statusValue') },
        { labelKey: 'demo.klageFuldmagt.receipt.actor', value: t('demo.klageFuldmagt.receipt.actorValue') },
        {
          labelKey: 'demo.klageFuldmagt.receipt.letter',
          value: channel ? t(channel === 'physical' ? 'demo.klageFuldmagt.receipt.letterPhysical' : 'demo.klageFuldmagt.receipt.letterDigital') : '',
        },
        { labelKey: 'demo.klage.receipt.deadline', value: d(choices.case_id?.klagefrist) },
      ]
    },
  },

  commentaryKeys: {
    login: 'demo.klageFuldmagt.commentary.login',
    prefill: 'demo.klageFuldmagt.commentary.prefill',
    form: 'demo.klageFuldmagt.commentary.form',
    workflow: 'demo.klageFuldmagt.commentary.workflow',
    letter: 'demo.klageFuldmagt.commentary.letter',
  },
}
