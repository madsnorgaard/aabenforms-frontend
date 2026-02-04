#!/bin/bash

# Performance Audit Script for ÅbenForms Frontend
# Runs Lighthouse audits on key pages and generates reports

set -e

echo "==================================="
echo "ÅbenForms Performance Audit"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="./performance-reports"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
REPORT_DIR="${OUTPUT_DIR}/${TIMESTAMP}"

echo "Base URL: ${BASE_URL}"
echo "Report directory: ${REPORT_DIR}"
echo ""

# Create output directory
mkdir -p "${REPORT_DIR}"

# Check if Lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}Lighthouse CLI not found. Installing...${NC}"
    npm install -g lighthouse
fi

# Pages to audit
declare -a PAGES=(
    "/:Home Page"
    "/forms/contact:Contact Form"
    "/workflows/tasks:Workflow Tasks"
    "/demo/appointment-picker:Appointment Demo"
)

echo "Running Lighthouse audits on ${#PAGES[@]} pages..."
echo ""

# Run Lighthouse on each page
for PAGE_INFO in "${PAGES[@]}"; do
    IFS=':' read -r PAGE_PATH PAGE_NAME <<< "$PAGE_INFO"

    echo -e "${GREEN}Auditing: ${PAGE_NAME} (${PAGE_PATH})${NC}"

    SAFE_NAME=$(echo "${PAGE_NAME}" | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')

    lighthouse "${BASE_URL}${PAGE_PATH}" \
        --output html \
        --output json \
        --output-path "${REPORT_DIR}/${SAFE_NAME}" \
        --chrome-flags="--headless --no-sandbox" \
        --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        || echo -e "${RED}Failed to audit ${PAGE_NAME}${NC}"

    echo ""
done

# Generate summary report
echo "==================================="
echo "Generating summary report..."
echo "==================================="

SUMMARY_FILE="${REPORT_DIR}/summary.txt"

{
    echo "ÅbenForms Frontend Performance Audit Summary"
    echo "=============================================="
    echo ""
    echo "Date: $(date)"
    echo "Base URL: ${BASE_URL}"
    echo ""
    echo "Results:"
    echo "--------"
    echo ""

    for PAGE_INFO in "${PAGES[@]}"; do
        IFS=':' read -r PAGE_PATH PAGE_NAME <<< "$PAGE_INFO"
        SAFE_NAME=$(echo "${PAGE_NAME}" | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')
        JSON_FILE="${REPORT_DIR}/${SAFE_NAME}.report.json"

        if [ -f "${JSON_FILE}" ]; then
            echo "${PAGE_NAME} (${PAGE_PATH})"

            # Extract scores using jq if available, otherwise skip
            if command -v jq &> /dev/null; then
                PERF=$(jq -r '.categories.performance.score * 100' "${JSON_FILE}")
                A11Y=$(jq -r '.categories.accessibility.score * 100' "${JSON_FILE}")
                BP=$(jq -r '.categories["best-practices"].score * 100' "${JSON_FILE}")
                SEO=$(jq -r '.categories.seo.score * 100' "${JSON_FILE}")

                echo "  Performance:    ${PERF}"
                echo "  Accessibility:  ${A11Y}"
                echo "  Best Practices: ${BP}"
                echo "  SEO:            ${SEO}"
            else
                echo "  (Install jq to see scores in summary)"
            fi

            echo "  Report: ${REPORT_DIR}/${SAFE_NAME}.report.html"
            echo ""
        fi
    done

    echo "=============================================="
    echo ""
    echo "View detailed reports in: ${REPORT_DIR}"
    echo ""
} | tee "${SUMMARY_FILE}"

# Open first report if on macOS or Linux with xdg-open
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}Opening reports in browser...${NC}"
    open "${REPORT_DIR}"/*.report.html
elif command -v xdg-open &> /dev/null; then
    echo -e "${GREEN}Opening reports in browser...${NC}"
    for HTML_FILE in "${REPORT_DIR}"/*.report.html; do
        xdg-open "${HTML_FILE}" &
    done
fi

echo ""
echo -e "${GREEN}Performance audit complete!${NC}"
echo "Reports saved to: ${REPORT_DIR}"
echo ""

# Performance budget check (if jq is available)
if command -v jq &> /dev/null; then
    echo "==================================="
    echo "Performance Budget Check"
    echo "==================================="
    echo ""

    BUDGET_PASSED=true

    for PAGE_INFO in "${PAGES[@]}"; do
        IFS=':' read -r PAGE_PATH PAGE_NAME <<< "$PAGE_INFO"
        SAFE_NAME=$(echo "${PAGE_NAME}" | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')
        JSON_FILE="${REPORT_DIR}/${SAFE_NAME}.report.json"

        if [ -f "${JSON_FILE}" ]; then
            PERF=$(jq -r '.categories.performance.score * 100' "${JSON_FILE}")

            # Check if performance score meets threshold (95)
            if (( $(echo "$PERF < 95" | bc -l) )); then
                echo -e "${RED}✗ ${PAGE_NAME}: Performance score ${PERF} is below 95${NC}"
                BUDGET_PASSED=false
            else
                echo -e "${GREEN}✓ ${PAGE_NAME}: Performance score ${PERF}${NC}"
            fi
        fi
    done

    echo ""
    if [ "$BUDGET_PASSED" = true ]; then
        echo -e "${GREEN}All pages meet performance budget! 🎉${NC}"
    else
        echo -e "${YELLOW}Some pages failed performance budget checks.${NC}"
        echo "Review reports for optimization opportunities."
    fi
fi

echo ""
echo "==================================="
echo "Audit Complete"
echo "==================================="
