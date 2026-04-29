import React, { useState, useEffect, useRef } from 'react';
import { useSales } from '../../context/SalesContext';
import { calculateSaleStatus, formatCurrency } from '../../utils/calculations';
import { X, Save } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SalesForm = ({ isOpen, onClose, saleToEdit }) => {
  const { sales, addSale, updateSale } = useSales();
  
  const uniqueClients = React.useMemo(() => {
    const clientsMap = new Map();
    sales.forEach(s => {
      if (s.cliente && !clientsMap.has(s.cliente.toUpperCase())) {
        clientsMap.set(s.cliente.toUpperCase(), { 
          cliente: s.cliente.toUpperCase(), 
          apodo: s.cliente_apodo || '' 
        });
      }
    });
    return Array.from(clientsMap.values());
  }, [sales]);

  const uniqueLotes = React.useMemo(() => {
    const lotesSet = new Set();
    sales.forEach(s => {
      if (s.lote) lotesSet.add(s.lote.toUpperCase());
    });
    return Array.from(lotesSet);
  }, [sales]);

  const initialState = {
    fecha: new Date().toISOString().split('T')[0],
    figura: '',
    cliente: '',
    cliente_apodo: '',
    valor_venta: '',
    valor_1: '',
    lote: '',
    pagado: '0',
    comentario: '',
    obs: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLoteSuggestions, setShowLoteSuggestions] = useState(false);
  const comentarioRef = useRef(null);

  useEffect(() => {
    if (saleToEdit) {
      setFormData(saleToEdit);
    } else {
      setFormData(initialState);
    }
  }, [saleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Forzar mayúsculas en campos de texto (excepto números y fechas)
    if (typeof value === 'string' && name !== 'fecha' && name !== 'valor_1' && name !== 'valor_venta' && name !== 'pagado') {
      value = value.toUpperCase();
    }
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'cliente') {
        const existingClient = uniqueClients.find(c => c.cliente === value);
        if (existingClient && existingClient.apodo) {
          newData.cliente_apodo = existingClient.apodo;
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
                <label className="label">Cliente</label>
                <input 
                  type="text" 
                  name="cliente" 
                  required 
                  placeholder="Ingrese Cliente" 
                  value={formData.cliente} 
                  onChange={handleChange} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="input" 
                  autoComplete="new-password"
                />
                
                {showSuggestions && formData.cliente && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {uniqueClients
                      .filter(c => c.cliente.includes(formData.cliente))
                      .map(c => (
                        <div 
                          key={c.cliente} 
                          className="px-4 py-2 hover:bg-brand-50 cursor-pointer text-sm text-slate-700"
                          onClick={() => {
                            handleChange({ target: { name: 'cliente', value: c.cliente } });
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="font-semibold">{c.cliente}</span>
                          {c.apodo && <span className="text-slate-400 text-xs ml-2">({c.apodo})</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Apodo (Opcional)</label>
                <input type="text" name="cliente_apodo" placeholder="Ej: Juan" value={formData.cliente_apodo} onChange={handleChange} className="input" />
              </div>

              <div>
                <label className="label">Producto</label>
                <input type="text" name="figura" required placeholder="Ingrese Producto" value={formData.figura} onChange={handleChange} className="input" />
              </div>

              <div>
                <label className="label">Valor 1</label>
                <input type="number" step="0.01" name="valor_1" placeholder="Ej: 40.50" value={formData.valor_1} onChange={handleChange} className="input" />
              </div>

              <div className="relative">
                <label className="label">Lote</label>
                <input 
                  type="text" 
                  name="lote" 
                  placeholder="Ej: Lote Dic" 
                  value={formData.lote} 
                  onChange={handleChange} 
                  onFocus={() => setShowLoteSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLoteSuggestions(false), 200)}
                  className="input" 
                  autoComplete="off"
                />
                
                {showLoteSuggestions && formData.lote && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {uniqueLotes
                      .filter(l => l.includes(formData.lote.toUpperCase()))
                      .map(l => (
                        <div 
                          key={l} 
                          className="px-4 py-2 hover:bg-brand-50 cursor-pointer text-sm text-slate-700"
                          onClick={() => {
                            handleChange({ target: { name: 'lote', value: l } });
                            setShowLoteSuggestions(false);
                          }}
                        >
                          <span className="font-semibold uppercase">{l}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Pagos y Deuda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Valor Venta (Total)</label>
                    <input type="number" step="0.01" name="valor_venta" required placeholder="Ej: 50.00" min="0" value={formData.valor_venta} onChange={handleChange} className="input text-lg font-bold" />
                  </div>

                  <div>
                    <label className="label">Monto Pagado</label>
                    <input type="number" step="0.01" name="pagado" required placeholder="Ej: 10.00" min="0" value={formData.pagado} onChange={handleChange} className="input text-lg text-emerald-600 font-bold" />
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

              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="label">Comentario (Visible)</label>
                  <div className="relative border border-slate-200 rounded-lg focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all bg-white flex flex-col">
                    <textarea 
                      name="comentario" 
                      ref={comentarioRef}
                      rows="2" 
                      placeholder="Ej: Pago pendiente..." 
                      value={formData.comentario} 
                      onChange={handleChange} 
                      className="w-full bg-transparent p-3 outline-none resize-none text-sm" 
                    />
                    {!formData.comentario && (
                      <div className="flex gap-2 px-3 pb-3 flex-wrap">
                        {['PREVENTA', 'ENVIADO', 'LLEGÓ PERÚ'].map(sug => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              handleChange({ target: { name: 'comentario', value: sug + ' ' } });
                              setTimeout(() => {
                                if (comentarioRef.current) comentarioRef.current.focus();
                              }, 10);
                            }}
                            className="text-xs px-2 py-1 bg-brand-50 text-brand-600 rounded hover:bg-brand-100 transition-colors border border-brand-200"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">OBS (Interno)</label>
                  <textarea name="obs" rows="2" placeholder="Ej: Caja dañada..." value={formData.obs} onChange={handleChange} className="input resize-none" />
                </div>
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
