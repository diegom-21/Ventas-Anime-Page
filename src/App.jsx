import React, { useState } from 'react';
import { SalesProvider } from './context/SalesContext';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { SalesTable } from './components/sales/SalesTable';
import { SalesForm } from './components/sales/SalesForm';
import { ClientSummary } from './components/clients/ClientSummary';
import { Plus, Package } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar/Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Logo" className="h-10 object-contain rounded" onError={(e) => { e.target.style.display='none'; }} />
              <h1 className="text-xl font-bold text-slate-800 tracking-tight ml-2">NSJ Store Dashboard</h1>
            </div>
            
            <button 
              onClick={handleCreateSale}
              className="btn btn-primary gap-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nueva Venta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
