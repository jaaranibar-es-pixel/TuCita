import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  MessageCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User as UserIcon,
  Mail,
  FileText,
  MapPin,
  ShieldCheck,
  Check,
  Scissors,
  Search
} from 'lucide-react';
import type {
  Salon,
  ServiceItem,
  SalonScheduleConfig,
  Cita,
  FichaAtencion,
  User
} from '../types';
import {
  getRolling7Days,
  getAvailableSlotsForBooking,
  generateNextCitaCode,
  validateBookingPreSave,
  getDayOfWeekFromDateString,
  RollingDayInfo,
  timeToMinutes,
  minutesToTime,
  formatYYYYMMDDtoDDMMYYYY
} from '../utils/appointmentManager';
import { AvailableSlot } from '../utils/scheduleGenerator';
import { getCompatibleFichasForService } from '../utils/scheduleValidator';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: Salon;
  service: ServiceItem | null;
  scheduleConfig: SalonScheduleConfig;
  existingAppointments: Cita[];
  fichas?: FichaAtencion[];
  currentUser?: User | null;
  onConfirmBooking: (newCita: Cita, fichaId?: string) => void;
  onOpenTracking?: (codigo: string) => void;
}

type BookingStep = 'servicio' | 'fecha' | 'horario' | 'datos' | 'resumen' | 'confirmada';

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  salon,
  service,
  scheduleConfig,
  existingAppointments,
  fichas,
  currentUser,
  onConfirmBooking,
  onOpenTracking,
}) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<BookingStep>('servicio');

  // Booking selections
  const rollingDays = useMemo(() => getRolling7Days(), []);
  const [selectedDate, setSelectedDate] = useState<RollingDayInfo>(rollingDays[0]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedFicha, setSelectedFicha] = useState<FichaAtencion | null>(null);

  // Modalidad B: Solicitud Sin Ficha previa
  const [isSinFichaMode, setIsSinFichaMode] = useState<boolean>(false);
  const [sinFichaHoraInicio, setSinFichaHoraInicio] = useState<string>('10:00');
  const [preferenciaHoraria, setPreferenciaHoraria] = useState<'EXACTA' | 'MISMO_DIA' | 'MANANA' | 'TARDE'>('EXACTA');

  // Client form fields (Auto-populated if logged in as client)
  const [clienteNombre, setClienteNombre] = useState(() =>
    currentUser ? `${currentUser.nombre} ${currentUser.apellido}`.trim() : ''
  );
  const [clienteTelefono, setClienteTelefono] = useState(() => currentUser?.telefono || '');
  const [clienteWhatsapp, setClienteWhatsapp] = useState(() => currentUser?.telefono || '');
  const [clienteCorreo, setClienteCorreo] = useState(() => currentUser?.correo || '');
  const [clienteNota, setClienteNota] = useState('');

  // Update fields if currentUser changes or modal reopens
  useEffect(() => {
    if (currentUser && isOpen) {
      if (!clienteNombre) setClienteNombre(`${currentUser.nombre} ${currentUser.apellido}`.trim());
      if (!clienteTelefono && currentUser.telefono) {
        setClienteTelefono(currentUser.telefono);
        if (!clienteWhatsapp) setClienteWhatsapp(currentUser.telefono);
      }
      if (!clienteCorreo && currentUser.correo) setClienteCorreo(currentUser.correo);
    }
  }, [currentUser, isOpen]);

  // Form error
  const [errorMessage, setErrorMessage] = useState('');
  const [createdCita, setCreatedCita] = useState<Cita | null>(null);

  // Sync WhatsApp with Phone if user hasn't typed different WhatsApp
  const handlePhoneChange = (val: string) => {
    setClienteTelefono(val);
    if (!clienteWhatsapp || clienteWhatsapp === clienteTelefono) {
      setClienteWhatsapp(val);
    }
  };

  // Active day schedule for selected date
  const selectedDaySchedule = useMemo(() => {
    if (!selectedDate) return undefined;
    return scheduleConfig.dias.find((d) => d.dia === selectedDate.dayOfWeek);
  }, [selectedDate, scheduleConfig]);

  // REQUISITOS 1, 4, 5 & 13: Fichas de atención manuales configuradas por el propietario como fuente principal de disponibilidad
  const { compatibleFichas, incompatibleFichas } = useMemo(() => {
    if (!service || !selectedDate || !fichas) return { compatibleFichas: [], incompatibleFichas: [] };
    const { compatible, incompatible } = getCompatibleFichasForService(
      fichas,
      salon.id,
      selectedDate.dateStr,
      service.durationMinutes
    );
    return { compatibleFichas: compatible, incompatibleFichas: incompatible };
  }, [fichas, salon.id, selectedDate, service]);

  // Turnos disponibles (a partir de las fichas compatibles del propietario o generador de respaldo)
  const availableSlots = useMemo(() => {
    if (fichas && fichas.length > 0) {
      return compatibleFichas.map((f) => ({
        start: f.hora_inicio,
        end: f.hora_fin,
        label: `${f.hora_inicio} - ${f.hora_fin}`,
      }));
    }

    if (!service || !selectedDaySchedule || !selectedDate) return [];
    return getAvailableSlotsForBooking(
      selectedDaySchedule,
      service.durationMinutes,
      scheduleConfig.intervaloMinutos,
      salon.id,
      selectedDate.dateStr,
      existingAppointments
    );
  }, [fichas, compatibleFichas, selectedDaySchedule, service, scheduleConfig, salon.id, selectedDate, existingAppointments]);

  if (!isOpen || !service) return null;

  // Handle step transitions with validations
  const handleGoToDate = () => {
    setErrorMessage('');
    setCurrentStep('fecha');
  };

  const handleSelectDate = (day: RollingDayInfo) => {
    const daySchedule = scheduleConfig.dias.find((d) => d.dia === day.dayOfWeek);
    if (!daySchedule || !daySchedule.activo) return; // Día no disponible
    setSelectedDate(day);
    setSelectedSlot(null);
    setErrorMessage('');
  };

  const handleGoToHorario = () => {
    if (!selectedDate) {
      setErrorMessage('Por favor selecciona una fecha disponible.');
      return;
    }
    setErrorMessage('');
    setCurrentStep('horario');
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setErrorMessage('');
  };

  // Duración y cálculo de hora fin para solicitud sin ficha
  const duracionServicio = service ? service.durationMinutes : 30;
  const sinFichaStartMins = timeToMinutes(sinFichaHoraInicio);
  const sinFichaEndMins = sinFichaStartMins + duracionServicio;
  const sinFichaHoraFin = minutesToTime(sinFichaEndMins);

  const handleGoToDatos = () => {
    if (isSinFichaMode) {
      if (!sinFichaHoraInicio || !/^\d{2}:\d{2}$/.test(sinFichaHoraInicio)) {
        setErrorMessage('Por favor ingresa una hora inicial válida (formato HH:mm).');
        return;
      }
      if (selectedDaySchedule && selectedDaySchedule.activo) {
        const openMins = timeToMinutes(selectedDaySchedule.horaInicio || '08:00');
        const closeMins = timeToMinutes(selectedDaySchedule.horaFin || '20:00');
        if (sinFichaStartMins < openMins) {
          setErrorMessage(`La hora solicitada (${sinFichaHoraInicio}) es anterior al horario de apertura del salón (${selectedDaySchedule.horaInicio}).`);
          return;
        }
        if (sinFichaEndMins > closeMins) {
          setErrorMessage(`El servicio (${duracionServicio} min) terminaría a las ${sinFichaHoraFin}, superando la hora de cierre del salón (${selectedDaySchedule.horaFin}).`);
          return;
        }
      }
      setSelectedSlot({
        start: sinFichaHoraInicio,
        end: sinFichaHoraFin,
        label: `${sinFichaHoraInicio} - ${sinFichaHoraFin}`,
      });
      setErrorMessage('');
      setCurrentStep('datos');
      return;
    }

    if (!selectedSlot) {
      setErrorMessage('Por favor selecciona un horario disponible.');
      return;
    }
    setErrorMessage('');
    setCurrentStep('datos');
  };

  const handleGoToResumen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || clienteNombre.trim().length < 3) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!clienteTelefono.trim() || clienteTelefono.trim().length < 7) {
      setErrorMessage('Por favor ingresa un número de teléfono válido (mínimo 7 dígitos).');
      return;
    }
    if (!clienteWhatsapp.trim() || clienteWhatsapp.trim().length < 7) {
      setErrorMessage('Por favor ingresa un número de WhatsApp para contactarte.');
      return;
    }
    setErrorMessage('');
    setCurrentStep('resumen');
  };

  // Submit and create pending appointment with full safety checks (Requirements 19 & 20)
  const handleSubmitBooking = () => {
    if (!selectedSlot || !selectedDate) return;

    if (!isSinFichaMode) {
      // Run strict pre-save validation to prevent race conditions & double-booking
      const validation = validateBookingPreSave({
        salon,
        service,
        dateStr: selectedDate.dateStr,
        horaInicio: selectedSlot.start,
        horaFin: selectedSlot.end,
        scheduleConfig,
        existingAppointments,
        clienteNombre,
        clienteTelefono,
        clienteWhatsapp,
      });

      if (!validation.valid) {
        setErrorMessage(validation.errorMessage || 'No se pudo completar la solicitud.');
        if (validation.errorMessage?.includes('acaba de ser reservado')) {
          setCurrentStep('horario');
          setSelectedSlot(null);
        }
        return;
      }
    }

    // Generate unique code TC-2026-XXXXX
    const uniqueCode = generateNextCitaCode(existingAppointments);

    // 24 horas exactas de plazo de vigencia
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newCita: Cita = {
      id: `cita-${salon.id}-${Date.now()}`,
      codigo_cita: uniqueCode,
      cliente_id: currentUser?.id,
      tipo_reserva: isSinFichaMode ? 'SIN_FICHA' : 'CON_FICHA',
      preferencia_horaria: isSinFichaMode ? preferenciaHoraria : undefined,
      salon_id: salon.id,
      servicio_id: service.id,
      salon_nombre: salon.name,
      servicio_nombre: service.name,
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      cliente_whatsapp: clienteWhatsapp.trim(),
      cliente_correo: clienteCorreo.trim() || undefined,
      fecha: selectedDate.dateStr,
      hora_inicio: selectedSlot.start,
      hora_fin: selectedSlot.end,
      duracion: service.durationMinutes,
      precio: service.price,
      nota: clienteNota.trim() || undefined,
      estado: 'PENDIENTE', // Requisito estricto: debe quedar en PENDIENTE
      fecha_solicitud: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      fecha_expiracion: expirationDate,
    };

    onConfirmBooking(newCita, selectedFicha?.id);
    setCreatedCita(newCita);
    setCurrentStep('confirmada');
  };

  const handleResetAndClose = () => {
    setCurrentStep('servicio');
    setSelectedSlot(null);
    setCreatedCita(null);
    setIsSinFichaMode(false);
    setSinFichaHoraInicio('10:00');
    setPreferenciaHoraria('EXACTA');
    setErrorMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={handleResetAndClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Salon Visual Header Bar */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-4 sm:p-5 relative shrink-0">
          <button
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-lg border border-white/20 shrink-0"
              style={{ backgroundColor: salon.logoBgColor || '#7e22ce' }}
            >
              {salon.logoText || salon.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                Solicitud de Reserva en TuCita
              </span>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-white truncate leading-tight">
                {salon.name}
              </h3>
              <p className="text-[11px] text-purple-200 truncate flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-pink-300 shrink-0" />
                <span>{salon.address} · {salon.city}</span>
              </p>
            </div>
          </div>

          {/* Visual Step Progress Bar (Requirement 22) */}
          {currentStep !== 'confirmada' && (
            <div className="mt-4 pt-3 border-t border-purple-800/80">
              <div className="flex items-center justify-between text-[11px] font-semibold text-purple-200">
                {[
                  { key: 'servicio', label: '1. Servicio' },
                  { key: 'fecha', label: '2. Fecha' },
                  { key: 'horario', label: '3. Hora' },
                  { key: 'datos', label: '4. Datos' },
                  { key: 'resumen', label: '5. Resumen' },
                ].map((step, idx) => {
                  const stepOrder = ['servicio', 'fecha', 'horario', 'datos', 'resumen'];
                  const currentIndex = stepOrder.indexOf(currentStep);
                  const isPassed = idx < currentIndex;
                  const isCurrent = currentStep === step.key;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-1 transition-colors ${
                        isCurrent
                          ? 'text-pink-300 font-bold'
                          : isPassed
                          ? 'text-white'
                          : 'text-purple-400/70'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-pink-500 text-white'
                            : isPassed
                            ? 'bg-purple-700 text-purple-100'
                            : 'bg-purple-900 text-purple-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
                      </span>
                      <span className="hidden sm:inline">{step.label.slice(3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* Global Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 1: DATOS DEL SERVICIO                                */}
          {/* ======================================================== */}
          {currentStep === 'servicio' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-purple-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block">
                  Paso 1 de 5
                </span>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  Detalles del Servicio Seleccionado
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifica el costo y la duración antes de elegir fecha y horario de atención.
                </p>
              </div>

              {/* Service Card Highlight */}
              <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-5 flex flex-col sm:flex-row gap-5 items-center">
                <div className="relative w-full sm:w-40 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-purple-900/10 shrink-0">
                  <img
                    src={service.image}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-purple-900 text-[10px] font-bold shadow-xs">
                    {service.category}
                  </span>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <h5 className="font-serif font-extrabold text-xl text-purple-950 uppercase tracking-tight">
                      {service.name}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {service.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                      <span className="text-slate-500 block text-[10px] font-medium">Precio oficial:</span>
                      <span className="text-xl font-extrabold text-purple-900 font-sans tabular-nums">
                        Bs {service.price}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                      <span className="text-slate-500 block text-[10px] font-medium">Tiempo de atención:</span>
                      <span className="text-base font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                        {service.durationMinutes} minutos
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salon info notice */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>Atención garantizada por <strong>{salon.name}</strong></span>
                </div>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Salón Disponible
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleGoToDate}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:translate-x-0.5"
                >
                  <span>Continuar a selección de fecha</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: VENTANA MÓVIL DE 7 DÍAS (REGLA FUNDAMENTAL)       */}
          {/* ======================================================== */}
          {currentStep === 'fecha' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-purple-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block">
                  Paso 2 de 5
                </span>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  Selecciona la Fecha de tu Cita
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ventana móvil activa: citas disponibles únicamente dentro de los próximos <strong>7 días</strong> a partir de hoy.
                </p>
              </div>

              {/* 7-Day Rolling Window Selector */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {rollingDays.map((day) => {
                    const dayConfig = scheduleConfig.dias.find((d) => d.dia === day.dayOfWeek);
                    const isSalonOpen = dayConfig?.activo ?? false;
                    const isSelected = selectedDate.dateStr === day.dateStr;

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        disabled={!isSalonOpen}
                        onClick={() => handleSelectDate(day)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between min-h-[105px] ${
                          !isSalonOpen
                            ? 'bg-slate-50/80 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-800 text-white border-purple-800 shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                            : 'bg-white border-purple-100 text-slate-700 hover:border-purple-300 hover:bg-purple-50/60'
                        }`}
                      >
                        <div>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                              isSelected ? 'text-pink-300' : isSalonOpen ? 'text-purple-700' : 'text-slate-400'
                            }`}
                          >
                            {day.dayName}
                          </span>
                          <span className="text-xl font-serif font-extrabold block my-0.5">
                            {day.dayNumber}
                          </span>
                          <span className={`text-[10px] block font-medium ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                            {day.monthName.slice(0, 3)}
                          </span>
                        </div>

                        <div className="mt-1 pt-1 border-t border-current/10">
                          {day.isToday && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                                isSelected ? 'bg-pink-500 text-white' : 'bg-purple-100 text-purple-900'
                              }`}
                            >
                              Hoy
                            </span>
                          )}
                          {!isSalonOpen && (
                            <span className="text-[9px] font-semibold text-rose-500 block">
                              Cerrado
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day info feedback */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-purple-950 block">
                    Fecha elegida: {selectedDate.dayName}, {selectedDate.displayDate}
                  </span>
                  <span className="text-slate-600 block text-[11px] mt-0.5">
                    {selectedDaySchedule?.activo ? (
                      <>
                        Horario del salón: <strong>{selectedDaySchedule.horaInicio} - {selectedDaySchedule.horaFin}</strong>
                        {selectedDaySchedule.descansos && selectedDaySchedule.descansos.length > 0 && (
                          <span className="ml-1 text-purple-700">
                            (Pausa: {selectedDaySchedule.descansos.map((b) => `${b.horaInicio}-${b.horaFin}`).join(', ')})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-rose-600 font-semibold">El salón no atiende este día. Por favor elige otro día.</span>
                    )}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Duración requerida:</span>
                  <span className="font-extrabold text-purple-900">{service.durationMinutes} min</span>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('servicio')}
                  className="px-4 py-2.5 rounded-xl border border-purple-200 text-purple-900 font-bold text-xs hover:bg-purple-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedDaySchedule?.activo}
                  onClick={handleGoToHorario}
                  className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Continuar a horarios</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: SELECCIONAR HORARIO DISPONIBLE                    */}
          {/* ======================================================== */}
          {currentStep === 'horario' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-purple-100 pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block">
                    Paso 3 de 5
                  </span>
                  <h4 className="font-serif font-bold text-xl text-slate-900">
                    Selecciona un Horario Libre
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Para el {selectedDate.dayName} {selectedDate.displayDate} · Duración: {service.durationMinutes} min
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep('fecha')}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Cambiar fecha
                </button>
              </div>

              {/* Slots Grid */}
              <div className="space-y-3">
                {isSinFichaMode ? (
                  /* FORMULARIO DE SOLICITUD SIN FICHA (Modalidad B) */
                  <div className="space-y-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50/20 to-purple-50 border-2 border-purple-300 animate-fadeIn">
                    <div className="flex items-start justify-between gap-3 border-b border-purple-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Sparkles className="w-4 h-4 text-pink-300" />
                        </div>
                        <div>
                          <h5 className="font-serif font-bold text-purple-950 text-sm sm:text-base">
                            Solicitud de Cita Sin Ficha Publicada
                          </h5>
                          <span className="text-[10px] text-purple-700 block">
                            Modalidad B: Solicitud personalizada sujeta a revisión del salón
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSinFichaMode(false);
                          setSelectedSlot(null);
                        }}
                        className="text-xs text-purple-700 font-bold hover:underline cursor-pointer shrink-0"
                      >
                        Ver turnos publicados
                      </button>
                    </div>

                    <p className="text-xs text-slate-700">
                      Indica tu fecha y hora preferida para <strong>{service.name}</strong> ({service.durationMinutes} min). El propietario del salón revisará tu petición y podrá <strong>aceptarla, rechazarla o proponerte una contraoferta</strong> en un plazo máximo de 24 horas.
                    </p>

                    {/* Selector de fecha dentro de la ventana de 7 días */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 block">
                        Fecha deseada (ventana móvil de 7 días):
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {rollingDays.map((d) => (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(d);
                              setErrorMessage('');
                            }}
                            className={`p-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                              selectedDate.dateStr === d.dateStr
                                ? 'bg-purple-800 text-white shadow-sm ring-2 ring-purple-400'
                                : 'bg-white border border-purple-200 text-purple-950 hover:bg-purple-100'
                            }`}
                          >
                            <span className="block text-[10px] uppercase font-semibold">{d.dayName.slice(0, 3)}</span>
                            <span className="block text-sm font-extrabold">{d.dayNumber}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hora preferida */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 block">
                          Hora preferida de inicio (HH:mm):
                        </label>
                        <div className="text-xs text-slate-600">
                          Finalización estimada: <strong className="font-mono text-purple-950 font-bold">{sinFichaHoraFin}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Clock className="w-4 h-4 text-purple-600 absolute left-3 top-2.5" />
                          <input
                            type="time"
                            value={sinFichaHoraInicio}
                            onChange={(e) => {
                              setSinFichaHoraInicio(e.target.value);
                              setErrorMessage('');
                            }}
                            className="pl-9 pr-3 py-2 rounded-xl border border-purple-300 font-mono font-bold text-sm text-purple-950 bg-white focus:ring-2 focus:ring-purple-400"
                          />
                        </div>

                        <div className="flex-1 text-[11px] text-slate-500">
                          {selectedDaySchedule?.activo ? (
                            <span>Atención del salón: {selectedDaySchedule.horaInicio} a {selectedDaySchedule.horaFin}</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">Salón cerrado este día</span>
                          )}
                        </div>
                      </div>

                      {/* Chips de horas sugeridas */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Sugeridas:</span>
                        {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setSinFichaHoraInicio(h);
                              setErrorMessage('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              sinFichaHoraInicio === h
                                ? 'bg-purple-800 text-white shadow-xs'
                                : 'bg-white border border-purple-200 text-purple-900 hover:bg-purple-100'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preferencias de horario (Requisito 2) */}
                    <div className="space-y-1.5 pt-2 border-t border-purple-200/80">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 block">
                        Preferencia de flexibilidad de horario:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: 'EXACTA', label: 'Prefiero exactamente esta hora', desc: 'No tengo flexibilidad de horario' },
                          { id: 'MISMO_DIA', label: 'Puedo asistir en otro horario del mismo día', desc: 'El dueño puede proponerme otra hora ese día' },
                          { id: 'MANANA', label: 'Prefiero por la mañana', desc: 'Turno matutino de preferencia' },
                          { id: 'TARDE', label: 'Prefiero por la tarde', desc: 'Turno vespertino de preferencia' },
                        ].map((pref) => (
                          <label
                            key={pref.id}
                            onClick={() => setPreferenciaHoraria(pref.id as any)}
                            className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-2 ${
                              preferenciaHoraria === pref.id
                                ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                                : 'bg-white border-purple-200 text-slate-800 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="preferenciaHoraria"
                              checked={preferenciaHoraria === pref.id}
                              onChange={() => {}}
                              className="mt-0.5 text-purple-600 focus:ring-purple-400"
                            />
                            <div>
                              <span className={`text-xs font-bold block ${preferenciaHoraria === pref.id ? 'text-white' : 'text-slate-900'}`}>
                                {pref.label}
                              </span>
                              <span className={`text-[10px] block mt-0.5 ${preferenciaHoraria === pref.id ? 'text-purple-200' : 'text-slate-500'}`}>
                                {pref.desc}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Turnos disponibles calculados ({availableSlots.length}):
                      </span>
                      <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Cruces y pendientes filtrados automáticamente
                      </span>
                    </div>

                    {availableSlots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                          {availableSlots.map((slot) => {
                            const isSelected = selectedSlot?.label === slot.label;

                            return (
                              <button
                                key={slot.label}
                                type="button"
                                onClick={() => handleSelectSlot(slot)}
                                className={`p-3 rounded-2xl border text-center font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                                  isSelected
                                    ? 'bg-purple-800 text-white border-purple-800 shadow-md ring-2 ring-purple-400 scale-[1.02]'
                                    : 'bg-white border-purple-200 text-purple-950 hover:border-purple-400 hover:bg-purple-50/60'
                                }`}
                              >
                                <span className="text-sm font-extrabold tracking-tight">{slot.label}</span>
                                <span className={`text-[10px] font-sans font-normal mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                                  {service.durationMinutes} minutos
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Opción para solicitar horario sin ficha si ninguno le convence */}
                        <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                            <span className="text-slate-700">¿No encuentras el horario ideal para ti?</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSlot(null);
                              setIsSinFichaMode(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                          >
                            Solicitar cita sin ficha
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-300 text-amber-950 space-y-3 text-center">
                        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                        <span className="font-serif font-bold text-base block text-amber-950">
                          No hay turnos disponibles para este día
                        </span>
                        <p className="text-amber-800 text-xs max-w-md mx-auto">
                          Todos los horarios ya están reservados o no hay fichas publicadas para este servicio en la fecha seleccionada.
                        </p>

                        <div className="p-4 rounded-2xl bg-white border border-amber-200 text-left space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                            <span className="font-bold text-purple-950 text-xs">
                              ¿No encuentras un horario disponible?
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Solicita una cita al salón. El propietario revisará tu petición y podrá <strong>aceptarla, rechazarla o proponerte una contraoferta</strong> en un plazo de 24 horas.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSlot(null);
                              setIsSinFichaMode(true);
                            }}
                            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                          >
                            <Sparkles className="w-4 h-4 text-pink-300" />
                            <span>SOLICITAR CITA SIN FICHA</span>
                          </button>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setCurrentStep('fecha')}
                            className="text-xs font-semibold text-purple-800 hover:underline cursor-pointer"
                          >
                            O elegir otra fecha
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Slot Selected Feedback */}
              {selectedSlot && !isSinFichaMode && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Turno seleccionado: <strong>{selectedSlot.label}</strong> ({service.durationMinutes} min)</span>
                  </div>
                  <span className="text-emerald-700 text-[11px]">Listo para tus datos</span>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('fecha')}
                  className="px-4 py-2.5 rounded-xl border border-purple-200 text-purple-900 font-bold text-xs hover:bg-purple-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a fecha</span>
                </button>

                <button
                  type="button"
                  disabled={!isSinFichaMode && !selectedSlot}
                  onClick={handleGoToDatos}
                  className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Continuar con tus datos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: DATOS DEL CLIENTE (FORMULARIO)                    */}
          {/* ======================================================== */}
          {currentStep === 'datos' && (
            <form onSubmit={handleGoToResumen} className="space-y-5 animate-fadeIn">
              <div className="border-b border-purple-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block">
                  Paso 4 de 5
                </span>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  Datos de Contacto
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  El salón utilizará estos datos para identificar tu solicitud y comunicarse contigo. No es obligatorio crear una cuenta.
                </p>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Nombre completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Valeria Morales Romero"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Teléfono celular <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 79781234"
                      value={clienteTelefono}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                    WhatsApp para avisos <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 79781234"
                      value={clienteWhatsapp}
                      onChange={(e) => setClienteWhatsapp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-emerald-300 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Correo Electrónico (Opcional) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Correo electrónico <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="tu.correo@ejemplo.com"
                      value={clienteCorreo}
                      onChange={(e) => setClienteCorreo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Nota o Comentario (Opcional) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Nota o especificación para el estilista <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      placeholder="Ej. Prefiero atención con cabello corto, llevaré un diseño de referencia..."
                      value={clienteNota}
                      onChange={(e) => setClienteNota(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('horario')}
                  className="px-4 py-2.5 rounded-xl border border-purple-200 text-purple-900 font-bold text-xs hover:bg-purple-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a horario</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>Revisar resumen de la cita</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* PASO 5: RESUMEN DE LA CITA ANTES DE ENVIAR (Requisito 13) */}
          {/* ======================================================== */}
          {currentStep === 'resumen' && selectedSlot && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-purple-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block">
                  Paso 5 de 5
                </span>
                <h4 className="font-serif font-bold text-xl text-slate-900">
                  Resumen de tu Solicitud
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Por favor revisa que todos los datos sean correctos antes de enviar la solicitud al salón.
                </p>
              </div>

              {/* Structured Summary Card */}
              <div className="rounded-3xl border border-purple-200 bg-white shadow-sm overflow-hidden divide-y divide-purple-100">
                {/* Salon & Service Details */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50/60 to-pink-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: salon.logoBgColor || '#7e22ce' }}
                    >
                      {salon.logoText || salon.name.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                        Salón:
                      </span>
                      <h5 className="font-serif font-bold text-base text-slate-900">
                        {salon.name}
                      </h5>
                      <span className="text-[11px] text-slate-500">{salon.address}</span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-purple-200 sm:pl-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block">
                      Precio a abonar en el salón:
                    </span>
                    <span className="text-2xl font-extrabold text-purple-900 font-sans tabular-nums">
                      Bs {service.price}
                    </span>
                  </div>
                </div>

                {/* Appointment Information Grid */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Servicio solicitado:</span>
                    <span className="font-bold text-slate-900 text-sm block">{service.name}</span>
                    <span className="text-[11px] text-purple-700 font-semibold">
                      Duración estimada: {service.durationMinutes} minutos
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Fecha agendada:</span>
                    <span className="font-bold text-purple-950 text-sm block">
                      {selectedDate.dayName}, {selectedDate.displayDate}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Horario: {selectedSlot.start} a {selectedSlot.end} ({service.durationMinutes} min)
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-purple-50 sm:border-none sm:pt-0">
                    <span className="text-slate-500 font-medium block">Cliente solicitante:</span>
                    <span className="font-bold text-slate-900 block">{clienteNombre}</span>
                    <span className="text-[11px] text-slate-600 block">
                      Tel: {clienteTelefono} · WhatsApp: {clienteWhatsapp}
                    </span>
                    {clienteCorreo && (
                      <span className="text-[11px] text-slate-500 block truncate">{clienteCorreo}</span>
                    )}
                  </div>

                  <div className="space-y-1 pt-2 border-t border-purple-50 sm:border-none sm:pt-0">
                    <span className="text-slate-500 font-medium block">Nota para el salón:</span>
                    <p className="text-slate-700 italic text-[11px]">
                      {clienteNota ? `“${clienteNota}”` : 'Sin especificaciones adicionales.'}
                    </p>
                  </div>
                </div>

                {/* Status Notice & 24h expiration */}
                <div className="p-4 bg-amber-50/90 text-amber-950 rounded-2xl border border-amber-300 flex items-start gap-2.5 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Estado inicial: PENDIENTE</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                        Plazo de respuesta: 24 horas
                      </span>
                    </div>
                    <p className="text-amber-900 text-[11px]">
                      {isSinFichaMode
                        ? 'Al enviar tu solicitud sin ficha, el salón dispondrá de 24 horas para aceptar tu horario preferido, rechazarlo o enviarte una contraoferta (horario alternativo). Si el salón no responde en 24 horas, la solicitud caducará automáticamente.'
                        : 'Al pulsar “SOLICITAR CITA”, el horario quedará reservado preventivamente. El salón confirmará tu cita en un plazo de 24 horas.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Requirement 13) */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('datos')}
                  className="px-5 py-3 rounded-2xl border border-purple-200 text-purple-900 font-bold text-xs sm:text-sm hover:bg-purple-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>VOLVER</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-extrabold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isSinFichaMode ? 'ENVIAR SOLICITUD SIN FICHA' : 'SOLICITAR CITA'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 6: CONFIRMACIÓN DE SOLICITUD (Requisito 14)          */}
          {/* ======================================================== */}
          {currentStep === 'confirmada' && createdCita && (
            <div className="space-y-6 text-center py-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9 text-purple-700 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-600 block">
                  Operación Exitosa
                </span>
                <h4 className="font-serif font-extrabold text-2xl text-slate-900">
                  Solicitud enviada correctamente
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Tu cita está <strong>pendiente de confirmación</strong> por parte del salón <strong>{salon.name}</strong>.
                </p>
              </div>

              {/* Code Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white max-w-md mx-auto shadow-md space-y-1">
                <span className="text-[10px] text-purple-200 uppercase font-semibold tracking-wider block">
                  Código de Identificación de tu Cita:
                </span>
                <div className="text-2xl font-mono font-extrabold text-pink-300 tracking-wider">
                  {createdCita.codigo_cita}
                </div>
                <span className="text-[10px] text-purple-300 block">
                  Conserva este código para consultas, seguimiento o responder a contraofertas.
                </span>
              </div>

              {/* Appointment Card Recap */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 max-w-md mx-auto text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-500">Salón:</span>
                  <span className="font-bold text-slate-900">{salon.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-500">Modalidad:</span>
                  <span className="font-bold text-purple-900">
                    {createdCita.tipo_reserva === 'SIN_FICHA' ? 'Solicitud Sin Ficha Previa' : 'Reserva con Ficha Publicada'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-500">Servicio:</span>
                  <span className="font-bold text-slate-900">{createdCita.servicio_nombre}</span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-500">Fecha solicitada:</span>
                  <span className="font-bold text-purple-950">{selectedDate.displayDate}</span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-500">Horario:</span>
                  <span className="font-mono font-bold text-purple-950">
                    {createdCita.hora_inicio} - {createdCita.hora_fin} ({createdCita.duracion} min)
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <span className="text-slate-500">Precio estimado:</span>
                  <span className="font-bold text-purple-900 text-sm">Bs {createdCita.precio}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Estado y vigencia:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    PENDIENTE · 24h para respuesta
                  </span>
                </div>
              </div>

              {/* Salon Contact Info & Tracking Button */}
              <div className="space-y-2 max-w-md mx-auto">
                {onOpenTracking && (
                  <button
                    type="button"
                    onClick={() => {
                      const code = createdCita.codigo_cita;
                      handleResetAndClose();
                      onOpenTracking(code);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4 text-pink-300" />
                    <span>CONSULTAR ESTADO / RASTREAR SOLICITUD</span>
                  </button>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                  <div className="text-left">
                    <span className="font-bold text-slate-800 block">¿Deseas avisar al salón?</span>
                    <span className="text-[11px]">Escribe directamente por WhatsApp</span>
                  </div>
                  <a
                    href={`https://wa.me/591${salon.whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(salon.name)},%20acabo%20de%20solicitar%20mi%20cita%20con%20código%20${createdCita.codigo_cita}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Finish Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  Entendido, volver a la página del salón
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
