# ÅbenForms Frontend - E2E Test Suite

Comprehensive end-to-end tests for Phase 5 workflow components using Playwright.

## Test Structure

```
tests/
├── e2e/
│   └── workflows.spec.ts          # Main workflow E2E tests
│
├── global-setup.ts                 # Global test setup
├── global-teardown.ts              # Global test cleanup
└── README.md                       # This file
```

## Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Headed Mode (see browser)
```bash
npx playwright test --headed
```

### Debug Mode
```bash
npx playwright test --debug
```

### UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Specific Test File
```bash
npx playwright test workflows.spec.ts
```

### Specific Test
```bash
npx playwright test --grep "should complete full parking permit workflow"
```

## Test Suites

### 1. Workflow Payment Component (5 tests)

Tests the `WorkflowPayment.vue` component:

- ✅ **Display payment component** - Verifies amount, currency display
- ✅ **Process payment successfully** - Tests Nets Easy payment flow
- ✅ **Handle payment errors** - Tests error states and messages
- ✅ **Support MobilePay** - Tests alternative payment method
- ✅ **Display payment receipt** - Tests receipt modal

**Tested Features:**
- Payment method selection (Nets Easy, MobilePay, Bank Transfer)
- Card input validation
- Payment processing
- Success/failure states
- Receipt generation
- Error handling

### 2. Appointment Picker Component (5 tests)

Tests the `AppointmentPicker.vue` component:

- ✅ **Display available slots** - Verifies calendar and slot rendering
- ✅ **Filter slots by date** - Tests date selection
- ✅ **Book selected slot** - Tests booking process
- ✅ **Prevent double booking** - Tests slot locking
- ✅ **Display slot duration** - Verifies time slot metadata

**Tested Features:**
- Calendar navigation
- Slot availability display
- Date filtering
- Time slot selection
- Booking confirmation
- Double-booking prevention
- Slot duration display

### 3. Workflow Execution Tracker (5 tests)

Tests the `WorkflowExecutionTracker.vue` component:

- ✅ **Display workflow progress** - Tests step visualization
- ✅ **Update progress real-time** - Tests live updates
- ✅ **Show step details on hover** - Tests tooltips
- ✅ **Display error states** - Tests error visualization
- ✅ **Show estimated time** - Tests time estimates

**Tested Features:**
- Step progress visualization
- Real-time updates
- Step completion states
- Error states
- Hover tooltips
- Time estimates

### 4. End-to-End Parking Permit (2 tests)

Full workflow integration tests:

- ✅ **Complete full workflow** - Tests 7-step process
- ✅ **Allow workflow restart** - Tests starting new application

**Workflow Steps Tested:**
1. Fill application form
2. Review and accept terms
3. Process payment
4. Generate PDF permit
5. Send SMS confirmation
6. Download permit
7. Display completion

### 5. End-to-End Marriage Booking (3 tests)

Full marriage booking workflow:

- ✅ **Complete full workflow** - Tests 8-step process
- ✅ **Send confirmations to both partners** - Tests dual notifications
- ✅ **Handle slot unavailability** - Tests race conditions

**Workflow Steps Tested:**
1. Fill partner 1 details
2. Fill partner 2 details
3. Select ceremony type
4. Fetch available slots
5. Select time slot
6. Confirm booking
7. Schedule reminders
8. Display completion

## Test Data

Test data attributes used in components:

```html
<!-- Payment Component -->
<div data-testid="workflow-payment">
  <input data-testid="card-number" />
  <button data-testid="submit-payment" />
  <div data-testid="payment-success" />
</div>

<!-- Appointment Picker -->
<div data-testid="appointment-picker">
  <div data-testid="calendar-view" />
  <div data-testid="time-slot-{id}" />
  <button data-testid="confirm-booking" />
</div>

<!-- Workflow Tracker -->
<div data-testid="workflow-tracker">
  <div data-testid="workflow-step-{n}" />
  <div data-testid="estimated-time" />
</div>
```

