<template>
  <div class="card demo-persona-login" data-testid="demo-persona-login">
    <div class="card-content">
      <component :is="headingLevel" class="card-heading">{{ $t('demo.wizard.login.cardHeading', { name }) }}</component>
      <p class="mt-3">{{ story }}</p>
      <div class="card-actions mt-5">
        <FdsButton variant="primary" :disabled="disabled" data-testid="demo-persona-login-button" @click="$emit('login')">
          {{ $t('demo.wizard.login.button', { name }) }}
        </FdsButton>
      </div>
      <p class="demo-persona-login__password mt-3 mb-0">{{ $t('demo.wizard.login.passwordNote', { password }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// One-click demo login: a DKFDS card naming the scenario's persona and one
// primary button. The button only suggests the persona's username to the
// mock MitID (OIDC login_hint); the person still types the password there,
// so the password is shown once here in small text.
withDefaults(defineProps<{
  name: string
  story: string
  password: string
  headingLevel?: 'h2' | 'h3'
  disabled?: boolean
}>(), {
  headingLevel: 'h3',
  disabled: false,
})

defineEmits<{ login: [] }>()
</script>

<style scoped>
.demo-persona-login {
  max-width: 40rem;
}

.demo-persona-login__password {
  color: #454545;
  font-size: 0.875rem;
}
</style>
