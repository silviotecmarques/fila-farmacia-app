// ARQUIVO: renderer/chat.js
// FUNÇÃO: O CORPO VISUAL (Com Limitador de Velocidade)

// --- CONFIGURAÇÃO DO LIMITADOR ---
const TEMPO_ESPERA = 10; // Segundos que o usuário tem que esperar entre perguntas
// ---------------------------------

const elementos = {
    btnAbrir: document.getElementById('btn-chat-toggle'),
    janela: document.getElementById('chat-window'),
    btnFechar: document.getElementById('btn-close-chat'),
    input: document.getElementById('chat-input'),
    btnEnviar: document.getElementById('btn-send-chat'),
    areaMensagens: document.getElementById('chat-messages')
};

function alternarVisao() {
    if (!elementos.janela) return;
    const estaFechado = elementos.janela.style.display === 'none';
    elementos.janela.style.display = estaFechado ? 'flex' : 'none';
    
    if (estaFechado) {
        setTimeout(() => elementos.input.focus(), 100);
    }
}

function mostrarNaTela(texto, autor) {
    const balao = document.createElement('div');
    balao.classList.add('message', autor === 'eu' ? 'user-msg' : 'bot-msg');
    balao.innerHTML = texto.replace(/\n/g, '<br>');
    elementos.areaMensagens.appendChild(balao);
    elementos.areaMensagens.scrollTop = elementos.areaMensagens.scrollHeight;
}

// Função para ativar o bloqueio temporário
function ativarResfriamento() {
    let segundosRestantes = TEMPO_ESPERA;
    
    // Bloqueia tudo
    elementos.input.disabled = true;
    elementos.btnEnviar.disabled = true;
    elementos.input.placeholder = `Aguarde ${segundosRestantes}s para enviar outra...`;
    elementos.btnEnviar.style.backgroundColor = "#ccc"; // Deixa cinza

    const relogio = setInterval(() => {
        segundosRestantes--;
        
        if (segundosRestantes <= 0) {
            // ACABOU O TEMPO: Libera tudo
            clearInterval(relogio);
            elementos.input.disabled = false;
            elementos.btnEnviar.disabled = false;
            elementos.input.placeholder = "Digite sua dúvida...";
            elementos.btnEnviar.style.backgroundColor = ""; // Volta a cor normal
            elementos.input.focus();
        } else {
            // ATUALIZA A CONTAGEM
            elementos.input.placeholder = `Aguarde ${segundosRestantes}s para enviar outra...`;
        }
    }, 1000);
}

async function enviarDuvida() {
    // Se estiver bloqueado, não faz nada
    if (elementos.input.disabled) return;

    const texto = elementos.input.value.trim();
    if (!texto) return;

    mostrarNaTela(texto, 'eu');
    elementos.input.value = '';
    
    // Trava o input imediatamente enquanto pensa
    elementos.input.disabled = true;
    
    const pensando = document.createElement('div');
    pensando.classList.add('message', 'bot-msg');
    pensando.textContent = '...';
    elementos.areaMensagens.appendChild(pensando);
    elementos.areaMensagens.scrollTop = elementos.areaMensagens.scrollHeight;

    try {
        const resposta = await window.api.perguntarBot(texto);
        
        pensando.remove();
        mostrarNaTela(resposta, 'bot');
    } catch (erro) {
        pensando.textContent = "Erro de comunicação.";
    } finally {
        // AQUI ESTÁ O SEGREDO:
        // Em vez de liberar na hora, chama o resfriamento
        ativarResfriamento();
    }
}

// Eventos
if (elementos.btnAbrir) elementos.btnAbrir.onclick = alternarVisao;
if (elementos.btnFechar) elementos.btnFechar.onclick = alternarVisao;
if (elementos.btnEnviar) elementos.btnEnviar.onclick = enviarDuvida;

if (elementos.input) {
    elementos.input.onkeypress = (e) => {
        if (e.key === 'Enter') enviarDuvida();
    }
}