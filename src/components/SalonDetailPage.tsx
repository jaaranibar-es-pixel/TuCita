import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  Heart,
  Share2,
  CheckCircle2,
  Maximize2,
  Settings,
  Eye,
  Plus,
  Tag
} from 'lucide-react';
import { Salon, ServiceItem, ServiceCategory, SalonScheduleConfig, Cita, User, Suscripcion, FichaAtencion } from '../types';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ReservationNoticeModal } from './ReservationNoticeModal';
import { BookingModal } from './BookingModal';
import { OwnerServicesManager } from './OwnerServicesManager';
import { ServiceFormModal } from './ServiceFormModal';
import { DeleteServiceModal } from './DeleteServiceModal';
import { SERVICE_CATEGORIES } from '../data/mockSalons';
import { createDefaultSalonSchedule } from '../utils/scheduleGenerator';

interface SalonDetailPageProps {
  salon: Salon;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  salonServices: ServiceItem[];
  scheduleConfig?: SalonScheduleConfig;
  appointments: Cita[];
  fichas?: FichaAtencion[];
  currentUser?: User | null;
  suscripcion?: Suscripcion;
  initialSelectedServiceId?: string;
  onUpdateServices: (salonId: string, services: ServiceItem[]) => void;
  onAddAppointment: (newCita: Cita) => void;
  onOpenTracking?: (codigo: string) => void;
}

