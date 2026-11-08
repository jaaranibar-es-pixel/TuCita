import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home, Scissors, ShoppingBag, Search, User as UserIcon, X, Menu, Shield, Store, LogOut, Calendar, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { User, Salon, ServiceItem } from '../types';

interface NavbarProps {
  currentView: 'home' | 'salones' | 'salon-detail' | 'login' | 'admin' | 'propietario' | 'cliente';
  onNavigate: (view: 'home' | 'salones') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onGoToDashboard: () => void;
  onLogout: () => void;
  onOpenTracking?: () => void;
  salons?: Salon[];
  allServices?: ServiceItem[];
  onSelectSalon?: (salon: Salon, serviceId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  favoritesCount,
  onOpenFavorites,
  currentUser,
  onOpenLogin,
  onGoToDashboard,
  onLogout,
  onOpenTracking,
  salons = [],
  allServices = [],
  onSelectSalon,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(target)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!cleanQuery) {
      return { services: [], salons: [], total: 0 };
    }

    const matchedServices: Array<{ service: ServiceItem; salon: Salon }> = [];

    (salons || []).forEach((salon) => {
      const sServices =
        salon.services && salon.services.length > 0
          ? salon.services
          : (allServices || []).filter((s) => s.salonId === salon.id);

      sServices.forEach((srv) => {
        const nameMatch = (srv.name || '').toLowerCase().includes(cleanQuery);
        const descMatch = (srv.description || '').toLowerCase().includes(cleanQuery);
        const catMatch = (srv.category || '').toLowerCase().includes(cleanQuery);

        if (nameMatch || descMatch || catMatch) {
          matchedServices.push({ service: srv, salon });
        }
      });
    });

    const matchedSalons = (salons || []).filter((salon) => {
      const nameMatch = (salon.name || '').toLowerCase().includes(cleanQuery);
      const zoneMatch = (salon.zone || '').toLowerCase().includes(cleanQuery);
      const cityMatch = (salon.city || '').toLowerCase().includes(cleanQuery);
      const descMatch = (salon.description || '').toLowerCase().includes(cleanQuery);
      const taglineMatch = (salon.tagline || '').toLowerCase().includes(cleanQuery);
      return nameMatch || zoneMatch || cityMatch || descMatch || taglineMatch;
    });

