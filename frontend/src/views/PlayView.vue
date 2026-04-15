<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { decodeConfig, DEFAULT_CONFIG, PRESETS, isBgDark } from '../utils/config.js'
import { useMusic } from '../composables/useMusic.js'
import AdventureMap from '../components/AdventureMap.vue'
import FinaleScene from '../components/finale/FinaleScene.vue'
import MuteButton from '../components/MuteButton.vue'

const route = useRoute()

// Decode config from reactive route.hash
const config = computed(() => {
  const hash = route.hash.slice(1)
  if (hash) {
    const decoded = decodeConfig(hash)
    if (decoded) return decoded
  }
  return DEFAULT_CONFIG
})

// Theme CSS vars — adaptive text colors for light/dark backgrounds
const themeStyle = computed(() => {
  const t = config.value.theme || PRESETS.classic
  const dark = t.preset ? (PRESETS[t.preset]?.dark ?? true) : isBgDark(t.bg || PRESETS.classic.bg)
  return {
    '--bg':            t.bg    || PRESETS.classic.bg,
    '--accent':        t.accent|| PRESETS.classic.accent,
    '--text':          dark ? '#ffffff' : '#1a1a1a',
    '--text-muted':    dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
    '--surface':       dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    '--surface-hover': dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
  }
})

// Game state machine: 'adventure' | 'finale'
const phase = ref('adventure')

const { play, stop, muted, toggleMute, unlockAndPlay } = useMusic()

onMounted(() => {
  play(config.value.music)
  document.addEventListener('click', unlockAndPlay, { once: true })
  document.addEventListener('touchstart', unlockAndPlay, { once: true })
})

onUnmounted(() => {
  stop()
})

function startFinale() {
  phase.value = 'finale'
}
</script>

<template>
  <div class="play-wrap" :style="themeStyle">
    <!-- Mute toggle always visible -->
    <MuteButton :muted="muted" @toggle="toggleMute" />

    <Transition name="fade" mode="out-in">
      <!-- Adventure map game -->
      <AdventureMap
        v-if="phase === 'adventure'"
        :recipient-name="config.recipientName || config.name || 'Aria'"
        :personal-message="config.personalMessage || config.message || ''"
        @complete="startFinale"
      />

      <!-- Finale after adventure complete -->
      <FinaleScene
        v-else-if="phase === 'finale'"
        :name="config.recipientName || config.name || 'Friend'"
        :message="config.personalMessage || config.message || ''"
        :accent="config.theme?.accent || PRESETS.classic.accent"
      />
    </Transition>
  </div>
</template>

<style scoped>
.play-wrap {
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  position: relative;
  overflow: hidden;
  transition: background 0.4s ease;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
