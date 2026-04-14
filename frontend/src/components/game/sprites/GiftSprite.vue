<template>
  <!-- Pixel-art gift box: box body + lid + ribbon + bow -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="100%"
    height="100%"
    shape-rendering="crispEdges"
    style="image-rendering: pixelated; overflow: visible;"
  >
    <!-- Shadow -->
    <ellipse cx="16" cy="31" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
    <!-- Box body -->
    <rect x="3" y="14" width="26" height="16" fill="var(--accent)" />
    <!-- Box body shading -->
    <rect x="22" y="14" width="7" height="16" fill="rgba(0,0,0,0.15)" />
    <!-- Lid -->
    <rect x="2" y="10" width="28" height="6" fill="var(--accent)" />
    <!-- Lid highlight -->
    <rect x="2" y="10" width="28" height="2" fill="rgba(255,255,255,0.2)" />
    <!-- Vertical ribbon on body -->
    <rect x="14" y="14" width="4" height="16" fill="rgba(255,255,255,0.5)" />
    <!-- Horizontal ribbon on lid -->
    <rect x="2" y="12" width="28" height="2" fill="rgba(255,255,255,0.5)" />
    <!-- Bow left loop -->
    <ellipse cx="11" cy="10" rx="5" ry="4" fill="rgba(255,255,255,0.7)" />
    <!-- Bow right loop -->
    <ellipse cx="21" cy="10" rx="5" ry="4" fill="rgba(255,255,255,0.7)" />
    <!-- Bow center knot -->
    <rect x="14" y="8" width="4" height="4" fill="rgba(255,255,255,0.9)" />
    <!-- Stars decoration -->
    <text x="7" y="25" font-size="6" fill="rgba(255,255,255,0.6)">★</text>
    <text x="19" y="25" font-size="6" fill="rgba(255,255,255,0.6)">★</text>
  </svg>
</template>
