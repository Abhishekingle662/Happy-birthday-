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
  border-radius: 0;
  background: var(--surface);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--accent);
  box-shadow: 3px 3px 0px rgba(0,0,0,0.5);
  transition: background 0.15s;
  cursor: pointer;
}

.mute-btn:hover {
  background: var(--surface-hover);
}

.mute-btn:active {
  transform: translate(3px, 3px);
  box-shadow: none;
}
</style>
