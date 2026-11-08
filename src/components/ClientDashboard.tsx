import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  Phone,
  MapPin,
  Sparkles,
  MessageCircle,
  X,
  Check,
  Scissors,
  ChevronRight,
  LogOut,
  ArrowLeft,
  FileText,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  CalendarCheck,
  Store,
  Star,
  RefreshCw,
  Copy,
  Lock
} from 'lucide-react';
import type {
  User,
  Cita,
  Salon,
  ServiceItem,
  SalonScheduleConfig,
  FichaAtencion,
  CitaEstado
} from '../types';
import {
  formatYYYYMMDDtoDDMMYYYY,
  getTimeRemaining,
  isAppointmentExpired
} from '../utils/appointmentManager';
import { BookingModal } from './BookingModal';
import { createDefaultSalonSchedule } from '../utils/scheduleGenerator';

interface ClientDashboardProps {
  currentUser: User;
  appointments: Cita[];
  salons: Salon[];
  allServices: ServiceItem[];
  salonSchedules: Record<string, SalonScheduleConfig>;
  fichas: FichaAtencion[];
  onLogout: () => void;
  onNavigateHome: () => void;
  onViewSalonPublic: (salon: Salon) => void;
  onAcceptCounterOffer: (citaId: string) => void;
  onRejectCounterOffer: (citaId: string, motivo?: string) => void;
  onAddAppointment: (newCita: Cita) => void;
  onOpenTracking: (codigo?: string) => void;
  onUpdateUserPassword?: (userId: string, newPass: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  appointments,
  salons,
  allServices,
  salonSchedules,
  fichas,
  onLogout,
  onNavigateHome,
  onViewSalonPublic,
  onAcceptCounterOffer,
  onRejectCounterOffer,
  onAddAppointment,
  onOpenTracking,
  onUpdateUserPassword,
}) => {
  const [activeTab, setActiveTab] = useState<'citas' | 'pedir-fichas' | 'perfil'>('citas');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Rejection modal state for counteroffers
  const [rejectingCitaId, setRejectingCitaId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Booking Modal directly from Client Dashboard
  const [bookingSalon, setBookingSalon] = useState<Salon | null>(null);
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);

  // Password update in profile
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Filter client appointments: by cliente_id, or phone, or email match
  const clientAppointments = useMemo(() => {
    const userPhoneClean = (currentUser.telefono || '').replace(/\D/g, '');
    const userEmailClean = (currentUser.correo || '').toLowerCase().trim();
    const userNameClean = `${currentUser.nombre} ${currentUser.apellido}`.toLowerCase().trim();

    return appointments
      .filter((c) => {
        if (c.cliente_id && c.cliente_id === currentUser.id) return true;
        if (userPhoneClean && c.cliente_telefono && c.cliente_telefono.replace(/\D/g, '').includes(userPhoneClean)) {
          return true;
        }
        if (userPhoneClean && c.cliente_whatsapp && c.cliente_whatsapp.replace(/\D/g, '').includes(userPhoneClean)) {
          return true;
        }
        if (userEmailClean && c.cliente_correo && c.cliente_correo.toLowerCase().trim() === userEmailClean) {
          return true;
        }
        if (userNameClean && c.cliente_nombre && c.cliente_nombre.toLowerCase().trim() === userNameClean) {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.fecha_solicitud || '').getTime() - new Date(a.fecha_solicitud || '').getTime());
  }, [appointments, currentUser]);

  // Specific groups of appointments
  const counterOffers = useMemo(() => {
    return clientAppointments.filter((c) => c.estado === 'PROPUESTA_ENVIADA');
  }, [clientAppointments]);

  const confirmedAppointments = useMemo(() => {
    return clientAppointments.filter((c) => c.estado === 'CONFIRMADA');
  }, [clientAppointments]);

  const pendingAppointments = useMemo(() => {
    return clientAppointments.filter((c) => c.estado === 'PENDIENTE');
  }, [clientAppointments]);

  const otherAppointments = useMemo(() => {
    return clientAppointments.filter(
      (c) => c.estado === 'CANCELADA' || c.estado === 'RECHAZADA' || c.estado === 'CADUCADA'
    );
  }, [clientAppointments]);

  // Filtered list based on pill
  const displayedAppointments = useMemo(() => {
    if (filterStatus === 'todos') return clientAppointments;
    if (filterStatus === 'propuestas') return counterOffers;
    if (filterStatus === 'confirmadas') return confirmedAppointments;
    if (filterStatus === 'pendientes') return pendingAppointments;
    if (filterStatus === 'historial') return otherAppointments;
    return clientAppointments;
  }, [filterStatus, clientAppointments, counterOffers, confirmedAppointments, pendingAppointments, otherAppointments]);

  // Salons available for booking
  const activeSalons = useMemo(() => {
    return salons.filter((s) => s.estado === 'activo');
  }, [salons]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenSalonBooking = (salon: Salon) => {
    const salonServices = allServices.filter((s) => s.salonId === salon.id && s.status === 'activo');
    setBookingSalon(salon);
    setBookingService(salonServices.length > 0 ? salonServices[0] : null);
  };

  const handleConfirmReject = () => {
    if (rejectingCitaId) {
      onRejectCounterOffer(rejectingCitaId, rejectReason.trim() || undefined);
      setRejectingCitaId(null);
      setRejectReason('');
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) return;
    if (onUpdateUserPassword) {
      onUpdateUserPassword(currentUser.id, newPassword);
      setPasswordUpdated(true);
      setNewPassword('');
      setTimeout(() => setPasswordUpdated(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Client Top Header */}
      <header className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-950 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-purple-200 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ir a TuCita</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-base shadow-md shadow-purple-900/40">
                {currentUser.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight">
                    {currentUser.nombre} {currentUser.apellido}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Panel Cliente
                  </span>
                </div>
                <p className="text-xs text-purple-200/80">
                  {currentUser.telefono ? `Cel / WA: ${currentUser.telefono}` : currentUser.correo}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setActiveTab('pedir-fichas')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:-translate-y-0.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Pedir Cita / Ficha</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-200 text-purple-200 text-xs font-semibold transition-colors cursor-pointer border border-white/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-purple-800/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('citas')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'citas'
                ? 'border-pink-400 text-white bg-white/5'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-pink-400" />
            <span>Mis Citas y Confirmaciones</span>
            {counterOffers.length > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                {counterOffers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pedir-fichas')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pedir-fichas'
                ? 'border-pink-400 text-white bg-white/5'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4 text-pink-400" />
            <span>Salones y Fichas Disponibles ({activeSalons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'perfil'
                ? 'border-pink-400 text-white bg-white/5'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4 text-pink-400" />
            <span>Mi Perfil</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ========================================================================= */}
        {/* TAB 1: MIS CITAS, CONFIRMACIONES Y CONTRAOFERTAS                         */}
        {/* ========================================================================= */}
        {activeTab === 'citas' && (
          <div className="space-y-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  {clientAppointments.length}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Citas</div>
                  <div className="text-sm font-extrabold text-slate-900">Registradas</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {confirmedAppointments.length}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Confirmadas</div>
                  <div className="text-sm font-extrabold text-slate-900">Aseguradas ✓</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  {counterOffers.length}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Contraofertas</div>
                  <div className="text-sm font-extrabold text-slate-900">Por Responder</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {pendingAppointments.length}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">En Espera</div>
                  <div className="text-sm font-extrabold text-slate-900">24h Límite</div>
                </div>
              </div>
            </div>

            {/* SECCIÓN PRIORITARIA: CONTRAOFERTAS PENDIENTES */}
            {counterOffers.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 rounded-3xl border-2 border-amber-300 space-y-4 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-amber-950 flex items-center gap-2">
                      <span>¡Tienes una Contraoferta de Horario Pendiente!</span>
                      <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        Requiere tu respuesta
                      </span>
                    </h2>
                    <p className="text-xs text-amber-900/80">
                      El propietario del salón no puede en el horario inicial y te propone un nuevo día u hora.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {counterOffers.map((cita) => {
                    const prop = cita.propuesta_propietario || cita.propuesta;
                    const expirationIso = cita.fecha_expiracion || prop?.fecha_expiracion_propuesta;
                    const remainingStr = expirationIso ? getTimeRemaining(expirationIso) : '';

                    return (
                      <div
                        key={cita.id}
                        className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-100">
                          <div>
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                              Solicitud #{cita.codigo_cita} · {cita.salon_nombre}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{cita.servicio_nombre}</h3>
                          </div>
                          {remainingStr && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Expira en: {remainingStr}</span>
                            </div>
                          )}
                        </div>

                        {/* Proposal Details Box */}
                        {prop && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                            <div className="space-y-1">
                              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                Tu Horario Solicitado Original:
                              </div>
                              <div className="text-xs font-medium text-slate-700 line-through">
                                {formatYYYYMMDDtoDDMMYYYY(cita.fecha)} ({cita.hora_inicio} - {cita.hora_fin})
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Nuevo Horario Propuesto por el Salón:</span>
                              </div>
                              <div className="text-sm font-extrabold text-emerald-950">
                                {formatYYYYMMDDtoDDMMYYYY(prop.fecha_propuesta || prop.fecha)} ({prop.hora_inicio} - {prop.hora_fin})
                              </div>
                            </div>

                            {prop.mensaje && (
                              <div className="md:col-span-2 pt-2 border-t border-amber-200/60 mt-1">
                                <div className="text-[11px] font-bold text-amber-900 mb-0.5">
                                  Mensaje del Salón:
                                </div>
                                <p className="text-xs italic text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                                  “{prop.mensaje}”
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Accept or Reject Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
                          <button
                            onClick={() => {
                              setRejectingCitaId(cita.id);
                              setRejectReason('');
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>Rechazar Propuesta</span>
                          </button>

                          <button
                            onClick={() => onAcceptCounterOffer(cita.id)}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>Aceptar Contraoferta (Confirmar Cita)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Pills for Appointments */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'todos', label: 'Todas las Citas' },
                  { id: 'confirmadas', label: `Confirmadas (${confirmedAppointments.length})` },
                  { id: 'propuestas', label: `Contraofertas (${counterOffers.length})` },
                  { id: 'pendientes', label: `En Espera (${pendingAppointments.length})` },
                  { id: 'historial', label: `Historial (${otherAppointments.length})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setFilterStatus(pill.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      filterStatus === pill.id
                        ? 'bg-purple-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onOpenTracking()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                <span>Rastrear por Código Externo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* List of Appointments */}
            {displayedAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">
                    No tienes citas en esta sección
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Explora los salones de belleza activos de Aiquile y reserva tu ficha de atención o solicita un horario directo.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('pedir-fichas')}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver Salones Disponibles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedAppointments.map((cita) => {
                  const salon = salons.find((s) => s.id === cita.salon_id);
                  const isConfirmed = cita.estado === 'CONFIRMADA';
                  const isPending = cita.estado === 'PENDIENTE';
                  const isProposal = cita.estado === 'PROPUESTA_ENVIADA';
                  const isCancelled = cita.estado === 'CANCELADA' || cita.estado === 'RECHAZADA' || cita.estado === 'CADUCADA';

                  return (
                    <div
                      key={cita.id}
                      className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                        isConfirmed
                          ? 'border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                          : isProposal
                          ? 'border-amber-300 shadow-xs'
                          : isPending
                          ? 'border-blue-200'
                          : 'border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header Badge & Code */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-extrabold text-slate-500 tracking-wider">
                              CÓDIGO:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                {cita.codigo_cita}
                              </span>
                              <button
                                onClick={() => handleCopyCode(cita.codigo_cita)}
                                className="p-1 text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
                                title="Copiar código de cita"
                              >
                                {copiedCode === cita.codigo_cita ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            {isConfirmed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                CONFIRMADA
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                <Clock className="w-3 h-3 text-blue-600" />
                                PENDIENTE (24h)
                              </span>
                            )}
                            {isProposal && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                CONTRAOFERTA
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <X className="w-3 h-3 text-rose-600" />
                                {cita.estado}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Salon and Service Title */}
                        <div>
                          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                            {cita.salon_nombre}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {cita.servicio_nombre}
                          </h4>
                        </div>

                        {/* Schedule & Price details */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              Fecha:
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatYYYYMMDDtoDDMMYYYY(cita.fecha)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              Horario:
                            </span>
                            <span className="font-bold text-slate-900">
                              {cita.hora_inicio} - {cita.hora_fin} ({cita.duracion} min)
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500 font-medium">Precio estimado:</span>
                            <span className="font-extrabold text-purple-900 text-sm">
                              Bs {cita.precio}
                            </span>
                          </div>
                        </div>

                        {/* Rejection / Expiration note if any */}
                        {cita.motivo_rechazo && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                            <span className="font-bold">Motivo: </span>
                            <span>{cita.motivo_rechazo}</span>
                          </div>
                        )}

                        {/* Notes if any */}
                        {cita.nota && (
                          <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                            “{cita.nota}”
                          </p>
                        )}
                      </div>

                      {/* Action buttons at bottom */}
                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {salon && (
                          <button
                            onClick={() => onViewSalonPublic(salon)}
                            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver Salón</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isConfirmed && salon && (
                          <a
                            href={`https://wa.me/591${(salon.whatsapp || salon.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hola ${salon.name}, tengo la cita confirmada #${cita.codigo_cita} para ${cita.servicio_nombre} el día ${formatYYYYMMDDtoDDMMYYYY(cita.fecha)} a las ${cita.hora_inicio}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp del Salón</span>
                          </a>
                        )}

                        {isProposal && (
                          <button
                            onClick={() => onAcceptCounterOffer(cita.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Aceptar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PEDIR FICHAS Y SALONES DISPONIBLES                                  */}
        {/* ========================================================================= */}
        {activeTab === 'pedir-fichas' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 text-white space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-pink-300">
                Reserva Directa y Fichas de Atención
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-extrabold">
                Pide tu Ficha en los Salones Disponibles
              </h2>
              <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
                Selecciona cualquier salón activo de Aiquile. Tus datos se autocompletarán de forma automática para que asegurar tu turno sea rápido y sin complicaciones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeSalons.map((salon) => {
                const salonFichas = fichas.filter(
                  (f) => f.salon_id === salon.id && f.estado === 'DISPONIBLE'
                );
                const salonServices = allServices.filter(
                  (s) => s.salonId === salon.id && s.status === 'activo'
                );

                return (
                  <div
                    key={salon.id}
                    className="bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="relative h-44 overflow-hidden bg-slate-100">
                        <img
                          src={salon.coverImage}
                          alt={salon.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-extrabold text-purple-900 flex items-center gap-1 shadow-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{salon.rating.toFixed(1)}</span>
                        </div>
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                          {salonFichas.length > 0 ? `${salonFichas.length} Fichas Libres` : 'Solicitud Directa'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{salon.name}</h3>
                          <p className="text-xs text-purple-700 italic">{salon.tagline}</p>
                        </div>

                        <div className="text-xs text-slate-600 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{salon.address}</span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{salon.phone}</span>
                        </div>

                        {/* Top services badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {salonServices.slice(0, 3).map((srv) => (
                            <span
                              key={srv.id}
                              className="text-[10px] font-semibold bg-purple-50 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-100"
                            >
                              {srv.name} (Bs {srv.price})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Booking Trigger Button */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => handleOpenSalonBooking(salon)}
                        className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-purple-900/10 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        <span>Pedir Cita / Ficha en este Salón</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MI PERFIL Y SEGURIDAD                                              */}
        {/* ========================================================================= */}
        {activeTab === 'perfil' && (
          <div className="max-w-xl mx-auto space-y-6">
            {/* User Info Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-purple-900/20">
                  {currentUser.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentUser.nombre} {currentUser.apellido}
                  </h2>
                  <p className="text-xs text-slate-500">Usuario: @{currentUser.usuario}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-md">
                    Cuenta de Cliente TuCita
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Celular / WhatsApp:</span>
                  <span className="font-bold text-slate-800">{currentUser.telefono || 'No registrado'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Correo Electrónico:</span>
                  <span className="font-bold text-slate-800">{currentUser.correo || 'No registrado'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Estado de Cuenta:</span>
                  <span className="font-bold text-emerald-600 uppercase">Activa ✓</span>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900">
                <Lock className="w-5 h-5 text-purple-700" />
                <h3 className="text-sm font-bold">Cambiar mi Contraseña</h3>
              </div>

              {passwordUpdated && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Contraseña actualizada correctamente.</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-600">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres..."
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Guardar Nueva Contraseña
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal to Reject Counteroffer */}
      {rejectingCitaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-rose-600" />
                <span>Rechazar Contraoferta</span>
              </h3>
              <button
                onClick={() => setRejectingCitaId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              ¿Estás seguro de que no deseas aceptar este nuevo horario? La solicitud quedará anulada y el salón será notificado.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Motivo del rechazo (opcional):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ej. No puedo en ese horario, pediré otro día..."
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCitaId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal invoked from Client Dashboard */}
      {bookingSalon && bookingService && (
        <BookingModal
          isOpen={!!bookingSalon}
          onClose={() => {
            setBookingSalon(null);
            setBookingService(null);
          }}
          salon={bookingSalon}
          service={bookingService}
          scheduleConfig={salonSchedules[bookingSalon.id] || createDefaultSalonSchedule(bookingSalon.id)}
          existingAppointments={appointments}
          fichas={fichas}
          currentUser={currentUser}
          onConfirmBooking={(newCita) => {
            onAddAppointment(newCita);
            setBookingSalon(null);
            setBookingService(null);
            setActiveTab('citas');
          }}
          onOpenTracking={onOpenTracking}
        />
      )}
    </div>
  );
};
