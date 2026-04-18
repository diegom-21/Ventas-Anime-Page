const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

// Mantener la base de datos en la misma carpeta original para no perder datos previos
const originalUserDataPath = path.join(app.getPath('appData'), 'proyect-store-anime');
app.setPath('userData', originalUserDataPath);

// Renombrar la app para que las alertas y la ventana muestren tu marca 
// en lugar del "name" genérico del package.json
app.setName('NSJ Store Dashboard');

let dataFilePath = '';

function createWindow() {
  // Use user data directory to store JSON to avoid permissions issues
  dataFilePath = path.join(app.getPath('userData'), 'VentasDB.json');
  console.log('Database path:', dataFilePath);

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // cleaner look like a real desktop app
    icon: path.join(__dirname, '../public/logo.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools by default in dev mode is optional, we will leave it out for cleaner look or only log errors
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // IPC Handlers para leer y escribir JSON
  ipcMain.handle('read-data', async () => {
    try {
      const data = await fs.readFile(dataFilePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Archivo no existe todavía, lo ignoramos y retornamos cadena vacía o array vacío
        return [];
      }
      console.error('Error al leer base de datos:', error);
      throw error;
    }
  });

  ipcMain.handle('write-data', async (event, data) => {
    try {
      if (!data) return { success: false };

      // Asegurar que la carpeta exista antes de intentar escribir
      await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

      await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Error al escribir la base de datos:', error);
      throw error;
    }
  });

  ipcMain.handle('export-data', async (event) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Exportar Base de Datos (JSON)',
        defaultPath: 'NSJ_Store_VentasDB.json',
        buttonLabel: 'Exportar',
        filters: [{ name: 'Archivos JSON', extensions: ['json'] }]
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      let dataToExport = '[]';
      try {
        dataToExport = await fs.readFile(dataFilePath, 'utf-8');
      } catch (err) {
        // En caso de que el archivo base no exista todavía, exportamos vacío
        if (err.code !== 'ENOENT') throw err;
      }

      await fs.writeFile(filePath, dataToExport, 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      console.error('Error al exportar los datos:', error);
      throw error;
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
