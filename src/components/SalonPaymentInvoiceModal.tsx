import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  QrCode,
  Phone,
  MessageCircle,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building,
  User as UserIcon,
  Receipt,
  FileCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Salon, User, ConfiguracionPago, PlatformConfig } from '../types';
import { Logo } from './Logo';
import { compressImageFile } from '../utils/imageCompressor';

interface SalonPaymentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: Salon;
  owner: User;
  configPago?: ConfiguracionPago;
  platformConfig?: PlatformConfig;
  onUploadVoucher?: (fileDataUrl: string, referenceCode: string) => void;
}

export const SalonPaymentInvoiceModal: React.FC<SalonPaymentInvoiceModalProps> = ({
  isOpen,
  onClose,
  salon,
  owner,
  configPago,
  platformConfig,
  onUploadVoucher,
}) => {
  const [voucherFile, setVoucherFile] = useState<string | null>(null);
  const [voucherFileName, setVoucherFileName] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    formatted: string;
  }>({
    hours: 72,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    formatted: '72h 00m 00s',
  });

  const orden = salon.ordenPago;
  const ordenId = orden?.id || `FAC-2026-${salon.id.slice(-4).toUpperCase()}`;

  const expirationTimestamp = React.useMemo(() => {
    if (orden?.fechaExpiracion) {
      return new Date(orden.fechaExpiracion).getTime();
    }
    const cTime = orden?.fechaCreacion
      ? new Date(orden.fechaCreacion).getTime()
      : (salon.fecha_creacion ? new Date(salon.fecha_creacion).getTime() : Date.now());
    return cTime + 72 * 60 * 60 * 1000;
  }, [orden?.fechaExpiracion, orden?.fechaCreacion, salon.fecha_creacion]);

  const amountBs = orden?.montoBs || configPago?.precio_mensual || 100;
  const adminWhatsApp = platformConfig?.contactWhatsApp || '59172891234';
  const adminPhone = platformConfig?.contactPhone || '59172891234';
  const qrImage = configPago?.qr_imagen || 'https://images.unsplash.com/photo-1595079672139-5470805086e3?auto=format&fit=crop&w=500&q=80';
  const bankName = configPago?.banco_nombre || 'Banco Unión S.A.';
  const accountHolder = configPago?.titular_cuenta || 'TuCita Aiquile - Administración General';
  const accountNumber = configPago?.numero_cuenta || '10000045892182';

  // Live 72-hour countdown
  useEffect(() => {
    if (!isOpen) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = expirationTimestamp - now;

      if (diff <= 0) {
        setTimeRemaining((prev) => {
          if (prev.isExpired) return prev;
          return {
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
            formatted: 'Expirado (00h 00m 00s)',
          };
        });
      } else {
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const formatted = `${totalHours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

        setTimeRemaining((prev) => {
          if (prev.formatted === formatted) return prev;
          return {
            hours: totalHours,
            minutes,
            seconds,
            isExpired: false,
            formatted,
          };
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, expirationTimestamp]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setUploadError('El archivo debe pesar menos de 15MB.');
        return;
      }
      setVoucherFileName(file.name);
      setUploadError('');
      try {
        const compressed = await compressImageFile(file, 1000, 1000, 0.72);
        setVoucherFile(compressed);
      } catch (err) {
        console.warn('Error comprimiendo comprobante:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setVoucherFile(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherFile && !salon.ordenPago?.comprobanteUrl) {
      setUploadError('Por favor selecciona la imagen de tu comprobante o boleta.');
      return;
    }
    if (onUploadVoucher && voucherFile) {
      onUploadVoucher(voucherFile, referenceCode.trim() || `REF-${Date.now().toString().slice(-6)}`);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Administrador de TuCita, acabo de registrar mi salón "${salon.name}" en Aiquile con Factura/Orden ${ordenId}. Ya realicé mi pago de Bs ${amountBs}. Adjunto mi comprobante para que habiliten mi cuenta y publiquen mi salón.`
  );
  const whatsappUrl = `https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;
  const phoneUrl = `tel:${adminPhone.replace(/[^0-9+]/g, '')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-purple-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-purple-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#240643] via-[#3d0f66] to-[#1a0430] text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar factura"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-widest text-pink-300 block">
                  Orden de Pago / Factura Proforma TuCita
                </span>
                <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-white">
                  {ordenId}
                </h2>
              </div>
            </div>

            {/* Timer Badge */}
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 shrink-0 ${
              timeRemaining.isExpired
                ? 'bg-rose-500/20 border-rose-400/30 text-rose-200'
                : 'bg-amber-400/20 border-amber-300/30 text-amber-200'
            }`}>
              <Clock className="w-4 h-4 shrink-0 animate-pulse" />
              <div>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-white/80">
                  {timeRemaining.isExpired ? 'Plazo Vencido' : 'Plazo restante (72 hrs):'}
                </span>
                <span className="text-sm font-black font-mono tracking-tight text-white">
                  {timeRemaining.formatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-800 flex-1">
          {/* Status Alert Banner */}
          {salon.estado === 'activo' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-950">¡Pago Confirmado y Salón Publicado!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Tu salón se encuentra activo en el catálogo oficial de TuCita Aiquile y todos los clientes ya pueden realizar reservas y solicitar fichas.
                </p>
              </div>
            </div>
          ) : orden?.estado === 'comprobante_subido' ? (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-blue-950">Comprobante en Revisión por el Administrador</h4>
                <p className="text-xs text-blue-800 mt-0.5">
                  Recibimos tu comprobante de pago. El administrador está verificando los datos. Puedes enviarle un mensaje por WhatsApp o llamarlo para acelerar la activación.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-purple-900">Salón en Modo Preparación (No Publicado Aún)</h4>
                <p className="text-xs text-purple-800 leading-relaxed">
                  Ya puedes configurar tus horarios, servicios, fotos y precios dentro de tu panel. Tu local se publicará automáticamente en la web de TuCita en cuanto el Administrador verifique tu pago dentro de las <strong>72 horas</strong>.
                </p>
                <p className="text-[11px] text-purple-600 font-semibold">
                  ⚠️ Si transcurren las 72 horas sin pago confirmado ni boleta enviada, la cuenta y los datos del salón se eliminarán por seguridad.
                </p>
              </div>
            </div>
          )}

          {/* Invoice Summary Details Box */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Local Registrado</span>
                <h3 className="font-bold text-base text-slate-900">{salon.name}</h3>
                <p className="text-xs text-slate-600">{salon.address || 'Aiquile, Cochabamba'}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Titular de la cuenta</span>
                <p className="font-bold text-xs text-slate-900">{owner.nombre} {owner.apellido}</p>
                <p className="text-xs text-slate-600">Cel: {owner.telefono || salon.phone || 'No registrado'}</p>
              </div>
            </div>

            {/* Concept and Amount Table */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-600 pb-1 border-b border-slate-200/60">
                <span>Descripción del Concepto</span>
                <span>Monto</span>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-medium">
                <div>
                  <p className="font-bold">Habilitación de Salón y Suscripción TuCita</p>
                  <p className="text-[11px] text-slate-500">
                    Plan {orden?.tipoPlan || 'MENSUAL'} · Publicación en catálogo, reservas web, fichas y panel de gestión.
                  </p>
                </div>
                <span className="font-bold text-sm text-purple-900">Bs. {amountBs},00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-sm text-slate-900">
                <span>TOTAL A PAGAR:</span>
                <span className="text-lg text-pink-600 font-serif">Bs. {amountBs},00</span>
              </div>
            </div>
          </div>

          {/* Payment Method: QR Simple & Bank Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Left: QR Simple Box */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 p-5 rounded-2xl border border-purple-200 flex flex-col items-center text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Simple Bolivia</span>
              </div>

              <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-3 rounded-2xl shadow-md border border-purple-200 flex items-center justify-center overflow-hidden">
                <img
                  src={qrImage}
                  alt="QR Simple de Pago TuCita"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-xs text-purple-950 font-medium max-w-xs">
                Escanea desde la app de tu banco (Banco Unión, BNB, BCP, Bisa, Fie, Banco Sol o Tigo Money).
              </p>
            </div>

            {/* Right: Bank Account Info & Direct Contacts */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-purple-700" />
                  <span>Datos de Transferencia Bancaria</span>
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><strong className="text-slate-900">Banco:</strong> {bankName}</p>
                  <p><strong className="text-slate-900">Titular:</strong> {accountHolder}</p>
                  <p className="font-mono bg-white p-2 rounded-xl border border-slate-200 text-slate-900 font-bold select-all">
                    Cta: {accountNumber}
                  </p>
                </div>
              </div>

              {/* Direct Communication Channels */}
              <div className="bg-purple-900 text-white p-4 rounded-2xl shadow-sm space-y-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-pink-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Contacto Directo con el Administrador</span>
                  </h4>
                  <p className="text-[11px] text-purple-200">
                    ¿Dudas o ya realizaste el pago? Comunícate directamente con la administración de TuCita:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avisar por WhatsApp</span>
                  </a>

                  <a
                    href={phoneUrl}
                    className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/20 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Llamar por teléfono</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Voucher Section */}
          <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Adjuntar Boleta o Comprobante de Pago</h4>
                  <p className="text-xs text-slate-500">Sube una captura de tu transferencia o foto de la boleta</p>
                </div>
              </div>

              {orden?.comprobanteUrl && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Boleta cargada
                </span>
              )}
            </div>

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Comprobante enviado con éxito! El Administrador lo validará para habilitar tu página.</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* File picker */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Archivo de comprobante (JPG, PNG)
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50/50 hover:bg-purple-100/50 transition-colors cursor-pointer text-xs font-bold text-purple-800">
                    <Upload className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">
                      {voucherFileName || (orden?.comprobanteUrl ? 'Cambiar imagen...' : 'Seleccionar archivo')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Reference Code */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Número de Transacción / Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="ej. TRX-948210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white"
                  />
                </div>
              </div>

              {voucherFile && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <img
                    src={voucherFile}
                    alt="Vista previa comprobante"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 truncate max-w-xs">{voucherFileName}</p>
                    <p className="text-[10px] text-slate-500">Listo para enviar a revisión</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-950/20 transition-all cursor-pointer"
              >
                Enviar Comprobante al Administrador
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            * Soporte TuCita Aiquile: Tel. {adminPhone} · Calle Sucre #120
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Cerrar y continuar en mi panel
          </button>
        </div>
      </div>
    </div>
  );
};
