import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSales } from '../../context/SalesContext';
import { formatCurrency } from '../../utils/calculations';
import { Edit2, Trash2, Receipt as ReceiptIcon, Search, Filter } from 'lucide-react';
import { downloadReceiptAsImage } from '../../utils/receiptGenerator';
import { Receipt } from '../receipt/Receipt';
import { ConfirmModal } from '../ConfirmModal';

export const SalesTable = ({ onEditSale, onClientClick, onShowAlert }) => {
  const { sales, deleteSale } = useSales();
  const receiptRef = useRef(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const searchLower = searchTerm.toLowerCase();
      
      const fechaRaw = sale.fecha || '';
      let fechaAmigable = '';
      if (fechaRaw.includes('-')) {
        const parts = fechaRaw.split('-');
        if (parts.length === 3) {
          fechaAmigable = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      const matchesSearch = 
        (sale.cliente || '').toLowerCase().includes(searchLower) ||
        (sale.figura || '').toLowerCase().includes(searchLower) ||
        (sale.comentario || '').toLowerCase().includes(searchLower) ||
        (sale.obs || '').toLowerCase().includes(searchLower) ||
        (sale.lote || '').toLowerCase().includes(searchLower) ||
        fechaRaw.includes(searchLower) ||
        fechaAmigable.includes(searchLower);
      
      const matchesStatus = statusFilter === 'todos' || sale.estado === statusFilter;
      const matchesDate = !dateFilter || sale.fecha === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dateB - dateA;
    });
  }, [sales, searchTerm, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredSales.length / rowsPerPage);
  
  const currentSales = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredSales.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSales, currentPage]);

  const handleGenerateReceipt = async (sale) => {
    setSelectedSaleForReceipt(sale);
    // Esperamos a que el estado se actualice y el componente se monte
    setTimeout(async () => {
      try {
        if (receiptRef.current) {
          const result = await downloadReceiptAsImage(receiptRef.current, sale.cliente);
          if (onShowAlert && result) {
            if (result.success && result.filePath) {
              onShowAlert('success', '¡Recibo Generado!', `El recibo de compra para ${sale.cliente} ha sido descargado correctamente.\n\nRuta:\n${result.filePath}`);
            } else if (result.success) {
              // Fallback web
              onShowAlert('success', '¡Recibo Generado!', `El recibo de compra para ${sale.cliente} ha sido descargado correctamente.`);
            }
            // Si fue cancelado, no mostramos alerta
          }
        }
      } catch (err) {
        console.error('Error generating receipt:', err);
        if (onShowAlert) {
          onShowAlert('error', 'Error al Generar', 'Hubo un problema al crear la imagen del recibo. Inténtalo de nuevo.');
        }
      } finally {
        setSelectedSaleForReceipt(null);
      }
    }, 100);
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pagado': return 'badge-pagado';
      case 'parcial': return 'badge-parcial';
      case 'debe': return 'badge-debe';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="card flex flex-col h-full bg-white">
      {/* Filters Section */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, apodo o producto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex w-full md:w-auto gap-4 items-center">
          <div className="flex items-center gap-2 relative">
            <Filter size={18} className="absolute left-3 text-brand-500 z-10" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input py-2 pl-9 pr-8 w-48 border-slate-200 focus:border-brand-500 shadow-sm rounded-lg text-slate-700 font-medium cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-no-repeat bg-[position:right_8px_center]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="debe">Debe</option>
              <option value="parcial">Parcial</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input py-2 px-3 w-40 border-slate-200 focus:border-brand-500 shadow-sm rounded-lg text-slate-700 font-medium cursor-pointer"
            title="Filtrar por fecha exacta"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-brand-600 font-medium hover:underline">
              Limpiar Fecha
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Fecha</th>
              <th className="px-6 py-4 font-medium">Producto</th>
              <th className="px-6 py-4 font-medium">Cliente</th>
              <th className="px-6 py-4 font-medium">Valor 1</th>
              <th className="px-6 py-4 font-medium">Venta</th>
              <th className="px-6 py-4 font-medium">Margen</th>
              <th className="px-6 py-4 font-medium">Pagado</th>
              <th className="px-6 py-4 font-medium">Por Pagar</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium">Comentario</th>
              <th className="px-6 py-4 font-medium">OBS</th>
              <th className="px-6 py-4 font-medium">Lote</th>
              <th className="px-6 py-4 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentSales.length === 0 ? (
              <tr>
                <td colSpan="13" className="px-6 py-12 text-center text-slate-500">
                  No se encontraron ventas con los filtros actuales.
                </td>
              </tr>
            ) : (
              currentSales.map((sale) => (
                <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {sale.fecha && sale.fecha.includes('-') 
                      ? `${sale.fecha.split('-')[2]}/${sale.fecha.split('-')[1]}/${sale.fecha.split('-')[0]}`
                      : sale.fecha}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{sale.figura}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => onClientClick(sale.cliente)} className="font-semibold text-brand-600 hover:text-brand-800 hover:underline transition-colors uppercase cursor-pointer">
                      {sale.cliente}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(sale.valor_1)}</td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(sale.valor_venta)}</td>
                  <td className="px-6 py-4 font-medium text-blue-600">{formatCurrency(Number(sale.valor_venta) - Number(sale.valor_1))}</td>
                  <td className="px-6 py-4 text-emerald-600 font-medium">{formatCurrency(sale.pagado)}</td>
                  <td className="px-6 py-4 text-red-600 font-medium">{formatCurrency(sale.por_pagar)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusBadgeClass(sale.estado)} uppercase`}>
                      {sale.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[150px]" title={sale.comentario}>{sale.comentario || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[150px]" title={sale.obs}>{sale.obs || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-semibold">{sale.lote || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleGenerateReceipt(sale)} title="Generar Recibo" className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors">
                        <ReceiptIcon size={18} />
                      </button>
                      <button onClick={() => onEditSale(sale)} title="Editar Venta" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => setSaleToDelete(sale)} title="Eliminar Venta" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
        <div>
          Mostrando <span className="font-medium text-slate-700">{filteredSales.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> a <span className="font-medium text-slate-700">{Math.min(currentPage * rowsPerPage, filteredSales.length)}</span> de <span className="font-medium text-slate-700">{filteredSales.length}</span> registros
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-700 font-medium"
            >
              Anterior
            </button>
            
            <div className="flex items-center justify-center min-w-[100px] font-medium text-slate-700">
              Página {currentPage} de {totalPages}
            </div>
            
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-700 font-medium"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Hidden Receipt Renderer */}
      <Receipt ref={receiptRef} sale={selectedSaleForReceipt} />

      <ConfirmModal 
        isOpen={!!saleToDelete}
        onCancel={() => setSaleToDelete(null)}
        onConfirm={() => {
          deleteSale(saleToDelete.id);
          setSaleToDelete(null);
        }}
        title="Eliminar venta"
        message={`¿Estás seguro que deseas eliminar el producto ${saleToDelete?.figura} de ${saleToDelete?.cliente}?`}
      />
    </div>
  );
};
