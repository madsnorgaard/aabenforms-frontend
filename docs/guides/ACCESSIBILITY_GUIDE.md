# ÅbenForms Accessibility Guide

**Target**: WCAG 2.1 Level AA Compliance
**Last Updated**: February 2, 2026

## Table of Contents

1. [Quick Start](#quick-start)
2. [WCAG 2.1 AA Checklist](#wcag-21-aa-checklist)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [Screen Reader Testing](#screen-reader-testing)
5. [Testing Tools](#testing-tools)
6. [Component Guidelines](#component-guidelines)
7. [Common Patterns](#common-patterns)

---

## Quick Start

### For Developers

**Before committing code**:

```bash
# 1. Install axe DevTools Chrome extension
# https://chrome.google.com/webstore/detail/axe-devtools

# 2. Run your component locally
npm run dev

# 3. Test keyboard navigation
# - Disconnect mouse
# - Tab through all elements
# - Verify focus indicators visible
# - Test all actions with Enter/Space

# 4. Run axe scan
# - Open Chrome DevTools (F12)
# - Click "axe DevTools" tab
# - Click "Scan ALL of my page"
# - Fix any violations

# 5. Quick screen reader test (optional but recommended)
# - Enable NVDA (Windows) or VoiceOver (Mac)
# - Tab through component
# - Listen to announcements
```

### For QA Testers

**Testing checklist**:

- [ ] Keyboard navigation works (all interactive elements reachable)
- [ ] Focus indicators visible (3px outline, high contrast)
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Forms have labels and error messages
- [ ] Dynamic content changes are announced
- [ ] Works at 200% zoom
- [ ] Touch targets minimum 44x44px

---

## WCAG 2.1 AA Checklist

Use this checklist when creating or reviewing components:

### Perceivable

- [ ] **1.1.1**: All images have alt text or aria-label (or marked decorative with aria-hidden)
- [ ] **1.3.1**: Semantic HTML used (headings, lists, labels)
- [ ] **1.3.2**: DOM order matches visual order
- [ ] **1.3.3**: Instructions don't rely solely on shape, size, or visual location
- [ ] **1.3.4**: Content works in portrait and landscape
- [ ] **1.3.5**: Input purpose identified (autocomplete attributes)
- [ ] **1.4.1**: Color is not the only way to convey information
- [ ] **1.4.3**: Text contrast minimum 4.5:1 (3:1 for large text)
- [ ] **1.4.4**: Text can resize to 200% without breaking
- [ ] **1.4.5**: No images of text (except logos)
- [ ] **1.4.10**: No horizontal scrolling at 320px width
- [ ] **1.4.11**: UI component contrast minimum 3:1
- [ ] **1.4.12**: Layout adapts to increased text spacing
- [ ] **1.4.13**: Hover/focus content is dismissible, hoverable, and persistent

### Operable

- [ ] **2.1.1**: All functionality available via keyboard
- [ ] **2.1.2**: No keyboard traps (focus can move away)
- [ ] **2.1.4**: No single-character key shortcuts (or they can be turned off)
- [ ] **2.2.1**: Time limits can be turned off, adjusted, or extended
- [ ] **2.2.2**: Moving/blinking content can be paused
- [ ] **2.3.1**: No content flashes more than 3 times per second
- [ ] **2.4.1**: Skip links available (bypass repeated content)
- [ ] **2.4.2**: Page has descriptive title
- [ ] **2.4.3**: Focus order is logical
- [ ] **2.4.4**: Link purpose clear from link text (or context)
- [ ] **2.4.5**: Multiple ways to find pages (menu, search, breadcrumbs)
- [ ] **2.4.6**: Headings and labels are descriptive
- [ ] **2.4.7**: Keyboard focus indicator visible
- [ ] **2.5.1**: All functionality works with single-point activation
- [ ] **2.5.2**: Actions fire on touchend/mouseup (not touchstart/mousedown)
- [ ] **2.5.3**: Accessible name contains visible text label
- [ ] **2.5.4**: No motion-based controls

### Understandable

- [ ] **3.1.1**: Page language identified (lang attribute)
- [ ] **3.1.2**: Language changes identified (lang attribute on part)
- [ ] **3.2.1**: Focus doesn't trigger unexpected context change
- [ ] **3.2.2**: Input doesn't trigger unexpected context change
- [ ] **3.2.3**: Navigation is consistent across pages
- [ ] **3.2.4**: Components are used consistently
- [ ] **3.3.1**: Errors are clearly identified
- [ ] **3.3.2**: Labels or instructions provided for inputs
- [ ] **3.3.3**: Error suggestions provided
- [ ] **3.3.4**: Submissions can be reviewed/confirmed (for legal/financial)

### Robust

- [ ] **4.1.1**: HTML is valid (no duplicate IDs, proper nesting)
- [ ] **4.1.2**: All components have name, role, value
- [ ] **4.1.3**: Status messages announced via aria-live

---

## Keyboard Shortcuts

### Global Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` | Activate button or link |
| `Space` | Activate button or toggle checkbox |
| `Esc` | Close modal or cancel action |
| `↑` `↓` | Navigate lists or options (context-dependent) |
| `←` `→` | Navigate horizontal options (context-dependent) |

### Component-Specific

#### Payment Method Selection (WorkflowPayment)

```
1. Tab to payment methods section
2. Use ↑↓←→ arrow keys to navigate options
3. Press Space or Enter to select
4. Tab to "Pay" button
5. Press Enter to proceed
```

#### Appointment Picker (AppointmentPicker)

```
1. Tab to start date input
2. Open native date picker (varies by browser/OS)
3. Select date and press Enter
4. Tab to time slots
5. Use Tab to navigate slots
6. Press Enter to select slot
7. Tab to "Confirm Booking" button
8. Press Enter to confirm
```

#### Modal (Modal.vue)

```
1. Modal opens, focus moves to first interactive element
2. Tab cycles through modal content only (focus trap)
3. Shift+Tab cycles backward
4. Press Esc to close modal
5. Or Tab to close button and press Enter
6. Focus returns to trigger element
```

#### Forms

```
1. Tab to first input
2. Type to enter text
3. Tab to next input
4. For select: ↑↓ to navigate options
5. Tab to submit button
6. Press Enter to submit
```

---

## Screen Reader Testing

### Recommended Screen Readers

| Platform | Screen Reader | Cost | Installation |
|----------|---------------|------|-------------|
| Windows | **NVDA** | Free | [Download](https://www.nvaccess.org/download/) |
| Windows | JAWS | Paid | [Purchase](https://www.freedomscientific.com/products/software/jaws/) |
| macOS | **VoiceOver** | Free (built-in) | Cmd+F5 to toggle |
| iOS | VoiceOver | Free (built-in) | Settings → Accessibility → VoiceOver |
| Android | TalkBack | Free (built-in) | Settings → Accessibility → TalkBack |
| Linux | Orca | Free | Pre-installed on most distributions |

**Recommended for testing**: NVDA (Windows) or VoiceOver (macOS)

### Quick Screen Reader Test

#### NVDA (Windows)

```bash
# 1. Download and install NVDA
# https://www.nvaccess.org/download/

# 2. Launch NVDA
# Desktop shortcut or Start menu

# 3. Basic commands
Insert + N         # Open NVDA menu
Insert + Q         # Quit NVDA
Insert + Down      # Read from cursor
Insert + B         # Read entire document
Tab                # Navigate to next element
Insert + Space     # Toggle browse/focus mode

# 4. Test your component
# - Tab through elements
# - Listen to announcements
# - Verify labels, roles, and states
```

#### VoiceOver (macOS)

```bash
# 1. Enable VoiceOver
Cmd + F5

# 2. Basic commands
Cmd + F5           # Toggle VoiceOver on/off
VO + A             # Read from top (VO = Ctrl+Option)
VO + Right Arrow   # Next item
VO + Left Arrow    # Previous item
VO + Space         # Activate button/link
Tab                # Navigate to next element

# 3. Test your component
# - Use VO + arrow keys to navigate
# - Listen to announcements
# - Verify all content is accessible
```

### What to Test

1. **Content is announced**
   - All text content is read
   - Images have alt text
   - Icons have labels

2. **Labels are associated**
   - Form inputs announce their labels
   - Buttons have clear purposes
   - Links have descriptive text

3. **Roles are correct**
   - Buttons announced as "button"
   - Links announced as "link"
   - Headings announced with level
   - Custom widgets have proper roles

4. **States are announced**
   - Checkboxes: "checked" or "not checked"
   - Radio buttons: "selected" or "not selected"
   - Buttons: "pressed" or "not pressed"
   - Inputs: "required" or "invalid"

5. **Dynamic changes announced**
   - Loading states
   - Error messages
   - Success messages
   - Content updates

### Expected Announcements

#### WorkflowPayment

```
[Tab to component]
"Payment form, region"
"Heading level 2: Parking Permit Payment"

[Tab to amount]
"Amount: 500.00 Danish Kroner"

[Tab to payment methods]
"Select payment method, heading level 3"
"Payment methods, radio group"

[Tab to first option]
"Nets Easy: Danish payment gateway, radio button, not checked, 1 of 4"

[Press Down Arrow]
"Credit Card: Visa, Mastercard, American Express, radio button, not checked, 2 of 4"

[Press Space]
"Credit Card selected"

[Tab to pay button]
"Proceed to pay 500.00 DKK, button"

[Press Enter]
[After processing]
"Payment successful, region"
"Heading level 3: Payment Successful"
"Your payment has been processed successfully"
```

#### AppointmentPicker

```
[Tab to component]
"Appointment booking, region"
"Heading level 2: Book an Appointment"

[Tab to date filter]
"Start date, edit text"
[Enter date]
"January 15, 2024"

[Tab to time slots]
"Available slots Monday, January 15, 2024, group"
"10:00 AM, 30 minutes, Meeting Room A, button, not pressed"

[Press Enter]
"Selected: Monday, January 15 at 10:00 AM"

[Tab to booking panel]
"Selected slot, region"
"Heading level 3: Selected Slot"

[Tab to confirm button]
"Confirm booking, button"
```

---

## Testing Tools

### 1. axe DevTools

**Best for**: Automated WCAG compliance scanning

**Installation**:
- Chrome: [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools)
- Firefox: [axe DevTools](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

**Usage**:
```
1. Open page in browser
2. Press F12 (open DevTools)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations
6. Fix issues
7. Re-scan to verify
```

**Expected Result**: 0 violations for WCAG 2.1 AA

### 2. WAVE

**Best for**: Visual overlay of accessibility issues

**Installation**:
- Chrome: [WAVE Extension](https://chrome.google.com/webstore/detail/wave-evaluation-tool)
- Firefox: [WAVE Extension](https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/)

**Usage**:
```
1. Open page in browser
2. Click WAVE extension icon
3. View colored icons overlaid on page:
   - Red = Errors (must fix)
   - Yellow = Alerts (review needed)
   - Green = Features (good!)
4. Click icons for details
5. Fix issues
```

### 3. Lighthouse

**Best for**: Overall accessibility score and performance

**Usage**:
```
1. Open page in Chrome
2. Press F12 (open DevTools)
3. Click "Lighthouse" tab
4. Check "Accessibility" category
5. Click "Analyze page load"
6. Review score and issues
```

**Expected Result**: Score 95+

### 4. WebAIM Contrast Checker

**Best for**: Verifying color contrast ratios

**URL**: https://webaim.org/resources/contrastchecker/

**Usage**:
```
1. Enter foreground color (text color)
2. Enter background color
3. View contrast ratio
4. Verify:
   - Normal text: 4.5:1 minimum (AA)
   - Large text: 3:1 minimum (AA)
   - UI components: 3:1 minimum (AA)
```

### 5. Browser DevTools

**Best for**: Inspecting accessibility tree

**Chrome DevTools**:
```
1. Open DevTools (F12)
2. Select "Elements" tab
3. Click element
4. In right panel, click "Accessibility" tab
5. View:
   - Computed accessibility name
   - Computed role
   - Computed properties
   - Accessibility tree
```

---

## Component Guidelines

### Creating Accessible Components

#### 1. Start with Semantic HTML

**Good**:
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <label for="email">Email</label>
    <input id="email" type="email" v-model="email" required />
    <button type="submit">Submit</button>
  </form>
</template>
```

**Bad**:
```vue
<template>
  <div @click="handleSubmit">
    <div>Email</div>
    <div contenteditable v-model="email" />
    <div @click="handleSubmit">Submit</div>
  </div>
</template>
```

#### 2. Add ARIA When Needed

**When to use ARIA**:
- Semantic HTML doesn't exist for your use case
- You need to enhance native HTML
- You're building a custom widget

**ARIA first rule**: Don't use ARIA if you can use semantic HTML

**Good**:
```vue
<!-- Loading state -->
<div role="status" aria-live="polite">
  Loading appointments...
</div>

<!-- Error message -->
<div role="alert" aria-live="assertive">
  Payment failed. Please try again.
</div>

<!-- Custom radio group -->
<div role="radiogroup" aria-labelledby="payment-methods-label">
  <h3 id="payment-methods-label">Payment Methods</h3>
  <button role="radio" aria-checked="true">Credit Card</button>
  <button role="radio" aria-checked="false">Bank Transfer</button>
</div>
```

#### 3. Implement Keyboard Navigation

**All interactive elements must be keyboard accessible**:

```vue
<template>
  <div class="tabs">
    <div role="tablist" aria-label="Settings tabs">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === index ? 'true' : 'false'"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeTab === index ? 0 : -1"
        @click="selectTab(index)"
        @keydown="handleKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      v-for="(tab, index) in tabs"
      :key="tab.id"
      role="tabpanel"
      :id="`panel-${tab.id}`"
      :hidden="activeTab !== index"
      tabindex="0"
    >
      {{ tab.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
function handleKeydown(event: KeyboardEvent, index: number) {
  let newIndex = index

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      newIndex = (index + 1) % tabs.length
      break
    case 'ArrowLeft':
      event.preventDefault()
      newIndex = index === 0 ? tabs.length - 1 : index - 1
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = tabs.length - 1
      break
    default:
      return
  }

  selectTab(newIndex)
  // Focus the new tab
  document.querySelector(`[role="tab"]:nth-child(${newIndex + 1})`)?.focus()
}
</script>
```

#### 4. Style Focus Indicators

**Always provide visible focus indicators**:

```css
/* Good focus indicator */
button:focus {
  outline: 3px solid #007acc;
  outline-offset: 2px;
}

/* Also good - custom focus ring */
.custom-button:focus {
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.5);
  outline: none; /* Only if you provide alternative */
}

/* Bad - removing focus indicator */
button:focus {
  outline: none; /* Never do this without alternative */
}
```

#### 5. Announce Dynamic Changes

**Use aria-live regions for dynamic content**:

```vue
<template>
  <div>
    <button @click="loadMore">Load More</button>

    <!-- Announce loading state -->
    <div
      v-if="loading"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      Loading more results...
    </div>

    <!-- Announce results -->
    <div
      v-if="!loading && newResults > 0"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ newResults }} new results loaded.
    </div>

    <ul>
      <li v-for="item in results" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>
```

**aria-live values**:
- `polite`: Announce when screen reader is idle (for non-critical updates)
- `assertive`: Announce immediately (for errors, urgent messages)

---

## Common Patterns

### Pattern 1: Form with Validation

```vue
<template>
  <form @submit.prevent="handleSubmit" novalidate>
    <!-- Error summary (WCAG 3.3.1) -->
    <div
      v-if="errors.length > 0"
      role="alert"
      aria-live="assertive"
      id="form-errors"
      class="error-summary"
    >
      <h2>Please fix the following errors:</h2>
      <ul>
        <li v-for="error in errors" :key="error.field">
          <a :href="`#${error.field}`">{{ error.message }}</a>
        </li>
      </ul>
    </div>

    <!-- Form field -->
    <div class="form-field">
      <label for="email">
        Email
        <span class="required" aria-label="required">*</span>
      </label>
      <input
        id="email"
        type="email"
        v-model="email"
        required
        :aria-invalid="emailError ? 'true' : 'false'"
        :aria-describedby="emailError ? 'email-error email-help' : 'email-help'"
      />
      <p id="email-help" class="help-text">
        We'll never share your email.
      </p>
      <p
        v-if="emailError"
        id="email-error"
        class="error-message"
        role="alert"
      >
        {{ emailError }}
      </p>
    </div>

    <button type="submit">Submit</button>
  </form>
</template>

<script setup lang="ts">
const email = ref('')
const emailError = ref('')
const errors = ref<Array<{field: string, message: string}>>([])

function handleSubmit() {
  errors.value = []

  // Validate
  if (!email.value) {
    emailError.value = 'Email is required'
    errors.value.push({
      field: 'email',
      message: 'Email is required'
    })
  } else if (!isValidEmail(email.value)) {
    emailError.value = 'Please enter a valid email address'
    errors.value.push({
      field: 'email',
      message: 'Please enter a valid email address'
    })
  }

  // Focus first error
  if (errors.value.length > 0) {
    nextTick(() => {
      document.getElementById(errors.value[0].field)?.focus()
    })
    return
  }

  // Submit form
  submitForm()
}
</script>
```

### Pattern 2: Loading State

```vue
<template>
  <div>
    <button
      @click="loadData"
      :disabled="loading"
      :aria-busy="loading ? 'true' : 'false'"
    >
      {{ loading ? 'Loading...' : 'Load Data' }}
    </button>

    <!-- Loading announcement -->
    <div
      v-if="loading"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      Loading data, please wait...
    </div>

    <!-- Results -->
    <div v-if="!loading && data">
      <p>{{ data.length }} results found.</p>
      <ul>
        <li v-for="item in data" :key="item.id">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

### Pattern 3: Modal Dialog

```vue
<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        @click="handleBackdropClick"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div
          class="modal-container"
          @click.stop
          ref="modalRef"
        >
          <div class="modal-header">
            <h2 :id="titleId" class="modal-title">
              {{ title }}
            </h2>
            <button
              @click="close"
              class="modal-close"
              type="button"
              aria-label="Close modal"
            >
              <svg aria-hidden="true"><!-- Close icon --></svg>
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div class="modal-footer">
            <button @click="close" type="button">Cancel</button>
            <button @click="confirm" type="button">Confirm</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'

const props = defineProps<{
  isOpen: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`
const modalRef = ref<HTMLElement | null>(null)

// Focus trap
const { activate, deactivate } = useFocusTrap(modalRef, {
  immediate: true,
  allowOutsideClick: true,
  escapeDeactivates: true
})

// Handle ESC key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Prevent body scroll
watch(() => props.isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    activate()
  } else {
    document.body.style.overflow = ''
    deactivate()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
  deactivate()
})

function close() {
  emit('close')
}

function confirm() {
  emit('confirm')
}

function handleBackdropClick() {
  close()
}
</script>
```

### Pattern 4: Accordion

```vue
<template>
  <div class="accordion">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="accordion-item"
    >
      <h3>
        <button
          :id="`accordion-button-${item.id}`"
          type="button"
          :aria-expanded="expanded[index] ? 'true' : 'false'"
          :aria-controls="`accordion-panel-${item.id}`"
          @click="toggle(index)"
        >
          {{ item.title }}
          <svg :aria-hidden="true" :class="{ rotated: expanded[index] }">
            <!-- Chevron icon -->
          </svg>
        </button>
      </h3>

      <div
        :id="`accordion-panel-${item.id}`"
        role="region"
        :aria-labelledby="`accordion-button-${item.id}`"
        :hidden="!expanded[index]"
        class="accordion-panel"
      >
        {{ item.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: Array<{
    id: string
    title: string
    content: string
  }>
}>()

const expanded = ref<boolean[]>(props.items.map(() => false))

function toggle(index: number) {
  expanded.value[index] = !expanded.value[index]
}
</script>
```

---

## Additional Resources

### Documentation

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Vue A11y Project](https://vue-a11y.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Extension](https://wave.webaim.org/extension/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Training

- [WebAIM Training](https://webaim.org/training/)
- [Deque University](https://dequeuniversity.com/)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals/accessibility)

---

**Last Updated**: February 2, 2026
**Version**: 1.0.0
**Maintained By**: Development Team
