import React from 'react';
import { Star, MapPin, ArrowRight, Heart } from 'lucide-react';
import { Salon } from '../types';

interface SalonCardProps {
  salon: Salon;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onViewSalon: (salon: Salon) => void;
}

export const SalonCard: React.FC<SalonCardProps> = ({
  salon,
  isFavorite,
  onToggleFavorite,
  onViewSalon,
}) => {
  return (
    <article className="group bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-[0_4px_20px_rgba(147,51,234,0.06)] hover:shadow-[0_12px_32px_rgba(147,51,234,0.16)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-purple-900/10">
        <img
          src={salon.coverImage}
          alt={`Interior de ${salon.name}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle top gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Salon Logo Badge if available */}
        <div
          className="absolute bottom-2.5 left-2.5 w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-white/80 overflow-hidden"
          style={{ backgroundColor: salon.logoBgColor || '#7e22ce' }}
          title={`Logo de ${salon.name}`}
        >
          {salon.logoImage ? (
            <img src={salon.logoImage} alt={salon.name} className="w-full h-full object-cover" />
          ) : (
            salon.logoText || salon.name.slice(0, 2).toUpperCase()
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(salon.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/70 hover:bg-white backdrop-blur-md text-purple-800 transition-all duration-200 shadow-sm cursor-pointer hover:scale-110 active:scale-95"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite
                ? 'fill-pink-500 text-pink-500'
                : 'text-purple-800 hover:text-pink-500 stroke-[2]'
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Header Row: Name & Status */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug group-hover:text-purple-800 transition-colors">
              {salon.name}
            </h3>
            {salon.isAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                No disponible
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-1">
            {salon.shortDescription}
          </p>

          {/* Rating Row */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
            <span className="font-bold text-slate-800 tabular-nums">{salon.rating.toFixed(1)}</span>
            <span className="text-slate-500">({salon.reviewsCount} reseñas)</span>
          </div>

          {/* Location Row */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0" />
            <span className="truncate">{salon.zone}</span>
          </div>
        </div>

        {/* 4 Miniature Service Thumbnails matching screenshot */}
        <div>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
            {salon.serviceThumbnails.slice(0, 4).map((thumb, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden bg-purple-50 border border-purple-100/80 shadow-xs"
              >
                <img
                  src={thumb}
                  alt={`Servicio ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Primary Action Button: "Ver salón →" */}
        <button
          onClick={() => onViewSalon(salon)}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-purple-900/10 hover:shadow-md hover:shadow-purple-700/20 transition-all duration-200 cursor-pointer group/btn"
        >
          <span>Ver salón</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </article>
  );
};
