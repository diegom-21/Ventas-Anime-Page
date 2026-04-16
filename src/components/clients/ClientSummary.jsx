import React, { useMemo, useRef, useState } from 'react';
import { calculateClientSummary, formatCurrency } from '../../utils/calculations';
import { useSales } from '../../context/SalesContext';
import { X, UserRound, Download } from 'lucide-react';
import { downloadReceiptTotalAsImage } from '../../utils/receiptGenerator';
import { ReceiptTotal } from '../receipt/ReceiptTotal';

export const ClientSummary = ({ isOpen, onClose, clienteApodo }) => {
  const { sales } = useSales();
  const receiptRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const summary = useMemo(() => {
    if (!clienteApodo) return null;
    return calculateClientSummary(sales, clienteApodo);
  }, [sales, clienteApodo]);

  if (!isOpen || !summary) return null;

  const { clientSales, totals } = summary;

  // Calculo robusto del total por pagar como solicitó el usuario, 
  // aunque totals.totalPorPagar ya lo tiene, reforzamos la lógica pedida:
  const totalPorPagar = clientSales.reduce(
    (acc, v) => acc + (Number(v.por_pagar) || 0),
    0
  );

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pagado': return 'badge-pagado';
      case 'parcial': return 'badge-parcial';
      case 'debe': return 'badge-debe';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleDownloadReceipt = async () => {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        if (receiptRef.current) {
          await downloadReceiptTotalAsImage(receiptRef.current, clienteApodo);
        }
      } catch (err) {
        console.error('Error in receipt generation:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header con botón de descarga */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-brand-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 text-brand-600 rounded-full">
              <UserRound size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase">{clienteApodo}</h2>
              <p className="text-sm text-slate-500">Resumen de cuenta del cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDownloadReceipt}
              disabled={isGenerating}
              className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white gap-2 border-none ring-emerald-500"
            >
              <Download size={18} />
              {isGenerating ? 'Generando...' : 'Descargar Recibo Total'}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuentas Totales */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white shadow-sm z-10">
          <div className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Comprado</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totals.totalCompras)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Pagado</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totals.totalPagado)}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deuda Total</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalPorPagar)}</p>
          </div>
        </div>

        {/* Tabla de Figuras */}
        <div className="overflow-y-auto flex-1 bg-slate-50 p-6">
          <div className="card overflow-x-auto bg-white">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Producto</th>
                  <th className="px-6 py-4 font-medium">Cliente (Apodo)</th>
                  <th className="px-6 py-4 font-medium">Valor Venta</th>
                  <th className="px-6 py-4 font-medium">Pagado</th>
                  <th className="px-6 py-4 font-medium">Por Pagar</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Comentario</th>
                </tr>
              </thead>
              <tbody>
                {clientSales.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{sale.fecha}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{sale.figura}</td>
                    <td className="px-6 py-4 uppercase">{sale.cliente_apodo}</td>
                    <td className="px-6 py-4">{formatCurrency(sale.valor_venta)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">{formatCurrency(sale.pagado)}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">{formatCurrency(sale.por_pagar || 0)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusBadgeClass(sale.estado)} uppercase`}>
                        {sale.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic text-xs max-w-[150px] truncate" title={sale.comentario}>
                      {sale.comentario || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-300">
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-right font-bold text-slate-800">
                    TOTAL POR PAGAR:
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600 text-lg">
                    {formatCurrency(totalPorPagar)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <ReceiptTotal 
          ref={receiptRef} 
          clientSales={clientSales} 
          clienteApodo={clienteApodo} 
          totals={{ totalPorPagar }} 
        />
      </div>
    </div>
  );
};
