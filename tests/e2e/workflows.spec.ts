import { test, expect, type Page } from '@playwright/test';

/**
 * ÅbenForms Phase 5 - Workflows E2E Tests
 *
 * Tests for:
 * - WorkflowPayment component
 * - AppointmentPicker component
 * - WorkflowExecutionTracker component
 * - End-to-end Parking Permit workflow
 * - End-to-end Marriage Booking workflow
 */

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8080';

test.describe('Workflow Payment Component', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/parking-permit`);
  });

  test('should display payment component with correct amount', async ({ page }) => {
    // Navigate to payment step
    await page.fill('[data-testid="license-plate"]', 'AB12345');
    await page.fill('[data-testid="address"]', 'Test Street 1');
    await page.click('[data-testid="next-step"]');

    // Wait for payment component to load
    await page.waitForSelector('[data-testid="workflow-payment"]');

    // Verify payment amount is displayed
    const amount = await page.locator('[data-testid="payment-amount"]').textContent();
    expect(amount).toContain('500');
    expect(amount).toContain('DKK');
  });

  test('should process payment successfully', async ({ page }) => {
    // Navigate to payment
    await page.fill('[data-testid="license-plate"]', 'CD56789');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-payment"]');

    // Select payment method
    await page.click('[data-testid="payment-method-nets-easy"]');

    // Fill payment details
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');

    // Submit payment
    await page.click('[data-testid="submit-payment"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="payment-success"]', { timeout: 10000 });

    const successMessage = await page.locator('[data-testid="payment-success"]').textContent();
    expect(successMessage).toContain('Betaling gennemført');

    // Verify payment ID is displayed
    const paymentId = await page.locator('[data-testid="payment-id"]').textContent();
    expect(paymentId).toMatch(/PAY-\w+-\d+/);
  });

  test('should handle payment errors gracefully', async ({ page }) => {
    await page.fill('[data-testid="license-plate"]', 'ERROR123');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-payment"]');

    // Use invalid card to trigger error
    await page.fill('[data-testid="card-number"]', '0000000000000000');
    await page.click('[data-testid="submit-payment"]');

    // Verify error message
    await page.waitForSelector('[data-testid="payment-error"]');
    const errorMessage = await page.locator('[data-testid="payment-error"]').textContent();
    expect(errorMessage).toBeTruthy();
  });

  test('should support MobilePay payment method', async ({ page }) => {
    await page.fill('[data-testid="license-plate"]', 'MP99999');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-payment"]');

    // Select MobilePay
    await page.click('[data-testid="payment-method-mobilepay"]');

    // Verify MobilePay UI appears
    await page.waitForSelector('[data-testid="mobilepay-phone"]');

    await page.fill('[data-testid="mobilepay-phone"]', '+4512345678');
    await page.click('[data-testid="submit-mobilepay"]');

    // Verify confirmation
    await page.waitForSelector('[data-testid="mobilepay-pending"]');
    const status = await page.locator('[data-testid="mobilepay-pending"]').textContent();
    expect(status).toContain('Afventer godkendelse');
  });

  test('should display payment receipt', async ({ page }) => {
    await page.fill('[data-testid="license-plate"]', 'RECEIPT1');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-payment"]');
    await page.click('[data-testid="payment-method-nets-easy"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="submit-payment"]');

    await page.waitForSelector('[data-testid="payment-success"]');

    // Click view receipt
    await page.click('[data-testid="view-receipt"]');

    // Verify receipt modal
    await page.waitForSelector('[data-testid="payment-receipt-modal"]');

    const receipt = page.locator('[data-testid="payment-receipt-modal"]');
    await expect(receipt).toContainText('Kvittering');
    await expect(receipt).toContainText('500,00 DKK');
    await expect(receipt).toContainText('RECEIPT1');
  });
});

test.describe('Appointment Picker Component', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/marriage-booking`);
  });

  test('should display available time slots', async ({ page }) => {
    // Fill initial form
    await page.fill('[data-testid="partner1-name"]', 'John Doe');
    await page.fill('[data-testid="partner1-email"]', 'john@example.com');
    await page.fill('[data-testid="partner2-name"]', 'Jane Smith');
    await page.fill('[data-testid="partner2-email"]', 'jane@example.com');
    await page.click('[data-testid="next-step"]');

    // Wait for appointment picker
    await page.waitForSelector('[data-testid="appointment-picker"]');

    // Verify calendar is displayed
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();

    // Verify at least one slot is available
    const slots = await page.locator('[data-testid^="time-slot-"]').count();
    expect(slots).toBeGreaterThan(0);
  });

  test('should filter slots by date', async ({ page }) => {
    await fillMarriageForm(page);
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="appointment-picker"]');

    // Select a specific date
    await page.click('[data-testid="calendar-date-2026-06-15"]');

    // Verify slots update
    await page.waitForSelector('[data-testid="time-slot-2026-06-15"]');

    const firstSlot = await page.locator('[data-testid^="time-slot-2026-06-15"]').first();
    await expect(firstSlot).toBeVisible();
    await expect(firstSlot).toContainText('10:00');
  });

  test('should book selected time slot', async ({ page }) => {
    await fillMarriageForm(page);
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="appointment-picker"]');

    // Select first available slot
    const firstSlot = await page.locator('[data-testid^="time-slot-"]').first();
    const slotId = await firstSlot.getAttribute('data-slot-id');

    await firstSlot.click();

    // Verify slot is selected
    await expect(firstSlot).toHaveClass(/selected/);

    // Confirm booking
    await page.click('[data-testid="confirm-booking"]');

    // Wait for success
    await page.waitForSelector('[data-testid="booking-success"]');

    const bookingId = await page.locator('[data-testid="booking-id"]').textContent();
    expect(bookingId).toMatch(/BOOK-\w+-\d+/);
  });

  test('should prevent double booking', async ({ page }) => {
    await fillMarriageForm(page);
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="appointment-picker"]');

    // Get first slot ID
    const firstSlot = await page.locator('[data-testid^="time-slot-"]').first();
    const slotId = await firstSlot.getAttribute('data-slot-id');

    // Book the slot
    await firstSlot.click();
    await page.click('[data-testid="confirm-booking"]');
    await page.waitForSelector('[data-testid="booking-success"]');

    // Try to book same slot again (in new session)
    await page.goto(`${BASE_URL}/workflows/demo/marriage-booking`);
    await fillMarriageForm(page, 'Different', 'Couple');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="appointment-picker"]');

    // Verify previously booked slot is disabled
    const bookedSlot = await page.locator(`[data-slot-id="${slotId}"]`);
    await expect(bookedSlot).toHaveClass(/disabled/);
    await expect(bookedSlot).toContainText('Optaget');
  });

  test('should display slot duration correctly', async ({ page }) => {
    await fillMarriageForm(page);
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="appointment-picker"]');

    const slot = await page.locator('[data-testid^="time-slot-"]').first();
    const duration = await slot.locator('[data-testid="slot-duration"]').textContent();

    expect(duration).toContain('60 min');
  });
});

