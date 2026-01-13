// SISTEMA ELYSE - VERSÃO FINAL (FIX: BALÕES + INICIO RÁPIDO)

const DEFAULT_BALCONISTAS = []; 

// 1. ALTERAÇÃO: CARREGANDO AVATARES DA PASTA LOCAL (REMOVIDO API EXTERNA)
const GALLERY_OPTIONS = [];
for (let i = 1; i <= 40; i++) {
    GALLERY_OPTIONS.push({
        name: `Avatar ${i}`,
        url: `assets/avatares/${i}.png`
    });
}

// VARIÁVEIS GLOBAIS
let balconistas = []; 
let fila = [];
let tempoFila = {}, tempoRelogio = {}, atendimentos = {}, horasUltimoAtendimento = {}, tempoTotalEspera = {};
let cronometroInterval = null;
let isDeletionMode = false; 
let selectedForDeletion = []; 

// ELEMENTOS DOM
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
const modalNascInput = document.getElementById('modal-nasc');
const modalSexoInput = document.getElementById('modal-sexo');
const modalCelInput = document.getElementById('modal-cel');
const btnSalvarModal = document.getElementById('btn-salvar-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const modalImagePreview = document.getElementById('modal-image-preview');
const modalForm = document.getElementById('modal-add-form');
const imageGallery = document.getElementById('image-gallery'); 
const btnRefreshAvatars = document.getElementById('btn-refresh-avatars');

let selectedAvatarUrl = null;

// --- CONFIGURAÇÃO DA MASCOTE (PASTA ASSETS/BOT) ---
const mascoteImg = document.getElementById('mascote-img');
const mascoteBalao = document.getElementById('mascote-balao');

const GIFS = {
    duvida:  'assets/bot/mascote-duvida.gif',
    idle:    'assets/bot/mascote-idle.gif',
    pc:      'assets/bot/mascote-pc.gif',
    sucesso: 'assets/bot/mascote-sucesso.gif'
};

function preloadImages() { for (const key in GIFS) { const img = new Image(); img.src = GIFS[key]; } }
preloadImages();

let estadoAtual = 'idle';
let timeoutSucesso = null;
let balaoTimeout = null;

function limparFala() {
    if (mascoteBalao) {
        mascoteBalao.classList.remove('visible');
        mascoteBalao.textContent = "";
    }
    if (balaoTimeout) {
        clearTimeout(balaoTimeout);
        balaoTimeout = null;
    }
}

function setMascote(estado) {
    if (estadoAtual === estado) return;
    limparFala();
    if (mascoteImg) { 
        mascoteImg.src = GIFS[estado]; 
        estadoAtual = estado; 
    }
}

function verificarEstadoFila() {
    if (timeoutSucesso) return;
    if (document.getElementById('modal-ajuda') && document.getElementById('modal-ajuda').style.display === 'flex') return;
    if (fila.length === 0) {
        setMascote('pc'); 
    } else {
        setMascote('idle'); 
    }
}

if (mascoteImg) {
    const container = document.getElementById('mascote-container');
    const savedPos = localStorage.getItem('mascotePosicao');
    if (savedPos && container) {
        const pos = JSON.parse(savedPos);
        container.style.left = pos.x + 'px'; container.style.top = pos.y + 'px'; container.style.bottom = 'auto';
    }
    let isDragging = false, startX, startY, initialLeft, initialTop, didMove = false;
    
    container.onmousedown = (e) => {
        isDragging = true; didMove = false; startX = e.clientX; startY = e.clientY;
        const rect = container.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
        container.style.cursor = 'grabbing';
    };
    window.onmousemove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            didMove = true; container.style.left = `${initialLeft + dx}px`; container.style.top = `${initialTop + dy}px`; container.style.bottom = 'auto';
        }
    };
    window.onmouseup = () => {
        if (!isDragging) return;
        isDragging = false; container.style.cursor = 'grab';
        if (didMove) localStorage.setItem('mascotePosicao', JSON.stringify({ x: container.getBoundingClientRect().left, y: container.getBoundingClientRect().top }));
        else { 
             const modalAjuda = document.getElementById('modal-ajuda');
             if(modalAjuda) { modalAjuda.style.display = 'flex'; falar("Aqui está o manual! 🤓"); }
        }
    };

    mascoteImg.onmouseenter = () => {
        if (!isDragging && !timeoutSucesso) {
            setMascote('duvida');
            falar("Precisa de alguma coisa?");
        }
    };

    mascoteImg.onmouseleave = () => {
        if (!isDragging) verificarEstadoFila();
    };
}

