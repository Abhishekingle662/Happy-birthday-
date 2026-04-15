<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  recipientName: { type: String, default: 'Aria' },
  personalMessage: { type: String, default: 'Hope your day is full of surprises and new adventures!' }
})

const emit = defineEmits(['complete'])

// --- 1. Audio System ---
let audioCtx: AudioContext | null = null
function initAudio() {
  if (!audioCtx) audioCtx = new window.AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

function playSFX(freq: number, duration: number, type: OscillatorType = 'square', vol = 0.2) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

function playFootstep() { playSFX(150, 0.05, 'square', 0.05); setTimeout(() => playSFX(200, 0.05, 'square', 0.02), 50) }
function playClue() {
  playSFX(440, 0.1, 'sine', 0.1); setTimeout(() => playSFX(880, 0.2, 'sine', 0.1), 100)
}
function playGift() {
  playSFX(523.25, 0.1, 'square'); setTimeout(() => playSFX(659.25, 0.1, 'square'), 100)
  setTimeout(() => playSFX(783.99, 0.3, 'square'), 200)
}

// --- 2. Map & Zones ---
// Legend: 0:Grass, 1:Path, 2:Tree, 3:HouseWall, 4:HouseRoof, 5:Water, 6:Fence, 7:Flower, 8:Market, 9:Gift
const mapTiles = [
  "2222222222222222222222222222222222222222",
  "2000000022200000000000020000000000000002",
  "2000000022200000000000020000000009000002",
  "2022222022200000000000020000000000000002",
  "2044446022200000002222220000000000000002",
  "2033336022222022222222221111110000000002",
  "2033336000000000000000000000010000000002",
  "2011111111111111111111111111112222200002",
  "2010000000000000000000100000002000000002",
  "2010000000000000000000100000002000888002",
  "2010000007770000770000100000002000888002",
  "2010000007770000770000100000002000111002",
  "2010000000000000000000111111111111111002",
  "2010000000000000000000100000002000000002",
  "2010222000000000000000100000002000000002",
  "2010222005555555550000100000002000000002",
  "2010222005555555550000100000002222222222",
  "2010000000002200000000100000000000000002",
  "2010000000002200000000100000000000000002",
  "2011111111111111111111100000000000000002",
  "2000000000000000000000000000000000000002",
  "2000000000000000000000000000000000000002",
  "2000000000000000000000002222222222222222",
  "2222222222000000222222222222222222222222",
  "2222222222222222222222222222222222222222",
  "2222222222222222222222222222222222222222",
  "2222222222222222222222222222222222222222",
  "2222222222222222222222222222222222222222",
  "2222222222222222222222222222222222222222",
  "2222222222222222222222222222222222222222"
]
const TILE_SIZE = 32
const COLS = 40
const ROWS = 30

const solidTiles = ['2', '3', '5', '6']

const zones = [
  { name: 'HOME', x: 0, y: 0, w: 15, h: 10 },
  { name: 'FLOWER GARDEN', x: 10, y: 8, w: 15, h: 15 },
  { name: 'MARKET STREET', x: 25, y: 8, w: 15, h: 12 },
  { name: 'HIDDEN GROVE', x: 20, y: 0, w: 20, h: 8 }
]

function getZone(x: number, y: number) {
  for (const z of zones) {
    if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z.name
  }
  return 'TOWN RESIDENTIAL'
}

const currentZone = ref('TOWN RESIDENTIAL')
const showZoneLabel = ref(false)

// --- 3. Clues & NPCs ---
const clues = ref([
  { id: 'mom', text: 'Bloom where the roses grow.', unlocked: false },
  { id: 'gardener', text: 'Where coins jingle and gifts are sold.', unlocked: false },
  { id: 'merchant', text: 'The old fountain holds a secret to the grove.', unlocked: false },
  { id: 'kid', text: 'Behind the ancient oak in the north garden.', unlocked: false }
])

const unlockedClues = ref(0)
watch(clues, (newClues) => {
  unlockedClues.value = newClues.filter(c => c.unlocked).length
}, { deep: true })

const npcHints: Record<string, string> = {
  mom: "your Mom back in Town Residential",
  gardener: "the Gardener down in the Flower Garden",
  merchant: "the Merchant over at Market Street",
  kid: "the kid by the fountain near the Hidden Grove"
}

function getDynamicHint(myId: string) {
  const missing = clues.value.filter(c => !c.unlocked && c.id !== myId)
  if (missing.length === 0) {
    return "You have all the clues! Head to the Hidden Grove to open your gift!"
  }
  const target = missing[Math.floor(Math.random() * missing.length)]
  return `Maybe try talking to ${npcHints[target.id]} next!`
}

const npcs = [
  { id: 'mom', x: 5, y: 6, color: '#20B2AA', hair: '#8B4513', name: 'Mom', getDialogue: () => {
      const unlocked = clues.value.find(c => c.id === 'mom')?.unlocked
      if (unlocked) return [`Happy Birthday again, ${props.recipientName}!`, getDynamicHint('mom')]
      return [
        `Happy Birthday, ${props.recipientName}! ðŸŒ¸ The garden's roses hold a secretâ€¦`,
        getDynamicHint('mom')
      ]
    }
  },
  { id: 'gardener', x: 18, y: 11, color: '#6B8E23', hair: '#888', name: 'Gardener', getDialogue: () => {
      const unlocked = clues.value.find(c => c.id === 'gardener')?.unlocked
      if (unlocked) return [`Enjoy your day, ${props.recipientName}!`, getDynamicHint('gardener')]
      return [
        `Hello ${props.recipientName}! Happy birthday! ðŸŒ¿ I hear coins jingle where gifts are sold.`,
        getDynamicHint('gardener')
      ]
    }
  },
  { id: 'merchant', x: 30, y: 12, color: '#FF8C00', hair: '#222', name: 'Merchant', getDialogue: () => {
      const unlocked = clues.value.find(c => c.id === 'merchant')?.unlocked
      if (unlocked) return [`Lots of good deals today!`, getDynamicHint('merchant')]
      return [
        `Happy birthday ${props.recipientName}! ðŸ›’ The old fountain holds a secret to the grove.`,
        getDynamicHint('merchant')
      ]
    }
  },
  { id: 'kid', x: 34, y: 6, color: '#1E90FF', hair: '#FFD700', name: 'Fountain Kid', getDialogue: () => {
      const unlocked = clues.value.find(c => c.id === 'kid')?.unlocked
      if (unlocked) return [`This fountain is awesome!`, getDynamicHint('kid')]
      return [
        `Hey ${props.recipientName}, happy birthday! ðŸŒ³ The Hidden Grove is behind the big oak!`,
        getDynamicHint('kid')
      ]
    }
  },
  { id: 'gift', x: 33, y: 2, color: '#FFD700', hair: '#FF0000', name: 'Mystery Gift', getDialogue: () => {
      if (unlockedClues.value < 4) {
        return ["ðŸ”’ The gift is still lockedâ€¦ Find all 4 clues from your friends first!"]
      } else {
        return [
          "ðŸŽ‰ MYSTERY GIFT! ðŸŽ‰",
          `Happy Birthday, ${props.recipientName}!`,
          "Your friends are all here for a surprise party!",
          "Your Mystery Gift is a cute baby Mystimon â€” your new loyal companion! ðŸ¾",
          props.personalMessage
        ]
      }
    }
  }
]

const dialogueOpen = ref(false)
const dialogueText = ref('')
const dialogueSpeaker = ref('')
const dialogueBlocking = ref(false)
let dialogueLines: string[] = []
let dialogueLineIndex = 0
let giftTriggered = false
let dialogueAutoHideTimer: number | null = null

function clearDialogueAutoHideTimer() {
  if (dialogueAutoHideTimer !== null) {
    window.clearTimeout(dialogueAutoHideTimer)
    dialogueAutoHideTimer = null
  }
}

function closeDialogue() {
  clearDialogueAutoHideTimer()
  dialogueOpen.value = false
  dialogueBlocking.value = false
}

function openDialogue(npc: any) {
  initAudio()
  clearDialogueAutoHideTimer()
  dialogueLines = npc.getDialogue()
  dialogueSpeaker.value = npc.name
  dialogueLineIndex = 0
  giftTriggered = false

  // Make all dialogues block movement so the user can read them and dismiss manually
  dialogueBlocking.value = true

  if (npc.id !== 'gift' && !clues.value.find(c => c.id === npc.id)?.unlocked) {
    const clue = clues.value.find(c => c.id === npc.id)
    if (clue) clue.unlocked = true
    playClue()
  } else if (npc.id === 'gift' && unlockedClues.value === 4) {
    playGift()
    giftTriggered = true
  }

  dialogueText.value = dialogueLines[0]
  dialogueOpen.value = true
}

function nextDialogue() {
  initAudio()

  dialogueLineIndex++
  if (dialogueLineIndex < dialogueLines.length) {
    dialogueText.value = dialogueLines[dialogueLineIndex]
  } else {
    closeDialogue()
    if (giftTriggered) {
      setTimeout(() => emit('complete'), 2200)
    }
  }
}

// --- 4. Player State ---
const player = {
  tx: 4, ty: 7, // tile coords
  x: 4 * TILE_SIZE, y: 7 * TILE_SIZE, // pixel coords
  dx: 0, dy: 0, // direction facing
  dir: 'down',
  moving: false,
  walkTimer: 0
}

const keys = { w: false, a: false, s: false, d: false }
let moveDelayTimer = 0

// --- 5. Game Loop & Rendering ---
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let lastTime = 0

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    triggerAction()
    return
  }
  if (dialogueOpen.value && dialogueBlocking.value) return
  if (['ArrowUp', 'w', 'W'].includes(e.key)) { keys.w = true; e.preventDefault() }
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.a = true; e.preventDefault() }
  if (['ArrowDown', 's', 'S'].includes(e.key)) { keys.s = true; e.preventDefault() }
  if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.d = true; e.preventDefault() }
  initAudio()
}

