'use strict';
const { app, BrowserWindow, ipcMain, clipboard, powerMonitor, dialog } = require('electron');
const path = require('node:path'); const crypto = require('node:crypto'); const fs = require('node:fs/promises'); const { Vault } = require('./vault'); const { parseCredentialCsv } = require('./csv');
let windowRef; let vault; let clipboardTimer;
app.setName('Krypt');
app.setAppUserModelId('com.krypt.vault');
const iconPath = app.isPackaged ? path.join(process.resourcesPath, 'app', 'build', 'icon.ico') : path.resolve(__dirname, '../../build/icon.ico');
// Keeps the transparent UI usable on Windows installations lacking a compatible GPU driver.
app.disableHardwareAcceleration();
function createWindow() {
  windowRef = new BrowserWindow({ width: 1240, height: 780, minWidth: 920, minHeight: 620, frame: false, transparent: true, backgroundColor: '#060607', titleBarStyle: 'hidden', icon: iconPath, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  windowRef.loadFile(path.join(__dirname, '../renderer/index.html'));
}
function lock() { vault.lock(); windowRef?.webContents.send('vault:locked'); }
function totp(secret) { const raw = secret.replace(/^otpauth:\/\/totp\/[^?]+\?secret=/i, '').split('&')[0].replace(/=+$/, '').toUpperCase(); const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const char of raw) { const i = alphabet.indexOf(char); if (i < 0) throw new Error('Secret TOTP invalide.'); bits += i.toString(2).padStart(5, '0'); } const bytes = Buffer.from((bits.match(/.{1,8}/g) || []).filter(x => x.length === 8).map(x => parseInt(x, 2))); const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000))); const hash = crypto.createHmac('sha1', bytes).update(counter).digest(); const offset = hash[19] & 15; return String(((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)).padStart(6, '0'); }
app.whenReady().then(() => { vault = new Vault(app.getPath('userData')); createWindow(); powerMonitor.on('lock-screen', lock); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); }); app.on('before-quit', () => vault?.lock());
ipcMain.handle('vault:status', () => vault.exists());
async function openVault(operation, password) {
  try {
    const entries = await operation(password);
    return { success: true, entries };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Impossible d’ouvrir le coffre local.' };
  }
}
ipcMain.handle('vault:create', (_, password) => openVault(vault.create.bind(vault), password));
ipcMain.handle('vault:unlock', (_, password) => openVault(vault.unlock.bind(vault), password));
ipcMain.handle('vault:save', async (_, entry) => vault.upsert(entry));
ipcMain.handle('vault:delete', async (_, id) => vault.remove(id));
ipcMain.handle('vault:lock', () => lock());
ipcMain.handle('vault:totp', (_, secret) => totp(secret));
ipcMain.handle('vault:password', (_, options) => { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' + (options?.symbols ? '!@#$%&*+-_' : ''); const length = Math.min(128, Math.max(8, Number(options?.length) || 20)); let result = ''; for (let i = 0; i < length; i++) result += chars[crypto.randomInt(chars.length)]; return result; });
ipcMain.handle('clipboard:copy', (_, text) => { clipboard.writeText(String(text)); clearTimeout(clipboardTimer); clipboardTimer = setTimeout(() => { if (clipboard.readText() === String(text)) clipboard.clear(); }, 15000); });
ipcMain.handle('window:control', (_, action) => { if (action === 'minimize') windowRef.minimize(); if (action === 'maximize') windowRef.isMaximized() ? windowRef.unmaximize() : windowRef.maximize(); if (action === 'close') windowRef.close(); });
ipcMain.handle('vault:export', async () => { const result = await dialog.showSaveDialog(windowRef, { defaultPath: 'vault.krypt', filters: [{ name: 'KRYPT vault', extensions: ['krypt'] }] }); if (!result.canceled) await vault.export(result.filePath); });
ipcMain.handle('vault:import-csv', async () => {
  try {
    vault.requireUnlocked();
    const selection = await dialog.showOpenDialog(windowRef, { title: 'Importer des identifiants CSV', properties: ['openFile'], filters: [{ name: 'Fichiers CSV', extensions: ['csv'] }] });
    if (selection.canceled || !selection.filePaths[0]) return { canceled: true };
    const filePath = selection.filePaths[0];
    const imported = await vault.importEntries(parseCredentialCsv(await fs.readFile(filePath, 'utf8')));
    if (!imported.count) return { success: false, error: 'Aucun identifiant exploitable dans ce fichier CSV.' };
    const removal = await dialog.showMessageBox(windowRef, { type: 'question', buttons: ['Conserver le CSV', 'Supprimer le CSV'], defaultId: 0, cancelId: 0, title: 'Importation terminée', message: `${imported.count} identifiant(s) chiffré(s) localement.`, detail: 'Le fichier CSV source reste en clair sur le disque. Voulez-vous le supprimer ?' });
    let deleted = false; let deletionWarning;
    if (removal.response === 1) { try { await fs.unlink(filePath); deleted = true; } catch { deletionWarning = 'Le CSV a été importé, mais sa suppression a échoué.'; } }
    return { success: true, count: imported.count, entries: imported.entries, deleted, deletionWarning };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Importation CSV impossible.' }; }
});