const btnFecharAjuda = document.getElementById('btn-fechar-ajuda');
if(btnFecharAjuda) {
    btnFecharAjuda.onclick = () => { document.getElementById('modal-ajuda').style.display = 'none'; verificarEstadoFila(); };
}

function falar(texto) {
    if (!mascoteBalao) return;
    limparFala();
    setTimeout(() => {
        mascoteBalao.textContent = texto; 
        mascoteBalao.classList.add('visible');
        balaoTimeout = setTimeout(() => { 
            limparFala();
        }, 4000);
    }, 50);
}

setInterval(() => {
    const bancoFalas = window.FALAS_ELYSE || { aleatorias: ["Olá!"] };
    if (Math.random() > 0.5) { 
        let frase = ""; const hora = new Date().getHours(); const chance = Math.random() > 0.8;
        if (fila.length === 0) frase = bancoFalas.filaVazia[Math.floor(Math.random() * bancoFalas.filaVazia.length)];
        else if (fila.length > 5) frase = bancoFalas.filaCheia[Math.floor(Math.random() * bancoFalas.filaCheia.length)];
        else if (hora < 12 && chance) frase = bancoFalas.bomDia[Math.floor(Math.random() * bancoFalas.bomDia.length)];
        else if (hora >= 18 && chance) frase = bancoFalas.boaNoite[Math.floor(Math.random() * bancoFalas.boaNoite.length)];
        else frase = bancoFalas.aleatorias[Math.floor(Math.random() * bancoFalas.aleatorias.length)];
        falar(frase);
    }
}, 20000);

modalCelInput.addEventListener('input', function (e) {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    e.target.value = value;
});

// 2. ALTERAÇÃO: USAR AVATAR LOCAL PADRÃO (REMOVIDO API)
function getAvatarUrlInicial(nome) {
    return `assets/avatares/1.png`;
}

function saveState() {
    localStorage.setItem('balconistas', JSON.stringify(balconistas));
    localStorage.setItem('fila', JSON.stringify(fila));
    localStorage.setItem('tempoFila', JSON.stringify(tempoFila));
    localStorage.setItem('atendimentos', JSON.stringify(atendimentos));
    localStorage.setItem('tempoTotalEspera', JSON.stringify(tempoTotalEspera));
}

function loadState() {
    try {
        const stored = localStorage.getItem('balconistas');
        balconistas = stored ? JSON.parse(stored) : DEFAULT_BALCONISTAS;
        fila = []; tempoFila = {}; tempoRelogio = {}; atendimentos = {}; tempoTotalEspera = {};
    } catch(e) { balconistas = []; }
}
loadState();

// 3. ALTERAÇÃO: GERAR GALERIA COM OS 40 AVATARES DA PASTA ASSETS
function gerarGaleriaLocal() {
    imageGallery.innerHTML = '';
    GALLERY_OPTIONS.forEach((opt) => {
        const div = document.createElement('div'); div.classList.add('gallery-option');
        const img = document.createElement('img'); img.src = opt.url; div.appendChild(img);
        
        div.onclick = () => {
            document.querySelectorAll('.gallery-option').forEach(el => el.classList.remove('selected')); 
            div.classList.add('selected');
            selectedAvatarUrl = opt.url;
            modalImagePreview.innerHTML = `<img src="${selectedAvatarUrl}" alt="Preview">`;
        };
        imageGallery.appendChild(div);
    });
}

btnRefreshAvatars.onclick = () => {
    gerarGaleriaLocal();
    selectedAvatarUrl = null; 
    atualizarPreviewAvatarAutomatico();
};

function openAddModal() {
    modalOverlay.style.display = 'flex'; modalForm.reset(); selectedAvatarUrl = null; 
    gerarGaleriaLocal();
    atualizarPreviewAvatarAutomatico(); modalNomeInput.focus();
}

function atualizarPreviewAvatarAutomatico() {
    const nome = modalNomeInput.value.trim();
    if (!selectedAvatarUrl) {
        modalImagePreview.innerHTML = `<img src="${getAvatarUrlInicial(nome)}" alt="Avatar">`;
    }
}
modalNomeInput.oninput = atualizarPreviewAvatarAutomatico;
function closeAddModal() { modalOverlay.style.display = 'none'; }

