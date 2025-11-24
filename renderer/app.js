// silviotecmarques/fila-farmacia-app/fila-farmacia-app-9f1bec4e26f6601c81d2660e8e65f0f1af883e39/renderer/app.js

// Lista padrão, usada se não houver nada no localStorage
const DEFAULT_BALCONISTAS = [
  { nome: "Wendeel", id: "wendeel" },
  { nome: "Drª Josyanne", id: "dra-josyanne" },
  { nome: "Drª Leiliane", id: "dra-leiliane" },
  { nome: "Drª Renata", id: "dra-renata" },
  { nome: "Franciete", id: "franciete" },
  { nome: "Eriane", id: "eriane" },
  { nome: "Taynan", id: "taynan" },
  { nome: "Taina", id: "taina" }
];

// Opções da Galeria (Usando as 6 imagens que você forneceu - DEVE ESTAR EM assets/fotos/galeria/)
const GALLERY_OPTIONS = [
    { name: "Pato", path: "assets/fotos/galeria/duck.png" }, 
    { name: "Raposa", path: "assets/fotos/galeria/fox.png" },
    { name: "Panda", path: "assets/fotos/galeria/panda-bear.png" }, 
    { name: "Coelho", path: "assets/fotos/galeria/rabbit.png" },
    { name: "Bicho Preguiça", path: "assets/fotos/galeria/sloth.png" },
    { name: "Tigre", path: "assets/fotos/galeria/tiger.png" }
];


let balconistas = []; 
let fila = [];
let tempoFila = {};
let tempoRelogio = {};
let atendimentos = {};
let horasUltimoAtendimento = {};
let tempoTotalEspera = {};
let historico = {};
let cronometroInterval = null;

// NOVO: Estado Global do Modo de Deleção
let isDeletionMode = false; 
let selectedForDeletion = []; 

// NOVO: Utilitário de data para reset diário
function todayKey() {
    return new Date().toDateString();
}

// Funções de Persistência
function saveState() {
    try {
        localStorage.setItem('balconistas', JSON.stringify(balconistas));
        localStorage.setItem('fila', JSON.stringify(fila));
        localStorage.setItem('tempoFila', JSON.stringify(tempoFila));
        localStorage.setItem('atendimentos', JSON.stringify(atendimentos));
        localStorage.setItem('tempoTotalEspera', JSON.stringify(tempoTotalEspera));
        localStorage.setItem('horasUltimoAtendimento', JSON.stringify(horasUltimoAtendimento));
        
        localStorage.setItem('lastSavedDate', todayKey()); 
    } catch(e) {
        console.error("Erro ao salvar estado:", e);
    }
}

function loadState() {
    try {
        const storedBalconistas = localStorage.getItem('balconistas');
        balconistas = storedBalconistas ? JSON.parse(storedBalconistas) : DEFAULT_BALCONISTAS;
        
        const lastSavedDate = localStorage.getItem('lastSavedDate');
        const isNewDay = lastSavedDate !== todayKey();

        if (isNewDay) {
            console.log("Novo dia de trabalho. Resetando fila e tempos.");
            
            atendimentos = JSON.parse(localStorage.getItem('atendimentos') || '{}');
            tempoTotalEspera = JSON.parse(localStorage.getItem('tempoTotalEspera') || '{}');
            
            fila = [];
            tempoFila = {};
            tempoRelogio = {}; 
            horasUltimoAtendimento = {};
            
        } else {
            fila = JSON.parse(localStorage.getItem('fila') || '[]');
            tempoFila = JSON.parse(localStorage.getItem('tempoFila') || '{}');
            atendimentos = JSON.parse(localStorage.getItem('atendimentos') || '{}');
            tempoTotalEspera = JSON.parse(localStorage.getItem('tempoTotalEspera') || '{}');
            horasUltimoAtendimento = JSON.parse(localStorage.getItem('horasUltimoAtendimento') || '{}');
        }
        
        fila = fila.filter(b => b && b.id);
        
    } catch(e) {
        console.error("Erro ao carregar estado:", e);
        balconistas = DEFAULT_BALCONISTAS;
    }
}

loadState(); // Carrega o estado ao iniciar

