import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Building, User, X, ArrowRight } from 'lucide-react';
import { Salon, User as UserType } from '../types';

interface AdminGlobalSearchProps {
  salons: Salon[];
  users: UserType[];
  onSelectSalon: (salon: Salon) => void;
  onSelectUser: (user: UserType) => void;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  salons,
  users,
  onSelectSalon,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      return { salons: [], users: [] };
    }

    const matchedSalons = salons.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    ).slice(0, 4);

    const matchedUsers = users.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q)
    ).slice(0, 4);

    return {
      salons: matchedSalons,
      users: matchedUsers,
    };
  }, [query, salons, users]);

  const hasResults = results.salons.length > 0 || results.users.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="w-4 h-4 text-purple-300 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar salón, propietario o usuario en el sistema..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 text-purple-100 placeholder-purple-300 text-xs border border-white/15 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-2.5 text-purple-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden z-50 text-xs text-slate-800 animate-fadeIn divide-y divide-purple-50 max-h-96 overflow-y-auto">
          {hasResults ? (
            <>
              {/* Salons Section */}
              {results.salons.length > 0 && (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 px-2 block">
                    Salones ({results.salons.length})
                  </span>
                  {results.salons.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectSalon(s);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-purple-50 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-purple-900">
                            {s.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {s.city} · Estado: {s.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Users Section */}
              {results.users.length > 0 && (
                <div className="p-2 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 px-2 block">
                    Usuarios / Propietarios ({results.users.length})
                  </span>
                  {results.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-purple-50 flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-indigo-900">
                            {u.nombre} {u.apellido} (@{u.usuario})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Rol: {u.rol.toUpperCase()} · {u.correo}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
