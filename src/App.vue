<script setup lang="ts">
import FloatingBackground from './components/layout/FloatingBackground.vue';
import AppFooter from './components/layout/AppFooter.vue';
import PDFMaker from './components/PDFMaker.vue';
</script>

<template>
  <div class="relative min-h-screen flex flex-col font-sans text-neutral-200">
    <FloatingBackground />
    
    <main class="relative z-10 flex-grow flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-16 md:py-24">
      
      <header class="mb-14 text-center w-full">
        <h1 class="text-4xl md:text-5xl font-black tracking-tight text-white inline-flex items-center gap-4">
          <svg class="w-10 h-10 text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
          PDF Maker
        </h1>
        <p class="text-base text-neutral-400 mt-4 font-medium max-w-xl mx-auto">Motor de criação, conversão e mesclagem de documentos. 100% gratuito e executado localmente no seu navegador para total privacidade.</p>
      </header>

      <PDFMaker />
    </main>

    <AppFooter />
  </div>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #0a0a0a;
}
</style>