import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  UserCheck,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  ExternalLink,
  Shield,
  Eye,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Sparkles,
  Calendar,
  BarChart3,
  TrendingUp,
  User,
  Bell,
  Lock,
  Edit3,
  ShieldAlert,
  Power,
  RotateCcw,
  Sliders,
  Check,
  FileText,
  X,
  QrCode,
  Database,
  Server,
  RefreshCw,
  Download,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { Logo } from './Logo';
import {
  Salon,
  User as UserType,
  SalonStatus,
  UserStatus,
  Cita,
  HistorialCita,
  PlatformConfig,
  Suscripcion,
  PagoSuscripcion,
  ConfiguracionPago
} from '../types';
import { thumbHair, salonAuraImg } from '../data/mockSalons';
import { formatYYYYMMDDtoDDMMYYYY, formatDateToYYYYMMDD } from '../utils/appointmentManager';
import { AdminConfirmModal } from './AdminConfirmModal';
import { AdminSalonEditModal } from './AdminSalonEditModal';
import { AdminOwnerModal } from './AdminOwnerModal';
import { AdminGlobalSearch } from './AdminGlobalSearch';
import { AdminNotificationsModal, AdminNotif } from './AdminNotificationsModal';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { AdminSubscriptionManager } from './AdminSubscriptionManager';
import { AdminQRConfigModal } from './AdminQRConfigModal';
import { DEFAULT_PAGO_CONFIG } from '../data/mockSubscriptions';
import { getDatabaseDiagnostic, SupabaseDiagnostic, REQUIRED_TABLES } from '../services/supabaseClient';
import { StorageService } from '../services/storageService';
import { verifyPasswordSync } from '../utils/security';

interface AdminDashboardProps {
  currentUser: UserType;
  salons: Salon[];
  users: UserType[];
  appointments?: Cita[];
  historial?: HistorialCita[];
  suscripciones?: Suscripcion[];
  pagos?: PagoSuscripcion[];
  configPago?: ConfiguracionPago;
  platformConfig?: PlatformConfig;
  onLogout: () => void;
  onNavigateHome: () => void;
  onUpdateSalonStatus: (salonId: string, status: SalonStatus) => void;
  onToggleUserStatus: (userId: string) => void;
  onRegisterSalon: (salonData: Salon, ownerData: UserType) => void;
  onUpdateSalon?: (updatedSalon: Salon) => void;
  onSaveOwner?: (ownerData: Partial<UserType> & { salonId: string; contrasena?: string }) => void;
  onViewSalonPublic: (salon: Salon) => void;
  onSaveConfigPago?: (updatedConfig: ConfiguracionPago) => void;
  onApprovePayment?: (pagoId: string) => void;
  onRejectPayment?: (pagoId: string, motivo: string) => void;
  onSavePlatformConfig?: (config: PlatformConfig) => void;
  onUpdateUserPassword?: (userId: string, newPassword: string) => void;
}

type AdminMenuTab =
  | 'inicio'
  | 'salones'
  | 'propietarios'
  | 'usuarios'
  | 'suscripciones'
  | 'configuracion'
  | 'perfil';

