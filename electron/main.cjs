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
        title: 'Exportar Base de Datos (Excel)',
        defaultPath: 'NSJ_Store_Ventas.xlsx',
        buttonLabel: 'Exportar a Excel',
        filters: [{ name: 'Archivos Excel', extensions: ['xlsx'] }]
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      let dataToExport = [];
      try {
        const raw = await fs.readFile(dataFilePath, 'utf-8');
        dataToExport = JSON.parse(raw);
      } catch (err) {
        // En caso de que el archivo base no exista todavía, exportamos vacío
        if (err.code !== 'ENOENT') throw err;
      }

      // 1. Mapear los datos para Excel para que se vean increíbles y entendibles
      const mappedData = dataToExport.map(sale => ({
        'Fecha': sale.fecha || '-',
        'Figura': sale.figura || '-',
        'Cliente Real': sale.cliente_real ? sale.cliente_real.toUpperCase() : '-',
        'Cliente Apodo': sale.cliente_apodo ? sale.cliente_apodo.toUpperCase() : '-',
        'Valor Total': Number(sale.valor_venta) || 0,
        'Pagado / Abono': Number(sale.pagado) || 0,
        'Por Pagar': Number(sale.por_pagar) || 0,
        'Estado': sale.estado ? sale.estado.toUpperCase() : '-',
        'Comentario': sale.comentario || ''
      }));

      // 2. Transformar a Hoja de Excel con ExcelJS para añadir estilos
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ventas');

      // Definir columnas y sus anchos exactos
      worksheet.columns = [
        { header: 'Fecha', key: 'Fecha', width: 17 },
        { header: 'Figura', key: 'Figura', width: 42 },
        { header: 'Cliente Real', key: 'Cliente Real', width: 27 },
        { header: 'Cliente Apodo', key: 'Cliente Apodo', width: 22 },
        { header: 'Valor Total', key: 'Valor Total', width: 22 },
        { header: 'Pagado / Abono', key: 'Pagado / Abono', width: 17 },
        { header: 'Por Pagar', key: 'Por Pagar', width: 15 },
        { header: 'Estado', key: 'Estado', width: 22 },
        { header: 'Comentario', key: 'Comentario', width: 27 }
      ];

      // Añadir la información
      worksheet.addRows(mappedData);

      // 3. Estilos: Color oficial de la tabla
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF002061' } // Color de fondo #002061 (ARGB)
        };
        cell.font = {
          color: { argb: 'FFFFFFFF' }, // Blanco
          bold: true
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // 4. Escribir en disco
      await workbook.xlsx.writeFile(filePath);

      return { success: true, filePath };
    } catch (error) {
      if (error.code === 'EBUSY') {
        return { success: false, error: 'BUSY' };
      }
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
