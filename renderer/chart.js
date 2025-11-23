function gerarGraficos() {
  const nomes = fila.map(b => b.nome);
  const segundosTotais = fila.map(b => tempoFila[b.id] || 0);
  const minutosTotais = segundosTotais.map(seg => +(seg / 60).toFixed(1));
  const atendimentosEstimados = segundosTotais.map(seg => Math.floor(seg / 120));
  const participacoes = fila.reduce((acc, b) => {
    acc[b.nome] = (acc[b.nome] || 0) + 1;
    return acc;
  }, {});
  const nomesParticipacao = Object.keys(participacoes);
  const dadosParticipacao = Object.values(participacoes);

  // Gráfico 1 – Barras verticais: Tempo total na fila (em minutos)
  new Chart(document.getElementById("grafico-tempo-total"), {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [{
        label: "Tempo Total (min)",
        data: minutosTotais,
        backgroundColor: "#00CFFF",
        borderRadius: 5
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#fff" },
          grid: { color: "#003354" }
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "#003354" }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Gráfico 2 – Barras horizontais: Estimativa de atendimentos
  new Chart(document.getElementById("grafico-atendimentos"), {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [{
        label: "Atendimentos Estimados",
        data: atendimentosEstimados,
        backgroundColor: "#00CFFF",
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: "#fff" },
          grid: { color: "#003354" }
        },
        y: {
          ticks: { color: "#fff" },
          grid: { color: "#003354" }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Gráfico 3 – Pizza: Participação por balconista
  new Chart(document.getElementById("grafico-participacao"), {
    type: "pie",
    data: {
      labels: nomesParticipacao,
      datasets: [{
        label: "Participação",
        data: dadosParticipacao,
        backgroundColor: nomesParticipacao.map(() =>
          `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`
        )
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "#fff" }
        }
      }
    }
  });
}
