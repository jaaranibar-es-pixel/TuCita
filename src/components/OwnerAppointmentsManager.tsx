import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  FileText,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Scissors,
  Check,
  Ban,
  RotateCcw,
  Eye,
  CalendarDays,
  ShieldAlert,
  ArrowUpDown,
  Timer
} from 'lucide-react';
import { Cita, Salon, CitaEstado, HistorialCita, User as UserType, SalonScheduleConfig } from '../types';
import { formatYYYYMMDDtoDDMMYYYY, formatDateToYYYYMMDD, getRemainingExpirationTime } from '../utils/appointmentManager';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { ConfirmAppointmentModal } from './ConfirmAppointmentModal';
import { RejectAppointmentModal } from './RejectAppointmentModal';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { CounterOfferModal } from './CounterOfferModal';

interface OwnerAppointmentsManagerProps {
  salon: Salon;
  appointments: Cita[];
  historial: HistorialCita[];
  currentUser: UserType;
  scheduleConfig?: SalonScheduleConfig;
  onUpdateCitaStatus: (
    citaId: string,
    nuevoEstado: CitaEstado,
    observacion?: string,
    motivoRechazo?: string
  ) => void;
  onSendCounterOffer?: (
    citaId: string,
    propuesta: { fecha: string; hora_inicio: string; hora_fin: string; mensaje?: string }
  ) => void;
  selectedCitaIdFromNotif?: string | null;
}

type TabFilter = 'TODAS' | 'PENDIENTE' | 'CONFIRMADA' | 'PROPUESTA_ENVIADA' | 'RECHAZADA' | 'CANCELADA' | 'HOY';

