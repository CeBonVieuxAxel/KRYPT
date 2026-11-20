'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kryptInstaller', {
  selectDir: () => ipcRenderer.invoke('installer:select-dir'),
  startInstall: options => ipcRenderer.invoke('installer:start', options),
  launchApp: () => ipcRenderer.invoke('installer:launch'),
  minimize: () => ipcRenderer.send('installer:minimize'),
  close: () => ipcRenderer.send('installer:close'),
  onProgress: callback => ipcRenderer.on('installer:progress', (_, value) => callback(value))
});
