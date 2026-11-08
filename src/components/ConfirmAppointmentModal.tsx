import React, { useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Scissors,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { Cita } from '../types';
import { formatYYYYMMDDtoDDMMYYYY, canConfirmAppointment } from '../utils/appointmentManager';

interface ConfirmAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  appointments: Cita[];
  onConfirm: (cita: Cita) => void;
}

export const ConfirmAppointmentModal: React.FC<ConfirmAppointmentModalProps> = ({
  isOpen,
  onClose,
  cita,
  appointments,
  onConfirm,
}) => {
  if (!isOpen || !cita) return null;

  // Validación de seguridad para evitar doble confirmación (Requisito 12)
  const validation = useMemo(() => {
    return canConfirmAppointment(cita, appointments);
  }, [cita, appointments]);

  const handleConfirmClick = () => {
    if (!validation.canConfirm) return;
    onConfirm(cita);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-pink-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                Confirmación de Cita
              </span>
              <h3 className="font-serif font-bold text-xl text-white">
                ¿Confirmar esta cita?
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Conflicto / Bloqueo si no se puede confirmar */}
          {!validation.canConfirm && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-rose-800">
                  No se puede confirmar este horario
                </span>
                <p className="text-slate-700">{validation.reason}</p>
              </div>
            </div>
          )}

          {/* Información estructurada de la cita (Requisito 6) */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 divide-y divide-purple-100 text-xs">
            <div className="py-2 flex items-center justify-between first:pt-0">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-purple-600" />
                Cliente:
              </span>
              <span className="font-bold text-slate-900 text-sm">{cita.cliente_nombre}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Scissors className="w-3.5 h-3.5 text-purple-600" />
                Servicio:
              </span>
              <span className="font-bold text-purple-950">{cita.servicio_nombre}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Fecha:
              </span>
              <span className="font-serif font-bold text-slate-900">
                {formatYYYYMMDDtoDDMMYYYY(cita.fecha)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between last:pb-0">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Horario:
              </span>
              <span className="font-mono font-extrabold text-purple-900">
                {cita.hora_inicio} - {cita.hora_fin} ({cita.duracion} min)
              </span>
            </div>
          </div>

          {/* Banner explicativo de bloqueo de horario (Requisito 8) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Al confirmar, el estado cambiará a <strong>CONFIRMADA</strong> y el horario quedará <strong>bloqueado</strong> permanentemente para nuevos clientes.
            </span>
          </div>
        </div>

        {/* Buttons (Requisito 6) */}
        <div className="p-5 border-t border-purple-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            CANCELAR
          </button>

          <button
            type="button"
            disabled={!validation.canConfirm}
            onClick={handleConfirmClick}
            className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>CONFIRMAR CITA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
