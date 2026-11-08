import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Building,
  User,
  CreditCard,
  Eye,
  FileText,
  RotateCcw
} from 'lucide-react';
import { PagoSuscripcion, Salon, User as UserType } from '../types';
import { formatISODateToDDMMYYYY } from '../utils/subscriptionManager';

interface AdminValidatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: PagoSuscripcion | null;
  salon: Salon | undefined;
  owner: UserType | undefined;
  onApprove: (pagoId: string) => void;
  onReject: (pagoId: string, motivo: string) => void;
}

const PRESET_REJECTION_REASONS = [
  'El comprobante no es legible.',
  'El monto no corresponde al plan seleccionado.',
  'Número de referencia duplicado o no encontrado en extracto bancario.',
  'La fecha de la transferencia no coincide.',
];

export const AdminValidatePaymentModal: React.FC<AdminValidatePaymentModalProps> = ({
  isOpen,
  onClose,
  pago,
  salon,
  owner,
  onApprove,
  onReject,
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [confirmApproveMode, setConfirmApproveMode] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('El comprobante no es legible.');
  const [expandedImage, setExpandedImage] = useState(false);

  if (!isOpen || !pago) return null;

  const handleApproveConfirm = () => {
    onApprove(pago.id);
    setConfirmApproveMode(false);
    onClose();
  };

  const handleRejectConfirm = () => {
    onReject(pago.id, motivoRechazo.trim() || 'Sin motivo especificado.');
    setRejectMode(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-pink-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                Validación Administrativa de Pago
              </span>
              <h3 className="font-serif font-bold text-xl text-white">
                Revisión de Comprobante · {pago.referencia}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Tarjeta Datos de la Transacción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">
                Salón y Propietario
              </span>
              <div>
                <span className="text-slate-400 block text-[10px]">Salón de belleza:</span>
                <span className="font-bold text-slate-900 text-sm">{salon?.name || 'Salón'}</span>
                <span className="text-[11px] text-slate-500 block">{salon?.city}</span>
              </div>
              <div className="pt-1 border-t border-purple-100/60">
                <span className="text-slate-400 block text-[10px]">Propietario solicitante:</span>
                <span className="font-semibold text-slate-900">
                  {owner ? `${owner.nombre} ${owner.apellido}` : 'Propietario registrado'}
                </span>
                <span className="text-[10px] text-purple-700 font-mono block">
                  @{owner?.usuario} · {owner?.telefono}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">
                Monto y Referencia Bancaria
              </span>
              <div>
                <span className="text-slate-400 block text-[10px]">Plan seleccionado:</span>
                <span className="font-bold text-purple-950 text-sm">
                  {pago.tipo_plan === 'MENSUAL' ? 'Plan Mensual (1 mes)' : 'Plan Anual (12 meses)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Monto pagado:</span>
                <span className="text-2xl font-extrabold text-purple-950 font-mono">
                  Bs {pago.monto}
                </span>
              </div>
              <div className="pt-1 border-t border-purple-100/60">
                <span className="text-slate-400 block text-[10px]">Referencia de operación:</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {pago.referencia}
                </span>
              </div>
            </div>
          </div>

          {/* Observación del propietario */}
          {pago.observacion && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <span className="font-bold block text-[10px] uppercase text-slate-500">
                Nota enviada por el propietario:
              </span>
              <p className="italic mt-0.5">“{pago.observacion}”</p>
            </div>
          )}

          {/* Comprobante de Pago Imagen */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              Comprobante de Transferencia / QR
            </span>
            <div className="p-3 rounded-2xl border border-purple-200 bg-slate-50 flex flex-col items-center">
              {pago.comprobante && pago.comprobante !== 'PENDIENTE_COMPROBANTE' ? (
                <>
                  <img
                    src={pago.comprobante}
                    alt="Comprobante de pago"
                    className="max-h-72 w-auto object-contain rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:opacity-95"
                    onClick={() => setExpandedImage(!expandedImage)}
                    title="Haz clic para ampliar"
                  />
                  <span className="text-[10px] text-slate-500 mt-2">
                    Verifica que el monto (Bs {pago.monto}) y la referencia coincidan con tu cuenta receptora.
                  </span>
                </>
              ) : (
                <div className="py-6 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 font-bold">
                    !
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    El salón aún no ha adjuntado la fotografía de su comprobante de pago.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Puedes esperar a que lo suba o aprobar manualmente si recibiste la confirmación bancaria directa.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modo Confirmación de Aprobación */}
          {confirmApproveMode && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-sm">¿Confirmar y aprobar este pago?</span>
              </div>
              <p className="text-slate-700">
                Al aprobar el pago, la suscripción de <strong>{salon?.name}</strong> cambiará a <strong>ACTIVA</strong> por{' '}
                <strong>{pago.tipo_plan === 'MENSUAL' ? '1 mes' : '12 meses'}</strong>, calculando automáticamente su fecha de vencimiento y asegurando que su salón esté disponible públicamente.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmApproveMode(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold bg-white cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleApproveConfirm}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  CONFIRMAR Y APROBAR
                </button>
              </div>
            </div>
          )}

          {/* Modo Rechazo con Motivo */}
          {rejectMode && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-bold text-sm">Rechazar Comprobante de Pago</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Motivo del rechazo (se informará al propietario para que corrija):
                </label>
                <textarea
                  rows={2}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_REJECTION_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMotivoRechazo(preset)}
                      className="text-[10px] px-2 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-100 text-rose-900 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold bg-white cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold shadow-xs cursor-pointer"
                >
                  RECHAZAR COMPROBANTE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!confirmApproveMode && !rejectMode && (
          <div className="p-4 sm:p-5 border-t border-purple-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
            >
              Cerrar
            </button>

            {pago.estado === 'PENDIENTE' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>RECHAZAR PAGO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmApproveMode(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>APROBAR PAGO</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
