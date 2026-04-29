import React, { useState } from 'react';
import { SalesProvider } from './context/SalesContext';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { SalesTable } from './components/sales/SalesTable';
import { SalesForm } from './components/sales/SalesForm';
import { ClientSummary } from './components/clients/ClientSummary';
import { Plus, Package, Sheet, FileUp, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const LoaderOverlay = ({ isOpen, text }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[250px] animate-in fade-in zoom-in-95 duration-200">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <p className="text-slate-700 font-medium text-center">{text}</p>
      </div>
    </div>
  );
};

const CustomAlert = ({ isOpen, type, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  const handleClose = () => {
    onClose();
    if (onConfirm) onConfirm();
  };

  const icons = {
    success: <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto"><CheckCircle2 size={32} /></div>,
    error: <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto"><XCircle size={32} /></div>,
    warning: <div className="w-14 h-14 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4 mx-auto"><AlertTriangle size={32} /></div>
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-200">
        {icons[type]}
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-8 whitespace-pre-line leading-relaxed break-all">{message}</p>
        <button 
          onClick={handleClose}
          className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all active:scale-95 ${
            type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 
            type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 
            'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
          }`}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

function Dashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  
  const [isClientSummaryOpen, setIsClientSummaryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  
  const [loader, setLoader] = useState({ isOpen: false, text: '' });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null });

  const showAlert = (type, title, message, onConfirm = null) => {
    setAlertConfig({ isOpen: true, type, title, message, onConfirm });
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleCreateSale = () => {
    setEditingSale(null);
    setIsFormOpen(true);
  };

  const handleClientClick = (cliente) => {
    setSelectedClient(cliente);
    setIsClientSummaryOpen(true);
  };

  const handleExport = async () => {
    if (window.electronAPI && window.electronAPI.exportData) {
      setLoader({ isOpen: true, text: 'Generando y empaquetando Excel...' });
      try {
        const result = await window.electronAPI.exportData();
        setLoader({ isOpen: false, text: '' });
        
        if (result && result.success) {
          showAlert('success', '¡Exportación Exitosa!', 'Tu base de datos ha sido guardada en formato de Tabla Oficial.\n\nRuta:\n' + result.filePath);
        } else if (result && result.error === 'BUSY') {
          showAlert('warning', 'Archivo Bloqueado', 'El archivo de Excel ya se encuentra abierto en tu computadora.\nPor favor cierra Excel e inténtalo nuevamente.');
        } else if (result && result.canceled) {
          // Cancelado por el usuario, no hacer nada
        }
      } catch (error) {
        setLoader({ isOpen: false, text: '' });
        console.error('Error exportando Excel', error);
        showAlert('error', 'Error de Exportación', 'Ocurrió un problema inesperado al generar el archivo Excel.');
      }
    } else {
      showAlert('warning', 'Función No Disponible', 'Esta característica solo está disponible ejecutando la versión de escritorio (Electron).');
    }
  };

  const handleImportLegacy = async () => {
    if (window.electronAPI && window.electronAPI.importLegacyExcel) {
      // Nota: El loader no bloqueará el dialog nativo porque se ejecuta en el proceso principal,
      // pero una vez seleccionado el archivo, el loader acompañará el procesamiento.
      setLoader({ isOpen: true, text: 'Leyendo y migrando base de datos antigua...' });
      try {
        const result = await window.electronAPI.importLegacyExcel();
        setLoader({ isOpen: false, text: '' });
        
        if (result && result.success) {
          showAlert(
            'success', 
            '¡Migración Exitosa!', 
            `El sistema ha extraído e importado ${result.count} ventas desde tu Excel antiguo.\n\nLa aplicación se recargará para mostrar los datos actualizados.`,
            () => window.location.reload()
          );
        } else if (result && result.canceled) {
          // Cancelado
        }
      } catch (error) {
        setLoader({ isOpen: false, text: '' });
        console.error('Error importando Excel', error);
        showAlert('error', 'Error de Importación', 'Hubo un problema al leer el archivo Excel. Verifica que tenga el formato correcto y no esté corrupto.');
      }
    } else {
      showAlert('warning', 'Función No Disponible', 'Esta característica solo está disponible ejecutando la versión de escritorio.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar/Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Logo" className="h-10 object-contain rounded" onError={(e) => { e.target.style.display='none'; }} />
              <h1 className="text-xl font-bold text-slate-800 tracking-tight ml-2">NSJ Store Dashboard</h1>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={handleImportLegacy}
                className="btn border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 shadow-sm gap-2"
                title="Migrar datos desde un archivo Excel antiguo"
              >
                <FileUp size={18} />
                <span className="hidden md:inline">Importar Excel Antiguo</span>
              </button>

              <button 
                onClick={handleExport}
                className="btn border border-slate-200 bg-white hover:bg-emerald-50 text-slate-700 shadow-sm gap-2"
                title="Exportar Base de Datos a Excel"
              >
                <Sheet size={18} className="text-emerald-600" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </button>
              
              <button 
                onClick={handleCreateSale}
                className="btn btn-primary gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nueva Venta</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader />
        
        <div className="flex-1" style={{ minHeight: '500px' }}>
          <SalesTable 
            onEditSale={handleEditSale} 
            onClientClick={handleClientClick}
            onShowAlert={showAlert}
          />
        </div>
      </main>

      {/* Modals */}
      <SalesForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        saleToEdit={editingSale} 
      />

      <ClientSummary
        isOpen={isClientSummaryOpen}
        onClose={() => setIsClientSummaryOpen(false)}
        clienteNombre={selectedClient}
        onShowAlert={showAlert}
      />

      {/* Global Alerts and Loaders */}
      <LoaderOverlay isOpen={loader.isOpen} text={loader.text} />
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function App() {
  return (
    <SalesProvider>
      <Dashboard />
    </SalesProvider>
  );
}

export default App;
