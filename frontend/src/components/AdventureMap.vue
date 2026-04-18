<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

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

// --- 2. Maps & Levels ---
// Legend: 0:Grass, 1:Path, 2:Tree, 3:HouseWall, 4:HouseRoof, 5:Water, 6:Fence,
// 7:Flower, 8:Market, 9:Gift, H:IndoorFloor, R:Rug, C:Cloud Floor,
// V:Sky Void, W:Hidden Wind Path
const LEVELS = {
  town: {
    id: 'town',
    cols: 40,
    rows: 30,
    tiles: [
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
    ],
    solidTiles: ['2', '3', '5', '6'],
    warps: [
      { tx: 4, ty: 7, targetLevel: 'house', targetX: 7, targetY: 9, dir: 'up' }, // Enter house
      { tx: 23, ty: 19, targetLevel: 'sky', targetX: 2, targetY: 10, dir: 'right', requires: 'townGateUnlocked' } // Gate to sky
    ]
  },
  house: {
    id: 'house',
    cols: 15,
    rows: 12,
    tiles: [
      "444444444444444",
      "4222HHHHHHH2224",
      "4222HHHHHHH2224",
      "4HHHHHHHHHHHHH4",
      "4HHHHHHHHHHHHH4",
      "4HHHHHHHHHHHHH4",
      "4HHHHHHHHHHHHH4",
      "433HHHHHHHHH334",
      "443HHHHHHHHH344",
      "4444444RR444444",
      "4444444RR444444",
      "444444444444444"
    ],
    solidTiles: ['4', '2', '3'],
    warps: [
      { tx: 7, ty: 10, targetLevel: 'town', targetX: 4, targetY: 8, dir: 'down', requires: 'outfitReady' }, // Exit to Town
      { tx: 8, ty: 10, targetLevel: 'town', targetX: 4, targetY: 8, dir: 'down', requires: 'outfitReady' }
    ]
  },
  sky: {
    id: 'sky',
    cols: 20,
    rows: 12,
    tiles: [
      'VVVVVVVVVVVVVVVVVVVV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCWWWWWWCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VCCCCCCVVVVVVCCCCCCV',
      'VVVVVVVVVVVVVVVVVVVV'
    ],
    solidTiles: ['V'],
    warps: [
      { tx: 2, ty: 10, targetLevel: 'town', targetX: 23, targetY: 20, dir: 'left', requires: 'skyExitUnlocked' }
    ]
  }
}

const currentLevelId = ref<'town'|'house'|'sky'>('house')
const isGameLoaded = ref(false)

const mapTiles = computed(() => LEVELS[currentLevelId.value].tiles)
const solidTiles = computed(() => LEVELS[currentLevelId.value].solidTiles)
const COLS = computed(() => LEVELS[currentLevelId.value].cols)
const ROWS = computed(() => LEVELS[currentLevelId.value].rows)
const warps = computed(() => LEVELS[currentLevelId.value].warps || [])
const TILE_SIZE = 32
const BASE_VIEW_W = 640
const BASE_VIEW_H = 480

function getLevelFloorColor() {
  if (currentLevelId.value === 'sky') return '#8fc3ff'
  if (currentLevelId.value === 'house') return '#5c4033'
  return '#5a8a34'
}

const zonesByLevel: Record<string, { name: string, x: number, y: number, w: number, h: number }[]> = {
  town: [
    { name: 'HOME', x: 0, y: 0, w: 15, h: 10 },
    { name: 'FLOWER GARDEN', x: 10, y: 8, w: 15, h: 15 },
    { name: 'MARKET STREET', x: 25, y: 8, w: 15, h: 12 },
    { name: 'HIDDEN GROVE', x: 20, y: 0, w: 20, h: 8 },
    { name: 'SKY GATE', x: 20, y: 18, w: 8, h: 4 }
  ],
  sky: [
    { name: 'CLOUD ENTRANCE', x: 0, y: 8, w: 8, h: 4 },
    { name: 'WIND OBSERVATORY', x: 0, y: 1, w: 8, h: 7 },
    { name: 'SKY BRIDGE', x: 7, y: 2, w: 6, h: 3 },
    { name: 'RUINS OF AERIA', x: 13, y: 1, w: 7, h: 10 }
  ],
  house: []
}

function getZone(x: number, y: number) {
  if (currentLevelId.value === 'house') return `${props.recipientName.toUpperCase()}'S BEDROOM`
  const levelZones = zonesByLevel[currentLevelId.value] || []
  for (const z of levelZones) {
    if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z.name
  }
  if (currentLevelId.value === 'sky') return 'SKY RUINS'
  return 'TOWN RESIDENTIAL'
}

const currentZone = ref(`${props.recipientName.toUpperCase()}'S BEDROOM`)
const showZoneLabel = ref(true)
setTimeout(() => showZoneLabel.value = false, 3000)

// --- 3. Clues & NPCs & Items ---
const inventory = ref<{id: string, name: string}[]>([])
const REQUIRED_QUEST_IDS = ['mom', 'gardener', 'merchant', 'kid', 'bridgekeeper']
const TOWN_GATE_QUEST_IDS = ['mom', 'gardener', 'merchant', 'kid']

const puzzleState = ref({
  townGateUnlocked: false,
  skyExitUnlocked: false,
  outfitReady: false,
  englishQuizPassed: false,
  englishQuizStep: 0,
  windsFound: {
    north: false,
    east: false,
    west: false
  },
  windPathRevealed: false
})

const makeupOptions = [
  { id: 'soft', label: 'Soft Glow', blush: '#f7b2c6', lip: '#d96a8a', eye: '#5b3355', sparkle: '#ffd6e5' },
  { id: 'rose', label: 'Rosy Shine', blush: '#f59dbb', lip: '#c73f6f', eye: '#52203f', sparkle: '#ffbfd2' },
  { id: 'sparkle', label: 'Sparkle Pink', blush: '#ffd0e0', lip: '#ff5c95', eye: '#6a2a62', sparkle: '#fff1f6' }
]

const dressOptions = [
  { id: 'rose', label: 'Rose Birthday Dress', dress: '#ff7fa7', trim: '#fff0f5', bow: '#ff4f88', shoes: '#c93b66' },
  { id: 'sky', label: 'Sky Ribbon Dress', dress: '#7eb8ff', trim: '#eff7ff', bow: '#4b88ff', shoes: '#3d6fcc' },
  { id: 'lavender', label: 'Lavender Twirl Dress', dress: '#c89bff', trim: '#f8efff', bow: '#8e62ff', shoes: '#6d45d1' }
]

const selectedMakeupId = ref('')
const selectedDressId = ref('')
const wardrobeOpen = ref(false)
const wardrobeStep = ref<'makeup' | 'dress'>('makeup')

const playerAppearance = computed(() => {
  const makeup = makeupOptions.find(option => option.id === selectedMakeupId.value) || makeupOptions[0]
  const dress = dressOptions.find(option => option.id === selectedDressId.value) || dressOptions[0]
  return { makeup, dress }
})

const COMBO_RECIPES = [
  {
    parts: ['torn_map_left', 'torn_map_right'],
    result: { id: 'sky_map', name: 'Sky Map', color: '#8EC9FF', symbol: '🗺️' }
  }
]

function hasItem(id: string) {
  return inventory.value.some(i => i.id === id)
}

function tryAutoCombine(): string[] {
  const crafted: string[] = []
  for (const recipe of COMBO_RECIPES) {
    const hasAllParts = recipe.parts.every(part => hasItem(part))
    const hasResult = hasItem(recipe.result.id)
    if (!hasAllParts || hasResult) continue

    inventory.value = inventory.value.filter(item => !recipe.parts.includes(item.id))
    inventory.value.push(recipe.result)
    crafted.push(`Crafted ${recipe.result.name} ${recipe.result.symbol} from ${recipe.parts.join(' + ')}.`)
  }
  return crafted
}

// Make items and npcs bound directly to their level
const itemsDatabase = ref({
  town: [
    { id: 'shopping_list', tx: 8, ty: 6, name: 'Shopping List', color: '#EEE', symbol: '📝' },
    { id: 'watering_can', tx: 16, ty: 12, name: 'Watering Can', color: '#88C', symbol: '🚰' },
    { id: 'coin_pouch', tx: 34, ty: 12, name: 'Coin Pouch', color: '#D4AF37', symbol: '💰' },
    { id: 'torn_map_left', tx: 22, ty: 18, name: 'Torn Map (Left)', color: '#C8C8A0', symbol: '🧩' },
    { id: 'torn_map_right', tx: 27, ty: 19, name: 'Torn Map (Right)', color: '#C8C8A0', symbol: '🧩' }
  ],
  house: [
    { id: 'toy_boat', tx: 4, ty: 5, name: 'Toy Boat', color: '#B22222', symbol: '⛵' }
  ],
  sky: [
    { id: 'wind_token', tx: 4, ty: 2, name: 'Wind Token', color: '#B4ECFF', symbol: '🪶' }
  ]
})
const mapItems = computed(() => itemsDatabase.value[currentLevelId.value] || [])

