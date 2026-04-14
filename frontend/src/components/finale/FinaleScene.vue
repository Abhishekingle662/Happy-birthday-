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
        <!-- Candles -->
        <div class="candles">
          <div
            v-for="(lit, i) in candlesLit"
            :key="i"
            class="candle"
          >
            <div class="candle-body"></div>
            <Transition name="flame">
              <div v-if="lit" class="flame">
                <div class="flame-inner"></div>
              </div>
            </Transition>
            <div v-if="!lit" class="smoke"></div>
          </div>
        </div>

        <!-- Cake body -->
        <div class="cake-top" :style="{ background: accent }"></div>
        <div class="cake-middle"></div>
        <div class="cake-bottom"></div>

        <!-- Tap hint -->
        <Transition name="fade">
          <div v-if="phase === 'cake'" class="tap-hint">
            👆 Tap to blow the candles!
          </div>
        </Transition>
      </div>
    </div>

    <!-- Message reveal -->
    <Transition name="message-reveal">
      <div v-if="showMessage" class="message-overlay">
        <div class="finale-emoji-row">🎉🎂🎊</div>
        <h1 class="finale-name">Happy Birthday,<br>{{ name }}!</h1>
        <p v-if="message" class="finale-message">"{{ message }}"</p>
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
  opacity: 0.15;
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

.cake.tappable:hover .cake-top {
  filter: brightness(1.15);
}

/* Candles */
.candles {
  display: flex;
  gap: 14px;
  margin-bottom: 4px;
  align-items: flex-end;
}

.candle {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.candle-body {
  width: 12px;
  height: 36px;
  background: linear-gradient(to right, #fff9c4, #fff176, #fdd835);
  border-radius: 3px 3px 2px 2px;
}

.flame {
  width: 14px;
  height: 22px;
  background: radial-gradient(ellipse at 50% 80%, #fff 0%, #ffeb3b 40%, #ff9800 70%, transparent 100%);
  border-radius: 50% 50% 30% 30%;
  position: absolute;
  top: -22px;
  animation: flame-flicker 0.4s ease-in-out infinite alternate;
  filter: blur(0.5px);
}

.flame-inner {
  width: 6px;
  height: 10px;
  background: radial-gradient(ellipse, #fff 0%, #ffeb3b 100%);
  border-radius: 50%;
  margin: 6px auto 0;
}

@keyframes flame-flicker {
  from { transform: scaleX(1) scaleY(1) rotate(-2deg); }
  to   { transform: scaleX(0.85) scaleY(1.1) rotate(2deg); }
}

.smoke {
  width: 4px;
  height: 20px;
  background: linear-gradient(to top, rgba(200,200,200,0.6), transparent);
  border-radius: 2px;
  position: absolute;
  top: -24px;
  animation: smoke-rise 1s ease-out forwards;
}

@keyframes smoke-rise {
  from { opacity: 0.8; transform: translateY(0) scaleX(1); }
  to   { opacity: 0; transform: translateY(-30px) scaleX(2); }
}

/* Flame transition */
.flame-enter-active { transition: all 0.2s ease; }
.flame-leave-active { transition: all 0.3s ease; }
.flame-enter-from   { opacity: 0; transform: scaleY(0); }
.flame-leave-to     { opacity: 0; transform: scaleY(0) translateY(-10px); }

/* Cake tiers */
.cake-top {
  width: 160px;
  height: 50px;
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: filter 0.2s;
}

.cake-top::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: -4px;
  right: -4px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  opacity: 0.3;
}

.cake-middle {
  width: 200px;
  height: 60px;
  background: linear-gradient(135deg, #f8bbd0, #f48fb1);
  position: relative;
}

.cake-middle::before {
  content: '🍓 🍓 🍓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1rem;
  letter-spacing: 4px;
}

.cake-bottom {
  width: 240px;
  height: 70px;
  background: linear-gradient(135deg, #ce93d8, #ab47bc);
  border-radius: 0 0 12px 12px;
  position: relative;
}

.cake-bottom::before {
  content: '✨ Happy Birthday ✨';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  font-weight: 600;
}

/* Tap hint */
.tap-hint {
  margin-top: 24px;
  font-size: 1rem;
  color: var(--accent);
  font-weight: 600;
  animation: pulse-hint 1.2s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.97); }
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
}

.finale-name {
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 900;
  color: var(--text);
  line-height: 1.15;
  margin: 16px 0 12px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.4);
}

.finale-message {
  font-size: clamp(1rem, 3vw, 1.4rem);
  color: var(--text-muted);
  font-style: italic;
  max-width: 480px;
  line-height: 1.6;
  text-shadow: 0 1px 8px rgba(0,0,0,0.3);
}

.finale-emoji-row {
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  letter-spacing: 8px;
}

/* Message reveal transition */
.message-reveal-enter-active { transition: opacity 0.6s ease; }
.message-reveal-enter-from   { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
