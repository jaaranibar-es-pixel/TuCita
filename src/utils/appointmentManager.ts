import {
  Cita,
  DayOfWeek,
  Salon,
  ServiceItem,
  SalonScheduleConfig,
  DaySchedule
} from '../types';
import {
  calculateAvailableSlots,
  timeToMinutes,
  minutesToTime,
  isOverlapping,
  AvailableSlot
} from './scheduleGenerator';
import { getBoliviaDate } from './subscriptionManager';

export { timeToMinutes, minutesToTime };

export interface RollingDayInfo {
  dateStr: string; // "YYYY-MM-DD"
  displayDate: string; // "DD/MM/YYYY"
  dayName: string; // "Lunes", "Martes", etc.
  dayOfWeek: DayOfWeek;
  isToday: boolean;
  dayNumber: number; // 29, 30, 1...
  monthName: string; // "Septiembre", "Octubre", etc.
}

const DAY_NAMES_MAP: Record<number, { dayName: string; dayOfWeek: DayOfWeek }> = {
  0: { dayName: 'Domingo', dayOfWeek: 'domingo' },
  1: { dayName: 'Lunes', dayOfWeek: 'lunes' },
  2: { dayName: 'Martes', dayOfWeek: 'martes' },
  3: { dayName: 'Miércoles', dayOfWeek: 'miercoles' },
  4: { dayName: 'Jueves', dayOfWeek: 'jueves' },
  5: { dayName: 'Viernes', dayOfWeek: 'viernes' },
  6: { dayName: 'Sábado', dayOfWeek: 'sabado' },
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Formatea un objeto Date a string "YYYY-MM-DD" en tiempo local
 */
export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea un string "YYYY-MM-DD" a "DD/MM/YYYY"
 */
export function formatYYYYMMDDtoDDMMYYYY(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr || '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * REGLA FUNDAMENTAL DE LA ETAPA 6:
 * Calcula dinámicamente la ventana móvil de exactamente 7 días contando desde la fecha actual.
 * No utiliza una lista estática; evoluciona dinámicamente según el día de ejecución.
 */
export function getRolling7Days(baseDate: Date = getBoliviaDate()): RollingDayInfo[] {
  const days: RollingDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
    const dayOfWeekIndex = d.getDay();
    const info = DAY_NAMES_MAP[dayOfWeekIndex];
    const dateStr = formatDateToYYYYMMDD(d);

    days.push({
      dateStr,
      displayDate: formatYYYYMMDDtoDDMMYYYY(dateStr),
      dayName: info.dayName,
      dayOfWeek: info.dayOfWeek,
      isToday: i === 0,
      dayNumber: d.getDate(),
      monthName: MONTH_NAMES[d.getMonth()],
    });
  }

  return days;
}

/**
 * Verifica si una fecha seleccionada está estrictamente dentro de la ventana móvil de los próximos 7 días
 */
export function isDateWithinRolling7Days(dateStr: string, baseDate: Date = getBoliviaDate()): boolean {
  const rollingDays = getRolling7Days(baseDate);
  return rollingDays.some((d) => d.dateStr === dateStr);
}

/**
 * Obtiene el día de la semana ('lunes', 'martes', etc.) a partir de "YYYY-MM-DD"
 */
export function getDayOfWeekFromDateString(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const dateObj = new Date(y, m - 1, d);
  return DAY_NAMES_MAP[dateObj.getDay()].dayOfWeek;
}

/**
 * Comprueba si un turno [slotStart, slotEnd] se superpone con alguna cita existente
 * (en estado 'CONFIRMADA' o 'PENDIENTE') para el mismo salón y fecha.
 */
export function isSlotCollidingWithAppointments(
  slotStartMins: number,
  slotEndMins: number,
  salonId: string,
  dateStr: string,
  appointments: Cita[]
): boolean {
  const relevantAppointments = appointments.filter(
    (c) =>
      c.salon_id === salonId &&
      c.fecha === dateStr &&
      (c.estado === 'CONFIRMADA' || c.estado === 'PENDIENTE')
  );

  for (const cita of relevantAppointments) {
    const citaStart = timeToMinutes(cita.hora_inicio);
    const citaEnd = timeToMinutes(cita.hora_fin);

    if (isOverlapping(slotStartMins, slotEndMins, citaStart, citaEnd)) {
      return true; // Hay colisión
    }
  }

  return false;
}

/**
 * MOTOR DE HORARIOS PARA RESERVA DE CLIENTES (Etapa 6):
 * Calcula todos los turnos disponibles para una fecha específica descartando:
 * 1. Días inactivos (descanso del salón)
 * 2. Horarios fuera de la jornada
 * 3. Pausas y descansos del personal
 * 4. Citas existentes CONFIRMADAS
 * 5. Citas existentes PENDIENTES (bloqueo preventivo anti doble reserva)
 */
export function getAvailableSlotsForBooking(
  daySchedule: DaySchedule | undefined,
  durationMinutes: number,
  intervalMinutes: SalonScheduleConfig['intervaloMinutos'],
  salonId: string,
  dateStr: string,
  existingAppointments: Cita[]
): AvailableSlot[] {
  if (!daySchedule || !daySchedule.activo) {
    return [];
  }

  // 1. Obtener todos los turnos teóricamente posibles según horario y descansos
  const baseSlots = calculateAvailableSlots(daySchedule, durationMinutes, intervalMinutes);

  // 2. Filtrar descartando los turnos que choquen con citas confirmadas o pendientes
  const freeSlots = baseSlots.filter((slot) => {
    const startMins = timeToMinutes(slot.start);
    const endMins = timeToMinutes(slot.end);

    return !isSlotCollidingWithAppointments(
      startMins,
      endMins,
      salonId,
      dateStr,
      existingAppointments
    );
  });

  return freeSlots;
}

/**
 * Genera el siguiente código único de cita secuencial
 * Ejemplo: "TC-2026-00001", "TC-2026-00002"
 */
export function generateNextCitaCode(existingAppointments: Cita[]): string {
  const currentYear = new Date().getFullYear();
  let maxNumber = 0;

  existingAppointments.forEach((cita) => {
    if (cita.codigo_cita && cita.codigo_cita.startsWith(`TC-${currentYear}-`)) {
      const parts = cita.codigo_cita.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  const nextNumber = maxNumber + 1;
  const padded = nextNumber.toString().padStart(5, '0');
  return `TC-${currentYear}-${padded}`;
}

export interface BookingValidationResult {
  valid: boolean;
  errorMessage?: string;
}

/**
 * VALIDACIÓN ESTRICTA ANTES DE GUARDAR (Requisitos 19 y 20):
 * Verifica las 9 condiciones de seguridad para evitar dobles reservas y solicitudes inválidas.
 */
export function validateBookingPreSave(params: {
  salon: Salon;
  service: ServiceItem;
  dateStr: string;
  horaInicio: string;
  horaFin: string;
  scheduleConfig: SalonScheduleConfig;
  existingAppointments: Cita[];
  clienteNombre: string;
  clienteTelefono: string;
  clienteWhatsapp: string;
}): BookingValidationResult {
  const {
    salon,
    service,
    dateStr,
    horaInicio,
    horaFin,
    scheduleConfig,
    existingAppointments,
    clienteNombre,
    clienteTelefono,
    clienteWhatsapp,
  } = params;

  // 1. Salón activo
  if (salon.estado !== 'activo' || !salon.isAvailable) {
    return {
      valid: false,
      errorMessage: 'El salón seleccionado no se encuentra disponible para recibir reservas en este momento.',
    };
  }

  // 2. Servicio activo
  if (service.status !== 'activo') {
    return {
      valid: false,
      errorMessage: 'El servicio seleccionado se encuentra pausado o no está disponible.',
    };
  }

  // 3. Fecha dentro de la ventana móvil de 7 días
  if (!isDateWithinRolling7Days(dateStr)) {
    return {
      valid: false,
      errorMessage: 'La fecha seleccionada se encuentra fuera del rango permitido de los próximos 7 días.',
    };
  }

  // 4. Salón atiende ese día de la semana
  const dayOfWeek = getDayOfWeekFromDateString(dateStr);
  const daySchedule = scheduleConfig.dias.find((d) => d.dia === dayOfWeek);

  if (!daySchedule || !daySchedule.activo) {
    return {
      valid: false,
      errorMessage: `El salón no atiende en el día ${daySchedule?.nombreDia || 'seleccionado'} (Día de descanso).`,
    };
  }

  const slotStartMins = timeToMinutes(horaInicio);
  const slotEndMins = timeToMinutes(horaFin);
  const openMins = timeToMinutes(daySchedule.horaInicio);
  const closeMins = timeToMinutes(daySchedule.horaFin);

  // 5. Horario dentro del horario laboral
  if (slotStartMins < openMins) {
    return {
      valid: false,
      errorMessage: `La hora seleccionada (${horaInicio}) es anterior a la apertura del salón (${daySchedule.horaInicio}).`,
    };
  }

  // 6. No corresponder a un descanso
  if (daySchedule.descansos && daySchedule.descansos.length > 0) {
    for (const b of daySchedule.descansos) {
      const bStart = timeToMinutes(b.horaInicio);
      const bEnd = timeToMinutes(b.horaFin);
      if (isOverlapping(slotStartMins, slotEndMins, bStart, bEnd)) {
        return {
          valid: false,
          errorMessage: `El horario seleccionado coincide con el período de pausa/descanso del salón (${b.horaInicio} - ${b.horaFin}).`,
        };
      }
    }
  }

  // 7. Servicio finaliza antes del cierre
  if (slotEndMins > closeMins) {
    return {
      valid: false,
      errorMessage: `La duración del servicio (${service.durationMinutes} min) excede la hora de cierre del salón (${daySchedule.horaFin}).`,
    };
  }

  // 8 & 9. Comprobar que no exista otra cita confirmada o pendiente cruzada (anti doble reserva)
  if (
    isSlotCollidingWithAppointments(
      slotStartMins,
      slotEndMins,
      salon.id,
      dateStr,
      existingAppointments
    )
  ) {
    return {
      valid: false,
      errorMessage: 'Este horario acaba de ser reservado o solicitado por otro cliente. Por favor selecciona otro turno.',
    };
  }

  // Validación de datos del cliente
  if (!clienteNombre.trim() || clienteNombre.trim().length < 3) {
    return {
      valid: false,
      errorMessage: 'Por favor ingresa tu nombre completo.',
    };
  }

  if (!clienteTelefono.trim() || clienteTelefono.trim().length < 7) {
    return {
      valid: false,
      errorMessage: 'Por favor ingresa un número de teléfono de contacto válido.',
    };
  }

  if (!clienteWhatsapp.trim() || clienteWhatsapp.trim().length < 7) {
    return {
      valid: false,
      errorMessage: 'Por favor ingresa un número de WhatsApp para notificaciones.',
    };
  }

  return { valid: true };
}

/**
 * REGLAS DE ESTADOS:
 * PENDIENTE -> CONFIRMADA | RECHAZADA | PROPUESTA_ENVIADA | CADUCADA
 * PROPUESTA_ENVIADA -> CONFIRMADA (cliente acepta) | CANCELADA (cliente rechaza) | CADUCADA
 * CONFIRMADA -> CANCELADA
 * RECHAZADA, CANCELADA, CADUCADA -> estados terminales
 */
export function isValidStateTransition(from: Cita['estado'], to: Cita['estado']): boolean {
  if (from === 'PENDIENTE') {
    return to === 'CONFIRMADA' || to === 'RECHAZADA' || to === 'PROPUESTA_ENVIADA' || to === 'CADUCADA';
  }
  if (from === 'PROPUESTA_ENVIADA') {
    return to === 'CONFIRMADA' || to === 'CANCELADA' || to === 'CADUCADA' || to === 'RECHAZADA';
  }
  if (from === 'CONFIRMADA') {
    return to === 'CANCELADA';
  }
  return false;
}

/**
 * Comprueba si una cita ha excedido su plazo de 24 horas y debe caducar
 */
export function isAppointmentExpired(cita: Cita, now: Date = new Date()): boolean {
  if (cita.estado !== 'PENDIENTE' && cita.estado !== 'PROPUESTA_ENVIADA') {
    return false;
  }
  if (cita.fecha_expiracion) {
    return new Date(cita.fecha_expiracion).getTime() <= now.getTime();
  }
  const baseTime = cita.propuesta?.fecha_propuesta || cita.fecha_solicitud;
  const expiry = new Date(baseTime).getTime() + 24 * 60 * 60 * 1000;
  return expiry <= now.getTime();
}

/**
 * Calcula el tiempo restante antes de caducar en formato legible (ej: "18h 32m" o "Vencida")
 */
export function getRemainingExpirationTime(cita: Cita, now: Date = new Date()): {
  expired: boolean;
  text: string;
  hours: number;
  minutes: number;
} {
  const baseTime = cita?.propuesta?.fecha_propuesta || cita?.fecha_solicitud;
  let expiry = cita?.fecha_expiracion
    ? new Date(cita.fecha_expiracion).getTime()
    : baseTime
    ? new Date(baseTime).getTime() + 24 * 60 * 60 * 1000
    : NaN;

  if (isNaN(expiry)) {
    return { expired: false, text: 'En revisión (24h)', hours: 24, minutes: 0 };
  }

  const diffMs = expiry - now.getTime();
  if (diffMs <= 0) {
    return { expired: true, text: 'Plazo de 24h expirado', hours: 0, minutes: 0 };
  }

  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return {
    expired: false,
    text: `${hours}h ${minutes}m restantes`,
    hours,
    minutes,
  };
}

/**
 * Calcula el tiempo restante a partir de una fecha ISO de expiración
 */
export function getTimeRemaining(expirationIsoStr: string, now: Date = new Date()): string {
  if (!expirationIsoStr) return '';
  const diff = new Date(expirationIsoStr).getTime() - now.getTime();
  if (diff <= 0) return 'Expirado';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * PREVENCIÓN DE DOBLE CONFIRMACIÓN (Requisito 12):
 * Verifica si otra cita ya confirmada choca con el horario de la cita a confirmar.
 */
export function canConfirmAppointment(
  citaToConfirm: Cita,
  appointments: Cita[]
): { canConfirm: boolean; reason?: string } {
  if (citaToConfirm.estado !== 'PENDIENTE') {
    return {
      canConfirm: false,
      reason: `No se puede confirmar una cita que se encuentra en estado ${citaToConfirm.estado}.`,
    };
  }

  const slotStartMins = timeToMinutes(citaToConfirm.hora_inicio);
  const slotEndMins = timeToMinutes(citaToConfirm.hora_fin);

  // Buscar otras citas ya confirmadas para el mismo salón y fecha
  const confirmedOverlap = appointments.find(
    (c) =>
      c.id !== citaToConfirm.id &&
      c.salon_id === citaToConfirm.salon_id &&
      c.fecha === citaToConfirm.fecha &&
      c.estado === 'CONFIRMADA' &&
      isOverlapping(slotStartMins, slotEndMins, timeToMinutes(c.hora_inicio), timeToMinutes(c.hora_fin))
  );

  if (confirmedOverlap) {
    return {
      canConfirm: false,
      reason: `Este horario ya no está disponible. Coincide con la cita confirmada ${confirmedOverlap.codigo_cita} (${confirmedOverlap.hora_inicio} - ${confirmedOverlap.hora_fin}).`,
    };
  }

  return { canConfirm: true };
}
