<script setup lang="ts">
// Componente de animação isolado
</script>

<template>
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-neutral-950">
    <svg class="floating-icon icon-1" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    <svg class="floating-icon icon-2" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
    <svg class="floating-icon icon-3" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    <svg class="floating-icon icon-4" viewBox="0 0 24 24" fill="none" stroke="#39FF14" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
  </div>
</template>

<style scoped>
.floating-icon {
  position: absolute;
  width: 64px;
  height: 64px;
  animation-name: float;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  opacity: 0.25;
  filter: drop-shadow(0 0 10px rgba(57, 255, 20, 0.4));
}
.icon-1 { top: 15%; left: 10%; animation-duration: 8s; animation-delay: 0s; }
.icon-2 { top: 60%; left: 85%; width: 48px; height: 48px; animation-duration: 10s; animation-delay: 2s; }
.icon-3 { top: 75%; left: 15%; width: 56px; height: 56px; animation-duration: 12s; animation-delay: 1s; }
.icon-4 { top: 20%; left: 80%; animation-duration: 9s; animation-delay: 3s; }

@keyframes float {
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
  100% { transform: translateY(0) rotate(0deg); }
}
</style>