function handleKeyUp(e: KeyboardEvent) {
  if (['ArrowUp', 'w', 'W'].includes(e.key)) keys.w = false
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.a = false
  if (['ArrowDown', 's', 'S'].includes(e.key)) keys.s = false
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.d = false
}

// Touch/Mobile controls
function startMove(k: 'w'|'a'|'s'|'d') {
  if (dialogueOpen.value && dialogueBlocking.value) return
  keys[k] = true
  initAudio()
}
function stopMove(k: 'w'|'a'|'s'|'d') {
  keys[k] = false
}
function triggerAction() {
  if (dialogueOpen.value) {
    nextDialogue()
    return
  }

  checkInteract()
  initAudio()
}

function checkInteract() {
  let inx = player.tx + (player.dir === 'left' ? -1 : player.dir === 'right' ? 1 : 0)
  let iny = player.ty + (player.dir === 'up' ? -1 : player.dir === 'down' ? 1 : 0)
  for (const npc of npcs) {
    if (npc.x === inx && npc.y === iny) {
      openDialogue(npc)
      return
    }
  }
}

function update(dt: number) {
  if (dialogueOpen.value && dialogueBlocking.value) return

  if (player.moving) {
    player.walkTimer += dt
    const duration = 133 // ~8 frames at 60fps
    const progress = Math.min(player.walkTimer / duration, 1)
    player.x = (player.tx - player.dx) * TILE_SIZE + (player.dx * TILE_SIZE * progress)
    player.y = (player.ty - player.dy) * TILE_SIZE + (player.dy * TILE_SIZE * progress)
    
    if (progress >= 1) {
      player.moving = false
      player.x = player.tx * TILE_SIZE
      player.y = player.ty * TILE_SIZE
      const nZone = getZone(player.tx, player.ty)
      if (nZone !== currentZone.value) {
        currentZone.value = nZone
        showZoneLabel.value = true
        setTimeout(() => showZoneLabel.value = false, 2000)
      }
    }
  } else {
    moveDelayTimer -= dt
    if (moveDelayTimer <= 0) {
      let dx = 0, dy = 0, dir = player.dir
      if (keys.w) { dy = -1; dir = 'up' }
      else if (keys.s) { dy = 1; dir = 'down' }
      else if (keys.a) { dx = -1; dir = 'left' }
      else if (keys.d) { dx = 1; dir = 'right' }

      if (dx !== 0 || dy !== 0) {
        player.dir = dir
        const nx = player.tx + dx
        const ny = player.ty + dy
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
          const tile = mapTiles[ny][nx]
          const hitNpc = npcs.find(n => n.x === nx && n.y === ny)
          if (!solidTiles.includes(tile) && !hitNpc) {
            player.tx = nx
            player.ty = ny
            player.dx = dx
            player.dy = dy
            player.moving = true
            player.walkTimer = 0
            moveDelayTimer = 150
            playFootstep()
          }
        }
      }
    }
  }
}

