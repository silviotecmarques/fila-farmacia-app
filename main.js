const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  },
  timeout: 10000 
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'assets/icon.ico'), // Certifique-se que o icone existe
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
  
  // --- REMOVE O MENU SUPERIOR DE VEZ ---
  win.setMenuBarVisibility(false); 
  win.removeMenu(); 
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

// API DE NOTÍCIAS
ipcMain.handle('buscar-noticias', async () => {
  try {
    const fontes = [
      'https://news.google.com/rss/search?q=saude+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
      'http://rss.uol.com.br/feed/vivabem.xml'
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

    todasNoticias.sort((a, b) => b.data - a.data);
    const manchetes = todasNoticias.slice(0, 10).map(n => n.titulo.split(' - ')[0]);

    if (manchetes.length === 0) return "SISTEMA ELYSE - ONLINE";
    return manchetes.join(' — 🩺 — ');

  } catch (error) {
    return "SISTEMA ELYSE - ONLINE"; 
  }
});