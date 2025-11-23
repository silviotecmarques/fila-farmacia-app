// app.js — atualizado
const balconistas = [
  { nome: "Wendeel", id: "wendeel" },
  { nome: "Drª Josyanne", id: "dra-josyanne" },
  { nome: "Drª Leiliane", id: "dra-leiliane" },
  { nome: "Drª Renata", id: "dra-renata" },
  { nome: "Franciete", id: "franciete" },
  { nome: "Eriane", id: "eriane" },
  { nome: "Taynan", id: "taynan" },
  { nome: "Thais", id: "thais" }
];


let fila = [];
let tempoFila = {};
let tempoRelogio = {};
let atendimentos = {};
let horasUltimoAtendimento = {};
let tempoTotalEspera = {};
let historico = {};
let cronometroInterval = null;

// DOM
const nomeAtual = document.getElementById("nome-atual");
const fotoAtual = document.getElementById("foto-atual");
const btnAtendi = document.getElementById("btn-atendi");
const btnGestao = document.getElementById("btn-gestao");
const telaFila = document.getElementById("tela-fila");
const telaGestao = document.getElementById("tela-gestao");
const btnOk = document.getElementById("btn-ok");

// ===== TELA 1 =====
function atualizarTela1() {
  if (fila.length > 0) {
    const atual = fila[0];
    nomeAtual.textContent = atual.nome;
    setTimeout(() => {
      fotoAtual.src = `assets/fotos/${atual.id}-colorida.png?v=${Date.now()}`;
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
};

// ===== TELA 2 (Gestão) =====
btnGestao.onclick = () => {
  telaFila.style.display = "none";
  telaGestao.style.display = "block";
  montarTela2();
};

btnOk.onclick = () => {
  telaGestao.style.display = "none";
  telaFila.style.display = "block";
  atualizarTela1();
};

function montarTela2() {
  const container = document.getElementById("balconistas-container");
  container.innerHTML = "";
  balconistas.forEach(b => {
    const naFila = fila.find(p => p.id === b.id);
    const bloco = document.createElement("div");
    bloco.classList.add("bloco-foto");

    const img = document.createElement("img");
    img.src = `assets/fotos/${b.id}-${naFila ? "colorida" : "pb"}.png`;

    img.onclick = () => {
      if (naFila) {
        // remove e salva no histórico
        historico[b.id] = {
          tempoFila: tempoFila[b.id],
          tempoRelogio: tempoRelogio[b.id],
          atendimentos: atendimentos[b.id],
          tempoTotalEspera: tempoTotalEspera[b.id],
          horasUltimoAtendimento: horasUltimoAtendimento[b.id]
        };
        fila = fila.filter(p => p.id !== b.id);
        delete tempoFila[b.id];
        delete tempoRelogio[b.id];
        delete atendimentos[b.id];
        delete tempoTotalEspera[b.id];
        delete horasUltimoAtendimento[b.id];
      } else {
        // adiciona e restaura do histórico (se houver)
        fila.push(b);
        const d = historico[b.id] || {};
        tempoFila[b.id] = d.tempoFila || 0;
        tempoRelogio[b.id] = d.tempoRelogio || 0;
        atendimentos[b.id] = d.atendimentos || 0;
        tempoTotalEspera[b.id] = d.tempoTotalEspera || 0;
        horasUltimoAtendimento[b.id] = d.horasUltimoAtendimento || "--:--";
      }
      montarTela2();
    };

    bloco.appendChild(img);
    container.appendChild(bloco);
  });
}

// ===== Tabela & Cards =====
function atualizarTabelaFila() {
  const tbody = document.querySelector("#tabela-fila tbody");
  tbody.innerHTML = "";
  fila.forEach((b, i) => {
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

// Exibe somente os 3 primeiros
function atualizarCardsFila() {
  const container = document.getElementById("cards-fila");
  if (!container) return;
  container.innerHTML = "";

  fila.slice(0, 3).forEach((b, i) => {
    const id = b.id;
    const pos = i + 1;

    const card = document.createElement("div");
    card.classList.add("card-fila");

    const img = document.createElement("img");
    img.classList.add("card-photo");
    img.src = `assets/fotos/${id}-colorida.png`;

    const title = document.createElement("div");
    title.classList.add("card-title");
    title.textContent = `${pos}º - ${b.nome}`;

    card.appendChild(img);
    card.appendChild(title);
    container.appendChild(card);
  });
}

// ===== Cronômetro =====
function iniciarCronometro() {
  if (cronometroInterval) clearInterval(cronometroInterval);
  cronometroInterval = setInterval(() => {
    fila.forEach((b, i) => {
      const id = b.id;
      tempoFila[id] = (tempoFila[id] || 0) + 1;
      if (i === 0) tempoRelogio[id] = (tempoRelogio[id] || 0) + 1;
    });
    atualizarTabelaFila();
    atualizarCardsFila();
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

