<template>
  <div class="loader" :class="{ 'loader-hidden': hidden }">
    <div class="loader-content">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <span class="loader-text">{{ text }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hidden: { type: Boolean, default: false },
  text: { type: String, default: 'SYSTEM INITIALIZING...' }
})
</script>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: linear-gradient(135deg, #050a14, #0a0f1e, #050a14);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
}

.loader-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.loader-content {
  text-align: center;
  position: relative;
}

.loader-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #ff00ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-ring:nth-child(2) {
  inset: 10px;
  border-top-color: transparent;
  border-right-color: #00ffff;
  animation-direction: reverse;
  animation-duration: 1.5s;
}

.loader-ring:nth-child(3) {
  inset: 20px;
  border-top-color: transparent;
  border-bottom-color: #ff00ff;
  animation-duration: 2s;
}

.loader-text {
  position: relative;
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 3px;
  animation: pulse-text 1.5s ease-in-out infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>