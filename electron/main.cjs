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
      const mappedData = dataToExport.map(sale => {
        const venta = Number(sale.valor_venta) || 0;
        const costo = Number(sale.valor_1) || 0;
        return {
          'FECHA': sale.fecha || '-',
          'FIGURA': sale.figura ? sale.figura.toUpperCase() : '-',
          'CLIENTE': sale.cliente_apodo ? sale.cliente_apodo.toUpperCase() : '-',
          'VALOR 1': costo,
          'VENTA': venta,
          'MARGEN': venta - costo,
          'PAGADO': Number(sale.pagado) || 0,
          'POR PAGAR': Number(sale.por_pagar) || 0,
          'ESTADO': sale.estado ? sale.estado.toUpperCase() : '-',
          'COMENTARIO': sale.comentario ? sale.comentario.toUpperCase() : '',
          'OBS': sale.obs ? sale.obs.toUpperCase() : '',
          'LOTE': sale.lote ? sale.lote.toUpperCase() : ''
        };
      });

      // 2. Transformar a Hoja de Excel con ExcelJS para añadir estilos
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Ventas');

      // Definir columnas y sus anchos exactos
      worksheet.columns = [
        { header: 'FECHA', key: 'FECHA', width: 10.71 },
        { header: 'FIGURA', key: 'FIGURA', width: 42.14 },
        { header: 'CLIENTE', key: 'CLIENTE', width: 34.86 },
        { header: 'VALOR 1', key: 'VALOR 1', width: 10.61 },
        { header: 'VENTA', key: 'VENTA', width: 10.61 },
        { header: 'MARGEN', key: 'MARGEN', width: 10.61 },
        { header: 'PAGADO', key: 'PAGADO', width: 10.61 },
        { header: 'POR PAGAR', key: 'POR PAGAR', width: 15.43 },
        { header: 'ESTADO', key: 'ESTADO', width: 17.14 },
        { header: 'COMENTARIO', key: 'COMENTARIO', width: 26.00 },
        { header: 'OBS', key: 'OBS', width: 10.61 },
        { header: 'LOTE', key: 'LOTE', width: 15.0 }
      ];

      // Añadir la información
      worksheet.addRows(mappedData);

      // 3. Estilos: Color oficial de la tabla
      const headerRow = worksheet.getRow(1);
      headerRow.height = 15.0; // Alto de fila 15.0
      
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF002061' } // Color de fondo #002061 (ARGB)
        };
        cell.font = {
          name: 'Aptos Narrow',
          size: 11,
          color: { argb: 'FFFFFFFF' }, // Blanco
          bold: true
        };
        // Alineación encabezados
        const colKey = worksheet.getColumn(colNumber).key;
        if (colKey === 'ESTADO') {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      // Estilos para las filas de datos
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Saltar encabezado
        row.eachCell((cell, colNumber) => {
          cell.font = { color: { argb: 'FF000000' }, bold: false };
          const colKey = worksheet.getColumn(colNumber).key;
          if (colKey === 'ESTADO') {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
          if(colKey === 'VALOR 1' || colKey === 'VENTA' || colKey === 'MARGEN' || colKey === 'PAGADO' || colKey === 'POR PAGAR'){
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }
        });
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

  // Importar excel masivo
  ipcMain.handle('import-legacy-excel', async (event) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Seleccionar Archivo Excel Antiguo',
        buttonLabel: 'Importar',
        filters: [{ name: 'Archivos Excel', extensions: ['xlsx'] }],
        properties: ['openFile']
      });

      if (canceled || filePaths.length === 0) return { success: false, canceled: true };

      const filePath = filePaths[0];
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("El excel no tiene hojas");

      let currentData = [];
      try {
        const raw = await fs.readFile(dataFilePath, 'utf-8');
        currentData = JSON.parse(raw);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }

      const crypto = require('crypto');
      const newSales = [];

      // Asumimos fila 1 es encabezado, leemos desde la 2
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // saltar header
        
        const values = row.values;
        // Según análisis previo: 
        // 2:FECHA, 4:FIGURA, 5:CLIENTE, 6:VALOR 1, 7:VENTA, 8:MARGEN, 9:PAGADO, 10:POR PAGAR, 11:ESTADO, 12:COMENTARIO, 13:OBS, 14:LOTE
        
        // Extraer y limpiar datos usando getCell(i) real (1-indexed)
        const getVal = (colIdx) => {
          let cell = row.getCell(colIdx);
          let v = cell.value;
          if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
          if (v instanceof Date) return v.toISOString().split('T')[0];
          return v !== undefined && v !== null ? v : '';
        };

        const fechaRaw = getVal(1);
        const figura = getVal(3).toString().trim();
        const cliente_apodo = getVal(4).toString().trim();
        const valor_1 = Number(getVal(5)) || 0;
        const valor_venta = Number(getVal(6)) || 0;
        const pagado = Number(getVal(8)) || 0;
        const comentario = getVal(11).toString().trim();
        const obs = getVal(12).toString().trim();
        const lote = getVal(13).toString().trim();

        // Si la fila está vacía, saltar
        if (!figura && !cliente_apodo) return;

        // Auto calcular
        const por_pagar = valor_venta - pagado;
        let estado = 'debe';
        if (por_pagar <= 0) estado = 'pagado';
        else if (pagado > 0) estado = 'parcial';

        newSales.push({
          id: crypto.randomUUID(),
          fecha: fechaRaw || new Date().toISOString().split('T')[0],
          figura,
          cliente_apodo,
          cliente_real: '', // En el legacy no lo usaban separado
          valor_1,
          valor_venta,
          pagado,
          por_pagar,
          estado,
          comentario,
          obs,
          lote
        });
      });

      const finalData = [...currentData, ...newSales];
      
      // Guardar
      await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
      await fs.writeFile(dataFilePath, JSON.stringify(finalData, null, 2), 'utf-8');

      return { success: true, count: newSales.length };

    } catch (error) {
      console.error('Error al importar:', error);
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
