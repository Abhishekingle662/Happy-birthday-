<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  name:    { type: String, default: '' },
  message: { type: String, default: '' },
  accent:  { type: String, default: '#e94560' },
})

// Phases: 'cake' | 'blowing' | 'fireworks' | 'message'
const phase = ref('cake')
const candlesLit = ref([true, true, true, true, true])
const showFireworks = ref(false)
const showConfetti = ref(false)
const showMessage = ref(false)
const cakeRef = ref(null)
const fireworksCanvas = ref(null)

let fireworksRAF = null
let fireworksCtx = null
let particles = []
let burstInterval = null
let messageTimeout = null

// ── Fireworks particle system ──────────────────────────────────────────────
function createBurst(x, y) {
  const count = 60 + Math.floor(Math.random() * 40)
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
    const speed = 2 + Math.random() * 5
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: `hsl(${Math.random() * 360}, 90%, 65%)`,
      size: 2 + Math.random() * 3,
      decay: 0.012 + Math.random() * 0.01,
    })
  }
}

function launchRandom(canvas) {
  const x = 80 + Math.random() * (canvas.width - 160)
  const y = 60 + Math.random() * (canvas.height * 0.55)
  createBurst(x, y)
}

function tickFireworks() {
  const canvas = fireworksCanvas.value
  if (!canvas) return
  const ctx = fireworksCtx
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  particles = particles.filter(p => p.alpha > 0.02)
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.08   // gravity
    p.vx *= 0.98
    p.alpha -= p.decay
    ctx.globalAlpha = Math.max(0, p.alpha)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  fireworksRAF = requestAnimationFrame(tickFireworks)
}

function resizeCanvas() {
  const canvas = fireworksCanvas.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// ── Confetti pieces ────────────────────────────────────────────────────────
const confettiPieces = ref(
  Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }))
)

// ── Candle blow sequence ───────────────────────────────────────────────────
function blowCandles() {
  phase.value = 'blowing'
  candlesLit.value.forEach((_, i) => {
    setTimeout(() => {
      candlesLit.value[i] = false
    }, i * 300)
  })
  // After all candles blown, start fireworks
  setTimeout(startFireworks, candlesLit.value.length * 300 + 600)
}

function startFireworks() {
  phase.value = 'fireworks'
  showFireworks.value = true
  showConfetti.value = true

  const canvas = fireworksCanvas.value
  if (canvas) {
    resizeCanvas()
    fireworksCtx = canvas.getContext('2d')
    tickFireworks()

    // Launch bursts over 4 seconds
    let count = 0
    burstInterval = setInterval(() => {
      launchRandom(canvas)
      count++
      if (count >= 14) { clearInterval(burstInterval); burstInterval = null }
    }, 280)
  }

  // Show message after 2s — use nextTick so DOM exists before GSAP runs
  messageTimeout = setTimeout(async () => {
    showMessage.value = true
    phase.value = 'message'
    await nextTick()
    animateMessage()
  }, 2000)
}

function animateMessage() {
  gsap.from('.finale-name', {
    y: 40, opacity: 0, duration: 0.8, ease: 'back.out(1.4)',
  })
  gsap.from('.finale-message', {
    y: 30, opacity: 0, duration: 0.7, ease: 'power2.out', delay: 0.4,
  })
  gsap.from('.finale-emoji-row', {
    scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(2)', delay: 0.8,
  })
}

