import {
  DaySchedule,
  DayOfWeek,
  SalonScheduleConfig,
  FichaAtencion,
  BreakPeriod
} from '../types';

/**
 * Convierte "HH:mm" a minutos desde las 00:00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Convierte minutos desde las 00:00 a formato "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const norm = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(norm / 60) % 24;
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calcula la duración en minutos entre horaInicio y horaFin
 */
export function calculateDuration(horaInicio: string, horaFin: string): number {
  const start = timeToMinutes(horaInicio);
  const end = timeToMinutes(horaFin);
  return Math.max(0, end - start);
}

/**
 * Verifica si dos intervalos de tiempo se solapan
 */
export function isTimeOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Obtiene el día de la semana en español a partir de una fecha YYYY-MM-DD
 */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const date = new Date(y, m - 1, d);
  const dayIndex = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const map: Record<number, DayOfWeek> = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado',
  };
  return map[dayIndex] || 'lunes';
}

/**
 * Busca el DaySchedule correspondiente a una fecha YYYY-MM-DD
 */
export function getDayScheduleForDate(
  dateStr: string,
  config?: SalonScheduleConfig
): DaySchedule | undefined {
  if (!config || !config.dias) return undefined;
  const dayOfWeek = getDayOfWeekFromDate(dateStr);
  return config.dias.find((d) => d.dia === dayOfWeek);
}

export interface ValidateFichaParams {
  salonId: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  config?: SalonScheduleConfig;
  existingFichas: FichaAtencion[];
  ignoreFichaId?: string; // Para edición
}

export interface ValidationResult {
  valid: boolean;
  duracion: number;
  error?: string;
}

/**
 * Validador estricto para la creación o modificación de una Ficha de Atención:
 * 1. Fecha válida
 * 2. Hora inicio anterior a hora fin
 * 3. Día laborable activo
 * 4. Dentro de apertura y salida fija
 * 5. Respetar almuerzo si permitirAtencionAlmuerzo === false
 * 6. Sin solapamientos con otras fichas del salón
 */
export function validateFicha({
  salonId,
  fecha,
  horaInicio,
  horaFin,
  config,
  existingFichas,
  ignoreFichaId,
}: ValidateFichaParams): ValidationResult {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { valid: false, duracion: 0, error: 'Por favor selecciona una fecha válida en formato AAAA-MM-DD.' };
  }

  if (!horaInicio || !horaFin) {
    return { valid: false, duracion: 0, error: 'Por favor define la hora de inicio y hora de finalización.' };
  }

  const startMins = timeToMinutes(horaInicio);
  const endMins = timeToMinutes(horaFin);

  if (startMins >= endMins) {
    return {
      valid: false,
      duracion: 0,
      error: 'La hora de inicio debe ser anterior a la hora de finalización.',
    };
  }

  const duracion = endMins - startMins;

  // Si existe configuración de horario del salón
  if (config) {
    const daySchedule = getDayScheduleForDate(fecha, config);

    if (daySchedule) {
      if (!daySchedule.activo) {
        return {
          valid: false,
          duracion,
          error: `El salón tiene configurado el día ${daySchedule.nombreDia} como día no laborable (cerrado).`,
        };
      }

      const openMins = timeToMinutes(daySchedule.horaInicio || '08:00');
      const closeMins = timeToMinutes(daySchedule.horaFin || '18:00');

      if (startMins < openMins) {
        return {
          valid: false,
          duracion,
          error: `La hora de inicio (${horaInicio}) es anterior a la hora de apertura del salón (${daySchedule.horaInicio}).`,
        };
      }

      if (endMins > closeMins) {
        return {
          valid: false,
          duracion,
          error: `La ficha excede la hora de salida obligatoria del salón (${daySchedule.horaFin}). Por favor ajusta la hora de finalización.`,
        };
      }

      // Validación de Almuerzo y Descansos (Requisito 9)
      const lunchAllowed =
        daySchedule.permitirAtencionAlmuerzo ?? config.permitirAtencionAlmuerzo ?? false;

      if (!lunchAllowed) {
        // Almuerzo configurado en descansos o en horarioAlmuerzo
        const lunchBreaks: BreakPeriod[] = [
          ...(daySchedule.descansos || []),
          ...(daySchedule.horarioAlmuerzo
            ? [{ id: 'almuerzo-default', ...daySchedule.horarioAlmuerzo }]
            : [{ id: 'almuerzo-std', horaInicio: '12:00', horaFin: '13:00' }]),
        ];

        for (const brk of lunchBreaks) {
          const brkStart = timeToMinutes(brk.horaInicio);
          const brkEnd = timeToMinutes(brk.horaFin);
          if (brkStart < brkEnd && isTimeOverlapping(startMins, endMins, brkStart, brkEnd)) {
            return {
              valid: false,
              duracion,
              error: `La ficha se cruza con el descanso de almuerzo (${brk.horaInicio} a ${brk.horaFin}). Para crear fichas en este horario, activa la opción 'Permitir atención durante el horario de almuerzo' en la configuración de la agenda.`,
            };
          }
        }
      }
    }
  }

  // Validación de cruce con otras fichas existentes del salón en la misma fecha (Requisito 11)
  const sameDayFichas = existingFichas.filter(
    (f) => f.salon_id === salonId && f.fecha === fecha && f.id !== ignoreFichaId
  );

  for (const other of sameDayFichas) {
    const oStart = timeToMinutes(other.hora_inicio);
    const oEnd = timeToMinutes(other.hora_fin);

    if (isTimeOverlapping(startMins, endMins, oStart, oEnd)) {
      return {
        valid: false,
        duracion,
        error: `El horario colisiona con otra ficha existente (${other.hora_inicio} a ${other.hora_fin}, estado: ${other.estado}). No se permiten fichas superpuestas.`,
      };
    }
  }

  return { valid: true, duracion };
}

/**
 * Consulta y devuelve únicamente las fichas disponibles que tengan tiempo suficiente para atender un servicio (Requisito 4)
 */
export function getCompatibleFichasForService(
  fichas: FichaAtencion[],
  salonId: string,
  fecha: string,
  serviceDurationMinutes: number
): { compatible: FichaAtencion[]; incompatible: FichaAtencion[] } {
  const sameDayFichas = fichas.filter(
    (f) => f.salon_id === salonId && f.fecha === fecha && f.estado === 'DISPONIBLE'
  );

  // Ordenadas cronológicamente
  const sorted = [...sameDayFichas].sort(
    (a, b) => timeToMinutes(a.hora_inicio) - timeToMinutes(b.hora_inicio)
  );

  const compatible = sorted.filter((f) => f.duracion >= serviceDurationMinutes);
  const incompatible = sorted.filter((f) => f.duracion < serviceDurationMinutes);

  return { compatible, incompatible };
}
