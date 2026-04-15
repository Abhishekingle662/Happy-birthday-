<script setup>
import { ref, computed } from 'vue'
import { PRESETS } from '../../utils/config.js'

const props = defineProps({ modelValue: Object })
const emit = defineEmits(['update:modelValue', 'next', 'prev'])

const showCustom = ref(props.modelValue.theme.preset === null)

function selectPreset(key) {
  showCustom.value = false
  emit('update:modelValue', {
    ...props.modelValue,
    theme: { preset: key, bg: PRESETS[key].bg, accent: PRESETS[key].accent },
  })
}

function updateCustom(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    theme: { preset: null, ...props.modelValue.theme, [field]: value },
  })
}

function openCustom() {
  showCustom.value = true
  emit('update:modelValue', {
    ...props.modelValue,
    theme: { ...props.modelValue.theme, preset: null },
  })
}

const previewStyle = computed(() => ({
  background: props.modelValue.theme.bg,
  borderColor: props.modelValue.theme.accent,
}))
</script>

<template>
  <div class="step-card card">
    <h2 class="step-title">Pick a vibe 🎨</h2>
    <p class="step-sub">Choose a preset theme or create your own color combo.</p>

    <!-- Preset grid -->
    <div class="preset-grid">
      <button
        v-for="(preset, key) in PRESETS"
        :key="key"
        class="preset-btn"
        :class="{ active: modelValue.theme.preset === key }"
        :style="{ background: preset.bg, borderColor: preset.accent }"
        @click="selectPreset(key)"
      >
        <span class="preset-dot" :style="{ background: preset.accent }"></span>
        <span class="preset-label">{{ preset.label }}</span>
      </button>
    </div>

    <!-- Custom toggle -->
    <button class="btn btn-ghost custom-toggle" @click="openCustom">
      🎛️ Custom colors
    </button>

    <!-- Custom color pickers -->
    <Transition name="fade">
      <div v-if="showCustom" class="custom-pickers">
        <div class="picker-row">
          <label>Background</label>
          <div class="picker-wrap">
            <input
              type="color"
              :value="modelValue.theme.bg"
              @input="updateCustom('bg', $event.target.value)"
            />
            <span class="hex-val">{{ modelValue.theme.bg }}</span>
          </div>
        </div>
        <div class="picker-row">
          <label>Accent</label>
          <div class="picker-wrap">
            <input
              type="color"
              :value="modelValue.theme.accent"
              @input="updateCustom('accent', $event.target.value)"
            />
            <span class="hex-val">{{ modelValue.theme.accent }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Mini preview -->
    <div class="theme-preview" :style="previewStyle">
      <span class="preview-text" :style="{ color: modelValue.theme.accent }">Preview</span>
      <span class="preview-dots">
        <span v-for="n in 3" :key="n" :style="{ background: modelValue.theme.accent }"></span>
      </span>
    </div>

    <div class="step-actions">
      <button class="btn btn-ghost" @click="$emit('prev')">← Back</button>
      <button class="btn btn-primary" @click="$emit('next')">Next: Music →</button>
    </div>
  </div>
</template>

<style scoped>
.step-card {
  width: 100%;
  max-width: 560px;
}

.step-title {
  font-size: 0.8rem;
  font-weight: 400;
  margin-bottom: 12px;
  color: var(--accent);
  text-shadow: 2px 2px 0px rgba(0,0,0,0.4);
  line-height: 1.6;
}

.step-sub {
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 2;
  font-size: 0.55rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  border-radius: 0;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 3px 3px 0px rgba(0,0,0,0.4);
}

.preset-btn:hover { box-shadow: 4px 4px 0px rgba(0,0,0,0.5); }
.preset-btn.active { border-width: 3px; box-shadow: 2px 2px 0px rgba(0,0,0,0.5); }

.preset-dot {
  width: 20px;
  height: 20px;
  border-radius: 0;
  border: 2px solid rgba(255,255,255,0.3);
}

.preset-label {
  font-size: 0.45rem;
  font-weight: 400;
  color: #fff;
  text-shadow: 1px 1px 0px rgba(0,0,0,0.7);
  text-align: center;
  line-height: 1.8;
}

.custom-toggle {
  width: 100%;
  margin-bottom: 16px;
}

.custom-pickers {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.picker-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-row label {
  font-size: 0.45rem;
  font-weight: 400;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.picker-wrap input[type="color"] {
  width: 44px;
  height: 44px;
  border: 2px solid var(--surface-hover);
  border-radius: 0;
  cursor: pointer;
  padding: 2px;
  background: var(--surface);
}

.hex-val {
  font-size: 0.45rem;
  font-family: 'Press Start 2P', monospace;
  color: var(--text-muted);
}

.theme-preview {
  border-radius: 0;
  border: 3px solid;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.3s, border-color 0.3s;
  box-shadow: 4px 4px 0px rgba(0,0,0,0.4);
}

.preview-text {
  font-weight: 400;
  font-size: 0.5rem;
  transition: color 0.3s;
  text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
  line-height: 2;
}

.preview-dots {
  display: flex;
  gap: 4px;
}

.preview-dots span {
  width: 10px;
  height: 10px;
  border-radius: 0;
  transition: background 0.3s;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
