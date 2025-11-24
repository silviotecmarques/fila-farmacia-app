const { app, BrowserWindow, session } = require('electron');
const path = require('path');

let win; // para single-instance/focus
const isProd = app.isPackaged;

function createWindow() {
  win = new BrowserWindow({
    show: false,               // só mostra quando estiver pronto
    resizable: false,          // sem redimensionar manual
    maximizable: true,         // pode maximizar
    minimizable: true,         // pode minimizar
    autoHideMenuBar: true,     // ALT mostra/oculta menu
    backgroundColor: '#f6f1e7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // segurança
      nodeIntegration: false,  // segurança
      devTools: !isProd        // DevTools só em dev
    }
  });

  // Carrega o app
  win.loadFile('index.html');

  // Maximize & mostrar quando estiver pronto (sem flicker)
  win.once('ready-to-show', () => {
    try { win.maximize(); } catch {}
    win.show();
  });

  // Anti-cópia / anti-vazamento (nível janela)
  // session: bloqueia downloads
  session.defaultSession?.on('will-download', (e) => e.preventDefault());

  // Bloqueia atalhos de cópia/salvar/imprimir e DevTools
  win.webContents.on('before-input-event', (event, input) => {
    const k = (input.key || '').toLowerCase();
    const combo = input.control || input.meta;
    if (combo && ['c','x','a','s','p'].includes(k)) event.preventDefault();      // Ctrl/⌘ + C/X/A/S/P
    if (k === 'f12' || (combo && input.shift && k === 'i')) event.preventDefault(); // F12 / Ctrl+Shift+I
  });

  // Bloqueia menu de contexto (clique direito)
  win.webContents.on('context-menu', (e) => e.preventDefault());

  // Impede navegar para fora do index.html
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });

  // Impede abrir novas janelas/abas
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Opcional: impedir screenshot/gravação de tela do conteúdo (Windows/macOS)
  // ATENÇÃO: isso pode atrapalhar suporte e demonstrações.
  // win.setContentProtection(true);

  win.on('closed', () => { win = null; });
}

/* Garante instância única */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});