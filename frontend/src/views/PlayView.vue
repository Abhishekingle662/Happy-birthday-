<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { decodeConfig, DEFAULT_CONFIG, PRESETS, isBgDark } from '../utils/config.js'
import { useMusic } from '../composables/useMusic.js'
import AdventureMap from '../components/AdventureMap.vue'
import FinaleScene from '../components/finale/FinaleScene.vue'
import MuteButton from '../components/MuteButton.vue'

const route = useRoute()
const router = useRouter()

const config = computed(() => {
  const hash = route.hash.slice(1)
  if (hash) {
    const decoded = decodeConfig(hash)
    if (decoded) return decoded
  }
  return DEFAULT_CONFIG
})

function normalizeMessage(value) {
  return typeof value === 'string' ? value.trim() : ''
}

const resolvedCelebrationMessage = computed(() => {
  const rawPersonalMessage = config.value.personalMessage || ''
  const rawPrimaryMessage = config.value.message || ''

  const personalMessage = normalizeMessage(rawPersonalMessage)
  const primaryMessage = normalizeMessage(rawPrimaryMessage)
  const defaultPersonalMessage = normalizeMessage(DEFAULT_CONFIG.personalMessage)

  // If the personal message is still the default system copy, prefer the creator's typed message.
  if (personalMessage && personalMessage !== defaultPersonalMessage) return rawPersonalMessage
  if (primaryMessage) return rawPrimaryMessage
  if (personalMessage) return rawPersonalMessage
  return ''
})

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

const phase = ref('adventure')
const { play, stop, muted, toggleMute, unlockAndPlay, playFinalePortuguese } = useMusic()
const gestureEvents = ['pointerdown', 'touchstart', 'click']
const gestureListenerOptions = { passive: true, capture: true }
let hideBrowserUiTimer = null

function isMuteButtonInteraction(event) {
  const target = event?.target
  return target instanceof Element && Boolean(target.closest('.mute-btn'))
}

function requestAppFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) return

  const root = document.documentElement
  const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen
  if (!requestFullscreen) return

  try {
    const promise = requestFullscreen.call(root)
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {})
    }
  } catch {
    // Ignore browsers that reject fullscreen outside strict gesture constraints.
  }
}

function lockLandscape() {
  if (screen.orientation && typeof screen.orientation.lock === 'function') {
    screen.orientation.lock('landscape').catch(() => {})
  }
}

function hideBrowserUI() {
  window.scrollTo(0, 1)
  if (hideBrowserUiTimer) {
    clearTimeout(hideBrowserUiTimer)
  }
  hideBrowserUiTimer = setTimeout(() => {
    window.scrollTo(0, 1)
  }, 80)
}

function enableImmersiveMode(event) {
  // Keep mute taps limited to audio behavior; do not force fullscreen from this button.
  if (isMuteButtonInteraction(event)) {
    unlockAndPlay()
    return
  }

  requestAppFullscreen()
  lockLandscape()
  unlockAndPlay()
  hideBrowserUI()
}

onMounted(() => {
  play(config.value.music)

  document.documentElement.classList.add('immersive-play')
  document.body.classList.add('immersive-play')

  gestureEvents.forEach((eventName) => {
    window.addEventListener(eventName, enableImmersiveMode, gestureListenerOptions)
  })
  window.addEventListener('orientationchange', hideBrowserUI)
  window.addEventListener('resize', hideBrowserUI)
  document.addEventListener('fullscreenchange', lockLandscape)
  document.addEventListener('webkitfullscreenchange', lockLandscape)

  hideBrowserUI()
})

onUnmounted(() => {
  gestureEvents.forEach((eventName) => {
    window.removeEventListener(eventName, enableImmersiveMode, gestureListenerOptions)
  })
  window.removeEventListener('orientationchange', hideBrowserUI)
  window.removeEventListener('resize', hideBrowserUI)
  document.removeEventListener('fullscreenchange', lockLandscape)
  document.removeEventListener('webkitfullscreenchange', lockLandscape)

  if (hideBrowserUiTimer) {
    clearTimeout(hideBrowserUiTimer)
    hideBrowserUiTimer = null
  }

  document.documentElement.classList.remove('immersive-play')
  document.body.classList.remove('immersive-play')

  stop()
})

function startFinale() {
  playFinalePortuguese()
  phase.value = 'finale'
}

function exitGame() {
  router.push('/')
}
</script>

<template>
  <div class="play-wrap" :style="themeStyle">
    <MuteButton :muted="muted" @toggle="toggleMute" />

    <Transition name="fade" mode="out-in">
      <AdventureMap
        v-if="phase === 'adventure'"
        :recipient-name="config.recipientName || config.name || 'Aria'"
        :personal-message="resolvedCelebrationMessage"
        @complete="startFinale"
      />

      <FinaleScene
        v-else-if="phase === 'finale'"
        :name="config.recipientName || config.name || 'Friend'"
        :message="resolvedCelebrationMessage"
        :accent="config.theme?.accent || PRESETS.classic.accent"
        @exit="exitGame"
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
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) and (hover: none) and (pointer: coarse),
(max-width: 800px) {
  .play-wrap {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    padding: 0;
  }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }       
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
