'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');

let windowRef; let installedExecutable;
app.setAppUserModelId('com.krypt.installer');
const iconPath = app.isPackaged ? path.join(process.resourcesPath, 'app', 'build', 'icon.ico') : path.resolve(__dirname, '../build/icon.ico');

function send(channel, payload) { windowRef?.webContents.send(channel, payload); }
async function filesIn(directory, root = directory, results = []) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) await filesIn(full, root, results); else if (!item.name.endsWith('.asar')) results.push(path.relative(root, full));
  }
  return results;
}
function createShortcuts(target, desktopEnabled) {
  return new Promise(resolve => {
    const desktop = path.join(app.getPath('desktop'), 'Krypt.lnk');
    const startMenu = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Krypt.lnk');
    const quote = value => `'${value.replace(/'/g, "''")}'`;
    const command = `$w=New-Object -ComObject WScript.Shell;${desktopEnabled ? `$s=$w.CreateShortcut(${quote(desktop)});$s.TargetPath=${quote(target)};$s.WorkingDirectory=${quote(path.dirname(target))};$s.IconLocation=${quote(`${target},0`)};$s.Save();` : ''}$d=${quote(path.dirname(startMenu))};New-Item -ItemType Directory -Force -Path $d|Out-Null;$s=$w.CreateShortcut(${quote(startMenu)});$s.TargetPath=${quote(target)};$s.WorkingDirectory=${quote(path.dirname(target))};$s.IconLocation=${quote(`${target},0`)};$s.Save()`;
    execFile('powershell.exe', ['-NoProfile', '-Command', command], () => resolve());
  });
}
async function install({ installDir, desktopShortcut: wantsShortcut, autoStart }) {
  const packagedPayload = path.join(process.resourcesPath, 'app-payload');
  const developmentPayload = path.resolve(__dirname, '../release/Krypt-portable');
  const source = process.env.KRYPT_PAYLOAD_DIR || (fsSync.existsSync(packagedPayload) ? packagedPayload : developmentPayload);
  try { await fs.access(source); } catch { throw new Error('Archive d’application introuvable.'); }
  const files = await filesIn(source); await fs.mkdir(installDir, { recursive: true });
  for (let index = 0; index < files.length; index += 1) {
    const relative = files[index]; const target = path.join(installDir, relative);
    await fs.mkdir(path.dirname(target), { recursive: true }); await fs.copyFile(path.join(source, relative), target);
    send('installer:progress', { percent: Math.round(((index + 1) / files.length) * 100), label: 'Extraction…' });
  }
  installedExecutable = path.join(installDir, 'Krypt.exe');
  await createShortcuts(installedExecutable, wantsShortcut);
  app.setLoginItemSettings({ openAtLogin: Boolean(autoStart), path: installedExecutable });
  const uninstallPs = path.join(installDir, 'Uninstall-Krypt.ps1');
  const uninstallBat = path.join(installDir, 'Uninstall-Krypt.bat');
  await fs.writeFile(uninstallPs, `param([switch]$RemoveData)\n$dir=$PSScriptRoot\nif(!$RemoveData){$RemoveData=(Read-Host 'Supprimer aussi les données locales Krypt ? (o/N)') -match '^[oOyY]$'}\ntaskkill /F /IM Krypt.exe 2>$null\nRemove-Item \"$env:USERPROFILE\\Desktop\\Krypt.lnk\" -Force -ErrorAction SilentlyContinue\nRemove-Item \"$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Krypt.lnk\" -Force -ErrorAction SilentlyContinue\nRemove-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name Krypt -ErrorAction SilentlyContinue\nRemove-Item 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Krypt' -Recurse -Force -ErrorAction SilentlyContinue\nif($RemoveData){Remove-Item \"$env:APPDATA\\Krypt\" -Recurse -Force -ErrorAction SilentlyContinue}\nStart-Process cmd.exe -ArgumentList '/c','timeout /t 2 /nobreak >nul & rmdir /s /q \"'+$dir+'\"'\n`, 'utf8');
  await fs.writeFile(uninstallBat, '@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Uninstall-Krypt.ps1"\r\n', 'ascii');
  const quote = value => `'${value.replace(/'/g, "''")}'`;
  const registry = `$k='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Krypt';New-Item -Force $k|Out-Null;Set-ItemProperty $k DisplayName 'Krypt';Set-ItemProperty $k DisplayVersion '1.0.0';Set-ItemProperty $k Publisher 'Axel LEFEBVRE';Set-ItemProperty $k DisplayIcon ${quote(`${installedExecutable},0`)};Set-ItemProperty $k UninstallString ${quote(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${uninstallPs}"`)}`;
  await new Promise(resolve => execFile('powershell.exe', ['-NoProfile', '-Command', registry], () => resolve()));
  return { success: true };
}

app.whenReady().then(() => {
  windowRef = new BrowserWindow({ width: 500, height: 560, resizable: false, frame: false, backgroundColor: '#050506', icon: iconPath, webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  windowRef.loadFile(path.join(__dirname, fsSync.existsSync(path.join(__dirname, 'krypt-installer.html')) ? 'krypt-installer.html' : 'index.html'));
});
ipcMain.handle('installer:select-dir', async () => { const result = await dialog.showOpenDialog(windowRef, { properties: ['openDirectory', 'createDirectory'] }); return result.canceled ? null : result.filePaths[0]; });
ipcMain.handle('installer:start', (_, options) => install(options));
ipcMain.handle('installer:launch', () => installedExecutable && shell.openPath(installedExecutable));
ipcMain.on('installer:minimize', () => windowRef?.minimize());
ipcMain.on('installer:close', () => windowRef?.close());
