# AppointmentPicker Quick Start Guide

## Installation

The component is automatically available in your Nuxt 3 project. No installation needed.

## Basic Example

```vue
<template>
  <div class="my-page">
    <h1>Book Your Marriage Ceremony</h1>

    <AppointmentPicker
      @booking-confirmed="handleBooking"
    />
  </div>
</template>

<script setup lang="ts">
async function handleBooking(slot) {
  // Submit to backend
  const result = await $fetch('/api/bookings', {
    method: 'POST',
    body: {
      slotId: slot.id,
      date: slot.date,
      startTime: slot.startTime
    }
  })

  // Redirect to confirmation page
  navigateTo(`/booking/confirmation/${result.bookingId}`)
}
</script>
```

## Component Features Overview

### 1. Date Range Filter
```
┌─────────────────────────────────────────────────────┐
│  Start Date: [2024-02-15] → End Date: [2024-03-15]  │
│  [Clear] button                                      │
└─────────────────────────────────────────────────────┘
```

### 2. Slots Display (Grouped by Date)
```
┌─────────────────────────────────────────────────────┐
│  Mandag, 15. februar 2024        8 ledige tider     │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  10:00   │ │  11:00   │ │  14:00   │            │
│  │  30 min  │ │  30 min  │ │  30 min  │            │
│  │ Rådhuset │ │ Rådhuset │ │ Rådhuset │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

### 3. Booking Confirmation Panel (Fixed Bottom)
```
┌─────────────────────────────────────────────────────┐
│  Valgt tidspunkt                                     │
│  📅 Tirs, 16. feb 2024                              │
│  🕐 14:00 (30 min)                                  │
│  📍 Rådhuset, Aarhus                                │
│                                                      │
│  [Annuller]              [Bekræft booking]          │
└─────────────────────────────────────────────────────┘
```

## Props Quick Reference

```typescript
// Optional workflow context
<AppointmentPicker
  workflow-id="marriage-booking"      // Filter slots by workflow
  submission-id="sub-123"             // Link to form submission
  api-endpoint="/custom/endpoint"     // Custom API endpoint
  :default-days-ahead="60"            // Days to fetch (default: 30)
/>
```

## Events Quick Reference

```typescript
// Listen to these events
@slot-selected="(slot) => {}"         // User clicked a slot
@booking-confirmed="(slot) => {}"     // User confirmed booking
@booking-cancelled="() => {}"         // User cancelled
@error="(message) => {}"              // Error occurred
```

## TypeScript Types

```typescript
interface TimeSlot {
  id: string
  date: string              // "2024-02-15"
  startTime: string         // "14:00" or ISO datetime
  endTime?: string
  duration: number          // minutes
  available: boolean
  location?: string
  metadata?: Record<string, any>
}
```

## Common Patterns

### Pattern 1: Simple Marriage Booking

```vue
<template>
  <div class="marriage-booking">
    <h1>Book vielsestid</h1>
    <AppointmentPicker
      workflow-id="marriage-booking"
      @booking-confirmed="bookCeremony"
    />
  </div>
</template>

<script setup lang="ts">
async function bookCeremony(slot: TimeSlot) {
  await $fetch('/api/marriage/book', {
    method: 'POST',
    body: { slot }
  })

  alert('Din vielse er booket!')
}
</script>
```

### Pattern 2: Building Permit Consultation

```vue
<template>
  <div class="permit-consultation">
    <h1>Book møde om byggetilladelse</h1>
    <p>Ansøgning: {{ permitId }}</p>

    <AppointmentPicker
      workflow-id="building-permit-consultation"
      :submission-id="permitId"
      @booking-confirmed="scheduleConsultation"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const permitId = route.params.id

async function scheduleConsultation(slot: TimeSlot) {
  await $fetch(`/api/permits/${permitId}/schedule`, {
    method: 'POST',
    body: { slot }
  })

  navigateTo(`/permits/${permitId}/scheduled`)
}
</script>
```

### Pattern 3: Manual Slot Refresh

```vue
<template>
  <div>
    <button @click="refresh">Refresh Slots</button>
    <AppointmentPicker ref="picker" />
  </div>
</template>

<script setup lang="ts">
const picker = ref()

function refresh() {
  picker.value?.fetchSlots()
}
</script>
```

### Pattern 4: Custom API Integration

```vue
<template>
  <AppointmentPicker
    api-endpoint="/api/custom/slots"
    @booking-confirmed="handleCustomBooking"
  />
</template>

<script setup lang="ts">
async function handleCustomBooking(slot: TimeSlot) {
  // Your custom booking logic
  const result = await myCustomApi.book(slot)
  console.log('Booked:', result)
}
</script>
```

## Responsive Behavior

### Desktop (> 768px)
- 3-4 slots per row
- Side-by-side date filters
- Full booking panel

### Mobile (< 768px)
- 1 slot per row
- Stacked date filters
- Full-width booking panel
- Touch-optimized buttons

## API Backend Requirements

Your backend endpoint should accept these query parameters:

```
GET /api/workflow/calendar/slots
  ?workflow_id=marriage-booking
  &submission_id=sub-123
  &start_date=2024-02-01
  &end_date=2024-03-01
```

And return slots in this format:

```json
{
  "data": [
    {
      "id": "slot-123",
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

## Styling Customization

Override component styles using CSS variables:

```vue
<style>
.appointment-picker {
  --primary-color: #007acc;
  --success-color: #28a745;
  --error-color: #dc3545;
}
</style>
```

## Testing

Test the component at: **http://localhost:3000/demo/appointment-picker**

## Integration Checklist

- [ ] Backend API endpoint implemented
- [ ] Slots data available in correct format
- [ ] Translation keys added to locales
- [ ] Event handlers implemented
- [ ] Mobile responsive tested
- [ ] Error states tested
- [ ] Empty states tested
- [ ] Booking confirmation flow tested

## Performance Tips

1. Use `defaultDaysAhead` prop to limit initial data fetch
2. Implement backend pagination for large datasets
3. Cache slot data when possible
4. Use date range filters to reduce payload

## Common Issues

### Issue: "No available slots"
- Check backend API is returning data
- Verify date range parameters
- Check slot `available` flag

### Issue: Slots not displaying
- Check API response format matches expected structure
- Verify `date` and `startTime` fields exist
- Check browser console for errors

### Issue: Booking not working
- Implement `@booking-confirmed` event handler
- Verify backend booking endpoint exists
- Check network tab for API errors

## Support

- Demo: `/demo/appointment-picker`
- Docs: See `AppointmentPicker.README.md`
- Issues: GitHub repository
