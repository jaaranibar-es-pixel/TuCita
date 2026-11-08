import React, { useState, useMemo } from 'react';
import { Search, MapPin, Star, ArrowRight, Heart, Filter, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Salon } from '../types';

interface SalonsPageProps {
  salons: Salon[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectSalon: (salon: Salon) => void;
  onNavigateHome: () => void;
}

export const SalonsPage: React.FC<SalonsPageProps> = ({
  salons,
  favorites,
  onToggleFavorite,
  onSelectSalon,
  onNavigateHome,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'reviews'>('featured');

  const filteredSalons = useMemo(() => {
    return salons
      .filter((salon) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesQuery =
          !query ||
          salon.name.toLowerCase().includes(query) ||
          salon.zone.toLowerCase().includes(query) ||
          salon.shortDescription.toLowerCase().includes(query) ||
          salon.services.some((s) => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query));

        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && salon.isAvailable) ||
          (availabilityFilter === 'unavailable' && !salon.isAvailable);

        return matchesQuery && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
        return 0;
      });
  }, [salons, searchTerm, availabilityFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#fcfaff] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onNavigateHome}
            className="hover:text-purple-800 transition-colors cursor-pointer"
          >
            Inicio
          </button>
          <span>/</span>
          <span className="font-semibold text-purple-900">Salones</span>
        </nav>

        {/* Page Header matching brief */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-purple-100">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Directorio Oficial de TuCita</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-slate-900 tracking-tight leading-tight">
              Encuentra tu salón
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Descubre salones de belleza de nuestra comunidad y conoce los servicios que ofrecen.
            </p>
          </div>

          {/* Location Badge */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-200/90 rounded-2xl shadow-xs text-xs font-semibold text-purple-900">
              <MapPin className="w-4 h-4 text-purple-700" />
              <span>Aiquile, Cochabamba</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 lg:col-span-7 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de salón, servicio o zona..."
                className="w-full pl-10 pr-9 py-2.5 bg-purple-50/50 border border-purple-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Availability Filter */}
            <div className="md:col-span-3 lg:col-span-3 flex items-center gap-1.5 p-1 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs">
              <button
                onClick={() => setAvailabilityFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all ${
                  availabilityFilter === 'all'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setAvailabilityFilter('available')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all ${
                  availabilityFilter === 'available'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-800'
                }`}
              >
                Disponibles
              </button>
              <button
                onClick={() => setAvailabilityFilter('unavailable')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all ${
                  availabilityFilter === 'unavailable'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-800'
                }`}
              >
                Cerrados
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3 lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-purple-50/50 border border-purple-200/80 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="featured">Destacados</option>
                <option value="rating">Mejor calificación</option>
              </select>
            </div>
          </div>

          {/* Active Result Count */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-purple-50">
            <span>
              Mostrando <strong className="text-purple-900">{filteredSalons.length}</strong> salones en Aiquile
            </span>
            {(searchTerm || availabilityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setAvailabilityFilter('all');
                }}
                className="text-purple-700 hover:underline font-semibold"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Salons Grid matching required card fields */}
        {filteredSalons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSalons.map((salon) => {
              const isFav = favorites.includes(salon.id);

              return (
                <article
                  key={salon.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-[0_4px_20px_rgba(147,51,234,0.06)] hover:shadow-[0_12px_32px_rgba(147,51,234,0.16)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top Image + Badges */}
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-purple-900/10">
                      <img
                        src={salon.coverImage}
                        alt={`Fachada de ${salon.name}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                      {/* Salon Logo Badge (monogram) */}
                      <div
                        className="absolute bottom-3 left-3 w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white/80 overflow-hidden"
                        style={{ backgroundColor: salon.logoBgColor || '#7e22ce' }}
                        title={`Logo de ${salon.name}`}
                      >
                        {salon.logoImage ? (
                          <img src={salon.logoImage} alt={salon.name} className="w-full h-full object-cover" />
                        ) : (
                          salon.logoText || salon.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(salon.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-md text-purple-800 transition-all duration-200 shadow-sm cursor-pointer hover:scale-110 active:scale-95"
                        aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isFav
                              ? 'fill-pink-500 text-pink-500'
                              : 'text-purple-800 hover:text-pink-500 stroke-[2]'
                          }`}
                        />
                      </button>

                      {/* Availability Badge */}
                      <div className="absolute top-3 left-3">
                        {salon.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-emerald-700 backdrop-blur-md shadow-xs border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-rose-700 backdrop-blur-md shadow-xs border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            No disponible
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-slate-900 group-hover:text-purple-800 transition-colors leading-snug">
                          {salon.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {salon.shortDescription}
                        </p>
                      </div>

                      {/* Meta Information: Location & Rating */}
                      <div className="space-y-1.5 pt-1 text-xs border-t border-purple-50">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span className="truncate">{salon.zone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                          <span className="font-bold text-slate-800 tabular-nums">
                            {salon.rating.toFixed(1)}
                          </span>
                          <span className="text-slate-500">({salon.reviewsCount} reseñas)</span>
                        </div>
                      </div>

                      {/* Thumbnail previews */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {salon.serviceThumbnails.slice(0, 4).map((thumb, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-xl overflow-hidden bg-purple-50 border border-purple-100/70"
                          >
                            <img
                              src={thumb}
                              alt="Servicio"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Button "Ver salón" */}
                  <div className="p-4 sm:p-5 pt-0">
                    <button
                      onClick={() => onSelectSalon(salon)}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-purple-900/10 hover:shadow-md hover:shadow-purple-700/20 transition-all duration-200 cursor-pointer group/btn"
                    >
                      <span>Ver salón</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-purple-100 p-8 space-y-3">
            <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              {salons.length === 0 ? 'Directorio listo para nuevos salones' : 'No encontramos salones con ese criterio'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {salons.length === 0
                ? 'Aún no hay salones activos en el catálogo de Aiquile. Los propietarios de salones pueden registrar su local desde la pantalla de inicio o ingreso.'
                : 'Prueba modificando tu búsqueda o restableciendo los filtros para ver todos los salones registrados en Aiquile.'}
            </p>
            {salons.length > 0 ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setAvailabilityFilter('all');
                }}
                className="mt-2 px-4 py-2 bg-purple-700 text-white text-xs font-semibold rounded-xl hover:bg-purple-800 cursor-pointer"
              >
                Restablecer búsqueda
              </button>
            ) : (
              <button
                onClick={onNavigateHome}
                className="mt-2 px-4 py-2 bg-purple-700 text-white text-xs font-semibold rounded-xl hover:bg-purple-800 cursor-pointer"
              >
                Volver al Inicio
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