## Configuration

### playwright.config.ts

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' },
  ],
});
```

### Environment Variables

```bash
# Frontend URL
BASE_URL=http://localhost:3000

# Backend API URL
API_URL=http://localhost:8080

# Run in CI mode
CI=true
```

## Test Reports

### HTML Report
```bash
npx playwright test
npx playwright show-report
```

### JSON Report
```bash
npx playwright test --reporter=json
```

### JUnit Report (for CI)
```bash
npx playwright test --reporter=junit
```

## Screenshots and Videos

Test artifacts are saved to `test-results/`:

```
test-results/
├── screenshots/
│   └── failure-screenshot.png
├── videos/
│   └── test-video.webm
└── traces/
    └── trace.zip
```

View trace:
```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-feature');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'value');

    // Act
    await page.click('[data-testid="submit"]');

    // Assert
    await expect(page.locator('[data-testid="result"]'))
      .toContainText('expected');
  });
});
```

### Best Practices

1. **Use data-testid attributes**
   ```html
   <button data-testid="submit-button">Submit</button>
   ```

2. **Wait for elements**
   ```typescript
   await page.waitForSelector('[data-testid="result"]');
   ```

3. **Use explicit waits**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

4. **Test user flows, not implementation**
   ```typescript
   // Good - tests behavior
   await page.click('[data-testid="submit"]');
   await expect(page.locator('[data-testid="success"]')).toBeVisible();

   // Bad - tests implementation
   expect(component.state.submitted).toBe(true);
   ```

5. **Keep tests independent**
   ```typescript
   // Each test should set up its own state
   test.beforeEach(async ({ page }) => {
    await page.goto('/start');
   });
   ```

## Helper Functions

Create reusable helpers in test files:

```typescript
// Helper to complete payment
async function completePayment(page: Page) {
  await page.click('[data-testid="payment-method-nets-easy"]');
  await page.fill('[data-testid="card-number"]', '4111111111111111');
  await page.fill('[data-testid="card-expiry"]', '12/25');
  await page.fill('[data-testid="card-cvv"]', '123');
  await page.click('[data-testid="submit-payment"]');
  await page.waitForSelector('[data-testid="payment-success"]');
}

// Use in test
test('payment flow', async ({ page }) => {
  await completePayment(page);
  // Continue with next steps
});
```

## Debugging Tests

### Visual Debugging
```bash
# Open Playwright Inspector
npx playwright test --debug

# Pause on specific test
test('my test', async ({ page }) => {
  await page.pause(); // Pause here
  // ... rest of test
});
```

### Console Logs
```typescript
// Log page console messages
page.on('console', msg => console.log(msg.text()));

// Log network requests
page.on('request', req => console.log(req.url()));

// Take screenshot
await page.screenshot({ path: 'debug.png' });
```

### Trace Viewer
```bash
# Record trace
npx playwright test --trace on

# View trace
npx playwright show-trace test-results/trace.zip
```

## Performance Testing

Test load times and performance:

```typescript
test('page loads quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000); // < 3 seconds
});
```

## Accessibility Testing

Use Playwright's accessibility testing:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Mobile Testing

Test on mobile viewports:

```typescript
test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

test('mobile menu works', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="mobile-menu-toggle"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
});
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in config
- Use explicit waits: `waitForSelector`
- Check network requests

### Flaky Tests
- Add `page.waitForLoadState('networkidle')`
- Use retry logic for assertions
- Increase action timeout

### Elements Not Found
- Verify data-testid attributes exist
- Check element is visible: `await expect(el).toBeVisible()`
- Wait for element: `await page.waitForSelector()`

### CI Tests Failing
- Check browser installation
- Verify environment variables
- Review CI logs and artifacts

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Component Testing](https://playwright.dev/docs/test-components)

## Support

For test-related questions:
- Review existing tests for examples
- Check Playwright documentation
- Consult [COMPONENT_USAGE_GUIDE.md](../COMPONENT_USAGE_GUIDE.md)
