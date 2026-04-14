<template>
  <!-- Pixel-art balloon: oval body + string + shine dot -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 40"
    width="100%"
    height="100%"
    shape-rendering="crispEdges"
    style="image-rendering: pixelated; overflow: visible;"
  >
    <!-- Shadow -->
    <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.3)" />
    <!-- String -->
    <polyline points="16,30 15,33 17,36 16,38" stroke="#888" stroke-width="1.5" fill="none" />
    <!-- Balloon body -->
    <ellipse cx="16" cy="16" rx="12" ry="14" fill="var(--accent)" />
    <!-- Darker shading on right -->
    <ellipse cx="20" cy="18" rx="5" ry="7" fill="rgba(0,0,0,0.15)" />
    <!-- Shine highlight -->
    <ellipse cx="11" cy="10" rx="3" ry="4" fill="rgba(255,255,255,0.35)" />
    <!-- Knot at bottom -->
    <ellipse cx="16" cy="30" rx="2" ry="2" fill="var(--accent)" />
    <ellipse cx="16" cy="30" rx="1" ry="1" fill="rgba(0,0,0,0.3)" />
  </svg>
</template>
