import React, { useState } from 'react';
import {
  X,
  XCircle,
  Calendar,
  Clock,
  User,
  Scissors,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Cita } from '../types';
import { formatYYYYMMDDtoDDMMYYYY } from '../utils/appointmentManager';

interface RejectAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  onReject: (cita: Cita, motivo: string) => void;
}

const PRESET_REASONS = [
  'El horario ya no está disponible.',
  'El salón no atenderá ese día.',
  'Solicita otro horario.',
  'Estilista no disponible en ese turno.',
];

export const RejectAppointmentModal: React.FC<RejectAppointmentModalProps> = ({
  isOpen,
  onClose,
  cita,
  onReject,
}) => {
  const [motivo, setMotivo] = useState('El horario ya no está disponible.');

  if (!isOpen || !cita) return null;

  const handleRejectClick = () => {
    onReject(cita, motivo.trim() || 'Sin motivo especificado.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-rose-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-purple-950 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-rose-300">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-rose-300 block">
                Rechazo de Solicitud
              </span>
              <h3 className="font-serif font-bold text-xl text-white">
                ¿Rechazar esta solicitud?
              </h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Datos resumidos de la solicitud */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 divide-y divide-rose-100/60 text-xs">
            <div className="py-2 flex items-center justify-between first:pt-0">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-rose-700" />
                Cliente:
              </span>
              <span className="font-bold text-slate-900">{cita.cliente_nombre}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Scissors className="w-3.5 h-3.5 text-rose-700" />
                Servicio:
              </span>
              <span className="font-bold text-slate-900">{cita.servicio_nombre}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-rose-700" />
                Fecha:
              </span>
              <span className="font-serif font-bold text-slate-900">
                {formatYYYYMMDDtoDDMMYYYY(cita.fecha)}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between last:pb-0">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-rose-700" />
                Horario:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {cita.hora_inicio} - {cita.hora_fin}
              </span>
            </div>
          </div>

          {/* Campo Motivo del rechazo (Requisito 9) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Motivo del rechazo (opcional pero recomendado):
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica brevemente la razón del rechazo..."
              className="w-full p-3 rounded-2xl border border-rose-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMotivo(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    motivo === preset
                      ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-900'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Regla de liberación del horario (Requisitos 10 y 11) */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Liberación de horario:</strong> Al rechazar esta cita, el turno de las {cita.hora_inicio} a las {cita.hora_fin} volverá a estar <strong>disponible inmediatamente</strong> para otros clientes.
            </span>
          </div>
        </div>

        {/* Buttons (Requisito 9) */}
        <div className="p-5 border-t border-rose-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={handleRejectClick}
            className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>RECHAZAR CITA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
