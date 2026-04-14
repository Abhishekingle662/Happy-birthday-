<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PRESETS, decodeConfig, isBgDark } from './utils/config.js'

const route = useRoute()

function themeVars(theme) {
  if (!theme) return {}
  const dark = theme.preset
    ? (PRESETS[theme.preset]?.dark ?? true)
    : isBgDark(theme.bg)
  return {
    '--bg':            theme.bg,
    '--accent':        theme.accent,
    '--text':          dark ? '#ffffff' : '#1a1a1a',
    '--text-muted':    dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
    '--surface':       dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    '--surface-hover': dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
  }
}

// route.hash is reactive; window.location.hash is not
const themeStyle = computed(() => {
  if (route.path === '/play') {
    const hash = route.hash.slice(1)
    const config = hash ? decodeConfig(hash) : null
    if (config?.theme) return themeVars(config.theme)
  }
  return themeVars(PRESETS.classic)
})
</script>

<template>
  <div id="app" :style="themeStyle">
    <RouterView />
  </div>
</template>
