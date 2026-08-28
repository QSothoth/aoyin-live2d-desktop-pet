const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aoyinDesktop', {
  contextMenu: () => ipcRenderer.send('pet:context-menu'),
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  move: (position) => ipcRenderer.send('pet:move', position),
  onPlay: (handler) => ipcRenderer.on('pet:play', (_event, payload) => handler(payload)),
  onBubble: (handler) => ipcRenderer.on('pet:bubble', (_event, payload) => handler(payload)),
  onScale: (handler) => ipcRenderer.on('pet:scale', (_event, scale) => handler(scale)),
  onLock: (handler) => ipcRenderer.on('pet:lock', (_event, locked) => handler(locked))
});
