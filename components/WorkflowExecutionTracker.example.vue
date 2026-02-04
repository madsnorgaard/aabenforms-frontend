<template>
  <div class="demo-page">
    <h1>Workflow Execution Tracker - Demo</h1>

    <div class="demo-controls">
      <h2>Select Demo Workflow</h2>
      <div class="workflow-buttons">
        <button
          v-for="demo in demoWorkflows"
          :key="demo.id"
          @click="selectWorkflow(demo.id)"
          class="workflow-button"
          :class="{ active: selectedWorkflowId === demo.id }"
        >
          {{ demo.name }}
          <span class="step-count">{{ demo.stepCount }} steps</span>
        </button>
      </div>

      <div class="controls">
        <label>
          <input type="checkbox" v-model="autoRefresh" />
          Auto-refresh enabled
        </label>
        <label>
          Refresh interval:
          <select v-model.number="refreshInterval">
            <option :value="1000">1 second</option>
            <option :value="2000">2 seconds</option>
            <option :value="5000">5 seconds</option>
          </select>
        </label>
      </div>
    </div>

    <div class="demo-tracker">
      <WorkflowExecutionTracker
        v-if="mockExecutionId"
        :execution-id="mockExecutionId"
        :auto-refresh="autoRefresh"
        :refresh-interval="refreshInterval"
      />
      <div v-else class="placeholder">
        <p>Select a demo workflow above to see the tracker in action</p>
      </div>
    </div>

    <div class="demo-info">
      <h3>Demo Workflow Scenarios</h3>
      <div class="info-grid">
        <div class="info-card">
          <h4>Parking Permit (11 steps)</h4>
          <ul>
            <li>Linear workflow</li>
            <li>Includes payment processing</li>
            <li>SMS and email notifications</li>
            <li>PDF generation</li>
          </ul>
        </div>

        <div class="info-card">
          <h4>Marriage Booking (19 steps)</h4>
          <ul>
            <li>Complex multi-step process</li>
            <li>CPR validation</li>
            <li>Calendar booking</li>
            <li>Automated reminders</li>
          </ul>
        </div>

        <div class="info-card">
          <h4>Building Permit (Enhanced)</h4>
          <ul>
            <li>Branching workflow</li>
            <li>Parallel reviews</li>
            <li>Neighbor notifications</li>
            <li>SBSYS integration</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedWorkflowId = ref<string>('')
const mockExecutionId = ref<string>('')
const autoRefresh = ref(true)
const refreshInterval = ref(2000)

const demoWorkflows = [
  {
    id: 'parking_permit',
    name: 'Parking Permit',
    stepCount: 11
  },
  {
    id: 'marriage_booking',
    name: 'Marriage Booking',
    stepCount: 19
  },
  {
    id: 'building_permit',
    name: 'Building Permit',
    stepCount: 9
  }
]

function selectWorkflow(workflowId: string) {
  selectedWorkflowId.value = workflowId
  // Generate a mock execution ID
  mockExecutionId.value = `exec-${workflowId}-${Date.now().toString(36)}`
}
</script>

<style scoped>
.demo-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}

.demo-controls {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.demo-controls h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
}

.workflow-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.workflow-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #333;
  transition: all 0.2s;
}

.workflow-button:hover {
  background: #e3f2fd;
  border-color: #007acc;
}

.workflow-button.active {
  background: #007acc;
  border-color: #007acc;
  color: white;
}

.step-count {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
}

.controls {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.controls select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.demo-tracker {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  min-height: 400px;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #999;
  font-size: 1.125rem;
}

.demo-info {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1.5rem 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007acc;
}

.info-card h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  padding: 0.375rem 0;
  color: #666;
  font-size: 0.875rem;
}

.info-card li::before {
  content: "✓ ";
  color: #28a745;
  font-weight: 600;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .demo-page {
    padding: 1rem;
  }

  .workflow-buttons {
    grid-template-columns: 1fr;
  }

  .controls {
    flex-direction: column;
    gap: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