const INITIAL_ADMIN_NOTIFS: AdminNotif[] = [
  {
    id: 'an-001',
    tipo: 'pago',
    titulo: 'Comprobante de pago pendiente de validación',
    mensaje: 'Salón Bella Vista subió un comprobante de Bs 100 por renovación de Plan Mensual (Ref: REF-BV-9921).',
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    leida: false,
  },
  {
    id: 'an-002',
    tipo: 'suscripcion',
    titulo: 'Nueva suscripción solicitada',
    mensaje: 'Salón Glamour seleccionó el Plan Anual (Bs 1100). Comprobante pendiente de revisión.',
    fecha: new Date(Date.now() - 3600000 * 5).toISOString(),
    leida: false,
  },
  {
    id: 'an-003',
    tipo: 'suscripcion',
    titulo: 'Suscripción próxima a vencer',
    mensaje: 'La suscripción del Salón Elegance vence en 3 días. Recordatorio automático emitido.',
    fecha: new Date(Date.now() - 3600000 * 18).toISOString(),
    leida: true,
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  salons,
  users,
  appointments = [],
  historial = [],
  suscripciones = [],
  pagos = [],
  configPago = DEFAULT_PAGO_CONFIG,
  onLogout,
  onNavigateHome,
  onUpdateSalonStatus,
  onToggleUserStatus,
  onRegisterSalon,
  onUpdateSalon,
  onSaveOwner,
  onViewSalonPublic,
  onSaveConfigPago,
  onApprovePayment,
  onRejectPayment,
  platformConfig: propPlatformConfig,
  onSavePlatformConfig,
  onUpdateUserPassword,
}) => {
  const [activeMenu, setActiveMenu] = useState<AdminMenuTab>('inicio');

  // Search & Filter States
  const [salonSearch, setSalonSearch] = useState('');
  const [salonStatusFilter, setSalonStatusFilter] = useState<string>('todos');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('todos');

  // Citas Filters
  const [citaSearch, setCitaSearch] = useState('');
  const [citaSalonFilter, setCitaSalonFilter] = useState<string>('todos');
  const [citaEstadoFilter, setCitaEstadoFilter] = useState<string>('todos');
  const [citaDateFilter, setCitaDateFilter] = useState<string>('');

  // Modals state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editSalonModalOpen, setEditSalonModalOpen] = useState(false);
  const [salonToEdit, setSalonToEdit] = useState<Salon | null>(null);
  const [qrConfigModalOpen, setQrConfigModalOpen] = useState(false);

  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerToEdit, setOwnerToEdit] = useState<UserType | null>(null);

  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warning?: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [selectedDetailCita, setSelectedDetailCita] = useState<Cita | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotif[]>(INITIAL_ADMIN_NOTIFS);

  // Platform Config State (Requisito 25 y Etapa 10)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() => {
    return propPlatformConfig || StorageService.getPlatformConfig();
  });
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Database / Supabase Diagnostic State (Etapa 10)
  const [dbDiagnostic, setDbDiagnostic] = useState<SupabaseDiagnostic | null>(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [copiedSqlToast, setCopiedSqlToast] = useState(false);
  const [copiedBackupToast, setCopiedBackupToast] = useState(false);

  React.useEffect(() => {
    getDatabaseDiagnostic().then((diag) => setDbDiagnostic(diag));
  }, []);

  const handleRefreshDiagnostic = async () => {
    setLoadingDiagnostic(true);
    const diag = await getDatabaseDiagnostic();
    setDbDiagnostic(diag);
    setLoadingDiagnostic(false);
  };

  const handleDownloadBackup = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tucita_backup_11_tablas_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedBackupToast(true);
    setTimeout(() => setCopiedBackupToast(false), 3500);
  };

  const handleCopySqlSchema = () => {
    navigator.clipboard?.writeText(
      `-- Esquema SQL TuCita (PostgreSQL / Supabase)\n-- Tablas: ${REQUIRED_TABLES.join(', ')}\n-- Revisa supabase/migrations/20261013120000_tucita_core_schema.sql`
    );
    setCopiedSqlToast(true);
    setTimeout(() => setCopiedSqlToast(false), 3500);
  };

  // Admin Profile Password Change State (Requisito 26)
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordToast, setPasswordToast] = useState<string | null>(null);

  // Form states for "Registrar nuevo salón" (Requisito 5)
  const [formSalonName, setFormSalonName] = useState('');
  const [formOwnerNombre, setFormOwnerNombre] = useState('');
  const [formOwnerApellido, setFormOwnerApellido] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('Aiquile');
  const [formDepartamento, setFormDepartamento] = useState('Cochabamba');
  const [formStatus, setFormStatus] = useState<SalonStatus>('activo');
  const [formError, setFormError] = useState('');

  // Dinamic metrics (Requisito 2)
  const totalSalones = salons.length;
  const salonesActivos = salons.filter((s) => s.estado === 'activo').length;
  const salonesInactivos = salons.filter((s) => s.estado === 'inactivo').length;
  const salonesSuspendidos = salons.filter((s) => s.estado === 'suspendido').length;

  const totalPropietarios = users.filter((u) => u.rol === 'propietario').length;
  const totalUsuarios = users.length;

  const totalCitas = appointments.length;
  const citasPendientes = appointments.filter((c) => c.estado === 'PENDIENTE').length;
  const citasConfirmadas = appointments.filter((c) => c.estado === 'CONFIRMADA').length;
  const citasRechazadas = appointments.filter((c) => c.estado === 'RECHAZADA').length;
  const citasCanceladas = appointments.filter((c) => c.estado === 'CANCELADA').length;

  const pendingPaymentsCount = pagos.filter((p) => p.estado === 'PENDIENTE').length;
  const unreadNotifsCount = adminNotifications.filter((n) => !n.leida).length;

  // Handle register salon + owner
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSalonName.trim() || !formOwnerNombre.trim() || !formUsername.trim() || !formPassword.trim()) {
      setFormError('Por favor completa todos los campos requeridos marcados con *');
      return;
    }

    const salonId = `salon-${formSalonName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const ownerId = `user-${formUsername.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    const newOwner: UserType = {
      id: ownerId,
      nombre: formOwnerNombre.trim(),
      apellido: formOwnerApellido.trim(),
      correo: formEmail.trim() || `${formUsername}@tucita.bo`,
      usuario: formUsername.trim().toLowerCase(),
      contrasena: formPassword.trim(),
      rol: 'propietario',
      estado: formStatus === 'activo' ? 'activo' : 'inactivo',
      salonId,
      telefono: formPhone.trim(),
      fecha_creacion: new Date().toISOString(),
    };

    const newSalon: Salon = {
      id: salonId,
      propietarioId: ownerId,
      name: formSalonName.trim(),
      tagline: 'Especialistas en belleza y cuidado personal.',
      shortDescription: `Salón de belleza en ${formMunicipio}, ${formDepartamento}.`,
      description: `Bienvenido a ${formSalonName}, tu espacio exclusivo de belleza y estética en ${formMunicipio}.`,
      neonSubtitle: 'BELLEZA & BIENESTAR',
      logoText: formSalonName.slice(0, 2).toUpperCase(),
      logoBgColor: '#7e22ce',
      bannerGradient: 'from-purple-900 to-indigo-950',
      heroImage: salonAuraImg,
      coverImage: salonAuraImg,
      bannerImage: salonAuraImg,
      serviceThumbnails: [thumbHair],
      schedule: 'Lun a Sáb: 08:30 - 19:30',
      rating: 5.0,
      reviewsCount: 0,
      city: formMunicipio,
      zone: 'Centro',
      address: formAddress.trim() || `${formMunicipio}, ${formDepartamento}`,
      phone: formPhone.trim(),
      whatsapp: formWhatsApp.trim() || formPhone.trim(),
      email: formEmail.trim(),
      isAvailable: formStatus === 'activo',
      estado: formStatus,
      services: [],
      gallery: [
        { id: `g1-${Date.now()}`, url: thumbHair, title: 'Atención personalizada', category: 'interior' },
      ],
      fecha_creacion: new Date().toISOString(),
    };

    onRegisterSalon(newSalon, newOwner);

    // Notificación administrativa
    const newNotif: AdminNotif = {
      id: `an-${Date.now()}`,
      tipo: 'salon',
      titulo: `Nuevo salón registrado: ${newSalon.name}`,
      mensaje: `Registrado por el administrador con propietario ${newOwner.nombre} ${newOwner.apellido}.`,
      fecha: new Date().toISOString(),
      leida: false,
    };
    setAdminNotifications((prev) => [newNotif, ...prev]);

    // Reset form
    setFormSalonName('');
    setFormOwnerNombre('');
    setFormOwnerApellido('');
    setFormEmail('');
    setFormPhone('');
    setFormWhatsApp('');
    setFormUsername('');
    setFormPassword('');
    setFormAddress('');
    setFormStatus('activo');
    setFormError('');
    setRegisterModalOpen(false);
  };

  // Helper para buscar propietario de un salón
  const getSalonOwner = (salon: Salon) => {
    return users.find((u) => u.salonId === salon.id || u.id === salon.propietarioId);
  };

  // Filtrado de Salones
  const filteredSalons = useMemo(() => {
    return salons.filter((s) => {
      if (salonStatusFilter !== 'todos' && s.estado !== salonStatusFilter) {
        return false;
      }
      if (salonSearch.trim()) {
        const q = salonSearch.toLowerCase().trim();
        const owner = getSalonOwner(s);
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          (owner && `${owner.nombre} ${owner.apellido}`.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [salons, salonStatusFilter, salonSearch, users]);

  // Filtrado de Propietarios
  const filteredOwners = useMemo(() => {
    return users.filter((u) => {
      if (u.rol !== 'propietario') return false;
      if (ownerSearch.trim()) {
        const q = ownerSearch.toLowerCase().trim();
        const associatedSalon = salons.find((s) => s.id === u.salonId);
        const matches =
          u.nombre.toLowerCase().includes(q) ||
          u.apellido.toLowerCase().includes(q) ||
          u.usuario.toLowerCase().includes(q) ||
          u.correo.toLowerCase().includes(q) ||
          (associatedSalon && associatedSalon.name.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [users, ownerSearch, salons]);

  // Filtrado de Usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== 'todos' && u.rol !== userRoleFilter) {
        return false;
      }
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase().trim();
        const matches =
          u.nombre.toLowerCase().includes(q) ||
          u.apellido.toLowerCase().includes(q) ||
          u.usuario.toLowerCase().includes(q) ||
          u.correo.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [users, userRoleFilter, userSearch]);

  // Filtrado de Citas Generales
  const filteredAppointments = useMemo(() => {
    return appointments.filter((c) => {
      if (citaSalonFilter !== 'todos' && c.salon_id !== citaSalonFilter) {
        return false;
      }
      if (citaEstadoFilter !== 'todos' && c.estado !== citaEstadoFilter) {
        return false;
      }
      if (citaDateFilter && c.fecha !== citaDateFilter) {
        return false;
      }
      if (citaSearch.trim()) {
        const q = citaSearch.toLowerCase().trim();
        const matches =
          c.codigo_cita.toLowerCase().includes(q) ||
          c.cliente_nombre.toLowerCase().includes(q) ||
          c.cliente_telefono.includes(q) ||
          c.servicio_nombre.toLowerCase().includes(q) ||
          c.salon_nombre.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [appointments, citaSalonFilter, citaEstadoFilter, citaDateFilter, citaSearch]);

  // Actividad de salones por cantidad de citas (Requisito 16)
  const salonActivityStats = useMemo(() => {
    const map = new Map<string, { salon: Salon; count: number }>();
    salons.forEach((s) => map.set(s.id, { salon: s, count: 0 }));

    appointments.forEach((c) => {
      const entry = map.get(c.salon_id);
      if (entry) {
        entry.count += 1;
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...list.map((item) => item.count), 1);

    return list.map((item) => ({
      ...item,
      percentage: totalCitas > 0 ? Math.round((item.count / totalCitas) * 100) : 0,
      relativeWidth: Math.round((item.count / maxCount) * 100),
    }));
  }, [salons, appointments, totalCitas]);

  // Handlers para Confirmación de Estados de Salón (Requisitos 19, 20, 22)
  const triggerActivateSalon = (salon: Salon) => {
    setConfirmModalData({
      isOpen: true,
      title: `¿Activar el salón "${salon.name}"?`,
      message: 'El salón volverá a estar disponible públicamente para que los clientes puedan consultar su catálogo y solicitar citas.',
      confirmText: 'ACTIVAR SALÓN',
      variant: 'success',
      onConfirm: () => onUpdateSalonStatus(salon.id, 'activo'),
    });
  };

  const triggerDeactivateSalon = (salon: Salon) => {
    setConfirmModalData({
      isOpen: true,
      title: `¿Desactivar el salón "${salon.name}"?`,
      message: 'El salón quedará pausado temporalmente y no recibirá nuevas citas, pero conservará toda su información y configuración intacta.',
      confirmText: 'DESACTIVAR SALÓN',
      variant: 'warning',
      onConfirm: () => onUpdateSalonStatus(salon.id, 'inactivo'),
    });
  };

  const triggerSuspendSalon = (salon: Salon) => {
    setConfirmModalData({
      isOpen: true,
      title: `¿Suspender el salón "${salon.name}"?`,
      message: 'Esta acción bloquea el acceso público del salón de forma preventiva.',
      warning: 'Un salón suspendido NO estará disponible para los clientes en el catálogo ni en las búsquedas. Toda la información histórica se conserva intacta.',
      confirmText: 'SUSPENDER SALÓN',
      variant: 'danger',
      onConfirm: () => onUpdateSalonStatus(salon.id, 'suspendido'),
    });
  };

  const triggerToggleUser = (user: UserType) => {
    const isActivating = user.estado === 'inactivo';
    setConfirmModalData({
      isOpen: true,
      title: isActivating ? `¿Activar cuenta de ${user.nombre}?` : `¿Desactivar cuenta de ${user.nombre}?`,
      message: isActivating
        ? 'El usuario podrá volver a ingresar a su panel con sus credenciales habituales.'
        : 'El usuario no podrá ingresar a la plataforma hasta que sea reactivado.',
      confirmText: isActivating ? 'ACTIVAR USUARIO' : 'DESACTIVAR USUARIO',
      variant: isActivating ? 'success' : 'warning',
      onConfirm: () => onToggleUserStatus(user.id),
    });
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPasswordSync(currentPasswordInput, currentUser.contrasena)) {
      setPasswordToast('La contraseña actual es incorrecta.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setPasswordToast('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordToast('Las contraseñas no coinciden.');
      return;
    }
    if (onUpdateUserPassword) {
      onUpdateUserPassword(currentUser.id, newPasswordInput);
    } else {
      currentUser.contrasena = newPasswordInput;
    }
    setPasswordToast('¡Contraseña actualizada correctamente!');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setTimeout(() => setPasswordToast(null), 3500);
  };

  const handleSavePlatformConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSavePlatformConfig) {
      onSavePlatformConfig(platformConfig);
    } else {
      StorageService.savePlatformConfig(platformConfig);
    }
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white sticky top-0 z-40 shadow-md border-b border-purple-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="text-left group cursor-pointer focus:outline-none"
              title="Volver al portal público TuCita"
            >
              <Logo variant="header" theme="white" />
            </button>
            <div className="hidden lg:block h-6 w-px bg-purple-700/60" />
            <span className="hidden lg:inline text-xs text-purple-200 font-semibold tracking-wide">
              Control Maestro de la Plataforma
            </span>
          </div>

          {/* Global Search Component */}
          <div className="flex-1 max-w-md hidden md:block">
            <AdminGlobalSearch
              salons={salons}
              users={users}
              onSelectSalon={(s) => {
                setActiveMenu('salones');
                setSalonSearch(s.name);
              }}
              onSelectUser={(u) => {
                setActiveMenu('usuarios');
                setUserSearch(u.usuario);
              }}
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Notification Bell (Requisito 18) */}
            <button
              onClick={() => setNotificationsModalOpen(true)}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 transition-colors cursor-pointer"
              title="Notificaciones administrativas del sistema"
            >
              <Bell className="w-4 h-4 text-pink-300" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-purple-950 shadow-xs animate-bounce">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Admin Profile pill */}
            <button
              onClick={() => setActiveMenu('perfil')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                {currentUser.nombre[0]}
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="font-bold block text-white text-xs">
                  {currentUser.nombre} {currentUser.apellido}
                </span>
                <span className="text-[10px] text-pink-300 uppercase font-semibold">
                  Administrador
                </span>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold transition-colors cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Menu (Requisito 3) */}
        <aside className="lg:col-span-3 bg-white rounded-3xl border border-purple-100 shadow-sm p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menú de Administración
          </div>

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

          <button
            onClick={() => setActiveMenu('salones')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'salones'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4" />
              <span>Salones</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
              {totalSalones}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('propietarios')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'propietarios'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4" />
              <span>Propietarios</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
              {totalPropietarios}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('usuarios')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'usuarios'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Usuarios</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
              {totalUsuarios}
            </span>
          </button>

          {/* Botones Citas y Estadísticas retirados del panel de administración según requerimiento */}

          <button
            onClick={() => setActiveMenu('suscripciones')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'suscripciones'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Suscripciones</span>
            </div>
            {pendingPaymentsCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold animate-pulse">
                {pendingPaymentsCount} por validar
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
                {salons.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('configuracion')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'configuracion'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>

          <button
            onClick={() => setActiveMenu('perfil')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeMenu === 'perfil'
                ? 'bg-purple-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mi perfil</span>
          </button>

          <div className="pt-3 mt-3 border-t border-purple-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: INICIO / DASHBOARD PRINCIPAL (Requisito 2)        */}
          {/* ======================================================== */}
          {activeMenu === 'inicio' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-semibold border border-white/10">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Control Maestro de Plataforma · TuCita</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight">
                    Panel de Administración
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
                    Gestiona y supervisa la plataforma TuCita. Controla salones, propietarios, usuarios y agenda global con seguridad y transparencia.
                  </p>
                </div>

                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar nuevo salón</span>
                </button>
              </div>

              {/* 5 Tarjetas Principales según requerimiento: salones y propietarios únicamente */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* 1. Total Salones */}
                <div
                  onClick={() => setActiveMenu('salones')}
                  className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-1 hover:border-purple-300 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
                    Total Salones
                  </span>
                  <div className="text-3xl font-extrabold text-purple-950 tabular-nums font-mono">
                    {totalSalones}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Registrados en TuCita</span>
                </div>

                {/* 2. Salones Activos */}
                <div
                  onClick={() => {
                    setActiveMenu('salones');
                    setSalonStatusFilter('activo');
                  }}
                  className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1 hover:border-emerald-300 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Salones Activos
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-950 tabular-nums font-mono">
                    {salonesActivos}
                  </div>
                  <span className="text-[10px] text-emerald-700 block font-semibold">
                    Visibles al público
                  </span>
                </div>

                {/* 3. Salones Inactivos */}
                <div
                  onClick={() => {
                    setActiveMenu('salones');
                    setSalonStatusFilter('inactivo');
                  }}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Salones Inactivos
                  </span>
                  <div className="text-3xl font-extrabold text-slate-800 tabular-nums font-mono">
                    {salonesInactivos}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Pausados temporalmente</span>
                </div>

                {/* 4. Salones Suspendidos */}
                <div
                  onClick={() => {
                    setActiveMenu('salones');
                    setSalonStatusFilter('suspendido');
                  }}
                  className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs space-y-1 hover:border-rose-300 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                    Suspendidos
                  </span>
                  <div className="text-3xl font-extrabold text-rose-950 tabular-nums font-mono">
                    {salonesSuspendidos}
                  </div>
                  <span className="text-[10px] text-rose-600 block font-semibold">
                    Bloqueados al público
                  </span>
                </div>

                {/* 5. Total Propietarios */}
                <div
                  onClick={() => setActiveMenu('propietarios')}
                  className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs space-y-1 hover:border-indigo-300 transition-all cursor-pointer col-span-2 sm:col-span-1"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Total Propietarios
                  </span>
                  <div className="text-3xl font-extrabold text-indigo-950 tabular-nums font-mono">
                    {totalPropietarios}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Cuentas administradoras</span>
                </div>
              </div>

              {/* Actividad de Salones en TuCita: Identifica al salón con más actividad de todos */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-purple-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-bold text-lg text-slate-900">
                      Actividad de Salones en TuCita
                    </h3>
                    <p className="text-xs text-slate-500">
                      Supervisión de movimiento de salones para verificar quién es el salón con más actividad de todos.
                    </p>
                  </div>

                  {salonActivityStats.length > 0 && salonActivityStats[0].count > 0 && (
                    <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs self-start sm:self-auto">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Salón líder: <strong>{salonActivityStats[0].salon.name}</strong> ({salonActivityStats[0].count} citas registradas)</span>
                    </span>
                  )}
                </div>

                <div className="space-y-3.5">
                  {salonActivityStats.map((item, index) => (
                    <div key={item.salon.id} className="p-3 rounded-2xl bg-slate-50/70 border border-purple-50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            index === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-purple-100 text-purple-900'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.salon.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({item.salon.city})
                          </span>
                        </div>
                        <span className="text-purple-950 font-mono font-semibold">
                          {item.count} citas recibidas ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-purple-100/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            index === 0
                              ? 'bg-gradient-to-r from-amber-500 to-pink-500'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-500'
                          }`}
                          style={{ width: `${Math.max(item.relativeWidth, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GESTIÓN DE SALONES (Requisitos 4, 7, 8, 19, 20)    */}
          {/* ======================================================== */}
          {activeMenu === 'salones' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                    Gestión de Salones
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Supervisa, edita, activa o suspende salones en toda la plataforma.
                  </p>
                </div>

                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Salón</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:flex-1">
                  <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, municipio o propietario..."
                    value={salonSearch}
                    onChange={(e) => setSalonSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/20"
                  />
                </div>

                <div className="w-full sm:w-52">
                  <select
                    value={salonStatusFilter}
                    onChange={(e) => setSalonStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Solo Activos</option>
                    <option value="inactivo">Solo Inactivos</option>
                    <option value="suspendido">Solo Suspendidos</option>
                  </select>
                </div>
              </div>

              {/* Table (Requisito 4) */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-purple-50/80 border-b border-purple-100 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                        <th className="py-3 px-4">Salón</th>
                        <th className="py-3 px-3">Propietario Asignado</th>
                        <th className="py-3 px-3">Contacto</th>
                        <th className="py-3 px-3">Municipio</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {filteredSalons.map((salon) => {
                        const owner = getSalonOwner(salon);
                        return (
                          <tr key={salon.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                                  style={{ backgroundColor: salon.logoBgColor || '#7e22ce' }}
                                >
                                  {salon.logoText || salon.name.slice(0, 2)}
                                </div>
                                <div>
                                  <span className="block text-slate-900 font-bold">{salon.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {salon.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              {owner ? (
                                <div>
                                  <span className="font-semibold text-slate-900 block">
                                    {owner.nombre} {owner.apellido}
                                  </span>
                                  <span className="text-[10px] text-purple-700 font-mono">
                                    @{owner.usuario}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Sin propietario</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-slate-600">
                              <span className="block">{salon.phone || 'S/N'}</span>
                              <span className="text-[10px] text-emerald-700 block">
                                {salon.whatsapp}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-medium text-slate-700">
                              {salon.city}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {salon.estado === 'activo' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  ACTIVO
                                </span>
                              )}
                              {salon.estado === 'inactivo' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                  INACTIVO
                                </span>
                              )}
                              {salon.estado === 'suspendido' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  SUSPENDIDO
                                </span>
                              )}
                            </td>

                            {/* Actions (Requisito 4): Ver, Editar, Activar, Desactivar, Suspender */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Ver página pública */}
                                <button
                                  onClick={() => onViewSalonPublic(salon)}
                                  className="p-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                  title="Ver página pública en catálogo"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Editar datos (Requisito 7) */}
                                <button
                                  onClick={() => {
                                    setSalonToEdit(salon);
                                    setEditSalonModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                  title="Editar información del salón"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Activar */}
                                {salon.estado !== 'activo' && (
                                  <button
                                    onClick={() => triggerActivateSalon(salon)}
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                                    title="Activar salón"
                                  >
                                    Activar
                                  </button>
                                )}

                                {/* Desactivar */}
                                {salon.estado === 'activo' && (
                                  <button
                                    onClick={() => triggerDeactivateSalon(salon)}
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                    title="Desactivar temporalmente"
                                  >
                                    Desactivar
                                  </button>
                                )}

                                {/* Suspender (Requisito 20) */}
                                {salon.estado !== 'suspendido' && (
                                  <button
                                    onClick={() => triggerSuspendSalon(salon)}
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                    title="Suspender salón"
                                  >
                                    Suspender
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: GESTIÓN DE PROPIETARIOS (Requisitos 9 y 10)       */}
          {/* ======================================================== */}
          {activeMenu === 'propietarios' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                    Gestión de Propietarios
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Administra los encargados y administradores de cada salón registrado.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setOwnerToEdit(null);
                    setOwnerModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Propietario</span>
                </button>
              </div>

              {/* Search */}
              <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, usuario o salón asignado..."
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/20"
                  />
                </div>
              </div>

              {/* Table Propietarios */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-purple-50/80 border-b border-purple-100 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                        <th className="py-3 px-4">Propietario</th>
                        <th className="py-3 px-3">Usuario</th>
                        <th className="py-3 px-3">Contacto</th>
                        <th className="py-3 px-3">Salón Asociado</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {filteredOwners.map((owner) => {
                        const associatedSalon = salons.find((s) => s.id === owner.salonId);
                        return (
                          <tr key={owner.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {owner.nombre[0]}
                                  {owner.apellido[0]}
                                </div>
                                <div>
                                  <span className="block font-bold text-slate-900">
                                    {owner.nombre} {owner.apellido}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Reg: {new Date(owner.fecha_creacion).toLocaleDateString('es-BO')}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 font-mono font-semibold text-purple-900">
                              @{owner.usuario}
                            </td>

                            <td className="py-3.5 px-3 text-slate-600">
                              <span className="block font-medium">{owner.telefono || 'S/N'}</span>
                              <span className="text-[10px] text-slate-400 block">{owner.correo}</span>
                            </td>

                            <td className="py-3.5 px-3">
                              {associatedSalon ? (
                                <span className="font-bold text-purple-950 block">
                                  {associatedSalon.name}
                                  <span className="text-[10px] text-slate-400 font-normal block">
                                    {associatedSalon.city}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-rose-500 font-bold italic">Sin salón asignado</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {owner.estado === 'activo' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                                  Inactivo
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setOwnerToEdit(owner);
                                    setOwnerModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                  title="Editar propietario"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => triggerToggleUser(owner)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                                    owner.estado === 'activo'
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {owner.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: USUARIOS DEL SISTEMA (Requisito 11)                */}
          {/* ======================================================== */}
          {activeMenu === 'usuarios' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  Usuarios del Sistema
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Listado global de todos los usuarios registrados (Administradores, Propietarios y Clientes).
                </p>
              </div>

              {/* Search & Filter by Role */}
              <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:flex-1">
                  <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar usuario por nombre o correo..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/20"
                  />
                </div>

                <div className="w-full sm:w-52">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="admin">Administradores</option>
                    <option value="propietario">Propietarios</option>
                    <option value="cliente">Clientes</option>
                  </select>
                </div>
              </div>

              {/* Table Usuarios (Requisito 11 & 28: no mostrar contraseñas) */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-purple-50/80 border-b border-purple-100 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-3">Correo</th>
                        <th className="py-3 px-3">Rol</th>
                        <th className="py-3 px-3">Salón Asociado</th>
                        <th className="py-3 px-3">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {filteredUsers.map((u) => {
                        const associatedSalon = salons.find((s) => s.id === u.salonId);
                        const isSelf = u.id === currentUser.id;

                        return (
                          <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {u.nombre[0]}
                                </div>
                                <div>
                                  <span className="block text-slate-900 font-bold">
                                    {u.nombre} {u.apellido}
                                  </span>
                                  <span className="text-[10px] text-purple-700 font-mono">
                                    @{u.usuario}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-slate-600 font-medium">
                              {u.correo}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                  u.rol === 'admin'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                    : u.rol === 'propietario'
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {u.rol}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-slate-600">
                              {associatedSalon ? (
                                <span className="font-semibold text-slate-900">{associatedSalon.name}</span>
                              ) : (
                                <span className="text-slate-400 italic">No aplica</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {u.estado === 'activo' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                                  Inactivo
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {!isSelf ? (
                                <button
                                  onClick={() => triggerToggleUser(u)}
                                  className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                                    u.estado === 'activo'
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                >
                                  {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-purple-600 font-semibold italic">
                                  (Tu cuenta)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña Citas retirada del panel de administración general según requerimiento */}

          {/* Pestaña Estadísticas retirada del panel de administración general según requerimiento */}

          {/* ======================================================== */}
          {/* TAB 7: SUSCRIPCIONES (ETAPA 9)                           */}
          {/* ======================================================== */}
          {activeMenu === 'suscripciones' && (
            <AdminSubscriptionManager
              salons={salons}
              users={users}
              suscripciones={suscripciones}
              pagos={pagos}
              configPago={configPago}
              onOpenQRConfig={() => setQrConfigModalOpen(true)}
              onApprovePayment={(pagoId) => onApprovePayment && onApprovePayment(pagoId)}
              onRejectPayment={(pagoId, motivo) => onRejectPayment && onRejectPayment(pagoId, motivo)}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 8: CONFIGURACIÓN GENERAL (Requisito 25)               */}
          {/* ======================================================== */}
          {activeMenu === 'configuracion' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
              {configSavedToast && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Configuración de TuCita guardada correctamente.</span>
                </div>
              )}

              <div className="pb-4 border-b border-purple-100">
                <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  Configuración General de la Plataforma
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Parámetros globales de contacto, identidad y soporte de TuCita.
                </p>
              </div>

              <form onSubmit={handleSavePlatformConfig} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Nombre de la plataforma</label>
                    <input
                      type="text"
                      value={platformConfig.platformName}
                      onChange={(e) =>
                        setPlatformConfig({ ...platformConfig, platformName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Eslogan oficial</label>
                    <input
                      type="text"
                      value={platformConfig.tagline}
                      onChange={(e) =>
                        setPlatformConfig({ ...platformConfig, tagline: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Teléfono central</label>
                    <input
                      type="text"
                      value={platformConfig.contactPhone}
                      onChange={(e) =>
                        setPlatformConfig({ ...platformConfig, contactPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">WhatsApp de soporte</label>
                    <input
                      type="text"
                      value={platformConfig.contactWhatsApp}
                      onChange={(e) =>
                        setPlatformConfig({ ...platformConfig, contactWhatsApp: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Correo de soporte</label>
                    <input
                      type="email"
                      value={platformConfig.contactEmail}
                      onChange={(e) =>
                        setPlatformConfig({ ...platformConfig, contactEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Dirección física de oficinas</label>
                  <input
                    type="text"
                    value={platformConfig.address}
                    onChange={(e) =>
                      setPlatformConfig({ ...platformConfig, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div className="pt-4 border-t border-purple-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold shadow-md cursor-pointer transition-all"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </form>

              {/* QR de Pago Configurable (Requisito 7 & 28) */}
              <div className="mt-8 pt-6 border-t border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
                      Facturación y Suscripciones (Requisito 7)
                    </span>
                    <h3 className="text-xl font-serif font-extrabold text-slate-900">
                      QR de Pago Oficial TuCita
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Este código QR y los datos de cuenta se muestran en tiempo real a todos los propietarios al momento de pagar su suscripción.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQrConfigModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors shrink-0"
                  >
                    <QrCode className="w-4 h-4 text-pink-300" />
                    <span>Subir QR / Cambiar Datos</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-white p-3 rounded-2xl border border-purple-100 shadow-sm shrink-0 flex flex-col items-center">
                    <img
                      src={configPago.qr_imagen}
                      alt="QR de Pago Actual"
                      className="w-40 h-40 object-contain rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">QR Activo en Sistema</span>
                  </div>

                  <div className="space-y-3 text-xs flex-1 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-purple-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Banco Destino</span>
                        <span className="font-bold text-slate-800 text-sm">{configPago.banco_nombre}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-purple-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Titular de Cuenta</span>
                        <span className="font-bold text-slate-800 text-sm">{configPago.titular_cuenta}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-purple-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Número de Cuenta</span>
                        <span className="font-mono font-bold text-purple-900 text-sm">{configPago.numero_cuenta}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-purple-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Planes de Suscripción</span>
                        <div className="flex items-center gap-3 font-bold text-slate-900 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-xs">Mensual: Bs {configPago.precio_mensual}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs">Anual: Bs {configPago.precio_anual}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>Última actualización: {new Date(configPago.fecha_actualizacion).toLocaleString('es-BO')}</span>
                      <button
                        type="button"
                        onClick={() => setQrConfigModalOpen(true)}
                        className="text-purple-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Reemplazar QR</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* BASE DE DATOS POSTGRESQL & SUPABASE (ETAPA 10)           */}
              {/* ======================================================== */}
              <div className="mt-8 pt-6 border-t border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
                      Auditoría e Integración de Datos (Etapa 10)
                    </span>
                    <h3 className="text-xl font-serif font-extrabold text-slate-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-700" />
                      <span>Base de Datos PostgreSQL / Supabase</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Diagnóstico transparente del estado de conexión, tablas sincronizadas y persistencia de TuCita.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefreshDiagnostic}
                      disabled={loadingDiagnostic}
                      className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingDiagnostic ? 'animate-spin' : ''}`} />
                      <span>Verificar Estado</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-pink-300" />
                      <span>Exportar Respaldo JSON</span>
                    </button>
                  </div>
                </div>

                {copiedBackupToast && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Copia de seguridad con las 11 entidades de TuCita descargada exitosamente!</span>
                  </div>
                )}

                {copiedSqlToast && (
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <Copy className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>¡Referencia del esquema SQL copiada al portapapeles! Revisa <code>supabase/migrations/20261013120000_tucita_core_schema.sql</code></span>
                  </div>
                )}

                {/* Card de Estado de Conexión Real */}
                <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3.5 h-3.5 rounded-full ${
                        dbDiagnostic?.connectionStatus === 'CONECTADO'
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500'
                      }`} />
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">
                          {dbDiagnostic?.connectionStatus === 'CONECTADO'
                            ? 'Conexión Activa con PostgreSQL / Supabase'
                            : 'Almacenamiento Persistente Activo (Modo Local Sincronizado)'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {dbDiagnostic?.message}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-100">
                        PostgreSQL DDL v1.10
                      </span>
                    </div>
                  </div>

                  {/* Variables de Entorno Requeridas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        VITE_SUPABASE_URL
                      </span>
                      <span className="font-mono text-slate-700 text-[11px] block truncate">
                        {dbDiagnostic?.supabaseUrl || 'Pendiente de inyección en variables de entorno'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        VITE_SUPABASE_ANON_KEY
                      </span>
                      <span className="font-mono text-slate-700 text-[11px] block">
                        {dbDiagnostic?.hasAnonKey ? '•••••••••••••••• (Presente)' : 'Pendiente de inyección en variables de entorno'}
                      </span>
                    </div>
                  </div>

                  {/* Entidades y Tablas Verificadas (Requisito 3) */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-purple-700" />
                        <span>11 Tablas y Entidades Consolidadas en el Esquema (Etapa 10):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySqlSchema}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copiar DDL SQL</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">1. usuarios</span>
                        <span className="font-bold text-slate-700">{users.length} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">2. salones</span>
                        <span className="font-bold text-slate-700">{salons.length} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">3. servicios</span>
                        <span className="font-bold text-slate-700">{salons.reduce((acc, s) => acc + (s.services?.length || 0), 0)} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">4. horarios_salon</span>
                        <span className="font-bold text-slate-700">{salons.length} cfg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">5. citas</span>
                        <span className="font-bold text-slate-700">{appointments.length} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">6. historial_citas</span>
                        <span className="font-bold text-slate-700">{historial.length} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">7. notificaciones</span>
                        <span className="font-bold text-slate-700">activo</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">8. suscripciones</span>
                        <span className="font-bold text-slate-700">{suscripciones.length} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">9. pagos_suscripcion</span>
                        <span className="font-bold text-slate-700">{pagos.length} reg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold">10. config_pago (QR)</span>
                        <span className="font-bold text-emerald-700">1 QR</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100 flex items-center justify-between sm:col-span-2">
                        <span className="font-mono text-purple-900 font-semibold">11. config_plataforma</span>
                        <span className="font-bold text-slate-700">v{platformConfig.version}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: MI PERFIL DE ADMINISTRADOR (Requisito 26)         */}
          {/* ======================================================== */}
          {activeMenu === 'perfil' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-purple-100">
                <h2 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight">
                  Perfil del Administrador
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Información de la cuenta maestra con acceso a la plataforma TuCita.
                </p>
              </div>

              {/* Informative Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Nombre completo:
                  </span>
                  <span className="font-bold text-slate-900 text-sm block">
                    {currentUser.nombre} {currentUser.apellido}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Nombre de Usuario:
                  </span>
                  <span className="font-mono font-bold text-purple-900 text-sm block">
                    @{currentUser.usuario}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Correo Electrónico:
                  </span>
                  <span className="font-semibold text-slate-900 block">{currentUser.correo}</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Rol en el sistema:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
                    <Shield className="w-3.5 h-3.5 text-purple-700" />
                    ADMINISTRADOR GENERAL
                  </span>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="pt-4 border-t border-purple-100 space-y-4">
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Cambiar Contraseña Maestra
                </h3>

                {passwordToast && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                    {passwordToast}
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 text-xs max-w-md">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Contraseña actual</label>
                    <input
                      type="password"
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Nueva contraseña</label>
                    <input
                      type="password"
                      required
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      required
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Actualizar Contraseña
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: REGISTRAR NUEVO SALÓN (Requisito 5)               */}
      {/* ======================================================== */}
      {registerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setRegisterModalOpen(false)}
        >
          <div
            className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 relative shrink-0">
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-pink-300">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                    Alta de Salón y Propietario
                  </span>
                  <h3 className="font-serif font-bold text-xl text-white">
                    Registrar Nuevo Salón en TuCita
                  </h3>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900">
                Este formulario creará simultáneamente el <strong>salón</strong> en el catálogo y la <strong>cuenta de acceso</strong> para su propietario, asociándolos de forma segura.
              </div>

              <div className="space-y-3">
                <h4 className="font-serif font-bold text-sm text-purple-950 border-b border-purple-100 pb-1">
                  1. Datos del Salón
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-800">Nombre del Salón *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Salón Velvet & Spa"
                      value={formSalonName}
                      onChange={(e) => setFormSalonName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Municipio *</label>
                    <input
                      type="text"
                      required
                      value={formMunicipio}
                      onChange={(e) => setFormMunicipio(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Departamento *</label>
                    <input
                      type="text"
                      required
                      value={formDepartamento}
                      onChange={(e) => setFormDepartamento(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-800">Dirección del Salón</label>
                    <input
                      type="text"
                      placeholder="Calle o Avenida y número"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="font-serif font-bold text-sm text-purple-950 border-b border-purple-100 pb-1">
                  2. Datos del Propietario (Acceso al Panel)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Nombre del Propietario *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Paola"
                      value={formOwnerNombre}
                      onChange={(e) => setFormOwnerNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Apellido del Propietario *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Morales"
                      value={formOwnerApellido}
                      onChange={(e) => setFormOwnerApellido(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Teléfono</label>
                    <input
                      type="text"
                      placeholder="79781234"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">WhatsApp</label>
                    <input
                      type="text"
                      placeholder="79781234"
                      value={formWhatsApp}
                      onChange={(e) => setFormWhatsApp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-800">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="propietario@ejemplo.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Nombre de Usuario *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: paola.morales"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Contraseña Temporal *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-800">Estado Inicial</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as SalonStatus)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-semibold cursor-pointer"
                    >
                      <option value="activo">ACTIVO (Visible y agendable en catálogo)</option>
                      <option value="inactivo">INACTIVO (Pausado)</option>
                      <option value="suspendido">SUSPENDIDO (Bloqueado al público)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold shadow-md cursor-pointer transition-all"
                >
                  Crear Salón y Propietario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDITAR SALÓN (Requisito 7)                      */}
      {/* ======================================================== */}
      <AdminSalonEditModal
        isOpen={editSalonModalOpen}
        onClose={() => {
          setEditSalonModalOpen(false);
          setSalonToEdit(null);
        }}
        salon={salonToEdit}
        onSave={(updated) => {
          if (onUpdateSalon) {
            onUpdateSalon(updated);
          }
        }}
      />

      {/* ======================================================== */}
      {/* MODAL 3: CREAR / EDITAR PROPIETARIO (Requisito 10)       */}
      {/* ======================================================== */}
      <AdminOwnerModal
        isOpen={ownerModalOpen}
        onClose={() => {
          setOwnerModalOpen(false);
          setOwnerToEdit(null);
        }}
        ownerToEdit={ownerToEdit}
        salons={salons}
        onSaveOwner={(ownerData) => {
          if (onSaveOwner) {
            onSaveOwner(ownerData);
          }
        }}
      />

      {/* ======================================================== */}
      {/* MODAL 4: CONFIRMACIÓN DE ACCIONES CRÍTICAS               */}
      {/* ======================================================== */}
      <AdminConfirmModal
        isOpen={confirmModalData.isOpen}
        onClose={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalData.onConfirm}
        title={confirmModalData.title}
        message={confirmModalData.message}
        warning={confirmModalData.warning}
        confirmText={confirmModalData.confirmText}
        variant={confirmModalData.variant}
      />

      {/* ======================================================== */}
      {/* MODAL 5: NOTIFICACIONES DEL SISTEMA (Requisito 18)       */}
      {/* ======================================================== */}
      <AdminNotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={adminNotifications}
        onMarkAsRead={(id) => {
          setAdminNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
          );
        }}
        onMarkAllAsRead={() => {
          setAdminNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
        }}
      />

      {/* ======================================================== */}
      {/* MODAL 6: VER DETALLE DE CITA (Solo lectura)              */}
      {/* ======================================================== */}
      {selectedDetailCita && (
        <AppointmentDetailModal
          isOpen={!!selectedDetailCita}
          onClose={() => setSelectedDetailCita(null)}
          cita={selectedDetailCita}
          salon={
            salons.find((s) => s.id === selectedDetailCita.salon_id) || {
              id: selectedDetailCita.salon_id,
              name: selectedDetailCita.salon_nombre,
              address: 'Bolivia',
              city: 'Cochabamba',
            } as any
          }
          historial={historial}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 7: CONFIGURACIÓN DEL QR DE PAGO (Requisitos 7 y 28) */}
      {/* ======================================================== */}
      <AdminQRConfigModal
        isOpen={qrConfigModalOpen}
        onClose={() => setQrConfigModalOpen(false)}
        config={configPago}
        onSaveConfig={(updated) => {
          if (onSaveConfigPago) {
            onSaveConfigPago(updated);
          }
        }}
      />
    </div>
  );
};
