import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Store,
  Scissors,
  Image as ImageIcon,
  Clock,
  Calendar,
  CreditCard,
  User as UserIcon,
  LogOut,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Phone,
  MessageCircle,
  MapPin,
  Save,
  Lock,
  KeyRound,
  ShieldCheck,
  Bell,
  Trash2,
  Plus,
  Upload,
  Receipt,
  X
} from 'lucide-react';
import { Logo } from './Logo';
import {
  Salon,
  User,
  ServiceItem,
  SalonScheduleConfig,
  Cita,
  HistorialCita,
  NotificacionInterna,
  CitaEstado,
  Suscripcion,
  PagoSuscripcion,
  ConfiguracionPago,
  FichaAtencion,
  PlatformConfig
} from '../types';
import { OwnerServicesManager } from './OwnerServicesManager';
import { ServiceFormModal } from './ServiceFormModal';
import { DeleteServiceModal } from './DeleteServiceModal';
import { SalonScheduleManager } from './SalonScheduleManager';
import { OwnerAppointmentsManager } from './OwnerAppointmentsManager';
import { OwnerSubscriptionManager } from './OwnerSubscriptionManager';
import { NotificationsModal } from './NotificationsModal';
import { SalonPaymentInvoiceModal } from './SalonPaymentInvoiceModal';
import { createDefaultSalonSchedule } from '../utils/scheduleGenerator';
import { formatDateToYYYYMMDD } from '../utils/appointmentManager';
import { calculateRemainingDays } from '../utils/subscriptionManager';
import { DEFAULT_PAGO_CONFIG } from '../data/mockSubscriptions';
import { verifyPasswordSync } from '../utils/security';
import { compressImageFile } from '../utils/imageCompressor';

