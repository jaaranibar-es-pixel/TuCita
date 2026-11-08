export type ServiceStatus = 'activo' | 'inactivo';

export type ServiceCategory =
  | 'Cabello'
  | 'Uñas'
  | 'Maquillaje'
  | 'Barbería'
  | 'Tratamientos'
  | 'Cejas y pestañas'
  | 'Faciales'
  | 'Otros';

export type UserRole = 'admin' | 'propietario' | 'cliente';
export type UserStatus = 'activo' | 'inactivo';
export type SalonStatus = 'activo' | 'inactivo' | 'suspendido';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  contrasena: string;
  rol: UserRole;
  estado: UserStatus;
  salonId?: string; // Relación: Propietario -> Salón
  telefono?: string;
  fecha_creacion: string;
  expiraEn?: string; // ISO string: límite de 72 horas para confirmar pago si es nuevo local
  cuentaHabilitadaNotificacion?: boolean; // Para mostrar alerta "Se habilitó su cuenta de salón de belleza..."
}

export interface ServiceItem {
  id: string;
  salonId: string;
  name: string;
  description: string;
  image: string;
  price: number; // in Bs
  durationMinutes: number; // in minutes (presets or custom)
  status: ServiceStatus;
  category: ServiceCategory;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category: 'cortes' | 'interior' | 'cabello' | 'uñas' | 'peinados' | 'maquillaje' | 'atencion';
}

export interface Salon {
  id: string;
  propietarioId?: string;
  name: string;
  tagline: string;
  shortDescription: string;
  description: string;
  neonSubtitle: string;
  logoImage?: string; // Imagen del logo subida directamente desde el ordenador
  logoText?: string;
  logoBgColor?: string;
  rating: number;
  reviewsCount: number;
  zone: string;
  city: string;
  municipio?: string;
  departamento?: string;
  address: string;
  phone: string;
  whatsapp: string;
  email?: string;
  schedule: string;
  estado: SalonStatus; // 'activo' | 'inactivo' | 'suspendido'
  isAvailable: boolean; // true si estado === 'activo'
  coverImage: string;
  bannerImage: string;
  bannerGradient?: string;
  heroImage?: string;
  serviceThumbnails: string[];
  gallery: GalleryItem[];
  services: ServiceItem[];
  additionalInfo?: string[];
  isFeatured?: boolean;
  fecha_creacion?: string;
  ordenPago?: SalonPaymentOrder; // Orden de pago / Factura proforma de 72 horas para nuevos locales
  cuentaHabilitadaNotificacion?: boolean; // Aviso verde "Se habilitó su cuenta de salón de belleza..."
}

export type PaymentOrderStatus =
  | 'pendiente'
  | 'comprobante_subido'
  | 'aprobado'
  | 'expirado';

export interface SalonPaymentOrder {
  id: string; // ej: "FAC-2026-0042"
  salonId: string;
  salonNombre: string;
  propietarioId: string;
  propietarioNombre: string;
  propietarioTelefono: string;
  propietarioEmail: string;
  montoBs: number;
  tipoPlan: TipoPlan;
  concepto: string;
  fechaCreacion: string; // ISO string
  fechaExpiracion: string; // ISO string (+72 hours)
  estado: PaymentOrderStatus;
  comprobanteUrl?: string; // Captura de pantalla o foto de la boleta
  codigoTransaccion?: string; // Número de referencia o autorización
  fechaSubidaComprobante?: string;
  fechaAprobacion?: string;
  adminNota?: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
}

export type DayOfWeek =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface BreakPeriod {
  id: string;
  horaInicio: string; // "12:00"
  horaFin: string;    // "14:00"
}

export interface DaySchedule {
  dia: DayOfWeek;
  nombreDia: string; // "Lunes", "Martes", etc.
  activo: boolean;   // true = día laborable, false = día de descanso
  horaInicio: string; // "08:00"
  horaFin: string;    // "18:00"
  descansos: BreakPeriod[];
  horarioAlmuerzo?: { horaInicio: string; horaFin: string }; // Configuración de almuerzo (ej: 12:00 a 13:00)
  permitirAtencionAlmuerzo?: boolean; // Requisito 9: Permitir atención durante el horario de almuerzo (por defecto false)
}

export type SlotInterval = 15 | 30 | 60 | 'servicio';

export interface SalonScheduleConfig {
  id: string;
  salonId: string;
  intervaloMinutos?: SlotInterval;
  dias: DaySchedule[];
  permitirAtencionAlmuerzo?: boolean; // Opción global o por defecto para el salón
  fechaActualizacion?: string;
}

// -------------------------------------------------------------
// FICHAS DE ATENCIÓN (Módulo de Horarios y Disponibilidad)
// -------------------------------------------------------------
export type FichaEstado = 'DISPONIBLE' | 'PENDIENTE' | 'CONFIRMADA' | 'BLOQUEADA';

