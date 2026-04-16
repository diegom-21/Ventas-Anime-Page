import React, { useMemo } from 'react';
import { useSales } from '../../context/SalesContext';
import { calculateDashboardTotals, formatCurrency } from '../../utils/calculations';
import { Coins, TrendingUp, HandCoins } from 'lucide-react';

export const DashboardHeader = () => {
  const { sales } = useSales();
  
  const totals = useMemo(() => calculateDashboardTotals(sales), [sales]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Vendido */}
      <div className="card p-6 border-l-4 border-l-brand-500 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Vendido</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(totals.totalVendido)}</p>
          </div>
          <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Total Cobrado */}
      <div className="card p-6 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Cobrado</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalCobrado)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-emerald-600">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* Por Cobrar */}
      <div className="card p-6 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Por Cobrar</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalPorCobrar)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <HandCoins size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};
