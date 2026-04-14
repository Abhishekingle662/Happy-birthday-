<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PRESETS, decodeConfig } from './utils/config.js'

const route = useRoute()

// route.hash is reactive; window.location.hash is not
const themeStyle = computed(() => {
  if (route.path === '/play') {
    const hash = route.hash.slice(1)
    const config = hash ? decodeConfig(hash) : null
    if (config?.theme) {
      return { '--bg': config.theme.bg, '--accent': config.theme.accent }
    }
  }
  return { '--bg': PRESETS.classic.bg, '--accent': PRESETS.classic.accent }
})
</script>

<template>
  <div id="app" :style="themeStyle">
    <RouterView />
  </div>
</template>
