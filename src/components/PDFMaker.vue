<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MergeableFile, FileType, WorkerInput, WorkerOutput } from '../domains/pdf/types';

const filesQueue = ref<MergeableFile[]>([]);
const isProcessing = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const shouldCompress = ref<boolean>(false);
const draggedIndex = ref<number | null>(null);

const canMerge = computed<boolean>(() => filesQueue.value.length > 0);

const submitActionText = computed<string>(() => {
  const isSingleFile = filesQueue.value.length === 1;
  const isImage = isSingleFile && filesQueue.value[0].type.startsWith('image/');
  
  if (isImage) return 'Converter Imagem para PDF';
  if (isSingleFile) return 'Gerar Cópia do PDF';
  
  return 'Gerar Arquivo Único';
});

const handleFileSelection = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  errorMessage.value = null;
  const selectedFiles = Array.from(target.files);

  for (const file of selectedFiles) {
    const validTypes: FileType[] = ['application/pdf', 'image/jpeg', 'image/png'];
    
    if (!validTypes.includes(file.type as FileType)) {
      errorMessage.value = `O arquivo "${file.name}" possui um formato inválido.`;
      continue;
    }

    try {
      const buffer = await file.arrayBuffer();
      filesQueue.value.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type as FileType,
        rawBuffer: buffer,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      });
    } catch {
      errorMessage.value = `Erro crítico ao ler a estrutura de ${file.name}.`;
    }
  }
  target.value = '';
};

const removeFile = (id: string): void => {
  const index = filesQueue.value.findIndex(f => f.id === id);
  if (index === -1) return;
  
  const file = filesQueue.value[index];
  if (file.previewUrl) {
    URL.revokeObjectURL(file.previewUrl);
  }
  filesQueue.value.splice(index, 1);
};

const onDragStart = (index: number): void => {
  draggedIndex.value = index;
};

const onDragOver = (index: number): void => {
  if (draggedIndex.value === null || draggedIndex.value === index) return;
  
  const movedItem = filesQueue.value.splice(draggedIndex.value, 1)[0];
  filesQueue.value.splice(index, 0, movedItem);
  draggedIndex.value = index;
};

const onDragEnd = (): void => {
  draggedIndex.value = null;
};

const executeMerge = (): void => {
  if (!canMerge.value || isProcessing.value) return;

  isProcessing.value = true;
  errorMessage.value = null;

  const worker = new Worker(
    new URL('../domains/pdf/workers/pdf-merger.worker.ts', import.meta.url),
    { type: 'module' }
  );

  const workerPayload: WorkerInput = {
    files: filesQueue.value.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      rawBuffer: f.rawBuffer
    })),
    options: {
      compressImages: shouldCompress.value
    }
  };

  worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
    const { success, pdfBytes, error } = event.data;

    if (!success || !pdfBytes) {
      errorMessage.value = error || 'Falha ao processar compilação.';
      isProcessing.value = false;
      worker.terminate();
      return;
    }

    downloadPdf(pdfBytes);
    isProcessing.value = false;
    worker.terminate();
  };

  worker.postMessage(workerPayload);
};

