const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    buscarNoticias: () => ipcRenderer.invoke('buscar-noticias')
});