interface OwnerDashboardProps {
  currentUser: User;
  salon: Salon | undefined;
  services: ServiceItem[];
  scheduleConfig?: SalonScheduleConfig;
  appointments?: Cita[];
  fichas?: FichaAtencion[];
  historial?: HistorialCita[];
  notifications?: NotificacionInterna[];
  suscripcion?: Suscripcion;
  pagos?: PagoSuscripcion[];
  configPago?: ConfiguracionPago;
  onLogout: () => void;
  onNavigateHome: () => void;
  onViewSalonPublic: (salon: Salon) => void;
  onUpdateSalon: (updatedSalon: Salon) => void;
  onUpdateServices: (salonId: string, updatedServices: ServiceItem[]) => void;
  onUpdateSchedule?: (config: SalonScheduleConfig) => void;
  onCreateFicha?: (fichaData: Omit<FichaAtencion, 'id' | 'fecha_creacion'>) => { success: boolean; error?: string };
  onCreateMultipleFichas?: (
    fichasList: Array<Omit<FichaAtencion, 'id' | 'fecha_creacion'>>
  ) => { success: boolean; createdCount: number; errors?: string[] };
  onUpdateFicha?: (ficha: FichaAtencion) => { success: boolean; error?: string };
  onToggleBlockFicha?: (fichaId: string) => void;
  onDeleteFicha?: (fichaId: string) => { success: boolean; error?: string };
  onUpdateCitaStatus?: (
    citaId: string,
    nuevoEstado: CitaEstado,
    observacion?: string,
    motivoRechazo?: string
  ) => void;
  onSendCounterOffer?: (
    citaId: string,
    propuesta: { fecha: string; hora_inicio: string; hora_fin: string; mensaje?: string }
  ) => void;
  onMarkNotificationAsRead?: (notifId: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onRegistrarPago?: (nuevoPago: Omit<PagoSuscripcion, 'id' | 'estado'>) => void;
  onUpdateUserPassword?: (userId: string, newPassword: string) => void;
  platformConfig?: PlatformConfig;
  onDismissActivationNotice?: () => void;
  onUploadVoucher?: (fileDataUrl: string, referenceCode: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  salon,
  services,
  scheduleConfig,
  appointments = [],
  fichas = [],
  historial = [],
  notifications = [],
  onLogout,
  onNavigateHome,
  onViewSalonPublic,
  onUpdateSalon,
  onUpdateServices,
  onUpdateSchedule,
  onCreateFicha,
  onCreateMultipleFichas,
  onUpdateFicha,
  onToggleBlockFicha,
  onDeleteFicha,
  onUpdateCitaStatus,
  onSendCounterOffer,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  suscripcion,
  pagos = [],
  configPago = DEFAULT_PAGO_CONFIG,
  platformConfig,
  onRegistrarPago,
  onUpdateUserPassword,
  onDismissActivationNotice,
  onUploadVoucher,
}) => {
  const [activeMenu, setActiveMenu] = useState<'inicio' | 'mi-salon' | 'mis-servicios' | 'galeria' | 'horarios' | 'citas' | 'suscripcion' | 'mi-perfil'>('inicio');
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [selectedCitaIdFromNotif, setSelectedCitaIdFromNotif] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(true);

  // Días restantes de suscripción
  const subscriptionDaysRemaining = suscripcion ? calculateRemainingDays(suscripcion.fecha_vencimiento) : 0;

  // Schedule configuration state (Etapa 5)
  const [currentSchedule, setCurrentSchedule] = useState<SalonScheduleConfig>(() => {
    return scheduleConfig || (salon ? createDefaultSalonSchedule(salon.id) : ({} as any));
  });

  React.useEffect(() => {
    if (scheduleConfig) {
      setCurrentSchedule(scheduleConfig);
    }
  }, [scheduleConfig]);

  const handleSaveSchedule = (newConfig: SalonScheduleConfig) => {
    setCurrentSchedule(newConfig);
    if (onUpdateSchedule) {
      onUpdateSchedule(newConfig);
    }
  };

  // Service modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  // Edit Salon Modal State (personalización de banner y logo desde la computadora en Mi Salón)
  const [editSalonModalOpen, setEditSalonModalOpen] = useState(false);
  const [editName, setEditName] = useState(salon?.name || '');
  const [editTagline, setEditTagline] = useState(salon?.tagline || '');
  const [editDescription, setEditDescription] = useState(salon?.description || '');
  const [editAddress, setEditAddress] = useState(salon?.address || '');
  const [editPhone, setEditPhone] = useState(salon?.phone || '');
  const [editWhatsApp, setEditWhatsApp] = useState(salon?.whatsapp || '');
  const [editEmail, setEditEmail] = useState(salon?.email || '');
  const [editSchedule, setEditSchedule] = useState(salon?.schedule || '');
  const [editBannerImage, setEditBannerImage] = useState(salon?.bannerImage || '');
  const [editNeonSubtitle, setEditNeonSubtitle] = useState(salon?.neonSubtitle || 'ESTILISMO PROFESIONAL');
  const [editLogoImage, setEditLogoImage] = useState(salon?.logoImage || '');
  const [editLogoBgColor, setEditLogoBgColor] = useState(salon?.logoBgColor || '#7e22ce');
  const [editLogoText, setEditLogoText] = useState(salon?.logoText || salon?.name?.slice(0, 2).toUpperCase() || 'TC');
  const [bannerFileName, setBannerFileName] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [salonEditSuccess, setSalonEditSuccess] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Handlers para cargar banner y logo directamente desde los archivos de la computadora
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFileName(file.name);
      try {
        const compressed = await compressImageFile(file, 1200, 800, 0.75);
        setEditBannerImage(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setEditBannerImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.75);
        setEditLogoImage(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setEditLogoImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Gallery Management: Subir foto de trabajo o acabado realizado para que los clientes lo vean
  const [newWorkModalOpen, setNewWorkModalOpen] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkCategory, setNewWorkCategory] = useState<'cortes' | 'cabello' | 'uñas' | 'peinados' | 'maquillaje' | 'atencion' | 'interior'>('cortes');
  const [newWorkUrl, setNewWorkUrl] = useState('');
  const [workError, setWorkError] = useState('');
  const [workSuccessToast, setWorkSuccessToast] = useState(false);

  // Change Password state in Profile
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  // Strict Permission Check: Owner must have a salon
  if (!salon) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-xl max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acceso no autorizado</h2>
          <p className="text-xs text-slate-600">
            No se encontró un salón asociado a tu cuenta de propietario ({currentUser.usuario}).
          </p>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const salonServices = services.filter((s) => s.salonId === salon.id);
  const salonAppointments = appointments.filter((c) => c.salon_id === salon.id);
  const salonHistorial = historial.filter((h) => h.salon_id === salon.id);
  const salonNotifications = notifications.filter((n) => n.salon_id === salon.id);
  const unreadNotificationsCount = salonNotifications.filter((n) => !n.leida).length;

  const pendingAppointmentsCount = salonAppointments.filter((c) => c.estado === 'PENDIENTE').length;
  const confirmedAppointmentsCount = salonAppointments.filter((c) => c.estado === 'CONFIRMADA').length;
  const rejectedAppointmentsCount = salonAppointments.filter((c) => c.estado === 'RECHAZADA').length;
  const todayStr = formatDateToYYYYMMDD(new Date());
  const todayAppointmentsCount = salonAppointments.filter((c) => c.fecha === todayStr).length;

  // CRUD Handlers for Services
  const handleSaveService = (serviceData: Omit<ServiceItem, 'id' | 'createdAt'> & { id?: string }) => {
    if (serviceData.id) {
      const updated = salonServices.map((s) =>
        s.id === serviceData.id ? { ...s, ...serviceData } : s
      );
      onUpdateServices(salon.id, updated);
    } else {
      const newService: ServiceItem = {
        ...serviceData,
        id: `srv-${salon.id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      onUpdateServices(salon.id, [newService, ...salonServices]);
    }
  };

  const handleToggleStatus = (serviceId: string) => {
    const updated = salonServices.map((s) =>
      s.id === serviceId
        ? { ...s, status: (s.status === 'activo' ? 'inactivo' : 'activo') as ServiceItem['status'] }
        : s
    );
    onUpdateServices(salon.id, updated);
  };

  const handleDeleteServiceConfirm = () => {
    if (!serviceToDelete) return;
    const updated = salonServices.filter((s) => s.id !== serviceToDelete.id);
    onUpdateServices(salon.id, updated);
    setServiceToDelete(null);
  };

  // Handler for saving edited salon details (Banner, Logo, WhatsApp, Info)
  const handleSaveSalonDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Salon = {
      ...salon,
      name: editName.trim() || salon.name,
      tagline: editTagline.trim() || salon.tagline,
      description: editDescription.trim() || salon.description,
      address: editAddress.trim() || salon.address,
      phone: editPhone.trim() || salon.phone,
      whatsapp: editWhatsApp.trim() || salon.whatsapp,
      email: editEmail.trim() || salon.email,
      schedule: editSchedule.trim() || salon.schedule,
      bannerImage: editBannerImage.trim() || salon.bannerImage,
      coverImage: editBannerImage.trim() || salon.coverImage,
      neonSubtitle: editNeonSubtitle.trim() || salon.neonSubtitle,
      logoImage: editLogoImage.trim() || undefined,
      logoBgColor: editLogoBgColor.trim() || salon.logoBgColor,
      logoText: editLogoText.trim() || salon.logoText,
    };
    onUpdateSalon(updated);
    setEditSalonModalOpen(false);
    setSalonEditSuccess(true);
    setTimeout(() => setSalonEditSuccess(false), 3000);
  };

  // Handler para agregar foto de trabajo o acabado a la galería del salón
  const handleSaveWorkPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkUrl.trim()) {
      setWorkError('Por favor ingresa una URL de imagen o selecciona una foto.');
      return;
    }
    if (!newWorkTitle.trim()) {
      setWorkError('Por favor asigna un título descriptivo al corte o acabado.');
      return;
    }

    const newImageItem = {
      id: `gal-${salon.id}-${Date.now()}`,
      url: newWorkUrl.trim(),
      title: newWorkTitle.trim(),
      category: newWorkCategory,
    };

    const updatedGallery = [newImageItem, ...salon.gallery];
    onUpdateSalon({
      ...salon,
      gallery: updatedGallery,
    });

    setNewWorkModalOpen(false);
    setNewWorkTitle('');
    setNewWorkUrl('');
    setWorkError('');
    setWorkSuccessToast(true);
    setTimeout(() => setWorkSuccessToast(false), 3500);
  };

  const handleDeleteWorkPhoto = (photoId: string) => {
    const updatedGallery = salon.gallery.filter((g) => g.id !== photoId);
    onUpdateSalon({
      ...salon,
      gallery: updatedGallery,
    });
  };

  // Handler for password change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      setPassError('Por favor completa todos los campos de contraseña.');
      return;
    }
    if (!verifyPasswordSync(currentPass, currentUser.contrasena)) {
      setPassError('La contraseña actual es incorrecta.');
      return;
    }
    if (newPass.length < 5) {
      setPassError('La nueva contraseña debe tener al menos 5 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (onUpdateUserPassword) {
      onUpdateUserPassword(currentUser.id, newPass);
    } else {
      currentUser.contrasena = newPass;
    }
    setPassError('');
    setPassSuccess(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col">
      {/* Header Directo del Propietario: Nombre de Salón, Estado Público, Notificaciones, Propietario y Cerrar Sesión */}
      <header className="bg-purple-950 text-white sticky top-0 z-30 shadow-md border-b border-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
          {/* 1. Nombre del Salón */}
          <div className="flex items-center gap-3">
            <Logo variant="header" theme="white" />
            <div className="flex items-center gap-2 pl-3 border-l border-purple-800">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow-md border border-white/20 shrink-0 overflow-hidden"
                style={{ backgroundColor: salon.logoBgColor || '#9333ea' }}
              >
                {salon.logoImage ? (
                  <img src={salon.logoImage} alt={salon.name} className="w-full h-full object-cover" />
                ) : (
                  salon.logoText || salon.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="leading-tight">
                <span className="text-sm sm:text-base font-extrabold text-white tracking-tight block">
                  {salon.name}
                </span>
                <span className="text-[10px] text-pink-300 font-medium hidden sm:block">
                  {salon.neonSubtitle || 'Salón de Belleza'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* 2. Estado de mi salón público */}
            <button
              onClick={() => onViewSalonPublic(salon)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer shadow-xs"
              title="Ver cómo los clientes ven mi salón público en TuCita"
            >
              <span className="text-purple-300 font-semibold hidden md:inline">Estado de mi salón público:</span>
              {salon.estado === 'activo' ? (
                <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Activo (Público)
                </span>
              ) : (
                <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {salon.estado === 'suspendido' ? 'Suspendido' : 'Inactivo'}
                </span>
              )}
              <ExternalLink className="w-3.5 h-3.5 text-purple-300 ml-0.5" />
            </button>

            {/* 3. Sus notificaciones */}
            <button
              onClick={() => setNotificationsModalOpen(true)}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 transition-colors cursor-pointer"
              title="Notificaciones de mi salón"
              aria-label="Notificaciones"
            >
              <Bell className="w-4 h-4 text-pink-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-purple-950 shadow-xs animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* 4. El nombre del propietario */}
            <div className="flex items-center gap-2 pl-2 border-l border-purple-800">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-xs text-xs border border-white/20"
                style={{ backgroundColor: salon.logoBgColor || '#db2777' }}
              >
                {currentUser.nombre[0]}{currentUser.apellido[0]}
              </div>
              <div className="hidden lg:block leading-tight text-left">
                <span className="font-bold block text-white text-xs">
                  {currentUser.nombre} {currentUser.apellido}
                </span>
              </div>
            </div>

            {/* 5. Cerrar sesión */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold transition-colors cursor-pointer ml-1 shadow-xs"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* 72-HOUR RESTRICTED STAGING / PAYMENT NOTICE BANNER */}
      {salon.estado !== 'activo' && (
        <div className="bg-gradient-to-r from-purple-950 via-[#370f5e] to-purple-950 text-white border-b-2 border-amber-400 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                <Clock className="w-5 h-5 text-purple-950 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                    Modo Preparación · Salón No Publicado Aún
                  </span>
                  <span className="text-[11px] text-purple-200">
                    (Puedes configurar todo tu salón · Se publica al confirmar tu pago)
                  </span>
                </div>
                <p className="text-xs text-purple-100 max-w-2xl leading-snug">
                  Plazo de 72 horas para pagar y enviar boleta. Si pasan las 72 horas sin pago confirmado, la cuenta y datos se eliminarán automáticamente por seguridad.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full md:w-auto">
              <button
                onClick={() => setInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Ver Factura & QR (72h)</span>
              </button>

              <a
                href={`https://wa.me/${(platformConfig?.contactWhatsApp || '59172891234').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hola Administrador de TuCita, soy el propietario de "${salon.name}". Ya realicé mi pago con factura ${salon.ordenPago?.id || 'FAC-TU-CITA'}. Por favor revise mi comprobante para habilitar mi página.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Avisar WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FELICITACIONES CUANDO EL SALÓN ES HABILITADO POR EL ADMIN */}
      {(salon.cuentaHabilitadaNotificacion || currentUser.cuentaHabilitadaNotificacion) && showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl border-2 border-emerald-400">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
              🎉
            </div>
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-widest font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ¡Cuenta Verificada y Salón Habilitado!
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 leading-tight">
                Se habilitó su cuenta de salón de belleza, ya están disponibles todas sus funciones
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                ¡Felicidades! El administrador de TuCita ha confirmado tu pago. Tu salón <strong>{salon.name}</strong> ya se encuentra publicado y disponible en el catálogo oficial de Aiquile. Ahora los clientes pueden ver tus servicios, fotos y reservar citas o fichas.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCelebrationModal(false);
                  if (onDismissActivationNotice) onDismissActivationNotice();
                  onViewSalonPublic(salon);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ver mi salón en la web pública</span>
              </button>
              <button
                onClick={() => {
                  setShowCelebrationModal(false);
                  if (onDismissActivationNotice) onDismissActivationNotice();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Continuar en mi panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Grid with Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Owner Navigation Menu matching specification */}
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-purple-100 shadow-sm p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menú del Propietario
          </div>

          {/* Menú: Inicio */}
          <button
            onClick={() => setActiveMenu('inicio')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'inicio'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          {/* Menú: Mi salón */}
          <button
            onClick={() => setActiveMenu('mi-salon')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'mi-salon'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Mi salón</span>
          </button>

          {/* Menú: Mis servicios */}
          <button
            onClick={() => setActiveMenu('mis-servicios')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'mis-servicios'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4" />
              <span>Mis servicios</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
              {salonServices.length}
            </span>
          </button>

          {/* Menú: Galería */}
          <button
            onClick={() => setActiveMenu('galeria')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'galeria'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Galería</span>
          </button>

          {/* Menú: Horarios */}
          <button
            onClick={() => setActiveMenu('horarios')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'horarios'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Horarios</span>
          </button>

          {/* Menú: Citas (Requisito 3) */}
          <button
            onClick={() => setActiveMenu('citas')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'citas'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4" />
              <span>
                {pendingAppointmentsCount > 0 ? `Citas (${pendingAppointmentsCount})` : 'Citas'}
              </span>
            </div>
            {pendingAppointmentsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* Menú: Suscripción (Etapa 9) */}
          <button
            onClick={() => setActiveMenu('suscripcion')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'suscripcion'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Suscripción</span>
            </div>
            {suscripcion?.estado === 'SUSPENDIDA' || suscripcion?.estado === 'VENCIDA' ? (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500 text-white">
                Vencida
              </span>
            ) : suscripcion?.estado === 'PENDIENTE DE VALIDACIÓN' ? (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-400 text-purple-950 animate-pulse">
                Validando
              </span>
            ) : suscripcion && subscriptionDaysRemaining <= 7 ? (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white">
                {subscriptionDaysRemaining}d
              </span>
            ) : null}
          </button>

          {/* Menú: Mi perfil */}
          <button
            onClick={() => setActiveMenu('mi-perfil')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'mi-perfil'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Mi perfil</span>
          </button>

          <div className="pt-4 mt-4 border-t border-purple-50">
            {/* Cerrar sesión */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Right Content Area based on selected Menu */}
        <main className="lg:col-span-9 space-y-6">
          {/* 5. PANEL INICIAL DEL PROPIETARIO */}
          {activeMenu === 'inicio' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Welcome Card matching prompt */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900 via-purple-950 to-indigo-950 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-semibold border border-white/10">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Panel Oficial TuCita</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">
                    Bienvenido a TuCita, {currentUser.nombre}
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-200">
                    Administra tu salón de belleza desde un solo lugar.
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setActiveMenu('mis-servicios')}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer text-center"
                  >
                    + Administrar mis servicios
                  </button>
                  <button
                    onClick={() => onViewSalonPublic(salon)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 text-center transition-colors cursor-pointer"
                  >
                    Ver mi catálogo público →
                  </button>
                </div>
              </div>

              {/* Alerta de Suscripción en Dashboard Inicio (Requisitos 19, 20, 21) */}
              {suscripcion && (suscripcion.estado === 'SUSPENDIDA' || suscripcion.estado === 'VENCIDA' || subscriptionDaysRemaining <= 7) && (
                <div
                  className={`p-4 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    suscripcion.estado === 'SUSPENDIDA' || suscripcion.estado === 'VENCIDA'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        suscripcion.estado === 'SUSPENDIDA' || suscripcion.estado === 'VENCIDA'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    />
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-sm block">
                        {suscripcion.estado === 'SUSPENDIDA'
                          ? 'Salón Suspendido por Suscripción Vencida'
                          : suscripcion.estado === 'VENCIDA'
                          ? 'Suscripción Vencida'
                          : `Suscripción próxima a vencer (${subscriptionDaysRemaining} días restantes)`}
                      </span>
                      <p>
                        {suscripcion.estado === 'SUSPENDIDA'
                          ? 'Tu salón se encuentra suspendido y no está disponible para clientes. Realiza tu pago mediante QR para reactivarlo.'
                          : 'Recuerda renovar tu suscripción antes del vencimiento para mantener tu catálogo activo.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMenu('suscripcion')}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
                  >
                    Pagar / Renovar Suscripción
                  </button>
                </div>
              )}

              {/* Estadísticas de Citas (Requisito 16) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <span>Estadísticas de Citas del Salón</span>
                  </h3>
                  <button
                    onClick={() => setActiveMenu('citas')}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-950 hover:underline cursor-pointer"
                  >
                    Ir al panel de citas →
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Pendientes */}
                  <div
                    onClick={() => setActiveMenu('citas')}
                    className="bg-white p-5 rounded-3xl border border-amber-200 shadow-xs space-y-1 hover:border-amber-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block">
                      Pendientes
                    </span>
                    <div className="text-3xl font-extrabold text-amber-900 tabular-nums font-mono flex items-center justify-between">
                      <span>{pendingAppointmentsCount}</span>
                      {pendingAppointmentsCount > 0 && (
                        <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] text-amber-700 block">
                      {pendingAppointmentsCount === 1 ? '1 por revisar' : `${pendingAppointmentsCount} por revisar`}
                    </span>
                  </div>

                  {/* 2. Confirmadas */}
                  <div
                    onClick={() => setActiveMenu('citas')}
                    className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-1 hover:border-emerald-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                      Confirmadas
                    </span>
                    <div className="text-3xl font-extrabold text-emerald-950 tabular-nums font-mono">
                      {confirmedAppointmentsCount}
                    </div>
                    <span className="text-[11px] text-emerald-700 block">
                      Horarios agendados
                    </span>
                  </div>

                  {/* 3. Rechazadas */}
                  <div
                    onClick={() => setActiveMenu('citas')}
                    className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-1 hover:border-rose-300 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block">
                      Rechazadas
                    </span>
                    <div className="text-3xl font-extrabold text-rose-950 tabular-nums font-mono">
                      {rejectedAppointmentsCount}
                    </div>
                    <span className="text-[11px] text-rose-600 block">
                      Horarios liberados
                    </span>
                  </div>

                  {/* 4. Citas de hoy */}
                  <div
                    onClick={() => setActiveMenu('citas')}
                    className="bg-white p-5 rounded-3xl border border-purple-200 shadow-xs space-y-1 hover:border-purple-400 transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-800 block">
                      Citas de hoy
                    </span>
                    <div className="text-3xl font-extrabold text-purple-950 tabular-nums font-mono">
                      {todayAppointmentsCount}
                    </div>
                    <span className="text-[11px] text-purple-700 block">
                      Para la jornada de hoy
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Informative Cards matching Section 5 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Nombre del salón */}
                <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Nombre del salón
                  </span>
                  <div className="text-lg font-extrabold text-slate-900 truncate">
                    {salon.name}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {salon.city}
                  </span>
                </div>

                {/* 2. Estado del salón */}
                <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Estado del salón
                  </span>
                  <div>
                    {salon.estado === 'activo' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Activo / Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {salon.estado === 'activo' ? 'Abierto a reservas' : 'Pausado'}
                  </span>
                </div>

                {/* 3. Cantidad de servicios */}
                <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Cantidad de servicios
                  </span>
                  <div className="text-3xl font-extrabold text-purple-950 tabular-nums">
                    {salonServices.length}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {salonServices.filter(s => s.status === 'activo').length} activos en catálogo
                  </span>
                </div>

                {/* 4. Estado de la cuenta */}
                <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Estado de la cuenta
                  </span>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cuenta Verificada
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 block font-semibold">
                    Al día en TuCita
                  </span>
                </div>
              </div>

              {/* Quick Salon Overview */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Resumen de tu salón ({salon.name})
                  </h3>
                  <button
                    onClick={() => setActiveMenu('mi-salon')}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
                  >
                    Ver detalles completos →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                  <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1.5">
                    <span className="font-bold text-purple-950 block">Eslogan comercial:</span>
                    <p className="italic text-purple-900 font-medium">“{salon.tagline}”</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1.5">
                    <span className="font-bold text-purple-950 block">Ubicación física:</span>
                    <p>{salon.address}, {salon.city}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1.5">
                    <span className="font-bold text-purple-950 block">Contacto telefónico y WhatsApp:</span>
                    <p>Tel: {salon.phone} · WhatsApp: {salon.whatsapp}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1.5">
                    <span className="font-bold text-purple-950 block">Horario de atención:</span>
                    <p>{salon.schedule}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. SECCIÓN "MI SALÓN" */}
          {activeMenu === 'mi-salon' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-purple-100">
                <div>
                  <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                    Mi Salón
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Información pública, datos de contacto, horarios y presentación de {salon.name}.
                  </p>
                </div>

                {/* Botón EDITAR INFORMACIÓN Y PERSONALIZAR BANNER / LOGO */}
                <button
                  onClick={() => {
                    setEditName(salon.name);
                    setEditTagline(salon.tagline);
                    setEditDescription(salon.description);
                    setEditAddress(salon.address);
                    setEditPhone(salon.phone);
                    setEditWhatsApp(salon.whatsapp);
                    setEditEmail(salon.email || '');
                    setEditSchedule(salon.schedule);
                    setEditBannerImage(salon.bannerImage);
                    setEditNeonSubtitle(salon.neonSubtitle || 'ESTILISMO PROFESIONAL');
                    setEditLogoImage(salon.logoImage || '');
                    setEditLogoBgColor(salon.logoBgColor || '#7e22ce');
                    setEditLogoText(salon.logoText || salon.name.slice(0, 2).toUpperCase());
                    setBannerFileName('');
                    setLogoFileName('');
                    setEditSalonModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>EDITAR SALÓN, BANNER Y LOGO</span>
                </button>
              </div>

              {salonEditSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Información del salón actualizada exitosamente.</span>
                </div>
              )}

              {/* Salon Profile Details Card */}
              <div className="space-y-6">
                {/* Banner & Logo Visual representation */}
                <div className="relative rounded-3xl overflow-hidden aspect-[21/9] bg-slate-950 shadow-md">
                  <img
                    src={salon.bannerImage}
                    alt={salon.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-lg overflow-hidden shrink-0 bg-white/95"
                        style={!salon.logoImage ? { backgroundColor: salon.logoBgColor || '#7e22ce' } : undefined}
                      >
                        {salon.logoImage ? (
                          <img src={salon.logoImage} alt={salon.name} className="w-full h-full object-cover" />
                        ) : (
                          salon.logoText || salon.name.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-extrabold">{salon.name}</h3>
                        <p className="text-xs text-purple-200 italic">“{salon.tagline}”</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
                      {salon.estado.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Fields Grid matching Section 6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Nombre del salón
                    </span>
                    <p className="text-sm font-bold text-slate-900">{salon.name}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Estado del salón
                    </span>
                    <p className="text-sm font-bold text-purple-900 capitalize">{salon.estado}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 md:col-span-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Descripción
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{salon.description}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Dirección exacta
                    </span>
                    <p className="text-xs font-medium text-slate-800">{salon.address}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Municipio y Departamento
                    </span>
                    <p className="text-xs font-medium text-slate-800">
                      {salon.municipio || 'Aiquile'}, {salon.departamento || 'Cochabamba'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Teléfono de contacto
                    </span>
                    <p className="text-xs font-medium text-slate-800">{salon.phone}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      WhatsApp para clientes
                    </span>
                    <p className="text-xs font-bold text-emerald-800">{salon.whatsapp}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Correo electrónico
                    </span>
                    <p className="text-xs font-medium text-slate-800">{salon.email || `${currentUser.usuario}@tucita.bo`}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Horario general de atención
                    </span>
                    <p className="text-xs font-medium text-slate-800">{salon.schedule}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. SECCIÓN "MIS SERVICIOS" */}
          {activeMenu === 'mis-servicios' && (
            <OwnerServicesManager
              salonName={salon.name}
              salonId={salon.id}
              services={services}
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
            />
          )}

          {/* SECCIÓN "GALERÍA" (Gestión de trabajos reales, cortes y acabados de clientes) */}
          {activeMenu === 'galeria' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
                <div>
                  <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                    Galería del Salón ({salon.name})
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Publica fotografías de tus trabajos reales (cortes, tintes, acabados, peinados, uñas) para que los clientes las vean en tu perfil público.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewWorkTitle('');
                    setNewWorkUrl('');
                    setNewWorkCategory('cortes');
                    setWorkError('');
                    setNewWorkModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Subir foto de trabajo / acabado</span>
                </button>
              </div>

              {workSuccessToast && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Foto de trabajo publicada exitosamente en la galería pública de tu salón!</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {salon.gallery.map((img) => (
                  <div
                    key={img.id}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-purple-100 bg-purple-50 shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Overlay info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3.5 flex flex-col justify-between text-white transition-opacity">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-900/80 backdrop-blur-md text-pink-300 border border-pink-400/30">
                          {img.category}
                        </span>

                        <button
                          onClick={() => handleDeleteWorkPhoto(img.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white transition-all cursor-pointer shadow-xs"
                          title="Eliminar esta foto de la galería"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <span className="text-xs font-bold block truncate text-white">{img.title}</span>
                        <span className="text-[10px] text-purple-200">Visible para clientes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {salon.gallery.length === 0 && (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <ImageIcon className="w-12 h-12 mx-auto text-purple-200" />
                  <p className="text-sm">Aún no has subido fotos de trabajos o cortes a tu galería.</p>
                  <button
                    onClick={() => setNewWorkModalOpen(true)}
                    className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold"
                  >
                    Subir primera fotografía
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN "HORARIOS DE ATENCIÓN" (ETAPA 5) */}
          {activeMenu === 'horarios' && (
            <SalonScheduleManager
              salon={salon}
              services={salonServices}
              scheduleConfig={currentSchedule}
              fichas={fichas}
              appointments={salonAppointments}
              onSaveSchedule={handleSaveSchedule}
              onCreateFicha={onCreateFicha || ((f) => ({ success: true }))}
              onCreateMultipleFichas={onCreateMultipleFichas}
              onUpdateFicha={onUpdateFicha || ((f) => ({ success: true }))}
              onToggleBlockFicha={onToggleBlockFicha || (() => {})}
              onDeleteFicha={onDeleteFicha || ((id) => ({ success: true }))}
              onNavigateToCita={(citaId) => {
                setActiveMenu('citas');
                setSelectedCitaIdFromNotif(citaId);
              }}
            />
          )}

          {/* SECCIÓN "CITAS" (ETAPA 6 & 7) */}
          {activeMenu === 'citas' && (
            <OwnerAppointmentsManager
              salon={salon}
              appointments={salonAppointments}
              historial={salonHistorial}
              currentUser={currentUser}
              scheduleConfig={scheduleConfig}
              onUpdateCitaStatus={onUpdateCitaStatus || (() => {})}
              onSendCounterOffer={onSendCounterOffer}
              selectedCitaIdFromNotif={selectedCitaIdFromNotif}
            />
          )}

          {/* SECCIÓN "SUSCRIPCIÓN" (ETAPA 9) */}
          {activeMenu === 'suscripcion' && (
            <OwnerSubscriptionManager
              salon={salon}
              currentUser={currentUser}
              suscripcion={suscripcion}
              pagos={pagos}
              configPago={configPago || DEFAULT_PAGO_CONFIG}
              onRegistrarPago={onRegistrarPago || (() => {})}
            />
          )}

          {/* 10. SECCIÓN "MI PERFIL" */}
          {activeMenu === 'mi-perfil' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-8 animate-fadeIn">
              <div className="pb-4 border-b border-purple-100">
                <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  Mi Perfil de Propietario
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Datos de tu cuenta de acceso y credenciales personales.
                </p>
              </div>

              {/* Informative fields matching Section 10 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Nombre
                  </span>
                  <p className="text-sm font-bold text-slate-900">{currentUser.nombre}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Apellido
                  </span>
                  <p className="text-sm font-bold text-slate-900">{currentUser.apellido}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Usuario
                  </span>
                  <p className="text-sm font-mono font-bold text-purple-900">@{currentUser.usuario}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Correo electrónico
                  </span>
                  <p className="text-sm font-medium text-slate-800">{currentUser.correo}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Teléfono
                  </span>
                  <p className="text-sm font-medium text-slate-800">{currentUser.telefono || 'No registrado'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Salón asociado
                  </span>
                  <p className="text-sm font-bold text-purple-900">{salon.name}</p>
                </div>
              </div>

              {/* Formulario "Cambiar contraseña" matching Section 10 */}
              <div className="pt-4 border-t border-purple-100 space-y-4 max-w-md">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-700" />
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Cambiar contraseña
                  </h3>
                </div>

                {passError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {passError}
                  </div>
                )}

                {passSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    Contraseña actualizada exitosamente.
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contraseña actual</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Tu contraseña actual..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nueva contraseña</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Mínimo 5 caracteres..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repite la nueva contraseña..."
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer mt-1"
                  >
                    Guardar nueva contraseña
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Editar Salón (Mi Salón) */}
      {editSalonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
          onClick={() => setEditSalonModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 my-8 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900">
                  Editar Información de {salon.name}
                </h3>
                <p className="text-xs text-purple-800">
                  Actualiza los datos públicos y de contacto de tu salón.
                </p>
              </div>
              <button
                onClick={() => setEditSalonModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalonDetails} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Sección 1: Banner y Portada Pública (Carga desde la Computadora) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-serif font-bold text-sm text-purple-950 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-700" />
                      1. Banner del Salón (Subir desde mi Computadora)
                    </span>
                    <p className="text-[11px] text-purple-900/80 mt-0.5">
                      Sube la imagen de banner directamente desde tu computadora. Los clientes la verán en la portada de tu salón.
                    </p>
                  </div>
                  {bannerFileName && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      Archivo cargado
                    </span>
                  )}
                </div>

                {/* Input de archivo oculto para Banner */}
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/jpg"
                  className="hidden"
                  onChange={handleBannerFileChange}
                />

                {/* Zona de Carga interactiva desde la PC */}
                <div
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 hover:border-purple-600 bg-white hover:bg-purple-50/50 p-4 rounded-2xl text-center cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-200 text-purple-700 mx-auto flex items-center justify-center transition-colors mb-2">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-bold text-xs text-purple-950 block">
                    Haz clic aquí para seleccionar el banner desde tu computadora
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Formatos recomendados: JPG, PNG, WEBP (orientación panorámica 16:9 o 21:9)
                  </span>
                  {bannerFileName && (
                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-900 text-[11px] font-bold rounded-lg">
                      📁 Archivo seleccionado: {bannerFileName}
                    </span>
                  )}
                </div>

                {/* Previsualización del Banner actual o seleccionado */}
                {editBannerImage && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Vista previa del banner:</span>
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
                      >
                        Cambiar imagen de mi PC
                      </button>
                    </div>
                    <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-purple-200 shadow-sm bg-purple-950">
                      <img
                        src={editBannerImage}
                        alt="Vista previa del banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                        <span className="text-white text-xs font-bold drop-shadow-md">
                          {editNeonSubtitle || 'BANNER DEL SALÓN'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selección alternativa: Banners predefinidos sugeridos */}
                <div className="pt-2 border-t border-purple-200/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                    O elige un fondo alternativo predefinido:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Modern Salon', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80' },
                      { name: 'Luxury Spa', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80' },
                      { name: 'Chic Studio', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80' }
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => {
                          setEditBannerImage(preset.url);
                          setBannerFileName('');
                        }}
                        className={`group relative aspect-[16/9] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          editBannerImage === preset.url ? 'border-purple-600 ring-2 ring-purple-300' : 'border-slate-200 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold py-0.5 text-center">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Subtítulo o lema en el banner</label>
                  <input
                    type="text"
                    value={editNeonSubtitle}
                    onChange={(e) => setEditNeonSubtitle(e.target.value)}
                    placeholder="Ej: ESTILISMO PROFESIONAL Y BELLEZA"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white"
                  />
                </div>
              </div>

              {/* Sección 2: Logo Oficial del Salón (Carga desde la Computadora) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-serif font-bold text-sm text-purple-950 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-700" />
                      2. Logo del Salón (Subir desde mi Computadora)
                    </span>
                    <p className="text-[11px] text-purple-900/80 mt-0.5">
                      Sube el logo de tu negocio desde tu computadora. Si no cuentas con una imagen, puedes usar el monograma con iniciales.
                    </p>
                  </div>
                  {editLogoImage && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      Logo activo
                    </span>
                  )}
                </div>

                {/* Input de archivo oculto para Logo */}
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/jpg"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />

                {/* Zona de Carga de Logo desde la PC */}
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 hover:border-purple-600 bg-white hover:bg-purple-50/50 p-4 rounded-2xl text-center cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-200 text-purple-700 mx-auto flex items-center justify-center transition-colors mb-2">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="font-bold text-xs text-purple-950 block">
                    Haz clic aquí para seleccionar el archivo del logo desde tu computadora
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Formatos recomendados: PNG transparente, SVG, JPG, WEBP (cuadrado 1:1)
                  </span>
                  {logoFileName && (
                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-900 text-[11px] font-bold rounded-lg">
                      📁 Archivo de logo: {logoFileName}
                    </span>
                  )}
                </div>

                {/* Previsualización del Logo cargado */}
                {editLogoImage ? (
                  <div className="p-3 bg-white rounded-2xl border border-purple-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-400 shadow-md bg-white shrink-0">
                        <img
                          src={editLogoImage}
                          alt="Logo del salón"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Logo seleccionado</span>
                        <span className="text-[11px] text-emerald-700 font-semibold block">
                          ✓ Se guardará con tu perfil de salón
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] cursor-pointer"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditLogoImage('');
                          setLogoFileName('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Fallback Monograma / Iniciales si no tiene imagen */
                  <div className="space-y-3 pt-2 border-t border-purple-200/60">
                    <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                      O diseña un monograma con iniciales si no tienes logo en imagen:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">Iniciales del Logo (2-3 letras)</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={editLogoText}
                          onChange={(e) => setEditLogoText(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl border border-purple-200 uppercase font-mono font-bold bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">Color de fondo</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editLogoBgColor}
                            onChange={(e) => setEditLogoBgColor(e.target.value)}
                            className="w-10 h-9 p-0.5 rounded-lg border border-purple-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editLogoBgColor}
                            onChange={(e) => setEditLogoBgColor(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-purple-200 font-mono text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previsualización en vivo integrada de Banner + Logo juntos tal como lo verán los clientes */}
                <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-slate-950 text-white shadow-md">
                  {editBannerImage && (
                    <img
                      src={editBannerImage}
                      alt="Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="relative z-10 p-3.5 h-full flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 drop-shadow-md">
                      Así se verá en la cabecera pública para los clientes:
                    </span>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow-lg border-2 border-white overflow-hidden shrink-0 bg-white/95"
                        style={!editLogoImage ? { backgroundColor: editLogoBgColor || '#7e22ce' } : undefined}
                      >
                        {editLogoImage ? (
                          <img src={editLogoImage} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          editLogoText || 'TC'
                        )}
                      </div>
                      <div className="text-xs drop-shadow-md">
                        <span className="font-bold text-white text-sm block">{editName || salon.name}</span>
                        <span className="text-[11px] text-pink-200 font-medium">{editNeonSubtitle || 'ESTILISMO PROFESIONAL'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Datos de contacto y WhatsApp directo */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Nombre del salón</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Eslogan comercial</label>
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Descripción completa</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Dirección física</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Horario de atención</label>
                    <input
                      type="text"
                      value={editSchedule}
                      onChange={(e) => setEditSchedule(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Teléfono</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-emerald-900 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Número de WhatsApp para clientes</span>
                    </label>
                    <input
                      type="text"
                      value={editWhatsApp}
                      onChange={(e) => setEditWhatsApp(e.target.value)}
                      placeholder="+591 71234567"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/30 text-emerald-950 font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Este número abre directamente la conversación de WhatsApp cuando los clientes pulsan el botón en tu salón.
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Correo electrónico</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setEditSalonModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-purple-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modales de Gestión de Servicios (Etapa 3) */}
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

      <DeleteServiceModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDeleteServiceConfirm}
        service={serviceToDelete}
      />

      {/* Modal de Notificaciones Internas (Etapa 7) */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={salonNotifications}
        onMarkAsRead={(notifId) => {
          if (onMarkNotificationAsRead) onMarkNotificationAsRead(notifId);
        }}
        onMarkAllAsRead={() => {
          if (onMarkAllNotificationsAsRead) onMarkAllNotificationsAsRead();
        }}
        onSelectNotificationCita={(citaId) => {
          if (citaId) {
            setActiveMenu('citas');
            setSelectedCitaIdFromNotif(citaId);
          } else {
            setActiveMenu('suscripcion');
          }
        }}
      />

      {/* Modal para Subir Foto de Trabajo / Acabado Realizado a la Galería */}
      {newWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-pink-300">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">Subir Foto de Trabajo Realizado</h3>
                  <p className="text-xs text-purple-200">Publica un corte, peinado, color o acabado en la galería de {salon.name}</p>
                </div>
              </div>
              <button
                onClick={() => setNewWorkModalOpen(false)}
                className="p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkPhoto} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {workError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {workError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Título o descripción del trabajo</label>
                <input
                  type="text"
                  placeholder="Ej: Corte Fade Degradado, Balayage Rubio Miel, Manicura Rusa"
                  value={newWorkTitle}
                  onChange={(e) => setNewWorkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Categoría del trabajo</label>
                <select
                  value={newWorkCategory}
                  onChange={(e) => setNewWorkCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white"
                >
                  <option value="cortes">Cortes de Pelo / Barbería</option>
                  <option value="cabello">Cabello / Tintes / Balayage</option>
                  <option value="peinados">Peinados y Estilismo</option>
                  <option value="uñas">Uñas / Manicura / Pedicura</option>
                  <option value="maquillaje">Maquillaje Profesional</option>
                  <option value="atencion">Atención al Cliente</option>
                  <option value="interior">Instalaciones del Salón</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">URL de la Fotografía</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newWorkUrl}
                  onChange={(e) => setNewWorkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200"
                />
              </div>

              {/* Subir archivo desde dispositivo */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-purple-600" />
                  <span>O carga la foto directamente desde tu dispositivo</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImageFile(file, 1000, 750, 0.75);
                        setNewWorkUrl(compressed);
                        setWorkError('');
                      } catch {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewWorkUrl(reader.result as string);
                          setWorkError('');
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-900 hover:file:bg-purple-200 cursor-pointer"
                />
              </div>

              {/* Previsualización */}
              {newWorkUrl && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Vista previa:</span>
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-purple-200 bg-purple-50">
                    <img src={newWorkUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                      {newWorkCategory.toUpperCase()} · {newWorkTitle || 'Sin título'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setNewWorkModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-purple-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md cursor-pointer"
                >
                  Publicar en la galería
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Factura Proforma y QR de 72 horas */}
      <SalonPaymentInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        salon={salon}
        owner={currentUser}
        configPago={configPago}
        platformConfig={platformConfig}
        onUploadVoucher={onUploadVoucher}
      />
    </div>
  );
};