// SALVAR
modalForm.onsubmit = (e) => {
    e.preventDefault(); const nome = modalNomeInput.value.trim(); if (nome.length === 0) return;
    const idUnico = Date.now().toString(); 
    const imagemFinal = selectedAvatarUrl ? selectedAvatarUrl : getAvatarUrlInicial(nome);

    // 4. ALTERAÇÃO: DATA SOMENTE DD/MM PARA O CADASTRO
    const agora = new Date();
    const diaMes = String(agora.getDate()).padStart(2, '0') + '/' + String(agora.getMonth() + 1).padStart(2, '0');

    const novoBalconista = {
        id: idUnico, nome: nome, nascimento: modalNascInput.value, sexo: modalSexoInput.value, celular: modalCelInput.value, 
        avatarUrl: imagemFinal, dataCadastro: diaMes, base64: null 
    };
    btnSalvarModal.classList.add('loading');
    setTimeout(() => {
        balconistas.push(novoBalconista); saveState();
        btnSalvarModal.classList.remove('loading'); closeAddModal(); montarTela2(); falar("Cadastro realizado! 🎉");
    }, 1000);
};
btnAdicionarBalconista.onclick = openAddModal;
btnCancelarModal.onclick = closeAddModal;

function atualizarTela1() {
  if (fila.length > 0) {
    const atual = fila[0]; 
    nomeAtual.textContent = atual.nome;
    fotoAtual.src = atual.avatarUrl || getAvatarUrlInicial(atual.nome);
  } else {
    nomeAtual.textContent = "SEM ATENDIMENTOS"; 
    fotoAtual.src = "assets/icons/sem-atendimento.png"; 
  }
  atualizarTabelaFila(); atualizarCardsFila(); iniciarCronometro(); verificarEstadoFila();
}

function montarTela2() {
  const container = document.getElementById("balconistas-container"); container.innerHTML = "";
  if (balconistas.length === 0) { 
      container.innerHTML = `
        <div class="empty-state">
            <img src="assets/bot/mascote-idle.gif" alt="Elyse" style="width:150px;">
            <h2>NÃO HÁ NINGUÉM CADASTRADO</h2>
            <p>Clique no botão azul "ADICIONAR NOVO" para começar a equipe.</p>
        </div>
      `;
      btnToggleDeletion.disabled = true; btnToggleDeletion.style.opacity = "0.5"; return; 
  } else {
      btnToggleDeletion.disabled = false; btnToggleDeletion.style.opacity = "1";
  }
  balconistas.forEach(b => {
    const naFila = fila.find(p => p.id === b.id); const positionIndex = fila.findIndex(p => p.id === b.id);
    const bloco = document.createElement("div"); bloco.classList.add("bloco-foto"); 
    if (isDeletionMode && selectedForDeletion.includes(b.id)) bloco.classList.add('selected-for-deletion');
    
    const img = document.createElement("img");
    img.src = b.avatarUrl || getAvatarUrlInicial(b.nome);
    if (!naFila && !isDeletionMode) img.classList.add('balconista-off-queue'); 

    const nomeDiv = document.createElement("div");
    nomeDiv.textContent = (positionIndex >= 0 && !isDeletionMode) ? `${positionIndex + 1}º - ${b.nome}` : b.nome;
    nomeDiv.classList.add('balconista-nome'); 

    bloco.onclick = () => {
        if (isDeletionMode) {
            const idx = selectedForDeletion.indexOf(b.id);
            if (idx > -1) selectedForDeletion.splice(idx, 1); else selectedForDeletion.push(b.id);
            montarTela2();
        } else {
            if (naFila) fila = fila.filter(p => p.id !== b.id); else fila.push(b);
            montarTela2(); saveState();
        }
    };
    bloco.appendChild(img); bloco.appendChild(nomeDiv); container.appendChild(bloco);
  });
}

function atualizarCardsFila() {
  const container = document.getElementById("cards-fila"); if (!container) return; container.innerHTML = "";
  fila.slice(0, 3).forEach((b, i) => {
    const card = document.createElement("div"); card.classList.add("card-fila");
    const img = document.createElement("img"); img.classList.add("card-photo");
    img.src = b.avatarUrl || getAvatarUrlInicial(b.nome);
    const title = document.createElement("div"); title.classList.add("card-title"); title.textContent = `${i + 1}º - ${b.nome}`;
    card.appendChild(img); card.appendChild(title); container.appendChild(card);
  });
}

