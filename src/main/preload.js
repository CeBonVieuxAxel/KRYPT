'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('krypt', {
  status: () => ipcRenderer.invoke('vault:status'), create: p => ipcRenderer.invoke('vault:create', p), unlock: p => ipcRenderer.invoke('vault:unlock', p), save: e => ipcRenderer.invoke('vault:save', e), remove: id => ipcRenderer.invoke('vault:delete', id), lock: () => ipcRenderer.invoke('vault:lock'), totp: s => ipcRenderer.invoke('vault:totp', s), password: o => ipcRenderer.invoke('vault:password', o), copy: t => ipcRenderer.invoke('clipboard:copy', t), window: a => ipcRenderer.invoke('window:control', a), export: () => ipcRenderer.invoke('vault:export'), importCsv: () => ipcRenderer.invoke('vault:import-csv'), onLocked: cb => ipcRenderer.on('vault:locked', cb)
});
