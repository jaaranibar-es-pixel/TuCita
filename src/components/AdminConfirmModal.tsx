import React from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, Power } from 'lucide-react';

interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success';
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warning,
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  variant = 'warning',
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          headerBg: 'bg-gradient-to-r from-rose-900 to-purple-950 text-white',
          icon: <ShieldAlert className="w-6 h-6 text-rose-300" />,
          btnConfirm: 'bg-rose-700 hover:bg-rose-800 text-white',
        };
      case 'success':
        return {
          headerBg: 'bg-gradient-to-r from-emerald-900 to-purple-950 text-white',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-300" />,
          btnConfirm: 'bg-emerald-700 hover:bg-emerald-800 text-white',
        };
      case 'warning':
      default:
        return {
          headerBg: 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white',
          icon: <AlertTriangle className="w-6 h-6 text-amber-300" />,
          btnConfirm: 'bg-purple-700 hover:bg-purple-800 text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${styles.headerBg} p-5 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              {styles.icon}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                Confirmación de Acción
              </span>
              <h3 className="font-serif font-bold text-lg text-white">{title}</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-700 leading-relaxed">{message}</p>

          {warning && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Advertencia:</strong> {warning}
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="p-4 sm:p-5 border-t border-purple-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${styles.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