// DOM (Tela Principal)
const nomeAtual = document.getElementById("nome-atual");
const fotoAtual = document.getElementById("foto-atual");
const btnAtendi = document.getElementById("btn-atendi");
const btnGestao = document.getElementById("btn-gestao");
const telaFila = document.getElementById("tela-fila");
const telaGestao = document.getElementById("tela-gestao");
const btnOk = document.getElementById("btn-ok");
const btnAdicionarBalconista = document.getElementById("btn-adicionar-balconista"); 
const btnToggleDeletion = document.getElementById("btn-toggle-deletion"); 

// Elementos do Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalNomeInput = document.getElementById('modal-nome');
const modalImageFileInput = document.getElementById('modal-image-file');
const btnSelecionarImagemModal = document.getElementById('btn-selecionar-imagem-modal');
const btnSalvarModal = document.getElementById('btn-salvar-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const modalImagePreview = document.getElementById('modal-image-preview');
const modalStatus = document.getElementById('modal-status');
const modalForm = document.getElementById('modal-add-form');
const imageGallery = document.getElementById('image-gallery'); 

let selectedImageBase64 = null;

// Auxiliar para gerar o ID
function slugify(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\w\s-]/g, '') 
    .trim()
    .replace(/[-\s]+/g, '-');
}

// ------------------------------------
// LÓGICA DO MODAL
// ------------------------------------

// Utilitário para carregar imagem local (Gallery) e obter Base64 usando Canvas
function getBase64FromPath(path, callback) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Retorna apenas a Base64 string, removendo o prefixo
        const dataUrl = canvas.toDataURL('image/png'); 
        callback(dataUrl.split(',')[1]);
    };
    img.onerror = function() {
        console.error(`Erro ao carregar imagem de galeria: ${path}`);
        callback(null);
    };
    img.src = path;
}

// Renderiza a galeria de imagens
function renderImageGallery() {
    imageGallery.innerHTML = '';
    GALLERY_OPTIONS.forEach((option, index) => {
        const div = document.createElement('div');
        div.classList.add('gallery-option');
        
        const img = document.createElement('img');
        img.src = option.path;
        img.alt = option.name;
        img.title = option.name;
        
        div.appendChild(img);
        
        // Lógica de seleção da Galeria
        div.onclick = () => {
            document.querySelectorAll('.gallery-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            
            modalImageFileInput.value = '';
            modalStatus.textContent = 'Carregando Base64...';

            getBase64FromPath(option.path, (base64) => {
                if (base64) {
                    selectedImageBase64 = base64;
                    modalImagePreview.innerHTML = `<img src="data:image/png;base64,${base64}" alt="Preview">`;
                    modalStatus.textContent = `Imagem '${option.name}' selecionada.`;
                } else {
                    modalStatus.textContent = 'Erro ao carregar a imagem da galeria. Tente carregar do PC.';
                    selectedImageBase64 = null;
                }
                updateModalSaveButton();
            });
        };
        
        imageGallery.appendChild(div);
    });
}

// 1. Abrir Modal (Chamado pelo btnAdicionarBalconista)
function openAddModal() {
    modalOverlay.style.display = 'flex';
    renderImageGallery();
    
    modalForm.reset();
    selectedImageBase64 = null;
    btnSalvarModal.disabled = true;
    modalStatus.textContent = '';
    
    modalImagePreview.innerHTML = `<span style="color: #8b8680; font-size: 14px;">Nenhuma Imagem Selecionada</span>`;
    document.querySelectorAll('.gallery-option').forEach(el => el.classList.remove('selected'));
    
    modalNomeInput.focus();
}

// 2. Fechar Modal
function closeAddModal() {
    modalOverlay.style.display = 'none';
}

// 3. Seleção e Leitura da Imagem (usando FileReader)
function handleImageSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        modalStatus.textContent = 'Por favor, selecione um arquivo de imagem válido (.png ou .jpg).';
        selectedImageBase64 = null;
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        selectedImageBase64 = base64Data;

        modalImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        modalStatus.textContent = 'Imagem do PC carregada.';
        updateModalSaveButton();
        
        document.querySelectorAll('.gallery-option').forEach(el => el.classList.remove('selected'));
    };
    reader.onerror = () => {
        modalStatus.textContent = 'Erro ao ler o arquivo.';
        selectedImageBase64 = null;
        updateModalSaveButton();
    };
    reader.readAsDataURL(file); // Converte para Base64
}