const interactablesDatabase = ref({
  town: [
    { id: 'sky_gate_pillar', tx: 24, ty: 19, type: 'sky_gate', symbol: '⛩️' },
    { id: 'sky_gate_sign', tx: 22, ty: 19, type: 'sign', symbol: '🪧', short: 'GATE', title: 'Signboard', lines: ['SKY GATE', 'Complete town quests first.'] }
  ],
  house: [
    { id: 'wardrobe', tx: 10, ty: 4, type: 'wardrobe', symbol: '👗', short: 'DRESS', title: 'Wardrobe', lines: ['Choose your makeup and birthday dress here.'] }
  ],
  sky: [
    { id: 'sky_bridge_sign', tx: 8, ty: 2, type: 'sign', symbol: '🪧', short: 'BRIDGE', title: 'Signboard', lines: ['SKY BRIDGE', 'Follow the wind totems.'] },
    { id: 'sky_exit_sign', tx: 3, ty: 10, type: 'sign', symbol: '🪧', short: 'EXIT', title: 'Signboard', lines: ['SKY EXIT DOOR', 'Unlocks after Bridgekeeper quest.'] },
    { id: 'wind_north', tx: 3, ty: 2, type: 'wind_totem', wind: 'north', symbol: 'N' },
    { id: 'wind_east', tx: 5, ty: 6, type: 'wind_totem', wind: 'east', symbol: 'E' },
    { id: 'wind_west', tx: 2, ty: 9, type: 'wind_totem', wind: 'west', symbol: 'W' }
  ]
})
const levelInteractables = computed(() => interactablesDatabase.value[currentLevelId.value] || [])

const clues = ref([
  { id: 'mom', text: 'Bloom where the roses grow.', unlocked: false },
  { id: 'gardener', text: 'Where coins jingle and gifts are sold.', unlocked: false },
  { id: 'merchant', text: 'The old fountain holds a secret to the grove.', unlocked: false },
  { id: 'kid', text: 'Behind the ancient oak in the north garden.', unlocked: false },
  { id: 'bridgekeeper', text: 'Follow the winds to cross and claim the treasure.', unlocked: false }
])

const unlockedClues = ref(0)
watch(clues, (newClues) => {
  unlockedClues.value = newClues.filter(c => c.unlocked).length
}, { deep: true })

function isQuestDone(id: string) {
  return clues.value.find(c => c.id === id)?.unlocked || false
}

function unlockQuest(id: string) {
  const target = clues.value.find(c => c.id === id)
  if (target && !target.unlocked) {
    target.unlocked = true
    showCompletedTaskHud(id)
    if (id === 'bridgekeeper') {
      puzzleState.value.skyExitUnlocked = true
    }
  }
}

const completedQuestCount = computed(() => REQUIRED_QUEST_IDS.filter(id => isQuestDone(id)).length)

const townQuestCount = computed(() => TOWN_GATE_QUEST_IDS.filter(id => isQuestDone(id)).length)

watch(townQuestCount, (count) => {
  if (count >= TOWN_GATE_QUEST_IDS.length) {
    puzzleState.value.townGateUnlocked = true
  }
})

const npcHints: Record<string, string> = {
  mom: "your Mom back in Town Residential",
  gardener: "the Gardener down in the Flower Garden",
  merchant: "the Merchant over at Market Street",
  kid: "the kid by the fountain near the Hidden Grove",
  bridgekeeper: "the Bridgekeeper in the Sky Ruins"
}

function getDynamicHint(myId: string) {
  const missing = clues.value.filter(c => REQUIRED_QUEST_IDS.includes(c.id) && !c.unlocked && c.id !== myId)
  if (missing.length === 0) {
    return "You have completed every quest! Head to the Hidden Grove to open your gift!"
  }
  const target = missing[Math.floor(Math.random() * missing.length)]
  return `Maybe try talking to ${npcHints[target.id]} next!`
}

function maybeAddCompliment(lines: string[]) {
  if (!puzzleState.value.outfitReady) return lines
  if (Math.random() > 0.35) return lines
  if (lines.includes('You look beautiful today.')) return lines
  return [...lines, 'You look beautiful today.']
}

function openWardrobe() {
  wardrobeStep.value = 'makeup'
  wardrobeOpen.value = true
}

function chooseMakeup(optionId: string) {
  selectedMakeupId.value = optionId
  wardrobeStep.value = 'dress'
}

function chooseDress(optionId: string) {
  selectedDressId.value = optionId
  puzzleState.value.outfitReady = true
  wardrobeOpen.value = false
  playClue()
  openSystemDialogue('Wardrobe', [
    'Your birthday look is ready.',
    'You look beautiful today.'
  ])
}

const npcsDatabase: Record<string, any[]> = {
  town: [
    { id: 'mom', questItem: 'shopping_list', tx: 5, ty: 6, start_tx: 5, start_ty: 6, x: 5*32, y: 6*32, dx: 0, dy: 0, dir: 'down', moving: false, walkTimer: 0, idleTimer: 2000, canMove: true, color: '#20B2AA', hair: '#8B4513', name: 'Mom', getDialogue: () => {
        const unlocked = isQuestDone('mom')
        if (unlocked) return maybeAddCompliment([`Happy Birthday again, ${props.recipientName}!`, getDynamicHint('mom')])
        if (hasItem('shopping_list')) {
          return maybeAddCompliment([`Oh, you found my Shopping List! Thank you!`, `Happy Birthday, ${props.recipientName}! 🌸 The garden's roses hold a secret…`, getDynamicHint('mom')])
        }
        return [`I wanted to bake a cake for you, but I lost my Shopping List... I think I dropped it somewhere slightly northeast of our house.`]
      }
    },
    { id: 'gardener', questItem: 'watering_can', tx: 18, ty: 11, start_tx: 18, start_ty: 11, x: 18*32, y: 11*32, dx: 0, dy: 0, dir: 'down', moving: false, walkTimer: 0, idleTimer: 3500, canMove: true, color: '#6B8E23', hair: '#888', name: 'Gardener', getDialogue: () => {
        const unlocked = isQuestDone('gardener')
        if (unlocked) return maybeAddCompliment([`Enjoy your day, ${props.recipientName}!`, getDynamicHint('gardener')])
        if (hasItem('watering_can')) {
          return maybeAddCompliment([`My Watering Can! Now I can tend the roses.`, `Hello ${props.recipientName}! Happy birthday! 🌿 I hear coins jingle where gifts are sold.`, getDynamicHint('gardener')])
        }
        return [`These flowers are so thirsty... I left my Watering Can somewhere in the western grass fields, but I'm too busy to look for it!`]
      }
    },
    { id: 'merchant', questItem: 'coin_pouch', tx: 30, ty: 12, start_tx: 30, start_ty: 12, x: 30*32, y: 12*32, dx: 0, dy: 0, dir: 'down', moving: false, walkTimer: 0, idleTimer: 5000, canMove: true, color: '#FF8C00', hair: '#222', name: 'Merchant', getDialogue: () => {
        const unlocked = isQuestDone('merchant')
        if (unlocked) return maybeAddCompliment([`Have a great day, ${props.recipientName}!`, getDynamicHint('merchant')])
        if (hasItem('coin_pouch')) {
          return maybeAddCompliment([`My Coin Pouch! Bless you kind soul.`, `Hey ${props.recipientName}! 💰 They say a secret fountain holds the path to the grove.`, getDynamicHint('merchant')])
        }
        return [`Business is ruined! Someone stole my Coin Pouch and dropped it somewhere directly east of here!`]
      }
    },
    { id: 'kid', questItem: 'toy_boat', tx: 25, ty: 6, start_tx: 25, start_ty: 6, x: 25*32, y: 6*32, dx: 0, dy: 0, dir: 'down', moving: false, walkTimer: 0, idleTimer: 2500, canMove: true, color: '#DC143C', hair: '#FFD700', name: 'Kid', getDialogue: () => {
        const unlocked = isQuestDone('kid')
        if (unlocked) return maybeAddCompliment([`Wow, I love playing at the fountain!`, getDynamicHint('kid')])
        if (hasItem('toy_boat')) {
          return maybeAddCompliment([`My Toy Boat! You found it!`, `Yay! 🌊 Look behind the ancient oak tree in the north garden...`, getDynamicHint('kid')])
        }
        return [`*Sniff* I dropped my Toy Boat somewhere in the southern marketplace... Now I can't play at the fountain...`]
      }
    },
    { id: 'english_mentor', tx: 12, ty: 20, start_tx: 12, start_ty: 20, x: 12*32, y: 20*32, dx: 0, dy: 0, dir: 'down', moving: false, walkTimer: 0, idleTimer: 3200, canMove: true, color: '#4169E1', hair: '#1F2937', name: 'English Mentor', getDialogue: () => {
        if (puzzleState.value.englishQuizPassed) {
          return [
            'Excellent English, adventurer!',
            'Keep speaking confidently. Your grammar is strong today!'
          ]
        }
        return [
          `Welcome! English Challenge ${puzzleState.value.englishQuizStep + 1} of 3.`,
          'Answer correctly to move to the next question.'
        ]
      }
    },
    { id: 'gift', tx: 31, ty: 2, start_tx: 31, start_ty: 2, x: 31*32, y: 2*32, dx: 0, dy: 0, dir: 'down', moving: false, walkTimer: 0, idleTimer: Infinity, canMove: false, color: '#FFD700', hair: '#FF4500', name: 'Mystery Gift', getDialogue: () => {
        if (completedQuestCount.value < REQUIRED_QUEST_IDS.length) {
          return [`The gift is still sealed. Complete ${REQUIRED_QUEST_IDS.length - completedQuestCount.value} more quest(s) with your friends first!`]
        } else {
          return [
            "🎉 MYSTERY GIFT! 🎉",
            `Happy Birthday, ${props.recipientName}!`,
            "Your friends are all here for a surprise party!",
            "Your Mystery Gift is a cute baby Mystimon — your new loyal companion! 🐾",
            props.personalMessage
          ]
        }
      }
    }
  ],
  house: [],
  sky: [
    {
      id: 'bridgekeeper',
      questItem: 'sky_map',
      tx: 15,
      ty: 3,
      start_tx: 15,
      start_ty: 3,
      x: 15 * 32,
      y: 3 * 32,
      dx: 0,
      dy: 0,
      dir: 'left',
      moving: false,
      walkTimer: 0,
      idleTimer: 4000,
      canMove: true,
      color: '#5FB3B3',
      hair: '#E0FFFF',
      name: 'Bridgekeeper',
      getDialogue: () => {
        const unlocked = isQuestDone('bridgekeeper')
        if (unlocked) return [`The winds guided you well. The treasure now waits below.`, getDynamicHint('bridgekeeper')]
        if (!puzzleState.value.windPathRevealed) return ['Listen to the wind totems on the western side. They reveal the only safe route.']
        if (!hasItem('sky_map')) return ['Bring me the completed Sky Map so I can verify your path.']
        return ['You are ready for the final wind riddle.']
      }
    }
  ]
}

