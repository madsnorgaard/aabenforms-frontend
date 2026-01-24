# ÅbenForms Frontend - Nuxt 3

## Project Overview

**ÅbenForms Frontend** is the user-facing Nuxt 3 application that provides:
- Multi-tenant marketing and application interfaces
- Dynamic webform rendering from Drupal backend
- Workflow task management dashboards
- Responsive, modern UI with Danish/English localization

This frontend connects to the [ÅbenForms Drupal backend](https://github.com/madsnorgaard/aabenforms) via JSON:API.

## Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Nuxt | 3.21.0 | Vue.js framework |
| Vue | 3.5.27 | UI library |
| Node.js | 22 | Runtime |
| pnpm | 9.15.0 | Package manager |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.3.1 | Build tool |
| DDEV | Latest | Local development |

## Essential Commands

### DDEV Operations
```bash
# Start environment
cd /home/mno/ddev-projects/aabenforms/frontend
ddev start

# Stop environment
ddev stop

# SSH into container
ddev ssh

# View logs (Nuxt dev server)
ddev logs

# Restart (after config changes)
ddev restart
```

### Node.js / pnpm Commands
```bash
# Install dependencies
ddev exec pnpm install

# Run dev server (already running via DDEV daemon)
ddev exec pnpm run dev

# Build for production
ddev exec pnpm run build

# Preview production build
ddev exec pnpm run preview

# Type checking
ddev exec pnpm run vue-tsc --noEmit
```

### Development Workflow
```bash
# Add new dependency
ddev exec pnpm add <package-name>

# Add dev dependency
ddev exec pnpm add -D <package-name>

# Remove dependency
ddev exec pnpm remove <package-name>

# Update dependencies
ddev exec pnpm update
```

## Architecture

### Directory Structure
```
frontend/
├── .ddev/                    # DDEV configuration
│   └── config.yaml          # Node.js 22, Nuxt daemon
├── .nuxt/                    # Generated (gitignored)
├── assets/                   # Global CSS, images
│   └── css/
├── components/               # Vue components
│   ├── WebformRenderer.vue   # Dynamic form rendering
│   ├── WorkflowDashboard.vue # User task dashboard
│   └── TenantBranding.vue    # Per-tenant styling
├── composables/              # Vue composables
│   ├── useApi.ts            # JSON:API client
│   ├── useTenant.ts         # Tenant detection
│   └── useAuth.ts           # Authentication (future)
├── layouts/                  # Page layouts
│   ├── default.vue          # Standard layout
│   └── marketing.vue        # Marketing site layout
├── locales/                  # i18n translations
│   ├── da.json              # Danish
│   └── en.json              # English
├── pages/                    # File-based routing
│   ├── index.vue            # Marketing home
│   ├── forms/               # Form pages
│   │   └── [slug].vue       # Dynamic form rendering
│   └── workflows/           # Workflow pages
│       └── tasks.vue        # User task list
├── stores/                   # Pinia state management
│   ├── tenant.ts            # Tenant state
│   └── user.ts              # User session
├── types/                    # TypeScript types
│   ├── tenant.ts
│   ├── webform.ts
│   └── workflow.ts
├── app.vue                   # Root component
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

### Routing

Nuxt uses file-based routing:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `pages/index.vue` | Marketing home (default tenant) |
| `/forms/:slug` | `pages/forms/[slug].vue` | Webform rendering |
| `/workflows/tasks` | `pages/workflows/tasks.vue` | User task dashboard |
| `/demo` | `pages/demo.vue` | Interactive demo (future) |

### Multi-Tenancy

The frontend detects the current tenant from the domain:

```typescript
// composables/useTenant.ts
const { detectTenant } = useTenant()

// Detects tenant from domain (e.g., aarhus.aabenforms.dk)
const tenant = await detectTenant()
// Returns: { name: 'Aarhus Kommune', domain: 'aarhus.aabenforms.dk', ... }
```

**Default Tenant (aabenforms.dk)**:
- Marketing site showcasing platform features
- Live demo environment
- Documentation and pricing
- Lead generation forms

**Customer Tenants (e.g., aarhus.aabenforms.dk)**:
- Municipality-specific branding
- Production forms and workflows
- Restricted access (MitID required)

## Composables

### useApi()
Connects to Drupal JSON:API backend:

```typescript
const { fetchResource, postResource } = useApi()

// Fetch webform schema
const form = await fetchResource('webform/webform/contact')

// Submit webform
await postResource('webform_submission/contact', {
  data: {
    type: 'webform_submission--contact',
    attributes: { ... }
  }
})
```

### useTenant()
Tenant detection and configuration:

```typescript
const { tenant, detectTenant } = useTenant()

onMounted(async () => {
  await detectTenant()
  console.log(tenant.value.name) // "Aarhus Kommune"
})
```

### useAuth() (Planned - Phase 2)
MitID authentication:

```typescript
const { login, logout, user } = useAuth()

// Redirect to MitID
await login()

// Check auth status
if (user.value?.cpr) {
  // User authenticated with MitID
}
```

## Internationalization (i18n)

Danish and English supported via `@nuxtjs/i18n`:

```vue
<template>
  <h1>{{ $t('hero.tagline') }}</h1>
  <NuxtLink :to="localePath('/forms/contact')">
    {{ $t('nav.contact') }}
  </NuxtLink>
</template>

<script setup>
const { t, locale } = useI18n()

// Change language
locale.value = 'en'
</script>
```

### Adding Translations

1. Edit `locales/da.json`:
```json
{
  "hero": {
    "tagline": "Workflow-automatisering for danske kommuner"
  }
}
```

2. Edit `locales/en.json`:
```json
{
  "hero": {
    "tagline": "Workflow automation for Danish municipalities"
  }
}
```

## Backend Integration

### API Configuration

Set via environment variable or `.env`:

```bash
# .env (development - already configured in DDEV)
API_BASE_URL=https://aabenforms.ddev.site
```

In production (Platform.sh):
```bash
API_BASE_URL=https://api.aabenforms.dk
```

### Fetching Data

All backend requests go through `useApi()` composable:

```typescript
// Fetch all webforms
const forms = await fetchResource('webform/webform')

// Fetch specific form
const contactForm = await fetchResource('webform/webform/contact')

// Submit form
await postResource('webform_submission/contact', formData)
```

### CORS

Backend DDEV is configured to allow frontend origin:
```yaml
# backend/.ddev/config.yaml
web_environment:
  - CORS_ALLOW_ORIGIN=https://aabenforms-frontend.ddev.site
```

## DDEV Configuration

The frontend runs on DDEV with:
- **Node.js 22** with Corepack enabled
- **Nuxt dev server** as web_extra_daemon (port 3000)
- **No database** (frontend doesn't need one)

### Accessing the Site

| URL | Purpose |
|-----|---------|
| https://aabenforms-frontend.ddev.site | Main frontend (proxies to port 3000) |
| https://aabenforms-frontend.ddev.site:3001 | Direct Nuxt dev server |

### Environment Variables

Set in `.ddev/config.yaml`:
```yaml
web_environment:
  - API_BASE_URL=https://aabenforms.ddev.site
```

Access in Nuxt:
```typescript
const config = useRuntimeConfig()
console.log(config.public.apiBase) // https://aabenforms.ddev.site
```

## Development Workflow

### 1. Creating New Pages

```bash
# Create new page
touch pages/pricing.vue
```

```vue
<!-- pages/pricing.vue -->
<template>
  <div>
    <h1>{{ $t('pricing.title') }}</h1>
  </div>
</template>
```

Automatically available at: `/pricing`

### 2. Creating Components

```bash
# Create component
touch components/FeatureCard.vue
```

```vue
<!-- components/FeatureCard.vue -->
<template>
  <div class="feature-card">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
```

Use in pages (auto-imported):
```vue
<FeatureCard title="Workflows" description="..." />
```

### 3. Adding State Management

```bash
# Create store
touch stores/user.ts
```

```typescript
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: '',
    authenticated: false
  }),
  actions: {
    login(user: User) {
      this.name = user.name
      this.email = user.email
      this.authenticated = true
    },
    logout() {
      this.$reset()
    }
  }
})
```

Use in components:
```vue
<script setup>
const userStore = useUserStore()

