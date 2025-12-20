const { app, BrowserWindow, session, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); 
const log = require('electron-log'); 

let win; 
const isProd = app.isPackaged;

// Configuração para evitar logs no console em ambiente de produção
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

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

    // NOVO: Verifica atualização imediatamente na inicialização
    if (isProd) {
        log.info('Iniciando verificação de auto-atualização...');
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 500); 
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// Lógica de eventos do Auto Updater
autoUpdater.on('update-downloaded', (info) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Reiniciar', 'Mais tarde'],
    title: 'Atualização Disponível',
    message: process.platform === 'win32' ? info.releaseNotes : info.releaseName,
    detail: 'Uma nova versão foi baixada. Reinicie o aplicativo para aplicar a atualização.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (message) => {
  log.error('Houve um problema ao tentar atualizar o aplicativo.');
  log.error(message);
});