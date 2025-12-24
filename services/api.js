// ARQUIVO: services/api.js
// VERSÃO: Gemini 2.0 Flash (A que você quer usar)

// --- COLE SUA CHAVE AQUI ---
const API_KEY = 'aqui'; 

async function conectarComAlma(promptCompleto) {
    // URL EXATA do Gemini 2.0 Flash
    const URL_FINAL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    const corpoRequisicao = {
        contents: [{
            parts: [{ text: promptCompleto }]
        }]
    };

    try {
        console.log("🔵 [API] Enviando para Gemini 2.0 Flash...");

        const response = await fetch(URL_FINAL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpoRequisicao)
        });

        const data = await response.json();

        // TRATAMENTO DE ERROS ESPECÍFICOS DO 2.0
        
        // Erro 429: O Gemini 2.0 tem limite baixo na conta grátis.
        // Se der isso, o bot vai avisar para esperar.
        if (response.status === 429) {
            console.warn("🟡 [API] Limite atingido (Erro 429).");
            throw new Error("Estou sobrecarregado (Muitas perguntas). Tente em 1 minuto.");
        }

        // Outros erros
        if (!response.ok) {
            console.error('🔴 [API] ERRO:', data);
            const msg = data.error?.message || "Erro desconhecido";
            throw new Error(`Google recusou: ${msg}`);
        }

        // Sucesso
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Resposta vazia do Google.");
        }

    } catch (error) {
        console.error("🔴 [API] FALHA:", error.message);
        throw error;
    }
}

module.exports = { conectarComAlma };