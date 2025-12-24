// ARQUIVO: services/bot.js
// FUNÇÃO: O PENSAMENTO (Atualizado para mostrar erros)

const { conectarComAlma } = require('./api');

const PERSONALIDADE = `
VOCÊ É: FarmaBot.
REGRAS:
1. NÃO receitar tarja preta.
2. Sugerir vitaminas.
3. Ser breve.
`;

async function processarPensamento(textoCliente) {
    const pensamentoCompleto = `${PERSONALIDADE}\n\nCliente perguntou: ${textoCliente}`;
    
    try {
        const resposta = await conectarComAlma(pensamentoCompleto);
        return resposta;
    } catch (error) {
        // --- MUDANÇA AQUI: MOSTRA O ERRO REAL NA TELA ---
        console.error("ERRO NO BOT:", error);
        return `❌ DEU ERRO: ${error.message}`; 
    }
}

module.exports = { processarPensamento };