function drawSprite(t: CanvasRenderingContext2D, x: number, y: number, color: string, hair: string, dir: string, moving: boolean) {
  const oy = moving && (Date.now() % 300 > 150) ? -2 : 0
  const px = x + 6
  const py = y + 4 + oy
  // body
  t.fillStyle = color
  t.fillRect(px, py + 8, 20, 12)
  // head
  t.fillStyle = '#FDDBB4'
  t.fillRect(px + 2, py, 16, 12)
  // hair
  t.fillStyle = hair
  t.fillRect(px + 2, py - 4, 16, 6)
  if (dir === 'down' || dir === 'right') t.fillRect(px + 14, py, 4, 8)
  if (dir === 'down' || dir === 'left') t.fillRect(px + 2, py, 4, 8)
  
  // eyes
  t.fillStyle = '#000'
  if (dir === 'down') {
    t.fillRect(px + 6, py + 4, 2, 2)
    t.fillRect(px + 12, py + 4, 2, 2)
  } else if (dir === 'right') {
    t.fillRect(px + 14, py + 4, 2, 2)
  } else if (dir === 'left') {
    t.fillRect(px + 4, py + 4, 2, 2)
  }
}

function drawGift(t: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  if (glow) {
    const pulse = Math.sin(Date.now() / 300) * 0.4 + 0.6
    t.shadowBlur = 20 * pulse
    t.shadowColor = '#FFD700'
  } else {
    t.shadowBlur = 0
  }
  t.fillStyle = '#FFD700'
  t.fillRect(x + 4, y + 8, 24, 20)
  t.fillStyle = '#FF0000'
  t.fillRect(x + 14, y + 8, 4, 24)
  t.fillRect(x + 4, y + 16, 24, 4)
  t.shadowBlur = 0
}