const downloadPdf = (bytes: Uint8Array): void => {
  const buffer = bytes.buffer as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pdf-maker-${Date.now()}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="w-full">
    <div class="relative w-full border-2 border-dashed border-neutral-700/80 rounded-2xl p-12 text-center bg-neutral-950/40 backdrop-blur-sm transition-all duration-300 hover:border-[#39FF14] hover:bg-[#39FF14]/5 focus-within:border-[#39FF14] focus-within:ring-1 focus-within:ring-[#39FF14]/50 shadow-xl group">
      <input 
        type="file" 
        multiple 
        accept=".pdf, .jpg, .jpeg, .png"
        @change="handleFileSelection"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        title="Clique ou arraste arquivos"
        data-test="file-input"
      />
      <div class="space-y-5 pointer-events-none flex flex-col items-center">
        <div class="p-5 rounded-full bg-neutral-900 group-hover:bg-[#39FF14]/10 transition-colors shadow-inner border border-neutral-800">
          <svg class="w-10 h-10 text-neutral-400 group-hover:text-[#39FF14] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </div>
        <div>
          <div class="text-neutral-200 font-bold text-xl">Arraste seus arquivos para cá ou <span class="text-[#39FF14] underline decoration-dashed underline-offset-4">busque no PC</span></div>
          <p class="text-sm text-neutral-500 mt-2">Suporte nativo para documentos PDF, e imagens PNG ou JPG.</p>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="mt-6 p-4 bg-red-950/80 border border-red-900 text-red-400 text-sm rounded-xl flex items-center gap-3 backdrop-blur-sm" data-test="error-message">
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      {{ errorMessage }}
    </div>

    <section v-if="filesQueue.length > 0" class="mt-12 space-y-5" data-test="files-queue">
      <div class="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h2 class="text-base font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <svg class="w-5 h-5 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Fila de Processamento
          </h2>
          <p class="text-xs text-neutral-500 mt-1">Arraste as linhas para definir a ordem exata do arquivo final.</p>
        </div>
        <span class="text-sm font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">{{ filesQueue.length }} item(s)</span>
      </div>
      
      <div class="grid gap-3">
        <div 
          v-for="(file, index) in filesQueue" 
          :key="file.id"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover.prevent="onDragOver(index)"
          @dragend="onDragEnd"
          class="group flex items-center justify-between p-4 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800 rounded-xl shadow-sm cursor-grab active:cursor-grabbing transition-all hover:border-neutral-600"
          :class="{'opacity-40 border-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.2)]': draggedIndex === index}"
        >
          <div class="flex items-center space-x-4 min-w-0 pointer-events-none">
            <svg class="w-5 h-5 text-neutral-600 group-hover:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
            
            <span class="text-sm font-bold text-neutral-600 w-6">#{{ index + 1 }}</span>
            
            <div class="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center overflow-hidden shrink-0 border border-neutral-800">
              <img v-if="file.previewUrl" :src="file.previewUrl" class="object-cover w-full h-full" alt="Preview"/>
              <svg v-else class="w-6 h-6 text-[#39FF14]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>

            <div class="min-w-0">
              <p class="text-sm font-bold text-neutral-200 truncate">{{ file.name }}</p>
              <p class="text-xs text-neutral-500 font-mono mt-0.5">{{ formatBytes(file.size) }}</p>
            </div>
          </div>

          <button 
            @click.stop="removeFile(file.id)"
            class="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer group/btn"
            title="Remover da lista"
          >
            <svg class="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6 mt-6">
        <label class="relative inline-flex items-center cursor-pointer select-none group bg-neutral-950/80 backdrop-blur-sm px-5 py-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors w-full md:w-auto">
          <input 
            type="checkbox" 
            v-model="shouldCompress" 
            class="sr-only peer" 
          />
          <div class="relative w-11 h-6 bg-neutral-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#39FF14]/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39FF14] peer-checked:after:bg-black"></div>
          <div class="ms-4">
            <span class="text-sm font-bold text-neutral-200 block">Otimizar e Comprimir Imagens</span>
            <span class="text-xs text-neutral-500 block mt-1">Reduz o tamanho do arquivo PDF final.</span>
          </div>
        </label>

        <button
          @click="executeMerge"
          :disabled="!canMerge || isProcessing"
          data-test="submit-button"
          class="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#39FF14] hover:bg-[#32e612] disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none text-black font-black text-sm rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] transition-all duration-300 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
        >
          <template v-if="isProcessing">
            <svg class="w-5 h-5 animate-spin text-neutral-800" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </template>
          <template v-else>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            {{ submitActionText }}
          </template>
        </button>
      </div>
    </section>
  </div>
</template>