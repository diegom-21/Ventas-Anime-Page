/**
 * Calcula el estado de una venta basado en el valor_venta y pagado
 * @param {number} valorVenta 
 * @param {number} pagado 
 * @returns { porPagar: number, estado: string }
 */
export const calculateSaleStatus = (valorVenta = 0, pagado = 0) => {
  const vVenta = Number(valorVenta);
  const vPagado = Number(pagado);
  
  if (isNaN(vVenta) || isNaN(vPagado)) {
    return { porPagar: 0, estado: 'debe' };
  }

  const porPagar = vVenta - vPagado;

  let estado = 'debe';
  if (vPagado >= vVenta) {
    estado = 'pagado';
  } else if (vPagado > 0 && vPagado < vVenta) {
    estado = 'parcial';
  } else {
    estado = 'debe';
  }

  return { porPagar, estado };
};

/**
 * Calcula el resumen del dashboard a partir de un listado de ventas
 * @param {Array} sales 
 */
export const calculateDashboardTotals = (sales = []) => {
  return sales.reduce((acc, sale) => {
    acc.totalVendido += Number(sale.valor_venta || 0);
    acc.totalCobrado += Number(sale.pagado || 0);
    acc.totalPorCobrar += Number(sale.por_pagar || 0);
    return acc;
  }, { totalVendido: 0, totalCobrado: 0, totalPorCobrar: 0 });
};

/**
 * Obtiene el resumen de un cliente específico, agrupando sus ventas y sumando totales
 * @param {Array} sales 
 * @param {string} clienteApodo 
 */
export const calculateClientSummary = (sales = [], clienteApodo) => {
  const clientSales = sales.filter(s => s.cliente_apodo === clienteApodo);
  
  const totals = clientSales.reduce((acc, sale) => {
    acc.totalCompras += Number(sale.valor_venta || 0);
    acc.totalPagado += Number(sale.pagado || 0);
    acc.totalPorPagar += Number(sale.por_pagar || 0);
    return acc;
  }, { totalCompras: 0, totalPagado: 0, totalPorPagar: 0 });

  return {
    clientSales,
    totals
  };
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
