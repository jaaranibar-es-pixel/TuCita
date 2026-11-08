import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Filter,
  Eye,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sparkles,
  Check,
  X,
  Zap,
  RotateCcw,
  ListPlus,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  Salon,
  ServiceItem,
  SalonScheduleConfig,
  FichaAtencion,
  FichaEstado,
  Cita,
  DayOfWeek,
  DaySchedule
} from '../types';
import {
  timeToMinutes,
  minutesToTime,
  calculateDuration,
  isTimeOverlapping,
  getDayOfWeekFromDate,
  getDayScheduleForDate,
  validateFicha
} from '../utils/scheduleValidator';
import { formatDateToYYYYMMDD, formatYYYYMMDDtoDDMMYYYY } from '../utils/appointmentManager';

interface SalonScheduleManagerProps {
  salon: Salon;
  services: ServiceItem[];
  scheduleConfig: SalonScheduleConfig;
  fichas: FichaAtencion[];
  appointments: Cita[];
  onSaveSchedule: (config: SalonScheduleConfig) => void;
  onCreateFicha: (fichaData: Omit<FichaAtencion, 'id' | 'fecha_creacion'>) => { success: boolean; error?: string };
  onCreateMultipleFichas?: (
    fichasList: Array<Omit<FichaAtencion, 'id' | 'fecha_creacion'>>
  ) => { success: boolean; createdCount: number; errors?: string[] };
  onUpdateFicha: (ficha: FichaAtencion) => { success: boolean; error?: string };
  onToggleBlockFicha: (fichaId: string) => void;
  onDeleteFicha: (fichaId: string) => { success: boolean; error?: string };
  onNavigateToCita?: (citaId: string) => void;
}