export interface FichaAtencion {
  id: string; // ID único (ej: "ficha-salon-aura-1712345678")
  salon_id: string; // Salón al que pertenece la ficha
  fecha: string; // Formato "YYYY-MM-DD"
  hora_inicio: string; // Formato "08:00"
  hora_fin: string; // Formato "09:00"
  duracion: number; // Duración en minutos calculada a partir de las horas
  estado: FichaEstado; // 'DISPONIBLE' | 'PENDIENTE' | 'CONFIRMADA' | 'BLOQUEADA'
  cita_id?: string; // ID de la cita asociada cuando exista
  cliente_nombre?: string; // Nombre del cliente para visualización rápida en la agenda
  servicio_nombre?: string; // Nombre del servicio solicitado
  observacion?: string; // Observación opcional del propietario
  tipo_creacion?: 'MANUAL' | 'AUTOMATICA';
  fecha_creacion: string; // ISO string
}

export type CitaEstado =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'PROPUESTA_ENVIADA'
  | 'CADUCADA';

export type TipoReserva = 'CON_FICHA' | 'SIN_FICHA';

export type PreferenciaHoraria = 'EXACTA' | 'MISMO_DIA' | 'MANANA' | 'TARDE';

export interface PropuestaHorario {
  fecha: string; // formato "YYYY-MM-DD"
  hora_inicio: string; // formato "HH:mm"
  hora_fin: string; // formato "HH:mm"
  mensaje?: string; // mensaje opcional del propietario
  fecha_propuesta: string; // ISO string o "YYYY-MM-DD"
  fecha_envio?: string;
  fecha_expiracion_propuesta?: string;
}

export interface Cita {
  id: string;
  codigo_cita: string; // ej: "TC-2026-00001"
  cliente_id?: string; // ID del cliente registrado en TuCita si agendó con sesión iniciada
  ficha_id?: string; // Relación con la Ficha de Atención del propietario (opcional en citas sin ficha previa)
  tipo_reserva?: TipoReserva; // 'CON_FICHA' | 'SIN_FICHA'
  preferencia_horaria?: PreferenciaHoraria; // Preferencia de flexibilidad horaria
  salon_id: string;
  servicio_id: string;
  salon_nombre: string;
  servicio_nombre: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_whatsapp: string;
  cliente_correo?: string;
  fecha: string; // formato "YYYY-MM-DD"
  hora_inicio: string; // formato "10:00"
  hora_fin: string; // formato "10:30"
  duracion: number; // duración en minutos
  duracion_servicio?: number; // alias para duración del servicio
  precio: number; // en Bs
  nota?: string;
  estado: CitaEstado;
  fecha_solicitud: string; // ISO string
  fecha_actualizacion: string; // ISO string
  fecha_expiracion?: string; // ISO string (vencimiento tras 24 horas)
  propuesta?: PropuestaHorario; // Contraoferta del propietario cuando no puede en la fecha/hora original
  propuesta_propietario?: PropuestaHorario; // alias para contraoferta del propietario
  motivo_rechazo?: string; // Etapa 7
  fecha_confirmacion?: string; // Etapa 7
  fecha_rechazo?: string; // Etapa 7
  fecha_cancelacion?: string; // Etapa 7
}

export interface HistorialCita {
  id: string;
  cita_id: string;
  codigo_cita: string;
  salon_id: string;
  estado_anterior: CitaEstado;
  estado_nuevo: CitaEstado;
  usuario_id: string;
  usuario_nombre: string;
  fecha: string; // ISO string
  observacion?: string;
}

export interface NotificacionInterna {
  id: string;
  salon_id: string;
  cita_id: string;
  codigo_cita: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string; // ISO string
}

export interface PlatformConfig {
  platformName: string;
  tagline: string;
  contactPhone: string;
  contactWhatsApp: string;
  contactEmail: string;
  address: string;
  version: string;
}

export type TipoPlan = 'MENSUAL' | 'ANUAL';

export type SuscripcionEstado =
  | 'ACTIVA'
  | 'PENDIENTE DE PAGO'
  | 'PENDIENTE DE VALIDACIÓN'
  | 'VENCIDA'
  | 'SUSPENDIDA';

export type PagoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Suscripcion {
  id: string;
  salon_id: string;
  propietario_id: string;
  tipo_plan: TipoPlan;
  monto: number; // Bs 100 o Bs 1100
  fecha_inicio: string; // ISO string
  fecha_vencimiento: string; // ISO string
  estado: SuscripcionEstado;
  fecha_creacion: string; // ISO string
  fecha_actualizacion: string; // ISO string
}

export interface PagoSuscripcion {
  id: string;
  suscripcion_id: string;
  salon_id: string;
  propietario_id: string;
  tipo_plan: TipoPlan;
  monto: number;
  fecha_pago: string; // ISO o "YYYY-MM-DD"
  referencia: string;
  comprobante: string; // Base64 o URL
  observacion?: string;
  estado: PagoEstado;
  fecha_validacion?: string;
  validado_por?: string;
  motivo_rechazo?: string;
}

export interface ConfiguracionPago {
  id: string;
  qr_imagen: string; // Base64 o URL de imagen
  banco_nombre: string;
  titular_cuenta: string;
  numero_cuenta: string;
  fecha_actualizacion: string;
  precio_mensual: number; // Bs 100
  precio_anual: number; // Bs 1100
}





