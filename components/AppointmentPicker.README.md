# AppointmentPicker Component

A comprehensive Vue 3 component for selecting and booking appointment time slots in the ÅbenForms platform. Designed for municipal services like marriage ceremony bookings, building permit consultations, and other citizen appointments.

## Features

- **Calendar Widget**: Visual date selection with grouped time slots
- **Date Range Filtering**: Start and end date pickers to narrow down available slots
- **Real-time Slot Availability**: Fetches available slots from backend API
- **Responsive Design**: Mobile-friendly interface with touch-optimized controls
- **Loading States**: Spinner and skeleton screens during data fetching
- **Error Handling**: User-friendly error messages with retry options
- **Empty States**: Clear messaging when no slots are available
- **Booking Confirmation**: Fixed bottom panel with selected slot details
- **Internationalization**: Full i18n support (Danish and English)
- **TypeScript Support**: Fully typed with proper interfaces
- **Accessible**: Semantic HTML and ARIA labels

## Usage

### Basic Usage

```vue
<template>
  <AppointmentPicker
    @booking-confirmed="handleBooking"
  />
</template>

<script setup lang="ts">
function handleBooking(slot: TimeSlot) {
  console.log('Booking confirmed:', slot)
  // Handle the booking (e.g., submit to backend)
}
</script>
```

### Advanced Usage with Props

```vue
<template>
  <AppointmentPicker
    :workflow-id="workflowId"
    :submission-id="submissionId"
    :api-endpoint="customEndpoint"
    :default-days-ahead="60"
    @slot-selected="handleSlotSelected"
    @booking-confirmed="handleBookingConfirmed"
    @booking-cancelled="handleBookingCancelled"
    @error="handleError"
  />
</template>

<script setup lang="ts">
const workflowId = ref('marriage-booking')
const submissionId = ref('submission-123')
const customEndpoint = ref('/api/custom/slots')

function handleSlotSelected(slot: TimeSlot) {
  console.log('User selected slot:', slot)
}

function handleBookingConfirmed(slot: TimeSlot) {
  // Submit booking to backend
  await submitBooking(slot)
}

function handleBookingCancelled() {
  console.log('User cancelled selection')
}

function handleError(error: string) {
  console.error('Error:', error)
}
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `workflowId` | `string` | `undefined` | Optional workflow ID to filter slots |
| `submissionId` | `string` | `undefined` | Optional submission ID for context |
| `apiEndpoint` | `string` | `/api/workflow/calendar/slots` | Backend API endpoint for fetching slots |
| `defaultDaysAhead` | `number` | `30` | Default number of days ahead to fetch if no end date specified |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `slot-selected` | `TimeSlot` | Emitted when user selects a time slot |
| `booking-confirmed` | `TimeSlot` | Emitted when user confirms the booking |
| `booking-cancelled` | - | Emitted when user cancels slot selection |
| `error` | `string` | Emitted when an error occurs |

## TypeScript Interfaces

### TimeSlot

```typescript
interface TimeSlot {
  id: string                    // Unique slot identifier
  date: string                  // ISO date string (YYYY-MM-DD)
  startTime: string             // ISO datetime or time string
  endTime?: string              // Optional end time
  duration: number              // Duration in minutes
  available: boolean            // Whether slot is bookable
  location?: string             // Office location or address
  metadata?: Record<string, any> // Additional metadata
}
```

### API Response Format

The component expects the backend to return slots in one of these formats:

#### JSON:API Format
```json
{
  "data": [
    {
      "id": "slot-123",
      "type": "calendar_slot",
      "attributes": {
        "date": "2024-02-15",
        "start_time": "14:00",
        "duration": 30,
        "available": true,
        "location": "Rådhuset, Aarhus"
      }
    }
  ]
}
```

#### Simple Array Format
```json
[
  {
    "id": "slot-123",
    "date": "2024-02-15",
    "startTime": "14:00",
    "duration": 30,
    "available": true,
    "location": "Rådhuset, Aarhus"
  }
]
```

## Exposed Methods

The component exposes methods via template refs:

```vue
<template>
  <AppointmentPicker ref="pickerRef" />
</template>

<script setup lang="ts">
const pickerRef = ref()

// Manually refresh slots
function refreshSlots() {
  pickerRef.value?.fetchSlots()
}

