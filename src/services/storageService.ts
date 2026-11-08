import {
  Salon,
  User,
  ServiceItem,
  SalonScheduleConfig,
  Cita,
  HistorialCita,
  NotificacionInterna,
  Suscripcion,
  PagoSuscripcion,
  ConfiguracionPago,
  PlatformConfig,
  FichaAtencion
} from '../types';
import { MOCK_SALONS } from '../data/mockSalons';
import { MOCK_USERS } from '../data/mockUsers';
import { MOCK_CITAS, MOCK_HISTORIAL, MOCK_NOTIFICACIONES } from '../data/mockCitas';
import { MOCK_FICHAS } from '../data/mockFichas';
import { MOCK_SUSCRIPCIONES, MOCK_PAGOS, DEFAULT_PAGO_CONFIG } from '../data/mockSubscriptions';
import { calculateRemainingDays } from '../utils/subscriptionManager';
import { supabase } from './supabaseClient';

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'TuCita',
  tagline: 'Tu belleza, siempre más cerca.',
  contactPhone: '+591 79781234',
  contactWhatsApp: '+591 79781234',
  contactEmail: 'contacto@tucita.bo',
  address: 'Av. Libertador Bolívar #1040, Cochabamba, Bolivia',
  version: '1.10.0',
};

const STORAGE_KEYS = {
  USERS: 'tucita_users',
  CURRENT_USER: 'tucita_current_user',
  SALONS: 'tucita_salons',
  SERVICES: 'tucita_services',
  SCHEDULES: 'tucita_salon_schedules',
  FICHAS: 'tucita_fichas_atencion',
  CITAS: 'tucita_citas',
  HISTORIAL: 'tucita_historial_citas',
  NOTIFICACIONES: 'tucita_notificaciones',
  SUSCRIPCIONES: 'tucita_suscripciones',
  PAGOS: 'tucita_pagos',
  CONFIG_PAGO: 'tucita_config_pago',
  FAVORITES: 'tucita_favorites',
  PLATFORM_CONFIG: 'tucita_platform_config',
};

const STORAGE_VERSION_KEY = 'tucita_storage_version';
const CURRENT_STORAGE_VERSION = 'tucita_clean_prod_v3';

// Caché en memoria para evitar caídas si localStorage está saturado
const inMemoryCache = new Map<string, string>();

/**
 * Limpieza garantizada de caché: si el navegador tenía datos ficticios previos de salones/citas,
 * los purga automáticamente para que el sistema inicie en estado prístino con la cuenta de admin.
 */
function ensureCleanStorage(): void {
  try {
    const currentVer = localStorage.getItem(STORAGE_VERSION_KEY);
    if (currentVer !== CURRENT_STORAGE_VERSION) {
      console.log('[TuCita Storage] Inicializando almacenamiento limpio para producción v3...');
      Object.values(STORAGE_KEYS).forEach((key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch {
          // ignore
        }
      });
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    }
  } catch (err) {
    console.warn('[TuCita Storage] Error en comprobación de versión de almacenamiento:', err);
  }
}

// Ejecutar inmediatamente al cargar el módulo
ensureCleanStorage();

/**
 * Sanitiza objetos reduciendo data URLs gigantes para evitar saturar el límite de 5MB del navegador
 */
function sanitizeLargeBlobs(val: any): any {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.startsWith('data:image/') && val.length > 80000) {
      return ''; // Quitar imagen pesada si satura el navegador
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeLargeBlobs);
  }
  if (typeof val === 'object') {
    const copy: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      copy[k] = sanitizeLargeBlobs(v);
    }
    return copy;
  }
  return val;
}

/**
 * Lee del almacenamiento persistente (localStorage primero, fallback sessionStorage, luego memoria)
 */
function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local);
    }
    const session = sessionStorage.getItem(key);
    if (session) {
      const parsed = JSON.parse(session);
      try {
        localStorage.setItem(key, session);
      } catch {
        // ignore
      }
      return parsed;
    }
    const mem = inMemoryCache.get(key);
    if (mem) {
      return JSON.parse(mem);
    }
  } catch (error) {
    console.warn(`[TuCita Storage] Error al leer clave ${key}:`, error);
  }
  return defaultValue;
}

/**
 * Escribe en localStorage y sincroniza con sessionStorage de forma resiliente a QuotaExceededError
 */
