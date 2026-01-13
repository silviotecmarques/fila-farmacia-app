// renderer/adicionar.js

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[-\s]+/g, '-');
}

let imageBase64 = null;

const form = document.getElementById('add-form');
const nomeInput = document.getElementById('nome');
const dataInput = document.getElementById('data-nascimento');
const btnSalvar = document.getElementById('btn-salvar');
const imagePreview = document.getElementById('image-preview');

// Força o formato DD/MM enquanto digita
dataInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    if (v.length > 2) {
        v = v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    e.target.value = v;
    validarForm();
});

function validarForm() {
    const nomeOk = nomeInput.value.trim().length > 2;
    const dataOk = dataInput.value.length === 5; // dd/mm tem 5 caracteres
    const fotoOk = imageBase64 !== null;
    btnSalvar.disabled = !(nomeOk && dataOk && fotoOk);
}

nomeInput.addEventListener('input', validarForm);

document.getElementById('btn-selecionar-imagem').onclick = async () => {
    const base64 = await window.electronAPI.invoke('open-file-dialog');
    if (base64) {
        imageBase64 = base64;
        imagePreview.innerHTML = `<img src="data:image/png;base64,${base64}">`;
        validarForm();
    }
};

form.onsubmit = (e) => {
    e.preventDefault();
    
    const dados = {
        nome: nomeInput.value.trim(),
        id: slugify(nomeInput.value),
        dataNascimento: dataInput.value, // Envia apenas "dd/mm"
        base64Image: imageBase64
    };

    window.electronAPI.send('add-new-balconista', dados);
};

document.getElementById('btn-cancelar').onclick = () => window.close();