export const OwnerAppointmentsManager: React.FC<OwnerAppointmentsManagerProps> = ({
  salon,
  appointments,
  historial,
  currentUser,
  scheduleConfig,
  onUpdateCitaStatus,
  onSendCounterOffer,
  selectedCitaIdFromNotif,
}) => {
  // Tabs & filters
  const [activeTab, setActiveTab] = useState<TabFilter>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // Modals state
  const [detailCita, setDetailCita] = useState<Cita | null>(null);
  const [confirmCita, setConfirmCita] = useState<Cita | null>(null);
  const [rejectCita, setRejectCita] = useState<Cita | null>(null);
  const [cancelCita, setCancelCita] = useState<Cita | null>(null);
  const [counterOfferCita, setCounterOfferCita] = useState<Cita | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // REQUISITO 19 & 20: Seguridad por salón - el propietario SOLO visualiza citas de su salón
  const salonAppointments = useMemo(() => {
    return appointments.filter((c) => c.salon_id === salon.id);
  }, [appointments, salon.id]);

  // Si viene una cita seleccionada desde las notificaciones, abrir su detalle automáticamente
  useEffect(() => {
    if (selectedCitaIdFromNotif) {
      const target = salonAppointments.find((c) => c.id === selectedCitaIdFromNotif);
      if (target) {
        setDetailCita(target);
      }
    }
  }, [selectedCitaIdFromNotif, salonAppointments]);

  // Contadores por estado y citas de hoy
  const todayStr = useMemo(() => formatDateToYYYYMMDD(new Date()), []);

  const counts = useMemo(() => {
    const pending = salonAppointments.filter((c) => c.estado === 'PENDIENTE').length;
    const confirmed = salonAppointments.filter((c) => c.estado === 'CONFIRMADA').length;
    const proposals = salonAppointments.filter((c) => c.estado === 'PROPUESTA_ENVIADA').length;
    const rejected = salonAppointments.filter((c) => c.estado === 'RECHAZADA').length;
    const cancelled = salonAppointments.filter((c) => c.estado === 'CANCELADA' || c.estado === 'CADUCADA').length;
    const today = salonAppointments.filter((c) => c.fecha === todayStr).length;

    return {
      all: salonAppointments.length,
      pending,
      confirmed,
      proposals,
      rejected,
      cancelled,
      today,
    };
  }, [salonAppointments, todayStr]);

  // Lista única de nombres de servicios de las citas para el filtro
  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    salonAppointments.forEach((c) => set.add(c.servicio_nombre));
    return Array.from(set);
  }, [salonAppointments]);

  // Filtrado y ordenamiento de citas
  const filteredAppointments = useMemo(() => {
    return salonAppointments
      .filter((cita) => {
        // Tab filter
        if (activeTab === 'HOY') {
          if (cita.fecha !== todayStr) return false;
        } else if (activeTab !== 'TODAS') {
          if (cita.estado !== activeTab) return false;
        }

        // Service filter
        if (selectedServiceFilter !== 'todos' && cita.servicio_nombre !== selectedServiceFilter) {
          return false;
        }

        // Date filter
        if (selectedDateFilter && cita.fecha !== selectedDateFilter) {
          return false;
        }

        // Search term (cliente, código, teléfono)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matches =
            cita.codigo_cita.toLowerCase().includes(term) ||
            cita.cliente_nombre.toLowerCase().includes(term) ||
            cita.cliente_telefono.includes(term) ||
            cita.servicio_nombre.toLowerCase().includes(term);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Si estamos en la pestaña "Citas de hoy", ordenar estrictamente por hora de inicio (Requisito 17)
        if (activeTab === 'HOY') {
          return a.hora_inicio.localeCompare(b.hora_inicio);
        }
        // De lo contrario ordenar por fecha descendente y hora
        if (a.fecha !== b.fecha) {
          return b.fecha.localeCompare(a.fecha);
        }
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });
  }, [salonAppointments, activeTab, selectedServiceFilter, selectedDateFilter, searchTerm, todayStr]);

  // HANDLERS CON VALIDACIÓN DE SEGURIDAD (Requisito 20)
  const handleConfirmAction = (cita: Cita) => {
    if (cita.salon_id !== salon.id) {
      showToast('Acceso no autorizado: esta cita pertenece a otro salón.');
      return;
    }
    onUpdateCitaStatus(
      cita.id,
      'CONFIRMADA',
      `Confirmada por ${currentUser.nombre || 'el propietario'}. Horario asegurado.`
    );
    showToast(`¡Cita ${cita.codigo_cita} confirmada correctamente! Horario bloqueado.`);
  };

  const handleRejectAction = (cita: Cita, motivo: string) => {
    if (cita.salon_id !== salon.id) {
      showToast('Acceso no autorizado: esta cita pertenece a otro salón.');
      return;
    }
    onUpdateCitaStatus(
      cita.id,
      'RECHAZADA',
      `Rechazada por ${currentUser.nombre || 'el propietario'}. Motivo: ${motivo}`,
      motivo
    );
    showToast(`Solicitud ${cita.codigo_cita} rechazada. El horario ha quedado disponible.`);
  };

  const handleCancelAction = (cita: Cita, observacion: string) => {
    if (cita.salon_id !== salon.id) {
      showToast('Acceso no autorizado: esta cita pertenece a otro salón.');
      return;
    }
    onUpdateCitaStatus(
      cita.id,
      'CANCELADA',
      `Cancelada por ${currentUser.nombre || 'el propietario'}. ${observacion}`
    );
    showToast(`Cita ${cita.codigo_cita} cancelada. El horario vuelve a estar libre.`);
  };

  const handleConfirmProposalAction = (propuesta: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    mensaje?: string;
  }) => {
    if (!counterOfferCita) return;
    if (counterOfferCita.salon_id !== salon.id) {
      showToast('Acceso no autorizado: esta cita pertenece a otro salón.');
      return;
    }
    if (onSendCounterOffer) {
      onSendCounterOffer(counterOfferCita.id, propuesta);
    } else {
      onUpdateCitaStatus(
        counterOfferCita.id,
        'PROPUESTA_ENVIADA',
        `Contraoferta enviada para el ${formatYYYYMMDDtoDDMMYYYY(propuesta.fecha)} (${propuesta.hora_inicio} a ${propuesta.hora_fin}).`
      );
    }
    showToast(`Contraoferta enviada para la cita ${counterOfferCita.codigo_cita}. El cliente tiene 24h para responder.`);
    setCounterOfferCita(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 p-4 rounded-2xl bg-purple-900 text-white shadow-2xl border border-pink-300 text-xs font-bold flex items-center gap-3 animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner with Stats Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-semibold border border-white/10">
            <Calendar className="w-3.5 h-3.5" />
            <span>Gestión de Citas del Propietario · Etapa 7</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">
            Panel de Citas — {salon.name}
          </h2>
          <p className="text-xs sm:text-sm text-purple-200">
            Revisa, confirma o rechaza las solicitudes agendadas en tu salón y mantén organizada tu jornada diaria.
          </p>
        </div>

        {/* Quick Pending Highlight */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-right">
            <span className="text-[10px] uppercase font-bold text-pink-300 block tracking-wider">
              Solicitudes Pendientes
            </span>
            <div className="flex items-center justify-end gap-2 mt-0.5">
              {counts.pending > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />}
              <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                {counts.pending}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Status Tabs (Requisitos 2 y 17) */}
      <div className="bg-white p-3 rounded-3xl border border-purple-100 shadow-xs flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TODAS'
              ? 'bg-purple-800 text-white shadow-sm'
              : 'bg-purple-50/70 text-purple-900 hover:bg-purple-100'
          }`}
        >
          <span>Todas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PENDIENTE')}
          className={`px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PENDIENTE'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <span>Pendientes</span>
          {counts.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-800 text-white font-extrabold animate-pulse">
              {counts.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CONFIRMADA')}
          className={`px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CONFIRMADA'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
          }`}
        >
          <span>Confirmadas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
            {counts.confirmed}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PROPUESTA_ENVIADA')}
          className={`px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PROPUESTA_ENVIADA'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Contraofertas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
            {counts.proposals}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('RECHAZADA')}
          className={`px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'RECHAZADA'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
          }`}
        >
          <span>Rechazadas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
            {counts.rejected}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELADA')}
          className={`px-4 py-2.5 rounded-2xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CANCELADA'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>Canceladas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold">
            {counts.cancelled}
          </span>
        </button>

        <div className="h-6 w-px bg-purple-200 mx-1 hidden sm:block" />

        {/* Tab Citas de hoy (Requisito 17) */}
        <button
          onClick={() => setActiveTab('HOY')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
            activeTab === 'HOY'
              ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md ring-2 ring-purple-300'
              : 'bg-purple-100/70 text-purple-950 hover:bg-purple-200'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-pink-500" />
          <span>Citas de hoy</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-900 text-pink-300 font-extrabold">
            {counts.today}
          </span>
        </button>
      </div>

      {/* Secondary Search & Filter Bar (Requisito 18) */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, código (TC-2026-...) o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/20"
          />
        </div>

        {/* Service Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedServiceFilter}
            onChange={(e) => setSelectedServiceFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
          >
            <option value="todos">Todos los servicios</option>
            {serviceOptions.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="w-full md:w-48">
          <input
            type="date"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
          />
        </div>

        {(searchTerm || selectedServiceFilter !== 'todos' || selectedDateFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedServiceFilter('todos');
              setSelectedDateFilter('');
            }}
            className="text-xs font-bold text-purple-700 hover:text-purple-950 px-3 py-2 cursor-pointer hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Notice for "Citas de hoy" */}
      {activeTab === 'HOY' && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Mostrando citas para el día de hoy ({formatYYYYMMDDtoDDMMYYYY(todayStr)}) ordenadas cronológicamente por hora de inicio.
            </span>
          </div>
          <span className="font-extrabold text-indigo-900 font-mono">
            {filteredAppointments.length} citas hoy
          </span>
        </div>
      )}

      {/* Appointments List (Requisito 4) */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((cita) => {
            const isPending = cita.estado === 'PENDIENTE';
            const isConfirmed = cita.estado === 'CONFIRMADA';
            const isRejected = cita.estado === 'RECHAZADA';
            const isCancelled = cita.estado === 'CANCELADA';

            return (
              <div
                key={cita.id}
                className={`bg-white rounded-3xl border shadow-xs transition-all overflow-hidden p-5 sm:p-6 ${
                  isPending
                    ? 'border-amber-200 ring-1 ring-amber-100 hover:border-amber-400'
                    : isConfirmed
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : isRejected
                    ? 'border-rose-100 opacity-90'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                {/* Header of the Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100/70 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-extrabold text-xs px-3 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-200">
                      {cita.codigo_cita}
                    </span>

                    {/* Badge de estado con colores claros */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        PENDIENTE
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        CONFIRMADA
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        RECHAZADA
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
                        <Ban className="w-3.5 h-3.5 text-slate-500" />
                        CANCELADA
                      </span>
                    )}
                    {cita.estado === 'PROPUESTA_ENVIADA' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        CONTRAOFERTA ENVIADA
                      </span>
                    )}
                    {cita.estado === 'CADUCADA' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-900 border border-red-300">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        CADUCADA (24h)
                      </span>
                    )}

                    {/* Expiration Timer for 24h window */}
                    {(cita.estado === 'PENDIENTE' || cita.estado === 'PROPUESTA_ENVIADA') && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        getRemainingExpirationTime(cita).expired
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}>
                        <Timer className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>{getRemainingExpirationTime(cita).text}</span>
                      </span>
                    )}

                    {/* Badge Solicitud Sin Ficha */}
                    {cita.tipo_reserva === 'SIN_FICHA' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-900 border border-pink-200" title="Solicitud directa sin ficha previa">
                        <Sparkles className="w-3 h-3 text-pink-600 shrink-0" />
                        <span>Sin Ficha</span>
                        {cita.preferencia_horaria && (
                          <span className="text-[9px] font-semibold text-pink-700">({cita.preferencia_horaria})</span>
                        )}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Solicitada:{' '}
                    {new Date(cita.fecha_solicitud).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Body: Grid con todos los campos requeridos (Requisito 4) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 text-xs">
                  {/* Columna 1: Cliente y Contacto */}
                  <div className="space-y-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Cliente:
                    </span>
                    <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600 shrink-0" />
                      {cita.cliente_nombre}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href={`tel:${cita.cliente_telefono}`}
                        className="flex items-center gap-1 text-slate-700 font-semibold hover:text-purple-800"
                      >
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                        <span>{cita.cliente_telefono}</span>
                      </a>

                      <a
                        href={`https://wa.me/591${cita.cliente_whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(cita.cliente_nombre)},%20te%20escribimos%20de%20${encodeURIComponent(salon.name)}%20sobre%20tu%20cita%20${cita.codigo_cita}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Columna 2: Servicio, Duración y Precio */}
                  <div className="space-y-1.5 md:border-l md:border-purple-100 md:pl-5">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Servicio:
                    </span>
                    <h5 className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      {cita.servicio_nombre}
                    </h5>
                    <div className="flex items-center gap-3 text-slate-600 pt-0.5">
                      <span>
                        Duración: <strong>{cita.duracion} min</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Precio: <strong className="text-purple-900 font-sans">Bs {cita.precio}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Columna 3: Fecha y Horario */}
                  <div className="space-y-1.5 md:border-l md:border-purple-100 md:pl-5">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Fecha y Horario:
                    </span>
                    <div className="font-serif font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      {formatYYYYMMDDtoDDMMYYYY(cita.fecha)}
                      {cita.fecha === todayStr && (
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[10px] font-extrabold ml-1">
                          ¡Hoy!
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-extrabold text-purple-950 text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      {cita.hora_inicio} - {cita.hora_fin}
                    </div>
                  </div>
                </div>

                {/* Nota del Cliente si existe */}
                {cita.nota && (
                  <div className="mb-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="italic">
                      <span className="font-bold not-italic">Nota del cliente: </span>“{cita.nota}”
                    </p>
                  </div>
                )}

                {/* Motivo de rechazo si aplica */}
                {isRejected && cita.motivo_rechazo && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="italic">
                      <span className="font-bold not-italic">Motivo del rechazo: </span>“{cita.motivo_rechazo}”
                    </p>
                  </div>
                )}

                {/* Propuesta de horario (Contraoferta) si existe */}
                {cita.propuesta && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Contraoferta enviada al cliente:</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-indigo-950">
                      {formatYYYYMMDDtoDDMMYYYY(cita.propuesta.fecha)} de {cita.propuesta.hora_inicio} a {cita.propuesta.hora_fin}
                    </div>
                    {cita.propuesta.mensaje && (
                      <p className="text-[11px] text-indigo-800 italic">“{cita.propuesta.mensaje}”</p>
                    )}
                  </div>
                )}

                {/* Action Buttons (Requisitos 4, 5, 6, 9 & 13) */}
                <div className="pt-3 border-t border-purple-100/70 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailCita(cita)}
                    className="px-4 py-2 rounded-xl border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>VER DETALLE</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Botones de decisión para citas PENDIENTES */}
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCounterOfferCita(cita)}
                          className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          title="Proponer otro horario si no puedes atender en esta fecha/hora"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>CONTRAOFERTA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectCita(cita)}
                          className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>RECHAZAR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmCita(cita)}
                          className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>CONFIRMAR</span>
                        </button>
                      </>
                    )}

                    {/* Botón para cancelar citas CONFIRMADAS */}
                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => setCancelCita(cita)}
                        className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Ban className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cancelar cita</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-purple-100 text-center space-y-3">
            <Calendar className="w-12 h-12 text-purple-300 mx-auto" />
            <h4 className="font-serif font-bold text-lg text-slate-800">
              No se encontraron citas
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedServiceFilter !== 'todos' || selectedDateFilter
                ? 'No hay citas que coincidan con los filtros y término de búsqueda aplicados.'
                : activeTab === 'HOY'
                ? 'No tienes citas agendadas para el día de hoy.'
                : 'No tienes citas en esta sección actualmente.'}
            </p>
          </div>
        )}
      </div>

      {/* MODALES CONECTADOS */}
      {/* 1. Modal Ver Detalle */}
      <AppointmentDetailModal
        isOpen={!!detailCita}
        onClose={() => setDetailCita(null)}
        cita={detailCita}
        salon={salon}
        historial={historial}
        onOpenConfirm={(c) => {
          setConfirmCita(c);
        }}
        onOpenReject={(c) => {
          setRejectCita(c);
        }}
        onOpenCancel={(c) => {
          setCancelCita(c);
        }}
        onOpenCounterOffer={(c) => {
          setCounterOfferCita(c);
        }}
      />

      {/* 2. Modal Confirmar Cita */}
      <ConfirmAppointmentModal
        isOpen={!!confirmCita}
        onClose={() => setConfirmCita(null)}
        cita={confirmCita}
        appointments={salonAppointments}
        onConfirm={handleConfirmAction}
      />

      {/* 3. Modal Rechazar Cita */}
      <RejectAppointmentModal
        isOpen={!!rejectCita}
        onClose={() => setRejectCita(null)}
        cita={rejectCita}
        onReject={handleRejectAction}
      />

      {/* 4. Modal Cancelar Cita */}
      <CancelAppointmentModal
        isOpen={!!cancelCita}
        onClose={() => setCancelCita(null)}
        cita={cancelCita}
        onCancelConfirm={handleCancelAction}
      />

      {/* 5. Modal Contraoferta (Proponer Horario Alternativo) */}
      <CounterOfferModal
        isOpen={!!counterOfferCita}
        onClose={() => setCounterOfferCita(null)}
        cita={counterOfferCita}
        salon={salon}
        scheduleConfig={scheduleConfig}
        existingAppointments={salonAppointments}
        onConfirmProposal={handleConfirmProposalAction}
      />
    </div>
  );
};
