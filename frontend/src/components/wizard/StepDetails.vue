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
      <label>Your message to them</label>
      <textarea
        :value="modelValue.message"
        @input="update('message', $event.target.value)"
        placeholder="e.g. Wishing you the most amazing day! 🎉"
        maxlength="200"
        rows="4"
      />
      <span class="char-count">{{ modelValue.message.length }}/200</span>
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
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}

.step-sub {
  color: var(--text-muted);
  margin-bottom: 28px;
  line-height: 1.5;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  position: relative;
}

.field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field input,
.field textarea {
  background: var(--surface);
  border: 2px solid transparent;
  border-radius: var(--radius);
  padding: 12px 16px;
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.2s;
  resize: none;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.field input::placeholder,
.field textarea::placeholder {
  color: var(--text-muted);
}

.char-count {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-align: right;
}

.step-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
</style>