function render() {
  if (!canvas.value || !ctx) return
  const t = ctx

  let camX = player.x - canvas.value.width / 2 + TILE_SIZE / 2
  let camY = player.y - canvas.value.height / 2 + TILE_SIZE / 2
  camX = Math.max(0, Math.min(camX, COLS * TILE_SIZE - canvas.value.width))
  camY = Math.max(0, Math.min(camY, ROWS * TILE_SIZE - canvas.value.height))

  t.fillStyle = '#000'
  t.fillRect(0, 0, canvas.value.width, canvas.value.height)
  t.save()
  t.translate(-Math.floor(camX), -Math.floor(camY))

  const startC = Math.max(0, Math.floor(camX / TILE_SIZE))
  const endC = Math.min(COLS, Math.ceil((camX + canvas.value.width) / TILE_SIZE))
  const startR = Math.max(0, Math.floor(camY / TILE_SIZE))
  const endR = Math.min(ROWS, Math.ceil((camY + canvas.value.height) / TILE_SIZE))

  for (let r = startR; r < endR; r++) {
    for (let c = startC; c < endC; c++) {
      const tile = mapTiles[r][c]
      const px = c * TILE_SIZE
      const py = r * TILE_SIZE
      
      t.fillStyle = (c+r)%2===0 ? '#5a8a34' : '#4e7a2c'
      t.fillRect(px, py, TILE_SIZE, TILE_SIZE)

      if (tile === '1') {
        t.fillStyle = '#c8a86e'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.strokeStyle = '#b89658'
        t.lineWidth = 1
        t.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      } else if (tile === '2') {
        t.fillStyle = '#5a3010'
        t.fillRect(px + 12, py + 16, 8, 16)
        t.fillStyle = '#2d6e1a'
        t.beginPath()
        t.arc(px + 16, py + 12, 12, 0, Math.PI * 2)
        t.fill()
        t.fillStyle = '#3a8a25'
        t.beginPath()
        t.arc(px + 10, py + 8, 8, 0, Math.PI * 2)
        t.fill()
      } else if (tile === '3') {
        t.fillStyle = '#b84a2e'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#a03a20'
        t.fillRect(px, py + 15, TILE_SIZE, 2)
        t.fillStyle = '#d4a060'
        t.fillRect(px + 8, py + 8, 16, 16)
      } else if (tile === '4') {
        t.fillStyle = '#555566'
        t.beginPath()
        t.moveTo(px + 16, py)
        t.lineTo(px + TILE_SIZE, py + TILE_SIZE)
        t.lineTo(px, py + TILE_SIZE)
        t.fill()
      } else if (tile === '5') {
        const wave = Math.sin(Date.now() / 300 + px) * 2
        t.fillStyle = '#3a8ac8'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#5aaae8'
        t.fillRect(px + 4, py + 8 + wave, 24, 4)
      } else if (tile === '6') {
        t.fillStyle = '#8a5a30'
        t.fillRect(px + 12, py + 4, 8, 24)
        t.fillRect(px, py + 12, 32, 6)
      } else if (tile === '7') {
        t.fillStyle = '#5a8a34'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#ff69b4'
        t.fillRect(px + 6, py + 6, 4, 4)
        t.fillStyle = '#ffd700'
        t.fillRect(px + 20, py + 18, 4, 4)
      } else if (tile === '8') {
        t.fillStyle = '#f0c030'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.strokeStyle = '#333'
        t.strokeRect(px + 2, py + 2, 28, 28)
      }
    }
  }

  for (const npc of npcs) {
    if (npc.id === 'gift') {
      drawGift(t, npc.x * TILE_SIZE, npc.y * TILE_SIZE, unlockedClues.value === 4)
    } else {
      drawSprite(t, npc.x * TILE_SIZE, npc.y * TILE_SIZE, npc.color, npc.hair, 'down', false)
      const dist = Math.abs(npc.x - player.tx) + Math.abs(npc.y - player.ty)
      if (dist <= 2) {
        const bob = Math.sin(Date.now() / 150) * 3
        t.fillStyle = '#fff'
        t.beginPath()
        t.arc(npc.x * TILE_SIZE + 16, npc.y * TILE_SIZE - 6 + bob, 6, 0, Math.PI * 2)
        t.fill()
        t.fillStyle = '#000'
        t.font = "12px 'Courier New'"
        t.fillText("!", npc.x * TILE_SIZE + 13, npc.y * TILE_SIZE - 2 + bob)
      }
    }
  }

  drawSprite(t, player.x, player.y, '#E0507A', '#7030A0', player.dir, player.moving)

  t.restore()
}

