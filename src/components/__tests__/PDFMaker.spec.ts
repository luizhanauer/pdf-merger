import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PDFMaker from '../PDFMaker.vue';

// --- Configuração de Mocks Globais (Boundary Protection) ---

// 1. Mock do crypto para geração de UUID
vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid-1234' });

// 2. Mock Seguro da API de URL utilizando o padrão universal ECMAScript (globalThis)
const createObjectURLMock = vi.fn(() => 'blob:mock-url');
const revokeObjectURLMock = vi.fn();
globalThis.URL.createObjectURL = createObjectURLMock;
globalThis.URL.revokeObjectURL = revokeObjectURLMock;

// 3. Mock Rastreável do Web Worker
let mockWorkerInstance: any = null;
const MockWorker = vi.fn().mockImplementation(function(this: any) {
  this.postMessage = vi.fn();
  this.terminate = vi.fn();
  this.onmessage = null;
  mockWorkerInstance = this; // Guarda a referência da instância ativa para o teste
});
vi.stubGlobal('Worker', MockWorker);

// 4. Mock da API de File para simular o ArrayBuffer
class MockFile extends File {
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new ArrayBuffer(8);
  }
}

// 5. Mock de criação de âncora para download
const clickMock = vi.fn();
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'a') {
    return { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement;
  }
  return originalCreateElement(tagName);
});