function handleLogin() {
  userStore.login({ name: 'Test', email: 'test@example.com' })
}
</script>
```

## Building for Production

### Development Build
```bash
# Build for production
ddev exec pnpm run build

# Preview production build
ddev exec pnpm run preview
```

### Platform.sh Build
Automatic via `.platform.app.yaml` in platform repository.

## Marketing vs. Application Pages

### Marketing Pages (Default Tenant)
Located in `pages/`:
- `index.vue` - Home/hero
- `features.vue` - Feature showcase
- `pricing.vue` - Pricing plans
- `demo.vue` - Interactive demo
- `contact.vue` - Contact form

**Characteristics**:
- Public access (no authentication)
- SEO optimized
- Lead generation
- Product showcase

### Application Pages (Customer Tenants)
Located in `pages/app/`:
- `app/forms/[slug].vue` - Form rendering
- `app/workflows/tasks.vue` - Task dashboard
- `app/profile.vue` - User profile

**Characteristics**:
- Requires MitID authentication
- Tenant-specific branding
- Production data
- GDPR compliant

## Troubleshooting

### Common Issues

**Problem**: `Cannot find module` errors
**Solution**: Reinstall dependencies
```bash
ddev exec rm -rf node_modules .nuxt
ddev exec pnpm install
ddev restart
```

**Problem**: Changes not reflecting
**Solution**: Clear Nuxt cache
```bash
ddev exec rm -rf .nuxt
ddev restart
```

**Problem**: CORS errors connecting to backend
**Solution**: Check backend CORS config
```bash
cd ../backend
ddev drush config:get system.cors
```

**Problem**: Port 3000 already in use
**Solution**: Stop other Nuxt instances
```bash
ddev stop
# Stop any other DDEV projects using port 3000
ddev start
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/<name>

# Standard commit flow
git add <files>
git commit -m "Descriptive message"
git push origin feature/<name>

# Merge to main (after review)
git checkout main
git merge feature/<name>
git push origin main
```

## Related Repositories

- **Backend**: [madsnorgaard/aabenforms](https://github.com/madsnorgaard/aabenforms)
- **Platform**: [madsnorgaard/aabenforms-platform](https://github.com/madsnorgaard/aabenforms-platform)

## Performance Optimization

### Production Checklist
- [ ] Enable SSR (`ssr: true` in nuxt.config.ts)
- [ ] Lazy-load components with `<LazyComponent>`
- [ ] Image optimization via Nuxt Image module
- [ ] Bundle analysis: `pnpm run build --analyze`
- [ ] CDN configuration (Platform.sh Varnish)

### Lighthouse Score Targets
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

## Support

- **Issues**: https://github.com/madsnorgaard/aabenforms-frontend/issues
- **Nuxt Docs**: https://nuxt.com/docs
- **Vue Docs**: https://vuejs.org/guide

## License

GPL-2.0 - See LICENSE file
