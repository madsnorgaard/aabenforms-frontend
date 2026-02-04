# WorkflowExecutionTracker Component

A real-time workflow progress tracker component that displays the current status of a workflow execution with visual step indicators.

## Features

- Real-time progress tracking with auto-refresh
- Visual step indicators (pending, active, completed, failed)
- Support for linear and branching workflows
- Timestamp and duration display
- Final success/failure state
- Responsive design
- Auto-refresh capability (every 2 seconds by default)

## Usage

### Basic Usage

```vue
<template>
  <WorkflowExecutionTracker
    execution-id="abc-123-def-456"
    :auto-refresh="true"
    :refresh-interval="2000"
  />
</template>
```

### With Workflow ID

```vue
<template>
  <WorkflowExecutionTracker
    workflow-id="parking_permit"
    :auto-refresh="true"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `executionId` | `string` | `undefined` | The workflow execution ID to track |
| `workflowId` | `string` | `undefined` | Alternative: track by workflow ID |
| `autoRefresh` | `boolean` | `true` | Enable auto-refresh while workflow is running |
| `refreshInterval` | `number` | `2000` | Refresh interval in milliseconds |

## API Response Format

The component expects the backend API endpoint `/api/workflow/execution/{id}/status` to return:

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
        },
        {
          "id": "step-3",
          "name": "Generate Permit",
          "description": "Generate PDF parking permit",
          "status": "pending",
          "started_at": null,
          "completed_at": null
        }
      ]
    }
  }
}
```

## Demo Workflow Examples

### 1. Parking Permit (11 steps)

```json
{
  "workflow_id": "parking_permit",
  "workflow_name": "Parking Permit Application",
  "steps": [
    { "name": "Submit Application", "status": "completed" },
    { "name": "Validate Address", "status": "completed" },
    { "name": "Check Eligibility", "status": "completed" },
    { "name": "Process Payment", "status": "active" },
    { "name": "Payment Confirmation", "status": "pending" },
    { "name": "Generate Permit PDF", "status": "pending" },
    { "name": "Send SMS Notification", "status": "pending" },
    { "name": "Email Permit", "status": "pending" },
    { "name": "Register in Database", "status": "pending" },
    { "name": "Create Audit Log", "status": "pending" },
    { "name": "Close Application", "status": "pending" }
  ]
}
```

### 2. Marriage Booking (19 steps)

```json
{
  "workflow_id": "marriage_booking",
  "workflow_name": "Marriage Booking",
  "steps": [
    { "name": "Submit Booking Request", "status": "completed" },
    { "name": "Validate Couple CPRs", "status": "completed" },
    { "name": "Check Marriage Eligibility", "status": "completed" },
    { "name": "Fetch Available Slots", "status": "active" },
    { "name": "Present Calendar", "status": "pending" },
    { "name": "Couple Selects Date/Time", "status": "pending" },
    { "name": "Book Appointment", "status": "pending" },
    { "name": "Send Confirmation Email", "status": "pending" },
    { "name": "Generate Document Checklist", "status": "pending" },
    { "name": "Send Reminder (7 days)", "status": "pending" },
    { "name": "Send Reminder (1 day)", "status": "pending" },
    { "name": "Check-in at Ceremony", "status": "pending" },
    { "name": "Verify Documents", "status": "pending" },
    { "name": "Conduct Ceremony", "status": "pending" },
    { "name": "Sign Marriage Certificate", "status": "pending" },
    { "name": "Register Marriage (CPR)", "status": "pending" },
    { "name": "Issue Certificate", "status": "pending" },
    { "name": "Send Digital Post", "status": "pending" },
    { "name": "Close Booking", "status": "pending" }
  ]
}
```

### 3. Building Permit (Enhanced - with branching)

```json
{
  "workflow_id": "building_permit",
  "workflow_name": "Building Permit Application",
  "steps": [
    { "name": "Submit Application", "status": "completed" },
    { "name": "Validate Zoning", "status": "completed" },
    { "name": "Parallel Review", "status": "active", "isBranching": true,
      "branches": [
        { "id": "branch-1", "name": "Technical Review", "status": "active" },
        { "id": "branch-2", "name": "Environmental Review", "status": "completed" },
        { "id": "branch-3", "name": "Fire Safety Review", "status": "pending" }
      ]
    },
    { "name": "Notify Neighbors", "status": "pending" },
    { "name": "Public Comment Period", "status": "pending" },
    { "name": "Case Worker Review", "status": "pending" },
    { "name": "Approval Decision", "status": "pending" },
    { "name": "Issue Permit", "status": "pending" },
    { "name": "Archive to SBSYS", "status": "pending" }
  ]
}
```

## Step Status Values

The component supports the following step statuses:

- `pending` - Step has not started yet (gray indicator)
- `active` - Step is currently being processed (blue indicator with pulse animation)
- `completed` - Step finished successfully (green checkmark)
- `failed` - Step encountered an error (red X icon)

The status mapping is flexible and will automatically convert common status values:
- `completed`, `complete`, `success`, `approved` → `completed`
- `active`, `running`, `in_progress`, `processing` → `active`
- `failed`, `error`, `rejected` → `failed`
- Everything else → `pending`

## Styling

The component is fully styled with scoped CSS and supports:
- Light/dark mode (via CSS variables - future enhancement)
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Accessibility features

### Color Scheme

- Primary Blue: `#007acc` (active steps)
- Success Green: `#28a745` (completed steps)
- Error Red: `#dc3545` (failed steps)
- Gray: `#ddd` (pending steps)

## Events

The component does not emit custom events, but it:
- Auto-refreshes based on workflow status
- Stops refreshing when workflow completes or fails
- Cleans up timers on component unmount

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Keyboard navigation support

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Requires JavaScript enabled

## Related Components

- `WorkflowDashboard.vue` - Task management dashboard
- `TaskCard.vue` - Individual task display
- `WorkflowPayment.vue` - Payment processing UI

## Testing

### Mock API Response

For testing, you can mock the API endpoint:

```typescript
// composables/useApi.ts mock
const mockExecutionStatus = {
  data: {
    id: 'exec-123',
    type: 'workflow_execution',
    attributes: {
      execution_id: 'exec-123',
      workflow_id: 'parking_permit',
      workflow_name: 'Parking Permit Application',
      status: 'running',
      submitted_at: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          name: 'Submit Application',
          status: 'completed',
          started_at: new Date(Date.now() - 300000).toISOString(),
          completed_at: new Date(Date.now() - 240000).toISOString()
        },
        {
          id: 'step-2',
          name: 'Process Payment',
          status: 'active',
          started_at: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'step-3',
          name: 'Generate Permit',
          status: 'pending'
        }
      ]
    }
  }
}
```

## Example Page

See `/pages/workflow-status/[id].vue` for a complete example of using this component in a page context.

## TypeScript Types

All TypeScript types are defined in `/types/workflow.ts`:

- `WorkflowStep`
- `WorkflowExecution`

## Future Enhancements

- [ ] Real-time WebSocket updates (instead of polling)
- [ ] Step details expansion/collapse
- [ ] Export workflow history as PDF
- [ ] Email notifications on step completion
- [ ] Workflow history timeline view
- [ ] Dark mode support
- [ ] i18n translations (Danish/English)
