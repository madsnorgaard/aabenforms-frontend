/**
 * Per-template valid input fixtures for the deployed BPMN workflows.
 *
 * Each entry is the minimum data that the webform's create constraints
 * accept and that the corresponding ECA flow exercises end-to-end.
 * Used by the per-template specs in tests/e2e/specs/*.spec.ts.
 *
 * Only templates whose webforms are actually shipped in `config/sync`
 * appear here. The original Phase D fixture map listed all 13 BPMN
 * template ids, but six of them (address_change, building_permit,
 * company_verification, foi_request, marriage_booking, parking_permit)
 * have BPMN definitions only - the matching webforms have not been
 * authored yet. Re-add their entries here once the webforms ship via
 * `config/sync/webform.webform.<id>.yml`.
 */

export interface TemplateFixture {
  /** Webform machine name (matches the BPMN template id). */
  webformId: string
  /** Whether the webform requires the aabenforms_employee role. */
  requiresEmployeeRole: boolean
  /** Expected number of completed workflow.steps in the API response. */
  expectedSteps: number
  /** Valid form data POSTed to /api/webform/{id}/submit. */
  data: Record<string, string | number | boolean>
}

export const templateFixtures: Record<string, TemplateFixture> = {
  association_booking: {
    webformId: 'association_booking',
    requiresEmployeeRole: false,
    // Real ECA flow emits MitID validate + audit log = 2 steps. Fixture
    // was previously aspirational at 4 (expected booking + payment +
    // notify + audit), but those steps are not wired in the current
    // eca.eca.association_booking_flow.yml.
    expectedSteps: 2,
    data: {
      association_name: 'Test Forening',
      cvr: '12345678',
      contact_name: 'Karen Christensen',
      contact_email: 'association@test.dk',
      contact_phone: '87654321',
      request_type: 'booking',
      facility_or_purpose: 'Community hall for annual meeting',
      requested_date: '2026-06-15',
      amount: 500,
      reviewer_email: 'reviewer@test.dk',
    },
  },
  citizen_service_application: {
    webformId: 'citizen_service_application',
    requiresEmployeeRole: false,
    expectedSteps: 4,
    data: {
      applicant_cpr: '0101904521',
      applicant_email: 'freja@test.dk',
      service_type: 'pension_supplement',
      reason: 'Reduced income after partner illness',
    },
  },
  contact_form: {
    webformId: 'contact',
    requiresEmployeeRole: false,
    // Plain contact webform has no ECA flow attached, so the API
    // response carries no workflow.steps. Spec uses >= so 0 is fine.
    expectedSteps: 0,
    data: {
      name: 'Playwright Test',
      email: 'playwright@test.dk',
      message: 'Test message from spec.',
    },
  },
  hr_onboarding: {
    webformId: 'hr_onboarding',
    requiresEmployeeRole: true,
    expectedSteps: 3,
    data: {
      hr_submitter_email: 'hr@test.dk',
      new_hire_name: 'New Employee',
      new_hire_email: 'newemp@test.dk',
      hire_date: '2026-07-01',
      manager_email: 'manager@test.dk',
      it_distribution_email: 'it@test.dk',
    },
  },
  med_election_nomination: {
    webformId: 'med_election_nomination',
    requiresEmployeeRole: false,
    expectedSteps: 3,
    data: {
      election_id: 'MED-2026-Q2',
      nomination_type: 'self',
      nominator_name: 'Sofie Hansen',
      nominator_cpr: '2506924015',
      nominee_name: 'Sofie Hansen',
      nominee_department: 'IT',
      statement: 'Candidate statement for MED committee',
      consent: true,
    },
  },
  mileage_expense: {
    webformId: 'mileage_expense',
    requiresEmployeeRole: true,
    expectedSteps: 3,
    data: {
      employee_id: 'EMP-001',
      employee_name: 'Test Employee',
      manager_email: 'manager@test.dk',
      claim_date: '2026-04-15',
      kilometres: 42,
      amount: 150,
      purpose: 'Client visit',
    },
  },
  phone_declaration: {
    webformId: 'phone_declaration',
    requiresEmployeeRole: true,
    expectedSteps: 3,
    data: {
      employee_id: 'EMP-001',
      employee_name: 'Test Employee',
      manager_email: 'manager@test.dk',
      tax_year: 2026,
      private_use_estimate: 0.20,
      declaration_consent: true,
    },
  },
}