test.describe('Workflow Execution Tracker Component', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/parking-permit`);
  });

  test('should display workflow progress', async ({ page }) => {
    // Start workflow
    await page.fill('[data-testid="license-plate"]', 'TRACK01');
    await page.click('[data-testid="next-step"]');

    // Wait for tracker
    await page.waitForSelector('[data-testid="workflow-tracker"]');

    // Verify tracker shows steps
    const steps = await page.locator('[data-testid^="workflow-step-"]').count();
    expect(steps).toBeGreaterThanOrEqual(3);

    // Verify current step is highlighted
    const currentStep = page.locator('[data-testid="workflow-step-current"]');
    await expect(currentStep).toHaveClass(/active/);
  });

  test('should update progress in real-time', async ({ page }) => {
    await page.fill('[data-testid="license-plate"]', 'TRACK02');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-tracker"]');

    // Verify step 1 is complete
    const step1 = page.locator('[data-testid="workflow-step-1"]');
    await expect(step1).toHaveClass(/completed/);

    // Complete payment step
    await completePayment(page);

    // Verify step 2 is complete
    const step2 = page.locator('[data-testid="workflow-step-2"]');
    await expect(step2).toHaveClass(/completed/);
  });

  test('should show step details on hover', async ({ page }) => {
    await page.fill('[data-testid="license-plate"]', 'TRACK03');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-tracker"]');

    // Hover over step
    const step = page.locator('[data-testid="workflow-step-1"]');
    await step.hover();

    // Verify tooltip appears
    await page.waitForSelector('[data-testid="step-tooltip"]');
    const tooltip = page.locator('[data-testid="step-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Formular indsendt');
  });

  test('should display error state for failed steps', async ({ page }) => {
    // Trigger payment error
    await page.fill('[data-testid="license-plate"]', 'ERROR999');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-tracker"]');

    // Attempt payment with error
    await page.fill('[data-testid="card-number"]', '0000000000000000');
    await page.click('[data-testid="submit-payment"]');

    // Verify error state in tracker
    await page.waitForSelector('[data-testid="workflow-step-error"]');
    const errorStep = page.locator('[data-testid="workflow-step-error"]');
    await expect(errorStep).toHaveClass(/error/);
    await expect(errorStep).toContainText('Fejl');
  });

  test('should show estimated time remaining', async ({ page }) => {
    await page.fill('[data-testid="license-plate"]', 'TRACK04');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="workflow-tracker"]');

    const timeEstimate = page.locator('[data-testid="estimated-time"]');
    await expect(timeEstimate).toBeVisible();

    const timeText = await timeEstimate.textContent();
    expect(timeText).toMatch(/\d+\s+(min|sek)/);
  });
});

test.describe('End-to-End Parking Permit Workflow', () => {

  test('should complete full parking permit workflow', async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/parking-permit`);

    // Step 1: Fill application form
    await page.fill('[data-testid="applicant-name"]', 'Test Applicant');
    await page.fill('[data-testid="license-plate"]', 'E2E12345');
    await page.fill('[data-testid="address"]', 'E2E Street 1');
    await page.fill('[data-testid="postal-code"]', '8000');
    await page.fill('[data-testid="city"]', 'Aarhus C');
    await page.fill('[data-testid="phone"]', '+4512345678');
    await page.fill('[data-testid="email"]', 'e2e@example.com');

    await page.click('[data-testid="next-step"]');

    // Step 2: Review and accept terms
    await page.waitForSelector('[data-testid="review-section"]');
    await page.click('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-step"]');

    // Step 3: Complete payment
    await page.waitForSelector('[data-testid="workflow-payment"]');
    await page.click('[data-testid="payment-method-nets-easy"]');
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvv"]', '123');
    await page.click('[data-testid="submit-payment"]');

    // Step 4: Wait for PDF generation
    await page.waitForSelector('[data-testid="pdf-generated"]', { timeout: 15000 });

    // Step 5: Verify SMS confirmation
    await page.waitForSelector('[data-testid="sms-sent"]');

    // Step 6: Download permit PDF
    await page.click('[data-testid="download-permit"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');

    // Step 7: Verify completion
    await page.waitForSelector('[data-testid="workflow-complete"]');
    const completionMessage = await page.locator('[data-testid="completion-message"]').textContent();
    expect(completionMessage).toContain('Din parkeringstilladelse er klar');

    // Verify submission ID
    const submissionId = await page.locator('[data-testid="submission-id"]').textContent();
    expect(submissionId).toMatch(/\d+/);
  });

  test('should allow workflow restart after completion', async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/parking-permit`);

    // Complete workflow
    await completeFullParkingPermit(page, 'RESTART1');

    // Click restart
    await page.click('[data-testid="start-new-application"]');

    // Verify back at start
    await page.waitForSelector('[data-testid="applicant-name"]');
    const nameField = await page.locator('[data-testid="applicant-name"]').inputValue();
    expect(nameField).toBe('');
  });
});

test.describe('End-to-End Marriage Booking Workflow', () => {

  test('should complete full marriage booking workflow', async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/marriage-booking`);

    // Step 1: Fill partner 1 details
    await page.fill('[data-testid="partner1-name"]', 'John Doe');
    await page.fill('[data-testid="partner1-email"]', 'john.e2e@example.com');
    await page.fill('[data-testid="partner1-phone"]', '+4511111111');
    await page.fill('[data-testid="partner1-address"]', 'Street 1');

    // Step 2: Fill partner 2 details
    await page.fill('[data-testid="partner2-name"]', 'Jane Smith');
    await page.fill('[data-testid="partner2-email"]', 'jane.e2e@example.com');
    await page.fill('[data-testid="partner2-phone"]', '+4522222222');
    await page.fill('[data-testid="partner2-address"]', 'Street 2');

    await page.click('[data-testid="next-step"]');

    // Step 3: Select ceremony type
    await page.waitForSelector('[data-testid="ceremony-type"]');
    await page.click('[data-testid="ceremony-type-civil"]');
    await page.click('[data-testid="next-step"]');

    // Step 4: Fetch and select time slot
    await page.waitForSelector('[data-testid="appointment-picker"]');
    await page.waitForSelector('[data-testid^="time-slot-"]');

    const firstSlot = await page.locator('[data-testid^="time-slot-"]').first();
    await firstSlot.click();
    await page.click('[data-testid="confirm-booking"]');

    // Step 5: Verify booking confirmation
    await page.waitForSelector('[data-testid="booking-success"]', { timeout: 10000 });

    const bookingId = await page.locator('[data-testid="booking-id"]').textContent();
    expect(bookingId).toMatch(/BOOK-\w+-\d+/);

    // Step 6: Verify reminder scheduled
    await page.waitForSelector('[data-testid="reminder-scheduled"]');
    const reminderText = await page.locator('[data-testid="reminder-scheduled"]').textContent();
    expect(reminderText).toContain('7 dage');

    // Step 7: Verify calendar invite
    await page.waitForSelector('[data-testid="calendar-invite"]');
    await page.click('[data-testid="add-to-calendar"]');

    // Step 8: Verify completion
    await page.waitForSelector('[data-testid="workflow-complete"]');
    const completionText = await page.locator('[data-testid="completion-message"]').textContent();
    expect(completionText).toContain('Jeres vielsesreservation er bekræftet');
  });

  test('should send confirmations to both partners', async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows/demo/marriage-booking`);

    await completeFullMarriageBooking(page, 'Both', 'Partners');

    // Verify both confirmations sent
    await page.waitForSelector('[data-testid="confirmations-sent"]');

    const confirmations = await page.locator('[data-testid="confirmation-recipient"]').count();
    expect(confirmations).toBe(2);
  });

  test('should handle slot unavailability during booking', async ({ page }) => {
    // This tests race condition handling
    await page.goto(`${BASE_URL}/workflows/demo/marriage-booking`);

    await fillMarriageForm(page);
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="ceremony-type-civil"]');
    await page.click('[data-testid="next-step"]');

    await page.waitForSelector('[data-testid="appointment-picker"]');

    const slot = await page.locator('[data-testid^="time-slot-"]').first();
    await slot.click();

    // Simulate slot being taken by someone else
    // (In real test, this would involve API mocking)

    await page.click('[data-testid="confirm-booking"]');

    // Should show error or refresh slots
    await page.waitForSelector('[data-testid="booking-error"], [data-testid="slots-refreshed"]');
  });
});

// Helper functions
async function fillMarriageForm(page: Page, name1 = 'John Doe', name2 = 'Jane Smith') {
  await page.fill('[data-testid="partner1-name"]', name1);
  await page.fill('[data-testid="partner1-email"]', `${name1.toLowerCase().replace(' ', '.')}@example.com`);
  await page.fill('[data-testid="partner2-name"]', name2);
  await page.fill('[data-testid="partner2-email"]', `${name2.toLowerCase().replace(' ', '.')}@example.com`);
}

async function completePayment(page: Page) {
  await page.click('[data-testid="payment-method-nets-easy"]');
  await page.fill('[data-testid="card-number"]', '4111111111111111');
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvv"]', '123');
  await page.click('[data-testid="submit-payment"]');
  await page.waitForSelector('[data-testid="payment-success"]');
}

async function completeFullParkingPermit(page: Page, plate: string) {
  await page.fill('[data-testid="applicant-name"]', 'Test User');
  await page.fill('[data-testid="license-plate"]', plate);
  await page.fill('[data-testid="address"]', 'Test Street 1');
  await page.fill('[data-testid="postal-code"]', '8000');
  await page.fill('[data-testid="city"]', 'Aarhus');
  await page.fill('[data-testid="phone"]', '+4512345678');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.click('[data-testid="next-step"]');
  await page.click('[data-testid="accept-terms"]');
  await page.click('[data-testid="next-step"]');
  await completePayment(page);
  await page.waitForSelector('[data-testid="workflow-complete"]');
}

async function completeFullMarriageBooking(page: Page, name1: string, name2: string) {
  await fillMarriageForm(page, name1, name2);
  await page.click('[data-testid="next-step"]');
  await page.click('[data-testid="ceremony-type-civil"]');
  await page.click('[data-testid="next-step"]');
  await page.waitForSelector('[data-testid="appointment-picker"]');
  const slot = await page.locator('[data-testid^="time-slot-"]').first();
  await slot.click();
  await page.click('[data-testid="confirm-booking"]');
  await page.waitForSelector('[data-testid="workflow-complete"]');
}
