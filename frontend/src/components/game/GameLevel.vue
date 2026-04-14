<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  level: { type: Number, required: true },
  playerName: { type: String, default: '' },
})
const emit = defineEmits(['complete'])

// Level configs
const LEVEL_CONFIG = {
  1: {
    title: 'Pop the Balloons! 🎈',
    subtitle: 'Tap every balloon before they float away!',
    count: 15,
    spawnInterval: 600,   // ms between spawns
    objectLifetime: 4500, // ms before object disappears (miss)
    objectSize: 64,
  },
  2: {
    title: 'Catch the Gifts! 🎁',
    subtitle: 'Tap every falling gift box!',
    count: 20,
    spawnInterval: 500,
    objectLifetime: 3200,
    objectSize: 54,
  },
  3: {
    title: 'Tap the Candles! 🕯️',
    subtitle: 'Tap every candle before it flickers out!',
    count: 25,
    spawnInterval: 380,
    objectLifetime: 2200,
    objectSize: 44,
  },
}

const cfg = computed(() => LEVEL_CONFIG[props.level])

const objects = ref([])   // { id, x, y, popped, missed, opacity }
const spawned = ref(0)
const popped = ref(0)
const missed = ref(0)
const gameStarted = ref(false)
const gameArea = ref(null)

let spawnTimer = null
let idCounter = 0
// Map of object id → GSAP tween, so we can kill individual tweens on pop
const tweenMap = new Map()

const EMOJIS = { 1: '🎈', 2: '🎁', 3: '🕯️' }
const emoji = computed(() => EMOJIS[props.level])

// Total cleared = popped (missed objects are removed but don't count as cleared)
const total = computed(() => cfg.value.count)
const cleared = computed(() => popped.value)
const progress = computed(() => Math.round((cleared.value / total.value) * 100))

function getAreaSize() {
  if (!gameArea.value) return { w: window.innerWidth, h: window.innerHeight }
  const r = gameArea.value.getBoundingClientRect()
  return { w: r.width, h: r.height }
}

function spawnObject() {
  if (spawned.value >= total.value) return
  const { w, h } = getAreaSize()
  const size = cfg.value.objectSize
  const padding = size + 20

  let x, y
  if (props.level === 1) {
    // Balloons: start near bottom, drift up
    x = padding + Math.random() * (w - padding * 2)
    y = h - padding
  } else if (props.level === 2) {
    // Gifts: start at top, fall down
    x = padding + Math.random() * (w - padding * 2)
    y = -size
  } else {
    // Candles: random position
    x = padding + Math.random() * (w - padding * 2)
    y = padding + Math.random() * (h - padding * 2)
  }

  const id = ++idCounter
  objects.value.push({ id, x, y, popped: false, missed: false, opacity: 1 })
  spawned.value++

  const lifetime = cfg.value.objectLifetime

  if (props.level === 1) {
    // Float upward — animate a plain proxy object, store tween ref
    const proxy = { progress: 0 }
    const startY = h - padding
    const tween = gsap.to(proxy, {
      progress: 1,
      duration: lifetime / 1000,
      ease: 'none',
      onUpdate() {
        const obj = objects.value.find(o => o.id === id)
        if (!obj || obj.popped) return
        obj.y = startY - proxy.progress * (h + size)
        obj.x += (Math.random() - 0.5) * 0.8
      },
      onComplete() { missObject(id) },
    })
    tweenMap.set(id, tween)
  } else if (props.level === 2) {
    // Fall downward
    const proxy = { progress: 0 }
    const tween = gsap.to(proxy, {
      progress: 1,
      duration: lifetime / 1000,
      ease: 'none',
      onUpdate() {
        const obj = objects.value.find(o => o.id === id)
        if (!obj || obj.popped) return
        obj.y = -size + proxy.progress * (h + size * 2)
      },
      onComplete() { missObject(id) },
    })
    tweenMap.set(id, tween)
  } else {
    // Candles: fade in, stay, fade out
    const obj = objects.value.find(o => o.id === id)
    if (obj) {
      obj.opacity = 0
      const t1 = gsap.to(obj, { opacity: 1, duration: 0.25 })
      const t2 = gsap.to(obj, {
        opacity: 0,
        duration: 0.4,
        delay: (lifetime - 400) / 1000,
        onComplete() { missObject(id) },
      })
      // Store the fade-out tween so we can kill it on pop
      tweenMap.set(id, t2)
    }
  }
}

