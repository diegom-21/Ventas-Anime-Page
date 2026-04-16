import React, { useState, useEffect } from 'react';
import { useSales } from '../../context/SalesContext';
import { calculateSaleStatus, formatCurrency } from '../../utils/calculations';
import { X, Save } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SalesForm = ({ isOpen, onClose, saleToEdit }) => {
  const { sales, addSale, updateSale } = useSales();
  
  const uniqueClients = React.useMemo(() => {
    const clientsMap = new Map();
    sales.forEach(s => {
      if (s.cliente_apodo && !clientsMap.has(s.cliente_apodo.toUpperCase())) {
        clientsMap.set(s.cliente_apodo.toUpperCase(), { 
          apodo: s.cliente_apodo, 
          real: s.cliente_real 
        });
      }
    });
    return Array.from(clientsMap.values());
  }, [sales]);

  const initialState = {
    fecha: new Date().toISOString().split('T')[0],
    figura: '',
    cliente_apodo: '',
    cliente_real: '',
    valor_venta: '',
    margen: '',
    pagado: '0',
    comentario: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (saleToEdit) {
      setFormData(saleToEdit);
    } else {
      setFormData(initialState);
    }
  }, [saleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'cliente_apodo') {
        const upperValue = value.toUpperCase();
        const existingClient = uniqueClients.find(c => c.apodo.toUpperCase() === upperValue);
        if (existingClient) {
          newData.cliente_real = existingClient.real;
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (saleToEdit) {
      updateSale(saleToEdit.id, formData);
    } else {
      addSale(formData);
    }

    const { estado } = calculateSaleStatus(formData.valor_venta, formData.pagado);
    if (estado === 'pagado') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669']
      });
    }

    onClose();
  };

  const { porPagar, estado } = calculateSaleStatus(formData.valor_venta, formData.pagado);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pagado': return 'bg-green-100 text-green-800 border-green-200';
      case 'parcial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'debe': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {saleToEdit ? 'Editar Venta' : 'Nueva Venta'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="saleForm" onSubmit={handleSubmit} className="space-y-6" autoComplete='off'>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="label">Fecha</label>
                <input type="date" name="fecha" required value={formData.fecha} onChange={handleChange} className="input" />
              </div>

              <div className="relative">
                <label className="label">Apodo del Cliente</label>
                <input 
                  type="text" 
                  name="cliente_apodo" 
                  required 
                  placeholder="Ingrese apodo" 
                  value={formData.cliente_apodo} 
                  onChange={handleChange} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="input" 
                  autoComplete="new-password"
                />
                
                {showSuggestions && formData.cliente_apodo && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {uniqueClients
                      .filter(c => c.apodo.toUpperCase().includes(formData.cliente_apodo.toUpperCase()))
                      .map(c => (
                        <div 
                          key={c.apodo} 
                          className="px-4 py-2 hover:bg-brand-50 cursor-pointer text-sm text-slate-700"
                          onClick={() => {
                            handleChange({ target: { name: 'cliente_apodo', value: c.apodo } });
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-semibold uppercase">{c.apodo}</span>
                          <span className="text-slate-400 text-xs ml-2">({c.real})</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Nombre Real</label>
                <input type="text" name="cliente_real" required placeholder="Ej: Juan Pérez" value={formData.cliente_real} onChange={handleChange} className="input" />
              </div>

              <div>
                <label className="label">Producto</label>
                <input type="text" name="figura" required placeholder="Ingrese Producto" value={formData.figura} onChange={handleChange} className="input" />
              </div>

              <div>
                <label className="label">Margen (Opcional)</label>
                <input type="number" name="margen" placeholder="Ej: 5000" value={formData.margen} onChange={handleChange} className="input" />
              </div>
              
              <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Pagos y Deuda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Valor Venta (Total)</label>
                    <input type="number" name="valor_venta" required placeholder="Ej: 50000" min="0" value={formData.valor_venta} onChange={handleChange} className="input text-lg font-bold" />
                  </div>

                  <div>
                    <label className="label">Monto Pagado</label>
                    <input type="number" name="pagado" required placeholder="Ej: 10000" min="0" value={formData.pagado} onChange={handleChange} className="input text-lg text-emerald-600 font-bold" />
                  </div>
                </div>
              </div>

              {/* Vista Previa de Cálculo Dinámico */}
              <div className="col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">Por Pagar Calculado:</p>
                  <p className="text-2xl font-bold text-slate-800">{formatCurrency(porPagar)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Estado Resultante:</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase border ${getStatusColor(estado)}`}>
                    {estado}
                  </span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="label">Comentario</label>
                <textarea name="comentario" rows="2" placeholder="Ej: Falta caja, entrega en metro..." value={formData.comentario} onChange={handleChange} className="input resize-none" />
              </div>

            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button type="submit" form="saleForm" className="btn btn-primary gap-2">
            <Save size={18} />
            {saleToEdit ? 'Guardar Cambios' : 'Crear Venta'}
          </button>
        </div>

      </div>
    </div>
  );
};
