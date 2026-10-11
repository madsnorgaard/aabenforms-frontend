<template>
  <footer>
    <div class="footer">
      <div class="container">
        <div class="row">
          <div class="col-12 col-sm-12 col-md-3 footer-col">
            <section>
              <h2 class="h5 mb-3">{{ $t('fds.footer.authority') }}</h2>
              <p><strong class="authority-name">{{ authorityName || $t('fds.header.authorityName') }}</strong></p>
              <p v-if="authorityText">{{ authorityText }}</p>
              <p class="mt-3">{{ $t('footer.license') }}</p>
            </section>
          </div>
          <div class="col-12 col-sm-12 col-md-3 footer-col d-print-none">
            <section>
              <h2 class="h5 mb-3">{{ $t('fds.footer.contact') }}</h2>
              <ul class="unstyled-list">
                <li><a :href="`mailto:${email}`">{{ email }}</a></li>
                <li v-if="phone"><a :href="`tel:${phoneHref}`">{{ phone }}</a></li>
                <li><NuxtLink :to="localePath('/kontakt')">{{ $t('fds.footer.contactPage') }}</NuxtLink></li>
              </ul>
            </section>
          </div>
          <div class="col-12 col-sm-12 col-md-3 footer-col d-print-none">
            <section>
              <h2 class="h5 mb-3">{{ $t('fds.footer.about') }}</h2>
              <ul class="unstyled-list">
                <li>
                  <NuxtLink :to="localePath('/tilgaengelighed')" class="icon-link">
                    <svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#accessibility-new" /></svg>{{ $t('fds.footer.accessibility') }}
                  </NuxtLink>
                </li>
                <li><NuxtLink :to="localePath('/cookies')">{{ $t('fds.footer.cookies') }}</NuxtLink></li>
                <li>
                  <a href="https://github.com/madsnorgaard/aabenforms" target="_blank" rel="noopener" class="icon-link">
                    GitHub<svg class="icon-svg" focusable="false" aria-hidden="true"><use href="#open-in-new" /></svg>
                  </a>
                </li>
              </ul>
            </section>
          </div>
          <div v-if="$slots.extra" class="col-12 col-sm-12 col-md-3 footer-col d-print-none">
            <section>
              <slot name="extra" />
            </section>
          </div>
        </div>
      </div>
    </div>
    <FdsLanguageSwitcher v-if="languageSwitcher" variant="footer" />
  </footer>
</template>

<script setup lang="ts">
// DKFDS Footer: footer > div.footer > .container > .row with footer-col
// columns. Carries the authority name, contact (mailto, tel), the
// tilgængelighedserklæring (icon-link) and the cookie policy. Non-essential
// columns are d-print-none. The `extra` slot is a fourth column (e.g. API
// status on the landing page).
const props = withDefaults(defineProps<{
  authorityName?: string
  authorityText?: string
  email?: string
  phone?: string
  languageSwitcher?: boolean
}>(), {
  email: 'kontakt@aabenforms.dk',
  phone: '',
  languageSwitcher: false,
})

const localePath = useLocalePath()
const phoneHref = computed(() => props.phone.replace(/\s+/g, ''))
</script>
