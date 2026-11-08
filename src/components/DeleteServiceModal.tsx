import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { ServiceItem } from '../types';

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service: ServiceItem | null;
}

export const DeleteServiceModal: React.FC<DeleteServiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  service,
}) => {
  if (!isOpen || !service) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-red-100 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon and Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-xl text-slate-900 leading-tight">
            ¿Estás seguro de que deseas eliminar este servicio?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Estás a punto de eliminar <strong className="text-slate-900">“{service.name}”</strong> ({service.price} Bs · {service.durationMinutes} min) del catálogo de tu salón.
          </p>
          <div className="p-3 bg-red-50 rounded-2xl border border-red-200/70 text-[11px] text-red-700 leading-relaxed">
            Esta acción quitará el servicio del catálogo público y no se podrá deshacer.
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
