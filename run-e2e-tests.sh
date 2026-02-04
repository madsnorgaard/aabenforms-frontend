#!/bin/bash

###############################################################################
# ÅbenForms Frontend - E2E Test Runner Script
#
# Quick Playwright test execution script
#
# Usage:
#   ./run-e2e-tests.sh [all|payment|appointment|tracker|parking|marriage|ui]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}ÅbenForms Frontend E2E Test Suite${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Check if Playwright is installed
if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null 2>&1; then
    echo -e "${RED}Error: Playwright not installed${NC}"
    echo "Run: npm install && npx playwright install"
    exit 1
fi

# Parse command
COMMAND=${1:-all}

case $COMMAND in
  payment)
    echo -e "${YELLOW}Running Payment Component Tests...${NC}"
    echo ""
    npx playwright test --grep "Workflow Payment Component"
    ;;

  appointment)
    echo -e "${YELLOW}Running Appointment Picker Tests...${NC}"
    echo ""
    npx playwright test --grep "Appointment Picker Component"
    ;;

  tracker)
    echo -e "${YELLOW}Running Workflow Tracker Tests...${NC}"
    echo ""
    npx playwright test --grep "Workflow Execution Tracker"
    ;;

  parking)
    echo -e "${YELLOW}Running Parking Permit E2E Tests...${NC}"
    echo ""
    npx playwright test --grep "End-to-End Parking Permit"
    ;;

  marriage)
    echo -e "${YELLOW}Running Marriage Booking E2E Tests...${NC}"
    echo ""
    npx playwright test --grep "End-to-End Marriage Booking"
    ;;

  chromium)
    echo -e "${YELLOW}Running Tests in Chromium...${NC}"
    echo ""
    npx playwright test --project=chromium
    ;;

  firefox)
    echo -e "${YELLOW}Running Tests in Firefox...${NC}"
    echo ""
    npx playwright test --project=firefox
    ;;

  webkit)
    echo -e "${YELLOW}Running Tests in WebKit...${NC}"
    echo ""
    npx playwright test --project=webkit
    ;;

  mobile)
    echo -e "${YELLOW}Running Mobile Tests...${NC}"
    echo ""
    npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
    ;;

  ui)
    echo -e "${BLUE}Starting Playwright UI Mode...${NC}"
    echo ""
    npx playwright test --ui
    ;;

  debug)
    echo -e "${BLUE}Starting Debug Mode...${NC}"
    echo ""
    npx playwright test --debug
    ;;

  headed)
    echo -e "${BLUE}Running Tests in Headed Mode...${NC}"
    echo ""
    npx playwright test --headed
    ;;

  report)
    echo -e "${BLUE}Opening Test Report...${NC}"
    echo ""
    npx playwright show-report
    ;;

  all)
    echo -e "${YELLOW}Running All E2E Tests...${NC}"
    echo ""
    npx playwright test
    ;;

  install)
    echo -e "${YELLOW}Installing Playwright Browsers...${NC}"
    echo ""
    npx playwright install --with-deps
    echo ""
    echo -e "${GREEN}Playwright browsers installed!${NC}"
    ;;

  *)
    echo -e "${RED}Unknown command: $COMMAND${NC}"
    echo ""
    echo "Usage: ./run-e2e-tests.sh [command]"
    echo ""
    echo "Test Suites:"
    echo "  all           Run all E2E tests (default)"
    echo "  payment       Payment component tests"
    echo "  appointment   Appointment picker tests"
    echo "  tracker       Workflow tracker tests"
    echo "  parking       Parking permit E2E flow"
    echo "  marriage      Marriage booking E2E flow"
    echo ""
    echo "Browsers:"
    echo "  chromium      Run in Chromium only"
    echo "  firefox       Run in Firefox only"
    echo "  webkit        Run in WebKit only"
    echo "  mobile        Run mobile tests only"
    echo ""
    echo "Debug/UI:"
    echo "  ui            Open Playwright UI mode"
    echo "  debug         Run in debug mode"
    echo "  headed        Run with visible browser"
    echo "  report        Show test report"
    echo ""
    echo "Setup:"
    echo "  install       Install Playwright browsers"
    echo ""
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}E2E Tests completed!${NC}"
echo ""
echo -e "${BLUE}View detailed report:${NC} npx playwright show-report"
echo ""
