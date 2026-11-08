import { TipoPlan, SuscripcionEstado } from '../types';

/**
 * Obtiene la fecha actual en la zona horaria oficial de Bolivia (America/La_Paz - UTC-4)
 */
export function getBoliviaDate(baseDate: Date = new Date()): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(baseDate);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0';
    return new Date(
      parseInt(getPart('year'), 10),
      parseInt(getPart('month'), 10) - 1,
      parseInt(getPart('day'), 10),
      parseInt(getPart('hour'), 10),
      parseInt(getPart('minute'), 10),
      parseInt(getPart('second'), 10)
    );
  } catch {
    return baseDate;
  }
}

/**
 * Formatea a string "YYYY-MM-DD" en la zona horaria de Bolivia
 */
export function getBoliviaDateString(baseDate: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(baseDate);
  } catch {
    const d = baseDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

/**
 * Calcula los días restantes exactos entre la fecha actual en Bolivia y la fecha de vencimiento.
 * (Requisito 13: Cálculo según la fecha actual y la zona horaria correspondiente).
 */
export function calculateRemainingDays(fechaVencimiento: string): number {
  if (!fechaVencimiento) return 0;
  
  const todayBolivia = getBoliviaDate(new Date());
  const todayZero = new Date(
    todayBolivia.getFullYear(),
    todayBolivia.getMonth(),
    todayBolivia.getDate()
  );

  const expDate = new Date(fechaVencimiento);
  const expBolivia = getBoliviaDate(expDate);
  const expZero = new Date(
    expBolivia.getFullYear(),
    expBolivia.getMonth(),
    expBolivia.getDate()
  );

  const diffMs = expZero.getTime() - todayZero.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Genera alertas de vencimiento según los días restantes (Requisito 19):
 * 7 días antes, 3 días antes, 2 días antes, 1 día antes, el día de vencimiento o vencida.
 */
export function getExpirationAlert(daysRemaining: number): {
  type: 'danger' | 'warning' | 'info' | 'expired';
  message: string;
} | null {
  if (daysRemaining < 0) {
    return {
      type: 'expired',
      message: 'Tu suscripción ha vencido y el salón se encuentra suspendido. Realiza tu pago para reactivarlo.',
    };
  }
  if (daysRemaining === 0) {
    return {
      type: 'danger',
      message: '¡Tu suscripción vence hoy! Realiza tu pago hoy mismo para evitar la suspensión del salón.',
    };
  }
  if (daysRemaining === 1) {
    return {
      type: 'danger',
      message: 'Tu suscripción vence mañana. Recuerda realizar el pago para mantener la disponibilidad de tu salón.',
    };
  }
  if (daysRemaining === 2) {
    return {
      type: 'warning',
      message: 'Tu suscripción vence en 2 días.',
    };
  }
  if (daysRemaining === 3) {
    return {
      type: 'warning',
      message: 'Tu suscripción vence en 3 días.',
    };
  }
  if (daysRemaining <= 7) {
    return {
      type: 'info',
      message: `Tu suscripción vence en ${daysRemaining} días.`,
    };
  }
  return null;
}

/**
 * CÁLCULO SEGURO DE FECHA DE VENCIMIENTO (Requisito 13):
 * - MENSUAL: +1 mes de calendario exacto
 *   Maneja fin de mes sin desbordamiento (ej. 31 de enero -> 28/29 de febrero, no marzo; 31 de agosto -> 30 de septiembre).
 * - ANUAL: +12 meses de calendario exacto
 *   Maneja años bisiestos (ej. 29 de febrero -> 28 de febrero del año siguiente).
 */
export function calculateExpirationDate(startDate: Date, plan: TipoPlan): Date {
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const seconds = startDate.getSeconds();

  if (plan === 'MENSUAL') {
    let targetYear = year;
    let targetMonth = month + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    // Días reales que tiene el mes de destino (el día 0 del mes siguiente da el último día del mes)
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const targetDay = Math.min(day, daysInTargetMonth);

    return new Date(targetYear, targetMonth, targetDay, hours, minutes, seconds);
  } else {
    // ANUAL: +1 año calendario
    const targetYear = year + 1;
    const daysInTargetMonth = new Date(targetYear, month + 1, 0).getDate();
    const targetDay = Math.min(day, daysInTargetMonth);

    return new Date(targetYear, month, targetDay, hours, minutes, seconds);
  }
}

/**
 * Formatea una fecha ISO a DD/MM/AAAA.
 */
export function formatISODateToDDMMYYYY(isoStr: string): string {
  if (!isoStr) return '--/--/----';
  try {
    const d = new Date(isoStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoStr;
  }
}
