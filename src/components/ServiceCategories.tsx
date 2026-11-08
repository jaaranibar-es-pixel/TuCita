import React from 'react';
import { Scissors, MoreHorizontal, Sparkles } from 'lucide-react';

interface ServiceCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const ServiceCategories: React.FC<ServiceCategoriesProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  // Category definitions with tailored SVGs matching the reference image
  const categories = [
    {
      id: 'corte-de-cabello',
      label: 'Corte de cabello',
      renderIcon: () => <Scissors className="w-6 h-6 text-purple-800" />,
    },
    {
      id: 'peinados',
      label: 'Peinados',
      renderIcon: () => (
        /* Hair Dryer Icon */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 8H6a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4h1" />
          <path d="M19 6v6" />
          <path d="M7 17v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-4" />
          <line x1="22" y1="9" x2="19" y2="9" />
          <line x1="22" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      id: 'unas',
      label: 'Uñas',
      renderIcon: () => (
        /* Nail Polish Bottle / Hand */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="10" width="10" height="11" rx="2" />
          <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
          <path d="M10 14h4" />
        </svg>
      ),
    },
    {
      id: 'tratamientos',
      label: 'Tratamientos',
      renderIcon: () => (
        /* Lotus Flower Icon */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4c2.5 4 4 7 4 10a4 4 0 0 1-8 0c0-3 1.5-6 4-10z" />
          <path d="M12 14c-3-1-6.5-1-8.5 2 2 2.5 5 2.5 8 1" />
          <path d="M12 14c3-1 6.5-1 8.5 2-2 2.5-5 2.5-8 1" />
        </svg>
      ),
    },
    {
      id: 'maquillaje',
      label: 'Maquillaje',
      renderIcon: () => (
        /* Female Face / Makeup Silhouette */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="11" r="7" />
          <path d="M12 18v3" />
          <path d="M9 21h6" />
          <path d="M8 8c1-1 3-1 4 0" />
          <path d="M12 8c1-1 3-1 4 0" />
          <path d="M10 13c1 .5 3 .5 4 0" />
        </svg>
      ),
    },
    {
      id: 'barberia',
      label: 'Barbería',
      renderIcon: () => (
        /* Beard / Barber Icon */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 6a5 5 0 0 1 10 0v2a5 5 0 0 1-10 0V6z" />
          <path d="M6 10c0 4 3 8 6 8s6-4 6-8" />
          <path d="M9 13a3 3 0 0 0 6 0" />
        </svg>
      ),
    },
    {
      id: 'cejas-pestanas',
      label: 'Cejas y pestañas',
      renderIcon: () => (
        /* Lashes / Eye Icon */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13c3.5-5 14.5-5 18 0" />
          <path d="M7 9L5 6" />
          <path d="M12 8V4" />
          <path d="M17 9l2-3" />
          <path d="M9.5 13a2.5 2.5 0 0 0 5 0" />
        </svg>
      ),
    },
    {
      id: 'faciales',
      label: 'Faciales',
      renderIcon: () => (
        /* Cosmetic Cream Jar */
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="10" width="14" height="10" rx="3" />
          <path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
          <path d="M12 14v2" />
        </svg>
      ),
    },
    {
      id: 'mas-servicios',
      label: 'Más servicios',
      renderIcon: () => <MoreHorizontal className="w-6 h-6 text-purple-800" />,
    },
  ];

  return (
    <section id="servicios" className="pt-2 pb-6 md:pt-4 md:pb-8 bg-[#fcfaff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories Horizontal Carousel / Responsive Flex Grid */}
        <div className="flex items-start justify-start md:justify-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-4 pt-2 px-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className="group flex flex-col items-center shrink-0 w-20 sm:w-24 text-center cursor-pointer transition-transform duration-200 hover:-translate-y-1 focus:outline-none"
              >
                {/* Circular Badge Container matching screenshot */}
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-purple-100 ring-2 ring-purple-600 shadow-md shadow-purple-300/40'
                      : 'bg-white shadow-[0_4px_16px_rgba(147,51,234,0.08)] border border-purple-100/90 group-hover:border-purple-300 group-hover:shadow-[0_6px_20px_rgba(147,51,234,0.14)]'
                  }`}
                >
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {cat.renderIcon()}
                  </div>
                </div>

                {/* Category Label */}
                <span
                  className={`mt-2.5 text-xs sm:text-xs font-semibold leading-tight transition-colors line-clamp-2 ${
                    isSelected ? 'text-purple-900 font-bold' : 'text-purple-950/80 group-hover:text-purple-900'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category feedback banner */}
        {selectedCategory && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Filtrando visualmente por categoría:{' '}
              <strong className="capitalize">{selectedCategory.replace(/-/g, ' ')}</strong>
              <button
                onClick={() => onSelectCategory(null)}
                className="ml-2 text-purple-700 hover:text-purple-950 font-bold"
              >
                × Limpiar
              </button>
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
