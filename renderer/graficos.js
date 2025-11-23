// ======== GRÁFICOS (Studio Ghibli Theme aware) ========
// Recria todos os gráficos sempre que chamado.
// Requer Chart.js carregado antes deste arquivo.

let chart1, chart2, chart3, chart4, chart5;

// Lê variáveis CSS do :root com fallback
function getRootColor(varName, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName);
    return (v && v.trim()) || fallback;
  } catch {
    return fallback;
  }
}

// Paleta baseada no tema (funciona com/sem ghibli-theme.css)
const THEME = {
  primary:   getRootColor('--gh-leaf',  '#00CFFF'), // verde folha (fallback: ciano)
  secondary: getRootColor('--gh-sky',   '#7eb6ff'), // azul céu
  accent:    getRootColor('--gh-sun',   '#ffd37a'), // dourado suave
  ink:       getRootColor('--gh-ink',   '#2a2a2a'), // cor do texto/linhas
  grid:      'rgba(43,43,43,.15)'                   // grade discreta
};

// Paleta pastel para gráficos de pizza/barras com muitos itens
function pastelPalette(n) {
  const base = [
    THEME.primary,
    THEME.secondary,
    THEME.accent,
    '#c9b09a', // argila
    '#b6c7a8', // chá verde
    '#d9e3ef', // nuvem
    '#f3d1dc', // rosa chá
    '#cfe8cf'  // folha clara
  ];
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

// Formatador simples PT-BR
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

// Utilitário seguro para destruir instâncias antigas
function destroyCharts() {
  [chart1, chart2, chart3, chart4, chart5].forEach(c => { try { c && c.destroy(); } catch {} });
  chart1 = chart2 = chart3 = chart4 = chart5 = undefined;
}

function iniciarGraficos() {
  // Chart.js disponível?
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js não encontrado. Verifique o script de carregamento.');
    return;
  }

  // Se não existir nenhum canvas, não faz nada
  const c1 = document.getElementById('grafico-tempo-total');
  const c2 = document.getElementById('grafico-atendimentos');
  const c3 = document.getElementById('grafico-tempo-medio');
  const c4 = document.getElementById('grafico-fila-tempo-real');
  const c5 = document.getElementById('grafico-evolucao-semanal');
  if (!c1 && !c2 && !c3 && !c4 && !c5) return;

  // Defaults globais (usam o tema)
  Chart.defaults.color = THEME.ink;
  Chart.defaults.borderColor = THEME.grid;
  Chart.defaults.font.family = `'M PLUS Rounded 1c', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;

  destroyCharts();

  // Dados vindos do app (globais)
  const nomes  = (typeof fila !== 'undefined' ? fila.map(b => b.nome) : []);
  const ids    = (typeof fila !== 'undefined' ? fila.map(b => b.id)   : []);
  const tempos = ids.map(id => (typeof tempoFila !== 'undefined' ? (tempoFila[id] || 0) : 0)); // em segundos
  const minutos = tempos.map(t => +(t / 60).toFixed(1));
  const atendimentosEstimados = tempos.map(t => Math.floor(t / 120)); // heurística simples: 2min por atendimento
  const filaAtual = ids.length;

  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false, // respeita altura do card (CSS)
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed;
            if (ctx.dataset.label?.toLowerCase().includes('participação')) {
              return `${ctx.label}: ${v}`;
            }
            return `${ctx.dataset.label}: ${nf1.format(v)} min`;
          }
        }
      }
    },
    scales: {
      y: { ticks: { color: THEME.ink }, grid: { color: THEME.grid }, beginAtZero: true },
      x: { ticks: { color: THEME.ink }, grid: { color: THEME.grid } }
    }
  };

  // 1) Tempo total por balconista (min) — Barras
  if (c1) {
    chart1 = new Chart(c1, {
      type: 'bar',
      data: {
        labels: nomes,
        datasets: [{
          label: 'Tempo Total (min)',
          data: minutos,
          backgroundColor: THEME.primary,
          borderRadius: 6
        }]
      },
      options: {
        ...commonOpts,
        plugins: { ...commonOpts.plugins, legend: { display: false } }
      }
    });
  }

  // 2) Participação (estimada) — Pizza
  if (c2) {
    const cores = pastelPalette(nomes.length);
    chart2 = new Chart(c2, {
      type: 'pie',
      data: {
        labels: nomes,
        datasets: [{
          label: 'Participação',
          data: atendimentosEstimados,
          backgroundColor: cores,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: THEME.ink } } }
      }
    });
  }

  // 3) Tempo médio por atendimento (min) — Barras
  if (c3) {
    const medias = minutos.map((t, i) => atendimentosEstimados[i] > 0 ? +(t / atendimentosEstimados[i]).toFixed(1) : 0);
    chart3 = new Chart(c3, {
      type: 'bar',
      data: {
        labels: nomes,
        datasets: [{
          label: 'Tempo Médio (min)',
          data: medias,
          backgroundColor: THEME.secondary,
          borderRadius: 6
        }]
      },
      options: {
        ...commonOpts,
        plugins: { ...commonOpts.plugins, legend: { display: false } }
      }
    });
  }

  // 4) Tamanho da fila (snapshot) — Linha
  if (c4) {
    const serie = nomes.map((_, i) => i < filaAtual ? (filaAtual - i) : 0);
    chart4 = new Chart(c4, {
      type: 'line',
      data: {
        labels: nomes,
        datasets: [{
          label: 'Fila Atual',
          data: serie,
          fill: false,
          borderWidth: 2,
          borderColor: THEME.primary,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        ...commonOpts,
        plugins: { ...commonOpts.plugins, legend: { labels: { color: THEME.ink } } },
        scales: {
          y: { ticks: { color: THEME.ink, precision: 0 }, grid: { color: THEME.grid }, beginAtZero: true },
          x: { ticks: { color: THEME.ink }, grid: { color: THEME.grid } }
        }
      }
    });
  }

  // 5) Evolução semanal (exemplo) — Linha
  if (c5) {
    // você pode trocar por dados reais do seu back/LS depois:
    const historicoSemanal = [2, 4, 6, 3, 5, 7, filaAtual];
    chart5 = new Chart(c5, {
      type: 'line',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Hoje'],
        datasets: [{
          label: 'Histórico da Fila',
          data: historicoSemanal,
          fill: false,
          borderWidth: 2,
          borderColor: THEME.accent,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        ...commonOpts,
        plugins: { ...commonOpts.plugins, legend: { labels: { color: THEME.ink } } }
      }
    });
  }
}
