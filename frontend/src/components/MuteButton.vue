<script setup>
defineProps({ muted: Boolean })
defineEmits(['toggle'])
</script>

<template>
  <button
    class="mute-btn"
    :title="muted ? 'Unmute' : 'Mute'"
    @click="$emit('toggle')"
    aria-label="Toggle music"
  >
    {{ muted ? '🔇' : '🔊' }}
  </button>
</template>

<style scoped>
.mute-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface);
  backdrop-filter: blur(8px);
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface-hover);
  transition: transform 0.15s, background 0.15s;
  cursor: pointer;
}

.mute-btn:hover {
  background: var(--surface-hover);
  transform: scale(1.1);
}

.mute-btn:active {
  transform: scale(0.95);
}
</style>