onMounted(() => {
  window.addEventListener('resize', resizeCanvas)

  // Animate cake entrance
  gsap.from(cakeRef.value, {
    y: 120, opacity: 0, duration: 0.9, ease: 'back.out(1.2)',
    onComplete() {
      // Pulse cake to invite tap
      gsap.to(cakeRef.value, {
        scale: 1.06, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut',
      })
    },
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (fireworksRAF) { cancelAnimationFrame(fireworksRAF); fireworksRAF = null }
  if (burstInterval) { clearInterval(burstInterval); burstInterval = null }
  if (messageTimeout) { clearTimeout(messageTimeout); messageTimeout = null }
  particles = []
})
</script>

<template>
  <div class="finale-wrap">

    <!-- Fireworks canvas (behind everything) -->
    <canvas
      v-show="showFireworks"
      ref="fireworksCanvas"
      class="fireworks-canvas"
    />

    <!-- Confetti -->
    <div v-if="showConfetti" class="confetti-layer" aria-hidden="true">
      <div
        v-for="p in confettiPieces"
        :key="p.id"
        class="confetti-piece"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          background: p.color,
          width: p.size + 'px',
          height: p.size + 'px',
          transform: `rotate(${p.rotation}deg)`,
        }"
      />
    </div>

    <!-- Cake scene -->
    <div class="cake-scene" :class="{ dimmed: phase === 'message' }">
      <div
        ref="cakeRef"
        class="cake"
        :class="{ tappable: phase === 'cake' }"
        @click="phase === 'cake' && blowCandles()"
        @touchstart.prevent="phase === 'cake' && blowCandles()"
        :title="phase === 'cake' ? 'Tap to blow the candles!' : ''"
      >
        <!-- Pixel-art cake SVG -->
        <svg
          class="cake-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 100"
          shape-rendering="crispEdges"
          style="image-rendering: pixelated; overflow: visible;"
        >
          <!-- Candles (5) -->
          <g v-for="(lit, i) in candlesLit" :key="i">
            <!-- Candle body -->
            <rect :x="14 + i * 22" y="28" width="8" height="16" fill="#fff9c4" />
            <rect :x="16 + i * 22" y="28" width="2" height="16" fill="rgba(255,255,255,0.5)" />
            <!-- Wick -->
            <rect :x="17 + i * 22" y="22" width="2" height="7" fill="#555" />
            <!-- Flame (visible when lit) -->
            <g v-if="lit">
              <ellipse :cx="18 + i * 22" cy="18" rx="5" ry="7" fill="#ff9800" />
              <ellipse :cx="18 + i * 22" cy="19" rx="3" ry="5" fill="#ffeb3b" />
              <ellipse :cx="18 + i * 22" cy="20" rx="1.5" ry="3" fill="#fff" />
            </g>
            <!-- Smoke (visible when blown) -->
            <g v-if="!lit">
              <rect :x="17 + i * 22" y="14" width="2" height="8" fill="rgba(180,180,180,0.5)" />
            </g>
          </g>

          <!-- Cake top tier -->
          <rect x="10" y="44" width="100" height="20" :fill="accent" />
          <rect x="10" y="44" width="100" height="4" fill="rgba(255,255,255,0.2)" />
          <rect x="100" y="44" width="10" height="20" fill="rgba(0,0,0,0.15)" />
          <!-- Frosting drips on top tier -->
          <rect x="18" y="62" width="6" height="4" fill="rgba(255,255,255,0.6)" />
          <rect x="38" y="62" width="6" height="6" fill="rgba(255,255,255,0.6)" />
          <rect x="58" y="62" width="6" height="4" fill="rgba(255,255,255,0.6)" />
          <rect x="78" y="62" width="6" height="5" fill="rgba(255,255,255,0.6)" />
          <rect x="96" y="62" width="6" height="3" fill="rgba(255,255,255,0.6)" />

          <!-- Cake middle tier -->
          <rect x="4" y="66" width="112" height="22" fill="#f48fb1" />
          <rect x="4" y="66" width="112" height="4" fill="rgba(255,255,255,0.2)" />
          <rect x="108" y="66" width="8" height="22" fill="rgba(0,0,0,0.12)" />
          <!-- Stars decoration -->
          <text x="20" y="82" font-size="8" fill="rgba(255,255,255,0.7)" font-family="monospace">★</text>
          <text x="50" y="82" font-size="8" fill="rgba(255,255,255,0.7)" font-family="monospace">★</text>
          <text x="80" y="82" font-size="8" fill="rgba(255,255,255,0.7)" font-family="monospace">★</text>

          <!-- Cake bottom tier -->
          <rect x="0" y="88" width="120" height="10" fill="#ab47bc" />
          <rect x="0" y="88" width="120" height="3" fill="rgba(255,255,255,0.15)" />
          <rect x="112" y="88" width="8" height="10" fill="rgba(0,0,0,0.12)" />

          <!-- Plate -->
          <rect x="0" y="97" width="120" height="3" fill="rgba(255,255,255,0.2)" />

          <!-- Shadow -->
          <ellipse cx="60" cy="101" rx="55" ry="4" fill="rgba(0,0,0,0.25)" />
        </svg>

        <!-- Tap hint -->
        <Transition name="fade">
          <div v-if="phase === 'cake'" class="tap-hint">
            ▶ TAP TO BLOW THE CANDLES!
          </div>
        </Transition>
      </div>
    </div>

    <!-- Message reveal -->
    <Transition name="message-reveal">
      <div v-if="showMessage" class="message-overlay">
        <div class="finale-emoji-row">🎉🎂🎊</div>
        <h1 class="finale-name">HAPPY BIRTHDAY,<br>{{ name.toUpperCase() }}!</h1>
        <p v-if="message" class="finale-message">{{ message }}</p>
        <div class="finale-emoji-row" style="margin-top: 8px;">🎈🥳🎁</div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.finale-wrap {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg);
}

/* ── Fireworks canvas ── */
.fireworks-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

/* ── Confetti ── */
.confetti-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 6;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 2px;
  animation: confetti-fall linear infinite;
}

@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}

/* ── Cake scene ── */
.cake-scene {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.6s ease;
}

.cake-scene.dimmed {
  opacity: 0.12;
  pointer-events: none;
}

.cake {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  position: relative;
}

.cake.tappable {
  cursor: pointer;
}

.cake-svg {
  width: clamp(180px, 40vw, 300px);
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(4px 4px 0px rgba(0,0,0,0.5));
  animation: cake-idle 1s steps(2) infinite alternate;
}

.cake.tappable .cake-svg {
  animation: cake-idle 0.6s steps(2) infinite alternate;
}

@keyframes cake-idle {
  from { transform: translateY(0); }
  to   { transform: translateY(-4px); }
}

/* Tap hint */
.tap-hint {
  margin-top: 20px;
  font-size: 0.45rem;
  color: var(--accent);
  font-weight: 400;
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
  animation: blink 1s steps(1) infinite;
  line-height: 2;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ── Message overlay ── */
.message-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
  pointer-events: none;
  background: rgba(0,0,0,0.5);
}

.finale-name {
  font-size: clamp(0.7rem, 3vw, 1.1rem);
  font-weight: 400;
  color: var(--accent);
  line-height: 2;
  margin: 16px 0 12px;
  text-shadow: 3px 3px 0px rgba(0,0,0,0.6);
}

.finale-message {
  font-size: clamp(0.45rem, 1.5vw, 0.65rem);
  color: var(--text);
  max-width: 480px;
  line-height: 2.2;
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
  border: 2px solid var(--surface-hover);
  padding: 12px 16px;
  background: var(--surface);
  box-shadow: 4px 4px 0px rgba(0,0,0,0.4);
}

.finale-emoji-row {
  font-size: clamp(1.4rem, 4vw, 2.2rem);
  letter-spacing: 8px;
}

/* Message reveal transition */
.message-reveal-enter-active { transition: opacity 0.6s ease; }
.message-reveal-enter-from   { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) and (hover: none) and (pointer: coarse), 
(max-width: 800px) {
  
  
}
</style>
