<template>
  <div class="login-button">
    <UiButton
      v-if="!isAuthenticated"
      @click="handleLogin"
      :disabled="loading"
      class="mitid-button"
    >
      <svg v-if="!loading" class="mitid-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
      <span v-if="loading" class="spinner"></span>
      {{ loading ? $t('auth.loggingIn') : $t('auth.loginWithMitId') }}
    </UiButton>

    <div v-else class="user-menu">
      <button @click="toggleMenu" class="user-menu-trigger">
        <svg class="user-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
        <span class="user-name">{{ user?.name || $t('auth.user') }}</span>
        <svg class="chevron" :class="{ 'chevron-open': menuOpen }" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      <div v-if="menuOpen" class="user-menu-dropdown">
        <div class="user-info">
          <p class="user-name-full">{{ user?.name }}</p>
          <p class="user-cpr">{{ $t('auth.cpr') }}: {{ maskedCpr }}</p>
        </div>

        <div class="menu-divider"></div>

        <NuxtLink to="/workflows/tasks" class="menu-item" @click="menuOpen = false">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          {{ $t('auth.myTasks') }}
        </NuxtLink>

        <button @click="handleLogout" class="menu-item logout-item">
          <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          {{ $t('auth.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, user, loading, login, logout, maskedCpr } = useAuth()
const route = useRoute()

const menuOpen = ref(false)

function handleLogin() {
  // Pass current URL as return URL
  login(route.fullPath)
}

async function handleLogout() {
  menuOpen.value = false
  await logout()
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

// Close menu when clicking outside
onMounted(() => {
  if (process.client) {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-menu')) {
        menuOpen.value = false
      }
    })
  }
})
</script>

<style scoped>
.login-button {
  position: relative;
}

.mitid-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #007acc;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.mitid-button:hover:not(:disabled) {
  background: #005a9e;
}

.mitid-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mitid-icon,
.user-icon,
.menu-icon {
  width: 20px;
  height: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-trigger:hover {
  background: #f5f5f5;
  border-color: #007acc;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

.chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.chevron-open {
  transform: rotate(180deg);
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  z-index: 100;
}

.user-info {
  padding: 1rem;
  background: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.user-name-full {
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.user-cpr {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  font-family: monospace;
}

.menu-divider {
  height: 1px;
  background: #eee;
  margin: 0.5rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  color: #333;
  text-decoration: none;
  font-size: 0.875rem;
}

.menu-item:hover {
  background: #f5f5f5;
}

.logout-item {
  color: #c00;
  border-top: 1px solid #eee;
}

.logout-item:hover {
  background: #fff5f5;
}
</style>
