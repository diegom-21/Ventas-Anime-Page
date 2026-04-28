import React, { useState } from 'react';
import { SalesProvider } from './context/SalesContext';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { SalesTable } from './components/sales/SalesTable';
import { SalesForm } from './components/sales/SalesForm';
import { ClientSummary } from './components/clients/ClientSummary';
import { Plus, Package, Sheet, FileUp } from 'lucide-react';

function Dashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  
  const [isClientSummaryOpen, setIsClientSummaryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleCreateSale = () => {
    setEditingSale(null);
    setIsFormOpen(true);
  };

  const handleClientClick = (clienteApodo) => {
    setSelectedClient(clienteApodo);
    setIsClientSummaryOpen(true);
  };

  const handleExport = async () => {
    if (window.electronAPI && window.electronAPI.exportData) {
      try {
        const result = await window.electronAPI.exportData();
        if (result && result.success) {
          alert('¡Tabla de Excel exportada con éxito!\nGuardada en: ' + result.filePath);
        } else if (result && result.error === 'BUSY') {
          alert('⚠️ PROTECCIÓN ACTIVA:\nEl archivo de Excel ya se encuentra abierto en tu computadora.\nPor favor cierra Excel antes de exportar una nueva copia encima.');
        }
      } catch (error) {
        console.error('Error exportando Excel', error);
        alert('Hubo un error al generar el archivo Excel.');
      }
    } else {
      alert('Esta función solo está disponible en la versión de escritorio (Electron).');
    }
  };

  const handleImportLegacy = async () => {
    if (window.electronAPI && window.electronAPI.importLegacyExcel) {
      try {
        const result = await window.electronAPI.importLegacyExcel();
        if (result && result.success) {
          alert(`¡Migración Exitosa!\nSe han importado ${result.count} ventas desde el Excel antiguo.\n\nLa aplicación se recargará para mostrar los datos nuevos.`);
          window.location.reload();
        }
      } catch (error) {
        console.error('Error importando Excel', error);
        alert('Hubo un error al leer el archivo Excel.');
      }
    } else {
      alert('Esta función solo está disponible en la versión de escritorio.');
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
        clienteApodo={selectedClient}
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
