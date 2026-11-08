import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Scissors,
  History,
  Tag,
  Ban,
  Sparkles,
  Timer
} from 'lucide-react';
import { Cita, HistorialCita, Salon } from '../types';
import { formatYYYYMMDDtoDDMMYYYY, getRemainingExpirationTime } from '../utils/appointmentManager';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  salon: Salon;
  historial: HistorialCita[];
  onOpenConfirm?: (cita: Cita) => void;
  onOpenReject?: (cita: Cita) => void;
  onOpenCancel?: (cita: Cita) => void;
  onOpenCounterOffer?: (cita: Cita) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  cita,
  salon,
  historial,
  onOpenConfirm,
  onOpenReject,
  onOpenCancel,
  onOpenCounterOffer,
}) => {
  if (!isOpen || !cita) return null;

  // Filtrar historial correspondiente a esta cita
  const citaHistorial = historial.filter((h) => h.cita_id === cita.id);

  // Colores y badges según estado (Requisito 26)
  const getBadge = () => {
    switch (cita.estado) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            PENDIENTE DE CONFIRMACIÓN
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            CONFIRMADA / AGENDADA
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            RECHAZADA
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            CANCELADA
          </span>
        );
      case 'PROPUESTA_ENVIADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            CONTRAOFERTA ENVIADA
          </span>
        );
      case 'CADUCADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-900 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            PLAZO EXPIRADO (CADUCADA)
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                Detalle Oficial de Cita
              </span>
              <h3 className="font-mono font-extrabold text-2xl text-white tracking-wide mt-0.5">
                {cita.codigo_cita}
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Salón: <strong>{salon.name}</strong>
              </p>
            </div>
            <div>{getBadge()}</div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Motivo de rechazo si aplica */}
          {cita.estado === 'RECHAZADA' && cita.motivo_rechazo && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-800">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Motivo del rechazo:
              </span>
              <p className="text-slate-700 italic pl-5">“{cita.motivo_rechazo}”</p>
              {cita.fecha_rechazo && (
                <span className="text-[10px] text-slate-500 block pl-5">
                  Rechazada el {new Date(cita.fecha_rechazo).toLocaleString('es-BO')}
                </span>
              )}
            </div>
          )}

          {/* Grid: Cliente & Cita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta Cliente */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block border-b border-purple-200/60 pb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Datos del Cliente
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nombre completo:</span>
                  <span className="font-bold text-slate-900 text-sm">{cita.cliente_nombre}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Teléfono:</span>
                    <a
                      href={`tel:${cita.cliente_telefono}`}
                      className="font-bold text-purple-900 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-purple-600" />
                      {cita.cliente_telefono}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                    <a
                      href={`https://wa.me/591${cita.cliente_whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(cita.cliente_nombre)},%20te%20escribimos%20de%20${encodeURIComponent(salon.name)}%20sobre%20tu%20cita%20${cita.codigo_cita}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Escribir</span>
                    </a>
                  </div>
                </div>

                {cita.cliente_correo && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Correo electrónico:</span>
                    <span className="text-slate-700 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-purple-500" />
                      {cita.cliente_correo}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjeta Cita y Horario */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block border-b border-purple-200/60 pb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Fecha y Horario de Atención
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Fecha solicitada:</span>
                  <span className="font-serif font-bold text-slate-900 text-sm">
                    {formatYYYYMMDDtoDDMMYYYY(cita.fecha)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Horario de reserva:</span>
                  <span className="font-mono font-extrabold text-purple-950 text-sm flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    {cita.hora_inicio} - {cita.hora_fin} ({cita.duracion} min)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Fecha de solicitud:</span>
                  <span className="text-slate-600 text-[11px]">
                    {new Date(cita.fecha_solicitud).toLocaleString('es-BO')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Servicio y Salón */}
          <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              Servicio y Salón
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Servicio:</span>
                <span className="font-bold text-slate-900 text-sm">{cita.servicio_nombre}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Duración: {cita.duracion} minutos
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Precio del servicio:</span>
                <span className="text-xl font-extrabold text-purple-950 font-sans tabular-nums">
                  Bs {cita.precio}
                </span>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-purple-50">
                <span className="text-slate-400 block text-[10px]">Ubicación del salón:</span>
                <span className="text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  {salon.name} · {salon.address}, {salon.city}
                </span>
              </div>
            </div>
          </div>

          {/* Nota del Cliente */}
          {cita.nota && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Nota especial del cliente
              </span>
              <p className="text-slate-800 italic">“{cita.nota}”</p>
            </div>
          )}

          {/* Alerta de Vigencia y Expiración (24 Horas) */}
          {(cita.estado === 'PENDIENTE' || cita.estado === 'PROPUESTA_ENVIADA') && (
            <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
              getRemainingExpirationTime(cita).expired
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-purple-50/70 border-purple-200 text-purple-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold block">Vigencia de la solicitud:</span>
                  <span className="text-[11px] text-slate-600">
                    Plazo de 24 horas para respuesta o contraoferta
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xl font-mono font-extrabold text-xs ${
                getRemainingExpirationTime(cita).expired
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-white border border-purple-200 text-purple-900'
              }`}>
                {getRemainingExpirationTime(cita).text}
              </span>
            </div>
          )}

          {/* Información de Contraoferta si aplica */}
          {cita.propuesta && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 text-indigo-950 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                  Contraoferta / Horario Alternativo Propuesto al Cliente:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-indigo-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">Fecha propuesta:</span>
                  <span className="font-bold text-slate-900">{formatYYYYMMDDtoDDMMYYYY(cita.propuesta.fecha)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Horario propuesto:</span>
                  <span className="font-mono font-bold text-indigo-950">
                    {cita.propuesta.hora_inicio} a {cita.propuesta.hora_fin}
                  </span>
                </div>
              </div>
              {cita.propuesta.mensaje && (
                <div className="text-xs text-indigo-900 italic pt-1">
                  <span className="font-bold not-italic">Mensaje adjunto: </span>
                  “{cita.propuesta.mensaje}”
                </div>
              )}
            </div>
          )}

          {/* Historial de Cambios (Requisito 15) */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-700" />
              Historial de Estados y Auditoría (HISTORIAL_CITAS)
            </span>

            {citaHistorial.length > 0 ? (
              <div className="space-y-2 border-l-2 border-purple-200 pl-4 py-1">
                {citaHistorial.map((item) => (
                  <div key={item.id} className="relative text-xs space-y-0.5">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">
                        {item.estado_anterior} → {item.estado_nuevo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.fecha).toLocaleString('es-BO')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Por: <strong>{item.usuario_nombre}</strong>
                      {item.observacion && ` · ${item.observacion}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Cita en su estado inicial. No se registran modificaciones de estado todavía.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-purple-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {cita.estado === 'PENDIENTE' && (
              <>
                {onOpenCounterOffer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCounterOffer(cita);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>CONTRAOFERTA</span>
                  </button>
                )}

                {onOpenReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReject(cita);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>RECHAZAR</span>
                  </button>
                )}

                {onOpenConfirm && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenConfirm(cita);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CONFIRMAR CITA</span>
                  </button>
                )}
              </>
            )}

            {cita.estado === 'CONFIRMADA' && onOpenCancel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCancel(cita);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5 text-slate-500" />
                <span>Cancelar cita</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
