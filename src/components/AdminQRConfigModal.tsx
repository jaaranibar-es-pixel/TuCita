import React, { useState } from 'react';
import { X, QrCode, Upload, Save, CheckCircle2, Building, DollarSign } from 'lucide-react';
import { ConfiguracionPago } from '../types';

interface AdminQRConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguracionPago;
  onSaveConfig: (updatedConfig: ConfiguracionPago) => void;
}

export const AdminQRConfigModal: React.FC<AdminQRConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [qrPreview, setQrPreview] = useState(config.qr_imagen);
  const [bancoNombre, setBancoNombre] = useState(config.banco_nombre);
  const [titularCuenta, setTitularCuenta] = useState(config.titular_cuenta);
  const [numeroCuenta, setNumeroCuenta] = useState(config.numero_cuenta);
  const [precioMensual, setPrecioMensual] = useState(config.precio_mensual || 100);
  const [precioAnual, setPrecioAnual] = useState(config.precio_anual || 1100);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
        setError('Solo se admiten formatos de imagen válidos (PNG, JPG, WEBP, SVG).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrPreview) {
      setError('Debes cargar una imagen válida para el código QR.');
      return;
    }

    const updated: ConfiguracionPago = {
      ...config,
      qr_imagen: qrPreview,
      banco_nombre: bancoNombre.trim() || 'Banco Unión S.A.',
      titular_cuenta: titularCuenta.trim() || 'TuCita Bolivia S.R.L.',
      numero_cuenta: numeroCuenta.trim() || '10000034982189',
      precio_mensual: Number(precioMensual) || 100,
      precio_anual: Number(precioAnual) || 1100,
      fecha_actualizacion: new Date().toISOString(),
    };

    onSaveConfig(updated);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]"
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
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                Configuración del QR de Pago (Requisitos 7 y 28)
              </span>
              <h3 className="font-serif font-bold text-xl text-white">
                Actualizar QR y Datos de Suscripción
              </h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡QR y datos bancarios guardados correctamente!</span>
            </div>
          )}

          {/* QR Upload & Preview */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block text-xs">
              Imagen del Código QR Oficial *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3 rounded-2xl border border-purple-200 bg-purple-50/30">
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-purple-100">
                <img
                  src={qrPreview}
                  alt="Vista previa QR"
                  className="w-40 h-40 object-contain rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-1">Vista previa en tiempo real</span>
              </div>

              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 cursor-pointer bg-white transition-all text-center">
                  <Upload className="w-6 h-6 text-purple-600 mb-1" />
                  <span className="font-bold text-purple-900 text-xs">Subir nuevo QR</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG o SVG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  El QR que guardes aquí se mostrará automáticamente en todos los paneles de propietarios al momento de pagar.
                </p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 border-b border-purple-100 pb-1 text-xs uppercase tracking-wider">
              Datos Bancarios para Transferencias
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Nombre del Banco</label>
                <input
                  type="text"
                  required
                  value={bancoNombre}
                  onChange={(e) => setBancoNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Titular de la Cuenta</label>
                <input
                  type="text"
                  required
                  value={titularCuenta}
                  onChange={(e) => setTitularCuenta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-800">Número de Cuenta</label>
                <input
                  type="text"
                  required
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Precios de los Planes (Requisito 30) */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-900 border-b border-purple-100 pb-1 text-xs uppercase tracking-wider">
              Precios de Suscripción Oficiales
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Plan Mensual (Bs)</label>
                <input
                  type="number"
                  required
                  value={precioMensual}
                  onChange={(e) => setPrecioMensual(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Plan Anual (Bs)</label>
                <input
                  type="number"
                  required
                  value={precioAnual}
                  onChange={(e) => setPrecioAnual(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-purple-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar QR y Parámetros</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