// 4. Lógica de Salvar Balconista (Simulando o Main Process)
function saveNewBalconista(nome, id, base64Image) {
    
    // Armazena a Base64 para renderização
    balconistas.push({ 
        nome: nome, 
        id: id,
        base64: base64Image 
    });
    saveState(); 

    closeAddModal();
    montarTela2();
    atualizarTela1();
    console.log(`Balconista '${nome}' adicionado. (Lembrete: A imagem Base64 precisa ser salva em assets/fotos/${id}-colorida.png no Main Process para persistência real do arquivo.)`);
}


// 5. Botões e Event Listeners do Modal
function updateModalSaveButton() {
    btnSalvarModal.disabled = !(modalNomeInput.value.trim().length > 0 && selectedImageBase64);
}

// Evento de Clique no botão principal: Abre o Modal
btnAdicionarBalconista.onclick = openAddModal; 

// Evento de Clique no botão do Modal (Chama o input de arquivo)
btnSelecionarImagemModal.onclick = () => {
    modalImageFileInput.click();
};

// Evento de Clique na prévia da imagem (Abre a caixa de diálogo de arquivo)
modalImagePreview.onclick = () => {
    modalImageFileInput.click();
};

// Evento de Mudança no input de arquivo
modalImageFileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
        handleImageSelect(e.target.files[0]);
    }
};

// Evento de Mudança no input de nome
modalNomeInput.oninput = updateModalSaveButton;

// Evento de Cancelar
btnCancelarModal.onclick = closeAddModal;

// Evento de Submissão do Formulário
modalForm.onsubmit = (e) => {
    e.preventDefault();
    if (btnSalvarModal.disabled) return;

    const nome = modalNomeInput.value.trim();
    const id = slugify(nome);

    if (balconistas.some(b => b.id === id)) {
        modalStatus.textContent = `Erro: O ID '${id}' (derivado do nome) já existe. Altere o nome.`;
        return;
    }

    if (!selectedImageBase64) {
        modalStatus.textContent = 'Erro: Imagem não carregada.';
        return;
    }

    // Chamada para a função de salvamento (simulação)
    saveNewBalconista(nome, id, selectedImageBase64);
};

// ===== TELA 1 (Atualizada para verificar Base64) =====
function atualizarTela1() {
  if (fila.length > 0) {
    const atual = fila[0];
    nomeAtual.textContent = atual.nome;
    setTimeout(() => {
      // SE TEM BASE64 (USUÁRIO NOVO), USA DATA URI. CASO CONTRÁRIO, USA O CAMINHO DO ARQUIVO.
      if (atual.base64) {
          fotoAtual.src = `data:image/png;base64,${atual.base64}`;
      } else {
          fotoAtual.src = `assets/fotos/${atual.id}-colorida.png?v=${Date.now()}`;
      }
    }, 50);
  } else {
    nomeAtual.textContent = "SEM ATENDIMENTOS NO MOMENTO";
    fotoAtual.src = "assets/icons/sem-atendimento.png";
  }
  atualizarTabelaFila();
  atualizarCardsFila();
  iniciarCronometro();
}

btnAtendi.onclick = () => {
  if (!fila.length) return;

  const atendido = fila.shift();
  fila.push(atendido);

  atendimentos[atendido.id] = (atendimentos[atendido.id] || 0) + 1;
  const agora = new Date();
  horasUltimoAtendimento[atendido.id] = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const esperaAtual = tempoRelogio[atendido.id] || 0;
  tempoTotalEspera[atendido.id] = (tempoTotalEspera[atendido.id] || 0) + esperaAtual;
  tempoRelogio[atendido.id] = 0;

  atualizarTela1();
  saveState(); // Salva o estado após o atendimento
};

// ===== TELA 2 (Gestão - Modo Deleção) =====
btnGestao.onclick = () => {
  telaFila.style.display = "none";
  telaGestao.style.display = "block";
  montarTela2();
};

