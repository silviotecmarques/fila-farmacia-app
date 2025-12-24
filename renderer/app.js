// renderer/app.js - VERSÃO FINAL (Drag and Drop + Fila + News)

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
let cronometroInterval = null;

let isDeletionMode = false; 
let selectedForDeletion = []; 

// --- SISTEMA DE MASCOTE ELYSE ---
const mascoteImg = document.getElementById('mascote-img');
const mascoteBalao = document.getElementById('mascote-balao');

const GIFS = {
    idle: 'assets/mascote-idle.gif',
    sucesso: 'assets/mascote-sucesso.gif',
    pc: 'assets/mascote-pc.gif',
    duvida: 'assets/mascote-duvida.gif'
};

function preloadImages() {
    for (const key in GIFS) {
        const img = new Image();
        img.src = GIFS[key];
    }
}
preloadImages();

let estadoAtual = 'idle';
let timeoutSucesso = null;

function setMascote(estado) {
    if (estadoAtual === estado) return;
    if (mascoteImg) {
        mascoteImg.src = GIFS[estado];
        estadoAtual = estado;
    }
}

function verificarEstadoFila() {
    if (timeoutSucesso) return; 
    const modalAjuda = document.getElementById('modal-ajuda');
    if (modalAjuda && modalAjuda.style.display === 'flex') return;

    if (fila.length === 0) {
        setMascote('pc'); 
    } else {
        setMascote('idle'); 
    }
}

// --- ARRASTAR E SOLTAR (DRAG AND DROP) ---
// Carrega posição salva
const savedPos = localStorage.getItem('mascotePosicao');
if (savedPos) {
    const pos = JSON.parse(savedPos);
    const container = document.getElementById('mascote-container');
    if (container) {
        container.style.left = pos.x + 'px';
        container.style.top = pos.y + 'px';
        container.style.bottom = 'auto';
        container.style.right = 'auto';
    }
}

if (mascoteImg) {
    const container = document.getElementById('mascote-container');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let didMove = false;

    container.onmousedown = (e) => {
        isDragging = true;
        didMove = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = container.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        container.style.cursor = 'grabbing';
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            didMove = true;
            container.style.left = `${initialLeft + dx}px`;
            container.style.top = `${initialTop + dy}px`;
            container.style.bottom = 'auto';
        }
    };

    window.onmouseup = () => {
        if (!isDragging) return;
        isDragging = false;
        container.style.cursor = 'move';

        if (didMove) {
            // Se arrastou, salva posição
            const rect = container.getBoundingClientRect();
            localStorage.setItem('mascotePosicao', JSON.stringify({
                x: rect.left,
                y: rect.top
            }));
        } else {
            // Se foi clique, abre ajuda
            const modalAjuda = document.getElementById('modal-ajuda');
            if (modalAjuda) {
                modalAjuda.style.display = 'flex';
                falar("Aqui está o manual! 🤓");
            }
        }
    };

    // Hover (Interação visual)
    mascoteImg.onmouseenter = () => {
        if (!isDragging && !timeoutSucesso) {
            setMascote('duvida');
            falar("Precisa de ajuda? Clique ou me arraste! 🧐");
        }
    };
    mascoteImg.onmouseleave = () => {
        if (!isDragging) verificarEstadoFila();
    };
}

// Botão Fechar Ajuda
const btnFecharAjuda = document.getElementById('btn-fechar-ajuda');
const modalAjuda = document.getElementById('modal-ajuda');

if (btnFecharAjuda && modalAjuda) {
    btnFecharAjuda.onclick = () => {
        modalAjuda.style.display = 'none';
        verificarEstadoFila();
    };
    modalAjuda.onclick = (e) => {
        if (e.target === modalAjuda) {
            modalAjuda.style.display = 'none';
            verificarEstadoFila();
        }
    };
}

// --- FRASES E FALA ---
const FRASES_ALEATORIAS = [
    "Já bebeu água hoje? Hidratação é vida! 💧",
    "Sorriso no rosto, cliente satisfeito! 😄",
    "Organização facilita tudo, né? ✨",
    "Força na peruca! Estamos indo bem! 💪",
    "De olho na validade dos lotes! 👀",
    "Hoje o dia promete! 🚀",
    "Bora bater a meta de hoje? 🎯"
];
const FRASES_FILA_VAZIA = [
    "Fila zerada! Vou adiantar uns relatórios... 💻",
    "Tudo calmo... hora daquele cafezinho? ☕",
    "Aproveita para organizar o balcão! 📦",
    "Sem filas por enquanto. Paz total. 🍃"
];
const FRASES_FILA_CHEIA = [
    "Nossa, a loja encheu! Vamos lá! 😲",
    "Foco total, equipe! Tem gente esperando! ⚡",
    "Agilidade e simpatia, esse é o segredo! 🏃‍♀️",
    "Casa cheia! Respirem fundo e sorriam! 🧘‍♀️"
];