function missObject(id) {
  const obj = objects.value.find(o => o.id === id)
  if (!obj || obj.popped || obj.missed) return
  obj.missed = true
  missed.value++
  // Remove after short delay
  setTimeout(() => {
    objects.value = objects.value.filter(o => o.id !== id)
    checkComplete()
  }, 300)
}

function popObject(id) {
  const obj = objects.value.find(o => o.id === id)
  if (!obj || obj.popped || obj.missed) return
  obj.popped = true
  popped.value++

  // Kill this object's movement/fade tween by stored reference
  const tween = tweenMap.get(id)
  if (tween) { tween.kill(); tweenMap.delete(id) }

  // Pop animation via GSAP
  const el = document.getElementById(`obj-${id}`)
  if (el) {
    gsap.to(el, {
      scale: 1.6,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.out',
      onComplete() {
        objects.value = objects.value.filter(o => o.id !== id)
        checkComplete()
      },
    })
  } else {
    objects.value = objects.value.filter(o => o.id !== id)
    checkComplete()
  }
}

function checkComplete() {
  // Level complete when all objects have been either popped or missed
  if (popped.value + missed.value >= total.value && objects.value.length === 0) {
    clearInterval(spawnTimer)
    setTimeout(() => emit('complete'), 400)
  }
}

function startGame() {
  gameStarted.value = true
  spawnTimer = setInterval(() => {
    spawnObject()
    if (spawned.value >= total.value) clearInterval(spawnTimer)
  }, cfg.value.spawnInterval)
}

onMounted(() => {
  setTimeout(startGame, 800)
})

onUnmounted(() => {
  clearInterval(spawnTimer)
  // Kill only this component's tweens
  for (const tween of tweenMap.values()) tween.kill()
  tweenMap.clear()
})

function handleTap(e, id) {
  e.preventDefault()
  e.stopPropagation()
  popObject(id)
}
</script>

<template>
  <div class="game-level" ref="gameArea">
    <!-- Header -->
    <div class="level-header">
      <h2 class="level-title">{{ cfg.title }}</h2>
      <p class="level-sub">{{ cfg.subtitle }}</p>
      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        <span class="progress-label">{{ cleared }}/{{ total }}</span>
      </div>
    </div>

    <!-- Game objects -->
    <div
      v-for="obj in objects"
      :key="obj.id"
      :id="`obj-${obj.id}`"
      class="game-object"
      :class="{ popped: obj.popped, missed: obj.missed, [`level-${level}`]: true }"
      :style="{
        left: obj.x + 'px',
        top: obj.y + 'px',
        width: cfg.objectSize + 'px',
        height: cfg.objectSize + 'px',
        opacity: obj.opacity,
        fontSize: (cfg.objectSize * 0.65) + 'px',
      }"
      @click="handleTap($event, obj.id)"
      @touchstart.prevent="handleTap($event, obj.id)"
    >
      {{ emoji }}
    </div>

    <!-- Waiting overlay -->
    <Transition name="fade">
      <div v-if="!gameStarted" class="start-overlay">
        <div class="start-content">
          <div class="start-emoji">{{ emoji }}</div>
          <h3>Level {{ level }}</h3>
          <p>{{ cfg.title }}</p>
          <p class="start-hint">Get ready…</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.game-level {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.level-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 52px 24px 16px;
  text-align: center;
  background: linear-gradient(to bottom, var(--bg) 60%, transparent);
  pointer-events: none;
}

.level-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.level-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.progress-bar-wrap {
  position: relative;
  height: 8px;
  background: var(--surface);
  border-radius: 999px;
  max-width: 320px;
  margin: 0 auto;
  overflow: visible;
}

.progress-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-label {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* Game objects */
.game-object {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transform-origin: center;
  transition: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform, opacity;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

.game-object:hover {
  filter: drop-shadow(0 4px 16px rgba(255,255,255,0.3));
}

/* Candle flicker */
.game-object.level-3 {
  animation: flicker 0.8s ease-in-out infinite alternate;
}

@keyframes flicker {
  from { filter: drop-shadow(0 0 8px var(--accent)); }
  to   { filter: drop-shadow(0 0 20px var(--accent)) brightness(1.2); }
}

/* Start overlay */
.start-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  z-index: 20;
}

.start-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.start-emoji {
  font-size: 5rem;
  animation: bounce 0.8s ease infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-16px); }
}

.start-content h3 {
  font-size: 2rem;
  font-weight: 700;
}

.start-content p {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.start-hint {
  font-size: 0.9rem !important;
  color: var(--accent) !important;
  font-weight: 600;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