btnAtendi.onclick = () => {
  if (!fila.length) return;
  const atendido = fila.shift(); fila.push(atendido);
  atendimentos[atendido.id] = (atendimentos[atendido.id] || 0) + 1;
  horasUltimoAtendimento[atendido.id] = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  tempoTotalEspera[atendido.id] = (tempoTotalEspera[atendido.id] || 0) + (tempoRelogio[atendido.id] || 0);
  tempoRelogio[atendido.id] = 0;
  
  setMascote('sucesso'); 
  falar("Atendimento realizado! 👍");
  
  if (timeoutSucesso) clearTimeout(timeoutSucesso);
  timeoutSucesso = setTimeout(() => { timeoutSucesso = null; verificarEstadoFila(); }, 3000);
  atualizarTela1(); saveState();
};

btnPular.onclick = () => {
  if (!fila.length) return;
  const pulou = fila.shift(); fila.push(pulou); tempoRelogio[pulou.id] = 0;
  atualizarTela1(); saveState(); falar("Passando a vez... 🔄");
};
btnGestao.onclick = () => { telaFila.style.display = "none"; telaGestao.style.display = "block"; montarTela2(); };
btnOk.onclick = () => {
  if (isDeletionMode) toggleDeletionMode();
  else { telaGestao.style.display = "none"; telaFila.style.display = "block"; atualizarTela1(); saveState(); }
};

function toggleDeletionMode() {
    isDeletionMode = !isDeletionMode; selectedForDeletion = [];
    btnToggleDeletion.classList.toggle('active-mode', isDeletionMode);
    btnAdicionarBalconista.disabled = isDeletionMode;
    btnToggleDeletion.innerHTML = isDeletionMode ? '<img src="assets/icons/lixeira.png" class="icon-btn" /> CANCELAR EXCLUSÃO' : '<img src="assets/icons/lixeira.png" class="icon-btn" /> EXCLUIR';
    btnOk.innerHTML = isDeletionMode ? 'CANCELAR' : '<img src="assets/icons/voltar.png" class="icon-btn" /> VOLTAR';
    montarTela2();
}
btnToggleDeletion.onclick = () => {
    if (isDeletionMode && selectedForDeletion.length > 0) {
        if (!confirm(`Excluir ${selectedForDeletion.length} balconista(s)?`)) return;
        balconistas = balconistas.filter(p => !selectedForDeletion.includes(p.id));
        fila = fila.filter(p => !selectedForDeletion.includes(p.id));
        toggleDeletionMode(); saveState(); atualizarTela1();
    } else { toggleDeletionMode(); }
};

function atualizarTabelaFila() {
  const tbody = document.querySelector("#tabela-fila tbody"); tbody.innerHTML = "";
  fila.forEach((b, i) => {
    const qtd = atendimentos[b.id] || 0;
    const media = qtd > 0 ? Math.floor((tempoTotalEspera[b.id] || 0) / qtd) : 0;
    const relogio = i === 0 ? ` <small>(${formatarTempo(tempoRelogio[b.id] || 0)})</small>` : "";
    
    // 5. ALTERAÇÃO: DATA SOMENTE DIA/MÊS (EX: 16/12) PARA A TABELA
    const agora = new Date();
    const diaMes = String(agora.getDate()).padStart(2, '0') + '/' + String(agora.getMonth() + 1).padStart(2, '0');

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}º</td><td>${b.nome}${relogio}</td><td>${qtd}</td><td>${diaMes}</td><td>${formatarTempo(media)}</td><td>${formatarTempo(tempoFila[b.id] || 0)}</td>`;
    tbody.appendChild(tr);
  });
}
function iniciarCronometro() {
  if (cronometroInterval) clearInterval(cronometroInterval);
  cronometroInterval = setInterval(() => {
    fila.forEach((b, i) => { tempoFila[b.id] = (tempoFila[b.id] || 0) + 1; if (i === 0) tempoRelogio[b.id] = (tempoRelogio[b.id] || 0) + 1; });
    atualizarTabelaFila(); atualizarCardsFila(); saveState();
  }, 1000);
}
function formatarTempo(seg) {
  const h = Math.floor(seg / 3600); const m = Math.floor((seg % 3600) / 60); const s = seg % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

async function atualizarLetreiro() {
    try {
        const noticias = await window.api.buscarNoticias();
        const div = document.querySelector('.ticker-content');
        if(div) div.innerHTML = `🚀 <b>FARMÁCIA MAXI POPULAR</b> — ${noticias}`;
    } catch(e) {}
}
atualizarLetreiro(); setInterval(atualizarLetreiro, 600000);

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); btnAtendi.click(); }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { btnPular.click(); }
});

// --- INICIALIZAÇÃO IMEDIATA ---
atualizarTela1();