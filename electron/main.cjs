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
        // Ordenar de más antiguo a más reciente para el Excel, manejando fechas vacías
        dataToExport.sort((a, b) => {
          const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return dateA - dateB;
        });
      } catch (err) {
        // En caso de que el archivo base no exista todavía, exportamos vacío
        if (err.code !== 'ENOENT') throw err;
      }

      // 1. Mapear los datos para Excel para que se vean increíbles y entendibles
      const mappedData = dataToExport.map(sale => {
        const venta = Number(sale.valor_venta) || 0;
        const costo = Number(sale.valor_1) || 0;
        const pagado = Number(sale.pagado) || 0;
        
        // Cálculos estrictos matemáticos según solicitud
        const margenReal = venta - costo;
        const porPagarReal = venta - pagado;
        
        // Formatear la fecha a DD/MM/YYYY para que sea amigable en Excel
        let fechaAmigable = sale.fecha || '-';
        if (sale.fecha && sale.fecha.includes('-')) {
          const parts = sale.fecha.split('-');
          if (parts.length === 3) {
            fechaAmigable = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        return {
          'FECHA': fechaAmigable,
          'FIGURA': sale.figura ? sale.figura.toUpperCase() : '-',
          'CLIENTE': sale.cliente ? sale.cliente.toUpperCase() : '-',
          'VALOR 1': costo,
          'VENTA': venta,
          'MARGEN': margenReal,
          'PAGADO': pagado,
          'POR PAGAR': porPagarReal,
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

      // Añadir la información como Tabla Oficial de Excel
      worksheet.addTable({
        name: 'VentasOficial',
        ref: 'A1',
        headerRow: true,
        style: {
          theme: null, // Mantiene nuestro color azul de encabezado
          showRowStripes: false,
        },
        columns: [
          { name: 'FECHA', filterButton: true }, { name: 'FIGURA', filterButton: true }, { name: 'CLIENTE', filterButton: true },
          { name: 'VALOR 1', filterButton: true }, { name: 'VENTA', filterButton: true }, { name: 'MARGEN', filterButton: true },
          { name: 'PAGADO', filterButton: true }, { name: 'POR PAGAR', filterButton: true }, { name: 'ESTADO', filterButton: true },
          { name: 'COMENTARIO', filterButton: true }, { name: 'OBS', filterButton: true }, { name: 'LOTE', filterButton: true }
        ],
        rows: mappedData.map(sale => [
          sale['FECHA'], sale['FIGURA'], sale['CLIENTE'],
          sale['VALOR 1'], sale['VENTA'], sale['MARGEN'],
          sale['PAGADO'], sale['POR PAGAR'], sale['ESTADO'],
          sale['COMENTARIO'], sale['OBS'], sale['LOTE']
        ])
      });

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
          cell.font = { name: 'Aptos Narrow', size: 11, color: { argb: 'FF000000' }, bold: false };
          
          const colKey = worksheet.getColumn(colNumber).key;
          if (colKey === 'ESTADO') {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
          
          // Formato de número con decimales
          if (['VALOR 1', 'VENTA', 'MARGEN', 'PAGADO', 'POR PAGAR'].includes(colKey)) {
            cell.numFmt = '#,##0.00';
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

      // 1. Leer encabezados para saber exactamente en qué columna está cada dato
      const headerMap = {};
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        if (cell.value) {
          const colName = cell.value.toString().trim().toUpperCase();
          headerMap[colName] = colNumber;
        }
      });

      // Parseador robusto de fechas
      const parseDate = (val) => {
        if (!val) return '';
        if (val instanceof Date) {
          // Usar toISOString evita el desfase de 1 día que sufren los Dates locales en GMT-5
          return val.toISOString().split('T')[0];
        }
        if (typeof val === 'string') {
          const s = val.trim();
          const parts = s.split('/');
          if (parts.length === 3) {
            let [d, m, y] = parts;
            if (y.length === 2) y = '20' + y;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          return s;
        }
        return String(val);
      };

      // Asumimos fila 1 es encabezado, leemos desde la 2
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // saltar header

        // Extraer y limpiar datos dinámicamente
        const getValByName = (name, fallbackIdx) => {
          const colIdx = headerMap[name] || fallbackIdx;
          if (!colIdx) return '';
          let cell = row.getCell(colIdx);
          let v = cell.value;
          if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
          return v;
        };

        const fechaRaw = parseDate(getValByName('FECHA', 1));
        const figura = (getValByName('FIGURA', 2) || '').toString().trim().toUpperCase();
        const cliente = (getValByName('CLIENTE', 3) || '').toString().trim().toUpperCase();
        const valor_1 = Number(getValByName('VALOR 1', 4)) || 0;
        const valor_venta = Number(getValByName('VENTA', 5)) || 0;
        const pagado = Number(getValByName('PAGADO', 7)) || 0;
        const comentario = (getValByName('COMENTARIO', 10) || '').toString().trim();
        const obs = (getValByName('OBS', 11) || '').toString().trim();
        const lote = (getValByName('LOTE', 12) || '').toString().trim();

        // Si la fila está vacía, saltar
        if (!figura && !cliente) return;

        // Auto calcular
        const por_pagar = valor_venta - pagado;
        let estado = 'debe';
        if (por_pagar <= 0) estado = 'pagado';
        else if (pagado > 0) estado = 'parcial';

        newSales.push({
          id: crypto.randomUUID(),
          fecha: fechaRaw || '',
          figura,
          cliente,
          cliente_apodo: '', // En el legacy no lo usaban separado
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

  // Guardar recibo como imagen
  ipcMain.handle('save-receipt', async (event, dataUrl, defaultFilename) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Guardar Recibo',
        defaultPath: defaultFilename,
        buttonLabel: 'Guardar',
        filters: [{ name: 'Imágenes JPG', extensions: ['jpg', 'jpeg'] }]
      });

      if (canceled || !filePath) return { success: false, canceled: true };

      // Limpiar el prefijo data:image/jpeg;base64,
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(filePath, base64Data, 'base64');

      return { success: true, filePath };
    } catch (error) {
      console.error('Error al guardar el recibo:', error);
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
