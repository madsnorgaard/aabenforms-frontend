# WorkflowExecutionTracker Component

A Vue 3 component for tracking and displaying real-time workflow execution progress in the ÅbenForms platform.

## Overview

The `WorkflowExecutionTracker.vue` component provides a visually clear and reassuring way for citizens to monitor the progress of their applications through municipal workflows. It displays:

- Current workflow progress as a step indicator
- Completed steps (green checkmark)
- Current step (blue/active with pulse animation)
- Pending steps (gray)
- Failed steps (red X icon)
- Step names, descriptions, and timestamps
- Auto-refresh capability while workflow is running
- Final success/failure state
- Support for both linear and branching workflows

## Files

- **`WorkflowExecutionTracker.vue`** - Main component
- **`WorkflowExecutionTracker.demo.md`** - Comprehensive documentation
- **`WorkflowExecutionTracker.example.vue`** - Interactive demo page
- **`/types/workflow.ts`** - TypeScript type definitions
- **`/pages/workflow-status/[id].vue`** - Example usage page

## Quick Start

### 1. Basic Usage

```vue
<template>
  <WorkflowExecutionTracker
    execution-id="abc-123-def-456"
  />
</template>
```

### 2. With Auto-Refresh

```vue
<template>
  <WorkflowExecutionTracker
    execution-id="abc-123-def-456"
    :auto-refresh="true"
    :refresh-interval="2000"
  />
</template>
```

### 3. Track by Workflow ID

```vue
<template>
  <WorkflowExecutionTracker
    workflow-id="parking_permit"
  />
</template>
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `executionId` | String | `undefined` | No* | Unique execution ID to track |
| `workflowId` | String | `undefined` | No* | Alternative: track by workflow ID |
| `autoRefresh` | Boolean | `true` | No | Enable auto-refresh while running |
| `refreshInterval` | Number | `2000` | No | Refresh interval in milliseconds |

*Either `executionId` or `workflowId` must be provided.

## Features

### Visual Step Indicators

Each step displays a visual indicator based on its status:

- **Pending** (gray circle with number) - Step has not started
- **Active** (blue circle with pulse animation) - Step is currently processing
- **Completed** (green circle with checkmark) - Step finished successfully
- **Failed** (red circle with X) - Step encountered an error

### Progress Bar

A dynamic progress bar shows the percentage of completed steps:

- Blue gradient for running workflows
- Green gradient when complete
- Red gradient if any step failed

### Timestamps

Each step displays:
- Start time (relative format: "5 minutes ago")
- Completion time
- Duration (calculated automatically)

### Branching Workflows

Supports parallel workflow branches:

```json
{
  "name": "Parallel Review",
  "isBranching": true,
  "branches": [
    { "name": "Technical Review", "status": "active" },
    { "name": "Environmental Review", "status": "completed" },
    { "name": "Fire Safety Review", "status": "pending" }
  ]
}
```

### Auto-Refresh

The component automatically polls the API every 2 seconds (configurable) while the workflow is running. Auto-refresh stops when:
- Workflow completes successfully
- Workflow fails
- Component is unmounted

## API Integration

### Expected Endpoint

`GET /api/workflow/execution/{executionId}/status`

or

`GET /api/workflow/execution/status?workflow_id={workflowId}`

### Response Format

```json
{
  "data": {
    "id": "exec-uuid-123",
    "type": "workflow_execution",
    "attributes": {
      "execution_id": "exec-uuid-123",
      "workflow_id": "parking_permit",
      "workflow_name": "Parking Permit Application",
      "status": "running",
      "submitted_at": "2026-02-02T10:00:00Z",
      "completed_at": null,
      "steps": [
        {
          "id": "step-1",
          "name": "Submit Application",
          "description": "Citizen submits parking permit application",
          "status": "completed",
          "started_at": "2026-02-02T10:00:00Z",
          "completed_at": "2026-02-02T10:00:05Z"
        },
        {
          "id": "step-2",
          "name": "Process Payment",
          "description": "Payment processing via payment gateway",
          "status": "active",
          "started_at": "2026-02-02T10:00:05Z",
          "completed_at": null
        }
      ]
    }
  }
}
```

## Demo Workflows

The component supports the three main ÅbenForms demo workflows:

### 1. Parking Permit (11 steps)

Linear workflow with payment, PDF generation, and notifications:

1. Submit Application
2. Validate Address
3. Check Eligibility
4. Process Payment
5. Payment Confirmation
6. Generate Permit PDF
7. Send SMS Notification
8. Email Permit
9. Register in Database
10. Create Audit Log
11. Close Application

### 2. Marriage Booking (19 steps)

Complex workflow with appointment booking and reminders:

1. Submit Booking Request
2. Validate Couple CPRs
3. Check Marriage Eligibility
4. Fetch Available Slots
5. Present Calendar
6. Couple Selects Date/Time
7. Book Appointment
8. Send Confirmation Email
9. Generate Document Checklist
10. Send Reminder (7 days)
11. Send Reminder (1 day)
12. Check-in at Ceremony
13. Verify Documents
14. Conduct Ceremony
15. Sign Marriage Certificate
16. Register Marriage (CPR)
17. Issue Certificate
18. Send Digital Post
19. Close Booking

### 3. Building Permit (Enhanced - with branching)

Workflow with parallel review branches:

1. Submit Application
2. Validate Zoning
3. **Parallel Review** (branching)
   - Technical Review
   - Environmental Review
   - Fire Safety Review
4. Notify Neighbors
5. Public Comment Period
6. Case Worker Review
7. Approval Decision
8. Issue Permit
9. Archive to SBSYS

## TypeScript Types

Located in `/types/workflow.ts`:

```typescript
interface WorkflowStep {
  id: string
  name: string
  description?: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  startedAt?: string
  completedAt?: string
  duration?: number
  error?: string
  isBranching?: boolean
  branches?: Array<{
    id: string
    name: string
    status: string
  }>
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  submittedAt: string
  completedAt?: string
  steps: WorkflowStep[]
  name?: string
  submissionId?: string
}
```

## Styling

The component uses scoped CSS with a modern, accessible design:

- Responsive layout (mobile-friendly)
- Smooth animations and transitions
- Color-coded status indicators
- Progress bar with gradient fills
- Clean typography

### Color Palette

- **Primary Blue**: `#007acc` - Active states
- **Success Green**: `#28a745` - Completed states
- **Error Red**: `#dc3545` - Failed states
- **Gray**: `#ddd` - Pending states

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Keyboard navigation support
- Screen reader friendly

