// SISTEMA ELYSE - VERSÃO 1.0.7 (PERSISTÊNCIA TOTAL + DATA DD/MES)

const VERSION_CONTROL = {
    version: "1.0.7",
    lastUpdate: "13/01/2026"
};

// Atualiza o indicador visual de versão no canto da tela
if (document.getElementById('versao-app')) {
    document.getElementById('versao-app').textContent = `v${VERSION_CONTROL.version}`;
}

const MESES_ABR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const DEFAULT_BALCONISTAS = []; 

const GALLERY_OPTIONS = [];
for (let i = 1; i <= 40; i++) {
    GALLERY_OPTIONS.push({
        name: `Avatar ${i}`,
        url: `assets/avatares/${i}.png`
    });
}

let balconistas = []; 
let fila = [];
let tempoFila = {}, tempoRelogio = {}, atendimentos = {}, horasUltimoAtendimento = {}, tempoTotalEspera = {};
let cronometroInterval = null;
let isDeletionMode = false; 
let selectedForDeletion = []; 

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
const btnSalvarModal = document.getElementById('btn-salvar-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const modalImagePreview = document.getElementById('modal-image-preview');
const modalForm = document.getElementById('modal-add-form');
const imageGallery = document.getElementById('image-gallery'); 
const btnRefreshAvatars = document.getElementById('btn-refresh-avatars');
const inputFileAvatar = document.getElementById('input-file-avatar'); 

let selectedAvatarUrl = null; // Armazenará o Base64 da imagem carregada

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

let estadoAtual = ''; 
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
        btnAtendi.disabled = true;
        btnPular.disabled = true;
    } else {
        setMascote('idle'); 
        btnAtendi.disabled = false;
        btnPular.disabled = false;
    }
    btnGestao.disabled = false;
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

// LÓGICA DE DATA DD/MES
modalNascInput.addEventListener('blur', function (e) {
    let value = e.target.value;
    if (value.length === 5 && value.includes('/')) {
        let partes = value.split('/');
        let dia = partes[0];
        let mesNum = parseInt(partes[1]);
        if (mesNum >= 1 && mesNum <= 12) {
            e.target.value = `${dia}/${MESES_ABR[mesNum - 1]}`;
        }
    }
});

modalNascInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^\d/a-z]/g, "");
    if (value.length === 2 && !value.includes('/')) value += "/";
    if (value.length > 6) value = value.slice(0, 6);
    e.target.value = value.toLowerCase();
});

function getAvatarUrlInicial(nome) {
    return `assets/avatares/1.png`;
}

// --- SALVAMENTO E CARREGAMENTO ---
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
        
        const storedFila = localStorage.getItem('fila');
        fila = storedFila ? JSON.parse(storedFila) : [];
        
        atendimentos = JSON.parse(localStorage.getItem('atendimentos')) || {};
        tempoFila = JSON.parse(localStorage.getItem('tempoFila')) || {};
        tempoTotalEspera = JSON.parse(localStorage.getItem('tempoTotalEspera')) || {};
    } catch(e) { balconistas = []; fila = []; }
}
loadState();

function gerarGaleriaLocal() {
    imageGallery.innerHTML = '';
    GALLERY_OPTIONS.forEach((opt) => {
        const div = document.createElement('div'); div.classList.add('gallery-option');
        const img = document.createElement('img'); img.src = opt.url; div.appendChild(img);
        
        div.onclick = () => {
            document.querySelectorAll('.gallery-option').forEach(el => el.classList.remove('selected')); 
            div.classList.add('selected');
            selectedAvatarUrl = opt.url; // Caminho local para avatares padrão
            modalImagePreview.innerHTML = `<img src="${selectedAvatarUrl}" alt="Preview">`;
        };
        imageGallery.appendChild(div);
    });
}

btnRefreshAvatars.onclick = () => {
    inputFileAvatar.click();
};

// --- CONVERSÃO DA FOTO PARA BASE64 (PERSISTÊNCIA DEFINITIVA) ---
inputFileAvatar.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            selectedAvatarUrl = event.target.result; // Imagem virou texto Base64
            modalImagePreview.innerHTML = `<img src="${selectedAvatarUrl}" alt="Foto Carregada" style="border-radius: 50%; object-fit: cover;">`;
            document.querySelectorAll('.gallery-option').forEach(el => el.classList.remove('selected'));
            falar("Essa foto ficou ótima! ✨");
        };
        reader.readAsDataURL(file);
    }
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

modalForm.onsubmit = (e) => {
    e.preventDefault(); const nome = modalNomeInput.value.trim(); if (nome.length === 0) return;
    const idUnico = Date.now().toString(); 
    const imagemFinal = selectedAvatarUrl ? selectedAvatarUrl : getAvatarUrlInicial(nome);

    const novoBalconista = {
        id: idUnico, 
        nome: nome, 
        nascimento: modalNascInput.value, 
        sexo: modalSexoInput.value, 
        avatarUrl: imagemFinal // Salva o Base64 ou URL local
    };
    btnSalvarModal.classList.add('loading');
    setTimeout(() => {
        balconistas.push(novoBalconista); saveState();
        btnSalvarModal.classList.remove('loading'); closeAddModal(); montarTela2(); falar("Cadastro salvo para sempre! 🎉");
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
            <img src="assets/icons/sem-atendimento.png" alt="Sem Cadastro" style="width:150px; border-radius: 20px;">
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
    
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}º</td><td>${b.nome}${relogio}</td><td>${qtd}</td><td>${b.nascimento || '-'}</td><td>${formatarTempo(media)}</td><td>${formatarTempo(tempoFila[b.id] || 0)}</td>`;
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

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); btnAtendi.click(); }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { btnPular.click(); }
});

// INICIALIZAÇÃO CORRETA
atualizarTela1();
verificarEstadoFila();