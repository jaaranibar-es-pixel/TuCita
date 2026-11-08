import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
  Upload,
  FileText,
  Eye,
  X,
  History,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Ban
} from 'lucide-react';
import {
  Salon,
  User,
  Suscripcion,
  PagoSuscripcion,
  ConfiguracionPago,
  TipoPlan,
  NotificacionInterna
} from '../types';
import {
  calculateRemainingDays,
  getExpirationAlert,
  formatISODateToDDMMYYYY
} from '../utils/subscriptionManager';
import { SAMPLE_COMPROBANTE_IMG } from '../data/mockSubscriptions';
import { compressImageFile } from '../utils/imageCompressor';

interface OwnerSubscriptionManagerProps {
  salon: Salon;
  currentUser: User;
  suscripcion: Suscripcion | undefined;
  pagos: PagoSuscripcion[];
  configPago: ConfiguracionPago;
  onRegistrarPago: (nuevoPago: Omit<PagoSuscripcion, 'id' | 'estado'>) => void;
}

export const OwnerSubscriptionManager: React.FC<OwnerSubscriptionManagerProps> = ({
  salon,
  currentUser,
  suscripcion,
  pagos,
  configPago,
  onRegistrarPago,
}) => {
  // Plan selection state: defaults to MENSUAL (Bs 100) or ANUAL (Bs 1100)
  const [selectedPlan, setSelectedPlan] = useState<TipoPlan>(
    suscripcion?.tipo_plan || 'MENSUAL'
  );

  // Form states for registering payment
  const [formRefNumber, setFormRefNumber] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formObservacion, setFormObservacion] = useState('');
  const [comprobantePreview, setComprobantePreview] = useState<string>(SAMPLE_COMPROBANTE_IMG);
  const [isCustomUpload, setIsCustomUpload] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal to inspect receipt image
  const [viewReceiptModal, setViewReceiptModal] = useState<string | null>(null);

  // Días restantes y alertas
  const daysRemaining = useMemo(() => {
    return suscripcion ? calculateRemainingDays(suscripcion.fecha_vencimiento) : 0;
  }, [suscripcion]);

  const alertInfo = useMemo(() => {
    return suscripcion ? getExpirationAlert(daysRemaining) : null;
  }, [suscripcion, daysRemaining]);

  // Historial de pagos exclusivo de este salón (Requisito 26 & 29)
  const salonPagos = useMemo(() => {
    return pagos.filter((p) => p.salon_id === salon.id);
  }, [pagos, salon.id]);

  // Comprobar si ya existe un pago pendiente de validación (Requisito 24: Evitar doble renovación)
  const hasPendingValidationPayment = useMemo(() => {
    return salonPagos.some((p) => p.estado === 'PENDIENTE');
  }, [salonPagos]);

  const activeAmount = selectedPlan === 'MENSUAL' ? configPago.precio_mensual : configPago.precio_anual;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setFormError('Formato no permitido. Solo se aceptan imágenes JPG, JPEG, PNG o WEBP.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 1000, 1000, 0.72);
        setComprobantePreview(compressed);
        setIsCustomUpload(true);
        setFormError('');
      } catch (err) {
        console.warn('Error comprimiendo comprobante:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setComprobantePreview(reader.result as string);
          setIsCustomUpload(true);
          setFormError('');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleEnviarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPendingValidationPayment) {
      setFormError('Ya tienes un pago pendiente de validación. Espera a que el administrador lo verifique.');
      return;
    }

    if (!formRefNumber.trim()) {
      setFormError('Por favor ingresa el número de referencia o código de comprobante.');
      return;
    }

    if (!comprobantePreview) {
      setFormError('Por favor adjunta la imagen del comprobante de transferencia.');
      return;
    }

    onRegistrarPago({
      suscripcion_id: suscripcion?.id || `sub-${salon.id}`,
      salon_id: salon.id,
      propietario_id: currentUser.id,
      tipo_plan: selectedPlan,
      monto: activeAmount,
      fecha_pago: formDate,
      referencia: formRefNumber.trim().toUpperCase(),
      comprobante: comprobantePreview,
      observacion: formObservacion.trim() || undefined,
    });

    setSuccessToast(
      '¡Tu pago fue enviado correctamente! El administrador lo verificará para activar o renovar tu suscripción.'
    );
    setFormRefNumber('');
    setFormObservacion('');
    setFormError('');
    setTimeout(() => setSuccessToast(null), 6000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Feedback */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-start gap-3 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold block text-sm">Comprobante enviado exitosamente</span>
            <p className="font-normal text-slate-700">{successToast}</p>
          </div>
        </div>
      )}

      {/* Banner de Estado de Suscripción Actual (Requisitos 2, 3, 4, 5) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-bold border border-white/10">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Módulo de Suscripción · {salon.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">
            Estado de Membresía del Salón
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
            Tu suscripción te permite mantener tu catálogo público disponible y recibir solicitudes de reservas en TuCita.
          </p>
        </div>

        {/* Badge de Estado Actual */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-2xl shrink-0 text-right">
          <span className="text-[10px] uppercase font-bold text-pink-300 tracking-wider block">
            Estado de Suscripción
          </span>
          <div className="mt-1 flex items-center justify-end gap-2">
            {suscripcion?.estado === 'ACTIVA' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ACTIVA
              </span>
            )}
            {suscripcion?.estado === 'PENDIENTE DE VALIDACIÓN' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-purple-950 shadow-xs animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                PENDIENTE DE VALIDACIÓN
              </span>
            )}
            {suscripcion?.estado === 'PENDIENTE DE PAGO' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                PENDIENTE DE PAGO
              </span>
            )}
            {suscripcion?.estado === 'VENCIDA' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500 text-white shadow-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                VENCIDA
              </span>
            )}
            {suscripcion?.estado === 'SUSPENDIDA' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-xs">
                <Ban className="w-3.5 h-3.5" />
                SUSPENDIDA
              </span>
            )}
            {!suscripcion && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-300 text-slate-800">
                SIN SUSCRIPCIÓN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Vencimiento Preventiva (Requisito 19 & 20) */}
      {alertInfo && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-xs ${
            alertInfo.type === 'expired'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : alertInfo.type === 'danger'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : alertInfo.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-purple-50 border-purple-200 text-purple-950'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              alertInfo.type === 'expired' || alertInfo.type === 'danger'
                ? 'text-rose-600'
                : 'text-amber-600'
            }`}
          />
          <div className="space-y-0.5">
            <span className="font-bold text-sm block">Aviso de Vencimiento</span>
            <p>{alertInfo.message}</p>
          </div>
        </div>
      )}

      {/* Tarjeta de Detalles de la Suscripción Actual (Requisitos 4 y 5) */}
      {suscripcion && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-purple-100 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-purple-100 pb-2">
            Detalles de tu Suscripción
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-purple-50/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Modalidad de Plan
              </span>
              <span className="font-extrabold text-slate-900 text-sm block">
                {suscripcion.tipo_plan === 'MENSUAL' ? 'Plan Mensual' : 'Plan Anual'}
              </span>
              <span className="text-[11px] text-purple-700 font-bold">
                Bs {suscripcion.monto} {suscripcion.tipo_plan === 'MENSUAL' ? '/ mes' : '/ año'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Fecha de Inicio
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm block">
                {formatISODateToDDMMYYYY(suscripcion.fecha_inicio)}
              </span>
              <span className="text-[10px] text-slate-500">Activación oficial</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Fecha de Vencimiento
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm block">
                {formatISODateToDDMMYYYY(suscripcion.fecha_vencimiento)}
              </span>
              <span className="text-[10px] text-slate-500">Próxima renovación</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Días Restantes
              </span>
              <span
                className={`font-mono text-xl font-extrabold block ${
                  daysRemaining <= 3 ? 'text-rose-600' : 'text-purple-950'
                }`}
              >
                {daysRemaining > 0 ? `${daysRemaining} días` : '0 días'}
              </span>
              <span className="text-[10px] text-slate-500">Cálculo en tiempo real</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SELECCIÓN DE PLANES Y PAGO POR QR (Requisitos 1, 6, 8, 36) */}
      {/* ======================================================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs space-y-6">
        <div>
          <h3 className="font-serif font-bold text-xl text-slate-900">
            Pagar o Renovar Suscripción
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selecciona la modalidad de tu preferencia, escanea el código QR oficial de TuCita y sube tu comprobante.
          </p>
        </div>

        {/* 1. SELECCIÓN DE PLAN (Requisitos 1 y 36: SOLO DOS MODALIDADES) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan Mensual */}
          <div
            onClick={() => setSelectedPlan('MENSUAL')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3 relative ${
              selectedPlan === 'MENSUAL'
                ? 'border-purple-600 bg-purple-50/40 shadow-sm ring-2 ring-purple-200'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-900">
                PLAN MENSUAL
              </span>
              <input
                type="radio"
                checked={selectedPlan === 'MENSUAL'}
                onChange={() => setSelectedPlan('MENSUAL')}
                className="w-4 h-4 text-purple-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="text-3xl font-extrabold text-purple-950 font-sans">
                Bs {configPago.precio_mensual}
                <span className="text-xs font-normal text-slate-500"> / mes</span>
              </div>
              <span className="text-xs text-slate-600 block mt-0.5">Duración: 1 mes completo</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Ideal para renovaciones mes a mes con máxima flexibilidad para tu salón.
            </p>
          </div>

          {/* Plan Anual */}
          <div
            onClick={() => setSelectedPlan('ANUAL')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3 relative ${
              selectedPlan === 'ANUAL'
                ? 'border-purple-600 bg-purple-50/40 shadow-sm ring-2 ring-purple-200'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 text-white uppercase tracking-wider shadow-xs">
              ¡Ahorras Bs 100! (1 mes gratis)
            </span>

            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-900">
                PLAN ANUAL
              </span>
              <input
                type="radio"
                checked={selectedPlan === 'ANUAL'}
                onChange={() => setSelectedPlan('ANUAL')}
                className="w-4 h-4 text-purple-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="text-3xl font-extrabold text-purple-950 font-sans">
                Bs {configPago.precio_anual}
                <span className="text-xs font-normal text-slate-500"> / año</span>
              </div>
              <span className="text-xs text-slate-600 block mt-0.5">Duración: 12 meses completos</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Pago único anual con descuento directo garantizado. Despreocúpate de pagos mensuales durante todo el año.
            </p>
          </div>
        </div>

        {/* 2. CÓDIGO QR Y DATOS BANCARIOS (Requisitos 6 y 7) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-purple-50/50 border border-purple-100 items-center">
          {/* QR Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-purple-200 shadow-xs">
            <img
              src={configPago.qr_imagen}
              alt="QR Oficial de Pago TuCita"
              className="w-52 h-52 object-contain rounded-xl"
            />
            <span className="text-[10px] text-slate-400 font-mono mt-2 block">
              Escanea desde cualquier app bancaria
            </span>
          </div>

          {/* Bank Instructions */}
          <div className="md:col-span-8 space-y-3 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-700 block">
              Datos para Transferencia / QR Oficial
            </span>
            <h4 className="font-serif font-bold text-lg text-purple-950">
              Pago de Suscripción TuCita
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">Banco:</span>
                <span className="font-bold text-slate-900">{configPago.banco_nombre}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">Titular de la Cuenta:</span>
                <span className="font-bold text-slate-900">{configPago.titular_cuenta}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-0.5 sm:col-span-2">
                <span className="text-[10px] text-slate-400 block font-bold">Nro. de Cuenta Corriente:</span>
                <span className="font-mono font-extrabold text-purple-950 text-sm tracking-wide">
                  {configPago.numero_cuenta}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-100/70 border border-purple-200 text-purple-900 text-[11px] flex items-center justify-between">
              <span>Monto a transferir para <strong>{selectedPlan}</strong>:</span>
              <span className="text-base font-extrabold text-purple-950 font-mono">
                Bs {activeAmount}
              </span>
            </div>
          </div>
        </div>

        {/* 3. FORMULARIO REGISTRAR PAGO (Requisitos 8, 9, 10, 24) */}
        <div className="space-y-4 pt-2 border-t border-purple-100">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-lg text-slate-900">
              Registrar Comprobante de Pago
            </h4>
            <span className="text-[11px] text-slate-400">Paso final para validación</span>
          </div>

          {/* Advertencia si ya tiene un pago pendiente de validación (Requisito 24) */}
          {hasPendingValidationPayment ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-sm">Ya tienes un pago pendiente de validación</span>
                <p>
                  Tu último comprobante ya fue recibido y está en cola de revisión por el administrador de TuCita.
                  No es necesario registrar otro pago en este momento.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEnviarPago} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Plan Seleccionado</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedPlan} (Bs ${activeAmount})`}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-slate-100 font-bold text-purple-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Fecha del Pago *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">
                    Nro. de Referencia / Comprobante *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: REF-2026-984210"
                    value={formRefNumber}
                    onChange={(e) => setFormRefNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Subida de Comprobante (Requisito 10) */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  Imagen del Comprobante (JPG, JPEG, PNG, WEBP) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-2xl hover:border-purple-500 cursor-pointer bg-purple-50/30 transition-all">
                      <Upload className="w-6 h-6 text-purple-600 mb-1" />
                      <span className="font-bold text-purple-900 text-xs">Seleccionar imagen</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Desde tu teléfono o PC</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Vista Previa del Comprobante */}
                  {comprobantePreview && (
                    <div className="sm:col-span-8 flex items-center gap-4 p-3 bg-white border border-purple-200 rounded-2xl">
                      <img
                        src={comprobantePreview}
                        alt="Vista previa del comprobante"
                        className="w-20 h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90"
                        onClick={() => setViewReceiptModal(comprobantePreview)}
                        title="Haz clic para ampliar"
                      />
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-900 block">
                          {isCustomUpload ? 'Comprobante personalizado cargado' : 'Comprobante de demostración listo'}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Haz clic sobre la miniatura para visualizarlo en tamaño completo.
                        </p>
                        <button
                          type="button"
                          onClick={() => setViewReceiptModal(comprobantePreview)}
                          className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold text-[11px] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ampliar imagen</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Observación Opcional */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Observación o nota adicional (opcional)</label>
                <input
                  type="text"
                  placeholder="ej: Pago realizado desde cuenta de Paola Morales - Banco Unión"
                  value={formObservacion}
                  onChange={(e) => setFormObservacion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs"
                />
              </div>

              {/* Botón de Envío */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ENVIAR PAGO PARA VALIDACIÓN</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* HISTORIAL DE PAGOS (Requisito 26)                         */}
      {/* ======================================================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="space-y-0.5">
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-700" />
              <span>Historial de Pagos del Salón</span>
            </h3>
            <p className="text-xs text-slate-500">
              Registro auditado de transferencias y comprobantes presentados a TuCita.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono font-bold">
            {salonPagos.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-purple-50/80 border-b border-purple-100 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                <th className="py-3 px-4">Fecha Pago</th>
                <th className="py-3 px-3">Plan y Monto</th>
                <th className="py-3 px-3">Referencia</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Comprobante</th>
                <th className="py-3 px-4 text-right">Observación / Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {salonPagos.length > 0 ? (
                salonPagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {formatISODateToDDMMYYYY(pago.fecha_pago)}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-purple-950 block">
                        {pago.tipo_plan === 'MENSUAL' ? 'Plan Mensual' : 'Plan Anual'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Bs {pago.monto}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                      {pago.referencia}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {pago.estado === 'APROBADO' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          APROBADO
                        </span>
                      )}
                      {pago.estado === 'PENDIENTE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          EN VALIDACIÓN
                        </span>
                      )}
                      {pago.estado === 'RECHAZADO' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                          <X className="w-3 h-3 text-rose-600" />
                          RECHAZADO
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => setViewReceiptModal(pago.comprobante)}
                        className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-950 font-bold hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver imagen</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-600 max-w-xs truncate">
                      {pago.estado === 'RECHAZADO' && pago.motivo_rechazo ? (
                        <span className="text-rose-700 font-semibold italic">
                          Motivo: {pago.motivo_rechazo}
                        </span>
                      ) : (
                        pago.observacion || 'Sin observaciones'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se registran pagos previos para este salón.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para ver imagen de comprobante */}
      {viewReceiptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setViewReceiptModal(null)}
        >
          <div
            className="relative bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <span className="font-bold text-xs text-purple-950">Comprobante de Transferencia</span>
              <button
                onClick={() => setViewReceiptModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 flex justify-center p-2">
              <img
                src={viewReceiptModal}
                alt="Comprobante"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewReceiptModal(null)}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