export const SalonDetailPage: React.FC<SalonDetailPageProps> = ({
  salon,
  onBack,
  isFavorite,
  onToggleFavorite,
  salonServices,
  scheduleConfig,
  appointments,
  fichas,
  currentUser,
  suscripcion,
  initialSelectedServiceId,
  onUpdateServices,
  onAddAppointment,
  onOpenTracking,
}) => {
  const isAuthorizedOwnerOrAdmin = Boolean(
    currentUser &&
      (currentUser.rol === 'admin' ||
        (currentUser.rol === 'propietario' && currentUser.salonId === salon.id))
  );

  const isSalonOperative =
    salon.isAvailable &&
    salon.estado === 'activo' &&
    (!suscripcion || (suscripcion.estado !== 'SUSPENDIDA' && suscripcion.estado !== 'VENCIDA'));

  const [activeTab, setActiveTab] = useState<'cliente' | 'propietario'>('cliente');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('todos');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('todos');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Owner CRUD modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  // Filter gallery images by category
  const filteredGallery = salon.gallery.filter(
    (item) => selectedGalleryCategory === 'todos' || item.category === selectedGalleryCategory
  );

  // Filter services by category for public customer view
  const currentSalonServices = salonServices.filter((s) => s.salonId === salon.id);

  const filteredCustomerServices = currentSalonServices.filter(
    (item) => selectedServiceCategory === 'todos' || item.category === selectedServiceCategory
  );

  // Seleccionar automáticamente el servicio si el cliente viene de buscarlo en la barra superior
  React.useEffect(() => {
    if (initialSelectedServiceId && currentSalonServices.length > 0) {
      const match = currentSalonServices.find((s) => s.id === initialSelectedServiceId);
      if (match) {
        setSelectedService(match);
        setBookingModalOpen(true);
      }
    }
  }, [initialSelectedServiceId, currentSalonServices]);

  const handleOpenLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const handleOpenReservation = (service?: ServiceItem) => {
    if (!isSalonOperative) {
      return;
    }
    const targetService = service || currentSalonServices.find((s) => s.status === 'activo');
    if (!targetService || targetService.status === 'inactivo') {
      const el = document.getElementById('catalogo-servicios');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setSelectedService(targetService);
    setBookingModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // CRUD Handlers for Owner Services Management (Etapa 3)
  const handleSaveService = (serviceData: Omit<ServiceItem, 'id' | 'createdAt'> & { id?: string }) => {
    if (serviceData.id) {
      // Edit existing service
      const updated = currentSalonServices.map((s) =>
        s.id === serviceData.id
          ? {
              ...s,
              ...serviceData,
            }
          : s
      );
      onUpdateServices(salon.id, updated);
    } else {
      // Add new service
      const newService: ServiceItem = {
        ...serviceData,
        id: `srv-${salon.id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newService, ...currentSalonServices];
      onUpdateServices(salon.id, updated);
    }
  };

  const handleToggleStatus = (serviceId: string) => {
    const updated = currentSalonServices.map((s) =>
      s.id === serviceId
        ? { ...s, status: (s.status === 'activo' ? 'inactivo' : 'activo') as ServiceItem['status'] }
        : s
    );
    onUpdateServices(salon.id, updated);
  };

  const handleDeleteServiceConfirm = () => {
    if (!serviceToDelete) return;
    const updated = currentSalonServices.filter((s) => s.id !== serviceToDelete.id);
    onUpdateServices(salon.id, updated);
    setServiceToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] pb-16">
      {/* Top Breadcrumb & Dual View Selector Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-purple-100 sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-900 hover:text-purple-700 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Volver a salones</span>
          </button>

          {/* Mode Switcher: Visible únicamente para el propietario autorizado o admin */}
          {isAuthorizedOwnerOrAdmin && (
            <div className="flex items-center p-1 bg-purple-100/70 rounded-2xl border border-purple-200 text-xs">
              <button
                onClick={() => setActiveTab('cliente')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'cliente'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900/80 hover:text-purple-950'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Cliente (Pública)</span>
              </button>
              <button
                onClick={() => setActiveTab('propietario')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'propietario'
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'text-purple-900/80 hover:text-purple-950'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Panel Propietario (Mis servicios)</span>
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              </button>
            </div>
          )}

          {/* Share & Favorite buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 text-purple-800 hover:bg-purple-50 text-xs font-semibold transition-colors cursor-pointer"
              title="Compartir enlace del salón"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copiedLink ? '¡Enlace copiado!' : 'Compartir'}</span>
            </button>

            <button
              onClick={() => onToggleFavorite(salon.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 text-purple-800 hover:bg-purple-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-pink-500 text-pink-500' : 'text-purple-800'
                }`}
              />
              <span className="hidden sm:inline">
                {isFavorite ? 'En favoritos' : 'Favorito'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ENCABEZADO DEL SALÓN (BANNER GRANDE) - Imagen 100% natural sin filtro morado */}
      <section className="relative bg-slate-900 text-white overflow-hidden min-h-[300px] sm:min-h-[360px] md:min-h-[420px] flex items-end">
        {/* Banner real subido por el propietario: Sin filtro morado ni mix-blend */}
        <div className="absolute inset-0">
          <img
            src={salon.bannerImage}
            alt={`Banner de ${salon.name}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          {/* Sombra neutra inferior para legibilidad del texto sin alterar los colores naturales de la imagen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pb-14 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            {/* Salon Brand Details */}
            <div className="space-y-4 max-w-3xl">
              {/* Logo and Availability row */}
              <div className="flex items-center gap-3">
                {/* Salon Logo Badge */}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white font-extrabold text-xl sm:text-2xl shadow-2xl border-2 border-white shrink-0 overflow-hidden bg-white"
                  style={!salon.logoImage ? { backgroundColor: salon.logoBgColor || '#334155' } : undefined}
                >
                  {salon.logoImage ? (
                    <img src={salon.logoImage} alt={salon.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{salon.logoText || salon.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                {/* Availability status */}
                <div>
                  {salon.isAvailable ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Disponible para reservas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      No disponible temporalmente
                    </span>
                  )}
                  <span className="text-[11px] text-white/80 block mt-0.5 uppercase tracking-wider font-semibold">
                    {salon.neonSubtitle}
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-extrabold text-white tracking-tight uppercase">
                  {salon.name}
                </h1>
                <p className="text-base sm:text-xl text-white/90 font-light italic mt-1">
                  “{salon.tagline}”
                </p>
              </div>

              {/* Location & Reviews badge */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white shrink-0" />
                  <span className="font-semibold">{salon.city}</span>
                  <span className="text-white/80">({salon.zone})</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="font-bold text-white">{salon.rating.toFixed(1)}</span>
                  <span className="text-white/80">({salon.reviewsCount} reseñas verificadas)</span>
                </div>
              </div>
            </div>

            {/* Actions: "Reservar cita" CTA button & Quick Contact */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              {isSalonOperative ? (
                <button
                  onClick={() => handleOpenReservation()}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#9333ea] to-[#7e22ce] hover:from-[#a855f7] hover:to-[#9333ea] text-white font-bold text-base rounded-2xl shadow-xl shadow-purple-950/50 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Reservar cita</span>
                </button>
              ) : (
                <div className="px-6 py-3.5 rounded-2xl bg-rose-500/25 border border-rose-400/40 text-rose-200 text-xs font-bold text-center">
                  <span>Salón temporalmente no disponible</span>
                </div>
              )}

              <a
                href={`https://wa.me/${salon.whatsapp.replace(/[^0-9]/g, '')}?text=Hola%2C%20quisiera%20consultar%20sobre%20los%20servicios%20de%20${encodeURIComponent(salon.name)}%20en%20TuCita`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-950/30 transition-all duration-200 cursor-pointer"
                title={`Contactar a ${salon.name} por WhatsApp`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp ({salon.whatsapp})</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area based on selected Tab */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-14">
        {/* ============================================================== */}
        {/* OWNER VIEW: "Mis servicios" PANEL (ETAPA 3) */}
        {/* ============================================================== */}
        {activeTab === 'propietario' ? (
          <OwnerServicesManager
            salonName={salon.name}
            salonId={salon.id}
            services={salonServices}
            onAddService={() => {
              setServiceToEdit(null);
              setFormModalOpen(true);
            }}
            onEditService={(service) => {
              setServiceToEdit(service);
              setFormModalOpen(true);
            }}
            onToggleStatus={handleToggleStatus}
            onDeleteService={(service) => {
              setServiceToDelete(service);
              setDeleteModalOpen(true);
            }}
            onReturnToPublicView={() => setActiveTab('cliente')}
          />
        ) : (
          /* ============================================================== */
          /* CUSTOMER PUBLIC VIEW (Nuestros servicios & Salón) */
          /* ============================================================== */
          <>
            {/* 1. CATÁLOGO DE SERVICIOS: "Nuestros servicios" */}
            <section id="catalogo-servicios" className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-100 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
                    Nuestros servicios
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-800/80 font-medium mt-1">
                    Conoce los tratamientos y estilismos disponibles en {salon.name}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-purple-900 font-semibold bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-200">
                    {currentSalonServices.length} servicios en catálogo
                  </span>
                </div>
              </div>

              {/* Category Filter for Public View */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
                <button
                  onClick={() => setSelectedServiceCategory('todos')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedServiceCategory === 'todos'
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-900/80 hover:bg-purple-100'
                  }`}
                >
                  Todos ({currentSalonServices.length})
                </button>
                {SERVICE_CATEGORIES.map((cat) => {
                  const count = currentSalonServices.filter((s) => s.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedServiceCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedServiceCategory === cat
                          ? 'bg-purple-800 text-white shadow-xs'
                          : 'bg-purple-50 text-purple-900/80 hover:bg-purple-100'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomerServices.map((service) => {
                  const isServiceActive = service.status === 'activo';

                  return (
                    <div
                      key={service.id}
                      className={`group rounded-3xl border transition-all duration-200 flex flex-col overflow-hidden ${
                        isServiceActive
                          ? 'border-purple-100 bg-white hover:border-purple-300 hover:shadow-lg'
                          : 'border-slate-200 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      {/* Service Image with Category & Status badges */}
                      <div className="relative aspect-[16/9] bg-purple-900/10 overflow-hidden">
                        <img
                          src={service.image}
                          alt={service.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-purple-900 backdrop-blur-md text-[10px] font-bold shadow-xs">
                          {service.category}
                        </span>

                        {/* Status Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {isServiceActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-white shadow-xs">
                              Pausado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug group-hover:text-purple-800 transition-colors uppercase">
                            {service.name}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {service.description}
                          </p>
                        </div>

                        {/* Price & Duration */}
                        <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 font-semibold bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{service.durationMinutes} minutos</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-purple-900 font-sans tabular-nums">
                              Bs {service.price}
                            </span>
                          </div>
                        </div>

                        {/* Button "RESERVAR CITA" (Requisito 2) */}
                        {isServiceActive ? (
                          <button
                            onClick={() => handleOpenReservation(service)}
                            className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all duration-200 cursor-pointer uppercase tracking-wider"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>RESERVAR CITA</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                          >
                            <span>Temporalmente no disponible</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. INFORMACIÓN DEL SALÓN: "Sobre el salón" */}
            <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 lg:p-10 shadow-sm space-y-8">
              <div className="border-b border-purple-100 pb-4">
                <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
                  Sobre el salón
                </h2>
                <p className="text-xs sm:text-sm text-purple-800/80 font-medium mt-1">
                  Conoce la historia, el equipo y la propuesta estética de {salon.name}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Description Text */}
                <div className="lg:col-span-7 space-y-4 text-slate-600 text-sm leading-relaxed">
                  <p className="text-base text-slate-800 font-medium">
                    {salon.description}
                  </p>
                  <p>
                    Ubicado estratégicamente en <strong>{salon.zone}</strong> ({salon.city}), este establecimiento cuenta con personal capacitado para brindarte la mejor atención profesional.
                  </p>

                  {/* Additional Information Badges */}
                  {salon.additionalInfo && (
                    <div className="pt-3 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                        Aspectos destacados del salón:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {salon.additionalInfo.map((info, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/60 text-slate-700 border border-purple-100"
                          >
                            <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                            <span>{info}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Practical Info Box */}
                <div className="lg:col-span-5 bg-gradient-to-br from-purple-50 to-pink-50/40 p-6 rounded-3xl border border-purple-100 space-y-4">
                  <h3 className="font-serif font-bold text-base text-purple-950 border-b border-purple-200/60 pb-2">
                    Datos de atención y contacto
                  </h3>

                  <div className="space-y-3.5 text-xs text-slate-700">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div className="w-full">
                        <span className="font-bold text-purple-950 block">Horario de atención:</span>
                        <span>{salon.schedule}</span>
                        {scheduleConfig && (
                          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-purple-200/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                              Jornada semanal ({salon.name}):
                            </span>
                            <div className="space-y-1">
                              {scheduleConfig.dias.map((d) => (
                                <div
                                  key={d.dia}
                                  className="flex items-center justify-between text-[11px] bg-white/70 px-2 py-0.5 rounded-lg border border-purple-100"
                                >
                                  <span className="capitalize font-semibold text-slate-700">{d.nombreDia}</span>
                                  {d.activo ? (
                                    <span className="font-mono text-purple-950 font-bold">
                                      {d.horaInicio} - {d.horaFin}
                                      {d.descansos && d.descansos.length > 0 && (
                                        <span className="text-[10px] text-purple-600 font-normal ml-1">
                                          (Pausa: {d.descansos.map(b => `${b.horaInicio}-${b.horaFin}`).join(', ')})
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">Descanso</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-950 block">Dirección exacta:</span>
                        <span>{salon.address}</span>
                        <span className="block text-[11px] text-purple-700 font-medium mt-0.5">
                          {salon.city}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-950 block">Teléfono fijo / móvil:</span>
                        <a href={`tel:${salon.phone}`} className="hover:text-purple-900 underline font-medium">
                          {salon.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-900 block">WhatsApp de consultas:</span>
                        <span className="font-semibold text-emerald-800">{salon.whatsapp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-purple-200/60">
                    <button
                      onClick={() => handleOpenReservation()}
                      className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                    >
                      Agendar en {salon.name}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. GALERÍA: "Conoce nuestro salón" */}
            <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-purple-100 pb-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
                    Conoce nuestro salón
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-800/80 font-medium mt-1">
                    Explora las instalaciones, los resultados de peinado, color, manicure y atención
                  </p>
                </div>

                {/* Gallery Category Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: 'todos', label: 'Todas' },
                    { id: 'cortes', label: 'Cortes' },
                    { id: 'interior', label: 'Interior' },
                    { id: 'cabello', label: 'Cabello' },
                    { id: 'uñas', label: 'Uñas' },
                    { id: 'peinados', label: 'Peinados' },
                    { id: 'maquillaje', label: 'Maquillaje' },
                    { id: 'atencion', label: 'Atención' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedGalleryCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedGalleryCategory === tab.id
                          ? 'bg-purple-800 text-white shadow-xs'
                          : 'bg-purple-50 text-purple-900/80 hover:bg-purple-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Photo Grid with zoom on click */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredGallery.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenLightbox(idx)}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-purple-900/10 cursor-pointer border border-purple-100/80 shadow-xs hover:shadow-lg transition-all duration-300"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Overlay on hover with title and zoom icon */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/85 via-purple-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 text-white">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-semibold leading-tight line-clamp-2">
                        {item.title}
                      </h4>
                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/20 backdrop-blur-md">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-slate-400 italic">
                * Haz clic sobre cualquier fotografía para ampliarla y ver los detalles en alta resolución.
              </p>
            </section>
          </>
        )}
      </div>

      {/* Lightbox for Gallery Zoom */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={filteredGallery}
        currentIndex={activeImageIndex}
        onNavigate={(newIdx) => setActiveImageIndex(newIdx)}
        salonName={salon.name}
      />

      {/* 5-Step Customer Booking Modal (Etapa 6) */}
      {selectedService && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
          }}
          salon={salon}
          service={selectedService}
          scheduleConfig={scheduleConfig || createDefaultSalonSchedule(salon.id)}
          existingAppointments={appointments}
          fichas={fichas}
          currentUser={currentUser}
          onConfirmBooking={(newCita) => {
            onAddAppointment(newCita);
          }}
          onOpenTracking={onOpenTracking}
        />
      )}

      {/* 7 & 8. Modal Agregar / Editar Servicio */}
      <ServiceFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setServiceToEdit(null);
        }}
        onSave={handleSaveService}
        serviceToEdit={serviceToEdit}
        salonId={salon.id}
      />

      {/* 9. Modal Confirmación de Eliminación */}
      <DeleteServiceModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDeleteServiceConfirm}
        service={serviceToDelete}
      />
    </div>
  );
};