const npcs = computed(() => npcsDatabase[currentLevelId.value] || [])

const dialogueOpen = ref(false)
const dialogueText = ref('')
const dialogueSpeaker = ref('')
const dialogueBlocking = ref(false)
const dialogueChoices = ref<{ id: string, label: string }[]>([])
let dialogueLines: string[] = []
let dialogueLineIndex = 0
let giftTriggered = false
let dialogueAutoHideTimer: number | null = null
let dialogueChoiceHandler: null | ((choiceId: string) => void) = null
let hudAutoHideTimer: number | null = null
let englishQuizSteps: {
  question: string
  choices: { id: string, label: string }[]
  hint: string
}[] = []
let englishQuizStepIndex = 0

const showTaskHud = ref(false)
const lastCompletedQuestText = ref('')
const englishQuizActive = ref(false)

// --- 3.5 Particle System (Confetti) ---
interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; life: number; maxLife: number;
  size: number; rotation: number; dr: number;
}
const particles: Particle[] = []

function spawnConfetti(x: number, y: number) {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FF4500']
  for (let i = 0; i < 150; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 400,
      vy: ((Math.random() - 1) * 300) - 100, // Shoot mostly upwards
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0, maxLife: 2000 + Math.random() * 2000,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      dr: (Math.random() - 0.5) * 15
    })
  }
}

function clearDialogueAutoHideTimer() {
  if (dialogueAutoHideTimer !== null) {
    window.clearTimeout(dialogueAutoHideTimer)
    dialogueAutoHideTimer = null
  }
}

function clearDialogueChoices() {
  dialogueChoices.value = []
  dialogueChoiceHandler = null
}

function clearHudAutoHideTimer() {
  if (hudAutoHideTimer !== null) {
    window.clearTimeout(hudAutoHideTimer)
    hudAutoHideTimer = null
  }
}

function showCompletedTaskHud(questId: string) {
  const completed = clues.value.find(c => c.id === questId)
  if (completed) {
    lastCompletedQuestText.value = completed.text
  }
  showTaskHud.value = true
  clearHudAutoHideTimer()
  hudAutoHideTimer = window.setTimeout(() => {
    showTaskHud.value = false
    hudAutoHideTimer = null
  }, 3600)
}

function closeDialogue() {
  clearDialogueAutoHideTimer()
  clearDialogueChoices()
  dialogueOpen.value = false
  dialogueBlocking.value = false
}

function openSystemDialogue(speaker: string, lines: string[]) {
  clearDialogueAutoHideTimer()
  clearDialogueChoices()
  dialogueSpeaker.value = speaker
  dialogueLines = lines
  dialogueLineIndex = 0
  dialogueText.value = dialogueLines[0] || ''
  dialogueBlocking.value = true
  dialogueOpen.value = true
}

function setDialogueChoices(choices: { id: string, label: string }[], handler: (choiceId: string) => void) {
  dialogueChoices.value = choices
  dialogueChoiceHandler = handler
}

function chooseDialogue(choiceId: string) {
  if (!dialogueChoiceHandler) return
  dialogueChoiceHandler(choiceId)
}

function presentEnglishQuizStep(stepIndex: number) {
  const step = englishQuizSteps[stepIndex]
  if (!step) return

  dialogueSpeaker.value = 'English Mentor'
  dialogueLines = [step.question]
  dialogueLineIndex = 0
  dialogueText.value = step.question
  dialogueBlocking.value = true
  dialogueOpen.value = true

  setDialogueChoices(step.choices, (choiceId) => {
    if (choiceId === 'correct') {
      puzzleState.value.englishQuizStep = stepIndex + 1
      playClue()

      if (stepIndex + 1 >= englishQuizSteps.length) {
        puzzleState.value.englishQuizPassed = true
        englishQuizActive.value = false
        openSystemDialogue('English Mentor', [
          'Correct! Excellent work.',
          'You passed all 3 English questions.'
        ])
        return
      }

      englishQuizStepIndex = stepIndex + 1
      presentEnglishQuizStep(englishQuizStepIndex)
      return
    }

    playFootstep()
    dialogueText.value = `${step.question}\n${step.hint}`
  })
}

function handleInteractable(interactable: any) {
  if (interactable.type === 'sign') {
    openSystemDialogue(interactable.title || 'Signboard', interactable.lines || ['The sign is hard to read.'])
    return
  }

  if (interactable.type === 'sky_gate') {
    if (puzzleState.value.townGateUnlocked) {
      openSystemDialogue('Sky Gate', ['The gate hums with light. Step onto the glowing tile to enter Sky Ruins.'])
    } else {
      openSystemDialogue('Sky Gate', [`The gate is sealed. Help all ${TOWN_GATE_QUEST_IDS.length} townsfolk first (${townQuestCount.value}/${TOWN_GATE_QUEST_IDS.length}).`])
    }
    return
  }

  if (interactable.type === 'wardrobe') {
    if (puzzleState.value.outfitReady) {
      openSystemDialogue('Wardrobe', ['You already chose your birthday outfit. It looks lovely on you!'])
      return
    }
    wardrobeStep.value = 'makeup'
    wardrobeOpen.value = true
    return
  }

  if (interactable.type === 'wind_totem') {
    const wind = interactable.wind as 'north' | 'east' | 'west'
    puzzleState.value.windsFound[wind] = true

    const windHint = wind === 'north'
      ? 'North wind: Begin where the clouds rise.'
      : wind === 'east'
        ? 'East wind: Then follow the dawn-light.'
        : 'West wind: End where sunset glows.'

    if (!puzzleState.value.windPathRevealed && puzzleState.value.windsFound.north && puzzleState.value.windsFound.east && puzzleState.value.windsFound.west) {
      puzzleState.value.windPathRevealed = true
      playClue()
      openSystemDialogue('Wind Totem', [windHint, 'All three winds align. Hidden bridge tiles now shimmer into view!'])
      return
    }

    openSystemDialogue('Wind Totem', [windHint])
  }
}

