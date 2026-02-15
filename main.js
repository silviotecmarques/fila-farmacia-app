const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let splashWindow;

function createWindows() {
  // --- 1. CONFIGURAÇÃO DA SPLASH SCREEN ---
  splashWindow = new BrowserWindow({
    width: 450,
    height: 380,
    frame: false,       // Sem bordas
    transparent: true,  // Se não aparecer, mude para false para testar
    alwaysOnTop: true,
    center: true,
    show: false,        // Criamos escondido
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Caminho absoluto para evitar erros
  const splashPath = path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath);

  // Força a exibição assim que o HTML carregar
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
    console.log(">> Splash Screen exibida com sucesso!");
  });

  // Se houver erro ao carregar o arquivo splash.html
  splashWindow.webContents.on('did-fail-load', () => {
    console.log(">> ERRO: Não foi possível encontrar o arquivo splash.html na raiz!");
  });

  // --- 2. CONFIGURAÇÃO DA JANELA PRINCIPAL ---
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Começa invisível
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // --- 3. TROCA DAS JANELAS APÓS 4 SEGUNDOS ---
  setTimeout(() => {
    console.log(">> Trocando para a Janela Principal...");
    
    if (mainWindow) {
      mainWindow.show();
      mainWindow.maximize();
    }

    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  }, 4000); // 4 segundos para dar tempo da animação do splash
}

app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});