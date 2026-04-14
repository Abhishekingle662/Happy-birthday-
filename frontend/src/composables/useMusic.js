import { ref } from 'vue'
import { BUNDLED_TRACKS } from '../utils/config.js'

// Singleton — one audio instance shared across all components
const audio = ref(null)
const muted = ref(false)
const playing = ref(false)

export function useMusic() {
  function resolveSource(musicConfig) {
    if (!musicConfig) return null
    if (musicConfig.type === 'upload') return musicConfig.src
    const track = BUNDLED_TRACKS.find(t => t.id === musicConfig.src)
    return track ? track.file : null
  }

  function load(musicConfig) {
    stop()
    const src = resolveSource(musicConfig)
    if (!src) return
    audio.value = new Audio(src)
    audio.value.loop = true
    audio.value.muted = muted.value
    audio.value.volume = 0.5
  }

  function play(musicConfig) {
    if (musicConfig) load(musicConfig)
    if (!audio.value) return
    audio.value.play()
      .then(() => { playing.value = true })
      .catch(() => { playing.value = false })
  }

  function stop() {
    if (audio.value) {
      audio.value.pause()
      audio.value.currentTime = 0
      audio.value = null
    }
    playing.value = false
  }

  function toggleMute() {
    muted.value = !muted.value
    if (audio.value) audio.value.muted = muted.value
  }

  // Call on first user interaction to unblock autoplay
  function unlockAndPlay() {
    if (audio.value && !playing.value) {
      audio.value.play()
        .then(() => { playing.value = true })
        .catch(() => {})
    }
  }

  return { muted, playing, play, stop, toggleMute, unlockAndPlay }
}
