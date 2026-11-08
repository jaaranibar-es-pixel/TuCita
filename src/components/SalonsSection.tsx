import React, { useState, useMemo } from 'react';
import { MapPin, ChevronDown, Search, X, Sparkles, Filter } from 'lucide-react';
import { Salon } from '../types';
import { SalonCard } from './SalonCard';

interface SalonsSectionProps {
  salons: Salon[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onViewSalon: (salon: Salon) => void;
  selectedCategory: string | null;
  globalSearch: string;
}

export const SalonsSection: React.FC<SalonsSectionProps> = ({
  salons,
  favorites,
  onToggleFavorite,
  onViewSalon,
  selectedCategory,
  globalSearch,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [showAllSalons, setShowAllSalons] = useState(false);
  const [filterSort, setFilterSort] = useState<'destacados' | 'rating'>('destacados');

  // Filter and sort salons: Destacados (mayor índice de actividad y popularidad) o Mejor calificados (por rating descendente)
  const filteredSalons = useMemo(() => {
    return salons.filter((salon) => {
      if (!salon) return false;
      const query = (localSearch || globalSearch).toLowerCase().trim();
      const matchesSearch =
        !query ||
        (salon.name || '').toLowerCase().includes(query) ||
        (salon.zone || '').toLowerCase().includes(query) ||
        (salon.city || '').toLowerCase().includes(query) ||
        (salon.description || '').toLowerCase().includes(query) ||
        (salon.tagline || '').toLowerCase().includes(query) ||
        (salon.services || []).some(
          (s) =>
            (s.name || '').toLowerCase().includes(query) ||
            (s.category || '').toLowerCase().includes(query) ||
            (s.description || '').toLowerCase().includes(query)
        );

      const matchesCategory =
        !selectedCategory ||
        (salon.services || []).some((s) =>
          (s.category || '').toLowerCase().includes(selectedCategory.replace(/-/g, ' ').toLowerCase())
        );

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (filterSort === 'rating') {
        // Orden estricto por calificación de mayor a menor
        return b.rating - a.rating;
      }
      // 'destacados': Ponderación por actividad y popularidad (rating * cantidad de reseñas + bonificación por estar activo y disponible)
      const scoreA = (a.rating * a.reviewsCount) + (a.isAvailable && a.estado === 'activo' ? 50 : 0);
      const scoreB = (b.rating * b.reviewsCount) + (b.isAvailable && b.estado === 'activo' ? 50 : 0);
      return scoreB - scoreA;
    });
  }, [salons, localSearch, globalSearch, selectedCategory, filterSort]);

  // Display initial 4 (matching screenshot) or all if toggled or searching
  const displayedSalons = (showAllSalons || localSearch || globalSearch || selectedCategory)
    ? filteredSalons
    : filteredSalons.slice(0, 4);

  return (
    <section id="salones" className="py-12 md:py-16 bg-[#fcfaff] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header with Title, Location Selector & Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-purple-100">
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-900 tracking-tight leading-tight">
              Salones de belleza en tu comunidad
            </h2>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Conoce los salones registrados y elige el que mejor se adapte a ti.
            </p>
          </div>

          {/* Right Controls: Location Dropdown Pill & Local Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Local Search Input */}
            <div className="relative w-full sm:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Buscar salón..."
                className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-purple-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-xs"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Location Selector Pill matching reference screenshot */}
            <div className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-full text-xs font-semibold text-purple-900 shadow-xs transition-colors cursor-pointer"
                aria-expanded={locationOpen}
                aria-haspopup="true"
              >
                <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Aiquile, Cochabamba</span>
                <ChevronDown className={`w-3.5 h-3.5 text-purple-700 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Location Information Dropdown */}
              {locationOpen && (
                <div className="absolute right-0 mt-2 w-72 p-4 bg-white border border-purple-200 rounded-2xl shadow-xl z-20 animate-fadeIn text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-purple-950">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Comunidad Aiquile
                    </span>
                    <button
                      onClick={() => setLocationOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    TuCita inicia su cobertura comunitaria en <strong>Aiquile, Cochabamba</strong> conectando los mejores salones locales de estilismo, uñas y estética.
                  </p>
                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[11px] text-purple-700 font-medium">
                    <span>Estado: Red local activa</span>
                    <span className="text-emerald-600 font-semibold">● {salons.length} {salons.length === 1 ? 'Salón' : 'Salones'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills for Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-purple-500" />
              Ordenar por:
            </span>
            <button
              onClick={() => setFilterSort('destacados')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filterSort === 'destacados'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-purple-200 text-slate-600 hover:bg-purple-50'
              }`}
            >
              Destacados
            </button>
            <button
              onClick={() => setFilterSort('rating')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filterSort === 'rating'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-purple-200 text-slate-600 hover:bg-purple-50'
              }`}
            >
              Mejor calificados
            </button>
          </div>

          <div className="text-slate-500">
            Mostrando <strong className="text-purple-900">{displayedSalons.length}</strong> de {filteredSalons.length} salones
          </div>
        </div>

        {/* Salons 4-Column Grid matching reference image */}
        {displayedSalons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                isFavorite={favorites.includes(salon.id)}
                onToggleFavorite={onToggleFavorite}
                onViewSalon={onViewSalon}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-purple-100 p-8 space-y-3">
            <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              {salons.length === 0 ? '¡Bienvenido a TuCita Aiquile!' : 'No encontramos salones con ese criterio'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {salons.length === 0
                ? 'El sistema está listo y limpio para producción. Los nuevos salones registrados aparecerán aquí una vez que el administrador confirme su habilitación.'
                : 'Intenta buscar por otro término o limpia los filtros para ver todos los salones registrados en Aiquile.'}
            </p>
            {salons.length > 0 && (
              <button
                onClick={() => {
                  setLocalSearch('');
                }}
                className="mt-2 px-4 py-2 bg-purple-700 text-white text-xs font-semibold rounded-xl hover:bg-purple-800"
              >
                Restablecer búsqueda
              </button>
            )}
          </div>
        )}

        {/* Toggle to view remaining salons (demonstration list) */}
        {!localSearch && !globalSearch && !selectedCategory && filteredSalons.length > 4 && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setShowAllSalons(!showAllSalons)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-purple-300 text-purple-900 bg-white hover:bg-purple-50 text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <span>{showAllSalons ? 'Ver solo destacados' : `Ver todos los salones (${filteredSalons.length})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllSalons ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
