<template>
  <div class="demo-page">
    <div class="demo-container">
      <div class="demo-header">
        <h1>{{ $t('appointment.title') }}</h1>
        <p class="demo-description">
          This is a demo of the AppointmentPicker component for booking marriage ceremonies
          and other municipal appointments.
        </p>
      </div>

      <!-- AppointmentPicker Component -->
      <AppointmentPicker
        ref="appointmentPicker"
        :workflow-id="workflowId"
        :submission-id="submissionId"
        :api-endpoint="apiEndpoint"
        :default-days-ahead="60"
        @slot-selected="handleSlotSelected"
        @booking-confirmed="handleBookingConfirmed"
        @booking-cancelled="handleBookingCancelled"
        @error="handleError"
      />

      <!-- Demo Controls -->
      <div v-if="showDemoControls" class="demo-controls">
        <h3>Demo Controls</h3>
        <div class="control-group">
          <label>
            Workflow ID:
            <input v-model="workflowId" type="text" placeholder="workflow-123" />
          </label>
          <label>
            Submission ID:
            <input v-model="submissionId" type="text" placeholder="submission-456" />
          </label>
          <label>
            API Endpoint:
            <input v-model="apiEndpoint" type="text" placeholder="/api/workflow/calendar/slots" />
          </label>
        </div>
        <button @click="refreshSlots" class="refresh-button">
          Refresh Slots
        </button>
      </div>

      <!-- Event Log (for demo purposes) -->
      <div v-if="eventLog.length > 0" class="event-log">
        <h3>Event Log</h3>
        <div
          v-for="(event, index) in eventLog"
          :key="index"
          :class="['event-item', `event-${event.type}`]"
        >
          <span class="event-time">{{ formatEventTime(event.time) }}</span>
          <span class="event-type">{{ event.type }}</span>
          <pre class="event-data">{{ JSON.stringify(event.data, null, 2) }}</pre>
        </div>
        <button @click="clearLog" class="clear-log-button">Clear Log</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface EventLogItem {
  time: Date
  type: string
  data: any
}

// Demo settings
const showDemoControls = ref(true)
const workflowId = ref('marriage-booking-demo')
const submissionId = ref('')
const apiEndpoint = ref('/api/workflow/calendar/slots')

// Event log for demo
const eventLog = ref<EventLogItem[]>([])

// Reference to the AppointmentPicker component
const appointmentPicker = ref()

const { t } = useI18n()

/**
 * Handle slot selection
 */
function handleSlotSelected(slot: any) {
  console.log('Slot selected:', slot)
  addEventToLog('slot-selected', slot)
}

/**
 * Handle booking confirmation
 */
function handleBookingConfirmed(slot: any) {
  console.log('Booking confirmed:', slot)
  addEventToLog('booking-confirmed', slot)

  // In a real application, you would:
  // 1. Send booking request to backend
  // 2. Show success message
  // 3. Redirect to confirmation page

  alert(`${t('appointment.bookingSuccess')}\n\nDate: ${slot.date}\nTime: ${slot.startTime}`)
}

/**
 * Handle booking cancellation
 */
function handleBookingCancelled() {
  console.log('Booking cancelled')
  addEventToLog('booking-cancelled', {})
}

/**
 * Handle errors
 */
function handleError(error: string) {
  console.error('Error:', error)
  addEventToLog('error', { message: error })
}

/**
 * Refresh slots
 */
function refreshSlots() {
  if (appointmentPicker.value) {
    appointmentPicker.value.fetchSlots()
    addEventToLog('refresh-slots', {})
  }
}

/**
 * Add event to log
 */
function addEventToLog(type: string, data: any) {
  eventLog.value.unshift({
    time: new Date(),
    type,
    data
  })

  // Keep only last 10 events
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}

/**
 * Clear event log
 */
function clearLog() {
  eventLog.value = []
}

/**
 * Format event time
 */
function formatEventTime(time: Date): string {
  return time.toLocaleTimeString()
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem 1rem;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1rem 0;
}

.demo-description {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

/* Demo Controls */
.demo-controls {
  margin-top: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007acc;
}

.demo-controls h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
}

.control-group {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.control-group label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

.control-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.control-group input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
}

.refresh-button {
  padding: 0.75rem 1.5rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-button:hover {
  background: #005a9e;
}

/* Event Log */
.event-log {
  margin-top: 3rem;
  padding: 2rem;
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-log h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 1.5rem 0;
}

.event-item {
  padding: 1rem;
  margin-bottom: 1rem;
  background: #2a2a2a;
  border-radius: 6px;
  border-left: 4px solid #666;
}

.event-item.event-slot-selected {
  border-left-color: #007acc;
}

.event-item.event-booking-confirmed {
  border-left-color: #28a745;
}

.event-item.event-booking-cancelled {
  border-left-color: #ffc107;
}

.event-item.event-error {
  border-left-color: #dc3545;
}

.event-time {
  display: inline-block;
  font-size: 0.75rem;
  color: #999;
  margin-right: 1rem;
}

.event-type {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
}

.event-data {
  margin: 0.75rem 0 0 0;
  padding: 0.75rem;
  background: #1a1a1a;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #0f0;
  overflow-x: auto;
}

.clear-log-button {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-log-button:hover {
  background: #c82333;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .demo-page {
    padding: 1rem 0.5rem;
  }

  .demo-header {
    padding: 1.5rem 1rem;
    margin-bottom: 2rem;
  }

  .demo-header h1 {
    font-size: 1.75rem;
  }

  .demo-description {
    font-size: 1rem;
  }

  .demo-controls,
  .event-log {
    padding: 1.5rem;
  }
}
</style>
