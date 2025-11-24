const { contextBridge, ipcRenderer } = require('electron');

// Expor métodos seguros para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
    sendToMain: (channel, data) => {
        // Canais permitidos
        const validChannels = ['pillie-message', 'fila-update'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receiveFromMain: (channel, callback) => {
        const validChannels = ['pillie-reply', 'fila-update'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    }
});