function falar(texto) {
    if (!mascoteBalao) return;
    mascoteBalao.textContent = texto;
    mascoteBalao.classList.add('visible');
    setTimeout(() => {
        mascoteBalao.classList.remove('visible');
    }, 5000);
}

setInterval(() => {
    if (Math.random() > 0.5) { 
        let fraseEscolhida = "";
        const hora = new Date().getHours();
        if (fila.length === 0) {
            fraseEscolhida = FRASES_FILA_VAZIA[Math.floor(Math.random() * FRASES_FILA_VAZIA.length)];
        } else if (fila.length > 5) {
            fraseEscolhida = FRASES_FILA_CHEIA[Math.floor(Math.random() * FRASES_FILA_CHEIA.length)];
        } else {
            if (hora < 12 && Math.random() > 0.7) {
                fraseEscolhida = "Bom dia, equipe! ☀️";
            } else if (hora >= 18 && Math.random() > 0.7) {
                fraseEscolhida = "Boa noite! Quase na hora de fechar? 🌙";
            } else {
                fraseEscolhida = FRASES_ALEATORIAS[Math.floor(Math.random() * FRASES_ALEATORIAS.length)];
            }
        }
        falar(fraseEscolhida);
    }
}, 20000);

// --- LÓGICA DA FILA ---
function todayKey() {
    return new Date().toDateString();
}

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
        
        console.log("Iniciando nova sessão. Resetando fila e tempos.");
        fila = [];
        tempoFila = {};
        tempoRelogio = {}; 
        atendimentos = {};
        tempoTotalEspera = {};
        horasUltimoAtendimento = {};

        localStorage.removeItem('fila');
        localStorage.removeItem('tempoFila');
        localStorage.removeItem('atendimentos');
        localStorage.removeItem('tempoTotalEspera');
        localStorage.removeItem('horasUltimoAtendimento');
        
    } catch(e) {
        console.error("Erro ao carregar estado:", e);
        balconistas = DEFAULT_BALCONISTAS;
    }
}

loadState();

const nomeAtual = document.getElementById("nome-atual");
const fotoAtual = document.getElementById("foto-atual");
const btnAtendi = document.getElementById("btn-atendi");
const btnPular = document.getElementById("btn-pular");
const btnGestao = document.getElementById("btn-gestao");
const telaFila = document.getElementById("tela-fila");
const telaGestao = document.getElementById("tela-gestao");
const btnOk = document.getElementById("btn-ok");
const btnAdicionarBalconista = document.getElementById("btn-adicionar-balconista"); 
const btnToggleDeletion = document.getElementById("btn-toggle-deletion"); 
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

function slugify(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^\w\s-]/g, '') 
    .trim()
    .replace(/[-\s]+/g, '-');
}

function getBase64FromPath(path, callback) {
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png'); 
        callback(dataUrl.split(',')[1]);
    };
    img.onerror = function() {
        console.error(`Erro ao carregar imagem de galeria: ${path}`);
        callback(null);
    };
    img.src = path;
}

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
                    modalStatus.textContent = 'Erro ao carregar a imagem da galeria.';
                    selectedImageBase64 = null;
                }
                updateModalSaveButton();
            });
        };
        imageGallery.appendChild(div);
    });
}

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

function closeAddModal() { modalOverlay.style.display = 'none'; }

function handleImageSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        modalStatus.textContent = 'Selecione um arquivo de imagem válido.';
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
    reader.readAsDataURL(file);
}

function saveNewBalconista(nome, id, base64Image) {
    btnSalvarModal.classList.add('loading');
    btnSalvarModal.disabled = true;
    setTimeout(() => {
        balconistas.push({ nome: nome, id: id, base64: base64Image });
        saveState(); 
        btnSalvarModal.classList.remove('loading');
        closeAddModal();
        montarTela2();
        atualizarTela1();
    }, 1500);
}

function updateModalSaveButton() {
    btnSalvarModal.disabled = !(modalNomeInput.value.trim().length > 0 && selectedImageBase64);
}

btnAdicionarBalconista.onclick = openAddModal; 
btnSelecionarImagemModal.onclick = () => { modalImageFileInput.click(); };
modalImagePreview.onclick = () => { modalImageFileInput.click(); };
modalImageFileInput.onchange = (e) => { if (e.target.files.length > 0) handleImageSelect(e.target.files[0]); };
modalNomeInput.oninput = updateModalSaveButton;
btnCancelarModal.onclick = closeAddModal;

