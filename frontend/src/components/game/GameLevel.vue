<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import BalloonSprite from './sprites/BalloonSprite.vue'
import GiftSprite from './sprites/GiftSprite.vue'
import CandleSprite from './sprites/CandleSprite.vue'

const props = defineProps({
  level: { type: Number, required: true },
  playerName: { type: String, default: '' },
})
const emit = defineEmits(['complete'])

// Level configs — generous timings so the game feels fun, not punishing
const LEVEL_CONFIG = {
  1: {
    title: 'Pop the Balloons! 🎈',
    subtitle: 'Tap every balloon before they float away!',
    count: 15,
    spawnInterval: 900,    // ms between spawns
    objectLifetime: 7000,  // ms before object disappears
    objectSize: 80,
  },
  2: {
    title: 'Catch the Gifts! 🎁',
    subtitle: 'Tap every falling gift box!',
    count: 20,
    spawnInterval: 800,
    objectLifetime: 5500,
    objectSize: 72,
  },
  3: {
    title: 'Tap the Candles! 🕯️',
    subtitle: 'Tap every candle before it flickers out!',
    count: 25,
    spawnInterval: 700,
    objectLifetime: 4000,
    objectSize: 64,
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
  <div class="game-level" :class="`bg-level-${level}`" ref="gameArea">
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
      }"
      @click="handleTap($event, obj.id)"
      @touchstart.prevent="handleTap($event, obj.id)"
    >
      <BalloonSprite v-if="level === 1" />
      <GiftSprite    v-else-if="level === 2" />
      <CandleSprite  v-else />
    </div>

    <!-- Waiting overlay -->
    <Transition name="fade">
      <div v-if="!gameStarted" class="start-overlay">
        <div class="start-content">
          <div class="start-sprite">
            <BalloonSprite v-if="level === 1" />
            <GiftSprite    v-else-if="level === 2" />
            <CandleSprite  v-else />
          </div>
          <h3>LEVEL {{ level }}</h3>
          <p>{{ cfg.title }}</p>
          <p class="start-hint">▶ GET READY…</p>
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

/* Level 1 — sky with pixel clouds pattern */
.game-level.bg-level-1 {
  background-image:
    radial-gradient(ellipse 40px 20px at 15% 20%, rgba(255,255,255,0.08) 100%, transparent 100%),
    radial-gradient(ellipse 30px 15px at 70% 35%, rgba(255,255,255,0.06) 100%, transparent 100%),
    radial-gradient(ellipse 50px 25px at 45% 15%, rgba(255,255,255,0.07) 100%, transparent 100%),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 31px,
      rgba(255,255,255,0.015) 31px,
      rgba(255,255,255,0.015) 32px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 31px,
      rgba(255,255,255,0.015) 31px,
      rgba(255,255,255,0.015) 32px
    );
}

/* Level 2 — indoor party room with pixel tile floor */
.game-level.bg-level-2 {
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 47px,
      rgba(255,255,255,0.03) 47px,
      rgba(255,255,255,0.03) 48px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 47px,
      rgba(255,255,255,0.03) 47px,
      rgba(255,255,255,0.03) 48px
    ),
    linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.15) 100%);
}

/* Level 3 — dark dungeon with pixel brick pattern */
.game-level.bg-level-3 {
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 23px,
      rgba(0,0,0,0.2) 23px,
      rgba(0,0,0,0.2) 24px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 47px,
      rgba(0,0,0,0.15) 47px,
      rgba(0,0,0,0.15) 48px
    );
}

.level-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 52px 24px 16px;
  text-align: center;
  background: linear-gradient(to bottom, var(--bg) 55%, transparent);
  pointer-events: none;
}

.level-title {
  font-size: 0.7rem;
  font-weight: 400;
  margin-bottom: 6px;
  color: var(--accent);
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
  line-height: 1.6;
}

.level-sub {
  font-size: 0.45rem;
  color: var(--text-muted);
  margin-bottom: 14px;
  line-height: 2;
}

.progress-bar-wrap {
  position: relative;
  height: 12px;
  background: var(--surface);
  border-radius: 0;
  max-width: 320px;
  margin: 0 auto;
  overflow: visible;
  border: 2px solid var(--surface-hover);
}

.progress-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 0;
  transition: width 0.3s steps(10);
  box-shadow: 2px 0 0px rgba(255,255,255,0.3) inset;
}

.progress-label {
  position: absolute;
  right: 0;
  top: -22px;
  font-size: 0.45rem;
  color: var(--text-muted);
  font-weight: 400;
}

/* Game objects — retro pixel style */
.game-object {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0;
  transform-origin: center;
  transition: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform, opacity;
  image-rendering: pixelated;
  /* Pixel drop shadow */
  filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.6));
}

.game-object:hover {
  filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.6)) brightness(1.2);
}

/* Candle flicker */
.game-object.level-3 {
  animation: flicker 0.6s steps(2) infinite alternate;
}

@keyframes flicker {
  from { filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.6)) drop-shadow(0 0 6px var(--accent)); }
  to   { filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.6)) drop-shadow(0 0 14px var(--accent)) brightness(1.15); }
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
  gap: 16px;
  padding: 32px;
  border: 3px solid var(--accent);
  box-shadow: 6px 6px 0px rgba(0,0,0,0.5);
  background: var(--surface);
}

.start-sprite {
  width: 80px;
  height: 80px;
  animation: bounce 0.5s steps(4) infinite alternate;
  image-rendering: pixelated;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-12px); }
}

.start-content h3 {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--accent);
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
}

.start-content p {
  font-size: 0.55rem;
  color: var(--text-muted);
  line-height: 2;
}

.start-hint {
  font-size: 0.5rem !important;
  color: var(--accent) !important;
  font-weight: 400;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
