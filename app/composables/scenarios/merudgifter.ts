import { ref } from 'vue'
import type { DemoScenarioConfig } from '~/types/demo'

/**
 * Merudgifter (merudgifter, SEL §41): the medium scenario.
 *
 * Fetched: the applicant CPR from the MitID login (live-capable rail), the
 * children in Freja's custody from CPR Familie+ (SF6006, demo rail) as a
 * radio choice. Household income is deliberately NOT fetched: the SEL §41
 * merudgiftsydelse for a child does not depend on the parents' income, so
 * looking it up would breach data minimisation. Typed: the child's
 * disability and the monthly extra expense.
 *
 * The ECA flow (merudgifter_flow) decides on the amount: 1.000 kr/md or more
 * gives medhold and SF2900 close; under that it runs partshøring, afslag and
 * starts a 4-week klagefrist. Both outcomes send the same letter subject
 * ("Afgørelse: bevilling af / afslag på merudgiftsydelse (servicelovens §41)").
 */

/** Demo threshold in the ECA flow (kr/md). */
export const MERUDGIFTER_THRESHOLD = 1000

/**
 * Amount of the last submission in this tab. The wizard only takes static
 * outcome keys, so the outcome getters below read this ref (reactive) to show
 * medhold or afslag. After a reload mid-run it is null and the neutral copy
 * is shown.
 */
const lastAmount = ref<number | null>(null)

function outcomeVariant(): 'medhold' | 'afslag' | 'neutral' {
  if (lastAmount.value === null || Number.isNaN(lastAmount.value)) return 'neutral'
  return lastAmount.value >= MERUDGIFTER_THRESHOLD ? 'medhold' : 'afslag'
}

export const merudgifterScenario: DemoScenarioConfig = {
  id: 'merudgifter',
  webformId: 'merudgifter',
  path: '/demo/merudgifter',
  available: true,
  difficulty: 'medium',
  persona: { username: 'freja.nielsen', password: 'test1234', name: 'Freja Nielsen' },

  titleKey: 'demo.merudgifter.title',
  storyKey: 'demo.merudgifter.story',
  introKey: 'demo.merudgifter.intro',
  fetchedKeys: [
    'demo.hub.scenarios.merudgifter.fetched.children',
    'demo.hub.scenarios.merudgifter.fetched.noIncome',
    'demo.hub.scenarios.merudgifter.fetched.cpr',
  ],
  typedKeys: [
    'demo.hub.scenarios.merudgifter.typed.disability',
    'demo.hub.scenarios.merudgifter.typed.amount',
  ],

  prefillMap: [
    { key: 'applicant_cpr', labelKey: 'demo.merudgifter.fields.applicantCpr' },
    {
      // child_name and child_cpr carry the same SF6006 options list; one
      // radio row is enough, submitBody takes name and CPR from the choice.
      key: 'child_cpr',
      labelKey: 'demo.merudgifter.fields.child',
      option: { valueProp: 'cpr', labelProp: 'name', hintProps: ['cpr', 'birth_date'] },
    },
  ],

  form: [
    {
      key: 'funktionsnedsaettelse',
      type: 'textarea',
      labelKey: 'demo.merudgifter.fields.funktionsnedsaettelse',
      hintKey: 'demo.merudgifter.fields.funktionsnedsaettelseHint',
      required: true,
      errorKey: 'demo.merudgifter.validation.funktionsnedsaettelse',
      rows: 4,
      width: 'xl',
    },
    {
      key: 'maanedlig_merudgift',
      type: 'number',
      labelKey: 'demo.merudgifter.fields.maanedligMerudgift',
      hintKey: 'demo.merudgifter.fields.maanedligMerudgiftHint',
      required: true,
      errorKey: 'demo.merudgifter.validation.maanedligMerudgift',
      inputmode: 'numeric',
      width: 's',
      min: 0,
    },
  ],

  // applicant_cpr travels masked: the backend swaps in the CPR from the real
  // MitID session (fillCprFromMitIdSession). child_cpr travels masked as the
  // register delivered it; the demo flow accepts it.
  submitBody: ({ values, choices }) => {
    const child = choices.child_cpr ?? null
    const amount = Number(String(values.maanedlig_merudgift ?? '').replace(/\./g, '').replace(',', '.'))
    lastAmount.value = Number.isNaN(amount) ? null : amount
    return {
      data: {
        applicant_cpr: values.applicant_cpr ?? '',
        child_name: String(child?.name ?? ''),
        child_cpr: String(child?.cpr ?? ''),
        funktionsnedsaettelse: (values.funktionsnedsaettelse ?? '').trim(),
        maanedlig_merudgift: Number.isNaN(amount) ? values.maanedlig_merudgift : amount,
      },
    }
  },

  outcome: {
    letterMatches: (letter) => /merudgift/i.test(letter.subject),
    get headingKey() {
      return `demo.merudgifter.complete.${outcomeVariant()}.heading`
    },
    get bodyKey() {
      return `demo.merudgifter.complete.${outcomeVariant()}.body`
    },
    get type() {
      return outcomeVariant() === 'afslag' ? 'info' : 'success'
    },
  },

  commentaryKeys: {
    login: 'demo.merudgifter.commentary.login',
    prefill: 'demo.merudgifter.commentary.prefill',
    form: 'demo.merudgifter.commentary.form',
    workflow: 'demo.merudgifter.commentary.workflow',
    letter: 'demo.merudgifter.commentary.letter',
  },
}
