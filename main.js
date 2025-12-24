const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Parser = require('rss-parser');

// Configuração para evitar bloqueios de sites
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  },
  timeout: 10000 
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
  // win.setMenuBarVisibility(false); // Tire o comentário para esconder o menu superior
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- API DE NOTÍCIAS (10 ITENS RECENTES) ---
ipcMain.handle('buscar-noticias', async () => {
  console.log("--- BUSCANDO NOTÍCIAS ---");
  
  try {
    const fontes = [
      'https://news.google.com/rss/search?q=saude+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419', // Google News
      'http://rss.uol.com.br/feed/vivabem.xml' // UOL VivaBem
    ];

    let todasNoticias = [];

    for (const url of fontes) {
      try {
        const feed = await parser.parseURL(url);
        
        if (feed && feed.items) {
            feed.items.forEach(item => {
                const dataNoticia = new Date(item.pubDate);
                const hoje = new Date();
                const diferencaDias = (hoje - dataNoticia) / (1000 * 3600 * 24);

                // Só aceita notícias com menos de 5 dias
                if (diferencaDias < 5) {
                    todasNoticias.push({
                        titulo: item.title.trim().toUpperCase(),
                        data: dataNoticia
                    });
                }
            });
        }
      } catch (erroSite) {
        console.log(`Erro ao ler site:`, erroSite.message);
      }
    }

    // Ordena da mais nova para a mais velha
    todasNoticias.sort((a, b) => b.data - a.data);

    // PEGA AS 10 PRIMEIRAS
    const manchetes = todasNoticias.slice(0, 10).map(n => n.titulo);

    if (manchetes.length === 0) {
      return "SEM NOTÍCIAS RECENTES NO MOMENTO";
    }

    // Limpa o nome do site no final
    const manchetesLimpas = manchetes.map(t => t.split(' - ')[0]);

    return manchetesLimpas.join(' — 🩺 — ');

  } catch (error) {
    console.error("Erro geral:", error);
    return "SISTEMA ONLINE - FARMÁCIA MAXI POPULAR"; 
  }
});