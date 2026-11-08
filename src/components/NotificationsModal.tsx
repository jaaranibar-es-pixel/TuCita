import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCheck
} from 'lucide-react';
import { NotificacionInterna } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificacionInterna[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotificationCita: (citaId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotificationCita,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.leida).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-pink-300">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                  Avisos Internos
                </span>
                <h3 className="font-serif font-bold text-xl text-white">
                  Notificaciones del Salón
                </h3>
              </div>
            </div>

            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-purple-950">
                {unreadCount} sin leer
              </span>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold">
            Historial de avisos ({notifications.length})
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-purple-700 hover:text-purple-950 font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-2 ${
                  !notif.leida
                    ? 'bg-purple-50/80 border-purple-300 shadow-xs ring-1 ring-purple-200'
                    : 'bg-white border-slate-100 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: notif.leida ? '#cbd5e1' : '#f59e0b' }} />
                    <span className="font-extrabold text-slate-900 text-sm">
                      {notif.titulo}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {notif.codigo_cita}
                  </span>
                </div>

                <p className="text-slate-700 text-xs pl-4">{notif.mensaje}</p>

                <div className="flex items-center justify-between pt-2 border-t border-purple-100/60 pl-4 text-[11px]">
                  <span className="text-slate-400">
                    {new Date(notif.fecha).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    {!notif.leida && (
                      <button
                        onClick={() => onMarkAsRead(notif.id)}
                        className="text-purple-700 hover:text-purple-950 font-bold hover:underline cursor-pointer"
                      >
                        Marcar leída
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onClose();
                        onSelectNotificationCita(notif.cita_id);
                      }}
                      className={`px-3 py-1 rounded-xl text-white font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        notif.cita_id
                          ? 'bg-purple-700 hover:bg-purple-800'
                          : 'bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800'
                      }`}
                    >
                      <span>{notif.cita_id ? 'Ver y responder cita' : 'Gestionar suscripción'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-purple-200 mx-auto" />
              <p className="text-xs">No hay notificaciones registradas para este salón.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-purple-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
