import React, { useState } from 'react';
import { X, Calendar, Clock, Sparkles, CheckCircle2, Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { Salon, ServiceItem, SalonScheduleConfig, DayOfWeek } from '../types';
import { calculateAvailableSlots } from '../utils/scheduleGenerator';

interface ReservationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: Salon | null;
  service?: ServiceItem | null;
  scheduleConfig?: SalonScheduleConfig;
}

export const ReservationNoticeModal: React.FC<ReservationNoticeModalProps> = ({
  isOpen,
  onClose,
  salon,
  service,
  scheduleConfig,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('lunes');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  if (!isOpen || !salon) return null;

  // Active day schedule from config if available
  const daySchedule = scheduleConfig?.dias.find((d) => d.dia === selectedDay);

  // Calculate slots dynamically if service and schedule are present
  const availableSlots = (service && daySchedule)
    ? calculateAvailableSlots(
        daySchedule,
        service.durationMinutes,
        scheduleConfig?.intervaloMinutos || 30
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-purple-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block">
                Plataforma TuCita · Etapa 5
              </span>
              <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                {service ? service.name : `Reservar cita en ${salon.name}`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Service Details if available */}
        {service && (
          <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200/70 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Servicio seleccionado:</span>
              <span className="font-bold text-purple-950 text-sm">{service.name}</span>
              <span className="text-purple-700 block text-[11px] font-semibold mt-0.5">
                <Clock className="w-3 h-3 inline mr-1 text-purple-600" />
                Duración: {service.durationMinutes} minutos
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Precio:</span>
              <span className="font-extrabold text-base text-purple-900">Bs {service.price}</span>
            </div>
          </div>
        )}

        {/* Dynamic Schedule & Turnos Engine (Etapa 5) */}
        {service && scheduleConfig && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-950">
                Selecciona un día para ver turnos:
              </label>
              {daySchedule?.activo ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {daySchedule.horaInicio} - {daySchedule.horaFin}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                  Día de descanso
                </span>
              )}
            </div>

            {/* Day Selector Pills */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-xs">
              {scheduleConfig.dias.map((d) => (
                <button
                  key={d.dia}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.dia);
                    setSelectedSlot(null);
                  }}
                  className={`py-2 px-1 rounded-xl text-center font-bold transition-all cursor-pointer ${
                    selectedDay === d.dia
                      ? 'bg-purple-800 text-white shadow-xs'
                      : d.activo
                      ? 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="block text-[11px] uppercase truncate">{d.nombreDia.slice(0, 3)}</span>
                  <span className="text-[9px] block font-normal opacity-80">
                    {d.activo ? 'Abierto' : 'Descanso'}
                  </span>
                </button>
              ))}
            </div>

            {/* Turnos generados */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Horarios calculados ({availableSlots.length} turnos):
                </span>
                <span className="text-[11px] text-slate-500">
                  Intervalo: {scheduleConfig.intervaloMinutos === 'servicio' ? `${service.durationMinutes} min` : `${scheduleConfig.intervaloMinutos} min`}
                </span>
              </div>

              {daySchedule?.activo ? (
                availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.label}
                        type="button"
                        onClick={() => setSelectedSlot(slot.label)}
                        className={`p-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                          selectedSlot === slot.label
                            ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                            : 'bg-white border-purple-200 text-purple-950 hover:border-purple-400 hover:bg-purple-50/50'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                    No hay turnos disponibles para este servicio en este día (excede el horario o choca con descansos).
                  </div>
                )
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs text-center italic">
                  {daySchedule?.nombreDia} es día de descanso en {salon.name}.
                </div>
              )}

              {selectedSlot && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Turno seleccionado: <strong>{selectedSlot}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notice Content */}
        <div className="space-y-3">
          <div className="p-4 bg-purple-900 text-white rounded-2xl shadow-sm space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
              <Sparkles className="w-4 h-4" />
              <span>Disponibilidad y Horarios Vinculados (Etapa 5)</span>
            </div>
            <p className="text-xs text-purple-100/90 leading-relaxed">
              Los turnos se calculan de manera autónoma para <strong>{salon.name}</strong> según su horario de apertura, descansos y la duración exacta de <strong>{service ? `${service.durationMinutes} min` : 'este servicio'}</strong>.
            </p>
            <p className="text-[11px] text-purple-200/80 leading-relaxed pt-1 border-t border-purple-800">
              La confirmación final de reservas con registro de citas se habilitará en la siguiente etapa del proyecto.
            </p>
          </div>

          {/* Direct contact info in the meantime */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
              Contacto directo del salón ({salon.name}):
            </span>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                Teléfono:
              </span>
              <span className="font-semibold text-slate-900">{salon.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp:
              </span>
              <span className="font-semibold text-emerald-800">{salon.whatsapp}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-purple-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Entendido, volver al salón
          </button>
        </div>
      </div>
    </div>
  );
};
