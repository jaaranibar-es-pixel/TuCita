import React from 'react';
import { X, User, CheckCircle2, Sparkles } from 'lucide-react';

interface UserNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserNoticeModal: React.FC<UserNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-purple-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 leading-tight">
                Módulo de Usuarios
              </h3>
              <p className="text-[11px] text-purple-700 font-medium">Plataforma TuCita</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200/60">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-purple-900 block font-semibold mb-0.5">
                ETAPA 1: Estructura visual terminada
              </strong>
              Como se especificó para esta primera fase, los módulos de inicio de sesión, registro de clientes, gestión de contraseñas y panel de usuarios se implementarán en la siguiente etapa del proyecto.
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Estructura visual y navegación completadas</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Diseño adaptado para escritorio, laptop, tablet y móvil</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Preparado para la integración de la Etapa 2</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-purple-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
