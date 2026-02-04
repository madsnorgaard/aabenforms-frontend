<template>
  <div class="appointment-picker" role="region" :aria-label="$t('appointment.title') || 'Appointment booking'">
    <!-- Header -->
    <div class="picker-header">
      <h2 class="picker-title" id="appointment-title">{{ $t('appointment.title') }}</h2>
      <p class="picker-subtitle">{{ $t('appointment.subtitle') }}</p>
    </div>

    <!-- Date Range Filter -->
    <div class="date-range-filter" role="search" :aria-label="$t('appointment.filterByDate') || 'Filter appointments by date'">
      <div class="date-input-group">
        <label for="startDate" class="date-label">
          {{ $t('appointment.startDate') }}
        </label>
        <input
          id="startDate"
          v-model="startDate"
          type="date"
          :min="minDate"
          :max="endDate || maxDate"
          class="date-input"
          :aria-label="$t('appointment.startDate')"
          @change="handleDateRangeChange"
        />
      </div>

      <div class="date-range-separator" aria-hidden="true">
        <svg class="arrow-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
        </svg>
      </div>

      <div class="date-input-group">
        <label for="endDate" class="date-label">
          {{ $t('appointment.endDate') }}
        </label>
        <input
          id="endDate"
          v-model="endDate"
          type="date"
          :min="startDate || minDate"
          :max="maxDate"
          class="date-input"
          :aria-label="$t('appointment.endDate')"
          @change="handleDateRangeChange"
        />
      </div>

      <button
        v-if="startDate || endDate"
        @click="clearDateRange"
        class="clear-dates-button"
        type="button"
        :aria-label="$t('appointment.clearDates')"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        {{ $t('appointment.clear') }}
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-state"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="spinner" role="progressbar" :aria-label="$t('appointment.loading')"></div>
      <p>{{ $t('appointment.loading') }}</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="error-state"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p class="error-message">{{ error }}</p>
      <button
        @click="fetchSlots"
        class="retry-button"
        type="button"
      >
        {{ $t('appointment.retry') }}
      </button>
    </div>

    <!-- Empty State - No Slots Available -->
    <div v-else-if="groupedSlots.length === 0" class="empty-state">
      <svg class="calendar-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
      </svg>
      <p class="empty-message">{{ $t('appointment.noSlots') }}</p>
      <p class="empty-hint">{{ $t('appointment.noSlotsHint') }}</p>
      <button @click="clearDateRange" class="retry-button">
        {{ $t('appointment.showAllDates') }}
      </button>
    </div>

    <!-- Slots List -->
    <div v-else class="slots-container">
      <div
        v-for="dateGroup in groupedSlots"
        :key="dateGroup.date"
        class="date-group"
      >
        <!-- Date Header -->
        <div class="date-header">
          <div class="date-info">
            <h3 class="date-day">{{ formatDate(dateGroup.date) }}</h3>
            <p class="date-meta">
              {{ dateGroup.slots.length }} {{ $t('appointment.slotsAvailable') }}
            </p>
          </div>
        </div>

        <!-- Time Slots -->
        <div class="time-slots-grid" role="group" :aria-label="`${$t('appointment.availableSlots')} ${formatDate(dateGroup.date)}`">
          <button
            v-for="slot in dateGroup.slots"
            :key="slot.id"
            @click="selectSlot(slot)"
            :class="[
              'time-slot',
              {
                selected: selectedSlot?.id === slot.id,
                unavailable: !slot.available
              }
            ]"
            :disabled="!slot.available"
            type="button"
            :aria-pressed="selectedSlot?.id === slot.id ? 'true' : 'false'"
            :aria-label="`${formatTime(slot.startTime)}, ${slot.duration} ${$t('appointment.minutes')}${slot.location ? ', ' + slot.location : ''}${!slot.available ? ', ' + $t('appointment.unavailable') : ''}`"
          >
            <div class="slot-content">
              <span class="slot-time">{{ formatTime(slot.startTime) }}</span>
              <span class="slot-duration">{{ slot.duration }} {{ $t('appointment.minutes') }}</span>
              <span v-if="slot.location" class="slot-location">
                <svg class="location-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {{ slot.location }}
              </span>
            </div>
            <div v-if="selectedSlot?.id === slot.id" class="selected-indicator" aria-hidden="true">
              <svg class="check-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Booking Confirmation Panel -->
    <transition name="slide-up">
      <div
        v-if="selectedSlot && !loading"
        class="booking-panel"
        role="region"
        aria-live="polite"
        :aria-label="$t('appointment.selectedSlot')"
      >
        <div class="booking-content">
          <div class="booking-info">
            <h3 class="booking-title" id="booking-title">{{ $t('appointment.selectedSlot') }}</h3>
            <div class="booking-details">
              <div class="detail-row">
                <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                </svg>
                <span>{{ formatFullDate(selectedSlot.date) }}</span>
              </div>
              <div class="detail-row">
                <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                <span>{{ formatTime(selectedSlot.startTime) }} ({{ selectedSlot.duration }} {{ $t('appointment.minutes') }})</span>
              </div>
              <div v-if="selectedSlot.location" class="detail-row">
                <svg class="detail-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>{{ selectedSlot.location }}</span>
              </div>
            </div>
          </div>

          <div class="booking-actions">
            <button
              @click="cancelSelection"
              class="cancel-button"
              :disabled="booking"
              type="button"
            >
              {{ $t('appointment.cancel') }}
            </button>
            <button
              @click="confirmBooking"
              class="confirm-button"
              :disabled="booking"
              :aria-busy="booking ? 'true' : 'false'"
              type="button"
            >
              <span v-if="booking">{{ $t('appointment.booking') }}</span>
              <span v-else>{{ $t('appointment.confirmBooking') }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Time slot from the API
 */
interface TimeSlot {
  id: string
  date: string // ISO date string (YYYY-MM-DD)
  startTime: string // ISO datetime string or time string
  endTime?: string
  duration: number // minutes
  available: boolean
  location?: string
  metadata?: Record<string, any>
}

/**
 * Grouped slots by date
 */
interface DateGroup {
  date: string
  slots: TimeSlot[]
}

// Props
const props = withDefaults(defineProps<{
  workflowId?: string
  submissionId?: string
  apiEndpoint?: string
  defaultDaysAhead?: number
}>(), {
  apiEndpoint: '/api/workflow/calendar/slots',
  defaultDaysAhead: 30
})

// Emits
const emit = defineEmits<{
  slotSelected: [slot: TimeSlot]
  bookingConfirmed: [slot: TimeSlot]
  bookingCancelled: []
  error: [error: string]
}>()

// Composables
const { t } = useI18n()
const config = useRuntimeConfig()

// State
const slots = ref<TimeSlot[]>([])
const selectedSlot = ref<TimeSlot | null>(null)
const loading = ref(false)
const booking = ref(false)
const error = ref<string | null>(null)

// Date range filters
const startDate = ref<string>('')
const endDate = ref<string>('')

// Computed date bounds
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 90) // Max 90 days ahead
  return maxDate.toISOString().split('T')[0]
})