modalForm.onsubmit = (e) => {
    e.preventDefault();
    if (btnSalvarModal.disabled) return;
    const nome = modalNomeInput.value.trim();
    const id = slugify(nome);
    if (balconistas.some(b => b.id === id)) {
        modalStatus.textContent = `Erro: O ID '${id}' já existe.`;
        return;
    }
    if (!selectedImageBase64) {
        modalStatus.textContent = 'Erro: Imagem não carregada.';
        return;
    }
    saveNewBalconista(nome, id, selectedImageBase64);
};

function atualizarTela1() {
  if (fila.length > 0) {
    const atual = fila[0];
    nomeAtual.textContent = atual.nome;
    setTimeout(() => {
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
  verificarEstadoFila();
}

btnAtendi.onclick = () => {
  if (!fila.length) return;
  const atendido = fila.shift();
  fila.push(atendido);
  atendimentos[atendido.id] = (atendimentos[atendido.id] || 0) + 1;
  const agora = new Date();
  horasUltimoAtendimento[atendido.id] = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const esperaAtual = tempoRelogio[atendido.id] || 0;
  tempoTotalEspera[atendido.id] = (tempoTotalEspera[atendido.id] || 0) + esperaAtual;
  tempoRelogio[atendido.id] = 0;
  
  setMascote('sucesso');
  falar("Atendimento realizado! 👍");
  
  if (timeoutSucesso) clearTimeout(timeoutSucesso);
  timeoutSucesso = setTimeout(() => {
      timeoutSucesso = null;
      verificarEstadoFila();
  }, 3000);

  atualizarTela1();
  saveState();
};

if (btnPular) {
    btnPular.onclick = () => {
      if (!fila.length) return;
      const pulou = fila.shift();
      fila.push(pulou);
      tempoRelogio[pulou.id] = 0;
      atualizarTela1();
      saveState();
      falar("Passando a vez... 🔄");
    };
}

btnGestao.onclick = () => {
  telaFila.style.display = "none";
  telaGestao.style.display = "block";
  montarTela2();
};

btnOk.onclick = () => {
  if (isDeletionMode) {
      toggleDeletionMode();
  } else {
      telaGestao.style.display = "none";
      telaFila.style.display = "block";
      atualizarTela1();
      saveState(); 
  }
};

function toggleDeletionMode() {
    isDeletionMode = !isDeletionMode;
    selectedForDeletion = [];
    if (isDeletionMode) {
        btnToggleDeletion.innerHTML = '<img src="assets/icons/lixeira.png" class="icon-btn" /> EXCLUIR'; 
        btnToggleDeletion.classList.add('active-mode'); 
        btnToggleDeletion.classList.remove('ready-to-confirm'); 
        btnAdicionarBalconista.disabled = true; 
        
        btnOk.innerHTML = '<img src="assets/icons/voltar.png" class="icon-btn" /> CANCELAR'; 
        btnOk.classList.add('cancel-yellow'); 
    } else {
        btnToggleDeletion.innerHTML = '<img src="assets/icons/lixeira.png" class="icon-btn" /> EXCLUIR'; 
        btnToggleDeletion.classList.remove('active-mode');
        btnToggleDeletion.classList.remove('ready-to-confirm');
        btnAdicionarBalconista.disabled = false;
        
        btnOk.innerHTML = '<img src="assets/icons/voltar.png" class="icon-btn" /> VOLTAR';
        btnOk.classList.remove('cancel-yellow'); 
    }
    montarTela2();
}

btnToggleDeletion.onclick = () => {
    if (isDeletionMode) {
        const idsToRemove = selectedForDeletion;
        if (idsToRemove.length === 0) {
            toggleDeletionMode();
            return;
        }
        if (!confirm(`Tem certeza que deseja remover PERMANENTEMENTE ${idsToRemove.length} balconista(s)?`)) {
            return;
        }
        idsToRemove.forEach(id => {
            balconistas = balconistas.filter(p => p.id !== id);
            fila = fila.filter(p => p.id !== id);
            delete tempoFila[id];
            delete tempoRelogio[id];
            delete atendimentos[id];
            delete tempoTotalEspera[id];
            delete horasUltimoAtendimento[id];
        });
        toggleDeletionMode(); 
        saveState();
        atualizarTela1(); 
    } else {
        toggleDeletionMode();
    }
};

function montarTela2() {
  const container = document.getElementById("balconistas-container");
  container.innerHTML = "";
  balconistas.forEach(b => {
    const naFila = fila.find(p => p.id === b.id);
    const positionIndex = fila.findIndex(p => p.id === b.id);
    const bloco = document.createElement("div");
    bloco.classList.add("bloco-foto"); 
    if (isDeletionMode && selectedForDeletion.includes(b.id)) {
        bloco.classList.add('selected-for-deletion');
    }
    const img = document.createElement("img");
    if (b.base64) {
        img.src = `data:image/png;base64,${b.base64}`;
    } else {
        img.src = `assets/fotos/${b.id}-colorida.png`;
    }
    if (!naFila && !isDeletionMode) { 
      img.classList.add('balconista-off-queue'); 
    }
    const nomeDiv = document.createElement("div");
    let nomeTexto = b.nome;
    if (positionIndex >= 0 && !isDeletionMode) { 
        const ordem = positionIndex + 1; 
        nomeTexto = `${ordem}º - ${b.nome}`;
    }
    nomeDiv.textContent = nomeTexto; 
    nomeDiv.classList.add('balconista-nome'); 
    
    bloco.onclick = () => {
        if (isDeletionMode) {
            const index = selectedForDeletion.indexOf(b.id);
            if (index > -1) {
                selectedForDeletion.splice(index, 1); 
            } else {
                selectedForDeletion.push(b.id); 
            }
            if (selectedForDeletion.length > 0) {
                btnToggleDeletion.classList.add('ready-to-confirm');
                btnToggleDeletion.innerHTML = `<img src="assets/icons/lixeira.png" class="icon-btn" /> EXCLUIR (${selectedForDeletion.length})`;
            } else {
                btnToggleDeletion.classList.remove('ready-to-confirm');
                btnToggleDeletion.innerHTML = '<img src="assets/icons/lixeira.png" class="icon-btn" /> EXCLUIR';
            }
            montarTela2(); 
        } else {
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

function atualizarCardsFila() {
  const container = document.getElementById("cards-fila");
  if (!container) return;
  container.innerHTML = "";
  fila.slice(0, 3).forEach((b, i) => {
    if (!b || !b.id) return; 
    const id = b.id;
    const pos = i + 1;
    const card = document.createElement("div");
    card.classList.add("card-fila");
    const img = document.createElement("img");
    img.classList.add("card-photo");
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
      if (!b || !b.id) return; 
      const id = b.id;
      tempoFila[id] = (tempoFila[id] || 0) + 1;
      if (i === 0) tempoRelogio[id] = (tempoRelogio[id] || 0) + 1;
    });
    atualizarTabelaFila();
    atualizarCardsFila();
    saveState();
  }, 1000);
}

function formatarTempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${mm}`; 
  return `${m}:${ss}`;            
}

atualizarTela1();

// --- ATUALIZADOR DE NOTÍCIAS (LETREIRO) ---
async function atualizarLetreiro() {
    const letreiro = document.querySelector('.ticker-content');
    if (!letreiro) return;
    try {
        const avisosFixos = "🚀 <b>BOM TRABALHO EQUIPE!</b> — 💊 CONFIRA A VALIDADE DOS LOTES";
        const textoNoticias = await window.api.buscarNoticias();
        letreiro.innerHTML = `${avisosFixos} — 🌍 <b>NOTÍCIAS AGORA:</b> ${textoNoticias}`;
    } catch (error) {
        console.error("Erro no letreiro:", error);
    }
}

atualizarLetreiro();
setInterval(atualizarLetreiro, 600000); // 10 minutos

// --- ATALHOS DE TECLADO (NOVO) ---
document.addEventListener('keydown', (e) => {
    // 1. Se estiver digitando num input (ex: nome do balconista), ignora os atalhos
    if (e.target.tagName === 'INPUT') return;

    // 2. Se algum modal estiver aberto (Ajuda ou Adicionar), ignora
    const modalAdd = document.getElementById('modal-overlay');
    const modalHelp = document.getElementById('modal-ajuda');
    if ((modalAdd && modalAdd.style.display === 'flex') || 
        (modalHelp && modalHelp.style.display === 'flex')) {
        
        // Se apertar ESC com modal aberto, fecha o modal
        if (e.key === 'Escape') {
            if (modalAdd.style.display === 'flex') closeAddModal();
            if (modalHelp.style.display === 'flex') {
                modalHelp.style.display = 'none';
                verificarEstadoFila();
            }
        }
        return;
    }

    // 3. Atalhos Principais
    switch(e.key) {
        case ' ':       // Barra de Espaço
        case 'Enter':   // Enter
            e.preventDefault(); // Impede a tela de descer
            if (btnAtendi) {
                btnAtendi.click(); // Simula o clique
                btnAtendi.classList.add('active'); // Efeito visual rápido
                setTimeout(() => btnAtendi.classList.remove('active'), 100);
            }
            break;

        case 'p':
        case 'P':
        case 'Escape':  // ESC
            if (btnPular) {
                btnPular.click();
                btnPular.classList.add('active');
                setTimeout(() => btnPular.classList.remove('active'), 100);
            }
            break;
            
        case 'F1':      // F1 (Ajuda)
            e.preventDefault();
            if (mascoteImg) mascoteImg.click(); // Abre a ajuda da Elyse
            break;
    }
});