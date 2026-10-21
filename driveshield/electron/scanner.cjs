const fs = require('node:fs/promises');
const path = require('node:path');

const RISKY_EXTENSIONS = new Set(['.bat', '.cmd', '.com', '.exe', '.js', '.jse', '.lnk', '.ps1', '.scr', '.vbe', '.vbs']);
const MAX_FILES = 20_000;

async function scanDirectory(root) {
  let rootStats;
  try {
    rootStats = await fs.stat(root);
  } catch {
    throw new Error('That location cannot be read. Check that the USB drive is mounted and that you have permission to access it.');
  }
  if (!rootStats.isDirectory()) throw new Error('Choose a folder or the root folder of a mounted drive.');

  const findings = [];
  let scanned = 0;
  let stoppedEarly = false;

  async function visit(directory) {
    if (scanned >= MAX_FILES) { stoppedEarly = true; return; }
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch { return; }

    for (const entry of entries) {
      if (scanned >= MAX_FILES) { stoppedEarly = true; return; }
      const filePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        findings.push({ path: filePath, kind: 'Symbolic link', severity: 'medium', detail: 'Review links on removable media before opening them.' });
        continue;
      }
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.')) {
          findings.push({ path: filePath, kind: 'Hidden folder', severity: 'medium', detail: 'Dot-prefixed folders are hidden by default on Linux and macOS. Review their contents before removal.' });
        }
        await visit(filePath);
        continue;
      }
      if (!entry.isFile()) continue;
      scanned += 1;
      const extension = path.extname(entry.name).toLowerCase();
      if (entry.name.toLowerCase() === 'autorun.inf') {
        findings.push({ path: filePath, kind: 'Autorun configuration', severity: 'high', detail: 'Autorun files can direct Windows to launch a program when media is connected.' });
      } else if (RISKY_EXTENSIONS.has(extension)) {
        findings.push({ path: filePath, kind: `${extension.slice(1).toUpperCase()} executable or script`, severity: extension === '.lnk' ? 'medium' : 'high', detail: 'This file type can start code. Confirm its origin before opening it.' });
      }
    }
  }

  await visit(root);
  return { root, scanned, findings, stoppedEarly, scannedAt: new Date().toISOString() };
}

module.exports = { MAX_FILES, RISKY_EXTENSIONS, scanDirectory };
