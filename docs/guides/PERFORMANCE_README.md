# Performance Optimization Quick Start

This guide provides a quick overview of the performance optimizations implemented in the ÅbenForms frontend.

## Quick Links

- **Full Report**: [PERFORMANCE_OPTIMIZATION.md](../PERFORMANCE_OPTIMIZATION.md)
- **Best Practices**: [performance-best-practices.md](./performance-best-practices.md)
- **Image Guide**: [image-optimization-guide.md](./image-optimization-guide.md)

## Key Optimizations

### 1. Lazy Loading

Heavy components are lazy-loaded using intersection observer:

```vue
<!-- Instead of: -->
<WebformRenderer :webform-id="id" />

<!-- Use: -->
<LazyWebformRenderer :webform-id="id" />
```

**Available Lazy Components**:
- `LazyWebformRenderer` - Form rendering
- `LazyWorkflowExecutionTracker` - Workflow tracking
- `LazyAppointmentPicker` - Calendar picker

### 2. API Caching

All API calls are cached by default for 5 minutes:

```typescript
// Cached by default
const data = await fetchResource('webform/contact')

// Disable caching for user-specific data
const tasks = await fetchResource('workflow/tasks', { cache: false })

// Clear cache manually
clearCache()
```

### 3. Debounced Input

Use debouncing for search and filter inputs:

```vue
<script setup>
const searchQuery = ref('')
const debouncedQuery = useDebouncedInput(searchQuery, 300)

watch(debouncedQuery, async (query) => {
  await fetchResults(query)
})
</script>

<template>
  <input v-model="searchQuery" />
</template>
```

### 4. Code Splitting

Routes and heavy dependencies are automatically code-split:

- Vendor chunks: Vue, i18n, UI components
- Route-based splitting: Each page is a separate chunk
- Manual chunking: Large dependencies split into separate files

## Performance Scripts

```bash
# Build and analyze bundle size
npm run analyze

# Run Lighthouse audit
npm run lighthouse

# Full performance audit (all pages)
npm run performance
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Performance Score | 95+ |  |
| Accessibility Score | 100 |  |
| Best Practices Score | 100 |  |
| SEO Score | 100 |  |
| First Contentful Paint | <1.8s |  |
| Largest Contentful Paint | <2.5s |  |
| Total Blocking Time | <200ms |  |
| Cumulative Layout Shift | <0.1 |  |

## Key Features

### Request Optimization
-  In-memory caching (5-minute TTL)
-  Request deduplication
-  Automatic retry with exponential backoff
-  Debounced input handling

### Bundle Optimization
-  Code splitting by route
-  Manual vendor chunks
-  Tree-shaking enabled
-  CSS purging with Tailwind

### Asset Optimization
-  Lazy loading for images
-  WebP format support
-  Responsive images with srcset
-  Asset compression enabled

### Build Optimization
-  SSR enabled
-  Asset compression
-  Route-based caching
-  Prerendering for static pages

## Using Lazy Components

### Basic Usage

```vue
<template>
  <div>
    <h1>My Page</h1>

    <!-- Heavy component loads only when visible -->
    <LazyWebformRenderer :webform-id="formId" />
  </div>
</template>
```

### Creating Your Own Lazy Component

```vue
<template>
  <div ref="elementRef">
    <HeavyComponent v-if="isVisible" />
    <UiSkeleton v-else height="400px" />
  </div>
</template>

<script setup>
const { isVisible, elementRef } = useLazyComponent({
  rootMargin: '100px',  // Load 100px before visible
  threshold: 0.1        // Load when 10% visible
})
</script>
```

## API Best Practices

### Caching Static Data

```typescript
// Forms don't change often - cache them
const forms = await fetchResource('webform/webform', { cache: true })

// User tasks change frequently - don't cache
const tasks = await fetchResource('workflow/tasks', { cache: false })
```

### Debouncing Search

```vue
<script setup>
const search = ref('')
const debouncedSearch = useDebouncedInput(search, 300)

watch(debouncedSearch, async (query) => {
  // Only called 300ms after user stops typing
  const results = await fetchResource(`search?q=${query}`)
})
</script>
```

### Preventing Duplicate Requests

```typescript
const loading = ref(false)

const fetchData = async () => {
  if (loading.value) return // Prevent duplicates

  loading.value = true
  try {
    const data = await fetchResource('data')
    return data
  } finally {
    loading.value = false
  }
}
```

## Image Optimization

### Basic Lazy Loading

```html
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  width="640"
  height="480"
/>
```

### Responsive Images

```html
<img
  src="image-640w.jpg"
  srcset="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1024w.jpg 1024w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="Description"
  loading="lazy"
/>
```

### WebP with Fallback

```html
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

## Running Performance Audits

### Quick Audit (Single Page)

```bash
npm run lighthouse
```

This opens a Lighthouse report in your browser.

### Full Audit (All Pages)

```bash
npm run performance
```

This runs Lighthouse on all key pages and generates a summary report.

### Custom Audit

```bash
./run-performance-audit.sh http://localhost:3000
```

## Bundle Size Analysis

```bash
# Build with analysis
npm run analyze

# This will:
# 1. Build the production bundle
# 2. Generate a visual bundle report
# 3. Open the report in your browser
```

## Performance Budget

The following budgets are enforced:

- **Total page size**: <500KB (compressed)
- **JavaScript bundle**: <300KB (compressed)
- **CSS**: <50KB (compressed)
- **Images per page**: <150KB
- **API response time**: <200ms (p95)

## Troubleshooting

### Bundle Too Large

```bash
# Analyze which packages are large
npm run analyze

# Consider:
# 1. Using dynamic imports
# 2. Finding lighter alternatives
# 3. Removing unused dependencies
```

### Slow API Calls

```typescript
// Enable caching
const data = await fetchResource('endpoint', { cache: true })

// Use debouncing for user input
const debouncedValue = useDebouncedInput(value, 300)

// Batch related requests
const [data1, data2] = await Promise.all([
  fetchResource('endpoint1'),
  fetchResource('endpoint2')
])
```

### Images Loading Slowly

```bash
# Optimize images
# Use online tools:
# - Squoosh.app
# - ImageOptim (macOS)
# - TinyPNG

# Or install Sharp
npm install -g sharp-cli
sharp input.jpg -o output.webp --webp-quality 80
```

## Resources

### Documentation
- [Full Performance Report](../PERFORMANCE_OPTIMIZATION.md)
- [Best Practices Guide](./performance-best-practices.md)
- [Image Optimization Guide](./image-optimization-guide.md)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Phobia](https://bundlephobia.com/)
- [Squoosh](https://squoosh.app/)

### External Resources
- [Nuxt Performance Docs](https://nuxt.com/docs/guide/going-further/performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)

## Next Steps

1. Run baseline performance audit: `npm run performance`
2. Review bundle size: `npm run analyze`
3. Optimize images in `/assets/images/`
4. Add lazy loading to new heavy components
5. Test on slow network (Chrome DevTools → Network → Slow 3G)

## Support

For questions or issues with performance:
1. Check the [Best Practices Guide](./performance-best-practices.md)
2. Review the [Full Report](../PERFORMANCE_OPTIMIZATION.md)
3. Run performance audit to identify bottlenecks

---

**Remember**: Performance is a feature. Keep it optimized!
