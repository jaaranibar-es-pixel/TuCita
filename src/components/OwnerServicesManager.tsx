import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Power,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Scissors
} from 'lucide-react';
import { ServiceItem, ServiceCategory } from '../types';
import { SERVICE_CATEGORIES } from '../data/mockSalons';

interface OwnerServicesManagerProps {
  salonName: string;
  salonId: string;
  services: ServiceItem[];
  onAddService: () => void;
  onEditService: (service: ServiceItem) => void;
  onToggleStatus: (serviceId: string) => void;
  onDeleteService: (service: ServiceItem) => void;
  onReturnToPublicView?: () => void;
}

export const OwnerServicesManager: React.FC<OwnerServicesManagerProps> = ({
  salonName,
  salonId,
  services,
  onAddService,
  onEditService,
  onToggleStatus,
  onDeleteService,
  onReturnToPublicView,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'activo' | 'inactivo'>('all');

  const salonServices = services.filter((s) => s.salonId === salonId);

  const activeCount = salonServices.filter((s) => s.status === 'activo').length;
  const inactiveCount = salonServices.filter((s) => s.status === 'inactivo').length;

  const filteredServices = useMemo(() => {
    return salonServices.filter((service) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === 'todos' || service.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || service.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [salonServices, searchTerm, selectedCategory, selectedStatus]);

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 sm:p-8 space-y-8 animate-fadeIn">
      {/* Top Banner indicating Owner Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-pink-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-pink-500/20 text-pink-200 px-2.5 py-0.5 rounded-full border border-pink-400/30">
                Panel del Propietario · Etapa 3
              </span>
              <span className="text-xs text-purple-200 font-medium">ID Salón: {salonId}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Gestión de Catálogo — {salonName}
            </h2>
          </div>
        </div>

        {onReturnToPublicView && (
          <button
            onClick={onReturnToPublicView}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
          >
            Ver catálogo público de clientes →
          </button>
        )}
      </div>

      {/* Header Row: Title & Action Button [+ Agregar servicio] */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <h3 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
            Mis servicios
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administra los servicios, precios, tiempos y disponibilidad de tu salón.
          </p>
        </div>

        {/* 6. Botón [+ Agregar servicio] */}
        <button
          onClick={onAddService}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-900/20 hover:shadow-purple-700/30 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Agregar servicio</span>
        </button>
      </div>

      {/* Metrics / Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100/90 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
            Total Servicios
          </span>
          <div className="text-2xl font-extrabold text-purple-950 tabular-nums">
            {salonServices.length}
          </div>
          <span className="text-[11px] text-slate-500 block">en el catálogo</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/90 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Servicios Activos
          </span>
          <div className="text-2xl font-extrabold text-emerald-900 tabular-nums">
            {activeCount}
          </div>
          <span className="text-[11px] text-emerald-600 block">visibles al cliente</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Servicios Inactivos
          </span>
          <div className="text-2xl font-extrabold text-slate-800 tabular-nums">
            {inactiveCount}
          </div>
          <span className="text-[11px] text-slate-500 block">pausados temporalmente</span>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en mis servicios por nombre o descripción..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 bg-purple-50/30 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 p-1 bg-purple-50 rounded-2xl border border-purple-100 text-xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              Todos ({salonServices.length})
            </button>
            <button
              onClick={() => setSelectedStatus('activo')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedStatus === 'activo'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Activos ({activeCount})
            </button>
            <button
              onClick={() => setSelectedStatus('inactivo')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                selectedStatus === 'inactivo'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactivos ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'todos'
                ? 'bg-purple-800 text-white'
                : 'bg-white border border-purple-100 text-slate-600 hover:bg-purple-50'
            }`}
          >
            Todas las categorías
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-800 text-white'
                  : 'bg-white border border-purple-100 text-slate-600 hover:bg-purple-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 6. TABLA / TARJETAS DE SERVICIOS */}
      {filteredServices.length > 0 ? (
        <div className="overflow-hidden border border-purple-100 rounded-3xl bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-purple-50/70 border-b border-purple-100 text-[11px] uppercase font-bold text-purple-900 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Servicio</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Precio</th>
                  <th className="py-3.5 px-4">Duración</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className={`hover:bg-purple-50/40 transition-colors ${
                      service.status === 'inactivo' ? 'bg-slate-50/50 opacity-80' : ''
                    }`}
                  >
                    {/* Nombre e Imagen */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={service.image}
                          alt={service.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-purple-100 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm leading-snug truncate max-w-xs">
                            {service.name}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900">
                        {service.category}
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-purple-950 text-sm">
                        Bs {service.price}
                      </span>
                    </td>

                    {/* Duración */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>{service.durationMinutes} min</span>
                      </span>
                    </td>

                    {/* Estado: Activo / Inactivo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {service.status === 'activo' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Acciones: Editar, Activar/Desactivar, Eliminar */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Activar / Desactivar toggle */}
                        <button
                          onClick={() => onToggleStatus(service.id)}
                          className={`p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                            service.status === 'activo'
                              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title={service.status === 'activo' ? 'Desactivar servicio' : 'Activar servicio'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onEditService(service)}
                          className="p-2 rounded-xl border border-purple-200 text-purple-800 hover:bg-purple-100/60 transition-colors cursor-pointer"
                          title="Editar servicio"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => onDeleteService(service)}
                          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-purple-50/40 rounded-3xl border border-purple-100 p-8 space-y-3">
          <Scissors className="w-10 h-10 text-purple-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">
            No hay servicios que coincidan con el filtro
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Puedes restablecer los filtros de búsqueda o pulsar en “+ Agregar servicio” para registrar uno nuevo.
          </p>
          <button
            onClick={onAddService}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white text-xs font-bold rounded-xl hover:bg-purple-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar primer servicio</span>
          </button>
        </div>
      )}
    </div>
  );
};
