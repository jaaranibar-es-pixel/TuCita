import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Send,
  User,
  Scissors,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { Cita, Salon, SalonScheduleConfig } from '../types';
import {
  getRolling7Days,
  formatYYYYMMDDtoDDMMYYYY,
  timeToMinutes,
  minutesToTime
} from '../utils/appointmentManager';
import { getDayScheduleForDate } from '../utils/scheduleValidator';

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  salon: Salon;
  scheduleConfig?: SalonScheduleConfig;
  existingAppointments: Cita[];
  onConfirmProposal: (propuesta: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    mensaje?: string;
  }) => void;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
  isOpen,
  onClose,
  cita,
  salon,
  scheduleConfig,
  existingAppointments,
  onConfirmProposal,
}) => {
  const rollingDays = useMemo(() => getRolling7Days(), []);

  // Form states
  const [propuestaFecha, setPropuestaFecha] = useState<string>(
    cita ? cita.fecha : rollingDays[0].dateStr
  );
  const [propuestaHoraInicio, setPropuestaHoraInicio] = useState<string>(
    cita ? cita.hora_inicio : '10:00'
  );
  const [propuestaMensaje, setPropuestaMensaje] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Keep state synced when cita changes
  React.useEffect(() => {
    if (cita) {
      setPropuestaFecha(cita.fecha);
      setPropuestaHoraInicio(cita.hora_inicio);
      setPropuestaMensaje(
        `Hola ${cita.cliente_nombre}, no me es posible atenderte en el horario solicitado, pero te propongo este horario alternativo para atenderte con gusto.`
      );
      setErrorMessage('');
    }
  }, [cita]);

  if (!isOpen || !cita) return null;

  const duracionServicio = cita.duracion || 30;
  const startMins = timeToMinutes(propuestaHoraInicio);
  const endMins = startMins + duracionServicio;
  const propuestaHoraFin = minutesToTime(endMins);

  // Validaciones en tiempo real de la propuesta
  const validation = (): { valid: boolean; error?: string } => {
    if (!propuestaFecha) return { valid: false, error: 'Selecciona una fecha.' };
    if (!propuestaHoraInicio || !/^\d{2}:\d{2}$/.test(propuestaHoraInicio)) {
      return { valid: false, error: 'Ingresa una hora de inicio válida (HH:mm).' };
    }

    if (scheduleConfig) {
      const daySchedule = getDayScheduleForDate(propuestaFecha, scheduleConfig);
      if (daySchedule) {
        if (!daySchedule.activo) {
          return { valid: false, error: `El salón está cerrado el día ${daySchedule.nombreDia}.` };
        }
        const openMins = timeToMinutes(daySchedule.horaInicio || '08:00');
        const closeMins = timeToMinutes(daySchedule.horaFin || '18:00');

        if (startMins < openMins) {
          return {
            valid: false,
            error: `La hora es anterior a la apertura del salón (${daySchedule.horaInicio}).`,
          };
        }
        if (endMins > closeMins) {
          return {
            valid: false,
            error: `El servicio (${duracionServicio} min) excede la hora de cierre del salón (${daySchedule.horaFin}).`,
          };
        }

        const lunchAllowed =
          daySchedule.permitirAtencionAlmuerzo ?? scheduleConfig.permitirAtencionAlmuerzo ?? false;
        if (!lunchAllowed && daySchedule.horarioAlmuerzo) {
          const lStart = timeToMinutes(daySchedule.horarioAlmuerzo.horaInicio);
          const lEnd = timeToMinutes(daySchedule.horarioAlmuerzo.horaFin);
          if (Math.max(startMins, lStart) < Math.min(endMins, lEnd)) {
            return {
              valid: false,
              error: `El horario colisiona con el descanso de almuerzo (${daySchedule.horarioAlmuerzo.horaInicio} a ${daySchedule.horarioAlmuerzo.horaFin}).`,
            };
          }
        }
      }
    }

    // Verificar colisión con citas ya confirmadas para ese salón y fecha
    const conflict = existingAppointments.find((c) => {
      if (c.id === cita.id || c.salon_id !== salon.id || c.fecha !== propuestaFecha) return false;
      if (c.estado !== 'CONFIRMADA') return false;
      const cStart = timeToMinutes(c.hora_inicio);
      const cEnd = timeToMinutes(c.hora_fin);
      return Math.max(startMins, cStart) < Math.min(endMins, cEnd);
    });

    if (conflict) {
      return {
        valid: false,
        error: `Colisiona con la cita confirmada ${conflict.codigo_cita} (${conflict.hora_inicio}–${conflict.hora_fin}). Elige otro horario.`,
      };
    }

    return { valid: true };
  };

  const currentVal = validation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVal.valid) {
      setErrorMessage(currentVal.error || 'Horario no válido.');
      return;
    }

    onConfirmProposal({
      fecha: propuestaFecha,
      hora_inicio: propuestaHoraInicio,
      hora_fin: propuestaHoraFin,
      mensaje: propuestaMensaje.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-600 via-purple-900 to-purple-950 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-200 block">
              Gestión de Agenda · TuCita
            </span>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Proponer Horario Alternativo (Contraoferta)</span>
            </h3>
            <p className="text-xs text-purple-200 mt-0.5">
              Solicitud {cita.codigo_cita} · {salon.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resumen de la petición del cliente */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
              Petición Original del Cliente:
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Cliente:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-700" />
                  {cita.cliente_nombre}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Servicio:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-purple-700" />
                  {cita.servicio_nombre} ({cita.duracion} min)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha solicitada:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatYYYYMMDDtoDDMMYYYY(cita.fecha)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Hora preferida:</span>
                <span className="font-bold text-purple-900 font-mono">
                  {cita.hora_inicio} - {cita.hora_fin}
                </span>
              </div>
            </div>

            {cita.preferencia_horaria && (
              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Flexibilidad indicada:</span>
                <span className="font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                  {cita.preferencia_horaria === 'EXACTA'
                    ? 'Prefiere exactamente esa hora'
                    : cita.preferencia_horaria === 'MISMO_DIA'
                    ? 'Acepta otro horario el mismo día'
                    : cita.preferencia_horaria === 'MANANA'
                    ? 'Prefiere por la mañana'
                    : 'Prefiere por la tarde'}
                </span>
              </div>
            )}
          </div>

          {/* Nueva Fecha Propuesta */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>Nueva fecha que propones al cliente:</span>
              </span>
              <span className="text-[11px] text-purple-700 font-normal">
                {formatYYYYMMDDtoDDMMYYYY(propuestaFecha)}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {rollingDays.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setPropuestaFecha(d.dateStr)}
                  className={`p-2 rounded-xl text-center border font-bold text-xs transition-colors cursor-pointer ${
                    propuestaFecha === d.dateStr
                      ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                      : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200/70'
                  }`}
                >
                  <span className="block text-[10px] text-purple-300 font-normal capitalize">
                    {d.dayName}
                  </span>
                  <span className="block font-mono text-xs">{d.displayDate.slice(0, 5)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nueva Hora Propuesta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Hora de inicio (HH:mm)</span>
                <Clock className="w-3.5 h-3.5 text-purple-700" />
              </label>
              <input
                type="time"
                value={propuestaHoraInicio}
                onChange={(e) => setPropuestaHoraInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-sm font-bold bg-white text-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Hora final calculada</span>
                <span className="text-[11px] text-slate-400">Automático</span>
              </label>
              <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm font-bold text-purple-950 flex items-center justify-between">
                <span>{propuestaHoraFin}</span>
                <span className="text-[11px] text-purple-700 font-normal">
                  ({duracionServicio} min)
                </span>
              </div>
            </div>
          </div>

          {/* Horas sugeridas */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">Sugeridas:</span>
            {['09:00', '10:30', '11:00', '14:00', '15:30', '16:00', '17:00'].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setPropuestaHoraInicio(h)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  propuestaHoraInicio === h
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-900 border border-purple-200/60 hover:bg-purple-100'
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Validación de horario */}
          {!currentVal.valid ? (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{currentVal.error}</span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Horario disponible y compatible con el salón: {propuestaHoraInicio} a {propuestaHoraFin}.
              </span>
            </div>
          )}

          {/* Mensaje al cliente */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
              <span>Mensaje explicativo para el cliente:</span>
            </label>
            <textarea
              rows={3}
              value={propuestaMensaje}
              onChange={(e) => setPropuestaMensaje(e.target.value)}
              placeholder="Ej: Hola, ese día tenemos copado por la mañana, pero con gusto te atendemos en este nuevo horario."
              className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Aviso sobre el plazo de 24 horas */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <span className="font-bold block">Reglas de la contraoferta:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
              <li>El cliente tendrá 24 horas para aceptar o rechazar tu propuesta.</li>
              <li>Si el cliente acepta, la cita se confirma y se crea automáticamente la ficha en tu agenda.</li>
              <li>Si el cliente rechaza o vencen las 24 horas, la solicitud se anula sin alterar tu agenda.</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-purple-200 text-slate-700 font-bold hover:bg-purple-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!currentVal.valid}
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold shadow-md cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar contraoferta al cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
