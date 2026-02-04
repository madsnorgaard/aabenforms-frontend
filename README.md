# AbenForms Frontend

**Modern Nuxt 3 interface for Danish municipal workflow automation**

[![Nuxt](https://img.shields.io/badge/Nuxt-3.15.0-00DC82)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5.27-4FC08D)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6)](https://www.typescriptlang.org)
[![Pinia](https://img.shields.io/badge/Pinia-2.3.0-yellow)](https://pinia.vuejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.51.1-45ba4b)](https://playwright.dev)
[![License](https://img.shields.io/badge/License-GPL--2.0-green)](LICENSE)

## Overview

AbenForms Frontend is a production-ready, responsive web application built with Nuxt 3 that provides:

- **Multi-tenant interfaces** for Danish municipalities with custom branding per tenant
- **Dynamic webform rendering** from Drupal backend with real-time validation
- **Workflow task dashboards** with filtering, pagination, and status tracking
- **Interactive components** including appointment pickers, payment workflows, and execution trackers
- **Comprehensive accessibility** meeting WCAG 2.1 AA standards
- **Mobile-first design** with touch-optimized interfaces (83/100 mobile score)
- **Full internationalization** supporting Danish and English
- **Production-grade performance** with optimized bundle sizes and loading states

## Implementation Status

**Phase 5 Complete** (February 2026)

### Core Features Delivered

**Component Library:**
- WorkflowPayment - Integrated payment processing with MobilePay/card support
- AppointmentPicker - Interactive date/time selection with availability checking
- WorkflowExecutionTracker - Real-time workflow progress visualization with step-by-step tracking
- WebformRenderer - Dynamic form rendering with validation and submission handling
- WorkflowDashboard - Task management with filtering, sorting, and pagination

**UI/UX Enhancements:**
- Skeleton loaders for improved perceived performance
- Loading spinners with contextual feedback
- Modal dialogs with keyboard navigation and focus trapping
- Toast notifications for user feedback
- Tooltips with accessibility support
- Error boundaries with graceful degradation
- Comprehensive empty states and error messages

**Accessibility Achievements:**
- WCAG 2.1 AA compliance verified across all components
- Full keyboard navigation support with visible focus indicators
- Screen reader optimized with proper ARIA labels and live regions
- Sufficient color contrast ratios (minimum 4.5:1 for text)
- Semantic HTML structure throughout
- Skip links and landmark regions for navigation

**Mobile Responsiveness:**
- Mobile score: 83/100 (Lighthouse)
- Touch-friendly tap targets (minimum 44x44px)
- Responsive layouts with breakpoint optimization
- Mobile-optimized form inputs and controls
- Swipe gestures for mobile navigation

**Performance Optimization:**
- Client bundle: 279.8 KB (99.86 KB gzipped)
- Build time: ~6.7s total
- Lazy loading for route-based code splitting
- Image optimization with WebP support
- CSS extraction and minification

### Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Framework** |
| Nuxt | 3.15.0 | Vue.js framework with SSR/SSG support |
| Vue | 3.5.27 | Progressive JavaScript framework |
| TypeScript | 5.9.3 | Type-safe development |
| **State Management** |
| Pinia | 2.3.0 | Centralized state management |
| @vueuse/nuxt | 11.3.0 | Composition utilities |
| **Styling** |
| Tailwind CSS | 3.4.0 | Utility-first CSS framework |
| Headless UI | 1.7.23 | Unstyled accessible components |
| **Internationalization** |
| @nuxtjs/i18n | 8.5.5 | Multi-language support |
| **Testing** |
| Playwright | 1.51.1 | End-to-end testing |
| Vitest | Latest | Unit testing (planned) |
| **Development** |
| DDEV | Latest | Local development environment |
| Node.js | 22 | JavaScript runtime |
| pnpm | 9.15.0 | Fast package manager |

### Backend Integration

Connects seamlessly to Drupal 11 backend via JSON:API:

```typescript
// Fetch webform schema
const { fetchResource } = useApi()
const form = await fetchResource('webform/webform/contact')

// Submit webform data
await postResource('webform_submission/contact', {
  data: {
    type: 'webform_submission--contact',
    attributes: { ... }
  }
})
```

**API Features:**
- RESTful JSON:API endpoints
- Automatic error handling with user-friendly messages
- Request/response interceptors for auth tokens
- CORS configured for cross-origin requests
- Type-safe API clients with TypeScript interfaces

## Quick Start

### Prerequisites

- DDEV installed and running
- Docker daemon active
- Backend running at `https://aabenforms.ddev.site`

### Installation

```bash
# Clone repository
git clone https://github.com/madsnorgaard/aabenforms-frontend.git frontend
cd frontend

# Start DDEV (automatically installs dependencies)
ddev start

# Access application
ddev launch
```

### Local Development URLs

| Environment | URL | Purpose |
|------------|-----|---------|
| Main Site | https://aabenforms-frontend.ddev.site | Primary development interface |
| Dev Server | https://aabenforms-frontend.ddev.site:3001 | Direct Nuxt dev server access |
| Backend API | https://aabenforms.ddev.site/jsonapi | JSON:API endpoints |

## Key Components

### WorkflowPayment

Integrated payment processing component with support for multiple payment methods:

```vue
<WorkflowPayment
  :amount="250.00"
  :workflow-id="workflowId"
  :payment-methods="['mobilepay', 'card']"
  @payment-complete="handlePaymentComplete"
  @payment-error="handlePaymentError"
/>
```

**Features:**
- MobilePay and credit card support
- PCI DSS compliant payment handling
- Real-time payment status updates
- Automatic receipt generation
- Error recovery workflows

### AppointmentPicker

Interactive appointment scheduling with real-time availability:

```vue
<AppointmentPicker
  :available-slots="availableSlots"
  :duration="30"
  @appointment-selected="handleSelection"
/>
```

**Features:**
- Calendar view with month/week/day modes
- Real-time availability checking
- Time slot visualization
- Timezone handling
- Conflict prevention
- Email confirmation integration

### WorkflowExecutionTracker

Visual workflow progress tracking with step-by-step updates:

```vue
<WorkflowExecutionTracker
  :workflow-id="workflowId"
  :steps="workflowSteps"
  :current-step="currentStep"
  @step-complete="handleStepComplete"
/>
```

**Features:**
- Linear and branching workflow visualization
- Real-time status updates via WebSocket
- Step validation and error handling
- Historical step tracking
- Estimated time remaining
- Multi-party approval tracking

## Project Structure

```
frontend/
├── .ddev/                    # DDEV configuration
│   └── config.yaml          # Node.js 22, Nuxt daemon
├── components/               # Vue components
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Modal.vue
│   │   ├── Skeleton.vue
│   │   ├── Spinner.vue
│   │   └── Tooltip.vue
│   ├── workflow/            # Workflow-specific components
│   │   ├── WorkflowPayment.vue
│   │   ├── AppointmentPicker.vue
│   │   ├── WorkflowExecutionTracker.vue
│   │   └── WorkflowDashboard.vue
│   ├── WebformRenderer.vue  # Dynamic form rendering
│   └── TenantBranding.vue   # Multi-tenant styling
├── composables/              # Composition functions
│   ├── useApi.ts            # JSON:API client
│   ├── useAuth.ts           # Authentication (MitID)
│   ├── useTenant.ts         # Tenant detection
│   └── useWorkflow.ts       # Workflow management
├── layouts/                  # Page layouts
│   ├── default.vue          # Standard layout
│   └── marketing.vue        # Marketing site layout
├── locales/                  # i18n translations
│   ├── da.json              # Danish
│   └── en.json              # English
├── pages/                    # File-based routing
│   ├── index.vue            # Marketing homepage
│   ├── forms/               # Form pages
│   │   └── [slug].vue       # Dynamic form rendering
│   └── workflows/           # Workflow pages
│       ├── tasks.vue        # Task dashboard
│       └── [id].vue         # Individual workflow view
├── stores/                   # Pinia state management
│   ├── user.ts              # User authentication state
│   ├── tenant.ts            # Multi-tenant configuration
│   ├── form.ts              # Form data and submission
│   └── workflow.ts          # Workflow state
├── types/                    # TypeScript definitions
│   ├── user.ts
│   ├── tenant.ts
│   ├── webform.ts
│   └── workflow.ts
├── docs/                     # Documentation
│   ├── guides/              # Usage guides
│   ├── reports/             # Test results and reports
│   └── archive/             # Historical documents
├── tests/                    # Test suites
│   ├── e2e/                 # Playwright E2E tests
│   └── unit/                # Vitest unit tests (planned)
├── app.vue                   # Root component
├── nuxt.config.ts           # Nuxt configuration
├── CLAUDE.md                # AI development context
└── README.md                # This file
```

## Development

### Common Commands

```bash
# View logs
ddev logs

# Install new dependency
ddev exec pnpm add <package-name>

# Install dev dependency
ddev exec pnpm add -D <package-name>

# Restart after config changes
ddev restart

# SSH into container
ddev ssh

# Build for production
ddev exec pnpm run build

# Preview production build
ddev exec pnpm run preview

# Run E2E tests
ddev exec pnpm test:e2e

# Type checking
ddev exec pnpm run vue-tsc --noEmit
```

### Multi-Tenancy

Automatic tenant detection from domain with fallback support:

```typescript
const { detectTenant } = useTenant()

// Detects tenant from current domain
await detectTenant()
// Returns tenant configuration including:
// - name: "Aarhus Kommune"
// - domain: "aarhus.aabenforms.dk"
// - branding: { colors, logo, etc. }
// - settings: tenant-specific configuration
```

**Tenant Types:**

1. **Default Tenant** (`aabenforms.dk`)
   - Marketing site showcasing platform features
   - Interactive demo environment
   - Public documentation and pricing
   - Lead generation forms

2. **Customer Tenants** (e.g., `aarhus.aabenforms.dk`)
   - Municipality-specific branding
   - Production forms and workflows
   - MitID authentication required
   - GDPR-compliant data handling

### State Management

Centralized state with Pinia stores:

```typescript
// User authentication
import { useUserStore } from '~/stores/user'
const userStore = useUserStore()

// Tenant configuration
import { useTenantStore } from '~/stores/tenant'
const tenantStore = useTenantStore()

// Form data and submission
import { useFormStore } from '~/stores/form'
const formStore = useFormStore()

// Workflow management
import { useWorkflowStore } from '~/stores/workflow'
const workflowStore = useWorkflowStore()
```

**Store Features:**
- Type-safe state access
- Persistent state with localStorage
- Automatic state hydration on page load
- DevTools integration for debugging
- Actions and getters co-located with state

### Internationalization

Built-in Danish and English support with extensible translation system:

```vue
<template>
  <h1>{{ $t('hero.tagline') }}</h1>
  <p>{{ $t('hero.description') }}</p>
  <NuxtLink :to="localePath('/forms/contact')">
    {{ $t('nav.contact') }}
  </NuxtLink>
</template>

<script setup>
const { locale, t } = useI18n()

// Switch language
locale.value = 'en'

// Use translations in script
const message = t('form.submit')
</script>
```

**Translation Files:**
- `locales/da.json` - Danish translations
- `locales/en.json` - English translations

### Testing

**End-to-End Testing with Playwright:**

```bash
# Run all E2E tests
ddev exec pnpm test:e2e

# Run specific test file
ddev exec pnpm test:e2e tests/e2e/workflow-payment.spec.ts

# Run tests in headed mode (with browser)
ddev exec pnpm test:e2e --headed

# Generate test report
ddev exec pnpm test:e2e --reporter=html
```

**Test Coverage:**
- Component interaction flows
- Form submission and validation
- Workflow execution paths
- Payment processing
- Appointment booking
- Multi-language support
- Accessibility compliance

## Production Build

### Building for Production

```bash
# Build optimized production bundle
ddev exec pnpm run build

# Preview production build locally
ddev exec pnpm run preview
```

**Build Output:**
- Server-side rendered (SSR) pages
- Static assets with content hashing
- Optimized JavaScript bundles
- Minified and extracted CSS
- Service worker for offline support (optional)

### Performance Metrics

**Lighthouse Scores:**
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

**Bundle Analysis:**
- Client bundle: 279.8 KB (99.86 KB gzipped)
- Largest chunk: Main application bundle
- CSS: 6.57 KB total
- Build time: ~6.7s

### Deployment

Production deployment via Upsun (Platform.sh):

```bash
# Deployment is handled by CI/CD pipeline
# See aabenforms-upsun repository for configuration
```

**Deployment Features:**
- Zero-downtime deployments
- Automatic SSL certificates
- CDN with global edge caching
- Health checks and rollback support
- Environment-specific configuration

## Documentation

### User Guides

- **[Component Usage Guide](docs/guides/COMPONENT_USAGE_GUIDE.md)** - How to use all UI components
- **[Workflow Tracker Implementation](docs/guides/WORKFLOW_TRACKER_IMPLEMENTATION.md)** - Workflow execution tracking
- **[Performance Optimization](docs/guides/PERFORMANCE_OPTIMIZATION.md)** - Performance best practices
- **[Accessibility Guide](docs/guides/ACCESSIBILITY_GUIDE.md)** - WCAG 2.1 AA compliance guide
- **[Multi-Tenant Setup](docs/guides/MULTI_TENANT.md)** - Multi-tenancy configuration

### Technical Reports

- **[Accessibility Report](docs/reports/ACCESSIBILITY_REPORT.md)** - Full WCAG 2.1 AA audit results
- **[UI/UX Polish Summary](docs/reports/UI_UX_POLISH_SUMMARY.md)** - Production readiness assessment
- **[Performance Implementation](docs/reports/PERFORMANCE_IMPLEMENTATION_SUMMARY.md)** - Performance optimization results

### Developer Resources

- **[CLAUDE.md](CLAUDE.md)** - Complete AI development context and technical guide
- **[Backend Repository](https://github.com/madsnorgaard/aabenforms)** - Drupal 11 API documentation

## Browser Support

**Modern Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- iOS Safari 14+
- Chrome for Android 90+

**Note:** Internet Explorer is not supported. Modern ES6+ features are used throughout.

## Contributing

We welcome contributions from the community. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Guidelines:**
- Follow existing code style and conventions
- Include tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Add accessibility considerations for UI changes

## Related Projects

- **Backend:** [aabenforms](https://github.com/madsnorgaard/aabenforms) - Drupal 11 backend with JSON:API
- **Platform:** [aabenforms-upsun](https://github.com/madsnorgaard/aabenforms-upsun) - Upsun deployment configuration

## License

GPL-2.0 - See [LICENSE](LICENSE) file for details

## Support

- **Issues:** [GitHub Issues](https://github.com/madsnorgaard/aabenforms-frontend/issues)
- **Discussions:** [GitHub Discussions](https://github.com/madsnorgaard/aabenforms-frontend/discussions)
- **Documentation:** [Nuxt 3 Docs](https://nuxt.com/docs) | [Vue 3 Docs](https://vuejs.org/guide)

---

**Built with Vue.js and Nuxt 3 for Danish municipalities**
