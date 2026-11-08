import React from 'react';
import { X, Star, MapPin, Clock, Phone, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import { Salon } from '../types';

interface SalonDetailModalProps {
  salon: Salon | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const SalonDetailModal: React.FC<SalonDetailModalProps> = ({
  salon,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  if (!isOpen || !salon) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 max-h-[90vh] flex flex-col">
        {/* Modal Header with Salon Image */}
        <div className="relative h-56 sm:h-64 w-full shrink-0 bg-purple-900">
          <img
            src={salon.coverImage}
            alt={salon.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => onToggleFavorite(salon.id)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/80 hover:bg-white text-purple-900 transition-colors cursor-pointer shadow-sm"
            aria-label="Favorito"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-pink-500 text-pink-500' : 'text-purple-800'}`}
            />
          </button>

          {/* Floating Details on Cover */}
          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <span className="text-xs uppercase tracking-widest text-purple-300 font-bold">
              {salon.neonSubtitle}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-white">
              {salon.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200">
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                {salon.rating.toFixed(1)} ({salon.reviewsCount} reseñas)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-300" />
                {salon.zone}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Stage 1 Information Alert Notice */}
          <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 leading-relaxed">
              <strong>Etapa 1 — Vista Previa Visual:</strong> Esta pantalla muestra la estructura y catálogo del salón. Las funciones de reserva interactiva, selección de horarios y confirmación de citas se habilitarán en la siguiente etapa del sistema.
            </div>
          </div>

          {/* Salon Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5">
              Sobre el salón
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {salon.description}
            </p>
          </div>

          {/* Practical Info (Schedule & Address) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-purple-700 shrink-0" />
              <span>{salon.schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
              <span>{salon.address}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-purple-700 shrink-0" />
              <span>{salon.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Salón registrado y verificado</span>
            </div>
          </div>

          {/* Service Menu */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3">
              Servicios disponibles en {salon.name}
            </h4>
            <div className="space-y-2">
              {salon.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-purple-100 hover:border-purple-300 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{service.name}</div>
                    <div className="text-xs text-slate-500">
                      Categoría: {service.category} · Duración aprox. {service.durationMinutes} min
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-900">Bs {service.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-purple-100 bg-purple-50/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-purple-200 text-purple-900 hover:bg-purple-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar vista previa
          </button>
        </div>
      </div>
    </div>
  );
};