describe('PDFMaker.vue - Full Coverage Suite', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    // Limpa o estado e as memórias dos mocks antes de cada teste
    vi.clearAllMocks();
    MockWorker.mockClear();
    mockWorkerInstance = null;
    wrapper = mount(PDFMaker);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // --- Testes de Renderização e Estado Inicial ---
  
  it('deve renderizar a interface base sem fila de arquivos', () => {
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="files-queue"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="error-message"]').exists()).toBe(false);
  });

  // --- Testes de Seleção e Validação de Arquivos ---

  it('deve bloquear arquivos com formatos não suportados', async () => {
    const input = wrapper.find('[data-test="file-input"]');
    const invalidFile = new MockFile(['conteúdo'], 'documento.txt', { type: 'text/plain' });
    
    Object.defineProperty(input.element, 'files', { value: [invalidFile] });
    await input.trigger('change');
    
    const errorMessage = wrapper.find('[data-test="error-message"]');
    expect(errorMessage.exists()).toBe(true);
    expect(errorMessage.text()).toContain('O arquivo "documento.txt" possui um formato inválido.');
    expect(wrapper.vm.filesQueue.length).toBe(0);
  });

  it('deve processar e adicionar arquivos PDF válidos sem gerar preview visual', async () => {
    const input = wrapper.find('[data-test="file-input"]');
    const validPdf = new MockFile(['pdf-data'], 'relatorio.pdf', { type: 'application/pdf' });
    
    Object.defineProperty(input.element, 'files', { value: [validPdf] });
    await input.trigger('change');
    
    expect(wrapper.vm.filesQueue.length).toBe(1);
    expect(wrapper.vm.filesQueue[0].type).toBe('application/pdf');
    expect(wrapper.vm.filesQueue[0].previewUrl).toBeUndefined();
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('deve processar e adicionar imagens gerando preview URL', async () => {
    const input = wrapper.find('[data-test="file-input"]');
    const validImage = new MockFile(['img-data'], 'foto.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(input.element, 'files', { value: [validImage] });
    await input.trigger('change');
    
    expect(wrapper.vm.filesQueue.length).toBe(1);
    expect(wrapper.vm.filesQueue[0].previewUrl).toBe('blob:mock-url');
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
  });

  it('deve ignorar a execução se o input não possuir arquivos (Early Return)', async () => {
    const input = wrapper.find('[data-test="file-input"]');
    Object.defineProperty(input.element, 'files', { value: null });
    await input.trigger('change');
    expect(wrapper.vm.filesQueue.length).toBe(0);
  });

  // --- Testes de Gestão da Fila (Remoção) ---

  it('deve remover um arquivo da fila e limpar sua memória', async () => {
    wrapper.vm.filesQueue = [
      { id: 'item-1', name: 'img1.png', size: 1024, type: 'image/png', rawBuffer: new ArrayBuffer(8), previewUrl: 'blob:mock-1' }
    ];
    await wrapper.vm.$nextTick();

    wrapper.vm.removeFile('item-1');
    
    expect(wrapper.vm.filesQueue.length).toBe(0);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-1');
  });

  it('deve abortar a remoção silenciosamente se o ID não for encontrado', async () => {
    wrapper.vm.filesQueue = [{ id: 'item-1', name: 'doc.pdf', size: 1024, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }];
    wrapper.vm.removeFile('item-fantasma');
    expect(wrapper.vm.filesQueue.length).toBe(1);
  });

  // --- Testes de Interação Drag and Drop (Ordenação) ---

  it('deve reordenar itens na fila usando Drag and Drop', async () => {
    wrapper.vm.filesQueue = [
      { id: '1', name: 'primeiro.pdf', size: 100, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) },
      { id: '2', name: 'segundo.pdf', size: 100, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }
    ];
    await wrapper.vm.$nextTick();

    wrapper.vm.onDragStart(0);
    expect(wrapper.vm.draggedIndex).toBe(0);

    wrapper.vm.onDragOver(1);
    expect(wrapper.vm.draggedIndex).toBe(1);
    expect(wrapper.vm.filesQueue[0].id).toBe('2');
    expect(wrapper.vm.filesQueue[1].id).toBe('1');

    wrapper.vm.onDragEnd();
    expect(wrapper.vm.draggedIndex).toBeNull();
  });

  it('deve ignorar DragOver se o índice for o mesmo ou nulo', async () => {
    wrapper.vm.filesQueue = [{ id: '1', name: 'doc.pdf', size: 100, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }];
    wrapper.vm.draggedIndex = null;
    
    wrapper.vm.onDragOver(0);
    expect(wrapper.vm.filesQueue[0].id).toBe('1');
  });

  // --- Testes do Utilitário de Texto e UX ---

  it('deve formatar bytes corretamente para exibição humana', async () => {
    wrapper.vm.filesQueue = [
      { id: '1', name: 'zero.pdf', size: 0, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) },
      { id: '2', name: 'kb.pdf', size: 1024, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) },
      { id: '3', name: 'mb.pdf', size: 1048576, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }
    ];
    await wrapper.vm.$nextTick();

    const texts = wrapper.text();
    expect(texts).toContain('0 Bytes');
    expect(texts).toContain('1 KB');
    expect(texts).toContain('1 MB');
  });

  it('deve exibir o texto correto no botão de submissão dinamicamente', async () => {
    wrapper.vm.filesQueue = [{ id: '1', name: 'img.png', size: 10, type: 'image/png', rawBuffer: new ArrayBuffer(8) }];
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="submit-button"]').text()).toContain('Converter Imagem para PDF');

    wrapper.vm.filesQueue = [{ id: '1', name: 'doc.pdf', size: 10, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }];
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="submit-button"]').text()).toContain('Gerar Cópia do PDF');

    wrapper.vm.filesQueue.push({ id: '2', name: 'doc2.pdf', size: 10, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="submit-button"]').text()).toContain('Gerar Arquivo Único');
  });

  // --- Testes de Integração e Orquestração do Web Worker ---

  it('deve despachar processamento via Worker e realizar o download no sucesso', async () => {
    wrapper.vm.filesQueue = [{ id: '1', name: 'doc.pdf', size: 10, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }];
    await wrapper.vm.$nextTick();

    wrapper.vm.executeMerge();
    
    expect(wrapper.vm.isProcessing).toBe(true);
    expect(MockWorker).toHaveBeenCalledTimes(1);

    // Simula a resposta positiva assíncrona do Worker
    const fakePdfBytes = new Uint8Array([1, 2, 3]);
    mockWorkerInstance.onmessage({
      data: { success: true, pdfBytes: fakePdfBytes }
    });

    expect(wrapper.vm.isProcessing).toBe(false);
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('deve interceptar erro do Worker e exibir mensagem na interface', async () => {
    wrapper.vm.filesQueue = [{ id: '1', name: 'doc.pdf', size: 10, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }];
    await wrapper.vm.$nextTick();

    wrapper.vm.executeMerge();

    // Simula a resposta de erro assíncrona do Worker
    mockWorkerInstance.onmessage({
      data: { success: false, error: 'Falha simulada na mesclagem' }
    });

    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.isProcessing).toBe(false);
    expect(wrapper.find('[data-test="error-message"]').text()).toContain('Falha simulada na mesclagem');
    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('deve abortar execução do merge se canMerge for falso ou já estiver processando', async () => {
    // Cenário Vazio
    wrapper.vm.filesQueue = [];
    wrapper.vm.executeMerge();
    expect(MockWorker).not.toHaveBeenCalled();

    // Cenário Já Processando (Lock de concorrência)
    wrapper.vm.filesQueue = [{ id: '1', name: 'doc.pdf', size: 10, type: 'application/pdf', rawBuffer: new ArrayBuffer(8) }];
    wrapper.vm.isProcessing = true;
    wrapper.vm.executeMerge();
    expect(MockWorker).not.toHaveBeenCalled();
  });
});