/**
 * Group slots by date
 */
const groupedSlots = computed<DateGroup[]>(() => {
  const groups = new Map<string, TimeSlot[]>()

  // Filter slots by date range
  const filteredSlots = slots.value.filter(slot => {
    const slotDate = slot.date
    if (startDate.value && slotDate < startDate.value) return false
    if (endDate.value && slotDate > endDate.value) return false
    return true
  })

  // Group by date
  filteredSlots.forEach(slot => {
    const dateKey = slot.date
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(slot)
  })

  // Convert to array and sort
  const result: DateGroup[] = Array.from(groups.entries())
    .map(([date, slots]) => ({
      date,
      slots: slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return result
})

/**
 * Fetch available slots from backend
 */
async function fetchSlots() {
  loading.value = true
  error.value = null

  try {
    const params: Record<string, any> = {}

    if (props.workflowId) {
      params.workflow_id = props.workflowId
    }
    if (props.submissionId) {
      params.submission_id = props.submissionId
    }
    if (startDate.value) {
      params.start_date = startDate.value
    }
    if (endDate.value) {
      params.end_date = endDate.value
    } else {
      // Default to 30 days ahead if no end date specified
      const defaultEnd = new Date()
      defaultEnd.setDate(defaultEnd.getDate() + props.defaultDaysAhead)
      params.end_date = defaultEnd.toISOString().split('T')[0]
    }

    const response = await $fetch<any>(props.apiEndpoint, {
      baseURL: config.public.apiBase,
      params
    })

    // Handle different response formats
    if (response.data) {
      // JSON:API format
      slots.value = Array.isArray(response.data)
        ? response.data.map(mapSlotFromApi)
        : [mapSlotFromApi(response.data)]
    } else if (Array.isArray(response)) {
      // Direct array format
      slots.value = response.map(mapSlotFromApi)
    } else {
      throw new Error('Invalid response format')
    }

  } catch (e: any) {
    console.error('Failed to fetch slots:', e)
    error.value = e.message || t('appointment.fetchError')
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

/**
 * Map API response to TimeSlot
 */
function mapSlotFromApi(apiSlot: any): TimeSlot {
  // Handle both JSON:API and plain object formats
  const attrs = apiSlot.attributes || apiSlot

  return {
    id: apiSlot.id || attrs.id || crypto.randomUUID(),
    date: attrs.date || attrs.slot_date || '',
    startTime: attrs.start_time || attrs.startTime || '',
    endTime: attrs.end_time || attrs.endTime,
    duration: attrs.duration || 30,
    available: attrs.available !== false,
    location: attrs.location || attrs.office_location,
    metadata: attrs.metadata || {}
  }
}

/**
 * Select a time slot
 */
function selectSlot(slot: TimeSlot) {
  if (!slot.available) return

  selectedSlot.value = slot
  emit('slotSelected', slot)

  // Announce to screen readers
  const announcement = `${t('appointment.selected')}: ${formatFullDate(slot.date)} ${t('appointment.at')} ${formatTime(slot.startTime)}`
  announceToScreenReader(announcement)
}

/**
 * Announce message to screen readers using aria-live region
 */
function announceToScreenReader(message: string) {
  // Create temporary live region if it doesn't exist
  let liveRegion = document.getElementById('appointment-announcer')
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'appointment-announcer'
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    document.body.appendChild(liveRegion)
  }

  // Clear and set new message
  liveRegion.textContent = ''
  setTimeout(() => {
    liveRegion!.textContent = message
  }, 100)
}

/**
 * Cancel slot selection
 */
function cancelSelection() {
  selectedSlot.value = null
  emit('bookingCancelled')
}

/**
 * Confirm booking
 */
async function confirmBooking() {
  if (!selectedSlot.value) return

  booking.value = true
  error.value = null

  try {
    // Emit event - parent component should handle actual booking
    emit('bookingConfirmed', selectedSlot.value)

  } catch (e: any) {
    console.error('Booking failed:', e)
    error.value = e.message || t('appointment.bookingError')
    emit('error', error.value)
  } finally {
    booking.value = false
  }
}

/**
 * Handle date range change
 */
function handleDateRangeChange() {
  fetchSlots()
}

/**
 * Clear date range filter
 */
function clearDateRange() {
  startDate.value = ''
  endDate.value = ''
  fetchSlots()
}

/**
 * Format date for display (e.g., "Mandag, 15. januar 2024")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const { locale } = useI18n()

  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

/**
 * Format full date with time
 */
function formatFullDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  const { locale } = useI18n()

  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

/**
 * Format time (e.g., "14:30")
 */
function formatTime(timeString: string): string {
  // Handle both full datetime and time-only strings
  let date: Date

  if (timeString.includes('T')) {
    date = new Date(timeString)
  } else if (timeString.includes(':')) {
    // Time only string like "14:30"
    const [hours, minutes] = timeString.split(':')
    date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  } else {
    return timeString
  }

  const { locale } = useI18n()

  return new Intl.DateTimeFormat(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

// Load slots on mount
onMounted(() => {
  fetchSlots()
})

// Expose methods for parent component
defineExpose({
  fetchSlots,
  clearSelection: cancelSelection
})
</script>

<style scoped>
.appointment-picker {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.picker-header {
  margin-bottom: 2rem;
  text-align: center;
}

.picker-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.picker-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

/* Date Range Filter */
.date-range-filter {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.date-input-group {
  flex: 1;
  min-width: 200px;
}

.date-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.date-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.date-input:focus {
  outline: 3px solid #007acc;
  outline-offset: 2px;
  border-color: #007acc;
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
}

.date-range-separator {
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
}

.arrow-icon {
  width: 24px;
  height: 24px;
  color: #999;
}

.clear-dates-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-dates-button:hover {
  background: #f5f5f5;
  border-color: #999;
  color: #333;
}

.clear-dates-button .icon {
  width: 18px;
  height: 18px;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 122, 204, 0.2);
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #dc3545;
  margin: 0 auto 1rem;
}

.error-message {
  color: #dc3545;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.retry-button {
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

.retry-button:hover {
  background: #005a9e;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.calendar-icon {
  width: 64px;
  height: 64px;
  color: #999;
  margin: 0 auto 1rem;
}

.empty-message {
  font-size: 1.125rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1.5rem;
}

/* Slots Container */
.slots-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 6rem; /* Space for booking panel */
}

.date-group {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.date-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.date-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-day {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  text-transform: capitalize;
}

.date-meta {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

/* Time Slots Grid */
.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.time-slot {
  position: relative;
  padding: 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.time-slot:hover:not(:disabled) {
  border-color: #007acc;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.15);
  transform: translateY(-2px);
}

.time-slot:focus {
  outline: 3px solid #007acc;
  outline-offset: 2px;
  border-color: #007acc;
}

.time-slot.selected {
  background: #e6f3ff;
  border-color: #007acc;
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
}

.time-slot.unavailable {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f5f5f5;
}

.slot-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slot-time {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
}

.slot-duration {
  font-size: 0.875rem;
  color: #666;
}

.slot-location {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}

.location-icon {
  width: 14px;
  height: 14px;
}

.selected-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #007acc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: white;
}

/* Booking Panel */
.booking-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.booking-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.booking-info {
  flex: 1;
}

.booking-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.75rem 0;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.detail-icon {
  width: 18px;
  height: 18px;
  color: #007acc;
}

.booking-actions {
  display: flex;
  gap: 1rem;
}

.cancel-button,
.confirm-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: white;
  border: 1px solid #ddd;
  color: #666;
}

.cancel-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
}

.cancel-button:focus {
  outline: 3px solid #007acc;
  outline-offset: 2px;
}

.confirm-button {
  background: #28a745;
  color: white;
}

.confirm-button:hover:not(:disabled) {
  background: #218838;
}

.confirm-button:focus {
  outline: 3px solid #218838;
  outline-offset: 2px;
}

.cancel-button:disabled,
.confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .appointment-picker {
    padding: 1rem;
  }

  .picker-title {
    font-size: 1.5rem;
  }

  .date-range-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .date-input-group {
    min-width: auto;
  }

  .date-range-separator {
    display: none;
  }

  .time-slots-grid {
    grid-template-columns: 1fr;
  }

  .booking-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .booking-actions {
    flex-direction: column;
  }

  .cancel-button,
  .confirm-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .picker-title {
    font-size: 1.25rem;
  }

  .date-header {
    padding: 0.75rem 1rem;
  }

  .date-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .time-slots-grid {
    padding: 1rem;
  }

  .booking-content {
    padding: 1rem;
  }
}
</style>
