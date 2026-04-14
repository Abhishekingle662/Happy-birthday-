<script setup>
import { ref, computed } from 'vue'
import { buildShareUrl, DEFAULT_CONFIG, PRESETS, isBgDark } from '../utils/config.js'
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

// Apply theme preview to the wizard itself, including adaptive text colors
const themeStyle = computed(() => {
  const t = config.value.theme
  const dark = t.preset ? (PRESETS[t.preset]?.dark ?? true) : isBgDark(t.bg)
  return {
    '--bg':            t.bg,
    '--accent':        t.accent,
    '--text':          dark ? '#ffffff' : '#1a1a1a',
    '--text-muted':    dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
    '--surface':       dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    '--surface-hover': dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
  }
})
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
  padding: 16px 24px;
  border-bottom: 3px solid var(--accent);
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(0,0,0,0.2);
}

.logo {
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 1px;
  color: var(--accent);
  text-shadow: 2px 2px 0px rgba(0,0,0,0.5);
}

.step-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 0;
  font-size: 0.5rem;
  font-weight: 400;
  background: var(--surface);
  color: var(--text-muted);
  border: 2px solid var(--surface-hover);
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.pill.active {
  background: var(--accent);
  color: #fff;
  border-color: rgba(0,0,0,0.3);
  box-shadow: 3px 3px 0px rgba(0,0,0,0.4);
}

.pill.done {
  background: var(--surface-hover);
  color: var(--text);
  border-color: var(--accent);
}

.pill-num {
  width: 18px;
  height: 18px;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
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
