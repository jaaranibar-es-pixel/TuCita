import React from 'react';
import { X, Bell, CheckCheck, Store, CreditCard, Clock, AlertCircle } from 'lucide-react';

export interface AdminNotif {
  id: string;
  tipo: 'pago' | 'suscripcion' | 'salon' | 'sistema';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

interface AdminNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotif[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const AdminNotificationsModal: React.FC<AdminNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const getIcon = (tipo: AdminNotif['tipo']) => {
    switch (tipo) {
      case 'pago':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'suscripcion':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'salon':
        return <Store className="w-4 h-4 text-emerald-600" />;
      case 'sistema':
      default:
        return <AlertCircle className="w-4 h-4 text-indigo-600" />;
    }
  };

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
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  Panel General
                </span>
                <h3 className="font-serif font-bold text-xl text-white">
                  Notificaciones del Sistema
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
        <div className="p-3.5 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold">
            Actividad administrativa ({notifications.length})
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
                    <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                      {getIcon(notif.tipo)}
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {notif.titulo}
                    </span>
                  </div>
                  {!notif.leida && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>

                <p className="text-slate-700 text-xs pl-9">{notif.mensaje}</p>

                <div className="flex items-center justify-between pt-2 border-t border-purple-100/60 pl-9 text-[11px]">
                  <span className="text-slate-400">
                    {new Date(notif.fecha).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {!notif.leida && (
                    <button
                      onClick={() => onMarkAsRead(notif.id)}
                      className="text-purple-700 hover:text-purple-950 font-bold hover:underline cursor-pointer"
                    >
                      Marcar leída
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-purple-200 mx-auto" />
              <p className="text-xs">No hay notificaciones administrativas pendientes.</p>
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
