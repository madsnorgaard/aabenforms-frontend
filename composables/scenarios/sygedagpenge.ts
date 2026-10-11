import type { DemoScenarioConfig, PrefillField } from '~/types/demo'

/**
 * Sygedagpenge (lønmodtager): the oplysningsskema the kommune sends when the
 * employer has reported the citizen sick.
 *
 * Fetched: the applicant CPR from the MitID login (live-capable rail), the
 * employer (name + CVR) and the hours in the last 6 completed calendar months
 * from eIndkomst (demo rail), and the first sick day from the employer's
 * report in NemRefusion (demo rail). Pay is used by the kommune for the
 * calculation but never sent to the browser. Typed: what the citizen cannot
 * do (no diagnosis), the expected duration, treatment and an optional phone.
 *
 * Rules (borger.dk "Sygedagpenge, hvis du er lønmodtager", read 2026-10-10):
 * beskæftigelseskrav 240 hours in the last 6 completed calendar months with
 * at least 40 hours in 5 of them; the employer pays the first 30 calendar
 * days; the citizen answers the kommune's skema after the employer reports
 * via NemRefusion. The first opfølgningssamtale date in the letter (8 weeks
 * after the first sick day) is a demo simplification of "the kommune
 * vurderer the case within 8 weeks".
 *
 * The ECA flow (sygedagpenge_flow) decides medhold when the requirement is
 * met (Mikkel meets it) and sends a plain-language letter with the date.
 */

interface EmploymentHistory {
  total_hours: number
  required_hours: number
  reference_months: number
  requirement_met: boolean
}

export const sygedagpengeScenario: DemoScenarioConfig = {
  id: 'sygedagpenge',
  webformId: 'sygedagpenge',
  path: '/demo/sygedagpenge',
  available: true,
  difficulty: 'medium',
  persona: { username: 'mikkel.jensen', password: 'test1234', name: 'Mikkel Jensen' },
  tags: ['demo.hub.scenarios.sygedagpenge.tags.inclusion'],

  titleKey: 'demo.sygedagpenge.title',
  storyKey: 'demo.sygedagpenge.story',
  introKey: 'demo.sygedagpenge.intro',
  fetchedKeys: [
    'demo.hub.scenarios.sygedagpenge.fetched.employer',
    'demo.hub.scenarios.sygedagpenge.fetched.hours',
    'demo.hub.scenarios.sygedagpenge.fetched.firstSickDay',
    'demo.hub.scenarios.sygedagpenge.fetched.cpr',
  ],
  typedKeys: [
    'demo.hub.scenarios.sygedagpenge.typed.limitations',
    'demo.hub.scenarios.sygedagpenge.typed.duration',
  ],

  prefillMap: [
    { key: 'applicant_cpr', labelKey: 'demo.sygedagpenge.fields.applicantCpr' },
    { key: 'employer_name', labelKey: 'demo.sygedagpenge.fields.employer' },
    { key: 'employer_cvr', labelKey: 'demo.sygedagpenge.fields.employerCvr' },
    {
      key: 'employment_history',
      labelKey: 'demo.sygedagpenge.fields.hoursRequirement',
      format: (value: PrefillField['value'], t) => {
        const h = value as unknown as EmploymentHistory | null
        if (!h || typeof h !== 'object') return ''
        const key = h.requirement_met ? 'demo.sygedagpenge.fields.hoursMet' : 'demo.sygedagpenge.fields.hoursNotMet'
        return t(key, { hours: h.total_hours, months: h.reference_months, required: h.required_hours })
      },
    },
    {
      key: 'first_sick_day',
      labelKey: 'demo.sygedagpenge.fields.firstSickDay',
      format: (value, _t, d) => d(value),
    },
  ],

  form: [
    {
      key: 'sickness_description',
      type: 'textarea',
      labelKey: 'demo.sygedagpenge.fields.sicknessDescription',
      hintKey: 'demo.sygedagpenge.fields.sicknessDescriptionHint',
      required: true,
      errorKey: 'demo.sygedagpenge.validation.sicknessDescription',
      rows: 4,
      width: 'xl',
    },
    {
      key: 'expected_duration',
      type: 'select',
      labelKey: 'demo.sygedagpenge.fields.expectedDuration',
      required: true,
      errorKey: 'demo.sygedagpenge.validation.expectedDuration',
      width: 'm',
      options: [
        { value: 'under_4', labelKey: 'demo.sygedagpenge.fields.durationUnder4' },
        { value: '4_8', labelKey: 'demo.sygedagpenge.fields.duration4to8' },
        { value: 'over_8', labelKey: 'demo.sygedagpenge.fields.durationOver8' },
        { value: 'unknown', labelKey: 'demo.sygedagpenge.fields.durationUnknown' },
      ],
    },
    {
      key: 'in_treatment',
      type: 'radio',
      labelKey: 'demo.sygedagpenge.fields.inTreatment',
      required: true,
      errorKey: 'demo.sygedagpenge.validation.inTreatment',
      options: [
        { value: 'ja', labelKey: 'demo.sygedagpenge.fields.yes' },
        { value: 'nej', labelKey: 'demo.sygedagpenge.fields.no' },
      ],
    },
    {
      key: 'contact_phone',
      type: 'text',
      labelKey: 'demo.sygedagpenge.fields.contactPhone',
      hintKey: 'demo.sygedagpenge.fields.contactPhoneHint',
      inputmode: 'tel',
      width: 's',
    },
  ],

  // applicant_cpr travels masked: the backend swaps in the CPR from the real
  // MitID session. The first sick day and CVR travel as the registers
  // delivered them (raw ISO date, not the formatted display).
  submitBody: ({ values, prefill, sessionId }) => {
    const raw = (key: string) => {
      const v = prefill?.fields[key]?.value
      return typeof v === 'string' || typeof v === 'number' ? String(v) : ''
    }
    return {
      data: {
        workflow_id: sessionId,
        applicant_cpr: values.applicant_cpr ?? '',
        employer_cvr: raw('employer_cvr'),
        first_sick_day: raw('first_sick_day'),
        sickness_description: (values.sickness_description ?? '').trim(),
        expected_duration: values.expected_duration ?? '',
        in_treatment: values.in_treatment ?? '',
        contact_phone: (values.contact_phone ?? '').trim(),
      },
    }
  },

  outcome: {
    letterMatches: (letter) => /sygedagpenge/i.test(letter.subject),
    headingKey: 'demo.sygedagpenge.complete.heading',
    bodyKey: 'demo.sygedagpenge.complete.body',
    type: 'success',
  },

  commentaryKeys: {
    login: 'demo.sygedagpenge.commentary.login',
    prefill: 'demo.sygedagpenge.commentary.prefill',
    form: 'demo.sygedagpenge.commentary.form',
    workflow: 'demo.sygedagpenge.commentary.workflow',
    letter: 'demo.sygedagpenge.commentary.letter',
  },
}
