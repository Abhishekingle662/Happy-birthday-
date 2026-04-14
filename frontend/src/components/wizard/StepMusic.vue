<script setup>
import { ref, computed } from 'vue'
import { BUNDLED_TRACKS } from '../../utils/config.js'

const props = defineProps({ modelValue: Object })
const emit = defineEmits(['update:modelValue', 'next', 'prev'])

const uploading = ref(false)
const uploadError = ref('')

// In dev, Vite proxies /api → backend. In prod set VITE_BACKEND_URL.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function selectTrack(id) {
  emit('update:modelValue', {
    ...props.modelValue,
    music: { type: 'bundled', src: id },
  })
}

async function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('audio/')) {
    uploadError.value = 'Please select an audio file (MP3, WAV, etc.)'
    return
  }
  uploadError.value = ''
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BACKEND_URL}/api/music`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    const { url } = await res.json()
    emit('update:modelValue', {
      ...props.modelValue,
      music: { type: 'upload', src: url },
    })
  } catch (err) {
    uploadError.value = 'Upload failed. Please try again or pick a bundled track.'
  } finally {
    uploading.value = false
  }
}

const isUpload = computed(() => props.modelValue.music.type === 'upload')
</script>

<template>
  <div class="step-card card">
    <h2 class="step-title">Set the mood 🎵</h2>
    <p class="step-sub">Pick a bundled track or upload your own MP3.</p>

    <!-- Bundled tracks -->
    <div class="track-list">
      <button
        v-for="track in BUNDLED_TRACKS"
        :key="track.id"
        class="track-btn"
        :class="{ active: modelValue.music.type === 'bundled' && modelValue.music.src === track.id }"
        @click="selectTrack(track.id)"
      >
        <span class="track-icon">🎶</span>
        <span class="track-label">{{ track.label }}</span>
        <span v-if="modelValue.music.type === 'bundled' && modelValue.music.src === track.id" class="track-check">✓</span>
      </button>
    </div>

    <!-- Upload -->
    <div class="upload-section">
      <p class="upload-label">— or upload your own —</p>
      <label class="upload-btn btn btn-ghost" :class="{ loading: uploading }">
        <span v-if="uploading">Uploading…</span>
        <span v-else-if="isUpload">✓ Custom track loaded</span>
        <span v-else>📁 Upload MP3</span>
        <input type="file" accept="audio/*" @change="handleUpload" :disabled="uploading" />
      </label>
      <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
    </div>

    <div class="step-actions">
      <button class="btn btn-ghost" @click="$emit('prev')">← Back</button>
      <button class="btn btn-primary" @click="$emit('next')">Next: Share →</button>
    </div>
  </div>
</template>

<style scoped>
.step-card {
  width: 100%;
  max-width: 520px;
}

.step-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}

.step-sub {
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.5;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.track-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
  font-weight: 500;
  border: 2px solid transparent;
  transition: background 0.15s, border-color 0.15s;
  cursor: pointer;
  text-align: left;
}

.track-btn:hover { background: var(--surface-hover); }
.track-btn.active { border-color: var(--accent); background: var(--surface-hover); }

.track-icon { font-size: 1.2rem; }
.track-label { flex: 1; }
.track-check { color: var(--accent); font-weight: 700; }

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.upload-label {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.upload-btn {
  position: relative;
  cursor: pointer;
  width: 100%;
}

.upload-btn input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.upload-btn.loading {
  opacity: 0.6;
  pointer-events: none;
}

.upload-error {
  color: #ff6b6b;
  font-size: 0.85rem;
  text-align: center;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
</style>
