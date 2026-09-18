import { readFileSync, writeFileSync } from 'node:fs'

const filled = JSON.parse(readFileSync(new URL('./fonts/paths.json', import.meta.url), 'utf8'))['italianno']
const center = 'M32 14C16 18 12 36 22 44C30 48 42 42 48 28C40 36 32 46 36 46C50 14 72 8 84 14C92 18 90 32 72 44C60 52 52 44 56 32C70 16 86 12 88 18C76 40 60 70 50 86C46 92 48 90 56 78C70 56 82 36 88 26'

writeFileSync(new URL('../src/components/Logo.vue', import.meta.url), `<template>
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>aq</title>
    <mask id="aq-mask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
      <path fill="white" d="${filled}" />
    </mask>
    <g mask="url(#aq-mask)">
      <path
        class="path1"
        d="${center}"
        stroke="black"
        stroke-width="11"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</template>

<style scoped>
@media (prefers-reduced-motion) {
  .path1 {
    animation: none !important;
    stroke-dasharray: unset !important;
  }
}
@media print {
  .path1 {
    animation: none !important;
    stroke-dasharray: unset !important;
  }
}
@keyframes grow {
  0% {
    stroke-dashoffset: 1px;
    stroke-dasharray: 0 420px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  40% {
    stroke-dasharray: 420px 0;
  }
  85% {
    stroke-dasharray: 420px 0;
  }
  95%,
  to {
    stroke-dasharray: 0 420px;
  }
}
.path1 {
  stroke-dashoffset: 1px;
  stroke-dasharray: 420px 0;
  animation: grow 10s ease forwards infinite;
  transform-origin: center;
  stroke: #303030;
}
.dark .path1 {
  stroke: #fdfdfd;
}
</style>
`)

writeFileSync(new URL('../src/components/LogoStroke.vue', import.meta.url), `<template>
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>aq</title>
    <path fill="currentColor" d="${filled}" />
  </svg>
</template>
`)

writeFileSync(new URL('../public/favicon.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <style>
    .s { fill: #333; }
    @media (prefers-color-scheme: dark) { .s { fill: #eee; } }
  </style>
  <path class="s" d="${filled}" />
</svg>
`)

writeFileSync(new URL('../public/logo.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#303030" d="${filled}" /></svg>
`)

writeFileSync(new URL('../public/logo-dark.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#fdfdfd" d="${filled}" /></svg>
`)

console.log('applied italianno aq logo')
