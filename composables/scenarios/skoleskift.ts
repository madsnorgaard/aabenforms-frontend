import type { DemoScenarioConfig, PrefillOption } from '~/types/demo'

/**
 * Skoleskift med to forældre (folkeskoleloven §36): the advanced scenario.
 *
 * Fetched: the applicant CPR from the MitID login (live-capable rail) and,
 * from CPR Familie+ (SF6006, demo rail), the children in Freja's custody.
 * Each child option carries the custody type and the other custody holder,
 * so custody is derived from the register instead of asked. Typed: current
 * school, wished school and the reason.
 *
 * The ECA flow (skoleskift_flow) verifies custody, opens and journals the
 * case, resolves the school and - for joint custody - sends Lars a co-sign
 * invitation in Digital Post. That letter lands in LARS' inbox, not Freja's,
 * so the page (pages/demo/skoleskift.vue) adds a second persona view where
 * Lars logs in, reads the invitation and co-signs on the backend's
 * /parent-approval route.
 */

/**
 * Demo fallback: the CPR Familie+ options are masked (DDMMYY-XXXX) and the
 * custody check in the flow (aabenforms_custody_verify) and the co-sign
 * recipient check do not resolve masked CPRs. Until the backend resolves a
 * masked option against the session's own register lookup, the demo sends
 * the fictitious test CPRs of DemoFamilyRepository. Never real persons.
 */
const DEMO_CPR: Record<string, string> = {
  '010918-XXXX': '0109182345', // Emil Nielsen Andersen
  '200510-XXXX': '2005102345', // Oliver Nielsen Andersen
  '080375-XXXX': '0803755210', // Lars Andersen
}

function demoCpr(masked: unknown): string {
  const value = String(masked ?? '')
  return DEMO_CPR[value] ?? value
}

/**
 * The register says who holds custody; the applicant only confirms that
 * the other holder agrees. Registry 'joint' therefore maps to the webform's
 * 'joint_agreed', which is the branch that sends the co-sign invitation.
 */
function custodyStatus(child: PrefillOption | null): string {
  const custody = String(child?.custody ?? '')
  if (custody === 'sole') return 'sole'
  if (custody === 'joint') return 'joint_agreed'
  return ''
}

function otherGuardian(child: PrefillOption | null): { name?: string; cpr?: string } {
  const g = child?.other_guardian
  return g && typeof g === 'object' ? (g as { name?: string; cpr?: string }) : {}
}

const schoolOptions = ['751101', '751102', '751103', '751104', '751105'].map((value) => ({
  value,
  labelKey: `demo.skoleskift.schools.${value}`,
}))

export const skoleskiftScenario: DemoScenarioConfig = {
  id: 'skoleskift',
  webformId: 'school_transfer',
  path: '/demo/skoleskift',
  available: true,
  difficulty: 'advanced',
  persona: { username: 'freja.nielsen', password: 'test1234', name: 'Freja Nielsen' },

  titleKey: 'demo.skoleskift.title',
  storyKey: 'demo.skoleskift.story',
  introKey: 'demo.skoleskift.intro',
  fetchedKeys: [
    'demo.hub.scenarios.skoleskift.fetched.child',
    'demo.hub.scenarios.skoleskift.fetched.custody',
    'demo.hub.scenarios.skoleskift.fetched.parent2',
    'demo.hub.scenarios.skoleskift.fetched.school',
  ],
  typedKeys: [
    'demo.hub.scenarios.skoleskift.typed.targetSchool',
    'demo.hub.scenarios.skoleskift.typed.reason',
  ],

  prefillMap: [
    { key: 'applicant_cpr', labelKey: 'demo.skoleskift.fields.applicantCpr' },
    {
      // One radio row: the child option carries name, CPR, custody type and
      // the other custody holder. submitBody derives custody_status and
      // parent2_cpr from the choice, so neither is asked. The prefill
      // custody_status field carries the same data per child as `options`
      // with a null value; the wizard has no "derived from another choice"
      // row yet, so it is not a separate table row (would force a second,
      // redundant radio pick).
      key: 'child_cpr',
      labelKey: 'demo.skoleskift.fields.child',
      option: {
        valueProp: 'cpr',
        labelProp: 'name',
        // The current school is fetched (STIL pupil data, demo rail) and
        // carried on each child option, so it is shown here, never asked.
        hintFormat: (o, t, d) => {
          const school = (o.current_school ?? null) as { name?: string } | null
          return [
            String(o.cpr ?? ''),
            o.birth_date ? d(String(o.birth_date)) : '',
            school?.name ? t('demo.skoleskift.option.currentSchool', { school: school.name }) : '',
          ].filter(Boolean).join(' · ')
        },
      },
    },
    // Provenance row for the school lookup (register, legal basis, audit id).
    {
      key: 'current_school',
      labelKey: 'demo.skoleskift.fields.currentSchool',
      derive: (chosen) => String(((chosen('child_cpr')?.current_school ?? null) as { name?: string } | null)?.name ?? ''),
    },
  ],

  form: [
    {
      key: 'target_school',
      type: 'select',
      labelKey: 'demo.skoleskift.fields.targetSchool',
      required: true,
      errorKey: 'demo.skoleskift.validation.targetSchool',
      options: schoolOptions,
      width: 'l',
    },
    {
      key: 'reason',
      type: 'textarea',
      labelKey: 'demo.skoleskift.fields.reason',
      hintKey: 'demo.skoleskift.fields.reasonHint',
      required: true,
      errorKey: 'demo.skoleskift.validation.reason',
      rows: 4,
      width: 'xl',
    },
  ],

  // applicant_cpr travels masked: the backend swaps in the CPR from the real
  // MitID session (fillCprFromMitIdSession). child_cpr and parent2_cpr use
  // the demo fallback above (the flow cannot verify masked CPRs).
  submitBody: ({ values, choices, sessionId }) => {
    const child = choices.child_cpr ?? null
    const status = custodyStatus(child)
    const parent2 = otherGuardian(child)
    return {
      data: {
        workflow_id: sessionId,
        applicant_cpr: values.applicant_cpr ?? '',
        child_name: String(child?.name ?? ''),
        child_cpr: demoCpr(child?.cpr),
        current_school: String(((child?.current_school ?? null) as { institution_number?: string } | null)?.institution_number ?? ''),
        target_school: values.target_school ?? '',
        reason: (values.reason ?? '').trim(),
        custody_status: status,
        parent2_cpr: status === 'joint_agreed' ? demoCpr(parent2.cpr) : '',
        parent2_email: '',
      },
    }
  },

  outcome: {
    // The invitation goes to Lars, so Freja's inbox is not polled; the page
    // fills the wizard's afterOutcome slot with the hand-over to Lars.
    letterRecipient: 'other',
    recipientAlert: {
      headingKey: 'demo.skoleskift.recipient.heading',
      bodyKey: 'demo.skoleskift.recipient.body',
    },
    headingKey: 'demo.skoleskift.complete.heading',
    bodyKey: 'demo.skoleskift.complete.body',
    type: 'info',
  },

  formBodyKey: 'demo.skoleskift.formBody',
  commentaryKeys: {
    login: 'demo.skoleskift.commentary.login',
    prefill: 'demo.skoleskift.commentary.prefill',
    form: 'demo.skoleskift.commentary.form',
    workflow: 'demo.skoleskift.commentary.workflow',
    letter: 'demo.skoleskift.commentary.letter',
  },
}
