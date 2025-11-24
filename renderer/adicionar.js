// renderer/adicionar.js - Lógica para a nova janela de adição

// Auxiliar para limpar o ID
function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais (exceto espaço e hífen)
    .trim()
    .replace(/[-\s]+/g, '-'); // Substitui espaços e múltiplos hífens por um único hífen
}

let imageBase64 = null;

const form = document.getElementById('add-form');
const nomeInput = document.getElementById('nome');
const btnSelecionarImagem = document.getElementById('btn-selecionar-imagem');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const imagePreview = document.getElementById('image-preview');
const imageError = document.getElementById('image-error');
const statusMessage = document.getElementById('status-message');

// Atualiza o estado do botão SALVAR
function updateSaveButton() {
    const nomeValido = nomeInput.value.trim().length > 0;
    btnSalvar.disabled = !(nomeValido && imageBase64);
}

// Lógica de seleção de imagem via IPC
btnSelecionarImagem.onclick = async () => {
    imageError.textContent = '';
    statusMessage.textContent = 'Aguarde...';

    try {
        // Envia IPC para o Main Process abrir o diálogo de arquivo
        const base64 = await window.electronAPI.invoke('open-file-dialog');
        
        if (base64) {
            // Se uma imagem foi selecionada, exibe a prévia
            imageBase64 = base64;
            imagePreview.innerHTML = `<img src="data:image/png;base64,${base64}" alt="Preview">`;
            imageError.textContent = '';
            statusMessage.textContent = 'Imagem selecionada.';
        } else {
            statusMessage.textContent = 'Seleção cancelada.';
        }
    } catch (error) {
        console.error('Erro ao abrir diálogo de arquivo:', error);
        imageError.textContent = 'Erro ao carregar a imagem. Tente novamente.';
        statusMessage.textContent = '';
    }
    updateSaveButton();
};

// Lógica de envio do formulário
form.onsubmit = (e) => {
    e.preventDefault();

    if (!imageBase64) {
        imageError.textContent = 'Por favor, selecione uma imagem.';
        return;
    }
    
    const nome = nomeInput.value.trim();
    const id = slugify(nome);
    
    statusMessage.textContent = 'Salvando...';
    btnSalvar.disabled = true;

    // Envia IPC para o Main Process salvar o arquivo e notificar a janela principal
    window.electronAPI.send('add-new-balconista', {
        nome: nome,
        id: id,
        base64Image: imageBase64
    });
};

// Lógica de cancelamento/fechar janela
btnCancelar.onclick = () => {
    window.close(); // Fecha a janela atual
};

// Listener para erros de salvamento no Main Process
window.electronAPI.on('add-new-balconista-error', (error) => {
    statusMessage.textContent = `Erro: ${error.message}`;
    btnSalvar.disabled = false;
});


// Listener para entrada de texto (para atualizar o botão Salvar)
nomeInput.oninput = updateSaveButton;

// Inicializa o botão
updateSaveButton();