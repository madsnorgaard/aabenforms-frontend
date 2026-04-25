/**
 * Per-template valid input fixtures for the 13 BPMN workflows.
 *
 * Each entry is the minimum data that the webform's create constraints
 * accept and that the corresponding ECA flow exercises end-to-end.
 * Used by the per-template specs in tests/e2e/specs/*.spec.ts.
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
  address_change: {
    webformId: 'address_change',
    requiresEmployeeRole: false,
    expectedSteps: 3,
    data: {
      cpr: '0101904521',
      old_address: 'Lohgade 1, 2100 København Ø',
      new_address: 'Vestergade 5, 8000 Aarhus C',
      moving_date: '2026-06-01',
      consent: true,
    },
  },
  association_booking: {
    webformId: 'association_booking',
    requiresEmployeeRole: false,
    expectedSteps: 4,
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
  building_permit: {
    webformId: 'building_permit',
    requiresEmployeeRole: false,
    expectedSteps: 3,
    data: {
      cpr: '0101904521',
      applicant_name: 'Freja Nielsen',
      property_address: 'Vestergade 5, 8000 Aarhus C',
      project_description: 'Garage extension, 24 m²',
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
  company_verification: {
    webformId: 'company_verification',
    requiresEmployeeRole: false,
    expectedSteps: 3,
    data: {
      cvr: '12345678',
      director_cpr: '1205705432',
      verification_purpose: 'New supplier onboarding',
    },
  },
  contact_form: {
    webformId: 'contact',
    requiresEmployeeRole: false,
    expectedSteps: 3,
    data: {
      name: 'Playwright Test',
      email: 'playwright@test.dk',
      message: 'Test message from spec.',
    },
  },
  foi_request: {
    webformId: 'foi_request',
    requiresEmployeeRole: false,
    expectedSteps: 2,
    data: {
      requester_name: 'Sofie Hansen',
      requester_email: 'sofie@test.dk',
      request_text: 'I would like access to all decisions on case 12345.',
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
  marriage_booking: {
    webformId: 'marriage_booking',
    requiresEmployeeRole: false,
    expectedSteps: 4,
    data: {
      partner1_cpr: '2506924015',
      partner1_name: 'Sofie Hansen',
      partner2_cpr: '0803755210',
      partner2_name: 'Lars Andersen',
      ceremony_date: '2026-09-01',
      witness1_name: 'Witness One',
      witness2_name: 'Witness Two',
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
  parking_permit: {
    webformId: 'parking_permit',
    requiresEmployeeRole: false,
    expectedSteps: 3,
    data: {
      cpr: '0101904521',
      address: 'Vestergade 5, 8000 Aarhus C',
      vehicle_registration: 'AB12345',
      duration_months: 3,
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
