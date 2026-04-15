<script setup>
import { ref, computed } from 'vue'
import { PRESETS } from '../../utils/config.js'

const props = defineProps({
  config: Object,
  shareUrl: String,
})
defineEmits(['prev'])

const copied = ref(false)

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(props.shareUrl)
    copied.value = true
    setTimeout(() => (copied.value = false), 2500)
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea')
    el.value = props.shareUrl
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => (copied.value = false), 2500)
  }
}

const previewStyle = computed(() => ({
  background: props.config.theme.bg,
  borderColor: props.config.theme.accent,
  color: '#fff',
}))

const accentStyle = computed(() => ({ color: props.config.theme.accent }))

function openPreview() {
  window.open(props.shareUrl, '_blank')
}
</script>

<template>
  <div class="step-card card">
    <h2 class="step-title">Ready to send! 🚀</h2>
    <p class="step-sub">Share this link with <strong>{{ config.name }}</strong> — they'll play through 3 levels to unlock their birthday surprise!</p>

    <!-- Summary card -->
    <div class="summary-card" :style="previewStyle">
      <div class="summary-name" :style="accentStyle">🎂 Happy Birthday, {{ config.name }}!</div>
      <div class="summary-meta">
        <span>Theme: {{ config.theme.preset ? PRESETS[config.theme.preset]?.label : 'Custom' }}</span>
        <span>Music: {{ config.music.type === 'upload' ? 'Custom track' : 'Bundled' }}</span>
      </div>
      <div v-if="config.message" class="summary-message">"{{ config.message }}"</div>
    </div>

    <!-- URL box -->
    <div class="url-box">
      <input type="text" :value="shareUrl" readonly class="url-input" />
      <button class="btn btn-primary copy-btn" @click="copyUrl">
        {{ copied ? '✓ Copied!' : '📋 Copy' }}
      </button>
    </div>

    <!-- Actions -->
    <div class="share-actions">
      <button class="btn btn-ghost" @click="openPreview">
        👁️ Preview game
      </button>
    </div>

    <div class="step-actions">
      <button class="btn btn-ghost" @click="$emit('prev')">← Back</button>
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

.step-sub strong {
  color: var(--text);
}

.summary-card {
  border-radius: 0;
  border: 3px solid;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: background 0.3s, border-color 0.3s;
  box-shadow: 6px 6px 0px rgba(0,0,0,0.4);
}

.summary-name {
  font-size: 0.6rem;
  font-weight: 400;
  line-height: 1.8;
  text-shadow: 1px 1px 0px rgba(0,0,0,0.4);
}

.summary-meta {
  display: flex;
  gap: 12px;
  font-size: 0.4rem;
  opacity: 0.75;
  flex-wrap: wrap;
  line-height: 2;
}

.summary-message {
  opacity: 0.85;
  font-size: 0.45rem;
  margin-top: 4px;
  line-height: 2;
  border-left: 2px solid rgba(255,255,255,0.3);
  padding-left: 8px;
}

.url-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.url-input {
  flex: 1;
  background: var(--surface);
  border: 2px solid var(--surface-hover);
  border-radius: 0;
  padding: 10px 14px;
  color: var(--text);
  font-size: 0.4rem;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 2;
}

.url-input:focus { outline: none; border-color: var(--accent); }

.copy-btn {
  white-space: nowrap;
  flex-shrink: 0;
}

.share-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.share-actions .btn {
  flex: 1;
}

.step-actions {
  display: flex;
}
</style>
