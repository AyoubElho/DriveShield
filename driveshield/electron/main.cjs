const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { scanDirectory } = require('./scanner.cjs');

const DEFAULT_WINDOW_BOUNDS = { width: 1120, height: 740 };
const MINIMUM_WINDOW_SIZE = { width: 860, height: 590 };

async function loadWindowBounds() {
  try {
    const saved = JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'window-state.json'), 'utf8'));
    if (Number.isFinite(saved.width) && Number.isFinite(saved.height) && saved.width >= MINIMUM_WINDOW_SIZE.width && saved.height >= MINIMUM_WINDOW_SIZE.height) return saved;
  } catch { /* First launch or invalid saved state: use the default. */ }
  return DEFAULT_WINDOW_BOUNDS;
}

function saveWindowBounds(window) {
  const bounds = window.getBounds();
  return fs.writeFile(path.join(app.getPath('userData'), 'window-state.json'), JSON.stringify(bounds), 'utf8').catch(() => {});
}

async function createWindow() {
  const savedBounds = await loadWindowBounds();
  const window = new BrowserWindow({
    ...savedBounds,
    minWidth: MINIMUM_WINDOW_SIZE.width,
    minHeight: MINIMUM_WINDOW_SIZE.height,
    backgroundColor: '#0b1220',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const devUrl = process.env.DRIVESHIELD_DEV_SERVER_URL;
  if (devUrl) window.loadURL(devUrl);
  else window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  window.on('close', () => { void saveWindowBounds(window); });
}

ipcMain.handle('folder:choose', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose a USB drive or folder to inspect',
    properties: ['openDirectory', 'dontAddToRecent']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('scan:run', async (_event, target) => {
  if (typeof target !== 'string' || !path.isAbsolute(target)) throw new Error('A valid local folder is required.');
  return scanDirectory(target);
});

function isChildOf(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

ipcMain.handle('findings:remove', async (_event, root, findings) => {
  if (typeof root !== 'string' || !path.isAbsolute(root) || !Array.isArray(findings)) throw new Error('Invalid removal request.');
  const absoluteRoot = path.resolve(root);
  const removed = [];
  const skipped = [];

  for (const finding of findings) {
    if (!finding || typeof finding.path !== 'string') { skipped.push({ path: '', reason: 'Invalid finding' }); continue; }
    const candidate = path.resolve(finding.path);
    if (!isChildOf(absoluteRoot, candidate)) { skipped.push({ path: finding.path, reason: 'Outside the scanned location' }); continue; }
    try {
      const stats = await fs.lstat(candidate);
      if (stats.isDirectory()) { skipped.push({ path: candidate, reason: 'Folders are not removed automatically' }); continue; }
      await fs.unlink(candidate);
      removed.push(candidate);
    } catch (error) {
      skipped.push({ path: candidate, reason: error.code === 'ENOENT' ? 'Already removed' : 'Could not remove' });
    }
  }
  return { removed, skipped };
});

ipcMain.handle('report:save', async (_event, report) => {
  const result = await dialog.showSaveDialog({ title: 'Export DriveShield report', defaultPath: 'driveshield-report.json', filters: [{ name: 'JSON report', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return false;
  await fs.writeFile(result.filePath, JSON.stringify(report, null, 2), 'utf8');
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
