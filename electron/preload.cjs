const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readData: () => ipcRenderer.invoke('read-data'),
  writeData: (data) => ipcRenderer.invoke('write-data', data),
  exportData: () => ipcRenderer.invoke('export-data'),
  importLegacyExcel: () => ipcRenderer.invoke('import-legacy-excel')
});
