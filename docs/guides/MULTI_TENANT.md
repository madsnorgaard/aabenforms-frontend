# Multi-Tenant Frontend Implementation

This document explains how the ÅbenForms frontend implements multi-tenancy using Drupal's Domain Access module.

## Overview

The frontend automatically detects the current tenant based on the domain name and applies tenant-specific branding (logo, colors, settings).

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser                                        │
│  Domain: aarhus.aabenforms.dk                   │
└──────────────────┬──────────────────────────────┘
                   │
                   │ 1. Page load
                   ▼
┌─────────────────────────────────────────────────┐
│  Frontend (Nuxt 3)                              │
│  ├─ plugins/tenant.client.ts                    │
│  │  └─ Auto-detect on app startup               │
│  ├─ composables/useTenant.ts                    │
│  │  └─ Fetch from Domain API                    │
│  └─ components/TenantBranding.vue               │
│     └─ Apply colors/logo                        │
└──────────────────┬──────────────────────────────┘
                   │
                   │ 2. GET /jsonapi/domain/domain?filter[hostname]=aarhus.aabenforms.dk
                   ▼
┌─────────────────────────────────────────────────┐
│  Backend (Drupal 11)                            │
│  ├─ Domain Access module                        │
│  │  └─ Domain records (domain_record)           │
│  └─ JSON:API                                    │
│     └─ Expose domain configuration              │
└─────────────────────────────────────────────────┘
```

## Domain Module Configuration (Backend)

### 1. Enable Required Modules

```bash
cd /home/mno/ddev-projects/aabenforms/backend

# Enable Domain modules
ddev drush pm:enable domain domain_access

# Clear cache
ddev drush cr
```

### 2. Create Domain Records

**Via Drush:**

```bash
# Create domain for Aarhus Kommune
ddev drush domain:create aarhus.aabenforms.ddev.site "Aarhus Kommune"

# Create domain for Odense Kommune
ddev drush domain:create odense.aabenforms.ddev.site "Odense Kommune"
```

**Via UI:**

1. Go to **Configuration → Domain Access → Domains** (`/admin/config/domain`)
2. Click **Add domain**
3. Fill in:
   - **Hostname**: `aarhus.aabenforms.dk`
   - **Domain name**: `Aarhus Kommune`
   - **Scheme**: `https`
   - **Status**: Enabled
4. Save

### 3. Configure Tenant Branding

Add custom fields to domain records for branding:

**Option A: Use Third-Party Settings (Recommended)**

Store branding in `third_party_settings` via configuration:

```php
// In a custom module: aabenforms_tenant.module

/**
 * Implements hook_domain_presave().
 */
function aabenforms_tenant_domain_presave(\Drupal\domain\DomainInterface $domain) {
  // Set default branding if not set
  $settings = $domain->getThirdPartySetting('aabenforms_tenant', 'branding', []);

  if (empty($settings)) {
    $domain->setThirdPartySetting('aabenforms_tenant', 'branding', [
      'primary_color' => '#007acc',
      'secondary_color' => '#28a745',
      'logo_url' => '/themes/custom/aabenforms/logo.svg',
      'contact_email' => 'kontakt@' . $domain->getHostname(),
    ]);
  }
}
```

**Option B: Add Custom Fields**

```bash
# Add fields to domain entity
ddev drush field:create domain domain
# Follow prompts to add:
# - field_primary_color (Color field)
# - field_secondary_color (Color field)
# - field_logo (Image field)
# - field_contact_email (Email field)
```

### 4. Configure JSON:API Exposure

The Domain module automatically exposes domain records via JSON:API at:

```
GET /jsonapi/domain/domain
GET /jsonapi/domain/domain?filter[hostname]=aarhus.aabenforms.dk
```

**Enable JSON:API for Domain:**

```bash
# Check if domain is available in JSON:API
ddev drush ev "print_r(\Drupal::entityTypeManager()->getDefinition('domain'));"

# If needed, ensure JSON:API is enabled for domain entity
# This is usually automatic with JSON:API module enabled
```

### 5. Set Up Domain-Specific Configuration

**Per-Domain Settings:**

```yaml
# config/domain.record.aarhus_aabenforms_dk.yml
id: aarhus_aabenforms_dk
domain_id: aarhus_aabenforms_dk
hostname: aarhus.aabenforms.dk
name: Aarhus Kommune
scheme: https
status: true
weight: 0
is_default: false
third_party_settings:
  aabenforms_tenant:
    branding:
      primary_color: '#003d5c'
      secondary_color: '#e74c3c'
      logo_url: '/sites/aarhus/logo.png'
      contact_email: 'kontakt@aarhus.dk'
      support_phone: '+45 8940 2000'
      enable_mitid: true
      default_language: 'da'
      timezone: 'Europe/Copenhagen'
      footer_text: 'Aarhus Kommune | CVR: 55133018'
```

## Frontend Implementation

### Automatic Tenant Detection

The frontend automatically detects the tenant on app startup:

```typescript
// plugins/tenant.client.ts
export default defineNuxtPlugin(async (nuxtApp) => {
  const { detectTenant, applyBranding } = useTenant()

  await detectTenant()
  applyBranding()
})
```

### Manual Tenant Detection

You can also manually detect tenant in components:

```vue
<script setup>
const { tenant, detectTenant, isDefaultTenant } = useTenant()

