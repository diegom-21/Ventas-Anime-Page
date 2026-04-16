import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{title || "Confirmar acción"}</h2>
          <p className="text-slate-500 text-sm mb-6">
            {message || "¿Estás seguro que deseas realizar esta acción? No se puede deshacer."}
          </p>
        </div>

        <div className="flex gap-3 justify-center w-full">
          <button 
            onClick={onCancel} 
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-danger flex-1"
          >
            Eliminar
          </button>
        </div>
        
      </div>
    </div>
  );
};
