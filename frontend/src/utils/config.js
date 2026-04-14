/**
 * Encode/decode game config to/from a Base64 URL hash.
 * Config shape:
 * {
 *   name: string,
 *   message: string,
 *   theme: { preset: string|null, bg: string, accent: string },
 *   music: { type: 'bundled'|'upload', src: string }
 * }
 */

export function encodeConfig(config) {
  const json = JSON.stringify(config)
  return btoa(unescape(encodeURIComponent(json)))
}

export function decodeConfig(hash) {
  try {
    const json = decodeURIComponent(escape(atob(hash)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function buildShareUrl(config) {
  const encoded = encodeConfig(config)
  const base = window.location.origin
  return `${base}/play#${encoded}`
}

export const DEFAULT_CONFIG = {
  name: '',
  message: '',
  theme: { preset: 'classic', bg: '#1a1a2e', accent: '#e94560' },
  music: { type: 'bundled', src: 'track1' },
}

export const PRESETS = {
  classic:  { label: 'Classic',  bg: '#1a1a2e', accent: '#e94560',  dark: true  },
  neon:     { label: 'Neon',     bg: '#0d0d0d', accent: '#39ff14',  dark: true  },
  pastel:   { label: 'Pastel',   bg: '#fce4ec', accent: '#c2185b',  dark: false },
  galaxy:   { label: 'Galaxy',   bg: '#0b0c2a', accent: '#a78bfa',  dark: true  },
  tropical: { label: 'Tropical', bg: '#004d40', accent: '#ffab40',  dark: true  },
}

/**
 * Returns whether a hex color is perceptually dark (luminance < 0.35).
 * Used to decide text color when a custom bg is chosen.
 */
export function isBgDark(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  // Relative luminance (sRGB)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum < 0.35
}

export const BUNDLED_TRACKS = [
  { id: 'track1', label: 'Happy Vibes',    file: '/music/track1.mp3' },
  { id: 'track2', label: 'Party Time',     file: '/music/track2.mp3' },
  { id: 'track3', label: 'Celebration',    file: '/music/track3.mp3' },
]
