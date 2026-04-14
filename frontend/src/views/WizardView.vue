<script setup>
import { ref, computed } from 'vue'
import { buildShareUrl, DEFAULT_CONFIG, PRESETS } from '../utils/config.js'
import StepDetails from '../components/wizard/StepDetails.vue'
import StepTheme from '../components/wizard/StepTheme.vue'
import StepMusic from '../components/wizard/StepMusic.vue'
import StepShare from '../components/wizard/StepShare.vue'

const STEPS = ['Details', 'Theme', 'Music', 'Share']
const step = ref(0)

const config = ref({
  name: '',
  message: '',
  theme: { preset: 'classic', bg: PRESETS.classic.bg, accent: PRESETS.classic.accent },
  music: { type: 'bundled', src: 'track1' },
})

const shareUrl = computed(() => buildShareUrl(config.value))

function next() { if (step.value < STEPS.length - 1) step.value++ }
function prev() { if (step.value > 0) step.value-- }

// Apply theme preview to the wizard itself
const themeStyle = computed(() => ({
  '--bg': config.value.theme.bg,
  '--accent': config.value.theme.accent,
}))
</script>

<template>
  <div class="wizard-wrap" :style="themeStyle">
    <!-- Header -->
    <header class="wizard-header">
      <div class="logo">🎂 BirthdayQuest</div>
      <div class="step-pills">
        <span
          v-for="(label, i) in STEPS"
          :key="i"
          class="pill"
          :class="{ active: i === step, done: i < step }"
        >
          <span class="pill-num">{{ i < step ? '✓' : i + 1 }}</span>
          <span class="pill-label">{{ label }}</span>
        </span>
      </div>
    </header>

    <!-- Step content -->
    <main class="wizard-main">
      <Transition name="slide" mode="out-in">
        <StepDetails v-if="step === 0" v-model="config" @next="next" />
        <StepTheme   v-else-if="step === 1" v-model="config" @next="next" @prev="prev" />
        <StepMusic   v-else-if="step === 2" v-model="config" @next="next" @prev="prev" />
        <StepShare   v-else-if="step === 3" :config="config" :share-url="shareUrl" @prev="prev" />
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.wizard-wrap {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  transition: background 0.4s ease;
}

.wizard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 1px solid var(--surface);
  flex-wrap: wrap;
  gap: 16px;
}

.logo {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.step-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--surface);
  color: var(--text-muted);
  transition: background 0.2s, color 0.2s;
}

.pill.active {
  background: var(--accent);
  color: #fff;
}

.pill.done {
  background: var(--surface-hover);
  color: var(--text);
}

.pill-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.wizard-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to   { opacity: 0; transform: translateX(-30px); }
</style>
