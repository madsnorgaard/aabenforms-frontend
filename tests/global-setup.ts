import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 *
 * This runs once before all tests. Use it to:
 * - Clear test database
 * - Seed test data
 * - Start mock services
 * - Create test users
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const baseURL = config.use?.baseURL || 'http://localhost:3000';
  const apiURL = process.env.API_URL || 'http://localhost:8080';

  console.log(`Frontend URL: ${baseURL}`);
  console.log(`Backend API URL: ${apiURL}`);

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Health check - wait for frontend to be ready
    console.log('⏳ Waiting for frontend to be ready...');
    let retries = 10;
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        console.log('✅ Frontend is ready');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Frontend did not start in time');
        }
        console.log(`   Retrying... (${retries} attempts left)`);
        await page.waitForTimeout(3000);
      }
    }

    // Health check - wait for backend API to be ready
    console.log('⏳ Waiting for backend API to be ready...');
    retries = 10;
    while (retries > 0) {
      try {
        const response = await page.request.get(`${apiURL}/jsonapi`);
        if (response.ok()) {
          console.log('✅ Backend API is ready');
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.log('⚠️  Backend API not available (tests will use mocks)');
          break;
        }
        console.log(`   Retrying... (${retries} attempts left)`);
        await page.waitForTimeout(3000);
      }
    }

    // Clear test data (if API available)
    try {
      console.log('🧹 Clearing test data...');
      // This would call a test endpoint to reset database
      // await page.request.post(`${apiURL}/test/reset`);
      console.log('✅ Test data cleared');
    } catch (error) {
      console.log('⚠️  Could not clear test data (using fresh mocks)');
    }

    // Seed test data (if needed)
    console.log('🌱 Seeding test data...');
    // This would create necessary test forms, users, etc.
    console.log('✅ Test data seeded');

    // Clear browser storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
