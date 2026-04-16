import React, { forwardRef } from 'react';
import { formatCurrency } from '../../utils/calculations';

// Lo envolvemos en forwardRef para que el padre pueda pasar la ref a HTML-to-image
export const Receipt = forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      <div 
        ref={ref} 
        className="bg-white p-8 w-[400px] border border-slate-200"
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
          <h2 className="text-xl font-bold text-slate-800 tracking-wide uppercase">Recibo de Compra</h2>
          <p className="text-sm text-slate-500 mt-1">Comprobante de pago</p>
        </div>

        <div className="border-t border-b border-dashed border-slate-300 py-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Fecha</span>
            <span className="font-medium text-slate-800">{sale.fecha}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Cliente</span>
            <span className="font-medium text-slate-800 text-right">
              {sale.cliente_real} <br/>
              <span className="text-xs text-slate-500">({sale.cliente_apodo})</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Producto</span>
            <span className="font-bold text-brand-600 text-right max-w-[200px]">{sale.figura}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">Estado</span>
            <span className="font-semibold uppercase text-xs px-2 py-1 bg-slate-100 rounded text-slate-700">
              {sale.estado}
            </span>
          </div>
        </div>

        {/* Totales */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Valor Total</span>
            <span className="font-medium">{formatCurrency(sale.valor_venta)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Pagado</span>
            <span className="font-medium text-emerald-600">{formatCurrency(sale.pagado)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-slate-200">
            <span className="text-slate-800">Por Pagar</span>
            <span className="text-red-600">{formatCurrency(sale.por_pagar)}</span>
          </div>
        </div>

        {sale.comentario && (
          <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-600 italic border border-slate-100">
            "{sale.comentario}"
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Gracias por tu preferencia.</p>
          <p>NSJ Store</p>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