btnOk.onclick = () => {
  // Se o modo de deleção estiver ativo, apenas CANCELA o modo, permanecendo na tela de Gestão.
  if (isDeletionMode) {
      toggleDeletionMode();
  } else {
      // Modo normal: Sai da tela de Gestão e volta para a Fila.
      telaGestao.style.display = "none";
      telaFila.style.display = "block";
      atualizarTela1();
      saveState(); 
  }
};

// NOVO: Função para alternar o Modo de Deleção
function toggleDeletionMode() {
    isDeletionMode = !isDeletionMode;
    selectedForDeletion = [];
    
    // Altera o visual do botão
    if (isDeletionMode) {
        btnToggleDeletion.textContent = "EXCLUIR"; 
        btnToggleDeletion.classList.add('active-mode'); 
        btnToggleDeletion.classList.remove('ready-to-confirm'); 
        
        // Desativa Adicionar Novo
        btnAdicionarBalconista.disabled = true; 
        
        // Altera botão VOLTAR para CANCELAR (amarelo)
        btnOk.textContent = "CANCELAR"; 
        btnOk.classList.add('cancel-yellow'); // Adiciona classe para cor amarela
    } else {
        btnToggleDeletion.textContent = "EXCLUIR"; 
        btnToggleDeletion.classList.remove('active-mode');
        btnToggleDeletion.classList.remove('ready-to-confirm');
        
        // Reativa Adicionar Novo
        btnAdicionarBalconista.disabled = false;
        
        // Restaura botão VOLTAR
        btnOk.textContent = "VOLTAR";
        btnOk.classList.remove('cancel-yellow'); // Remove classe amarela
    }
    montarTela2();
}

// NOVO: Handler do botão central
btnToggleDeletion.onclick = () => {
    if (isDeletionMode) {
        // Ação: CONFIRMAR EXCLUSÃO
        const idsToRemove = selectedForDeletion;
        
        if (idsToRemove.length === 0) {
            toggleDeletionMode();
            return;
        }

        if (!confirm(`Tem certeza que deseja remover PERMANENTEMENTE ${idsToRemove.length} balconista(s)?`)) {
            return;
        }

        idsToRemove.forEach(id => {
            // 1. Remove da lista global de balconistas
            balconistas = balconistas.filter(p => p.id !== id);

            // 2. Remove da fila atual
            fila = fila.filter(p => p.id !== id);

            // 3. Limpa estatísticas (IMPORTANTE)
            delete tempoFila[id];
            delete tempoRelogio[id];
            delete atendimentos[id];
            delete tempoTotalEspera[id];
            delete horasUltimoAtendimento[id];
        });

        // 4. Finaliza a ação e salva
        toggleDeletionMode(); // Sai do modo de exclusão
        saveState();
        atualizarTela1(); 

    } else {
        // Ação: ATIVAR MODO DELEÇÃO (1º clique)
        toggleDeletionMode();
    }
};

