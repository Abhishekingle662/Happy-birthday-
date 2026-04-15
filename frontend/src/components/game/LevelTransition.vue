<script setup>
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  completedLevel: { type: Number, required: true },
  nextLevel: { type: Number, required: true },
})
const emit = defineEmits(['done'])

const container = ref(null)
const stars = ref([...Array(5)].map((_, i) => ({ id: i, visible: false })))

const LEVEL_MESSAGES = {
  1: "Balloon master!",
  2: "Gift catcher!",
  3: "Candle champion!",
}

const LEVEL_EMOJIS = { 1: '🎈', 2: '🎁', 3: '🕯️' }

onMounted(() => {
  // Pixel-style entrance: slide in from top
  gsap.from(container.value, {
    y: -60,
    opacity: 0,
    duration: 0.4,
    ease: 'steps(6)',
  })

  const tl = gsap.timeline()

  // Stagger star reveals after entrance
  tl.to({}, { duration: 0.4 })
  stars.value.forEach((star, i) => {
    tl.call(() => { star.visible = true }, [], i * 0.18)
  })

  // Hold, then emit done
  tl.to({}, { duration: 1.8 })
  tl.call(() => emit('done'))
})
</script>

<template>
  <div class="transition-wrap" ref="container">
    <div class="transition-content">
      <div class="level-badge">
        <span class="badge-emoji">{{ LEVEL_EMOJIS[completedLevel] }}</span>
        LEVEL {{ completedLevel }} CLEAR!
      </div>
      <div class="message">{{ LEVEL_MESSAGES[completedLevel] }}</div>

      <div class="stars">
        <Transition
          v-for="star in stars"
          :key="star.id"
          name="star-pop"
        >
          <span v-if="star.visible" class="star">★</span>
        </Transition>
      </div>

      <div class="next-up">
        <span class="next-label">▶ NEXT UP</span>
        <span class="next-level">LEVEL {{ nextLevel }}</span>
      </div>

      <div class="blink-hint">GET READY…</div>
    </div>
  </div>
</template>

<style scoped>
.transition-wrap {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 31px,
      rgba(255,255,255,0.02) 31px,
      rgba(255,255,255,0.02) 32px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 31px,
      rgba(255,255,255,0.02) 31px,
      rgba(255,255,255,0.02) 32px
    );
}

.transition-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px;
  border: 3px solid var(--accent);
  box-shadow: 8px 8px 0px rgba(0,0,0,0.5);
  background: var(--surface);
  min-width: 280px;
}

.level-badge {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--accent);
  text-shadow: 3px 3px 0px rgba(0,0,0,0.5);
  letter-spacing: 1px;
  line-height: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.badge-emoji {
  font-size: 2rem;
  animation: bounce 0.5s steps(4) infinite alternate;
  display: block;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-8px); }
}

.message {
  font-size: 0.55rem;
  color: var(--text-muted);
  line-height: 2;
}

.stars {
  display: flex;
  gap: 10px;
  font-size: 1.6rem;
  min-height: 48px;
  align-items: center;
  color: var(--accent);
  text-shadow: 2px 2px 0px rgba(0,0,0,0.4);
}

.next-up {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 2px solid var(--surface-hover);
  width: 100%;
}

.next-label {
  font-size: 0.4rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
  line-height: 2;
}

.next-level {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--accent);
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
  line-height: 1.8;
}

.blink-hint {
  font-size: 0.4rem;
  color: var(--text-muted);
  animation: blink 1s steps(1) infinite;
  line-height: 2;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* Star pop — pixel stepped animation */
.star-pop-enter-active {
  animation: star-pop 0.3s steps(4) forwards;
}

@keyframes star-pop {
  0%   { transform: scale(0) translateY(8px); opacity: 0; }
  50%  { transform: scale(1.4) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
</style>
