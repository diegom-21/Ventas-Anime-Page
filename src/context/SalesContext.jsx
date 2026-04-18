import React, { createContext, useContext, useMemo } from 'react';
import { useJsonStorage } from '../hooks/useJsonStorage';
import { v4 as uuidv4 } from 'uuid';
import { calculateSaleStatus } from '../utils/calculations';

const SalesContext = createContext(null);

export const SalesProvider = ({ children }) => {
  const [sales, setSales, isLoading] = useJsonStorage([]);

  const addSale = (saleData) => {
    const { valor_venta, pagado } = saleData;
    const { porPagar, estado } = calculateSaleStatus(valor_venta, pagado);

    const newSale = {
      ...saleData,
      id: uuidv4(),
      por_pagar: porPagar,
      estado: estado,
      fecha: saleData.fecha || new Date().toISOString().split('T')[0], // Default a hoy
    };

    setSales([newSale, ...sales]);
  };

  const updateSale = (id, updatedData) => {
    setSales(sales.map(sale => {
      if (sale.id === id) {
        const { valor_venta, pagado } = updatedData;
        const { porPagar, estado } = calculateSaleStatus(valor_venta, pagado);
        return {
          ...sale,
          ...updatedData,
          por_pagar: porPagar,
          estado: estado,
        };
      }
      return sale;
    }));
  };

  const deleteSale = (id) => {
    setSales(sales.filter(sale => sale.id !== id));
  };

  const value = useMemo(() => ({
    sales,
    addSale,
    updateSale,
    deleteSale
  }), [sales]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse uppercase tracking-widest text-sm">Cargando Sistema...</p>
      </div>
    );
  }

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSales must be used within a SalesProvider");
  }
  return context;
};