// Clear selected slot
function clearSelection() {
  pickerRef.value?.clearSelection()
}
</script>
```

### Available Methods

- `fetchSlots()`: Manually trigger slot fetching
- `clearSelection()`: Clear the currently selected slot

## Styling

The component uses scoped CSS with custom properties for easy theming:

```css
/* Customize colors */
--primary-color: #007acc;
--success-color: #28a745;
--error-color: #dc3545;
--text-color: #1a1a1a;
--border-color: #e0e0e0;
```

### Mobile Responsive

The component is fully responsive with breakpoints at:
- **768px**: Tablet layout
- **480px**: Mobile layout

## Internationalization

The component uses i18n for all text. Required translation keys:

```json
{
  "appointment": {
    "title": "Select appointment time",
    "subtitle": "Choose a date and time that works for you",
    "startDate": "Start date",
    "endDate": "End date",
    "clearDates": "Clear date filter",
    "clear": "Clear",
    "loading": "Loading available slots...",
    "retry": "Retry",
    "fetchError": "Could not fetch available slots. Please try again.",
    "noSlots": "No available slots",
    "noSlotsHint": "Try selecting a different date range or clear the filter",
    "showAllDates": "Show all dates",
    "slotsAvailable": "slots available",
    "minutes": "min",
    "selectedSlot": "Selected time",
    "cancel": "Cancel",
    "confirmBooking": "Confirm booking",
    "booking": "Booking...",
    "bookingError": "Booking failed. Please try again.",
    "bookingSuccess": "Your booking is confirmed!",
    "bookingSuccessMessage": "You will receive a confirmation via email and SMS."
  }
}
```

## Backend Integration

### API Endpoint Requirements

The backend endpoint should:
1. Accept query parameters: `workflow_id`, `submission_id`, `start_date`, `end_date`
2. Return available time slots in JSON format
3. Handle date range filtering
4. Include slot availability status

### Example Drupal Backend (JSON:API)

```php
/**
 * Custom route controller for calendar slots
 */
public function getSlots(Request $request) {
  $workflowId = $request->query->get('workflow_id');
  $startDate = $request->query->get('start_date');
  $endDate = $request->query->get('end_date');

  // Fetch slots from CalendarService
  $slots = $this->calendarService->getAvailableSlots([
    'workflow_id' => $workflowId,
    'start_date' => $startDate,
    'end_date' => $endDate,
  ]);

  return new JsonResponse([
    'data' => $slots
  ]);
}
```

## Example Use Cases

### Marriage Ceremony Booking

```vue
<AppointmentPicker
  workflow-id="marriage-booking"
  :default-days-ahead="90"
  @booking-confirmed="submitMarriageBooking"
/>
```

### Building Permit Consultation

```vue
<AppointmentPicker
  workflow-id="building-permit-consultation"
  :submission-id="permitSubmissionId"
  @booking-confirmed="scheduleConsultation"
/>
```

### Social Services Meeting

```vue
<AppointmentPicker
  workflow-id="social-services-meeting"
  api-endpoint="/api/social/calendar/slots"
  @booking-confirmed="scheduleServicesMeeting"
/>
```

## Demo Page

A demo page is available at `/demo/appointment-picker` that shows:
- Full component functionality
- Event logging
- Configuration controls
- Example integration code

## Accessibility

The component follows WCAG 2.1 AA guidelines:
- Semantic HTML elements
- Keyboard navigation support
- Screen reader friendly
- Clear focus indicators
- Proper color contrast
- ARIA labels where needed

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Dependencies

- Vue 3.5+
- Nuxt 3
- @nuxtjs/i18n
- Native browser date input

## Performance

- Lazy-loaded slots on mount
- Debounced date range changes
- Efficient slot grouping
- Minimal re-renders
- Optimized for large slot lists (500+ slots)

## Future Enhancements

Potential improvements for future versions:
- [ ] Recurring appointment support
- [ ] Multi-slot selection (for longer meetings)
- [ ] Calendar view integration (month/week grid)
- [ ] Timezone support
- [ ] Waiting list functionality
- [ ] Email/SMS reminders toggle
- [ ] Slot buffer times
- [ ] Custom business hours
- [ ] Holiday/blackout date handling

## License

GPL-2.0 - See LICENSE file

## Support

For issues or questions:
- GitHub Issues: https://github.com/madsnorgaard/aabenforms-frontend/issues
- Documentation: https://aabenforms.dk/docs