function montarTela2() {
  const container = document.getElementById("balconistas-container");
  container.innerHTML = "";
  
  balconistas.forEach(b => {
    const naFila = fila.find(p => p.id === b.id);
    
    // NOVO: Encontra a posição real na fila (retorna -1 se não estiver na fila)
    const positionIndex = fila.findIndex(p => p.id === b.id);
    
    const bloco = document.createElement("div");
    bloco.classList.add("bloco-foto"); 
    
    // Verifica se o bloco está selecionado para deleção (se estiver no modo)
    if (isDeletionMode && selectedForDeletion.includes(b.id)) {
        bloco.classList.add('selected-for-deletion');
    }

    const img = document.createElement("img");
    
    // Se tem Base64, usa Data URI; senão, usa o caminho do arquivo
    if (b.base64) {
        img.src = `data:image/png;base64,${b.base64}`;
    } else {
        img.src = `assets/fotos/${b.id}-colorida.png`;
    }

    // LÓGICA DE VISUAL: Se NÃO está na fila E NÃO está no modo de exclusão, aplica o filtro P&B
    if (!naFila && !isDeletionMode) { 
      img.classList.add('balconista-off-queue'); 
    }
    
    const nomeDiv = document.createElement("div");
    let nomeTexto = b.nome;
    
    // ATUALIZAÇÃO: Exibe a ordem real da fila (só se não estiver no modo deleção)
    if (positionIndex >= 0 && !isDeletionMode) {
        const ordem = positionIndex + 1; // 0-based index -> 1-based order
        nomeTexto = `${ordem}º - ${b.nome}`;
    }
    
    nomeDiv.textContent = nomeTexto; 
    nomeDiv.classList.add('balconista-nome'); 
    
    // NOVO: LÓGICA DE CLIQUE CONTEXTUAL
    bloco.onclick = () => {
        if (isDeletionMode) {
            // MODO DELEÇÃO: Seleciona/desseleciona o bloco
            const index = selectedForDeletion.indexOf(b.id);
            if (index > -1) {
                selectedForDeletion.splice(index, 1); // Desseleciona
            } else {
                selectedForDeletion.push(b.id); // Seleciona
            }
            
            // ATUALIZAÇÃO VISUAL DO BOTÃO CENTRAL
            if (selectedForDeletion.length > 0) {
                btnToggleDeletion.classList.add('ready-to-confirm');
                btnToggleDeletion.textContent = `EXCLUIR (${selectedForDeletion.length})`;
            } else {
                btnToggleDeletion.classList.remove('ready-to-confirm');
                btnToggleDeletion.textContent = "EXCLUIR";
            }
            
            montarTela2(); // Re-renderiza para atualizar o visual
        } else {
            // MODO FILA: Alterna na fila
            if (naFila) {
                fila = fila.filter(p => p.id !== b.id);
            } else {
                fila.push(b);
            }
            montarTela2();
            saveState();
        }
    };

    bloco.appendChild(img);
    bloco.appendChild(nomeDiv);
    container.appendChild(bloco);
  });
}

// ===== Tabela & Cards (Mantidos) =====
function atualizarCardsFila() {
  const container = document.getElementById("cards-fila");
  if (!container) return;
  container.innerHTML = "";

  fila.slice(0, 3).forEach((b, i) => {
    // Verifica se o objeto e o ID são válidos antes de processar
    if (!b || !b.id) return; 

    const id = b.id;
    const pos = i + 1;

    const card = document.createElement("div");
    card.classList.add("card-fila");

    const img = document.createElement("img");
    img.classList.add("card-photo");
    
    // ATUALIZAÇÃO: Verifica se tem Base64
    if (b.base64) {
        img.src = `data:image/png;base64,${b.base64}`;
    } else {
        img.src = `assets/fotos/${id}-colorida.png`;
    }

    const title = document.createElement("div");
    title.classList.add("card-title");
    title.textContent = `${pos}º - ${b.nome}`;

    card.appendChild(img);
    card.appendChild(title);
    container.appendChild(card);
  });
}

function atualizarTabelaFila() {
  const tbody = document.querySelector("#tabela-fila tbody");
  tbody.innerHTML = "";
  fila.forEach((b, i) => {
    // Verifica se o objeto e o ID são válidos antes de processar
    if (!b || !b.id) return; 

    const id = b.id;
    const qtd = atendimentos[id] || 0;
    const total = tempoFila[id] || 0;
    const media = qtd > 0 ? Math.floor((tempoTotalEspera[id] || 0) / qtd) : 0;
    const hora = horasUltimoAtendimento[id] || "--:--";
    const relogio = i === 0 ? ` <small>(${formatarTempo(tempoRelogio[id] || 0)})</small>` : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}º</td>
      <td>${b.nome}${relogio}</td>
      <td>${qtd}</td>
      <td>${hora}</td>
      <td>${formatarTempo(media)}</td>
      <td>${formatarTempo(total)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function iniciarCronometro() {
  if (cronometroInterval) clearInterval(cronometroInterval);
  cronometroInterval = setInterval(() => {
    fila.forEach((b, i) => {
      // Verifica se 'b' é válido antes de processar o tempo
      if (!b || !b.id) return; 

      const id = b.id;
      tempoFila[id] = (tempoFila[id] || 0) + 1;
      if (i === 0) tempoRelogio[id] = (tempoRelogio[id] || 0) + 1;
    });
    atualizarTabelaFila();
    atualizarCardsFila();
    saveState(); // Salva o estado a cada segundo
  }, 1000);
}

function formatarTempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60; // reservado se quiser mostrar h:mm:ss
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}`; // h:mm
  return `${m}:${ss}`;            // m:ss
}

// Inicializa
atualizarTela1();