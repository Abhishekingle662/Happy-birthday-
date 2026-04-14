<template>
  <!-- Pixel-art candle: wax body + flame + drips -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 40"
    width="100%"
    height="100%"
    shape-rendering="crispEdges"
    style="image-rendering: pixelated; overflow: visible;"
  >
    <!-- Shadow -->
    <ellipse cx="10" cy="39" rx="5" ry="1.5" fill="rgba(0,0,0,0.3)" />
    <!-- Candle body -->
    <rect x="6" y="18" width="8" height="20" fill="#fff9c4" />
    <!-- Candle shading -->
    <rect x="12" y="18" width="2" height="20" fill="rgba(0,0,0,0.12)" />
    <!-- Candle highlight -->
    <rect x="7" y="18" width="2" height="20" fill="rgba(255,255,255,0.4)" />
    <!-- Wax drip left -->
    <ellipse cx="7" cy="20" rx="2" ry="3" fill="#fff176" />
    <!-- Wax drip right -->
    <ellipse cx="13" cy="22" rx="1.5" ry="2.5" fill="#fff176" />
    <!-- Wick -->
    <rect x="9" y="12" width="2" height="7" fill="#555" />
    <!-- Flame outer (orange) -->
    <ellipse cx="10" cy="9" rx="5" ry="7" fill="#ff9800" />
    <!-- Flame mid (yellow) -->
    <ellipse cx="10" cy="10" rx="3" ry="5" fill="#ffeb3b" />
    <!-- Flame inner (white) -->
    <ellipse cx="10" cy="11" rx="1.5" ry="3" fill="#fff" />
    <!-- Flame glow -->
    <ellipse cx="10" cy="9" rx="7" ry="9" fill="rgba(255,152,0,0.15)" />
  </svg>
</template>
