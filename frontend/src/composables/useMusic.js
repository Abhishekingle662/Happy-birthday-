import { ref } from 'vue'

// Singleton — one audio context shared across all components
const muted = ref(false)
const playing = ref(false)

let audioCtx = null
let gainNode = null
let oscillators = []
let loopInterval = null
let uploadAudio = null  // HTMLAudioElement for uploaded tracks

// ── Web Audio tone generator ──────────────────────────────────────────────
// Generates looping birthday melodies via Web Audio API — no MP3 files needed.

const MELODIES = {
  track1: [
    // Happy Birthday melody (simplified)
    { freq: 261.6, dur: 0.3 }, { freq: 261.6, dur: 0.15 },
    { freq: 293.7, dur: 0.45 }, { freq: 261.6, dur: 0.45 },
    { freq: 349.2, dur: 0.45 }, { freq: 329.6, dur: 0.9 },
    { freq: 261.6, dur: 0.3 }, { freq: 261.6, dur: 0.15 },
    { freq: 293.7, dur: 0.45 }, { freq: 261.6, dur: 0.45 },
    { freq: 392.0, dur: 0.45 }, { freq: 349.2, dur: 0.9 },
  ],
  track2: [
    // Upbeat party riff
    { freq: 392.0, dur: 0.2 }, { freq: 440.0, dur: 0.2 },
    { freq: 493.9, dur: 0.2 }, { freq: 523.3, dur: 0.4 },
    { freq: 493.9, dur: 0.2 }, { freq: 440.0, dur: 0.2 },
    { freq: 392.0, dur: 0.4 }, { freq: 349.2, dur: 0.2 },
    { freq: 392.0, dur: 0.6 }, { freq: 0,     dur: 0.2 },
  ],
  track3: [
    // Gentle celebration arpeggio
    { freq: 523.3, dur: 0.25 }, { freq: 659.3, dur: 0.25 },
    { freq: 783.9, dur: 0.25 }, { freq: 1046.5, dur: 0.5 },
    { freq: 783.9, dur: 0.25 }, { freq: 659.3,  dur: 0.25 },
    { freq: 523.3, dur: 0.5  }, { freq: 0,      dur: 0.25 },
    { freq: 440.0, dur: 0.25 }, { freq: 523.3,  dur: 0.25 },
    { freq: 659.3, dur: 0.5  }, { freq: 0,      dur: 0.25 },
  ],
}

function getOrCreateContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    gainNode = audioCtx.createGain()
    gainNode.gain.value = muted.value ? 0 : 0.18
    gainNode.connect(audioCtx.destination)
  }
  return audioCtx
}

function stopTones() {
  if (loopInterval) { clearInterval(loopInterval); loopInterval = null }
  oscillators.forEach(o => { try { o.stop(0); o.disconnect() } catch {} })
  oscillators = []
}

function playMelody(trackId) {
  const ctx = getOrCreateContext()
  if (ctx.state === 'suspended') ctx.resume()

  const notes = MELODIES[trackId] || MELODIES.track1
  const totalDur = notes.reduce((s, n) => s + n.dur, 0)

  function scheduleMelody(startTime) {
    let t = startTime
    notes.forEach(({ freq, dur }) => {
      if (freq > 0) {
        const osc = ctx.createOscillator()
        const env = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        env.gain.setValueAtTime(0, t)
        env.gain.linearRampToValueAtTime(0.6, t + 0.02)
        env.gain.linearRampToValueAtTime(0, t + dur - 0.02)
        osc.connect(env)
        env.connect(gainNode)
        osc.start(t)
        osc.stop(t + dur)
        oscillators.push(osc)
      }
      t += dur
    })
    return t  // returns time after last note
  }

  // Pre-schedule two loops so there's no gap at start
  let nextStart = ctx.currentTime + 0.05
  nextStart = scheduleMelody(nextStart)
  nextStart = scheduleMelody(nextStart)

  // Keep scheduling one loop ahead every ~1.5× melody duration
  loopInterval = setInterval(() => {
    if (!playing.value) return
    nextStart = scheduleMelody(nextStart)
    // Prune finished oscillators to avoid unbounded growth
    oscillators = oscillators.filter(o => {
      try { return o.context && o.context.state !== 'closed' } catch { return false }
    })
  }, totalDur * 1000 * 1.4)
}

// ── Public API ────────────────────────────────────────────────────────────

export function useMusic() {
  function play(musicConfig) {
    stop()
    if (!musicConfig) return

    if (musicConfig.type === 'upload' && musicConfig.src) {
      uploadAudio = new Audio(musicConfig.src)
      uploadAudio.loop = true
      uploadAudio.volume = 0.5
      uploadAudio.muted = muted.value
      uploadAudio.play()
        .then(() => { playing.value = true })
        .catch(() => { playing.value = false })
    } else {
      const trackId = musicConfig.src || 'track1'
      try {
        playMelody(trackId)
        playing.value = true
      } catch {
        playing.value = false
      }
    }
  }

  function stop() {
    stopTones()
    if (uploadAudio) {
      uploadAudio.pause()
      uploadAudio.currentTime = 0
      uploadAudio = null
    }
    playing.value = false
  }

  function toggleMute() {
    muted.value = !muted.value
    if (gainNode) gainNode.gain.value = muted.value ? 0 : 0.18
    if (uploadAudio) uploadAudio.muted = muted.value
  }

  function unlockAndPlay() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => { playing.value = true })
    }
    if (uploadAudio && !playing.value) {
      uploadAudio.play()
        .then(() => { playing.value = true })
        .catch(() => {})
    }
  }

  return { muted, playing, play, stop, toggleMute, unlockAndPlay }
}
