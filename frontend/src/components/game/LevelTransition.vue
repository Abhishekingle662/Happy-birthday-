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
  1: "Balloon master! 🎈",
  2: "Gift catcher! 🎁",
  3: "Candle champion! 🕯️",
}

onMounted(() => {
  const tl = gsap.timeline()

  // Stagger star reveals
  tl.to({}, { duration: 0.3 })
  stars.value.forEach((star, i) => {
    tl.call(() => { star.visible = true }, [], i * 0.15)
  })

  // Hold, then emit done
  tl.to({}, { duration: 1.8 })
  tl.call(() => emit('done'))
})
</script>

<template>
  <div class="transition-wrap" ref="container">
    <div class="transition-content">
      <div class="level-badge">Level {{ completedLevel }} Complete!</div>
      <div class="message">{{ LEVEL_MESSAGES[completedLevel] }}</div>

      <div class="stars">
        <Transition
          v-for="star in stars"
          :key="star.id"
          name="star-pop"
        >
          <span v-if="star.visible" class="star">⭐</span>
        </Transition>
      </div>

      <div class="next-up">
        <span class="next-label">Up next</span>
        <span class="next-level">Level {{ nextLevel }}</span>
      </div>
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
}

.transition-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px;
}

.level-badge {
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.5px;
}

.message {
  font-size: 1.3rem;
  color: var(--text-muted);
}

.stars {
  display: flex;
  gap: 12px;
  font-size: 2.5rem;
  min-height: 60px;
  align-items: center;
}

.next-up {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.next-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.next-level {
  font-size: 1.4rem;
  font-weight: 700;
}

/* Star pop animation */
.star-pop-enter-active {
  animation: star-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes star-pop {
  from { transform: scale(0) rotate(-30deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}
</style>
