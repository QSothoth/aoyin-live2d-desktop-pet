const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aoyinDesktop', {
  contextMenu: () => ipcRenderer.send('pet:context-menu'),
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  move: (position) => ipcRenderer.send('pet:move', position),
  requestRoam: () => ipcRenderer.send('pet:request-roam'),
  getEnvironment: () => ipcRenderer.invoke('pet:get-environment'),
  onPlay: (handler) => ipcRenderer.on('pet:play', (_event, payload) => handler(payload)),
  onCustom: (handler) => ipcRenderer.on('pet:custom', (_event, payload) => handler(payload)),
  onBubble: (handler) => ipcRenderer.on('pet:bubble', (_event, payload) => handler(payload)),
  onScale: (handler) => ipcRenderer.on('pet:scale', (_event, scale) => handler(scale)),
  onLock: (handler) => ipcRenderer.on('pet:lock', (_event, locked) => handler(locked)),
  onAutonomy: (handler) => ipcRenderer.on('pet:autonomy', (_event, enabled) => handler(enabled)),
  onEnvironment: (handler) => ipcRenderer.on('pet:environment', (_event, payload) => handler(payload)),
  onRoamStart: (handler) => ipcRenderer.on('pet:roam-start', (_event, payload) => handler(payload)),
  onRoamEnd: (handler) => ipcRenderer.on('pet:roam-end', () => handler())
});