function loop(time: number) {
  if (lastTime === 0) lastTime = time
  const dt = time - lastTime
  lastTime = time
  update(dt)
  render()
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  if (canvas.value) {
    canvas.value.width = 640
    canvas.value.height = 480
    ctx = canvas.value.getContext('2d')
    if (ctx) ctx.imageSmoothingEnabled = false
  }
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  clearDialogueAutoHideTimer()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  cancelAnimationFrame(raf)
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close()
  }
})
</script>

<template>
  <div class="adventure-wrapper">
    <div class="controls-hint">â–²â–¼â—€â–¶ or WASD Â· SPACE/Enter to talk</div>
    <canvas ref="canvas" class="game-canvas"></canvas>
    
    <div class="hud">
      <div class="hud-clues">Clues: {{ unlockedClues }}/4</div>
      <div v-for="c in clues" :key="c.id" class="clue-item" :class="{ locked: !c.unlocked }">
         <span class="bullet" :class="{ check: c.unlocked }"></span> {{ c.unlocked ? c.text : '(locked)' }}
      </div>
    </div>
    
    <div class="zone-overlay" :class="{ visible: showZoneLabel }">
      {{ currentZone }}
    </div>

    <div v-if="dialogueOpen" class="dialogue-overlay centered-dialogue">
      <div class="dialogue-box">
        <div class="dialogue-speaker">{{ dialogueSpeaker }}</div>
        <div class="dialogue-text">{{ dialogueText }}</div>
        <button class="dialogue-btn" @click="nextDialogue">Continue ▶</button>
      </div>
    </div>

    <!-- Mobile Virtual Controls -->
    <div class="mobile-controls">
      <div class="d-pad">
        <button class="d-btn up" @touchstart.prevent="startMove('w')" @touchend.prevent="stopMove('w')" @touchcancel.prevent="stopMove('w')" @mousedown.prevent="startMove('w')" @mouseup.prevent="stopMove('w')" @mouseleave.prevent="stopMove('w')">▲</button>
        <button class="d-btn left" @touchstart.prevent="startMove('a')" @touchend.prevent="stopMove('a')" @touchcancel.prevent="stopMove('a')" @mousedown.prevent="startMove('a')" @mouseup.prevent="stopMove('a')" @mouseleave.prevent="stopMove('a')">◀</button>
        <button class="d-btn right" @touchstart.prevent="startMove('d')" @touchend.prevent="stopMove('d')" @touchcancel.prevent="stopMove('d')" @mousedown.prevent="startMove('d')" @mouseup.prevent="stopMove('d')" @mouseleave.prevent="stopMove('d')">▶</button>
        <button class="d-btn down" @touchstart.prevent="startMove('s')" @touchend.prevent="stopMove('s')" @touchcancel.prevent="stopMove('s')" @mousedown.prevent="startMove('s')" @mouseup.prevent="stopMove('s')" @mouseleave.prevent="stopMove('s')">▼</button>
      </div>
      <div class="action-btns">
        <button class="action-btn a-btn" @touchstart.prevent="triggerAction" @mousedown.prevent="triggerAction">SPACE</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.adventure-wrapper {
  position: relative;
  width: 100%;
  max-width: 640px;
  aspect-ratio: 4 / 3;
  margin: 0 auto;
  background: #000;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  border: 4px solid #fff;
  border-radius: 4px;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.controls-hint {
  position: absolute;
  top: -30px;
  width: 100%;
  text-align: center;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  color: var(--text-muted, #ccc);
}

.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  width: 260px;
  border: 2px solid #555;
}

.hud-clues {
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 8px;
}

.clue-item {
  color: #fff;
  margin: 6px 0;
  font-size: 12px;
  display: flex;
  align-items: flex-start;
  line-height: 1.2;
}

.clue-item.locked {
  color: #888;
}

.bullet {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
  border: 1px solid #aaa;
  border-radius: 50%;
  background: #222;
}

.bullet.check {
  border-color: #0f0;
  background: #0f0;
}

.zone-overlay {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 12px 24px;
  border: 2px solid #fff;
  border-radius: 4px;
  font-size: 20px;
  font-family: 'Courier New', Courier, monospace;
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}

.zone-overlay.visible {
  opacity: 1;
}

.dialogue-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  display: flex;
  justify-content: center;
  z-index: 70;
}

