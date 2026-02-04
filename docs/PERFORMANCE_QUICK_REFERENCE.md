# Performance Quick Reference Card

**Quick access to performance optimization features**

---

## Lazy Loading Components

```vue
<!-- Use lazy components for heavy content -->
<LazyWebformRenderer :webform-id="formId" />
<LazyWorkflowExecutionTracker :execution-id="execId" />
<LazyAppointmentPicker :workflow-id="workflowId" />
```

---

## API Caching

```typescript
// Enable caching (default: 5 minutes)
const data = await fetchResource('endpoint', { cache: true })

// Disable caching
const data = await fetchResource('endpoint', { cache: false })

// Clear cache
clearCache() // All cache
clearCache('specific-key') // Specific cache
```

---

## Debounced Input

```vue
<script setup>
const search = ref('')
const debouncedSearch = useDebouncedInput(search, 300)

watch(debouncedSearch, async (query) => {
  await fetchResults(query)
})
</script>

<template>
  <input v-model="search" />
</template>
```

---

## Create Lazy Component

```vue
<template>
  <div ref="elementRef">
    <HeavyComponent v-if="isVisible" />
    <UiSkeleton v-else />
  </div>
</template>

<script setup>
const { isVisible, elementRef } = useLazyComponent({
  rootMargin: '100px',
  threshold: 0.1
})
</script>
```

---

## Optimize Images

```html
<!-- Basic lazy loading -->
<img src="image.jpg" loading="lazy" alt="..." width="640" height="480" />

<!-- Responsive images -->
<img
  src="image-640w.jpg"
  srcset="image-320w.jpg 320w, image-640w.jpg 640w, image-1024w.jpg 1024w"
  sizes="(max-width: 640px) 100vw, 50vw"
  loading="lazy"
  alt="..."
/>

<!-- WebP with fallback -->
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." />
</picture>
```

---

## Performance Scripts

```bash
npm run analyze      # Analyze bundle size
npm run lighthouse   # Quick Lighthouse audit
npm run performance  # Full performance audit
```

---

## Component Best Practices

```vue
<!-- Use computed for derived values -->
<script setup>
const fullName = computed(() => `${first} ${last}`)
</script>

<!-- Use v-show for frequently toggled content -->
<div v-show="isOpen">Content</div>

<!-- Prevent duplicate requests -->
<script setup>
const loading = ref(false)
const fetchData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    await fetch()
  } finally {
    loading.value = false
  }
}
</script>
```

---

## Import Best Practices

```typescript
// Good: Specific imports
import { ref, computed } from 'vue'
import debounce from 'lodash/debounce'

// Bad: Import everything
import * as Vue from 'vue'
import _ from 'lodash'
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Performance | 95+ |
| FCP | <1.8s |
| LCP | <2.5s |
| TBT | <200ms |
| CLS | <0.1 |

---

## Common Patterns

### Batch API Requests
```typescript
const [data1, data2, data3] = await Promise.all([
  fetchResource('endpoint1'),
  fetchResource('endpoint2'),
  fetchResource('endpoint3')
])
```

### Debounce Callback
```typescript
const debouncedFn = useDebouncedCallback((value) => {
  // Called 300ms after last invocation
}, 300)
```

### Throttle Callback
```typescript
const throttledFn = useThrottledCallback((value) => {
  // Called max once per 300ms
}, 300)
```

---

## Check Bundle Size

```bash
# Before adding dependency
npx bundle-phobia package-name

# Analyze current bundle
npm run analyze
```

---

## Resources

- 📄 [Full Report](../PERFORMANCE_OPTIMIZATION.md)
- 📚 [Best Practices](./performance-best-practices.md)
- 🖼️ [Image Guide](./image-optimization-guide.md)
- 🚀 [Quick Start](./PERFORMANCE_README.md)

---

**Print this for quick reference during development!**