## Example Implementation

See `/pages/workflow-status/[id].vue` for a complete page implementation:

```vue
<template>
  <div class="workflow-status-page">
    <div class="container">
      <WorkflowExecutionTracker
        :execution-id="executionId"
        :auto-refresh="true"
        :refresh-interval="2000"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const executionId = computed(() => route.params.id as string)
</script>
```

## Testing

### Interactive Demo

Run the example component to test all features:

```bash
# Start dev server
ddev exec pnpm run dev

# Navigate to the demo
# http://localhost:3000/components/WorkflowExecutionTracker.example
```

### Mock API Data

For testing, mock the API response in `composables/useApi.ts` or use a mock service worker.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Android Chrome 90+)

## Performance

- Efficient DOM updates with Vue 3 reactivity
- Auto-cleanup of timers on unmount
- Minimal re-renders with computed properties
- Lightweight SVG icons

## Future Enhancements

- [ ] WebSocket support for real-time updates (no polling)
- [ ] Step details expansion/collapse
- [ ] Export workflow history as PDF
- [ ] Email notifications on step completion
- [ ] Timeline view alternative layout
- [ ] Dark mode support
- [ ] Full i18n translations (Danish/English)

## Related Components

- **WorkflowDashboard.vue** - Task management dashboard for case workers
- **TaskCard.vue** - Individual task display
- **WorkflowPayment.vue** - Payment processing component

## Support

For issues or questions:
- GitHub Issues: https://github.com/madsnorgaard/aabenforms-frontend/issues
- Documentation: See `WorkflowExecutionTracker.demo.md`

## License

GPL-2.0 - Part of the ÅbenForms platform