function openDialogue(npc: any) {
  initAudio()
  clearDialogueAutoHideTimer()
  clearDialogueChoices()

  if (npc.id === 'english_mentor') {
    englishQuizActive.value = true

    if (puzzleState.value.englishQuizPassed) {
      englishQuizActive.value = false
      openSystemDialogue('English Mentor', [
        'Great job again!',
        'You already passed the English challenge.'
      ])
      return
    }

    englishQuizSteps = [
      {
        question: 'Question 1/3: Which sentence is grammatically correct?',
        choices: [
          { id: 'wrong1', label: 'She go to school every day.' },
          { id: 'correct', label: 'She goes to school every day.' },
          { id: 'wrong2', label: 'She going to school every day.' }
        ],
        hint: 'Hint: with "She", use the verb form ending in "-es".'
      },
      {
        question: 'Question 2/3: Choose the best sentence for the past tense.',
        choices: [
          { id: 'wrong1', label: 'Yesterday, I have visit my friend.' },
          { id: 'correct', label: 'Yesterday, I visited my friend.' },
          { id: 'wrong2', label: 'Yesterday, I am visiting my friend.' }
        ],
        hint: 'Hint: use the simple past form for a finished action yesterday.'
      },
      {
        question: 'Question 3/3: Which sentence is the most natural and polite request?',
        choices: [
          { id: 'correct', label: 'Could you please tell me where the sky gate is?' },
          { id: 'wrong1', label: 'Tell me where sky gate is now.' },
          { id: 'wrong2', label: 'You tell me where is the sky gate.' }
        ],
        hint: 'Hint: polite requests often use "Could you please...".'
      }
    ]

    englishQuizStepIndex = Math.min(puzzleState.value.englishQuizStep, englishQuizSteps.length - 1)
    presentEnglishQuizStep(englishQuizStepIndex)
    return
  }

  if (npc.id === 'bridgekeeper' && !isQuestDone('bridgekeeper')) {
    if (!puzzleState.value.windPathRevealed) {
      openSystemDialogue('Bridgekeeper', ['Listen to all wind totems first. They reveal the safe crossing.'])
      return
    }

    if (!hasItem('sky_map')) {
      openSystemDialogue('Bridgekeeper', ['Bring me the completed Sky Map. The winds respect prepared travelers.'])
      return
    }

    dialogueSpeaker.value = npc.name
    dialogueLines = ['Which wind order reveals the true bridge route?']
    dialogueLineIndex = 0
    dialogueText.value = dialogueLines[0]
    dialogueBlocking.value = true
    dialogueOpen.value = true

    setDialogueChoices(
      [
        { id: 'correct', label: 'North → East → West' },
        { id: 'wrong1', label: 'East → North → West' },
        { id: 'wrong2', label: 'West → East → North' }
      ],
      (choiceId) => {
        if (choiceId === 'correct') {
          inventory.value = inventory.value.filter(i => i.id !== 'sky_map')
          unlockQuest('bridgekeeper')
          playClue()
          openSystemDialogue('Bridgekeeper', [
            `Correct, ${props.recipientName}. The winds accept you.`,
            getDynamicHint('bridgekeeper')
          ])
          return
        }
        playFootstep()
        openSystemDialogue('Bridgekeeper', ['Not quite. No penalty - follow the wind totems and try again.'])
      }
    )
    return
  }

  dialogueLines = npc.getDialogue()
  dialogueSpeaker.value = npc.name
  dialogueLineIndex = 0
  giftTriggered = false

  // Make all dialogues block movement so the user can read them and dismiss manually
  dialogueBlocking.value = true

  if (npc.id !== 'gift' && !isQuestDone(npc.id)) {
    if (npc.questItem && hasItem(npc.questItem)) {
      // Remove used item from inventory
      inventory.value = inventory.value.filter(i => i.id !== npc.questItem)
      unlockQuest(npc.id)
      playClue()
    } else {
      // Doesn't have the quest item
      playFootstep() // Just a small feedback sound
    }
  } else if (npc.id === 'gift' && completedQuestCount.value === REQUIRED_QUEST_IDS.length) {
    playGift()
    giftTriggered = true
    spawnConfetti(npc.x * TILE_SIZE + 16, npc.y * TILE_SIZE + 16)
  }

  dialogueText.value = dialogueLines[0]
  dialogueOpen.value = true
}

