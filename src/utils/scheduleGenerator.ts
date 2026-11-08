import { DaySchedule, SlotInterval, BreakPeriod, SalonScheduleConfig, DayOfWeek } from '../types';

/**
 * Convierte un formato de hora "HH:mm" a minutos desde las 00:00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}

/**
 * Convierte minutos desde las 00:00 a un formato "HH:mm"
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(normalized / 60) % 24;
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Verifica si un rango de tiempo [startA, endA] se superpone con [startB, endB]
 * Se considera superposición si existe intersección real (max(start) < min(end))
 */
export function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

export interface AvailableSlot {
  start: string; // "08:00"
  end: string;   // "08:30"
  label: string; // "08:00 - 08:30"
}

/**
 * MOTOR DE CÁLCULO DINÁMICO DE HORARIOS (Etapa 5):
 * Calcula todos los turnos disponibles para un día específico considerando:
 * - Hora de apertura
 * - Hora de cierre
 * - Descansos / Pausas
 * - Duración exacta del servicio (30 min, 45 min, 60 min, 120 min o personalizada ej. 135 min)
 * - Intervalo de generación (15 min, 30 min, 60 min o según la duración exacta del servicio)
 * 
 * Regla: Hora Inicio + Duración debe ser <= Hora de Cierre
 * Y el rango completo [Inicio, Inicio + Duración] no debe intersectar con ninguna pausa.
 */
export function calculateAvailableSlots(
  daySchedule: DaySchedule,
  durationMinutes: number,
  intervalMinutes: SlotInterval = 30
): AvailableSlot[] {
  // Si el día está configurado como descanso (inactivo), no hay horarios
  if (!daySchedule.activo) {
    return [];
  }

  const openMins = timeToMinutes(daySchedule.horaInicio);
  const closeMins = timeToMinutes(daySchedule.horaFin);

  // Validación básica: la apertura debe ser anterior al cierre
  if (openMins >= closeMins || durationMinutes <= 0) {
    return [];
  }

  // Paso de avance en minutos
  const stepMinutes = intervalMinutes === 'servicio' ? durationMinutes : intervalMinutes;
  if (stepMinutes <= 0) return [];

  // Convertir descansos a minutos
  const breaksInMinutes = (daySchedule.descansos || []).map((b) => ({
    start: timeToMinutes(b.horaInicio),
    end: timeToMinutes(b.horaFin),
  })).filter((b) => b.start < b.end);

  const availableSlots: AvailableSlot[] = [];

  // Recorrer desde la apertura hasta el cierre con el paso del intervalo configurado
  for (
    let slotStart = openMins;
    slotStart + durationMinutes <= closeMins;
    slotStart += stepMinutes
  ) {
    const slotEnd = slotStart + durationMinutes;

    // Verificar si el servicio choca con algún descanso
    let overlapsBreak = false;
    for (const b of breaksInMinutes) {
      if (isOverlapping(slotStart, slotEnd, b.start, b.end)) {
        overlapsBreak = true;
        break;
      }
    }

    if (!overlapsBreak) {
      const startStr = minutesToTime(slotStart);
      const endStr = minutesToTime(slotEnd);
      availableSlots.push({
        start: startStr,
        end: endStr,
        label: `${startStr} - ${endStr}`,
      });
    }
  }

  return availableSlots;
}

/**
 * Genera la configuración predeterminada de horarios para un salón.
 * Lunes a Viernes: 08:00 - 18:00 con descanso 12:00 - 14:00
 * Sábado: 08:30 - 14:00 sin descanso
 * Domingo: Descanso (Inactivo)
 */
export function createDefaultSalonSchedule(salonId: string): SalonScheduleConfig {
  const days: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const dayNames: Record<DayOfWeek, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const dias: DaySchedule[] = days.map((dia) => {
    if (dia === 'domingo') {
      return {
        dia,
        nombreDia: dayNames[dia],
        activo: false,
        horaInicio: '09:00',
        horaFin: '13:00',
        descansos: [],
      };
    }

    if (dia === 'sabado') {
      return {
        dia,
        nombreDia: dayNames[dia],
        activo: true,
        horaInicio: '08:30',
        horaFin: '15:00',
        descansos: [],
      };
    }

    return {
      dia,
      nombreDia: dayNames[dia],
      activo: true,
      horaInicio: '08:00',
      horaFin: '18:00',
      descansos: [
        {
          id: `brk-${dia}-1`,
          horaInicio: '12:00',
          horaFin: '14:00',
        },
      ],
    };
  });

  return {
    id: `sched-${salonId}`,
    salonId,
    intervaloMinutos: 30,
    dias,
    fechaActualizacion: new Date().toISOString(),
  };
}
