# ÅbenForms UI Component Usage Guide

Complete guide for using the polished UI components in ÅbenForms frontend.

---

## Table of Contents

1. [Skeleton Loader](#skeleton-loader)
2. [Spinner](#spinner)
3. [Tooltip](#tooltip)
4. [Modal](#modal)
5. [Alert](#alert)
6. [Button](#button)
7. [Best Practices](#best-practices)
8. [Accessibility Guidelines](#accessibility-guidelines)

---

## Skeleton Loader

**Location:** `/components/ui/Skeleton.vue`

### Description
Animated skeleton loader for indicating loading states before content appears. Provides visual feedback during data fetching.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'rounded'` | `'text'` | Shape of skeleton |
| `width` | `string` | `undefined` | Custom width (e.g., '200px', '100%') |
| `height` | `string` | `undefined` | Custom height (e.g., '40px', '2rem') |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Preset size (ignored if width/height set) |

### Usage Examples

```vue
<template>
  <!-- Text skeleton (default) -->
  <UiSkeleton />

  <!-- Circular avatar skeleton -->
  <UiSkeleton variant="circular" width="64px" height="64px" />

  <!-- Card skeleton -->
  <div class="card">
    <UiSkeleton variant="rounded" height="200px" />
    <UiSkeleton size="lg" />
    <UiSkeleton size="sm" />
  </div>

  <!-- List of skeletons -->
  <div v-for="i in 5" :key="i">
    <UiSkeleton size="md" />
  </div>
</template>
```

### Component Integration

```vue
<template>
  <div v-if="loading" class="skeleton-container">
    <UiSkeleton variant="circular" width="48px" height="48px" />
    <UiSkeleton width="200px" />
    <UiSkeleton width="100%" size="lg" />
  </div>
  <div v-else>
    <!-- Actual content -->
  </div>
</template>
```

---

## Spinner

**Location:** `/components/ui/Spinner.vue`

### Description
Animated loading spinner with multiple sizes and colors. Includes ARIA labels for accessibility.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of spinner |
| `color` | `'primary' \| 'secondary' \| 'white' \| 'neutral'` | `'primary'` | Color theme |
| `center` | `boolean` | `false` | Center spinner in container |
| `message` | `string` | `undefined` | Optional loading message |
| `label` | `string` | `'Loading...'` | ARIA label for screen readers |

### Usage Examples

```vue
<template>
  <!-- Basic spinner -->
  <UiSpinner />

  <!-- Centered with message -->
  <UiSpinner
    size="lg"
    center
    message="Loading workflow data..."
  />

  <!-- Button with spinner -->
  <button :disabled="loading">
    <UiSpinner v-if="loading" size="sm" color="white" />
    <span v-else>Submit</span>
  </button>

  <!-- Page loading -->
  <UiSpinner
    v-if="pageLoading"
    size="xl"
    center
    message="Preparing your dashboard..."
    label="Loading dashboard"
  />
</template>
```

### Component Integration

```vue
<script setup lang="ts">
const loading = ref(true)

onMounted(async () => {
  await fetchData()
  loading.value = false
})
</script>

<template>
  <UiSpinner v-if="loading" center message="Loading data..." />
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

---

## Tooltip

**Location:** `/components/ui/Tooltip.vue`

### Description
Accessible tooltip that appears on hover/focus. Includes arrow pointer and configurable position.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | *required* | Tooltip text content |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Tooltip position |
| `delay` | `number` | `200` | Delay before showing (ms) |

### Usage Examples

```vue
<template>
  <!-- Basic tooltip -->
  <UiTooltip content="Click to submit the form">
    <button>Submit</button>
  </UiTooltip>

  <!-- Positioned tooltip -->
  <UiTooltip content="Your CPR number (DDMMYY-XXXX)" position="right">
    <input type="text" placeholder="CPR number" />
  </UiTooltip>

  <!-- Help icon with tooltip -->
  <div class="field-label">
    Payment Method
    <UiTooltip content="Select your preferred payment method">
      <button class="help-icon" aria-label="Help">
        <svg><!-- question mark icon --></svg>
      </button>
    </UiTooltip>
  </div>

  <!-- Instant tooltip (no delay) -->
  <UiTooltip content="Delete this item" position="left" :delay="0">
    <button class="danger">Delete</button>
  </UiTooltip>
</template>
```

### Accessibility Notes
- Tooltip has `role="tooltip"` and `aria-label`
- Works with keyboard focus (not just hover)
- Automatically cleans up timers on unmount
- Content is announced to screen readers

---

## Modal

**Location:** `/components/ui/Modal.vue`

### Description
Accessible modal dialog with focus trap, keyboard support, and customizable footer.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | *required* | v-model for open/close state |
| `title` | `string` | `undefined` | Modal title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Modal size |
| `closeOnBackdrop` | `boolean` | `true` | Close when clicking backdrop |
| `showFooter` | `boolean` | `true` | Show default footer |
| `showCancel` | `boolean` | `true` | Show cancel button |
| `showConfirm` | `boolean` | `true` | Show confirm button |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `confirmText` | `string` | `'Confirm'` | Confirm button text |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `boolean` | Emitted when modal opens/closes |
| `confirm` | - | Emitted when confirm button clicked |
| `cancel` | - | Emitted when cancel button clicked |
| `close` | - | Emitted when modal closes |

### Usage Examples

```vue
<script setup lang="ts">
const isHelpOpen = ref(false)
const isDeleteOpen = ref(false)

function handleDelete() {
  // Delete logic
  isDeleteOpen.value = false
}
</script>

<template>
  <!-- Basic modal -->
  <button @click="isHelpOpen = true">Show Help</button>

  <UiModal
    v-model="isHelpOpen"
    title="Help: CPR Number"
    size="md"
    :show-footer="false"
  >
    <p>Your CPR number is your Danish personal identification number...</p>
  </UiModal>

  <!-- Confirmation modal -->
  <UiModal
    v-model="isDeleteOpen"
    title="Confirm Deletion"
    size="sm"
    @confirm="handleDelete"
    @cancel="isDeleteOpen = false"
    cancel-text="No, keep it"
    confirm-text="Yes, delete"
  >
    <p>Are you sure you want to delete this item?</p>
  </UiModal>

  <!-- Custom footer -->
  <UiModal v-model="isOpen" title="Custom Actions">
    <p>Modal content...</p>

    <template #footer>
      <button @click="handleAction1">Action 1</button>
      <button @click="handleAction2">Action 2</button>
      <button @click="isOpen = false">Close</button>
    </template>
  </UiModal>

  <!-- Large modal with custom title -->
  <UiModal v-model="isOpen" size="lg">
    <template #title>
      <div class="custom-title">
        <svg><!-- icon --></svg>
        <h2>Workflow Builder Help</h2>
      </div>
    </template>

    <div class="help-content">
      <!-- Extensive help content -->
    </div>
  </UiModal>
</template>
```

### Accessibility Features
- Focus trap (focus stays within modal)
- ESC key closes modal
- ARIA modal, dialog, and labelledby attributes
- Prevents body scroll when open
- Returns focus to trigger element on close
- Keyboard navigation support

---

## Alert

**Location:** `/components/ui/Alert.vue`

### Description
Accessible alert component for success, error, warning, and info messages with optional actions.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Alert type |
| `title` | `string` | `undefined` | Alert title |
| `message` | `string` | `undefined` | Alert message (or use slot) |
| `dismissible` | `boolean` | `false` | Show close button |
| `actions` | `Action[]` | `[]` | Array of action buttons |

### Action Interface

```typescript
interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `dismiss` | - | Emitted when close button clicked |

### Usage Examples

```vue
<script setup lang="ts">
const showError = ref(true)
const showSuccess = ref(false)

function retryPayment() {
  // Retry logic
}

function contactSupport() {
  // Open support modal
}
</script>

<template>
  <!-- Success alert -->
  <UiAlert
    variant="success"
    title="Payment Successful!"
    message="Your payment has been processed successfully."
    dismissible
    @dismiss="showSuccess = false"
  />

  <!-- Error alert with actions -->
  <UiAlert
    v-if="showError"
    variant="error"
    title="Payment Failed"
    message="There was an error processing your payment."
    :actions="[
      { label: 'Retry', onClick: retryPayment, variant: 'primary' },
      { label: 'Contact Support', onClick: contactSupport, variant: 'secondary' }
    ]"
  />

  <!-- Warning alert -->
  <UiAlert
    variant="warning"
    title="Session Expiring Soon"
    message="Your session will expire in 5 minutes. Please save your work."
  />

  <!-- Info alert with slot -->
  <UiAlert variant="info" title="New Feature Available">
    <p>We've added a new workflow builder! Check it out in the admin panel.</p>
    <a href="/admin/workflows" class="text-blue-600 underline">Learn more</a>
  </UiAlert>

  <!-- Custom actions slot -->
  <UiAlert variant="error" title="Validation Errors">
    <ul class="list-disc pl-5">
      <li v-for="error in errors" :key="error">{{ error }}</li>
    </ul>

    <template #actions>
      <button @click="fixErrors" class="custom-button">
        Fix Automatically
      </button>
    </template>
  </UiAlert>
</template>
```

### Accessibility Features
- ARIA live regions (`assertive` for errors, `polite` for others)
- `role="alert"` attribute
- Proper heading hierarchy
- Keyboard accessible dismiss button
- Screen reader friendly icon labels

---

## Button

**Location:** `/components/ui/Button.vue`

### Description
Styled button component with multiple variants, sizes, and accessibility features.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Button style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `disabled` | `boolean` | `false` | Disabled state |
| `fullWidth` | `boolean` | `false` | Full width button |

### Usage Examples

```vue
<template>
  <!-- Primary button -->
  <UiButton variant="primary" @click="submit">
    Submit Application
  </UiButton>

  <!-- Secondary button -->
  <UiButton variant="secondary" size="sm" @click="cancel">
    Cancel
  </UiButton>

  <!-- Outline button -->
  <UiButton variant="outline" @click="preview">
    Preview
  </UiButton>

  <!-- Ghost button -->
  <UiButton variant="ghost" size="sm" @click="showHelp">
    <svg><!-- help icon --></svg>
    Help
  </UiButton>

  <!-- Loading button -->
  <UiButton :disabled="loading" fullWidth>
    <UiSpinner v-if="loading" size="sm" color="white" />
    <span v-else>Save Changes</span>
  </UiButton>

  <!-- Submit button in form -->
  <form @submit.prevent="handleSubmit">
    <input v-model="email" type="email" />
    <UiButton type="submit" variant="primary">
      Subscribe
    </UiButton>
  </form>
</template>
```

### Accessibility Features
- Meets minimum 44x44px touch target size
- Focus ring with offset for keyboard users
- Disabled state with proper cursor
- Semantic button types (button, submit, reset)
- 0.2s transition for smooth interactions

---

## Best Practices

### Loading States

1. **Use Skeleton Loaders for Initial Load**
   ```vue
   <template>
     <div v-if="loading">
       <UiSkeleton v-for="i in 5" :key="i" size="lg" />
     </div>
     <div v-else>
       <!-- Actual content -->
     </div>
   </template>
   ```

2. **Use Spinners for Actions**
   ```vue
   <template>
     <UiButton :disabled="submitting">
       <UiSpinner v-if="submitting" size="sm" color="white" />
       <span v-else>Submit</span>
     </UiButton>
   </template>
   ```

3. **Combine for Complex UIs**
   ```vue
   <template>
     <UiSpinner v-if="initialLoad" center message="Loading dashboard..." />
     <div v-else>
       <h1>Dashboard</h1>
       <div v-if="loadingData" class="card">
         <UiSkeleton variant="rounded" height="200px" />
       </div>
       <div v-else>
         <!-- Card content -->
       </div>
     </div>
   </template>
   ```

### Error Handling

1. **Always Provide Retry Options**
   ```vue
   <UiAlert
     variant="error"
     title="Failed to Load"
     message="Could not fetch data. Please try again."
     :actions="[
       { label: 'Retry', onClick: fetchData },
       { label: 'Contact Support', onClick: openSupport }
     ]"
   />
   ```

2. **Use Appropriate Alert Variants**
   - `error`: Critical errors requiring immediate attention
   - `warning`: Important notices that don't block actions
   - `info`: General information or tips
   - `success`: Positive confirmations of completed actions

3. **Provide Context in Error Messages**
   ```vue
   <!-- Bad -->
   <UiAlert variant="error" message="Error" />

   <!-- Good -->
   <UiAlert
     variant="error"
     title="Payment Failed"
     message="Your credit card was declined. Please check your card details or try a different payment method."
     :actions="[
       { label: 'Try Again', onClick: retryPayment },
       { label: 'Change Payment Method', onClick: changeMethod }
     ]"
   />
   ```

### Help & Tooltips

1. **Use Tooltips for Brief Help**
   ```vue
   <div class="field">
     <label>
       CPR Number
       <UiTooltip content="Format: DDMMYY-XXXX" position="right">
         <button class="help-icon" aria-label="Help">?</button>
       </UiTooltip>
     </label>
     <input type="text" />
   </div>
   ```

2. **Use Modals for Detailed Help**
   ```vue
   <button @click="showCPRHelp = true">
     What is CPR?
   </button>

   <UiModal
     v-model="showCPRHelp"
     title="CPR Number Help"
     size="md"
     :show-footer="false"
   >
     <p>{{ $t('help.cpr.text') }}</p>
     <img src="/images/cpr-example.png" alt="CPR format example" />
   </UiModal>
   ```

### Mobile Responsiveness

1. **Ensure Touch Targets**
   - All buttons min 44x44px (already enforced in components)
   - Add appropriate padding to interactive elements
   - Use `fullWidth` prop on mobile for better UX

2. **Test Modals on Mobile**
   ```vue
   <!-- Modal automatically adjusts for mobile -->
   <UiModal v-model="isOpen" title="Mobile Friendly">
     <p>This modal adapts to mobile screens automatically.</p>
   </UiModal>
   ```

3. **Stack Components Vertically on Mobile**
   ```vue
   <div class="flex flex-col md:flex-row gap-4">
     <UiButton>Action 1</UiButton>
     <UiButton>Action 2</UiButton>
   </div>
   ```

---

## Accessibility Guidelines

### Keyboard Navigation

1. **All interactive elements must be keyboard accessible**
   - Buttons: Space/Enter to activate
   - Modals: Tab to cycle, ESC to close
   - Forms: Tab through fields, Enter to submit

2. **Provide visible focus indicators**
   ```vue
   <!-- All components have built-in focus styles -->
   <UiButton>Accessible Button</UiButton>
   <!-- Shows focus ring when tabbed to -->
   ```

3. **Use proper tab order**
   ```vue
   <form>
     <input tabindex="1" />
     <input tabindex="2" />
     <UiButton tabindex="3">Submit</UiButton>
   </form>
   ```

### Screen Readers

1. **Use semantic HTML**
   ```vue
   <!-- Good -->
   <UiButton>Submit</UiButton>

   <!-- Bad -->
   <div @click="submit">Submit</div>
   ```

2. **Provide ARIA labels**
   ```vue
   <UiTooltip content="Help information">
     <button aria-label="Show help information">
       <svg aria-hidden="true"><!-- icon --></svg>
     </button>
   </UiTooltip>
   ```

3. **Use ARIA live regions for dynamic content**
   ```vue
   <!-- Alert component has built-in ARIA live regions -->
   <UiAlert variant="success" message="Form submitted successfully!" />
   <!-- Announced to screen readers -->
   ```

### Color Contrast

1. **All text meets WCAG AA (4.5:1 ratio)**
   - Component styles are pre-configured
   - Use Tailwind colors from config

2. **Don't rely solely on color**
   ```vue
   <!-- Bad -->
   <span class="text-red-500">Error</span>

   <!-- Good -->
   <UiAlert variant="error" title="Error" message="..." />
   <!-- Includes icon and semantic styling -->
   ```

### Testing Checklist

- [ ] All buttons accessible via keyboard
- [ ] Focus indicators visible
- [ ] Modals trap focus properly
- [ ] Screen reader announces dynamic changes
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets minimum 44x44px
- [ ] Forms have proper labels
- [ ] Error messages are descriptive

---

## Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Vue Accessibility Guide](https://vuejs.org/guide/best-practices/accessibility.html)
- [Nuxt Accessibility](https://nuxt.com/docs/guide/going-further/accessibility)
- [Danish Design System](https://designsystem.dk/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-02
**Maintained By:** ÅbenForms Team
