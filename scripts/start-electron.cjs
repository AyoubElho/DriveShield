const { spawn } = require('node:child_process');
const path = require('node:path');

// Some IDEs set this so Electron runs as plain Node.js. The desktop main
// process needs Electron's `app` and `ipcMain` APIs, so remove it explicitly.
const environment = { ...process.env };
delete environment.ELECTRON_RUN_AS_NODE;

const electron = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');
const child = spawn(electron, [...process.argv.slice(2), '.'], { cwd: path.join(__dirname, '..'), env: environment, stdio: 'inherit' });

child.on('error', error => {
  console.error(`Could not start Electron: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', code => { process.exitCode = code ?? 1; });
