<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { decodeConfig, DEFAULT_CONFIG, PRESETS } from '../utils/config.js'
import { useMusic } from '../composables/useMusic.js'
import GameLevel from '../components/game/GameLevel.vue'
import LevelTransition from '../components/game/LevelTransition.vue'
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

// Theme CSS vars
const themeStyle = computed(() => ({
  '--bg': config.value.theme?.bg || PRESETS.classic.bg,
  '--accent': config.value.theme?.accent || PRESETS.classic.accent,
}))

// Game state machine
const phase = ref('level')
const currentLevel = ref(1)

const { play, stop, muted, toggleMute, unlockAndPlay } = useMusic()

onMounted(() => {
  play(config.value.music)
  document.addEventListener('click', unlockAndPlay, { once: true })
  document.addEventListener('touchstart', unlockAndPlay, { once: true })
})

onUnmounted(() => {
  stop()
})

function onLevelComplete() {
  if (currentLevel.value < 3) {
    phase.value = 'transition'
  } else {
    phase.value = 'finale'
  }
}

function onTransitionDone() {
  currentLevel.value++
  phase.value = 'level'
}
</script>

<template>
  <div class="play-wrap" :style="themeStyle">
    <!-- Mute toggle always visible -->
    <MuteButton :muted="muted" @toggle="toggleMute" />

    <!-- Level indicator -->
    <div v-if="phase === 'level'" class="level-indicator">
      Level {{ currentLevel }} of 3
    </div>

    <Transition name="fade" mode="out-in">
      <GameLevel
        v-if="phase === 'level'"
        :key="currentLevel"
        :level="currentLevel"
        :player-name="config.name"
        @complete="onLevelComplete"
      />
      <LevelTransition
        v-else-if="phase === 'transition'"
        :completed-level="currentLevel"
        :next-level="currentLevel + 1"
        @done="onTransitionDone"
      />
      <FinaleScene
        v-else-if="phase === 'finale'"
        :name="config.name"
        :message="config.message"
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

.level-indicator {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  backdrop-filter: blur(8px);
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  z-index: 10;
  pointer-events: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
