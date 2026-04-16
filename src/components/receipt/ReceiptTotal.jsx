import React, { forwardRef } from 'react';
import { formatCurrency } from '../../utils/calculations';

export const ReceiptTotal = forwardRef(({ clientSales, clienteApodo, totals }, ref) => {
  if (!clientSales || clientSales.length === 0) return null;

  // Tomamos el cliente_real de la descripción de la primera venta para mostrar en el recibo
  const clienteReal = clientSales[0]?.cliente_real || '';
  const fechaActual = new Date().toLocaleDateString('es-CL');

  // Asegurar que sume 0 si no hay
  const totalPorPagarSeguro = totals?.totalPorPagar || 0;

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      <div 
        ref={ref} 
        className="bg-white p-8 w-[600px] border border-slate-200"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <img 
            src="/logo.jpg" 
            alt="Logo" 
            className="h-20 mx-auto mb-4 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 className="text-xl font-bold text-slate-800 tracking-wide uppercase">Resumen de Cuenta</h2>
          <p className="text-sm text-slate-500 mt-1">Total de productos y saldos</p>
        </div>

        {/* Cliente Info */}
        <div className="border-t border-b border-dashed border-slate-300 py-3 mb-6 flex justify-between items-center">
          <div>
            <span className="text-slate-500 text-xs block uppercase">Cliente</span>
            <span className="font-bold text-slate-800">{clienteReal}</span>
            <span className="text-slate-500 text-sm ml-2">({clienteApodo})</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-xs block uppercase">Fecha Emisión</span>
            <span className="font-medium text-slate-800">{fechaActual}</span>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Detalle de Productos ({clientSales.length})</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-2 px-2 font-medium">Producto</th>
                <th className="py-2 px-2 font-medium text-right">Valor</th>
                <th className="py-2 px-2 font-medium text-right">Pagado</th>
                <th className="py-2 px-2 font-medium text-right">Deuda</th>
                <th className="py-2 px-2 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {clientSales.map(sale => (
                <tr key={sale.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-2 font-medium text-slate-800">{sale.figura}</td>
                  <td className="py-3 px-2 text-right">{formatCurrency(sale.valor_venta)}</td>
                  <td className="py-3 px-2 text-right text-emerald-600">{formatCurrency(sale.pagado)}</td>
                  <td className="py-3 px-2 text-right text-red-600 font-medium">{formatCurrency(sale.por_pagar || 0)}</td>
                  <td className="py-3 px-2 text-center text-xs uppercase text-slate-600">{sale.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Final */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center mb-6">
          <span className="text-lg font-bold text-slate-800 uppercase">Total Por Pagar</span>
          <span className="text-2xl font-bold text-red-600">{formatCurrency(totalPorPagarSeguro)}</span>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Gracias por tu preferencia.</p>
          <p>NSJ Store</p>
        </div>
      </div>
    </div>
  );
});

ReceiptTotal.displayName = 'ReceiptTotal';