export const SalonScheduleManager: React.FC<SalonScheduleManagerProps> = ({
  salon,
  services,
  scheduleConfig,
  fichas,
  appointments,
  onSaveSchedule,
  onCreateFicha,
  onCreateMultipleFichas,
  onUpdateFicha,
  onToggleBlockFicha,
  onDeleteFicha,
  onNavigateToCita,
}) => {
  // Fecha seleccionada en la agenda (por defecto hoy)
  const todayStr = useMemo(() => formatDateToYYYYMMDD(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filtros de visualización
  const [statusFilter, setStatusFilter] = useState<'TODAS' | FichaEstado>('TODAS');
  const [durationFilter, setDurationFilter] = useState<'TODAS' | '30' | '45-60' | '90+'>('TODAS');

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalFicha, setEditModalFicha] = useState<FichaAtencion | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState<string | null>(null);
  const [fichaToDelete, setFichaToDelete] = useState<FichaAtencion | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados para MODO RÁPIDO y CREACIÓN DE FICHAS (Requisitos 1 al 10)
  const [createMode, setCreateMode] = useState<'rapido' | 'manual'>('rapido');
  const [quickFecha, setQuickFecha] = useState<string>(selectedDate);
  const [quickHoraInicio, setQuickHoraInicio] = useState<string>('09:00');
  const [quickDuracionPreset, setQuickDuracionPreset] = useState<
    '15' | '30' | '45' | '60' | '90' | '120' | '180' | 'custom'
  >('30');
  const [quickCustomHoras, setQuickCustomHoras] = useState<number>(1);
  const [quickCustomMinutos, setQuickCustomMinutos] = useState<number>(15);
  const [quickCantidad, setQuickCantidad] = useState<number>(3);
  const [quickEstado, setQuickEstado] = useState<FichaEstado>('DISPONIBLE');
  const [quickObservacion, setQuickObservacion] = useState<string>('');
  const [previewFichas, setPreviewFichas] = useState<Array<{
    id: string;
    hora_inicio: string;
    hora_fin: string;
    duracion: number;
    estado: FichaEstado;
    observacion?: string;
  }>>([]);

  // Form State para MODO MANUAL / EDICIÓN
  const [formFecha, setFormFecha] = useState(selectedDate);
  const [formHoraInicio, setFormHoraInicio] = useState('09:00');
  const [formHoraFin, setFormHoraFin] = useState('10:00');
  const [formEstado, setFormEstado] = useState<FichaEstado>('DISPONIBLE');
  const [formObservacion, setFormObservacion] = useState('');
  const [formError, setFormError] = useState('');

  // Form State para Configuración General de Horario
  const [configDays, setConfigDays] = useState<DaySchedule[]>(scheduleConfig.dias);
  const [configLunchAllowed, setConfigLunchAllowed] = useState<boolean>(
    scheduleConfig.permitirAtencionAlmuerzo ?? false
  );
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Toasts / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Requisito 12: Seguridad y aislamiento por salón
  const salonFichas = useMemo(() => {
    return fichas.filter((f) => f.salon_id === salon.id);
  }, [fichas, salon.id]);

  // Fichas del día seleccionado
  const dayFichas = useMemo(() => {
    return salonFichas
      .filter((f) => f.fecha === selectedDate)
      .sort((a, b) => timeToMinutes(a.hora_inicio) - timeToMinutes(b.hora_inicio));
  }, [salonFichas, selectedDate]);

  // Contadores para el día seleccionado
  const counts = useMemo(() => {
    const total = dayFichas.length;
    const disponibles = dayFichas.filter((f) => f.estado === 'DISPONIBLE').length;
    const pendientes = dayFichas.filter((f) => f.estado === 'PENDIENTE').length;
    const confirmadas = dayFichas.filter((f) => f.estado === 'CONFIRMADA').length;
    const bloqueadas = dayFichas.filter((f) => f.estado === 'BLOQUEADA').length;
    return { total, disponibles, pendientes, confirmadas, bloqueadas };
  }, [dayFichas]);

  // Fichas filtradas para mostrar
  const filteredFichas = useMemo(() => {
    return dayFichas.filter((f) => {
      if (statusFilter !== 'TODAS' && f.estado !== statusFilter) return false;
      if (durationFilter === '30' && f.duracion !== 30) return false;
      if (durationFilter === '45-60' && (f.duracion < 45 || f.duracion > 60)) return false;
      if (durationFilter === '90+' && f.duracion < 90) return false;
      return true;
    });
  }, [dayFichas, statusFilter, durationFilter]);

  // Información del horario laboral para el día seleccionado
  const currentDaySchedule = useMemo(() => {
    return getDayScheduleForDate(selectedDate, scheduleConfig);
  }, [selectedDate, scheduleConfig]);

  // Navegación de fechas
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(formatDateToYYYYMMDD(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(formatDateToYYYYMMDD(next));
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  // Obtener duración en minutos según el preset o personalizado (Requisito 3)
  const getEffectiveQuickDuration = (): number => {
    switch (quickDuracionPreset) {
      case '15': return 15;
      case '30': return 30;
      case '45': return 45;
      case '60': return 60;
      case '90': return 90;
      case '120': return 120;
      case '180': return 180;
      case 'custom': {
        const total = (Number(quickCustomHoras) || 0) * 60 + (Number(quickCustomMinutos) || 0);
        return total > 0 ? total : 30;
      }
      default: return 30;
    }
  };

  // Función de cálculo y generación consecutiva estricta (Requisitos 2, 3, 4, 5)
  const generateConsecutiveSlotsList = (
    baseStart: string,
    preset: '15' | '30' | '45' | '60' | '90' | '120' | '180' | 'custom',
    customH: number,
    customM: number,
    qty: number,
    estado: FichaEstado,
    observacionText?: string
  ) => {
    let duracion = 30;
    switch (preset) {
      case '15': duracion = 15; break;
      case '30': duracion = 30; break;
      case '45': duracion = 45; break;
      case '60': duracion = 60; break;
      case '90': duracion = 90; break;
      case '120': duracion = 120; break;
      case '180': duracion = 180; break;
      case 'custom': {
        const total = (Number(customH) || 0) * 60 + (Number(customM) || 0);
        duracion = total > 0 ? total : 30;
        break;
      }
      default: duracion = 30;
    }

    const safeQty = Math.max(1, Math.min(30, Math.floor(qty) || 1));
    const startMins = timeToMinutes(baseStart || '09:00');

    const list: Array<{
      id: string;
      hora_inicio: string;
      hora_fin: string;
      duracion: number;
      estado: FichaEstado;
      observacion?: string;
    }> = [];

    for (let i = 0; i < safeQty; i++) {
      const slotStart = startMins + i * duracion;
      const slotEnd = slotStart + duracion;
      list.push({
        id: `prev-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        hora_inicio: minutesToTime(slotStart),
        hora_fin: minutesToTime(slotEnd),
        duracion,
        estado,
        observacion: observacionText?.trim() || undefined,
      });
    }
    return list;
  };

  // Reaccionar al cambio de duración rápida (Requisito 3)
  const handleSelectDurationPreset = (
    presetId: '15' | '30' | '45' | '60' | '90' | '120' | '180' | 'custom' | 'manual'
  ) => {
    if (presetId === 'manual') {
      setCreateMode('manual');
      setFormError('');
      return;
    }
    setQuickDuracionPreset(presetId);
    setFormError('');
    const updatedList = generateConsecutiveSlotsList(
      quickHoraInicio,
      presetId,
      quickCustomHoras,
      quickCustomMinutos,
      quickCantidad,
      quickEstado,
      quickObservacion
    );
    setPreviewFichas(updatedList);
  };

  // Reaccionar al cambio de hora inicial (Requisito 1)
  const handleChangeQuickHoraInicio = (newTime: string) => {
    setQuickHoraInicio(newTime);
    setFormError('');
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
      const updatedList = generateConsecutiveSlotsList(
        newTime,
        quickDuracionPreset,
        quickCustomHoras,
        quickCustomMinutos,
        quickCantidad,
        quickEstado,
        quickObservacion
      );
      setPreviewFichas(updatedList);
    }
  };

  // Reaccionar al cambio de cantidad de fichas (Requisito 4)
  const handleChangeQuickCantidad = (newQty: number) => {
    const safeQty = Math.max(1, Math.min(30, Math.floor(newQty) || 1));
    setQuickCantidad(safeQty);
    setFormError('');
    const updatedList = generateConsecutiveSlotsList(
      quickHoraInicio,
      quickDuracionPreset,
      quickCustomHoras,
      quickCustomMinutos,
      safeQty,
      quickEstado,
      quickObservacion
    );
    setPreviewFichas(updatedList);
  };

  // Reaccionar a cambios en duración personalizada
  const handleChangeCustomHours = (h: number) => {
    const safeH = Math.max(0, Math.min(12, Math.floor(h) || 0));
    setQuickCustomHoras(safeH);
    setFormError('');
    const updatedList = generateConsecutiveSlotsList(
      quickHoraInicio,
      'custom',
      safeH,
      quickCustomMinutos,
      quickCantidad,
      quickEstado,
      quickObservacion
    );
    setPreviewFichas(updatedList);
  };

  const handleChangeCustomMinutes = (m: number) => {
    const safeM = Math.max(0, Math.min(59, Math.floor(m) || 0));
    setQuickCustomMinutos(safeM);
    setFormError('');
    const updatedList = generateConsecutiveSlotsList(
      quickHoraInicio,
      'custom',
      quickCustomHoras,
      safeM,
      quickCantidad,
      quickEstado,
      quickObservacion
    );
    setPreviewFichas(updatedList);
  };

  // Reaccionar a cambio de estado inicial
  const handleChangeQuickEstado = (newEstado: FichaEstado) => {
    setQuickEstado(newEstado);
    setPreviewFichas((prev) => prev.map((f) => ({ ...f, estado: newEstado })));
  };

  // Regenerar manualmente la secuencia consecutiva
  const handleRegenerateSequence = () => {
    setFormError('');
    const updatedList = generateConsecutiveSlotsList(
      quickHoraInicio,
      quickDuracionPreset,
      quickCustomHoras,
      quickCustomMinutos,
      quickCantidad,
      quickEstado,
      quickObservacion
    );
    setPreviewFichas(updatedList);
  };

  // Actualizar un slot específico de la vista previa editable (Requisito 6)
  const handleUpdatePreviewSlot = (
    index: number,
    field: 'hora_inicio' | 'hora_fin' | 'estado',
    value: string
  ) => {
    setPreviewFichas((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      const item = { ...updated[index], [field]: value };
      if (field === 'hora_inicio' || field === 'hora_fin') {
        item.duracion = calculateDuration(item.hora_inicio, item.hora_fin);
      }
      updated[index] = item;
      return updated;
    });
  };

  // Quitar una ficha de la vista previa (Requisito 6)
  const handleRemovePreviewSlot = (index: number) => {
    setPreviewFichas((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      setQuickCantidad(Math.max(1, updated.length));
      return updated;
    });
  };

  // Añadir ficha consecutiva adicional al final
  const handleAddExtraPreviewSlot = () => {
    const duracion = getEffectiveQuickDuration();
    let nextStart = timeToMinutes(quickHoraInicio || '09:00');
    if (previewFichas.length > 0) {
      nextStart = timeToMinutes(previewFichas[previewFichas.length - 1].hora_fin);
    }
    const nextEnd = nextStart + duracion;
    const newSlot = {
      id: `prev-extra-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hora_inicio: minutesToTime(nextStart),
      hora_fin: minutesToTime(nextEnd),
      duracion,
      estado: quickEstado,
      observacion: quickObservacion.trim() || undefined,
    };
    setPreviewFichas((prev) => [...prev, newSlot]);
    setQuickCantidad((prev) => prev + 1);
  };

  // Evaluación y Validación de la Vista Previa en Tiempo Real (Requisitos 6 y 7)
  const evaluatedPreview = useMemo(() => {
    return previewFichas.map((item, idx) => {
      const startMins = timeToMinutes(item.hora_inicio);
      const endMins = timeToMinutes(item.hora_fin);
      const itemDuracion = endMins - startMins;

      // 1. Horas válidas y completas
      if (!item.hora_inicio || !item.hora_fin) {
        return { ...item, duracion: 0, isValid: false, error: 'Horas incompletas.' };
      }
      if (
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(item.hora_inicio) ||
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(item.hora_fin)
      ) {
        return { ...item, duracion: 0, isValid: false, error: 'Formato de hora inválido (HH:mm).' };
      }
      if (startMins >= endMins) {
        return {
          ...item,
          duracion: 0,
          isValid: false,
          error: 'Hora de inicio debe ser anterior a hora de finalización.',
        };
      }
      if (itemDuracion <= 0) {
        return { ...item, duracion: 0, isValid: false, error: 'Duración debe ser mayor a 0 min.' };
      }

      // 2. Comprobar límites del salón (Apertura, Salida fija, Almuerzo/Descansos)
      if (scheduleConfig) {
        const daySchedule = getDayScheduleForDate(quickFecha, scheduleConfig);
        if (daySchedule) {
          if (!daySchedule.activo) {
            return {
              ...item,
              duracion: itemDuracion,
              isValid: false,
              error: `Salón cerrado el día ${daySchedule.nombreDia}.`,
            };
          }

          const openMins = timeToMinutes(daySchedule.horaInicio || '08:00');
          const closeMins = timeToMinutes(daySchedule.horaFin || '18:00');

          if (startMins < openMins) {
            return {
              ...item,
              duracion: itemDuracion,
              isValid: false,
              error: `Anterior a apertura (${daySchedule.horaInicio}).`,
            };
          }

          if (endMins > closeMins) {
            return {
              ...item,
              duracion: itemDuracion,
              isValid: false,
              error: `Excede salida obligatoria del salón (${daySchedule.horaFin}).`,
            };
          }

          const lunchAllowed =
            daySchedule.permitirAtencionAlmuerzo ?? scheduleConfig.permitirAtencionAlmuerzo ?? false;

          if (!lunchAllowed) {
            const lunchBreaks = [
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
                  ...item,
                  duracion: itemDuracion,
                  isValid: false,
                  error: `Colisiona con almuerzo (${brk.horaInicio}–${brk.horaFin}).`,
                };
              }
            }
          }
        }
      }

      // 3. Colisión con fichas existentes del salón en esa fecha
      const existingSameDay = salonFichas.filter((f) => f.fecha === quickFecha);
      for (const other of existingSameDay) {
        const oStart = timeToMinutes(other.hora_inicio);
        const oEnd = timeToMinutes(other.hora_fin);
        if (isTimeOverlapping(startMins, endMins, oStart, oEnd)) {
          // Verificar si tiene cita o solicitud activa asociada (Requisito 7)
          const associatedCita = appointments.find((c) => c.id === other.cita_id);
          if (
            associatedCita &&
            (associatedCita.estado === 'PENDIENTE' || associatedCita.estado === 'CONFIRMADA')
          ) {
            return {
              ...item,
              duracion: itemDuracion,
              isValid: false,
              error: `Colisiona con ficha que tiene cita ${associatedCita.estado.toLowerCase()} (${other.hora_inicio}–${other.hora_fin}).`,
            };
          }
          return {
            ...item,
            duracion: itemDuracion,
            isValid: false,
            error: `Colisiona con ficha existente (${other.hora_inicio}–${other.hora_fin}, ${other.estado}).`,
          };
        }
      }

      // 4. Colisión o duplicado con otras fichas de la misma lista previa
      for (let j = 0; j < previewFichas.length; j++) {
        if (j === idx) continue;
        const other = previewFichas[j];
        if (other.hora_inicio === item.hora_inicio && other.hora_fin === item.hora_fin) {
          return {
            ...item,
            duracion: itemDuracion,
            isValid: false,
            error: `Ficha duplicada con Ficha #${j + 1} (${other.hora_inicio}–${other.hora_fin}).`,
          };
        }
        const oStart = timeToMinutes(other.hora_inicio);
        const oEnd = timeToMinutes(other.hora_fin);
        if (isTimeOverlapping(startMins, endMins, oStart, oEnd)) {
          return {
            ...item,
            duracion: itemDuracion,
            isValid: false,
            error: `Se superpone con Ficha #${j + 1} (${other.hora_inicio}–${other.hora_fin}).`,
          };
        }
      }

      return {
        ...item,
        duracion: itemDuracion,
        isValid: true,
        error: undefined,
      };
    });
  }, [previewFichas, quickFecha, scheduleConfig, salonFichas, appointments]);

  // Abrir Modal de Crear Ficha
  const handleOpenCreateModal = () => {
    setCreateMode('rapido');
    setQuickFecha(selectedDate);
    setQuickHoraInicio('09:00');
    setQuickDuracionPreset('30');
    setQuickCustomHoras(1);
    setQuickCustomMinutos(15);
    setQuickCantidad(3);
    setQuickEstado('DISPONIBLE');
    setQuickObservacion('');

    setFormFecha(selectedDate);
    setFormHoraInicio('09:00');
    setFormHoraFin('09:30');
    setFormEstado('DISPONIBLE');
    setFormObservacion('');
    setFormError('');

    // Pre-generar 3 fichas de 30 min desde 09:00
    const list = generateConsecutiveSlotsList('09:00', '30', 1, 15, 3, 'DISPONIBLE');
    setPreviewFichas(list);
    setCreateModalOpen(true);
  };

  // Guardar fichas en Modo Rápido (Requisitos 2, 4, 5, 7, 8)
  const handleSaveQuickFichas = (e: React.FormEvent) => {
    e.preventDefault();

    if (evaluatedPreview.length === 0) {
      setFormError('Agrega al menos una ficha para guardar.');
      return;
    }

    const invalidFichas = evaluatedPreview.filter((f) => !f.isValid);
    if (invalidFichas.length > 0) {
      setFormError(
        `Hay ${invalidFichas.length} ficha(s) con conflicto de horario. Por favor corrige los horarios o elimina las fichas conflictivas antes de crear.`
      );
      return;
    }

    const fichasToCreate = evaluatedPreview.map((f) => ({
      salon_id: salon.id,
      fecha: quickFecha,
      hora_inicio: f.hora_inicio,
      hora_fin: f.hora_fin,
      duracion: f.duracion,
      estado: f.estado,
      observacion: f.observacion || quickObservacion.trim() || undefined,
    }));

    if (onCreateMultipleFichas) {
      const res = onCreateMultipleFichas(fichasToCreate);
      if (res.success) {
        setCreateModalOpen(false);
        setSelectedDate(quickFecha);
        showToast(
          `¡Se crearon ${res.createdCount} ${
            res.createdCount === 1 ? 'ficha' : 'fichas'
          } de atención exitosamente para el ${formatYYYYMMDDtoDDMMYYYY(quickFecha)}!`
        );
      } else {
        setFormError(res.errors?.join(' · ') || 'Error al guardar las fichas.');
      }
    } else {
      let count = 0;
      for (const f of fichasToCreate) {
        const res = onCreateFicha(f);
        if (res.success) count++;
      }
      setCreateModalOpen(false);
      setSelectedDate(quickFecha);
      showToast(
        `¡Se crearon ${count} fichas de atención exitosamente para el ${formatYYYYMMDDtoDDMMYYYY(quickFecha)}!`
      );
    }
  };

  // Abrir Modal de Editar Ficha (Requisito 7: Validación de citas asociadas)
  const handleOpenEditModal = (ficha: FichaAtencion) => {
    if (ficha.estado === 'PENDIENTE' || ficha.estado === 'CONFIRMADA' || ficha.cita_id) {
      setWarningModalMessage(
        'Esta ficha tiene una solicitud o cita asociada. Gestiona primero la cita en la sección "Citas" antes de modificar el horario.'
      );
      return;
    }
    setEditModalFicha(ficha);
    setFormFecha(ficha.fecha);
    setFormHoraInicio(ficha.hora_inicio);
    setFormHoraFin(ficha.hora_fin);
    setFormEstado(ficha.estado);
    setFormObservacion(ficha.observacion || '');
    setFormError('');
  };

  // Intentar eliminar Ficha (Requisito 7)
  const handleDeleteFichaClick = (ficha: FichaAtencion) => {
    // Validar si la ficha tiene una cita o solicitud activa
    const associatedCita = appointments.find((c) => c.id === ficha.cita_id);
    const hasActiveCita =
      ficha.estado === 'PENDIENTE' ||
      ficha.estado === 'CONFIRMADA' ||
      (associatedCita && (associatedCita.estado === 'PENDIENTE' || associatedCita.estado === 'CONFIRMADA'));

    if (hasActiveCita) {
      setWarningModalMessage(
        'Esta ficha tiene una solicitud o cita asociada. Gestiona primero la cita antes de eliminar la ficha.'
      );
      return;
    }

    setDeleteError(null);
    setFichaToDelete(ficha);
  };

  const handleConfirmDeleteFicha = () => {
    if (!fichaToDelete) return;
    const res = onDeleteFicha(fichaToDelete.id);
    if (res.success) {
      showToast('Ficha de atención eliminada correctamente.');
      if (editModalFicha && editModalFicha.id === fichaToDelete.id) {
        setEditModalFicha(null);
      }
      setFichaToDelete(null);
      setDeleteError(null);
    } else {
      setDeleteError(res.error || 'No se pudo eliminar la ficha.');
    }
  };

  // Guardar Ficha Nueva (Modo Manual)
  const handleSaveNewFicha = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateFicha({
      salonId: salon.id,
      fecha: formFecha,
      horaInicio: formHoraInicio,
      horaFin: formHoraFin,
      config: scheduleConfig,
      existingFichas: salonFichas,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Horario no válido.');
      return;
    }

    const res = onCreateFicha({
      salon_id: salon.id,
      fecha: formFecha,
      hora_inicio: formHoraInicio,
      hora_fin: formHoraFin,
      duracion: validation.duracion,
      estado: formEstado,
      observacion: formObservacion.trim() || undefined,
    });

    if (res.success) {
      setCreateModalOpen(false);
      setSelectedDate(formFecha);
      showToast(`Ficha de ${formHoraInicio} a ${formHoraFin} (${validation.duracion} min) creada con éxito.`);
    } else {
      setFormError(res.error || 'Error al crear la ficha.');
    }
  };

  // Guardar Ficha Editada
  const handleSaveEditedFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalFicha) return;

    const validation = validateFicha({
      salonId: salon.id,
      fecha: formFecha,
      horaInicio: formHoraInicio,
      horaFin: formHoraFin,
      config: scheduleConfig,
      existingFichas: salonFichas,
      ignoreFichaId: editModalFicha.id,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Horario no válido.');
      return;
    }

    const updated: FichaAtencion = {
      ...editModalFicha,
      fecha: formFecha,
      hora_inicio: formHoraInicio,
      hora_fin: formHoraFin,
      duracion: validation.duracion,
      estado: formEstado,
      observacion: formObservacion.trim() || undefined,
    };

    const res = onUpdateFicha(updated);
    if (res.success) {
      setEditModalFicha(null);
      setSelectedDate(formFecha);
      showToast(`Ficha actualizada correctamente (${validation.duracion} min).`);
    } else {
      setFormError(res.error || 'Error al actualizar la ficha.');
    }
  };

  // Guardar Configuración de Horario del Salón (Apertura, Salida y Almuerzo)
  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SalonScheduleConfig = {
      ...scheduleConfig,
      dias: configDays.map((d) => ({
        ...d,
        permitirAtencionAlmuerzo: configLunchAllowed,
      })),
      permitirAtencionAlmuerzo: configLunchAllowed,
      fechaActualizacion: new Date().toISOString(),
    };

    onSaveSchedule(updated);
    setConfigSaveSuccess(true);
    setTimeout(() => {
      setConfigSaveSuccess(false);
      setConfigModalOpen(false);
    }, 1500);
    showToast('Configuración de horarios y permisos de almuerzo guardada exitosamente.');
  };

  // Duración calculada en vivo para el modal
  const liveCalculatedDuration = useMemo(() => {
    return calculateDuration(formHoraInicio, formHoraFin);
  }, [formHoraInicio, formHoraFin]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast de confirmación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-900 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal de la Sección Horarios */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div>
            <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Agenda Diaria y Fichas de Atención</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
              Gestión de Horarios — {salon.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Organiza manualmente tus fichas de atención día por día con cualquier duración (30, 45, 60, 90, 120 min). Los clientes seleccionarán únicamente las fichas compatibles que publiques aquí.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setConfigDays(scheduleConfig.dias);
                setConfigLunchAllowed(scheduleConfig.permitirAtencionAlmuerzo ?? false);
                setConfigModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
              title="Ajustar hora de apertura, salida y descanso de almuerzo"
            >
              <Sliders className="w-4 h-4 text-purple-700" />
              <span>Apertura, Salida y Almuerzo</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear ficha de atención</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegación Diaria de la Agenda */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl bg-white border border-purple-200 text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-purple-200 shadow-xs">
              <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="font-bold text-xs text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl bg-white border border-purple-200 text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedDate !== todayStr && (
              <button
                onClick={handleSetToday}
                className="px-3 py-1.5 rounded-xl bg-purple-200 hover:bg-purple-300 text-purple-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Ir a Hoy
              </button>
            )}
          </div>

          {/* Información de Horario Laboral del día */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-serif font-bold text-slate-900 capitalize text-sm">
              {currentDaySchedule?.nombreDia || 'Día'}:
            </span>
            {currentDaySchedule?.activo ? (
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-[11px]">
                Apertura: {currentDaySchedule.horaInicio} · Salida fija: {currentDaySchedule.horaFin}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                Día no laborable (cerrado)
              </span>
            )}

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                (currentDaySchedule?.permitirAtencionAlmuerzo ?? scheduleConfig.permitirAtencionAlmuerzo)
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
              title="Configuración de atención en descanso de almuerzo"
            >
              <Coffee className="w-3 h-3" />
              {(currentDaySchedule?.permitirAtencionAlmuerzo ?? scheduleConfig.permitirAtencionAlmuerzo)
                ? 'Almuerzo: Atención habilitada'
                : 'Almuerzo: 12:00-13:00 bloqueado'}
            </span>
          </div>
        </div>

        {/* Resumen de Fichas del Día Seleccionado */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Fichas
            </span>
            <span className="text-xl font-extrabold text-slate-900">{counts.total}</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Disponibles
            </span>
            <span className="text-xl font-extrabold text-emerald-800">{counts.disponibles}</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Pendientes
            </span>
            <span className="text-xl font-extrabold text-amber-800">{counts.pendientes}</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Confirmadas
            </span>
            <span className="text-xl font-extrabold text-indigo-800">{counts.confirmadas}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              Bloqueadas
            </span>
            <span className="text-xl font-extrabold text-slate-700">{counts.bloqueadas}</span>
          </div>
        </div>

        {/* Filtros de Fichas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            {(['TODAS', 'DISPONIBLE', 'PENDIENTE', 'CONFIRMADA', 'BLOQUEADA'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl font-bold transition-colors cursor-pointer text-[11px] ${
                  statusFilter === st
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-purple-100'
                }`}
              >
                {st === 'TODAS'
                  ? 'Todas'
                  : st === 'DISPONIBLE'
                  ? 'Disponibles'
                  : st === 'PENDIENTE'
                  ? 'Pendientes'
                  : st === 'CONFIRMADA'
                  ? 'Confirmadas'
                  : 'Bloqueadas'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">Duración:</span>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-xl border border-purple-200 text-xs font-semibold bg-white"
            >
              <option value="TODAS">Todas las duraciones</option>
              <option value="30">30 min (cortas)</option>
              <option value="45-60">45 a 60 min (estándar)</option>
              <option value="90+">90 min o más (largas)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Fichas de Atención del Día */}
      <div className="space-y-4">
        {filteredFichas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFichas.map((ficha) => {
              const isOccupied = ficha.estado === 'PENDIENTE' || ficha.estado === 'CONFIRMADA';
              const isBlocked = ficha.estado === 'BLOQUEADA';
              const isAvailable = ficha.estado === 'DISPONIBLE';

              return (
                <div
                  key={ficha.id}
                  className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                    isAvailable
                      ? 'bg-white border-emerald-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md'
                      : ficha.estado === 'PENDIENTE'
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                      : ficha.estado === 'CONFIRMADA'
                      ? 'bg-indigo-50/60 border-indigo-300 shadow-xs'
                      : 'bg-slate-100 border-slate-300 opacity-90'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Fila superior: Horario y Duración */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xl font-extrabold text-slate-900 block tracking-tight">
                          {ficha.hora_inicio} — {ficha.hora_fin}
                        </span>
                        <span className="text-xs font-semibold text-purple-700 inline-flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {ficha.duracion} minutos de atención
                        </span>
                      </div>

                      {/* Badge de Estado con colores discretos */}
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : ficha.estado === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : ficha.estado === 'CONFIRMADA'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {ficha.estado}
                      </span>
                    </div>

                    {/* Información de Solicitud o Cita Asociada */}
                    {isOccupied && (
                      <div className="p-3 rounded-2xl bg-white/90 border border-purple-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            {ficha.estado === 'PENDIENTE' ? 'Solicitud pendiente:' : 'Cita confirmada:'}
                          </span>
                          {ficha.cita_id && (
                            <span className="font-mono text-purple-800 font-bold text-[10px]">
                              {ficha.cita_id}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 truncate">
                          👤 {ficha.cliente_nombre || 'Cliente TuCita'}
                        </p>
                        <p className="text-purple-900 font-semibold truncate text-[11px]">
                          ✂️ {ficha.servicio_nombre || 'Servicio del salón'}
                        </p>
                      </div>
                    )}

                    {/* Observación / Nota del propietario */}
                    {ficha.observacion && (
                      <p className="text-xs text-slate-600 italic bg-white/60 p-2.5 rounded-xl border border-slate-200/60">
                        “{ficha.observacion}”
                      </p>
                    )}
                  </div>

                  {/* Acciones de la Ficha */}
                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                    {/* Botón Ver Cita Asociada si existe */}
                    {isOccupied && ficha.cita_id ? (
                      <button
                        onClick={() => {
                          if (onNavigateToCita) onNavigateToCita(ficha.cita_id!);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Cita</span>
                      </button>
                    ) : null}

                    {/* Acciones para Fichas Disponibles o Bloqueadas */}
                    {isAvailable && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(ficha)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => onToggleBlockFicha(ficha.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Bloquear temporalmente este horario"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bloquear</span>
                        </button>

                        <button
                          onClick={() => handleDeleteFichaClick(ficha)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar ficha de atención"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isBlocked && (
                      <>
                        <button
                          onClick={() => onToggleBlockFicha(ficha.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Desbloquear ficha</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(ficha)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Editar ficha"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteFichaClick(ficha)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar ficha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Si tiene cita asociada y se intenta manipular directamente */}
                    {isOccupied && (
                      <button
                        onClick={() => handleOpenEditModal(ficha)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Modificar ficha protegida"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-purple-100 text-center space-y-4">
            <Clock className="w-12 h-12 text-purple-200 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                No hay fichas configuradas para el {formatYYYYMMDDtoDDMMYYYY(selectedDate)}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {currentDaySchedule?.activo
                  ? 'Organiza la jornada creando fichas manualmente con las horas y duraciones que desees atender.'
                  : 'Este día está marcado como no laborable en la configuración del salón.'}
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear primera ficha de atención para este día</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL CREAR / EDITAR FICHA DE ATENCIÓN                   */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* MODAL DE EDICIÓN DE FICHA EXISTENTE                      */}
      {/* ======================================================== */}
      {editModalFicha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setEditModalFicha(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-white">
                  Editar Ficha de Atención
                </h3>
                <p className="text-xs text-purple-200">
                  {salon.name} · Disponibilidad para reservas
                </p>
              </div>
              <button
                onClick={() => setEditModalFicha(null)}
                className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveEditedFicha}
              className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
            >
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campo Fecha */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  <span>Fecha de atención</span>
                </label>
                <input
                  type="date"
                  value={formFecha}
                  onChange={(e) => {
                    setFormFecha(e.target.value);
                    setFormError('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold text-xs"
                  required
                />
              </div>

              {/* Horas Inicio y Fin */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Hora de inicio</label>
                  <input
                    type="time"
                    value={formHoraInicio}
                    onChange={(e) => {
                      setFormHoraInicio(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Hora de finalización</label>
                  <input
                    type="time"
                    value={formHoraFin}
                    onChange={(e) => {
                      setFormHoraFin(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-sm font-bold"
                    required
                  />
                </div>
              </div>

              {/* Duración calculada en tiempo real */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                    Duración calculada
                  </span>
                  <span className="text-base font-extrabold text-purple-950 font-mono">
                    {liveCalculatedDuration > 0
                      ? `${liveCalculatedDuration} minutos`
                      : 'Horario inválido (inicio >= fin)'}
                  </span>
                </div>
                {liveCalculatedDuration > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Duración válida
                  </span>
                )}
              </div>

              {/* Estado de la Ficha */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Estado de la ficha</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value as FichaEstado)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-xs"
                >
                  <option value="DISPONIBLE">Disponible (publicada para reservas de clientes)</option>
                  <option value="BLOQUEADA">Bloqueada (apartada temporalmente para el salón)</option>
                </select>
              </div>

              {/* Observación opcional */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Observación opcional</label>
                <input
                  type="text"
                  placeholder="Ej: Ideal para cortes, balayage, o preparación de novia"
                  value={formObservacion}
                  onChange={(e) => setFormObservacion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-purple-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteFichaClick(editModalFicha)}
                  className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar ficha</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalFicha(null)}
                    className="px-4 py-2 rounded-xl border border-purple-200 text-slate-700 font-bold hover:bg-purple-50 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={liveCalculatedDuration <= 0}
                    className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    Guardar cambios de la ficha
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CREAR FICHA DE ATENCIÓN (MODO RÁPIDO & MANUAL)     */}
      {/* ======================================================== */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal con Pestañas de Modo */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                    <span>Crear Fichas de Atención</span>
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    {salon.name} · Organiza la disponibilidad de tu agenda para los clientes
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Selector de Modos (Requisito 2) */}
              <div className="grid grid-cols-2 p-1 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode('rapido');
                    setFormError('');
                  }}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    createMode === 'rapido'
                      ? 'bg-white text-purple-950 shadow-md font-extrabold'
                      : 'text-purple-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Modo Rápido (Consecutivo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateMode('manual');
                    setFormError('');
                  }}
                  className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    createMode === 'manual'
                      ? 'bg-white text-purple-950 shadow-md font-extrabold'
                      : 'text-purple-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-purple-400" />
                  <span>Modo Manual (1 sola ficha)</span>
                </button>
              </div>
            </div>

            {/* CONTENIDO: MODO RÁPIDO */}
            {createMode === 'rapido' ? (
              <form
                onSubmit={handleSaveQuickFichas}
                className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs"
              >
                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. FECHA Y HORA INICIAL (Requisito 1) */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      <span>1. Fecha y hora inicial de atención</span>
                    </h4>
                    <span className="text-[11px] text-purple-700 font-medium capitalize">
                      {getDayOfWeekFromDate(quickFecha)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Fecha de atención */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px] flex items-center justify-between">
                        <span>Fecha de atención</span>
                        <span className="text-slate-400 font-normal">Día a publicar</span>
                      </label>
                      <input
                        type="date"
                        value={quickFecha}
                        onChange={(e) => {
                          setQuickFecha(e.target.value);
                          setFormError('');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>

                    {/* Hora inicial (Reloj + Escritura manual HH:mm) */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>Hora inicial (HH:mm)</span>
                        </span>
                        <span className="text-purple-700 font-semibold text-[10px]">Punto de partida</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="09:00"
                          maxLength={5}
                          value={quickHoraInicio}
                          onChange={(e) => handleChangeQuickHoraInicio(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 rounded-xl border border-purple-200 font-mono text-sm font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          required
                        />
                        <div className="absolute right-2.5 flex items-center pointer-events-none text-purple-600">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Horas sugeridas compactas */}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Rápidas:</span>
                        {['08:00', '08:30', '09:00', '09:30', '10:00', '11:00', '14:00', '15:00'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => handleChangeQuickHoraInicio(h)}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                              quickHoraInicio === h
                                ? 'bg-purple-700 text-white'
                                : 'bg-white hover:bg-purple-100 text-purple-900 border border-purple-200/60'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DURACIONES RÁPIDAS (Requisito 3) & CANTIDAD DE FICHAS (Requisito 4) */}
                <div className="p-4 rounded-2xl bg-white border border-purple-100 space-y-3.5 shadow-sm">
                  {/* Fila superior: Título de Duración y Cantidad */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>2. Duración y Cantidad de fichas</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Selecciona el intervalo de atención y el total de fichas consecutivas a generar.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-purple-800 bg-purple-100/90 px-2.5 py-1 rounded-full border border-purple-200">
                        {quickCantidad} {quickCantidad === 1 ? 'ficha' : 'fichas'} de {getEffectiveQuickDuration()} min
                      </span>
                    </div>
                  </div>

                  {/* Botones de duración rápida (Requisito 3: 15, 30, 45, 60, 90, 2h, 3h, Personalizar, Manual) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 text-[11px] block">
                      Selecciona la duración de cada ficha:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                      {[
                        { id: '15', label: '15 minutos', short: '15 min' },
                        { id: '30', label: '30 minutos', short: '30 min' },
                        { id: '45', label: '45 minutos', short: '45 min' },
                        { id: '60', label: '60 minutos', short: '60 min' },
                        { id: '90', label: '90 minutos', short: '90 min' },
                        { id: '120', label: '2 horas', short: '2 horas' },
                        { id: '180', label: '3 horas', short: '3 horas' },
                        { id: 'custom', label: 'Personalizar', short: 'Personalizar' },
                        { id: 'manual', label: 'Manual', short: 'Manual' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectDurationPreset(preset.id as any)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border text-center ${
                            preset.id === 'manual'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              : quickDuracionPreset === preset.id
                              ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                              : 'bg-purple-50/60 hover:bg-purple-100/80 text-purple-950 border-purple-200/70'
                          }`}
                          title={preset.label}
                        >
                          <span className="leading-tight truncate text-[11px]">{preset.short}</span>
                          <span
                            className={`text-[9px] font-normal leading-tight mt-0.5 truncate ${
                              preset.id !== 'manual' && quickDuracionPreset === preset.id
                                ? 'text-purple-200'
                                : 'text-slate-500'
                            }`}
                          >
                            {preset.id === '120' ? '120 min' : preset.id === '180' ? '180 min' : preset.id === 'manual' ? '1 sola' : preset.id === 'custom' ? 'Ajustar' : preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel de Personalizar Duración en Horas y Minutos (Requisito 3) */}
                  {quickDuracionPreset === 'custom' && (
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 text-xs">Duración personalizada:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="12"
                            value={quickCustomHoras}
                            onChange={(e) => handleChangeCustomHours(parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 rounded-xl border border-purple-200 bg-white text-center font-bold font-mono text-xs"
                          />
                          <span className="text-xs text-slate-700 font-semibold">horas</span>
                        </div>
                        <span className="text-slate-400 font-bold">+</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            step="5"
                            value={quickCustomMinutos}
                            onChange={(e) => handleChangeCustomMinutes(parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 rounded-xl border border-purple-200 bg-white text-center font-bold font-mono text-xs"
                          />
                          <span className="text-xs text-slate-700 font-semibold">minutos</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
                        Total: {(Number(quickCustomHoras) || 0) * 60 + (Number(quickCustomMinutos) || 0)} minutos
                      </span>
                    </div>
                  )}

                  {/* Campo numérico «Cantidad de fichas» y Estado inicial (Requisito 4) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Cantidad de fichas con botones numéricos */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
                        <span>Cantidad de fichas</span>
                        <span className="text-[11px] text-purple-700 font-normal">
                          Límite: 1 a 30 fichas
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleChangeQuickCantidad(quickCantidad - 1)}
                          className="w-9 h-9 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold text-base flex items-center justify-center cursor-pointer transition-colors"
                          disabled={quickCantidad <= 1}
                          title="Restar una ficha"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={quickCantidad}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) handleChangeQuickCantidad(val);
                          }}
                          className="w-16 px-2 py-1.5 rounded-xl border border-purple-200 text-center font-mono font-bold text-sm bg-white text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleChangeQuickCantidad(quickCantidad + 1)}
                          className="w-9 h-9 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold text-base flex items-center justify-center cursor-pointer transition-colors"
                          disabled={quickCantidad >= 30}
                          title="Añadir una ficha"
                        >
                          +
                        </button>

                        {/* Chips rápidos de cantidad (Requisito 4) */}
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                          {[1, 2, 3, 4, 5, 6, 8, 10].map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => handleChangeQuickCantidad(qty)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
                                quickCantidad === qty
                                  ? 'bg-purple-700 text-white border-purple-800'
                                  : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Estado inicial de las fichas */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 text-xs">
                        Estado inicial de las fichas
                      </label>
                      <select
                        value={quickEstado}
                        onChange={(e) => handleChangeQuickEstado(e.target.value as FichaEstado)}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="DISPONIBLE">Disponible (publicada para reserva de clientes)</option>
                        <option value="BLOQUEADA">Bloqueada (apartada temporalmente para el salón)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. VISTA PREVIA EDITABLE (Requisitos 5, 6, 7) */}
                <div className="p-4 rounded-2xl bg-white border border-purple-100 space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-2.5">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-700" />
                        <span>3. Vista previa de fichas consecutivas ({evaluatedPreview.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Horarios calculados según la hora inicial y duración. Puedes modificar horas puntuales o quitar fichas antes de confirmar.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleRegenerateSequence}
                        className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Regenerar la secuencia consecutiva limpia"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Regenerar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddExtraPreviewSlot}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        title="Agregar una ficha consecutiva extra al final"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Ficha</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Fichas Editables (Requisito 6: Número, Fecha, Hora inicio, Hora fin, Duración, Estado) */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {evaluatedPreview.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">
                        No hay fichas en la vista previa. Haz clic en "Regenerar" o añade una ficha.
                      </div>
                    ) : (
                      evaluatedPreview.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            item.isValid
                              ? 'bg-purple-50/20 border-purple-200/70 hover:bg-purple-50/40'
                              : 'bg-rose-50/90 border-rose-300'
                          }`}
                        >
                          {/* Datos principales de la ficha */}
                          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                            {/* 1. Número de ficha */}
                            <span className="px-2 py-1 rounded-lg bg-purple-700 text-white text-[11px] font-mono font-extrabold shrink-0">
                              Ficha #{idx + 1}
                            </span>

                            {/* 2. Fecha */}
                            <span className="text-[11px] font-semibold text-slate-600 font-mono shrink-0 bg-white px-2 py-1 rounded-lg border border-purple-100">
                              {formatYYYYMMDDtoDDMMYYYY(quickFecha)}
                            </span>

                            {/* 3 & 4. Horas de inicio y fin editables (HH:mm) */}
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <input
                                type="text"
                                maxLength={5}
                                value={item.hora_inicio}
                                onChange={(e) => handleUpdatePreviewSlot(idx, 'hora_inicio', e.target.value)}
                                className="w-16 px-2 py-1 rounded-lg border border-purple-200 bg-white font-bold text-center text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                title="Hora de inicio"
                              />
                              <span className="text-slate-400 font-bold">→</span>
                              <input
                                type="text"
                                maxLength={5}
                                value={item.hora_fin}
                                onChange={(e) => handleUpdatePreviewSlot(idx, 'hora_fin', e.target.value)}
                                className="w-16 px-2 py-1 rounded-lg border border-purple-200 bg-white font-bold text-center text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                title="Hora de finalización"
                              />
                            </div>

                            {/* 5. Duración calculada */}
                            <span className="text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded-lg shrink-0">
                              {item.duracion} min
                            </span>
                          </div>

                          {/* 6. Estado inicial, Validación y Botón eliminar */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end">
                            {/* Validación */}
                            {item.isValid ? (
                              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Válida</span>
                              </span>
                            ) : (
                              <span
                                className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1 max-w-xs truncate"
                                title={item.error}
                              >
                                <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span className="truncate">{item.error}</span>
                              </span>
                            )}

                            {/* Selector de Estado inicial */}
                            <select
                              value={item.estado}
                              onChange={(e) => handleUpdatePreviewSlot(idx, 'estado', e.target.value as FichaEstado)}
                              className="px-2 py-1 rounded-lg border border-purple-200 bg-white text-[11px] font-semibold text-slate-800"
                            >
                              <option value="DISPONIBLE">Disponible</option>
                              <option value="BLOQUEADA">Bloqueada</option>
                            </select>

                            {/* Botón eliminar ficha de la vista previa */}
                            <button
                              type="button"
                              onClick={() => handleRemovePreviewSlot(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                              title="Eliminar esta ficha de la lista"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Banner descriptivo si se detecta alguna ficha con conflicto (Requisito 7) */}
                  {evaluatedPreview.some((f) => !f.isValid) && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Fichas con conflicto detectadas:</span>
                        <span>
                          Revisa las fichas marcadas en rojo. Corrige los horarios superpuestos o elimínalas antes de confirmar para evitar solapamientos o infracciones del horario del salón.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observación opcional común */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">
                    Observación opcional (se incluirá en todas las fichas creadas)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cortes, peinados, servicios estándar o asesoría"
                    value={quickObservacion}
                    onChange={(e) => setQuickObservacion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* FOOTER CON BOTÓN DE GUARDADO «Crear fichas» (Requisito 8) */}
                <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {evaluatedPreview.filter((f) => f.isValid).length === evaluatedPreview.length && evaluatedPreview.length > 0 ? (
                        <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Todas las {evaluatedPreview.length} fichas son válidas y listas para crear</span>
                        </span>
                      ) : (
                        <span className="text-amber-800 font-bold">
                          {evaluatedPreview.filter((f) => f.isValid).length} de {evaluatedPreview.length} fichas válidas
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Fecha: {formatYYYYMMDDtoDDMMYYYY(quickFecha)} · Salón: {salon.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-purple-200 text-slate-700 font-bold hover:bg-purple-50 cursor-pointer text-xs"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={
                        evaluatedPreview.length === 0 ||
                        evaluatedPreview.some((f) => !f.isValid)
                      }
                      className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>
                        {evaluatedPreview.length === 1
                          ? 'Crear ficha'
                          : `Crear fichas (${evaluatedPreview.length})`}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* CONTENIDO: MODO MANUAL (1 SOLA FICHA) (Requisito 2) */
              <form
                onSubmit={handleSaveNewFicha}
                className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs"
              >
                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Fecha */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-700" />
                      <span>Fecha de atención</span>
                    </span>
                    <span className="text-[11px] text-purple-700 capitalize">
                      {getDayOfWeekFromDate(formFecha)}
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={(e) => {
                      setFormFecha(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                {/* Horas Inicio y Fin con reloj y escritura manual HH:mm */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Hora de inicio (HH:mm)</span>
                      <Clock className="w-3 h-3 text-purple-600" />
                    </label>
                    <input
                      type="text"
                      placeholder="09:00"
                      maxLength={5}
                      value={formHoraInicio}
                      onChange={(e) => {
                        setFormHoraInicio(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-sm font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Hora de finalización (HH:mm)</span>
                      <Clock className="w-3 h-3 text-purple-600" />
                    </label>
                    <input
                      type="text"
                      placeholder="10:00"
                      maxLength={5}
                      value={formHoraFin}
                      onChange={(e) => {
                        setFormHoraFin(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-sm font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>
                </div>

                {/* Horas sugeridas para Modo Manual */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium">Sugeridas inicio:</span>
                  {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setFormHoraInicio(h);
                        const dur = liveCalculatedDuration > 0 ? liveCalculatedDuration : 30;
                        setFormHoraFin(minutesToTime(timeToMinutes(h) + dur));
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        formHoraInicio === h
                          ? 'bg-purple-700 text-white'
                          : 'bg-purple-50 text-purple-900 border border-purple-200/60'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                {/* Duración calculada en tiempo real */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                      Duración calculada
                    </span>
                    <span className="text-base font-extrabold text-purple-950 font-mono">
                      {liveCalculatedDuration > 0
                        ? `${liveCalculatedDuration} minutos`
                        : 'Horario inválido (inicio >= fin)'}
                    </span>
                  </div>
                  {liveCalculatedDuration > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Duración válida
                    </span>
                  )}
                </div>

                {/* Estado inicial */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Estado inicial de la ficha</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as FichaEstado)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="DISPONIBLE">Disponible (publicada para reservas de clientes)</option>
                    <option value="BLOQUEADA">Bloqueada (apartada temporalmente para el salón)</option>
                  </select>
                </div>

                {/* Observación opcional */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Observación opcional</label>
                  <input
                    type="text"
                    placeholder="Ej: Ideal para cortes, balayage, o preparación de novia"
                    value={formObservacion}
                    onChange={(e) => setFormObservacion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Botones de acción Modo Manual */}
                <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-purple-200 text-slate-700 font-bold hover:bg-purple-50 cursor-pointer text-xs"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={liveCalculatedDuration <= 0}
                    className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    Publicar ficha de atención
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CONFIGURACIÓN GENERAL (APERTURA, SALIDA, ALMUERZO) */}
      {/* ======================================================== */}
      {configModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setConfigModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-purple-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-white">
                  Horarios del Salón, Apertura, Salida y Almuerzo
                </h3>
                <p className="text-xs text-purple-200">
                  Define los límites laborales fijos y el permiso opcional para atender durante el almuerzo.
                </p>
              </div>
              <button
                onClick={() => setConfigModalOpen(false)}
                className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGeneralConfig} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {configSaveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Configuración de horarios guardada exitosamente.</span>
                </div>
              )}

              {/* REQUISITO 9: Opción de Almuerzo */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="permitirAlmuerzoToggle"
                    checked={configLunchAllowed}
                    onChange={(e) => setConfigLunchAllowed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-purple-600 border-amber-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="permitirAlmuerzoToggle"
                      className="font-bold text-sm text-amber-950 cursor-pointer block"
                    >
                      Permitir atención durante el horario de almuerzo
                    </label>
                    <p className="text-[11px] text-amber-900/80 mt-0.5 leading-relaxed">
                      Por defecto, el horario de almuerzo (12:00 a 13:00) se mantiene bloqueado. Si activas esta opción, podrás crear fichas que atraviesen o coincidan con el descanso de almuerzo. La hora de salida permanece obligatoria y fija.
                    </p>
                  </div>
                </div>
              </div>

              {/* REQUISITO 8: Horas de Apertura y Salida por Día */}
              <div className="space-y-3">
                <span className="font-bold text-sm text-slate-900 block border-b border-purple-100 pb-2">
                  Límites de Apertura y Salida por Día Laboral
                </span>
                <p className="text-[11px] text-slate-500">
                  La hora de salida es fija para cada día. Las fichas no podrán exceder la hora de salida configurada.
                </p>

                <div className="space-y-2.5">
                  {configDays.map((dia, idx) => (
                    <div
                      key={dia.dia}
                      className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        dia.activo ? 'bg-white border-purple-100' : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-32">
                        <input
                          type="checkbox"
                          checked={dia.activo}
                          onChange={(e) => {
                            const updated = [...configDays];
                            updated[idx] = { ...dia, activo: e.target.checked };
                            setConfigDays(updated);
                          }}
                          className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900 capitalize">{dia.nombreDia}</span>
                      </div>

                      {dia.activo ? (
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Apertura:</span>
                            <input
                              type="time"
                              value={dia.horaInicio}
                              onChange={(e) => {
                                const updated = [...configDays];
                                updated[idx] = { ...dia, horaInicio: e.target.value };
                                setConfigDays(updated);
                              }}
                              className="px-2 py-1 rounded-lg border border-purple-200 font-mono font-bold"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Salida fija:</span>
                            <input
                              type="time"
                              value={dia.horaFin}
                              onChange={(e) => {
                                const updated = [...configDays];
                                updated[idx] = { ...dia, horaFin: e.target.value };
                                setConfigDays(updated);
                              }}
                              className="px-2 py-1 rounded-lg border border-purple-200 font-mono font-bold text-purple-900"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Día de descanso (cerrado)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-purple-200 text-slate-700 font-bold hover:bg-purple-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Guardar configuración general
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE ADVERTENCIA PARA FICHAS RESERVADAS (Requisito 7)  */}
      {/* ======================================================== */}
      {warningModalMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setWarningModalMessage(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-amber-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Ficha con Cita o Solicitud Asociada
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {warningModalMessage}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setWarningModalMessage(null)}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE FICHA           */}
      {/* ======================================================== */}
      {fichaToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => {
            setFichaToDelete(null);
            setDeleteError(null);
          }}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                ¿Eliminar esta ficha de atención?
              </h3>
              <p className="text-xs text-slate-500">
                Esta acción removerá el horario de tu agenda disponible para clientes.
              </p>
            </div>

            {/* Resumen de la ficha */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium text-slate-500">Fecha:</span>
                <span className="font-bold text-slate-900">{formatYYYYMMDDtoDDMMYYYY(fichaToDelete.fecha)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium text-slate-500">Horario:</span>
                <span className="font-mono font-bold text-purple-900">{fichaToDelete.hora_inicio} — {fichaToDelete.hora_fin}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium text-slate-500">Duración:</span>
                <span className="font-semibold text-slate-800">{fichaToDelete.duracion} minutos</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium text-slate-500">Estado:</span>
                <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {fichaToDelete.estado}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFichaToDelete(null);
                  setDeleteError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFicha}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, eliminar ficha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
