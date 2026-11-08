import React, { useState } from 'react';
import {
  X,
  Ban,
  Calendar,
  Clock,
  User,
  Scissors,
  RotateCcw
} from 'lucide-react';
import { Cita } from '../types';
import { formatYYYYMMDDtoDDMMYYYY } from '../utils/appointmentManager';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  onCancelConfirm: (cita: Cita, observacion: string) => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  cita,
  onCancelConfirm,
}) => {
  const [observacion, setObservacion] = useState('Cancelada a solicitud del cliente o reprogramación.');

  if (!isOpen || !cita) return null;

  const handleCancelClick = () => {
    onCancelConfirm(cita, observacion.trim() || 'Cancelación de cita');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-slate-300">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 block">
                Cancelación de Cita
              </span>
              <h3 className="font-serif font-bold text-xl text-white">
                ¿Cancelar esta cita confirmada?
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 text-xs">
            <div className="py-2 flex items-center justify-between first:pt-0">
              <span className="text-slate-500 font-medium">Código:</span>
              <span className="font-mono font-bold text-slate-900">{cita.codigo_cita}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-bold text-slate-900">{cita.cliente_nombre}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Servicio:</span>
              <span className="font-bold text-slate-900">{cita.servicio_nombre}</span>
            </div>
            <div className="py-2 flex items-center justify-between last:pb-0">
              <span className="text-slate-500 font-medium">Fecha y Horario:</span>
              <span className="font-serif font-bold text-slate-900">
                {formatYYYYMMDDtoDDMMYYYY(cita.fecha)} ({cita.hora_inicio} - {cita.hora_fin})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Observación o motivo de cancelación:
            </label>
            <textarea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              El estado pasará a <strong>CANCELADA</strong> y el horario volverá a quedar disponible para agendar.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            VOLVER
          </button>

          <button
            type="button"
            onClick={handleCancelClick}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Ban className="w-4 h-4" />
            <span>CONFIRMAR CANCELACIÓN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
