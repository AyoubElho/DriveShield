const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('driveShield', {
  chooseFolder: () => ipcRenderer.invoke('folder:choose'),
  scan: (target) => ipcRenderer.invoke('scan:run', target),
  removeFindings: (root, findings) => ipcRenderer.invoke('findings:remove', root, findings),
  saveReport: (report) => ipcRenderer.invoke('report:save', report)
});