function nextDialogue() {
  initAudio()

  if (dialogueChoices.value.length > 0) return

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

function syncCanvasViewport() {
  if (!canvas.value) return
  const levelH = ROWS.value * TILE_SIZE
  canvas.value.width = BASE_VIEW_W
  canvas.value.height = Math.min(BASE_VIEW_H, levelH)
  if (ctx) ctx.imageSmoothingEnabled = false
}

function handleKeyDown(e: KeyboardEvent) {
  if (wardrobeOpen.value) return
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
  if (wardrobeOpen.value) return
  if (dialogueOpen.value && dialogueBlocking.value) return
  keys[k] = true
  initAudio()
}
function stopMove(k: 'w'|'a'|'s'|'d') {
  keys[k] = false
}
function triggerAction() {
  if (wardrobeOpen.value) return
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
  
  // Check map items first
  const itemIndex = mapItems.value?.findIndex(item => item.tx === inx && item.ty === iny)
  if (itemIndex !== undefined && itemIndex !== -1) {
    const item = mapItems.value[itemIndex]
    inventory.value.push(item)
    mapItems.value.splice(itemIndex, 1)

    const combineMessages = tryAutoCombine()
    playClue() // Play success sound
    const lines = [`You picked up: ${item.name} ${item.symbol}`, ...combineMessages]
    openSystemDialogue('Item Found', lines)
    return
  }

  const interactable = levelInteractables.value.find(i => i.tx === inx && i.ty === iny)
  if (interactable) {
    handleInteractable(interactable)
    return
  }

  for (const npc of npcs.value) {
    if (npc.tx === inx && npc.ty === iny) {
      if (npc.canMove) {
        if (player.dir === 'left') npc.dir = 'right'
        else if (player.dir === 'right') npc.dir = 'left'
        else if (player.dir === 'up') npc.dir = 'down'
        else if (player.dir === 'down') npc.dir = 'up'
      }
      openDialogue(npc)
      return
    }
  }
}

function update(dt: number) {
  // Update particles even if dialogue is open
  const dtSeconds = dt / 1000
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i]
    p.life += dt
    if (p.life >= p.maxLife) {
      particles.splice(i, 1)
      continue
    }
    p.vy += 500 * dtSeconds // Gravity
    p.x += p.vx * dtSeconds
    p.y += p.vy * dtSeconds
    p.rotation += p.dr * dtSeconds
  }

  if (wardrobeOpen.value) return
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

      const warp = warps.value.find(w => w.tx === player.tx && w.ty === player.ty)
      if (warp) {
        if (warp.requires && !puzzleState.value[warp.requires as 'townGateUnlocked' | 'windPathRevealed' | 'skyExitUnlocked' | 'outfitReady']) {
            if (warp.requires === 'outfitReady') {
              openSystemDialogue('Wardrobe', ['You need to pick your makeup and birthday dress before leaving the room.'])
              return
            }
          if (warp.requires === 'skyExitUnlocked') {
            openSystemDialogue('Exit Door', ['The Sky Exit Door is sealed. Help the Bridgekeeper first to unlock it.'])
          } else {
            openSystemDialogue('Path Locked', ['A puzzle seal blocks the route. Solve the local challenge to proceed.'])
          }
          return
        }
        currentLevelId.value = warp.targetLevel
        player.tx = warp.targetX
        player.ty = warp.targetY
        player.x = player.tx * TILE_SIZE
        player.y = player.ty * TILE_SIZE
        if (warp.dir) player.dir = warp.dir
      }

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
        if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value) {
          const tile = mapTiles.value[ny][nx]
          const hitNpc = npcs.value.find(n => n.tx === nx && n.ty === ny)
          const hitItem = mapItems.value.find(i => i.tx === nx && i.ty === ny)
          const hitInteractable = levelInteractables.value.find(i => i.tx === nx && i.ty === ny)
          const isBlockedWindPath = tile === 'W' && !puzzleState.value.windPathRevealed
          if (!solidTiles.value.includes(tile) && !isBlockedWindPath && !hitNpc && !hitItem && !hitInteractable) {
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

  // Update NPCs
  for (const npc of npcs.value) {
    if (!npc.canMove || (dialogueOpen.value && dialogueSpeaker.value === npc.name)) continue;

    if (npc.moving) {
      npc.walkTimer += dt
      const duration = 200 // NPCs walk a little slower than the player
      const progress = Math.min(npc.walkTimer / duration, 1)
      npc.x = (npc.tx - npc.dx) * TILE_SIZE + (npc.dx * TILE_SIZE * progress)
      npc.y = (npc.ty - npc.dy) * TILE_SIZE + (npc.dy * TILE_SIZE * progress)

      if (progress >= 1) {
        npc.moving = false
        npc.x = npc.tx * TILE_SIZE
        npc.y = npc.ty * TILE_SIZE
        npc.idleTimer = 1000 + Math.random() * 3000
      }
    } else {
      npc.idleTimer -= dt
      if (npc.idleTimer <= 0) {
        const dirs: {dx: number, dy: number, dir: string}[] = [
          { dx: 0, dy: -1, dir: 'up' },
          { dx: 0, dy: 1, dir: 'down' },
          { dx: -1, dy: 0, dir: 'left' },
          { dx: 1, dy: 0, dir: 'right' }
        ]
        const move = dirs[Math.floor(Math.random() * dirs.length)]
        npc.dir = move.dir
        
        const nx = npc.tx + move.dx
        const ny = npc.ty + move.dy
        
        if (nx >= 0 && nx < COLS.value && ny >= 0 && ny < ROWS.value) {
          const tile = mapTiles.value[ny][nx]
          const hitPlayer = (nx === player.tx && ny === player.ty)
          const hitOtherNpc = npcs.value.find(n => n !== npc && n.tx === nx && n.ty === ny)
          const hitItem = mapItems.value.find(i => i.tx === nx && i.ty === ny)
           const hitInteractable = levelInteractables.value.find(i => i.tx === nx && i.ty === ny)
          const inBounds = Math.abs(nx - npc.start_tx) <= 3 && Math.abs(ny - npc.start_ty) <= 3
           const isBlockedWindPath = tile === 'W' && !puzzleState.value.windPathRevealed
          
           if (!solidTiles.value.includes(tile) && !isBlockedWindPath && !hitPlayer && !hitOtherNpc && !hitItem && !hitInteractable && inBounds) {
             npc.tx = nx
             npc.ty = ny
             npc.dx = move.dx
             npc.dy = move.dy
             npc.moving = true
             npc.walkTimer = 0
          } else {
             npc.idleTimer = 500
          }
        } else {
           npc.idleTimer = 500
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

function drawPlayerSprite(
  t: CanvasRenderingContext2D,
  x: number,
  y: number,
  makeup: { blush: string, lip: string, eye: string, sparkle: string },
  dress: { id: string, dress: string, trim: string, bow: string, shoes: string },
  dir: string,
  moving: boolean
) {
  const oy = moving && (Date.now() % 300 > 150) ? -2 : 0
  const px = x + 6
  const py = y + 4 + oy

  const isRoseDress = dress.id === 'rose'
  const isSkyDress = dress.id === 'sky'
  const isLavenderDress = dress.id === 'lavender'

  t.fillStyle = isSkyDress ? '#3f67c6' : isLavenderDress ? '#7a4fb5' : '#5a2b62'
  t.fillRect(px + 3, py - 2, 14, 6)
  t.fillRect(px + 2, py + 0, 16, 4)

  if (isRoseDress) {
    t.fillStyle = dress.bow
    t.fillRect(px + 1, py + 1, 3, 4)
    t.fillRect(px + 18, py + 1, 3, 4)
  } else if (isSkyDress) {
    t.fillStyle = dress.bow
    t.fillRect(px + 7, py + 1, 8, 3)
  } else if (isLavenderDress) {
    t.fillStyle = dress.bow
    t.fillRect(px + 0, py + 2, 4, 5)
    t.fillRect(px + 18, py + 2, 4, 5)
  }

  t.fillStyle = '#FDDBB4'
  t.fillRect(px + 2, py, 16, 12)

  if (isRoseDress) {
    t.fillStyle = '#f9b3c6'
    t.fillRect(px + 1, py + 6, 4, 3)
    t.fillRect(px + 17, py + 6, 4, 3)
  } else if (isSkyDress) {
    t.fillStyle = '#dcecff'
    t.fillRect(px + 1, py + 5, 4, 4)
    t.fillRect(px + 17, py + 5, 4, 4)
  } else if (isLavenderDress) {
    t.fillStyle = '#efe1ff'
    t.fillRect(px + 0, py + 5, 5, 4)
    t.fillRect(px + 17, py + 5, 5, 4)
  }

  t.fillStyle = makeup.sparkle
  t.fillRect(px + 4, py + 2, 1, 1)
  t.fillRect(px + 14, py + 2, 1, 1)
  t.fillStyle = makeup.blush
  t.fillRect(px + 3, py + 7, 2, 1)
  t.fillRect(px + 13, py + 7, 2, 1)

  t.fillStyle = makeup.eye
  if (dir === 'down') {
    t.fillRect(px + 6, py + 4, 2, 2)
    t.fillRect(px + 12, py + 4, 2, 2)
  } else if (dir === 'right') {
    t.fillRect(px + 14, py + 4, 2, 2)
  } else if (dir === 'left') {
    t.fillRect(px + 4, py + 4, 2, 2)
  } else {
    t.fillRect(px + 6, py + 3, 2, 2)
    t.fillRect(px + 12, py + 3, 2, 2)
  }
  t.fillStyle = makeup.lip
  t.fillRect(px + 8, py + 9, 4, 1)

  t.fillStyle = dress.bow
  if (isRoseDress) {
    t.fillRect(px + 10, py - 5, 9, 2)
    t.fillRect(px + 13, py - 7, 2, 6)
  } else if (isSkyDress) {
    t.fillRect(px + 6, py - 5, 12, 2)
    t.fillRect(px + 11, py - 7, 2, 6)
  } else {
    t.fillRect(px + 2, py - 5, 8, 2)
    t.fillRect(px + 5, py - 7, 2, 6)
  }

  t.fillStyle = dress.dress
  if (isRoseDress) {
    t.fillRect(px + 2, py + 10, 16, 7)
    t.fillRect(px + 0, py + 15, 20, 7)
    t.fillRect(px + 4, py + 7, 12, 4)
  } else if (isSkyDress) {
    t.fillRect(px + 4, py + 10, 12, 8)
    t.fillRect(px + 2, py + 16, 16, 6)
    t.fillRect(px + 6, py + 13, 8, 2)
  } else {
    t.fillRect(px + 3, py + 10, 14, 7)
    t.fillRect(px + 0, py + 16, 20, 7)
    t.fillRect(px + 6, py + 13, 8, 2)
  }
  t.fillStyle = dress.trim
  if (isRoseDress) {
    t.fillRect(px + 3, py + 11, 14, 2)
    t.fillRect(px + 1, py + 18, 18, 2)
  } else if (isSkyDress) {
    t.fillRect(px + 5, py + 11, 10, 2)
    t.fillRect(px + 3, py + 18, 14, 2)
  } else {
    t.fillRect(px + 4, py + 11, 12, 2)
    t.fillRect(px + 2, py + 18, 16, 2)
  }

  t.fillStyle = '#FDDBB4'
  t.fillRect(px, py + 10, 3, 8)
  t.fillRect(px + 17, py + 10, 3, 8)

  if (isRoseDress) {
    t.fillStyle = '#ffb7cc'
    t.fillRect(px + 1, py + 14, 18, 1)
  } else if (isSkyDress) {
    t.fillStyle = '#a8d2ff'
    t.fillRect(px + 1, py + 14, 18, 1)
  } else {
    t.fillStyle = '#e3c4ff'
    t.fillRect(px + 1, py + 14, 18, 1)
  }

  t.fillStyle = dress.shoes
  if (isRoseDress) {
    t.fillRect(px + 3, py + 22, 5, 2)
    t.fillRect(px + 12, py + 22, 5, 2)
  } else if (isSkyDress) {
    t.fillRect(px + 4, py + 22, 4, 2)
    t.fillRect(px + 13, py + 22, 4, 2)
  } else {
    t.fillRect(px + 5, py + 22, 3, 2)
    t.fillRect(px + 12, py + 22, 3, 2)
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

function drawMapItem(t: CanvasRenderingContext2D, x: number, y: number, name: string, color: string, symbol: string) {
  const bob = Math.sin(Date.now() / 200) * 2;
  const px = x + 16
  const py = y + 16 + bob

  t.fillStyle = color
  t.beginPath()
  t.arc(px, py, 8, 0, Math.PI * 2)
  t.fill()
  t.strokeStyle = '#fff'
  t.lineWidth = 1
  t.stroke()
  
  t.fillStyle = '#000'
  t.font = "12px Arial"
  t.textAlign = "center"
  t.textBaseline = "middle"
  t.fillText(symbol, px, py + 1)
  t.textAlign = "left"
  t.textBaseline = "alphabetic"
}

function render() {
  if (!canvas.value || !ctx) return
  const t = ctx

  const levelW = COLS.value * TILE_SIZE
  const levelH = ROWS.value * TILE_SIZE

  let camX = player.x - canvas.value.width / 2 + TILE_SIZE / 2
  let camY = player.y - canvas.value.height / 2 + TILE_SIZE / 2
  const maxCamX = Math.max(0, levelW - canvas.value.width)
  const maxCamY = Math.max(0, levelH - canvas.value.height)
  camX = Math.max(0, Math.min(camX, maxCamX))
  camY = Math.max(0, Math.min(camY, maxCamY))
  const centerOffsetX = Math.max(0, Math.floor((canvas.value.width - levelW) / 2))
  const centerOffsetY = Math.max(0, Math.floor((canvas.value.height - levelH) / 2))

  t.fillStyle = getLevelFloorColor()
  t.fillRect(0, 0, canvas.value.width, canvas.value.height)
  t.save()
  t.translate(centerOffsetX - Math.floor(camX), centerOffsetY - Math.floor(camY))

  const startC = Math.max(0, Math.floor(camX / TILE_SIZE))
  const endC = Math.min(COLS.value, Math.ceil((camX + canvas.value.width) / TILE_SIZE))
  const startR = Math.max(0, Math.floor(camY / TILE_SIZE))
  const endR = Math.min(ROWS.value, Math.ceil((camY + canvas.value.height) / TILE_SIZE))

  for (let r = startR; r < endR; r++) {
    for (let c = startC; c < endC; c++) {
      const tile = mapTiles.value[r][c]
      const px = c * TILE_SIZE
      const py = r * TILE_SIZE
      
      if (currentLevelId.value === 'town') {
        t.fillStyle = (c+r)%2===0 ? '#5a8a34' : '#4e7a2c'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
      } else if (currentLevelId.value === 'sky') {
        t.fillStyle = (c + r) % 2 === 0 ? '#8fc3ff' : '#7db8fa'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
      } else { // house floor
         t.fillStyle = (c+r)%2===0 ? '#5c4033' : '#6f4f3e'
         t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
      }

      if (tile === '1') { // Path
        t.fillStyle = '#c8a86e'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.strokeStyle = '#b89658'
        t.lineWidth = 1
        t.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      } else if (tile === '2') { // Tree
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
      } else if (tile === '3') { // House Wall
        t.fillStyle = '#b84a2e'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#a03a20'
        t.fillRect(px, py + 15, TILE_SIZE, 2)
        t.fillStyle = '#d4a060'
        t.fillRect(px + 8, py + 8, 16, 16)
      } else if (tile === '4') { // House Roof
        t.fillStyle = '#555566'
        t.beginPath()
        t.moveTo(px + 16, py)
        t.lineTo(px + TILE_SIZE, py + TILE_SIZE)
        t.lineTo(px, py + TILE_SIZE)
        t.fill()
      } else if (tile === '5') { // Water
        const wave = Math.sin(Date.now() / 300 + px) * 2
        t.fillStyle = '#3a8ac8'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#5aaae8'
        t.fillRect(px + 4, py + 8 + wave, 24, 4)
      } else if (tile === '6') { // Fence
        t.fillStyle = '#8a5a30'
        t.fillRect(px + 12, py + 4, 8, 24)
        t.fillRect(px, py + 12, 32, 6)
      } else if (tile === '7') { // Flower
        t.fillStyle = '#5a8a34'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#ff69b4'
        t.fillRect(px + 6, py + 6, 4, 4)
        t.fillStyle = '#ffd700'
        t.fillRect(px + 20, py + 18, 4, 4)
      } else if (tile === '8') { // Market
        t.fillStyle = '#f0c030'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.strokeStyle = '#333'
        t.strokeRect(px + 2, py + 2, 28, 28)
      } else if (tile === 'H') { // Indoor Floor
        t.fillStyle = '#8B5A2B'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.strokeStyle = '#5E3A19'
        t.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      } else if (tile === 'R') { // Rug
        t.fillStyle = '#CD5C5C'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#F08080'
        t.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8)
      } else if (tile === 'C') { // Cloud floor
        t.fillStyle = '#eef7ff'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#d9ecff'
        t.beginPath()
        t.arc(px + 10, py + 18, 8, 0, Math.PI * 2)
        t.arc(px + 18, py + 14, 8, 0, Math.PI * 2)
        t.fill()
      } else if (tile === 'V') { // Void
        t.fillStyle = '#24406a'
        t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        t.fillStyle = '#1a3052'
        t.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6)
      } else if (tile === 'W') { // Hidden/revealed wind path
        if (puzzleState.value.windPathRevealed) {
          t.fillStyle = '#dff1ff'
          t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
          t.fillStyle = '#75aee0'
          t.font = "16px 'Courier New'"
          t.fillText('➜', px + 9, py + 22)
        } else {
          t.fillStyle = '#2a4d7d'
          t.fillRect(px, py, TILE_SIZE, TILE_SIZE)
          t.fillStyle = '#365f97'
          t.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8)
        }
      }
    }
  }

  // Sky exit door sprite: visual cue for leaving Sky Ruins.
  if (currentLevelId.value === 'sky') {
    const doorX = 2 * TILE_SIZE
    const doorY = 10 * TILE_SIZE
    const unlocked = puzzleState.value.skyExitUnlocked

    t.fillStyle = unlocked ? '#7f5231' : '#4f4340'
    t.fillRect(doorX + 7, doorY + 3, 18, 26)
    t.fillStyle = unlocked ? '#c7925c' : '#8e857d'
    t.fillRect(doorX + 9, doorY + 5, 14, 22)
    t.fillStyle = '#2a2a2a'
    t.fillRect(doorX + 17, doorY + 16, 2, 2)

    if (!unlocked) {
      t.fillStyle = '#f7d35c'
      t.fillRect(doorX + 12, doorY + 12, 7, 5)
      t.font = "9px 'Courier New'"
      t.fillStyle = '#7a4f00'
      t.fillText('L', doorX + 14, doorY + 16)
    }

    t.font = "9px 'Courier New'"
    t.fillStyle = '#ffffff'
    t.fillText('EXIT', doorX + 7, doorY + 1)
  }

  for (const interactable of levelInteractables.value) {
    const ix = interactable.tx * TILE_SIZE
    const iy = interactable.ty * TILE_SIZE
    const bob = Math.sin(Date.now() / 220 + interactable.tx) * 1.5

    if (interactable.type === 'wind_totem') {
      t.fillStyle = '#89c8f2'
      t.fillRect(ix + 11, iy + 6, 10, 20)
      t.fillStyle = '#dff4ff'
      t.beginPath()
      t.arc(ix + 16, iy + 6 + bob, 6, 0, Math.PI * 2)
      t.fill()
      t.fillStyle = '#1c3558'
      t.font = "11px 'Courier New'"
      t.fillText(interactable.symbol, ix + 12, iy + 10 + bob)
    } else if (interactable.type === 'sky_gate') {
      t.fillStyle = puzzleState.value.townGateUnlocked ? '#8fffa5' : '#ffcf7f'
      t.fillRect(ix + 8, iy + 8, 16, 16)
      t.fillStyle = '#2a2a2a'
      t.font = "12px 'Courier New'"
      t.fillText('⛩', ix + 10, iy + 21)
    } else if (interactable.type === 'sign') {
      t.fillStyle = '#80552f'
      t.fillRect(ix + 14, iy + 12, 4, 16)
      t.fillStyle = '#f0e0b8'
      t.fillRect(ix + 4, iy + 4, 24, 12)
      t.strokeStyle = '#5a3a1a'
      t.lineWidth = 1
      t.strokeRect(ix + 4, iy + 4, 24, 12)
      t.fillStyle = '#222'
      t.font = "8px 'Courier New'"
      t.fillText(interactable.short || 'SIGN', ix + 6, iy + 12)
    } else if (interactable.type === 'wardrobe') {
      t.fillStyle = '#8b5a2b'
      t.fillRect(ix + 6, iy + 4, 20, 24)
      t.fillStyle = '#deb887'
      t.fillRect(ix + 8, iy + 6, 16, 20)
      t.strokeStyle = '#5a3a1a'
      t.strokeRect(ix + 6, iy + 4, 20, 24)
      t.fillStyle = '#c0398f'
      t.fillRect(ix + 14, iy + 12, 2, 6)
      t.fillStyle = '#fff'
      t.font = "9px 'Courier New'"
      t.fillText('👗', ix + 9, iy + 19)
    }

    const dist = Math.abs(interactable.tx - player.tx) + Math.abs(interactable.ty - player.ty)
    if (dist <= 1) {
      t.fillStyle = '#fff'
      t.beginPath()
      t.arc(ix + 16, iy - 5, 5, 0, Math.PI * 2)
      t.fill()
      t.fillStyle = '#000'
      t.font = "11px 'Courier New'"
      t.fillText('?', ix + 13, iy - 2)
    }
  }

  for (const item of mapItems.value || []) {
    drawMapItem(t, item.tx * TILE_SIZE, item.ty * TILE_SIZE, item.name, item.color, item.symbol)
    
    // Draw interaction indicator above item if near
    const dist = Math.abs(item.tx - player.tx) + Math.abs(item.ty - player.ty)
    if (dist <= 1) {
      const bob = Math.sin(Date.now() / 150) * 3
      t.fillStyle = '#fff'
      t.beginPath()
      t.arc(item.tx * TILE_SIZE + 16, item.ty * TILE_SIZE - 6 + bob, 6, 0, Math.PI * 2)
      t.fill()
      t.fillStyle = '#000'
      t.font = "12px 'Courier New'"
      t.fillText("?", item.tx * TILE_SIZE + 13, item.ty * TILE_SIZE - 2 + bob)
    }
  }

  for (const npc of npcs.value) {
    if (npc.id === 'gift') {
      drawGift(t, npc.x, npc.y, completedQuestCount.value === REQUIRED_QUEST_IDS.length)
    } else {
      drawSprite(t, npc.x, npc.y, npc.color, npc.hair, npc.dir, npc.moving)
      const dist = Math.abs(npc.tx - player.tx) + Math.abs(npc.ty - player.ty)
      if (dist <= 2) {
        const bob = Math.sin(Date.now() / 150) * 3
        t.fillStyle = '#fff'
        t.beginPath()
        t.arc(npc.x + 16, npc.y - 6 + bob, 6, 0, Math.PI * 2)
        t.fill()
        t.fillStyle = '#000'
        t.font = "12px 'Courier New'"
        t.fillText("!", npc.x + 13, npc.y - 2 + bob)
      }
    }
  }

  drawPlayerSprite(t, player.x, player.y, playerAppearance.value.makeup, playerAppearance.value.dress, player.dir, player.moving)

  for (const p of particles) {
    t.save()
    t.translate(p.x, p.y)
    t.rotate(p.rotation)
    t.fillStyle = p.color
    t.globalAlpha = Math.max(0, 1 - (p.life / p.maxLife))
    t.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
    t.restore()
  }

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
    ctx = canvas.value.getContext('2d')
    syncCanvasViewport()
  }
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', syncCanvasViewport)
  window.addEventListener('orientationchange', syncCanvasViewport)
  raf = requestAnimationFrame(loop)
  
  // Simulate loading delay for assets
  setTimeout(() => {
    isGameLoaded.value = true
  }, 1500)
})

watch(currentLevelId, () => {
  syncCanvasViewport()
})

onBeforeUnmount(() => {
  clearDialogueAutoHideTimer()
  clearHudAutoHideTimer()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', syncCanvasViewport)
  window.removeEventListener('orientationchange', syncCanvasViewport)
  cancelAnimationFrame(raf)
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close()
  }
})
</script>

<template>
  <div class="adventure-wrapper">
    <div v-if="!isGameLoaded" class="loading-screen">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading Adventure...</div>
    </div>

    <div class="controls-hint">▲▼◀▶ or WASD · SPACE/Enter to talk</div>
    <canvas ref="canvas" class="game-canvas" :class="{ hidden: !isGameLoaded }"></canvas>
    
      <div v-if="showTaskHud" class="hud" :class="{ 'sky-hud': currentLevelId === 'sky' }">
      <div class="hud-complete-banner">Task Completed</div>
      <div v-if="lastCompletedQuestText" class="hud-complete-text">{{ lastCompletedQuestText }}</div>
      <div class="hud-clues">Quests: {{ completedQuestCount }}/{{ REQUIRED_QUEST_IDS.length }}</div>
      <div v-for="c in clues" :key="c.id" class="clue-item" :class="{ locked: !c.unlocked }">
         <span class="bullet" :class="{ check: c.unlocked }"></span> {{ c.unlocked ? c.text : '(locked)' }}
      </div>
      
      <div v-if="inventory.length > 0" class="hud-inventory">
        <div class="inventory-title">Backpack:</div>
        <div class="inventory-items">
          <span v-for="item in inventory" :key="item.id" class="inv-item" :title="item.name">
            {{ item.symbol }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="zone-overlay" :class="{ visible: showZoneLabel }">
      {{ currentZone }}
    </div>

    <div v-if="dialogueOpen" class="dialogue-overlay centered-dialogue">
      <div class="dialogue-box" :class="{ 'quiz-active': englishQuizActive && dialogueChoices.length > 0 }">
        <div v-if="englishQuizActive && dialogueSpeaker === 'English Mentor'" class="dialogue-progress">
          English Challenge {{ englishQuizStepIndex + 1 }}/{{ englishQuizSteps.length }}
        </div>
        <div class="dialogue-speaker">{{ dialogueSpeaker }}</div>
        <div class="dialogue-text">{{ dialogueText }}</div>
        <div v-if="dialogueChoices.length" class="dialogue-choices">
          <button
            v-for="choice in dialogueChoices"
            :key="choice.id"
            class="dialogue-choice-btn"
            @click="chooseDialogue(choice.id)"
          >
            {{ choice.label }}
          </button>
        </div>
        <button v-else class="dialogue-btn" @click="nextDialogue">Continue ▶</button>
      </div>
    </div>

    <div v-if="wardrobeOpen" class="wardrobe-overlay">
      <div class="wardrobe-panel">
        <div class="wardrobe-title">Birthday Wardrobe</div>
        <div class="wardrobe-subtitle">Choose your look before leaving the room.</div>
        <div class="wardrobe-step">{{ wardrobeStep === 'makeup' ? 'Step 1 of 2: Makeup' : 'Step 2 of 2: Dress' }}</div>

        <div v-if="wardrobeStep === 'makeup'" class="wardrobe-grid">
          <button
            v-for="option in makeupOptions"
            :key="option.id"
            class="wardrobe-choice"
            @click="chooseMakeup(option.id)"
          >
            <span class="makeup-preview">
              <span class="makeup-eye" :style="{ background: option.eye }"></span>
              <span class="makeup-cheek" :style="{ background: option.blush }"></span>
              <span class="makeup-lip" :style="{ background: option.lip }"></span>
              <span class="makeup-sparkle" :style="{ background: option.sparkle }"></span>
            </span>
            <span>{{ option.label }}</span>
          </button>
        </div>

        <div v-else class="wardrobe-grid">
          <button
            v-for="option in dressOptions"
            :key="option.id"
            class="wardrobe-choice dress-choice"
            @click="chooseDress(option.id)"
          >
            <span class="dress-preview" :class="option.id">
              <span class="dress-hair"></span>
              <span class="dress-head"></span>
              <span class="dress-bow"></span>
              <span class="dress-body"></span>
              <span class="dress-hem"></span>
              <span class="dress-shoes"></span>
            </span>
            <span>{{ option.label }}</span>
          </button>
        </div>
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
  max-width: none;
  width: min(100vw, 960px);
  aspect-ratio: 4 / 3;
  margin: 0 auto;
  background: var(--bg);
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
  transition: opacity 0.5s ease-in-out;
}
.game-canvas.hidden {
  opacity: 0;
}

.loading-screen {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #1a1a24;
  z-index: 100;
  color: #FFD700;
  font-family: 'Courier New', Courier, monospace;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 6px solid #FFD700;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

.hud-complete-banner {
  font-weight: bold;
  color: #8cff8c;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hud-complete-text {
  color: #d8ffd8;
  font-size: 12px;
  margin-bottom: 8px;
  line-height: 1.25;
}

.hud.sky-hud {
  left: auto;
  right: 10px;
}

.hud-clues {
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 8px;
}

.hud-inventory {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dotted rgba(255, 255, 255, 0.4);
}

.inventory-title {
  color: #FFA500;
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 11px;
}

.inventory-items {
  display: flex;
  gap: 8px;
}

.inv-item {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  padding: 4px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: min(92vw, 760px);
  padding: 0;
  justify-content: center;
  z-index: 80;
}

.centered-dialogue .dialogue-box {
  width: 100%;
  background: rgba(255, 255, 255, 0.94);
  border-width: 5px;
  padding: 18px 22px;
  max-height: 76dvh;
  overflow: auto;
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
  font-size: clamp(18px, 2.5vw, 28px);
  font-weight: bold;
  color: #FFD700;
  text-shadow: 1px 1px 0 #333, -1px -1px 0 #333, 1px -1px 0 #333, -1px 1px 0 #333;
  margin-bottom: 12px;
}

.dialogue-progress {
  display: inline-block;
  margin-bottom: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #1f2937;
  color: #fff7c2;
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(13px, 1.8vw, 18px);
  font-weight: bold;
  letter-spacing: 0.4px;
  border: 2px solid #ffd700;
}

.dialogue-text {
  font-size: clamp(16px, 2.2vw, 24px);
  line-height: 1.6;
  color: #000;
  min-height: 72px;
}

.dialogue-choices {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.dialogue-choice-btn {
  width: 100%;
  text-align: left;
  background: #f7f0c8;
  border: 2px solid #333;
  padding: 10px 12px;
  font-family: inherit;
  font-size: clamp(13px, 1.8vw, 18px);
  line-height: 1.5;
  cursor: pointer;
}

.dialogue-choice-btn:hover {
  background: #ffe680;
}

.dialogue-box.quiz-active {
  display: flex;
  flex-direction: column;
}

.dialogue-box.quiz-active .dialogue-text {
  min-height: 0;
}

.dialogue-btn {
  margin-top: 14px;
  float: right;
  background: #FFD700;
  border: 2px solid #333;
  padding: 10px 14px;
  font-family: inherit;
  font-weight: bold;
  font-size: clamp(12px, 1.7vw, 16px);
  cursor: pointer;
  outline: none;
}

.dialogue-btn:hover {
  background: #ffec8b;
}

.wardrobe-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 8, 20, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  padding: 16px;
}

.wardrobe-panel {
  width: min(92vw, 520px);
  background: linear-gradient(180deg, #fff9fe 0%, #f9f0ff 100%);
  border: 6px solid #4b2350;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  border-radius: 18px;
  padding: 18px;
  font-family: 'Courier New', Courier, monospace;
}

.wardrobe-title {
  font-size: clamp(22px, 3vw, 30px);
  font-weight: bold;
  color: #7a215f;
  margin-bottom: 8px;
}

.wardrobe-subtitle {
  color: #5a3a5f;
  margin-bottom: 8px;
  font-size: clamp(13px, 1.8vw, 16px);
}

.wardrobe-step {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ffe0f0;
  color: #5c2149;
  font-weight: bold;
  margin-bottom: 14px;
}

.wardrobe-grid {
  display: grid;
  gap: 10px;
}

.wardrobe-choice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid #7b5370;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(14px, 1.9vw, 18px);
  text-align: left;
}

.wardrobe-choice:hover {
  background: #fff0fa;
}

.wardrobe-choice > span:last-child {
  flex: 1;
}

.makeup-preview {
  position: relative;
  width: 42px;
  height: 28px;
  border-radius: 10px;
  background: #fff7fb;
  border: 2px solid rgba(123, 83, 112, 0.35);
  flex-shrink: 0;
}

.makeup-eye,
.makeup-cheek,
.makeup-lip,
.makeup-sparkle {
  position: absolute;
  border-radius: 50%;
}

.makeup-eye {
  width: 5px;
  height: 5px;
  left: 10px;
  top: 9px;
}

.makeup-cheek {
  width: 6px;
  height: 3px;
  top: 15px;
  left: 8px;
  border-radius: 999px;
  opacity: 0.9;
}

.makeup-lip {
  width: 8px;
  height: 3px;
  left: 18px;
  top: 18px;
  border-radius: 999px;
}

.makeup-sparkle {
  width: 4px;
  height: 4px;
  left: 28px;
  top: 8px;
}

.dress-preview {
  position: relative;
  width: 42px;
  height: 44px;
  border-radius: 10px;
  background: #fff7fb;
  border: 2px solid rgba(123, 83, 112, 0.35);
  flex-shrink: 0;
}

.dress-hair,
.dress-head,
.dress-bow,
.dress-body,
.dress-hem,
.dress-shoes {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.dress-hair {
  width: 18px;
  height: 8px;
  top: 2px;
  border-radius: 8px 8px 4px 4px;
  background: #5a2b62;
}

.dress-head {
  width: 14px;
  height: 12px;
  top: 7px;
  border-radius: 6px;
  background: #fdddb4;
}

.dress-bow {
  width: 12px;
  height: 5px;
  top: 4px;
  border-radius: 999px;
}

.dress-body {
  width: 14px;
  height: 14px;
  top: 18px;
  border-radius: 5px 5px 3px 3px;
}

.dress-hem {
  width: 20px;
  height: 10px;
  top: 28px;
  border-radius: 10px 10px 6px 6px;
}

.dress-shoes {
  width: 16px;
  height: 4px;
  top: 38px;
  border-radius: 999px;
  background: #6a3f50;
}

.dress-preview.rose .dress-bow { background: #ff4f88; }
.dress-preview.rose .dress-body { background: #ff7fa7; }
.dress-preview.rose .dress-hem { background: #ffd4e0; }
.dress-preview.rose .dress-hair { background: #4e2947; }
.dress-preview.rose .dress-head { background: #fdddb4; }
.dress-preview.rose .dress-shoes { background: #c93b66; }

.dress-preview.sky .dress-bow { background: #4b88ff; }
.dress-preview.sky .dress-body { background: #7eb8ff; }
.dress-preview.sky .dress-hem { background: #dcecff; }
.dress-preview.sky .dress-hair { background: #4b3d68; }
.dress-preview.sky .dress-head { background: #fdddb4; }
.dress-preview.sky .dress-shoes { background: #3d6fcc; }

.dress-preview.lavender .dress-bow { background: #8e62ff; }
.dress-preview.lavender .dress-body { background: #c89bff; }
.dress-preview.lavender .dress-hem { background: #efe1ff; }
.dress-preview.lavender .dress-hair { background: #51325b; }
.dress-preview.lavender .dress-head { background: #fdddb4; }
.dress-preview.lavender .dress-shoes { background: #6d45d1; }

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.dress-swatch {
  border-width: 3px;
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
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    max-width: none;
    margin: 0;
    border: none;
    border-radius: 0;
    aspect-ratio: unset;
    box-shadow: none;
    z-index: 40;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .game-canvas {
    width: auto;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .mobile-controls {
    display: block;
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .hud, .d-pad, .action-btns {
    pointer-events: auto;
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

  .hud.sky-hud {
    left: auto;
    right: 12px;
  }
  .dialogue-overlay {
    bottom: 16px;
    z-index: 70;
  }
  .dialogue-overlay.centered-dialogue {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(94vw, 520px);
    bottom: auto;
    z-index: 80;
  }

  .centered-dialogue .dialogue-box {
    max-height: 90dvh;
    padding: 12px 14px;
  }

  .dialogue-box.quiz-active .dialogue-progress {
    margin-bottom: 8px;
    padding: 4px 8px;
    font-size: clamp(11px, 3.6vw, 14px);
  }

  .dialogue-box.quiz-active .dialogue-speaker {
    margin-bottom: 8px;
    font-size: clamp(16px, 4.8vw, 22px);
  }

  .dialogue-box.quiz-active .dialogue-text {
    font-size: clamp(13px, 3.8vw, 16px);
    line-height: 1.35;
  }

  .dialogue-box.quiz-active .dialogue-choices {
    margin-top: 10px;
    gap: 8px;
  }

  .dialogue-box.quiz-active .dialogue-choice-btn {
    padding: 8px 10px;
    font-size: clamp(12px, 3.6vw, 15px);
    line-height: 1.3;
  }

  .wardrobe-panel {
    width: min(94vw, 480px);
    padding: 14px;
  }

  .wardrobe-choice {
    gap: 8px;
    padding: 10px 12px;
  }
}
</style>