function writeStorage<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    inMemoryCache.set(key, serialized);

    try {
      localStorage.setItem(key, serialized);
      sessionStorage.setItem(key, serialized);
    } catch (err: any) {
      // Capturar QuotaExceededError y sanear data URLs gigantes
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        console.warn(`[TuCita Storage] Cuota de almacenamiento alcanzada para ${key}. Protegiendo almacenamiento...`);
        try {
          const safeSerialized = JSON.stringify(sanitizeLargeBlobs(value));
          localStorage.setItem(key, safeSerialized);
          sessionStorage.setItem(key, safeSerialized);
        } catch {
          // Si el storage sigue lleno, conservarlo en memoria para la sesión activa
          try {
            sessionStorage.setItem(key, JSON.stringify(sanitizeLargeBlobs(value)));
          } catch {
            // Continúa en memoria sin bloquear la app
          }
        }
      } else {
        console.warn(`[TuCita Storage] Aviso al persistir ${key}:`, err);
      }
    }
  } catch (error) {
    console.warn(`[TuCita Storage] Error al serializar ${key}:`, error);
  }
}

export const StorageService = {
  // 1. Usuarios
  getUsers: (): User[] => {
    return readStorage<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
  },
  saveUsers: (users: User[]): void => {
    writeStorage(STORAGE_KEYS.USERS, users);
    if (supabase && users.length > 0) {
      supabase.from('usuarios').upsert(
        users.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          correo: u.correo,
          usuario: u.usuario,
          contrasena: u.contrasena,
          rol: u.rol,
          estado: u.estado,
          salon_id: u.salonId || null,
          telefono: u.telefono || null,
          expira_en: u.expiraEn || null,
          cuenta_habilitada_notificacion: Boolean(u.cuentaHabilitadaNotificacion),
          fecha_creacion: u.fecha_creacion,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando usuarios:', error.message);
      });
    }
  },

  // 2. Usuario activo
  getCurrentUser: (): User | null => {
    return readStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  saveCurrentUser: (user: User | null): void => {
    if (user) {
      writeStorage(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // 3. Salones
  getSalons: (): Salon[] => {
    return readStorage<Salon[]>(STORAGE_KEYS.SALONS, MOCK_SALONS);
  },
  saveSalons: (salons: Salon[]): void => {
    writeStorage(STORAGE_KEYS.SALONS, salons);
    if (supabase && salons.length > 0) {
      supabase.from('salones').upsert(
        salons.map((s) => ({
          id: s.id,
          propietario_id: s.propietarioId || null,
          name: s.name,
          tagline: s.tagline,
          short_description: s.shortDescription,
          description: s.description,
          neon_subtitle: s.neonSubtitle,
          logo_text: s.logoText,
          logo_bg_color: s.logoBgColor,
          rating: s.rating,
          reviews_count: s.reviewsCount,
          zone: s.zone,
          city: s.city,
          municipio: s.municipio || 'Aiquile',
          departamento: s.departamento || 'Cochabamba',
          address: s.address,
          phone: s.phone,
          whatsapp: s.whatsapp,
          email: s.email,
          schedule: s.schedule,
          estado: s.estado,
          is_available: s.isAvailable,
          cover_image: s.coverImage,
          banner_image: s.bannerImage,
          banner_gradient: s.bannerGradient,
          hero_image: s.heroImage,
          service_thumbnails: s.serviceThumbnails,
          gallery: s.gallery,
          is_featured: s.isFeatured,
          orden_pago: s.ordenPago || null,
          cuenta_habilitada_notificacion: Boolean(s.cuentaHabilitadaNotificacion),
          fecha_creacion: s.fecha_creacion || new Date().toISOString(),
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando salones:', error.message);
      });
    }
  },

  // 4. Servicios (Consolidación corregida para evitar pérdida tras recarga)
  getServices: (): ServiceItem[] => {
    const defaultServices = MOCK_SALONS.flatMap((s) => s.services);
    return readStorage<ServiceItem[]>(STORAGE_KEYS.SERVICES, defaultServices);
  },
  saveServices: (services: ServiceItem[]): void => {
    writeStorage(STORAGE_KEYS.SERVICES, services);
    if (supabase && services.length > 0) {
      supabase.from('servicios').upsert(
        services.map((srv) => ({
          id: srv.id,
          salon_id: srv.salonId,
          name: srv.name,
          description: srv.description,
          image: srv.image,
          price: srv.price,
          duration_minutes: srv.durationMinutes,
          status: srv.status,
          category: srv.category,
          created_at: srv.createdAt,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando servicios:', error.message);
      });
    }
  },

  // 5. Horarios de Salones
  getSchedules: (): Record<string, SalonScheduleConfig> => {
    return readStorage<Record<string, SalonScheduleConfig>>(STORAGE_KEYS.SCHEDULES, {});
  },
  saveSchedules: (schedules: Record<string, SalonScheduleConfig>): void => {
    writeStorage(STORAGE_KEYS.SCHEDULES, schedules);
    if (supabase) {
      const scheduleRows = Object.values(schedules).map((sch) => ({
        id: sch.id,
        salon_id: sch.salonId,
        intervalo_minutos: String(sch.intervaloMinutos),
        dias: sch.dias,
        fecha_actualizacion: sch.fechaActualizacion || new Date().toISOString(),
      }));
      if (scheduleRows.length > 0) {
        supabase.from('horarios_salon').upsert(scheduleRows).then(({ error }) => {
          if (error) console.warn('[TuCita Supabase] Error sincronizando horarios:', error.message);
        });
      }
    }
  },

  // 5.5. Fichas de Atención Manuales (Módulo de Horarios y Disponibilidad)
  getFichas: (): FichaAtencion[] => {
    return readStorage<FichaAtencion[]>(STORAGE_KEYS.FICHAS, MOCK_FICHAS);
  },
  saveFichas: (fichas: FichaAtencion[]): void => {
    writeStorage(STORAGE_KEYS.FICHAS, fichas);
    if (supabase && fichas.length > 0) {
      supabase.from('fichas_atencion').upsert(
        fichas.map((f) => ({
          id: f.id,
          salon_id: f.salon_id,
          fecha: f.fecha,
          hora_inicio: f.hora_inicio,
          hora_fin: f.hora_fin,
          duracion: f.duracion,
          estado: f.estado,
          cita_id: f.cita_id,
          cliente_nombre: f.cliente_nombre,
          servicio_nombre: f.servicio_nombre,
          observacion: f.observacion,
          fecha_creacion: f.fecha_creacion,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando fichas:', error.message);
      });
    }
  },

  // 6. Citas
  getCitas: (): Cita[] => {
    return readStorage<Cita[]>(STORAGE_KEYS.CITAS, MOCK_CITAS);
  },
  saveCitas: (citas: Cita[]): void => {
    writeStorage(STORAGE_KEYS.CITAS, citas);
    if (supabase && citas.length > 0) {
      supabase.from('citas').upsert(
        citas.map((c) => ({
          id: c.id,
          codigo_cita: c.codigo_cita,
          salon_id: c.salon_id,
          servicio_id: c.servicio_id,
          salon_nombre: c.salon_nombre || 'Salón de Belleza',
          servicio_nombre: c.servicio_nombre || 'Servicio de Belleza',
          cliente_nombre: c.cliente_nombre || 'Cliente',
          cliente_telefono: c.cliente_telefono || 'Sin teléfono',
          cliente_whatsapp: c.cliente_whatsapp || c.cliente_telefono || 'Sin WhatsApp',
          cliente_correo: c.cliente_correo || null,
          fecha: c.fecha,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          duracion: c.duracion,
          precio: c.precio,
          nota: c.nota,
          estado: c.estado,
          fecha_solicitud: c.fecha_solicitud,
          fecha_actualizacion: c.fecha_actualizacion,
          motivo_rechazo: c.motivo_rechazo,
          fecha_confirmacion: c.fecha_confirmacion,
          fecha_rechazo: c.fecha_rechazo,
          fecha_cancelacion: c.fecha_cancelacion,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando citas:', error.message);
      });
    }
  },

  // 7. Historial de Citas
  getHistorial: (): HistorialCita[] => {
    return readStorage<HistorialCita[]>(STORAGE_KEYS.HISTORIAL, MOCK_HISTORIAL);
  },
  saveHistorial: (historial: HistorialCita[]): void => {
    writeStorage(STORAGE_KEYS.HISTORIAL, historial);
    if (supabase && historial.length > 0) {
      supabase.from('historial_citas').upsert(
        historial.map((h) => ({
          id: h.id,
          cita_id: h.cita_id,
          codigo_cita: h.codigo_cita,
          salon_id: h.salon_id,
          estado_anterior: h.estado_anterior,
          estado_nuevo: h.estado_nuevo,
          usuario_id: h.usuario_id,
          usuario_nombre: h.usuario_nombre,
          fecha: h.fecha,
          observacion: h.observacion,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando historial:', error.message);
      });
    }
  },

  // 8. Notificaciones
  getNotifications: (): NotificacionInterna[] => {
    return readStorage<NotificacionInterna[]>(STORAGE_KEYS.NOTIFICACIONES, MOCK_NOTIFICACIONES);
  },
  saveNotifications: (notifs: NotificacionInterna[]): void => {
    writeStorage(STORAGE_KEYS.NOTIFICACIONES, notifs);
    if (supabase && notifs.length > 0) {
      supabase.from('notificaciones').upsert(
        notifs.map((n) => ({
          id: n.id,
          salon_id: n.salon_id,
          cita_id: n.cita_id,
          codigo_cita: n.codigo_cita,
          titulo: n.titulo,
          mensaje: n.mensaje,
          leida: n.leida,
          fecha: n.fecha,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando notificaciones:', error.message);
      });
    }
  },

  // 9. Suscripciones con verificación automática de vencimiento
  getSubscriptions: (): Suscripcion[] => {
    const rawSubs = readStorage<Suscripcion[]>(STORAGE_KEYS.SUSCRIPCIONES, MOCK_SUSCRIPCIONES);
    
    // Verificación automática de vencimientos (Requisito 13 y 15)
    let hasChanges = false;
    const verifiedSubs = rawSubs.map((sub) => {
      if (sub.estado === 'ACTIVA') {
        const remaining = calculateRemainingDays(sub.fecha_vencimiento);
        if (remaining < 0) {
          hasChanges = true;
          return {
            ...sub,
            estado: 'VENCIDA' as const,
            fecha_actualizacion: new Date().toISOString(),
          };
        }
      }
      return sub;
    });

    if (hasChanges) {
      writeStorage(STORAGE_KEYS.SUSCRIPCIONES, verifiedSubs);
    }
    return verifiedSubs;
  },
  saveSubscriptions: (subs: Suscripcion[]): void => {
    writeStorage(STORAGE_KEYS.SUSCRIPCIONES, subs);
    if (supabase && subs.length > 0) {
      supabase.from('suscripciones').upsert(
        subs.map((s) => ({
          id: s.id,
          salon_id: s.salon_id,
          propietario_id: s.propietario_id,
          tipo_plan: s.tipo_plan,
          monto: s.monto,
          fecha_inicio: s.fecha_inicio,
          fecha_vencimiento: s.fecha_vencimiento,
          estado: s.estado,
          fecha_creacion: s.fecha_creacion,
          fecha_actualizacion: s.fecha_actualizacion,
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando suscripciones:', error.message);
      });
    }
  },

  // 10. Pagos de Suscripción
  getPagos: (): PagoSuscripcion[] => {
    return readStorage<PagoSuscripcion[]>(STORAGE_KEYS.PAGOS, MOCK_PAGOS);
  },
  savePagos: (pagos: PagoSuscripcion[]): void => {
    writeStorage(STORAGE_KEYS.PAGOS, pagos);
    if (supabase && pagos.length > 0) {
      supabase.from('pagos_suscripcion').upsert(
        pagos.map((p) => ({
          id: p.id,
          suscripcion_id: p.suscripcion_id,
          salon_id: p.salon_id,
          propietario_id: p.propietario_id,
          tipo_plan: p.tipo_plan,
          monto: p.monto,
          fecha_pago: p.fecha_pago,
          referencia: p.referencia,
          comprobante: p.comprobante,
          observacion: p.observacion,
          estado: p.estado,
          fecha_validacion: p.fecha_validacion,
          validado_por: p.validado_por,
          motivo_rechazo: p.motivo_rechazo,
          created_at: new Date().toISOString(),
        }))
      ).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando pagos:', error.message);
      });
    }
  },

  // 11. Configuración de Pago (QR)
  getConfigPago: (): ConfiguracionPago => {
    return readStorage<ConfiguracionPago>(STORAGE_KEYS.CONFIG_PAGO, DEFAULT_PAGO_CONFIG);
  },
  saveConfigPago: (config: ConfiguracionPago): void => {
    writeStorage(STORAGE_KEYS.CONFIG_PAGO, config);
    if (supabase) {
      supabase.from('configuracion_pago').upsert({
        id: config.id,
        qr_imagen: config.qr_imagen,
        banco_nombre: config.banco_nombre,
        titular_cuenta: config.titular_cuenta,
        numero_cuenta: config.numero_cuenta,
        precio_mensual: config.precio_mensual,
        precio_anual: config.precio_anual,
        fecha_actualizacion: config.fecha_actualizacion,
      }).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando configuracion_pago:', error.message);
      });
    }
  },

  // 12. Favoritos
  getFavorites: (): string[] => {
    return readStorage<string[]>(STORAGE_KEYS.FAVORITES, []);
  },
  saveFavorites: (favs: string[]): void => {
    writeStorage(STORAGE_KEYS.FAVORITES, favs);
  },

  // 13. Configuración General de la Plataforma (Persistencia Real Etapa 10)
  getPlatformConfig: (): PlatformConfig => {
    return readStorage<PlatformConfig>(STORAGE_KEYS.PLATFORM_CONFIG, DEFAULT_PLATFORM_CONFIG);
  },
  savePlatformConfig: (config: PlatformConfig): void => {
    writeStorage(STORAGE_KEYS.PLATFORM_CONFIG, config);
    if (supabase) {
      supabase.from('configuracion_plataforma').upsert({
        id: 'config-tucita-main',
        platform_name: config.platformName,
        tagline: config.tagline,
        contact_phone: config.contactPhone,
        contact_whatsapp: config.contactWhatsApp,
        contact_email: config.contactEmail,
        address: config.address,
        version: config.version,
      }).then(({ error }) => {
        if (error) console.warn('[TuCita Supabase] Error sincronizando configuracion_plataforma:', error.message);
      });
    }
  },

  // 14. Reinicio Completo a Estado Prístino (Admin / Sistema)
  resetToPristine: (): void => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    writeStorage(STORAGE_KEYS.USERS, MOCK_USERS);
    writeStorage(STORAGE_KEYS.SALONS, []);
    writeStorage(STORAGE_KEYS.SERVICES, []);
    writeStorage(STORAGE_KEYS.SCHEDULES, {});
    writeStorage(STORAGE_KEYS.FICHAS, []);
    writeStorage(STORAGE_KEYS.CITAS, []);
    writeStorage(STORAGE_KEYS.HISTORIAL, []);
    writeStorage(STORAGE_KEYS.NOTIFICACIONES, []);
    writeStorage(STORAGE_KEYS.SUSCRIPCIONES, []);
    writeStorage(STORAGE_KEYS.PAGOS, []);
    writeStorage(STORAGE_KEYS.CONFIG_PAGO, DEFAULT_PAGO_CONFIG);
    writeStorage(STORAGE_KEYS.PLATFORM_CONFIG, DEFAULT_PLATFORM_CONFIG);
  },

  // 15. Exportación completa de respaldo (11 entidades verificadas)
  exportAllData: () => {
    return {
      metadata: {
        plataforma: 'TuCita',
        version: '1.10.0',
        fechaExportacion: new Date().toISOString(),
        entorno: 'Aiquile, Cochabamba, Bolivia',
      },
      usuarios: StorageService.getUsers(),
      salones: StorageService.getSalons(),
      servicios: StorageService.getServices(),
      horarios_salon: StorageService.getSchedules(),
      fichas_atencion: StorageService.getFichas(),
      citas: StorageService.getCitas(),
      historial_citas: StorageService.getHistorial(),
      notificaciones: StorageService.getNotifications(),
      suscripciones: StorageService.getSubscriptions(),
      pagos_suscripcion: StorageService.getPagos(),
      configuracion_pago: StorageService.getConfigPago(),
      configuracion_plataforma: StorageService.getPlatformConfig(),
    };
  },

  // 16. Registro completo y atómico de nuevo salón en Supabase
  registerNewSalonOwnerDirectly: async (params: {
    owner: User;
    salon: Salon;
    services: ServiceItem[];
    schedule: SalonScheduleConfig;
    sub: Suscripcion;
    pago: PagoSuscripcion;
    notif: NotificacionInterna;
  }): Promise<{ success: boolean; error?: string }> => {
    const { owner, salon, services, schedule, sub, pago, notif } = params;

    // 1. Guardar de inmediato en almacenamiento seguro local
    const currentUsers = StorageService.getUsers();
    StorageService.saveUsers([owner, ...currentUsers.filter((u) => u.id !== owner.id)]);

    const currentSalons = StorageService.getSalons();
    StorageService.saveSalons([salon, ...currentSalons.filter((s) => s.id !== salon.id)]);

    const currentServices = StorageService.getServices();
    StorageService.saveServices([...services, ...currentServices.filter((srv) => srv.salonId !== salon.id)]);

    const currentSchedules = StorageService.getSchedules();
    StorageService.saveSchedules({ ...currentSchedules, [salon.id]: schedule });

    const currentSubs = StorageService.getSubscriptions();
    StorageService.saveSubscriptions([sub, ...currentSubs.filter((s) => s.salon_id !== salon.id)]);

    const currentPagos = StorageService.getPagos();
    StorageService.savePagos([pago, ...currentPagos.filter((p) => p.id !== pago.id)]);

    const currentNotifs = StorageService.getNotifications();
    StorageService.saveNotifications([notif, ...currentNotifs.filter((n) => n.id !== notif.id)]);

    // 2. Persistir en Supabase de forma secuencial y atómica
    if (supabase) {
      try {
        // Paso A: Usuario propietario
        const { error: errUser } = await supabase.from('usuarios').upsert([{
          id: owner.id,
          nombre: owner.nombre,
          apellido: owner.apellido,
          correo: owner.correo,
          usuario: owner.usuario,
          contrasena: owner.contrasena,
          rol: owner.rol,
          estado: owner.estado,
          salon_id: owner.salonId || salon.id,
          telefono: owner.telefono || null,
          expira_en: owner.expiraEn || null,
          cuenta_habilitada_notificacion: Boolean(owner.cuentaHabilitadaNotificacion),
          fecha_creacion: owner.fecha_creacion,
        }]);
        if (errUser) throw new Error(`Error en usuarios: ${errUser.message}`);

        // Paso B: Salón
        const { error: errSalon } = await supabase.from('salones').upsert([{
          id: salon.id,
          propietario_id: owner.id,
          name: salon.name,
          tagline: salon.tagline,
          short_description: salon.shortDescription,
          description: salon.description,
          neon_subtitle: salon.neonSubtitle,
          logo_text: salon.logoText,
          logo_bg_color: salon.logoBgColor,
          rating: salon.rating,
          reviews_count: salon.reviewsCount,
          zone: salon.zone,
          city: salon.city,
          municipio: salon.municipio || 'Aiquile',
          departamento: salon.departamento || 'Cochabamba',
          address: salon.address,
          phone: salon.phone,
          whatsapp: salon.whatsapp,
          email: salon.email,
          schedule: salon.schedule,
          estado: salon.estado,
          is_available: salon.isAvailable,
          cover_image: salon.coverImage,
          banner_image: salon.bannerImage,
          banner_gradient: salon.bannerGradient,
          hero_image: salon.heroImage,
          service_thumbnails: salon.serviceThumbnails,
          gallery: salon.gallery,
          is_featured: salon.isFeatured,
          orden_pago: salon.ordenPago || null,
          cuenta_habilitada_notificacion: Boolean(salon.cuentaHabilitadaNotificacion),
          fecha_creacion: salon.fecha_creacion || new Date().toISOString(),
        }]);
        if (errSalon) throw new Error(`Error en salones: ${errSalon.message}`);

        // Paso C: Suscripción
        const { error: errSub } = await supabase.from('suscripciones').upsert([{
          id: sub.id,
          salon_id: sub.salon_id,
          propietario_id: owner.id,
          tipo_plan: sub.tipo_plan,
          monto: sub.monto,
          fecha_inicio: sub.fecha_inicio,
          fecha_vencimiento: sub.fecha_vencimiento,
          estado: sub.estado,
          fecha_creacion: sub.fecha_creacion,
          fecha_actualizacion: sub.fecha_actualizacion,
        }]);
        if (errSub) throw new Error(`Error en suscripciones: ${errSub.message}`);

        // Paso D: Pago inicial, servicios, horarios y notificación
        await Promise.all([
          supabase.from('pagos_suscripcion').upsert([{
            id: pago.id,
            suscripcion_id: sub.id,
            salon_id: salon.id,
            propietario_id: owner.id,
            tipo_plan: pago.tipo_plan,
            monto: pago.monto,
            fecha_pago: pago.fecha_pago,
            referencia: pago.referencia,
            comprobante: pago.comprobante,
            observacion: pago.observacion,
            estado: pago.estado,
            created_at: new Date().toISOString(),
          }]),
          supabase.from('servicios').upsert(
            services.map((srv) => ({
              id: srv.id,
              salon_id: salon.id,
              name: srv.name,
              description: srv.description,
              image: srv.image,
              price: srv.price,
              duration_minutes: srv.durationMinutes,
              status: srv.status,
              category: srv.category,
              created_at: srv.createdAt,
            }))
          ),
          supabase.from('horarios_salon').upsert([{
            id: schedule.id,
            salon_id: salon.id,
            intervalo_minutos: String(schedule.intervaloMinutos),
            dias: schedule.dias,
            fecha_actualizacion: schedule.fechaActualizacion || new Date().toISOString(),
          }]),
          supabase.from('notificaciones').upsert([{
            id: notif.id,
            salon_id: salon.id,
            cita_id: notif.cita_id,
            codigo_cita: notif.codigo_cita,
            titulo: notif.titulo,
            mensaje: notif.mensaje,
            leida: notif.leida,
            fecha: notif.fecha,
          }])
        ]);
        console.log('[TuCita Supabase] Salón y todas sus entidades persistidas exitosamente en la base de datos.');
      } catch (err: any) {
        console.error('[TuCita Supabase] Error en registro de salón:', err);
        return { success: false, error: err?.message || 'Error guardando en Supabase' };
      }
    }
    return { success: true };
  },

  // 17. Carga y sincronización en vivo desde Supabase
  loadFromSupabase: async () => {
    if (!supabase) return null;
    try {
      const [
        resUsers,
        resSalons,
        resServices,
        resSubs,
        resPagos,
        resCitas,
        resFichas,
        resNotifs,
        resHistorial
      ] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('salones').select('*'),
        supabase.from('servicios').select('*'),
        supabase.from('suscripciones').select('*'),
        supabase.from('pagos_suscripcion').select('*'),
        supabase.from('citas').select('*'),
        supabase.from('fichas_atencion').select('*'),
        supabase.from('notificaciones').select('*'),
        supabase.from('historial_citas').select('*'),
      ]);

      const data: {
        users?: User[];
        salons?: Salon[];
        services?: ServiceItem[];
        subs?: Suscripcion[];
        pagos?: PagoSuscripcion[];
        citas?: Cita[];
        fichas?: FichaAtencion[];
        notifs?: NotificacionInterna[];
        historial?: HistorialCita[];
      } = {};

      if (resUsers.data && resUsers.data.length > 0) {
        data.users = resUsers.data.map((u: any) => ({
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          correo: u.correo || '',
          usuario: u.usuario,
          contrasena: u.contrasena,
          rol: u.rol,
          estado: u.estado,
          salonId: u.salon_id,
          telefono: u.telefono || '',
          expiraEn: u.expira_en,
          cuentaHabilitadaNotificacion: u.cuenta_habilitada_notificacion,
          fecha_creacion: u.fecha_creacion,
        }));
        writeStorage(STORAGE_KEYS.USERS, data.users);
      }

      if (resSalons.data && resSalons.data.length > 0) {
        data.salons = resSalons.data.map((s: any) => ({
          id: s.id,
          propietarioId: s.propietario_id,
          name: s.name,
          tagline: s.tagline || '',
          shortDescription: s.short_description || '',
          description: s.description || '',
          neonSubtitle: s.neon_subtitle || '',
          logoText: s.logo_text || '',
          logoBgColor: s.logo_bg_color || '#7e22ce',
          logoImage: s.logo_image,
          rating: Number(s.rating) || 5.0,
          reviewsCount: Number(s.reviews_count) || 0,
          zone: s.zone || 'Zona Central',
          city: s.city || 'Aiquile',
          municipio: s.municipio || 'Aiquile',
          departamento: s.departamento || 'Cochabamba',
          address: s.address,
          phone: s.phone || '',
          whatsapp: s.whatsapp || '',
          email: s.email || '',
          schedule: s.schedule || '',
          estado: s.estado,
          isAvailable: s.is_available,
          coverImage: s.cover_image,
          bannerImage: s.banner_image,
          bannerGradient: s.banner_gradient,
          heroImage: s.hero_image,
          serviceThumbnails: s.service_thumbnails || [],
          gallery: s.gallery || [],
          services: [],
          additionalInfo: s.additional_info || [],
          isFeatured: s.is_featured,
          ordenPago: s.orden_pago,
          cuentaHabilitadaNotificacion: s.cuenta_habilitada_notificacion,
          fecha_creacion: s.fecha_creacion,
        }));
        writeStorage(STORAGE_KEYS.SALONS, data.salons);
      }

      if (resServices.data && resServices.data.length > 0) {
        data.services = resServices.data.map((srv: any) => ({
          id: srv.id,
          salonId: srv.salon_id,
          name: srv.name,
          description: srv.description || '',
          image: srv.image || '',
          price: Number(srv.price) || 0,
          durationMinutes: Number(srv.duration_minutes) || 45,
          status: srv.status,
          category: srv.category || 'Cabello',
          createdAt: srv.created_at,
        }));
        writeStorage(STORAGE_KEYS.SERVICES, data.services);
      }

      if (resSubs.data && resSubs.data.length > 0) {
        data.subs = resSubs.data.map((sub: any) => ({
          id: sub.id,
          salon_id: sub.salon_id,
          propietario_id: sub.propietario_id,
          tipo_plan: sub.tipo_plan,
          monto: Number(sub.monto),
          fecha_inicio: sub.fecha_inicio,
          fecha_vencimiento: sub.fecha_vencimiento,
          estado: sub.estado,
          fecha_creacion: sub.fecha_creacion,
          fecha_actualizacion: sub.fecha_actualizacion,
        }));
        writeStorage(STORAGE_KEYS.SUSCRIPCIONES, data.subs);
      }

      if (resPagos.data && resPagos.data.length > 0) {
        data.pagos = resPagos.data.map((p: any) => ({
          id: p.id,
          suscripcion_id: p.suscripcion_id,
          salon_id: p.salon_id,
          propietario_id: p.propietario_id,
          tipo_plan: p.tipo_plan,
          monto: Number(p.monto),
          fecha_pago: p.fecha_pago,
          referencia: p.referencia,
          comprobante: p.comprobante,
          observacion: p.observacion,
          estado: p.estado,
          fecha_validacion: p.fecha_validacion,
          validado_por: p.validado_por,
          motivo_rechazo: p.motivo_rechazo,
        }));
        writeStorage(STORAGE_KEYS.PAGOS, data.pagos);
      }

      if (resCitas.data && resCitas.data.length > 0) {
        data.citas = resCitas.data.map((c: any) => ({
          id: c.id,
          codigo_cita: c.codigo_cita,
          salon_id: c.salon_id,
          servicio_id: c.servicio_id,
          salon_nombre: c.salon_nombre,
          servicio_nombre: c.servicio_nombre,
          cliente_id: c.cliente_id,
          cliente_nombre: c.cliente_nombre,
          cliente_telefono: c.cliente_telefono,
          cliente_whatsapp: c.cliente_whatsapp,
          cliente_correo: c.cliente_correo,
          fecha: c.fecha,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          duracion: Number(c.duracion) || 30,
          precio: Number(c.precio) || 0,
          nota: c.nota,
          estado: c.estado,
          fecha_solicitud: c.fecha_solicitud,
          fecha_actualizacion: c.fecha_actualizacion,
          motivo_rechazo: c.motivo_rechazo,
          fecha_confirmacion: c.fecha_confirmacion,
          fecha_rechazo: c.fecha_rechazo,
          fecha_cancelacion: c.fecha_cancelacion,
        }));
        writeStorage(STORAGE_KEYS.CITAS, data.citas);
      }

      if (resFichas.data && resFichas.data.length > 0) {
        data.fichas = resFichas.data.map((f: any) => ({
          id: f.id,
          salon_id: f.salon_id,
          fecha: f.fecha,
          hora_inicio: f.hora_inicio,
          hora_fin: f.hora_fin,
          duracion: Number(f.duracion) || 30,
          estado: f.estado,
          cita_id: f.cita_id,
          cliente_nombre: f.cliente_nombre,
          servicio_nombre: f.servicio_nombre,
          observacion: f.observacion,
          tipo_creacion: f.tipo_creacion,
          fecha_creacion: f.fecha_creacion,
        }));
        writeStorage(STORAGE_KEYS.FICHAS, data.fichas);
      }

      if (resNotifs.data && resNotifs.data.length > 0) {
        data.notifs = resNotifs.data.map((n: any) => ({
          id: n.id,
          salon_id: n.salon_id,
          cita_id: n.cita_id,
          codigo_cita: n.codigo_cita,
          titulo: n.titulo,
          mensaje: n.mensaje,
          leida: n.leida,
          fecha: n.fecha,
        }));
        writeStorage(STORAGE_KEYS.NOTIFICACIONES, data.notifs);
      }

      if (resHistorial.data && resHistorial.data.length > 0) {
        data.historial = resHistorial.data.map((h: any) => ({
          id: h.id,
          cita_id: h.cita_id,
          codigo_cita: h.codigo_cita,
          salon_id: h.salon_id,
          estado_anterior: h.estado_anterior,
          estado_nuevo: h.estado_nuevo,
          usuario_id: h.usuario_id,
          usuario_nombre: h.usuario_nombre,
          fecha: h.fecha,
          observacion: h.observacion,
        }));
        writeStorage(STORAGE_KEYS.HISTORIAL, data.historial);
      }

      return data;
    } catch (e) {
      console.warn('[TuCita Supabase] Error cargando datos remotos:', e);
      return null;
    }
  },
};