onMounted(async () => {
  await detectTenant()

  if (isDefaultTenant.value) {
    // Show marketing content
  } else {
    // Show tenant-specific application
  }
})
</script>
```

### Using Tenant Data

```vue
<template>
  <div>
    <h1>{{ tenant?.name || 'ÅbenForms' }}</h1>

    <img v-if="tenant?.logo" :src="tenant.logo" alt="Logo" />

    <p v-if="tenant?.settings?.contactEmail">
      Contact: {{ tenant.settings.contactEmail }}
    </p>
  </div>
</template>

<script setup>
const { tenant } = useTenant()
</script>
```

### Applying Tenant Branding

Branding is automatically applied via CSS custom properties:

```css
/* TenantBranding.vue sets these: */
:root {
  --color-primary: #003d5c; /* From tenant config */
  --color-secondary: #e74c3c;
}

/* Use in your components: */
.my-button {
  background: var(--color-primary);
}
```

## Testing Multi-Tenancy Locally

### 1. Set Up Local Domains

**Add to /etc/hosts:**

```bash
127.0.0.1 aabenforms.ddev.site
127.0.0.1 aarhus.aabenforms.ddev.site
127.0.0.1 odense.aabenforms.ddev.site
```

**Or use DDEV:**

```bash
cd /home/mno/ddev-projects/aabenforms/frontend

# Add additional hostnames
ddev config --additional-hostnames=aarhus.aabenforms.ddev.site,odense.aabenforms.ddev.site
ddev restart
```

### 2. Create Test Domains in Backend

```bash
cd /home/mno/ddev-projects/aabenforms/backend

# Create test domains
ddev drush domain:create aarhus.aabenforms.ddev.site "Aarhus Kommune"
ddev drush domain:create odense.aabenforms.ddev.site "Odense Kommune"

# Verify
ddev drush domain:list
```

### 3. Test Frontend

Visit different domains:

- **Default**: http://localhost:3001 (marketing site)
- **Aarhus**: http://aarhus.aabenforms.ddev.site:3001 (Aarhus branding)
- **Odense**: http://odense.aabenforms.ddev.site:3001 (Odense branding)

Each should show different branding based on domain configuration.

## Production Deployment

### 1. DNS Configuration

Point each tenant domain to your application:

```
aarhus.aabenforms.dk → CNAME → app.aabenforms.dk
odense.aabenforms.dk → CNAME → app.aabenforms.dk
```

### 2. SSL Certificates

Ensure SSL certificates cover all tenant domains:

```bash
# Example with Let's Encrypt
certbot certonly --webroot \
  -d aabenforms.dk \
  -d aarhus.aabenforms.dk \
  -d odense.aabenforms.dk \
  -w /var/www/html
```

### 3. Backend Domain Records

Create domain records for production domains in Drupal:

```bash
# Production domains
drush domain:create aarhus.aabenforms.dk "Aarhus Kommune"
drush domain:create odense.aabenforms.dk "Odense Kommune"
```

## Troubleshooting

### Domain Not Detected

**Issue**: Frontend shows default branding even on tenant domain

**Solutions**:

1. Check backend domain records:
   ```bash
   ddev drush domain:list
   ```

2. Verify JSON:API endpoint:
   ```bash
   curl https://aabenforms.ddev.site/jsonapi/domain/domain
   ```

3. Check browser console for errors

4. Clear localStorage:
   ```javascript
   localStorage.removeItem('tenant_domain')
   localStorage.removeItem('tenant_data')
   ```

### CORS Errors

**Issue**: Frontend can't fetch domain data from backend

**Solution**: Configure CORS in backend:

```yaml
# backend/.ddev/config.yaml
web_environment:
  - CORS_ALLOW_ORIGIN=https://aarhus.aabenforms.ddev.site
```

### Branding Not Applied

**Issue**: Colors/logo not showing even though tenant is detected

**Solutions**:

1. Check tenant data in Vue DevTools
2. Verify CSS custom properties are set:
   ```javascript
   console.log(getComputedStyle(document.documentElement).getPropertyValue('--color-primary'))
   ```
3. Force re-apply branding:
   ```javascript
   const { applyBranding } = useTenant()
   applyBranding()
   ```

## References

- [Drupal Domain Access Documentation](https://www.drupal.org/docs/extending-drupal/contributed-modules/contributed-modules/contributed-modules-documentation/domain-access-documentation)
- [Domain Module Multi-Site Guide](https://www.thedroptimes.com/50303/drupal-domain-module-multi-site-management-guide)
- [Drupal JSON:API Documentation](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module)

---

**Sources:**
- [Multi-domain & multi-tenant | Drupal.org](https://www.drupal.org/forum/support/post-installation/2021-04-12/multi-domain-multi-tenant)
- [Domain Access documentation | Drupal.org](https://www.drupal.org/docs/extending-drupal/contributed-modules/contributed-modules/contributed-modules-documentation/domain-access-documentation)
- [Drupal Domain Module Multi-Site Management Guide](https://www.thedroptimes.com/50303/drupal-domain-module-multi-site-management-guide)
