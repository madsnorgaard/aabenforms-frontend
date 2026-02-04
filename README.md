# ÅbenForms Frontend

**Nuxt 3 multi-tenant UI for Danish municipal workflow automation**

[![Nuxt](https://img.shields.io/badge/Nuxt-3.15.0-00DC82)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3.5.27-4FC08D)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6)](https://www.typescriptlang.org)
[![Pinia](https://img.shields.io/badge/Pinia-2.3.0-yellow)](https://pinia.vuejs.org)
[![License](https://img.shields.io/badge/License-GPL--2.0-green)](LICENSE)

## Overview

Modern, responsive frontend for the ÅbenForms platform that provides:
- 🎨 Multi-tenant marketing and application interfaces
- 📝 Dynamic webform rendering from Drupal backend
- 🔄 Workflow task management dashboards
- 🌍 Danish/English localization
- 📱 Mobile-first responsive design

## Implementation Status

**Phase 2 Complete** (February 2026)

✅ **Completed Features:**
- Homepage with marketing content and navigation
- Dynamic webform renderer component (WebformRenderer.vue)
- Workflow task dashboard with filtering and pagination
- MitID authentication UI (login button, callback handler)
- Multi-tenant branding system with CSS theming
- Pinia state management (user, tenant, form stores)
- Composables for API, auth, and tenant management
- Full i18n support (Danish/English)

⏳ **Requires Backend:**
- Form submission (backend JSON:API endpoint needed)
- MitID OIDC flow (backend /mitid/login endpoint needed)
- Workflow task data (backend ECA workflow system needed)
- Tenant configuration from Domain module

> **Note:** Frontend is fully functional in dev/preview mode. Some features require corresponding backend implementations to be production-ready.

## Quick Start

### Prerequisites
- DDEV installed
- Docker running
- Backend running at `https://aabenforms.ddev.site`

### Installation

```bash
# Clone repository
git clone https://github.com/madsnorgaard/aabenforms-frontend.git frontend
cd frontend

# Start DDEV (installs dependencies automatically)
ddev start

# Access site
ddev launch
```

### Local URLs
- **Main Site**: https://aabenforms-frontend.ddev.site
- **Direct Dev Server**: https://aabenforms-frontend.ddev.site:3001
- **Backend API**: https://aabenforms.ddev.site/jsonapi

## Features

### Marketing Site (Default Tenant)
The main site (`aabenforms.dk`) serves as:
- Landing page showcasing platform features
- Interactive demo environment
- Documentation and pricing
- Lead generation and contact forms

### Customer Tenants
Tenant-specific sites (e.g., `aarhus.aabenforms.dk`):
- Custom branding per municipality
- Production forms and workflows
- MitID authentication
- GDPR-compliant data handling

## Development

### Common Commands
```bash
# View logs
ddev logs

# Install new dependency
ddev exec pnpm add <package-name>

# Restart (after config changes)
ddev restart

# SSH into container
ddev ssh

# Build for production
ddev exec pnpm run build
```

### Project Structure
```
frontend/
├── components/         # Vue components
├── composables/        # Reusable composition functions
├── layouts/            # Page layouts
├── locales/            # i18n translations (da/en)
├── pages/              # File-based routing
├── stores/             # Pinia state management
├── types/              # TypeScript definitions
├── app.vue             # Root component
└── nuxt.config.ts      # Nuxt configuration
```

## Backend Integration

Connects to Drupal 11 backend via JSON:API:

```typescript
// composables/useApi.ts
const { fetchResource } = useApi()

// Fetch webform schema
const form = await fetchResource('webform/webform/contact')

// Submit form
await postResource('webform_submission/contact', data)
```

## State Management

Centralized state management with Pinia stores:

```typescript
// User authentication state
import { useUserStore } from '~/stores/user'
const userStore = useUserStore()

// Tenant configuration state
import { useTenantStore } from '~/stores/tenant'
const tenantStore = useTenantStore()

// Form data and submission state
import { useFormStore } from '~/stores/form'
const formStore = useFormStore()
```

**Available Stores:**
- **user.ts**: Authentication, session management, CPR handling
- **tenant.ts**: Multi-tenant configuration, branding, domain detection
- **form.ts**: Webform loading, validation, submission

## Multi-Tenancy

Automatic tenant detection from domain:

```typescript
// composables/useTenant.ts (uses Pinia store internally)
const { detectTenant } = useTenant()

await detectTenant()
// Returns tenant config for current domain
```

## Localization

Built-in Danish and English support:

```vue
<template>
  <h1>{{ $t('hero.tagline') }}</h1>
</template>

<script setup>
const { locale } = useI18n()
locale.value = 'da' // Switch to Danish
</script>
```

## Documentation

For detailed information, see:
- **[CLAUDE.md](CLAUDE.md)** - Complete development guide
- **[Backend Repository](https://github.com/madsnorgaard/aabenforms)** - API documentation

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Nuxt | 3.15.0 | Framework |
| Vue | 3.5.27 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Pinia | 2.3.0 | State management |
| @nuxtjs/i18n | 8.5.5 | Internationalization |
| @vueuse/nuxt | 11.3.0 | Composition utilities |
| Tailwind CSS | 3.4.0 | Styling framework |
| Headless UI | 1.7.23 | Accessible components |

> **Important:** Nuxt 3.15.0 is required (not 3.21.0) due to compatibility with @nuxtjs/i18n 8.5.5. Nuxt 3.21.0 causes `getActiveHead` export errors with the i18n module.

## Building for Production

```bash
# Build
ddev exec pnpm run build

# Preview
ddev exec pnpm run preview
```

Production deployment handled by Upsun (see platform repository).

## Related Projects

- **Backend**: [aabenforms](https://github.com/madsnorgaard/aabenforms)
- **Upsun**: [aabenforms-upsun](https://github.com/madsnorgaard/aabenforms-upsun)

## License

GPL-2.0 - See [LICENSE](LICENSE)

## Contributing

Issues and pull requests welcome at:
https://github.com/madsnorgaard/aabenforms-frontend/issues

---

**Built with Vue.js and Nuxt 3 for Danish municipalities**
