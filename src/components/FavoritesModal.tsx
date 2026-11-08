import React from 'react';
import { X, Heart, Trash2, ArrowRight } from 'lucide-react';
import { Salon } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteSalons: Salon[];
  onRemoveFavorite: (id: string) => void;
  onViewSalon: (salon: Salon) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favoriteSalons,
  onRemoveFavorite,
  onViewSalon,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-purple-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Tus Salones Favoritos ({favoriteSalons.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {favoriteSalons.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Heart className="w-10 h-10 text-purple-200 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Aún no tienes salones en favoritos</p>
            <p className="text-xs text-slate-500">
              Haz clic en el icono de corazón en cualquier tarjeta de salón para guardarlo aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {favoriteSalons.map((salon) => (
              <div
                key={salon.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-purple-100 hover:border-purple-200 bg-purple-50/30 transition-colors"
              >
                <img
                  src={salon.coverImage}
                  alt={salon.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{salon.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{salon.zone}</p>
                  <p className="text-[11px] text-purple-700 font-semibold">★ {salon.rating.toFixed(1)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onClose();
                      onViewSalon(salon);
                    }}
                    className="p-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
                    title="Ver salón"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(salon.id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-purple-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
