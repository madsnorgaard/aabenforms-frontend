# Performance Best Practices for Development

This guide provides actionable best practices for maintaining optimal performance while developing new features.

## Table of Contents

1. [Component Development](#component-development)
2. [API Integration](#api-integration)
3. [State Management](#state-management)
4. [Image Handling](#image-handling)
5. [CSS and Styling](#css-and-styling)
6. [Bundle Size Management](#bundle-size-management)
7. [Testing Performance](#testing-performance)

---

## Component Development

### Use Lazy Loading for Heavy Components

Components larger than 50KB or with heavy dependencies should be lazy-loaded:

```vue
<!-- Bad: Loads immediately -->
<HeavyComponent />

<!-- Good: Loads when visible -->
<LazyHeavyComponent />
```

**Creating a lazy component**:
```vue
<template>
  <div ref="elementRef">
    <HeavyComponent v-if="isVisible" />
    <Skeleton v-else />
  </div>
</template>

<script setup>
const { isVisible, elementRef } = useLazyComponent({
  rootMargin: '100px',
  threshold: 0.1
})
</script>
```

### Implement Skeleton Loaders

Always show loading states instead of blank screens:

```vue
<template>
  <div v-if="loading">
    <UiSkeleton height="200px" />
  </div>
  <div v-else>
    <!-- Actual content -->
  </div>
</template>
```

### Optimize v-if vs v-show

- Use `v-if` for content that rarely changes
- Use `v-show` for frequently toggled content

```vue
<!-- Bad: Re-renders on every toggle -->
<div v-if="showDetails">
  <!-- Heavy component that toggles frequently -->
</div>

<!-- Good: Hidden with CSS, no re-render -->
<div v-show="showDetails">
  <!-- Heavy component that toggles frequently -->
</div>
```

### Use Computed Properties

Avoid methods for derived values:

```vue
<script setup>
// Bad: Recalculated on every render
const getFullName = () => {
  return `${user.firstName} ${user.lastName}`
}

// Good: Cached, only recalculates when dependencies change
const fullName = computed(() => {
  return `${user.firstName} ${user.lastName}`
})
</script>
```

### Avoid Unnecessary Reactivity

Don't make everything reactive:

```vue
<script setup>
// Bad: Reactive but never changes
const config = ref({
  apiUrl: 'https://api.example.com',
  timeout: 5000
})

// Good: Plain object
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
}
</script>
```

---

## API Integration

### Always Use Caching for Static Data

```typescript
// Static/semi-static data - use cache
const forms = await fetchResource('webform/webform', { cache: true })

// User-specific data - disable cache
const userTasks = await fetchResource('workflow/tasks', { cache: false })
```

### Debounce Search and Filter Inputs

```vue
<script setup>
const searchQuery = ref('')
const debouncedQuery = useDebouncedInput(searchQuery, 300)

watch(debouncedQuery, async (query) => {
  // Only called 300ms after user stops typing
  await fetchSearchResults(query)
})
</script>

<template>
  <input v-model="searchQuery" placeholder="Search..." />
</template>
```

### Prevent Duplicate Requests

```vue
<script setup>
const loading = ref(false)
const data = ref(null)

const fetchData = async () => {
  // Prevent duplicate requests
  if (loading.value) return

  loading.value = true
  try {
    data.value = await fetchResource('data')
  } finally {
    loading.value = false
  }
}
</script>
```

### Batch API Requests

```typescript
// Bad: Multiple sequential requests
const user = await fetchResource('user/123')
const posts = await fetchResource('posts?user=123')
const comments = await fetchResource('comments?user=123')

// Good: Parallel requests
const [user, posts, comments] = await Promise.all([
  fetchResource('user/123'),
  fetchResource('posts?user=123'),
  fetchResource('comments?user=123')
])
```

### Implement Pagination

Don't load all data at once:

```typescript
// Bad: Load all 1000 items
const allItems = await fetchResource('items')

// Good: Load 20 items at a time
const items = await fetchResource('items', {
  params: {
    page: 1,
    pageSize: 20
  }
})
```

---

## State Management

### Use Local State When Possible

```vue
<script setup>
// Bad: Global state for local data
import { useGlobalStore } from '@/stores/global'
const store = useGlobalStore()
const formData = computed(() => store.formData)

// Good: Local state
const formData = ref({})
</script>
```

### Debounce State Updates

```vue
<script setup>
const debouncedUpdate = useDebouncedCallback((value) => {
  store.updateSearch(value)
}, 300)

const handleInput = (value) => {
  debouncedUpdate(value)
}
</script>
```

### Avoid Deep Watchers

```vue
<script setup>
// Bad: Deep watcher on large object
watch(largeObject, () => {
  // Expensive operation
}, { deep: true })

// Good: Watch specific properties
watch(() => largeObject.specificProperty, () => {
  // Only runs when this property changes
})
</script>
```

---

## Image Handling

### Use Lazy Loading

```html
<!-- All images below the fold -->
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  width="640"
  height="480"
/>
```

### Provide Responsive Images

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

### Use WebP with Fallback

```html
<picture>
  <source srcset="image.webp" type="image/webp" />
  <source srcset="image.jpg" type="image/jpeg" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### Set Explicit Dimensions

Prevent layout shift:

```html
<!-- Bad: No dimensions, causes layout shift -->
<img src="image.jpg" alt="Description" />

<!-- Good: Explicit dimensions -->
<img
  src="image.jpg"
  alt="Description"
  width="640"
  height="480"
/>
```

---

## CSS and Styling

### Use Tailwind Utility Classes

```vue
<!-- Bad: Custom CSS for every component -->
<style scoped>
.my-button {
  padding: 0.5rem 1rem;
  background: blue;
  color: white;
  border-radius: 0.25rem;
}
</style>

<!-- Good: Tailwind utilities -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">
  Click me
</button>
```

### Avoid Inline Styles

```vue
<!-- Bad: Inline styles -->
<div :style="{ color: textColor, fontSize: textSize }">

<!-- Good: Dynamic classes -->
<div :class="[textColorClass, textSizeClass]">
```

### Minimize Scoped Styles

```vue
<!-- Only use scoped styles for truly component-specific CSS -->
<style scoped>
/* Keep this minimal */
.custom-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
}
</style>
```

---

## Bundle Size Management

### Use Dynamic Imports

```typescript
// Bad: Import large library upfront
import { HugeLibrary } from 'huge-library'

// Good: Dynamic import when needed
const loadHugeLibrary = async () => {
  const { HugeLibrary } = await import('huge-library')
  return new HugeLibrary()
}
```

### Import Specific Functions

```typescript
// Bad: Import entire library
import _ from 'lodash'
_.debounce(fn, 300)

// Good: Import specific function
import debounce from 'lodash/debounce'
debounce(fn, 300)

// Best: Use native or VueUse
import { useDebounceFn } from '@vueuse/core'
const debouncedFn = useDebounceFn(fn, 300)
```

### Review Dependencies Before Adding

```bash
# Check bundle size impact before installing
npx bundle-phobia [package-name]

# Example
npx bundle-phobia moment
# Shows: 288.4 kB (minified + gzipped: 71.7 kB)

# Consider alternatives
npx bundle-phobia date-fns
# Shows: 78.4 kB (minified + gzipped: 13.4 kB)
```

### Monitor Bundle Size

```bash
# Analyze bundle after build
npm run build
npx nuxi analyze

# Set warnings in nuxt.config.ts
vite: {
  build: {
    chunkSizeWarningLimit: 1000 // KB
  }
}
```

---

## Testing Performance

### Run Lighthouse Audits

```bash
# Quick audit during development
npx lighthouse http://localhost:3000 --view

# Full audit with report
./run-performance-audit.sh http://localhost:3000
```

### Use Performance Profiler

1. Open Chrome DevTools
2. Go to Performance tab
3. Click Record
4. Interact with your app
5. Stop recording
6. Analyze the flame graph

### Monitor Core Web Vitals

Key metrics to track:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Set Performance Budgets

In your CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
- name: Check Performance Budget
  run: |
    npm run build
    npx size-limit
```

---

## Performance Checklist

Before committing code, verify:

- [ ] Heavy components are lazy-loaded
- [ ] API calls use caching where appropriate
- [ ] Form inputs use debouncing
- [ ] Images use lazy loading and are optimized
- [ ] No unnecessary reactive state
- [ ] Computed properties used for derived values
- [ ] Bundle size impact reviewed
- [ ] Loading states implemented
- [ ] No console.log statements
- [ ] TypeScript types are correct

---

## Common Pitfalls

### ❌ Loading Everything Upfront

```typescript
// Bad
onMounted(async () => {
  await loadAllData()
  await loadAllComponents()
  await loadAllAssets()
})

// Good
onMounted(async () => {
  await loadCriticalData()
  // Load rest on demand
})
```

### ❌ Watching Everything

```typescript
// Bad
watch([data1, data2, data3, data4], () => {
  // Heavy operation
})

// Good
watch(() => data1.specificProperty, () => {
  // Only watch what you need
})
```

### ❌ Not Using Skeleton Loaders

```vue
<!-- Bad: Blank screen during load -->
<div v-if="data">
  {{ data }}
</div>

<!-- Good: Skeleton during load -->
<div v-if="loading">
  <UiSkeleton />
</div>
<div v-else>
  {{ data }}
</div>
```

### ❌ Ignoring Bundle Size

```bash
# Always check before adding dependencies
npm install huge-library

# Better: Check size first
npx bundle-phobia huge-library
```

---

## Resources

- [Nuxt Performance Docs](https://nuxt.com/docs/guide/going-further/performance)
- [Vue Performance Guide](https://vuejs.org/guide/best-practices/performance.html)
- [Web.dev Performance](https://web.dev/performance/)
- [Bundle Phobia](https://bundlephobia.com/)

---

**Remember**: Performance is a feature, not an afterthought. Build it in from the start!
