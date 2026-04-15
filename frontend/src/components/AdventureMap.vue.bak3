<template>
  <div class="adventure-wrapper">
    <div class="controls-hint">▲▼◀▶ or WASD · SPACE/Enter to talk</div>
    <canvas ref="canvas" class="game-canvas"></canvas>
    <div class="hud">
      <span class="hud-zone">{{ zoneNames[currentZone] }}</span>
      <span class="hud-npcs">NPCs: {{ npcsMet }}/3</span>
    </div>
    <div v-if="dialogueOpen" class="dialogue-box">
      <div class="dialogue-portrait">{{ dialogue.portrait }}</div>
      <div class="dialogue-body">
        <div class="dialogue-speaker">{{ dialogue.speaker }}</div>
        <div class="dialogue-text">{{ dialogue.text }}</div>
        <button class="dialogue-btn" @click="closeDialogue">Continue ▶</button>
      </div>
    </div>
  </div>
</template>