    return {
      services: matchedServices.slice(0, 6),
      salons: matchedSalons.slice(0, 4),
      total: matchedServices.length + matchedSalons.length,
    };
  }, [cleanQuery, salons, allServices]);

  const handleNavClick = (tab: 'home' | 'salones' | 'servicios') => {
    setMobileMenuOpen(false);
    if (tab === 'home') {
      onNavigate('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'salones') {
      onNavigate('salones');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'servicios') {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById('servicios');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const renderSearchDropdown = (placement: 'desktop' | 'mobile' = 'desktop') => {
    if (!isSearchDropdownOpen || cleanQuery.length < 1) return null;

    const widthClasses =
      placement === 'desktop'
        ? 'w-[92vw] sm:w-[480px] md:w-[520px] max-w-[calc(100vw-32px)] left-1/2 -translate-x-1/2'
        : 'w-full left-0 right-0';

    return (
      <div
        className={`absolute top-full mt-2.5 bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden z-50 animate-fadeIn max-h-[480px] overflow-y-auto ring-1 ring-purple-900/5 ${widthClasses}`}
      >
        {/* Header bar */}
        <div className="p-3.5 bg-gradient-to-r from-purple-50 via-purple-100/70 to-purple-50 border-b border-purple-100 flex items-center justify-between text-xs text-purple-950 font-bold">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Resultados para &ldquo;{searchQuery}&rdquo;</span>
          </span>
          <span className="text-[10px] bg-purple-200/90 text-purple-950 px-2.5 py-0.5 rounded-full font-extrabold tracking-wide">
            {searchResults.total} {searchResults.total === 1 ? 'coincidencia' : 'coincidencias'}
          </span>
        </div>

        {/* Empty state */}
        {searchResults.total === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">No encontramos salones ni servicios con &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Prueba escribiendo &ldquo;corte&rdquo;, &ldquo;tinte&rdquo;, &ldquo;uñas&rdquo;, &ldquo;peinado&rdquo; o el nombre del salón de belleza.
            </p>
          </div>
        )}

        {/* Services Results */}
        {searchResults.services.length > 0 && (
          <div className="p-2.5 border-b border-purple-50">
            <span className="px-3 py-1 text-[10px] uppercase font-extrabold tracking-wider text-purple-800 block">
              ✂️ Servicios encontrados ({searchResults.services.length})
            </span>
            <div className="space-y-1 mt-1.5">
              {searchResults.services.map(({ service, salon }) => (
                <div
                  key={`${salon.id}-${service.id}`}
                  onClick={() => {
                    setIsSearchDropdownOpen(false);
                    if (onSelectSalon) {
                      onSelectSalon(salon, service.id);
                    }
                  }}
                  className="p-3 rounded-2xl hover:bg-purple-50/90 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors shadow-xs">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-950 truncate">
                        {service.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-purple-900">Salón: {salon.name}</span>
                        <span>·</span>
                        <span>{service.durationMinutes} min</span>
                        {service.category && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400 capitalize">{service.category}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="font-extrabold text-xs sm:text-sm text-purple-900 block">
                      Bs {service.price}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold group-hover:underline inline-flex items-center gap-0.5">
                      <span>Reservar</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salons Results */}
        {searchResults.salons.length > 0 && (
          <div className="p-2.5">
            <span className="px-3 py-1 text-[10px] uppercase font-extrabold tracking-wider text-purple-800 block">
              🏪 Salones de belleza ({searchResults.salons.length})
            </span>
            <div className="space-y-1 mt-1.5">
              {searchResults.salons.map((salon) => (
                <div
                  key={salon.id}
                  onClick={() => {
                    setIsSearchDropdownOpen(false);
                    if (onSelectSalon) {
                      onSelectSalon(salon);
                    }
                  }}
                  className="p-3 rounded-2xl hover:bg-purple-50/90 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-700 group-hover:text-white transition-colors shadow-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-950 truncate">
                        {salon.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-500 inline shrink-0" />
                        <span>{salon.zone || salon.address || 'Aiquile'}</span>
                        <span>·</span>
                        <span className="text-amber-600 font-bold">★ {salon.rating || 5.0}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700 shrink-0 group-hover:underline flex items-center gap-1 pl-2">
                    <span>Ver salón</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer link to explore all */}
        <div className="p-3 bg-slate-50 border-t border-purple-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSearchDropdownOpen(false);
              onNavigate('salones');
            }}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
          >
            Ver catálogo completo con todos los salones en Aiquile →
          </button>
        </div>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-[0_2px_15px_-3px_rgba(147,51,234,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Brand Logo */}
          <div
            className="cursor-pointer transition-transform hover:scale-[1.01]"
            onClick={() => handleNavClick('home')}
            role="button"
            tabIndex={0}
            aria-label="Ir al inicio"
          >
            <Logo variant="header" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentView === 'home'
                  ? 'bg-purple-800 text-white shadow-sm shadow-purple-900/20'
                  : 'text-purple-900/80 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => handleNavClick('salones')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentView === 'salones'
                  ? 'bg-purple-800 text-white shadow-sm shadow-purple-900/20'
                  : 'text-purple-900/80 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Salones</span>
            </button>

            <button
              onClick={() => handleNavClick('servicios')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-purple-900/80 hover:bg-purple-50 hover:text-purple-900"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Servicios</span>
            </button>
          </nav>

          {/* Desktop & Tablet Dynamic Search Bar */}
          <div ref={desktopSearchRef} className="hidden md:flex flex-1 min-w-[220px] lg:min-w-[280px] max-w-sm lg:max-w-md mx-2 sm:mx-3 relative">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400 group-focus-within:text-purple-600">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchDropdownOpen(true);
                }}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchDropdownOpen(false);
                }}
                placeholder="Buscar salón o servicio (ej: corte, tinte...)"
                className="w-full pl-10 pr-9 py-2 bg-purple-50/70 border border-purple-200/80 rounded-full text-xs lg:text-sm text-purple-950 placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all duration-200 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {renderSearchDropdown('desktop')}
          </div>

          {/* Session Action: User Login or Dashboard Link */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Consultar Citas / Seguimiento */}
            {onOpenTracking && (
              <button
                onClick={onOpenTracking}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-purple-200 text-purple-900 bg-purple-50/70 hover:bg-purple-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Consultar estado de cita o responder contraofertas"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>Consultar Cita</span>
              </button>
            )}

            {/* Session Action: User Login or Dashboard Link */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-purple-50 p-1 rounded-2xl border border-purple-200">
                <button
                  onClick={onGoToDashboard}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-800 text-white text-xs font-bold hover:bg-purple-900 transition-colors cursor-pointer shadow-xs"
                  title="Ir a mi panel de gestión"
                >
                  {currentUser.rol === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-pink-300" />
                  ) : currentUser.rol === 'propietario' ? (
                    <Store className="w-3.5 h-3.5 text-pink-300" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-pink-300" />
                  )}
                  <span className="hidden sm:inline">
                    {currentUser.rol === 'admin'
                      ? 'Panel Admin'
                      : currentUser.rol === 'propietario'
                      ? 'Mi Panel'
                      : 'Mi Panel (Cliente)'}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:-translate-y-0.5"
                title="Iniciar sesión en TuCita"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-purple-800 hover:bg-purple-50 focus:outline-none cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar if on small screen */}
        <div ref={mobileSearchRef} className="md:hidden pb-3 pt-1 relative">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchDropdownOpen(true);
              }}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsSearchDropdownOpen(false);
              }}
              placeholder="Buscar salón o servicio (ej: corte, tinte...)"
              className="w-full pl-9 pr-8 py-2 bg-purple-50 border border-purple-200 rounded-full text-xs text-purple-950 placeholder:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchDropdownOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {renderSearchDropdown('mobile')}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-purple-100 bg-white/95 px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              currentView === 'home' ? 'bg-purple-800 text-white' : 'text-purple-900 hover:bg-purple-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>
          <button
            onClick={() => handleNavClick('salones')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              currentView === 'salones' ? 'bg-purple-800 text-white' : 'text-purple-900 hover:bg-purple-50'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Salones</span>
          </button>
          <button
            onClick={() => handleNavClick('servicios')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-purple-900 hover:bg-purple-50"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Servicios</span>
          </button>

          {onOpenTracking && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracking();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-900 hover:bg-purple-50"
            >
              <Calendar className="w-4 h-4 text-purple-700" />
              <span>Consultar mi Cita</span>
            </button>
          )}

          <div className="pt-2 border-t border-purple-100">
            {currentUser ? (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGoToDashboard();
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold bg-purple-100 text-purple-900"
                >
                  <div className="flex items-center gap-2">
                    {currentUser.rol === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : currentUser.rol === 'propietario' ? (
                      <Store className="w-4 h-4" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                    <span>
                      {currentUser.rol === 'admin'
                        ? 'Panel de Administración'
                        : currentUser.rol === 'propietario'
                        ? 'Panel de Mi Salón'
                        : 'Mi Panel de Cliente'}
                    </span>
                  </div>
                  <span className="text-xs uppercase font-mono">{currentUser.usuario}</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-purple-700 text-white"
              >
                <UserIcon className="w-4 h-4" />
                <span>Ingresar / Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
