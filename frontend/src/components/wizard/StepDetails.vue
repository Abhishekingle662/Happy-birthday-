<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue: Object })
const emit = defineEmits(['update:modelValue', 'next'])

const config = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function update(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const canProceed = computed(() => props.modelValue.name.trim().length > 0)
</script>

<template>
  <div class="step-card card">
    <h2 class="step-title">Who's the birthday star? 🌟</h2>
    <p class="step-sub">Enter their name and a personal message they'll see at the end.</p>

    <div class="field">
      <label>Birthday person's name *</label>
      <input
        type="text"
        :value="modelValue.name"
        @input="update('name', $event.target.value)"
        placeholder="e.g. Alex"
        maxlength="40"
        autofocus
      />
    </div>

    <div class="field">
      <label>Adventure character name (shown in-game)</label>
      <input
        type="text"
        :value="modelValue.recipientName"
        @input="update('recipientName', $event.target.value)"
        :placeholder="modelValue.name || 'e.g. Aria'"
        maxlength="40"
      />
    </div>

    <div class="field">
      <label>Your message to them</label>
      <textarea
        :value="modelValue.message"
        @input="update('message', $event.target.value)"
        placeholder="e.g. Wishing you the most amazing day! 🎉"
        maxlength="200"
        rows="3"
      />
      <span class="char-count">{{ modelValue.message.length }}/200</span>
    </div>

    <div class="field">
      <label>Adventure personal message (shown at the gift reveal)</label>
      <textarea
        :value="modelValue.personalMessage"
        @input="update('personalMessage', $event.target.value)"
        placeholder="e.g. Hope your day is full of surprises and new adventures!"
        maxlength="200"
        rows="3"
      />
      <span class="char-count">{{ (modelValue.personalMessage || '').length }}/200</span>
    </div>

    <div class="step-actions">
      <button class="btn btn-primary" :disabled="!canProceed" @click="$emit('next')">
        Next: Choose Theme →
      </button>
    </div>
  </div>
</template>

<style scoped>
.step-card {
  width: 100%;
  max-width: 520px;
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
  margin-bottom: 28px;
  line-height: 2;
  font-size: 0.55rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  position: relative;
}

.field label {
  font-size: 0.5rem;
  font-weight: 400;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.field input,
.field textarea {
  background: var(--surface);
  border: 2px solid var(--surface-hover);
  border-radius: 0;
  padding: 12px 16px;
  color: var(--text);
  font-size: 0.65rem;
  font-family: 'Press Start 2P', monospace;
  transition: border-color 0.2s;
  resize: none;
  line-height: 1.8;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 3px 3px 0px rgba(0,0,0,0.3);
}

.field input::placeholder,
.field textarea::placeholder {
  color: var(--text-muted);
  font-size: 0.55rem;
}

.char-count {
  font-size: 0.5rem;
  color: var(--text-muted);
  text-align: right;
}

.step-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
</style>