.dialogue-overlay.centered-dialogue {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  bottom: auto;
  width: min(80vw, 520px);
  padding: 0;
  justify-content: center;
  z-index: 80;
}

.centered-dialogue .dialogue-box {
  width: 100%;
  background: rgba(255, 255, 255, 0.94);
  border-width: 4px;
  padding: 12px 16px;
}

.dialogue-box {
  background: #fff;
  border: 8px solid #333;
  width: 100%;
  padding: 16px;
  font-family: 'Courier New', Courier, monospace;
  position: relative;
  box-shadow: 4px 4px 0 #000;
}

.dialogue-speaker {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 1px 1px 0 #333, -1px -1px 0 #333, 1px -1px 0 #333, -1px 1px 0 #333;
  margin-bottom: 8px;
}

.dialogue-text {
  font-size: 16px;
  line-height: 1.5;
  color: #000;
  min-height: 48px;
}

.dialogue-btn {
  margin-top: 12px;
  float: right;
  background: #FFD700;
  border: 2px solid #333;
  padding: 6px 12px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  outline: none;
}

.dialogue-btn:hover {
  background: #ffec8b;
}

/* Mobile Controls */
.mobile-controls {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.d-pad, .action-btns {
  pointer-events: auto;
  position: absolute;
  bottom: 50%;
  transform: translateY(50%);
}

.d-pad {
  left: 30px;
  width: 120px;
  height: 120px;
}

.d-btn {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  color: rgba(255,255,255,0.8);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  backdrop-filter: blur(2px);
}

.d-btn:active {
  background: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.d-btn.up { top: 0; left: 38px; }
.d-btn.left { top: 38px; left: 0; }
.d-btn.right { top: 38px; left: 76px; }
.d-btn.down { top: 76px; left: 38px; }

.action-btns {
  right: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  color: #fff;
  font-weight: bold;
  font-family: Arial, sans-serif;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  backdrop-filter: blur(2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.action-btn:active {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0.95);
}

/* Touch-device layout and controls */
@media (hover: none) and (pointer: coarse) {
  
  
  .controls-hint {
    display: none;
  }
  .adventure-wrapper {
    max-width: none;
    margin: 0;
    border: none;
    border-radius: 0;
    aspect-ratio: unset;
    box-shadow: none;
    z-index: 40;
  }
  .game-canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .mobile-controls {
    display: block;
  }
  .hud {
    position: absolute;
    top: 12px;
    left: 12px;
    transform: none;
    width: min(58vw, 340px);
    max-height: 40dvh;
    overflow: auto;
    font-size: 12px;
    padding: 8px 12px;
    border: none;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: 60;
  }
  .dialogue-overlay {
    bottom: 16px;
    z-index: 70;
  }
  .dialogue-overlay.centered-dialogue {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(85vw, 360px);
    bottom: auto;
    z-index: 80;
  }
}
</style>

