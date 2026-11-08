import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  User,
  Scissors,
  Check,
  Ban,
  MessageCircle,
  ExternalLink,
  MapPin,
  Timer,
  ShieldCheck
} from 'lucide-react';
import { Cita, Salon } from '../types';
import {
  formatYYYYMMDDtoDDMMYYYY,
  getRemainingExpirationTime
} from '../utils/appointmentManager';

interface AppointmentTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Cita[];
  salons: Salon[];
  initialCode?: string;
  onAcceptProposal?: (citaId: string) => void;
  onRejectProposal?: (citaId: string, motivo?: string) => void;
}

export const AppointmentTrackingModal: React.FC<AppointmentTrackingModalProps> = ({
  isOpen,
  onClose,
  appointments,
  salons,
  initialCode = '',
  onAcceptProposal,
  onRejectProposal,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialCode);
  const [submittedQuery, setSubmittedQuery] = useState(initialCode.trim());
  const [searched, setSearched] = useState(Boolean(initialCode));
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialCode) {
      setSearchQuery(initialCode);
      setSubmittedQuery(initialCode.trim());
      setSearched(true);
      setSelectedCitaId(null);
      setSearchError(null);
    }
  }, [initialCode, isOpen]);

  // Filtrar citas ÚNICAMENTE contra la consulta enviada (submittedQuery), NO en tiempo real mientras escribe
  const cleanSubmitted = submittedQuery.trim().toLowerCase();
  const digitsSubmitted = cleanSubmitted.replace(/[^0-9]/g, '');

  const matchedAppointments = React.useMemo(() => {
    if (!cleanSubmitted) return [];

    return (appointments || []).filter((c) => {
      if (!c) return false;
      const code = (c.codigo_cita || '').toLowerCase();

      // 1. Si busca por código de cita
      if (cleanSubmitted.startsWith('tc') || cleanSubmitted.includes('-')) {
        return code === cleanSubmitted || code.includes(cleanSubmitted);
      }

      // 2. Si busca por número de celular: exigir coincidencia exacta del número completo (mínimo 8 dígitos)
      if (digitsSubmitted.length >= 8) {
        const telDigits = (c.cliente_telefono || '').replace(/[^0-9]/g, '');
        const waDigits = (c.cliente_whatsapp || '').replace(/[^0-9]/g, '');
        return (
          (telDigits.length >= 8 && (telDigits === digitsSubmitted || telDigits.endsWith(digitsSubmitted))) ||
          (waDigits.length >= 8 && (waDigits === digitsSubmitted || waDigits.endsWith(digitsSubmitted)))
        );
      }

      // 3. Coincidencia exacta de código
      return code === cleanSubmitted;
    });
  }, [appointments, cleanSubmitted, digitsSubmitted]);

  const activeCita = selectedCitaId
    ? (appointments || []).find((c) => c.id === selectedCitaId)
    : matchedAppointments.length === 1
    ? matchedAppointments[0]
    : null;

  const currentSalon = activeCita
    ? (salons || []).find((s) => s.id === activeCita.salon_id)
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchError('Por favor ingresa tu código de cita o tu número de celular.');
      return;
    }

    const digits = trimmed.replace(/[^0-9]/g, '');
    const isPhoneLike = /^[0-9+ -]+$/.test(trimmed);

    // Protección de privacidad: si es número de celular, exigir al menos 8 dígitos completos
    if (isPhoneLike && digits.length < 8) {
      setSearchError('Por tu privacidad, ingresa tu número de celular completo de 8 dígitos para consultar tus citas.');
      return;
    }

    setSearchError(null);
    setSubmittedQuery(trimmed);
    setSearched(true);
    setSelectedCitaId(null);
    setShowRejectInput(false);
    setActionSuccessMessage(null);
  };

  const handleAccept = (citaId: string) => {
    if (onAcceptProposal) {
      onAcceptProposal(citaId);
      setActionSuccessMessage(
        '¡Has aceptado la propuesta de horario! La cita quedó CONFIRMADA y el horario asegurado en el salón.'
      );
    }
  };

  const handleReject = (citaId: string) => {
    if (onRejectProposal) {
      onRejectProposal(citaId, rejectReason.trim() || undefined);
      setActionSuccessMessage('Has rechazado la contraoferta. La solicitud ha sido anulada.');
      setShowRejectInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-purple-300" />
              <span>Consultar y Gestionar mi Cita</span>
            </h3>
            <p className="text-xs text-purple-200 mt-0.5">
              Revisa el estado de tu solicitud, confirma contraofertas y descarga tu comprobante
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador de Cita */}
        <div className="p-4 sm:p-6 border-b border-purple-100 bg-purple-50/40 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-600 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Ingresa tu celular completo (8 dígitos) o código (ej: TC-2026-...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Buscar
            </button>
          </form>

          {searchError && (
            <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl animate-fadeIn">
              ⚠️ {searchError}
            </p>
          )}
        </div>

        {/* Mensaje de acción exitosa */}
        {actionSuccessMessage && (
          <div className="m-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Acción completada:</span>
              <span>{actionSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Contenido / Resultados */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {(!searched || !submittedQuery) && (
            <div className="text-center py-10 px-4 space-y-3 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Búsqueda privada y segura</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Para proteger la confidencialidad de las reservas en Aiquile, ingresa tu <strong>número de celular completo (8 dígitos)</strong> o tu <strong>código de cita</strong> y presiona el botón <strong>Buscar</strong>.
              </p>
            </div>
          )}

          {searched && submittedQuery && matchedAppointments.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No encontramos citas asociadas</h4>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Verifica haber escrito correctamente tu código (ej: TC-2026-00001) o tu número de celular completo de 8 dígitos.
              </p>
            </div>
          )}

          {/* Si hay múltiples coincidencias */}
          {matchedAppointments.length > 1 && !selectedCitaId && (
            <div className="space-y-2">
              <span className="font-bold text-slate-800 text-xs block">
                Se encontraron {matchedAppointments.length} solicitudes:
              </span>
              <div className="space-y-2">
                {matchedAppointments.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCitaId(c.id)}
                    className="p-3.5 rounded-2xl border border-purple-200/80 bg-white hover:bg-purple-50 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-900">{c.codigo_cita}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-slate-900">{c.salon_nombre}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {c.servicio_nombre} · {formatYYYYMMDDtoDDMMYYYY(c.fecha)} ({c.hora_inicio}–{c.hora_fin})
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.estado === 'CONFIRMADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.estado === 'PROPUESTA_ENVIADA'
                          ? 'bg-amber-100 text-amber-800'
                          : c.estado === 'PENDIENTE'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.estado === 'PROPUESTA_ENVIADA' ? 'CONTRAOFERTA' : c.estado}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarjeta de Detalle de Cita */}
          {activeCita && (
            <div className="space-y-4">
              {matchedAppointments.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedCitaId(null)}
                  className="text-purple-700 font-bold hover:underline text-[11px] cursor-pointer"
                >
                  ← Ver todas las coincidencias
                </button>
              )}

              {/* Banner de Estado */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  activeCita.estado === 'CONFIRMADA'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : activeCita.estado === 'PROPUESTA_ENVIADA'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                    : activeCita.estado === 'PENDIENTE'
                    ? 'bg-purple-50 border-purple-200 text-purple-950'
                    : activeCita.estado === 'CADUCADA'
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-500">
                    Estado de la solicitud
                  </span>
                  <h4 className="font-bold text-base flex items-center gap-2 mt-0.5">
                    {activeCita.estado === 'CONFIRMADA' && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>¡CITA CONFIRMADA!</span>
                      </>
                    )}
                    {activeCita.estado === 'PROPUESTA_ENVIADA' && (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <span>EL SALÓN TE PROPONE UN NUEVO HORARIO</span>
                      </>
                    )}
                    {activeCita.estado === 'PENDIENTE' && (
                      <>
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span>PENDIENTE DE REVISIÓN POR EL SALÓN</span>
                      </>
                    )}
                    {activeCita.estado === 'CADUCADA' && (
                      <>
                        <Timer className="w-5 h-5 text-slate-500" />
                        <span>SOLICITUD CADUCADA (24H EXPIRADAS)</span>
                      </>
                    )}
                    {activeCita.estado === 'RECHAZADA' && (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span>SOLICITUD NO ACEPTADA</span>
                      </>
                    )}
                    {activeCita.estado === 'CANCELADA' && (
                      <>
                        <Ban className="w-5 h-5 text-slate-500" />
                        <span>SOLICITUD CANCELADA</span>
                      </>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Código único: <strong className="font-mono text-purple-900">{activeCita.codigo_cita}</strong>
                    {activeCita.tipo_reserva === 'SIN_FICHA' && (
                      <span className="ml-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        Solicitud sin ficha previa
                      </span>
                    )}
                  </p>
                </div>

                {/* Contador de tiempo restante si aplica */}
                {(activeCita.estado === 'PENDIENTE' || activeCita.estado === 'PROPUESTA_ENVIADA') && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200/80 shrink-0 self-start sm:self-auto text-right">
                    <span className="text-[10px] text-slate-500 block">Plazo de 24 horas:</span>
                    <span className="text-xs font-mono font-extrabold text-purple-900">
                      {getRemainingExpirationTime(activeCita).text}
                    </span>
                  </div>
                )}
              </div>

              {/* SECCIÓN ESPECIAL: CONTRAOFERTA DEL PROPIETARIO */}
              {activeCita.estado === 'PROPUESTA_ENVIADA' && activeCita.propuesta && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-950 space-y-4 shadow-md animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <h5 className="font-serif font-bold text-sm text-amber-950">
                        Contraoferta del salón para tu atención
                      </h5>
                      <p className="text-xs text-amber-900 mt-0.5">
                        El estilista no puede atenderte en tu hora original, pero te propone el siguiente horario para confirmar tu cita:
                      </p>
                    </div>
                  </div>

                  {/* Comparación de horarios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white border border-amber-200 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold uppercase">
                        Tu solicitud original:
                      </span>
                      <span className="text-slate-600 font-mono block line-through">
                        {formatYYYYMMDDtoDDMMYYYY(activeCita.fecha)} ({activeCita.hora_inicio}–{activeCita.hora_fin})
                      </span>
                    </div>

                    <div>
                      <span className="text-amber-800 text-[10px] block font-bold uppercase">
                        ★ Nuevo horario propuesto:
                      </span>
                      <span className="text-amber-950 font-mono font-extrabold text-sm block">
                        {formatYYYYMMDDtoDDMMYYYY(activeCita.propuesta.fecha)} (
                        {activeCita.propuesta.hora_inicio}–{activeCita.propuesta.hora_fin})
                      </span>
                    </div>
                  </div>

                  {/* Mensaje del dueño */}
                  {activeCita.propuesta.mensaje && (
                    <div className="p-3 rounded-xl bg-white/70 border border-amber-200/80 text-xs text-amber-900 italic">
                      <span className="font-bold not-italic text-amber-950">Mensaje del salón: </span>
                      “{activeCita.propuesta.mensaje}”
                    </div>
                  )}

                  {/* Formulario de rechazo opcional */}
                  {showRejectInput && (
                    <div className="p-3.5 rounded-2xl bg-white border border-rose-200 space-y-2 animate-fadeIn">
                      <label className="font-bold text-slate-800 text-xs block">
                        Motivo por el cual no puedes asistir (opcional):
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Ej: No me queda cómodo ese horario, gracias"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(activeCita.id)}
                          className="px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800"
                        >
                          Confirmar rechazo de contraoferta
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botones para Aceptar o Rechazar */}
                  {!showRejectInput && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(activeCita.id)}
                        className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aceptar propuesta de horario</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRejectInput(true)}
                        className="w-full sm:w-auto py-3 px-4 rounded-2xl border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Rechazar propuesta</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Detalle del Salón y Servicio */}
              <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Salón de Belleza:</span>
                    <span className="font-bold text-slate-900 text-sm block">{activeCita.salon_nombre}</span>
                    {currentSalon && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        {currentSalon.address}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Servicio solicitado:</span>
                    <span className="font-bold text-purple-900 text-sm block flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5 text-purple-600" />
                      {activeCita.servicio_nombre}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Duración: <strong>{activeCita.duracion} min</strong> · Precio: <strong>Bs {activeCita.precio}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha y Hora:</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {formatYYYYMMDDtoDDMMYYYY(activeCita.fecha)} ({activeCita.hora_inicio} a {activeCita.hora_fin})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cliente registrado:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-600" />
                      {activeCita.cliente_nombre} ({activeCita.cliente_telefono})
                    </span>
                  </div>
                </div>

                {activeCita.motivo_rechazo && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                    <span className="font-bold block">Motivo indicado por el salón:</span>
                    <p className="italic">“{activeCita.motivo_rechazo}”</p>
                  </div>
                )}
              </div>

              {/* Botón WhatsApp con el salón si está disponible */}
              {currentSalon && currentSalon.whatsapp && (
                <div className="flex justify-end pt-2">
                  <a
                    href={`https://wa.me/591${(currentSalon.whatsapp || '').replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(currentSalon.name || 'Salón')},%20te%20escribo%20sobre%20mi%20cita%20código%20${encodeURIComponent(activeCita.codigo_cita || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contactar al salón por WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-100 flex items-center justify-end bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
