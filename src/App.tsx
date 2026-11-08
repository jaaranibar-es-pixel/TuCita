import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ServiceCategories } from './components/ServiceCategories';
import { SalonsSection } from './components/SalonsSection';
import { SalonsPage } from './components/SalonsPage';
import { SalonDetailPage } from './components/SalonDetailPage';
import { Footer } from './components/Footer';
import { FavoritesModal } from './components/FavoritesModal';
import { UserNoticeModal } from './components/UserNoticeModal';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { MOCK_SALONS } from './data/mockSalons';
import { MOCK_USERS } from './data/mockUsers';
import { MOCK_CITAS, MOCK_HISTORIAL, MOCK_NOTIFICACIONES } from './data/mockCitas';
import { MOCK_SUSCRIPCIONES, MOCK_PAGOS, DEFAULT_PAGO_CONFIG } from './data/mockSubscriptions';
import {
  Salon,
  ServiceItem,
  User,
  SalonStatus,
  SalonScheduleConfig,
  Cita,
  HistorialCita,
  NotificacionInterna,
  CitaEstado,
  Suscripcion,
  PagoSuscripcion,
  ConfiguracionPago,
  SuscripcionEstado,
  PlatformConfig,
  FichaAtencion,
  FichaEstado,
  PropuestaHorario,
  SalonPaymentOrder,
  TipoPlan
} from './types';
import { createDefaultSalonSchedule } from './utils/scheduleGenerator';
import { formatYYYYMMDDtoDDMMYYYY, isAppointmentExpired } from './utils/appointmentManager';
import { calculateExpirationDate, calculateRemainingDays } from './utils/subscriptionManager';
import { StorageService } from './services/storageService';
import { verifyPasswordSync, hashPasswordSync } from './utils/security';
import { validateFicha } from './utils/scheduleValidator';
import { AppointmentTrackingModal } from './components/AppointmentTrackingModal';
import { ClientDashboard } from './components/ClientDashboard';
import { AlertCircle, Lock } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'salones' | 'salon-detail' | 'login' | 'admin' | 'propietario' | 'cliente'>('home');
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [selectedServiceIdForSalon, setSelectedServiceIdForSalon] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');

  // Users state (Etapa 4, 8 & 10)
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());

  // Salons state (Etapa 1 a 10)
  const [salons, setSalons] = useState<Salon[]>(() => StorageService.getSalons());

  // Active authenticated user session (Etapa 4, 8 & 10)
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());

  // Services state per salon (Etapa 3, 4 & 10 - Persistencia Real corregida tras recarga)
  const [allServices, setAllServices] = useState<ServiceItem[]>(() => StorageService.getServices());

  // Schedules state per salon (Etapa 5 & 10)
  const [salonSchedules, setSalonSchedules] = useState<Record<string, SalonScheduleConfig>>(() => {
    const stored = StorageService.getSchedules();
    const initial: Record<string, SalonScheduleConfig> = { ...stored };
    MOCK_SALONS.forEach((s) => {
      if (!initial[s.id]) {
        initial[s.id] = createDefaultSalonSchedule(s.id);
      }
    });
    return initial;
  });

  // Appointments / Citas state (Etapa 6, 7 & 10)
  const [citas, setCitas] = useState<Cita[]>(() => StorageService.getCitas());

  // Fichas de Atención manuales configuradas por los salones (Módulo de Horarios y Disponibilidad)
  const [fichas, setFichas] = useState<FichaAtencion[]>(() => StorageService.getFichas());

  // History of Appointment Status changes (Etapa 7 & 10)
  const [historial, setHistorial] = useState<HistorialCita[]>(() => StorageService.getHistorial());

  // Internal Notifications state for Owners (Etapa 7 & 10)
  const [notifications, setNotifications] = useState<NotificacionInterna[]>(() => StorageService.getNotifications());

  // Subscriptions state with automated expiration check (Etapa 9 & 10)
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>(() => StorageService.getSubscriptions());

  // Subscription Payments state (Etapa 9 & 10)
  const [pagos, setPagos] = useState<PagoSuscripcion[]>(() => StorageService.getPagos());

  // QR & Payment Configuration state (Etapa 9 & 10)
  const [configPago, setConfigPago] = useState<ConfiguracionPago>(() => StorageService.getConfigPago());

  // Platform general configuration state (Etapa 10)
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() => StorageService.getPlatformConfig());

  // Carga inicial y sincronización con Supabase (PostgreSQL)
  useEffect(() => {
    StorageService.loadFromSupabase().then((remote) => {
      if (remote) {
        if (remote.users && remote.users.length > 0) setUsers(remote.users);
        if (remote.salons && remote.salons.length > 0) setSalons(remote.salons);
        if (remote.services && remote.services.length > 0) setAllServices(remote.services);
        if (remote.subs && remote.subs.length > 0) setSuscripciones(remote.subs);
        if (remote.pagos && remote.pagos.length > 0) setPagos(remote.pagos);
        if (remote.citas && remote.citas.length > 0) setCitas(remote.citas);
        if (remote.fichas && remote.fichas.length > 0) setFichas(remote.fichas);
        if (remote.notifs && remote.notifs.length > 0) setNotifications(remote.notifs);
        if (remote.historial && remote.historial.length > 0) setHistorial(remote.historial);
      }
    });
  }, []);

  // Sincronización continua de datos persistentes (Requisito 4: Persistencia Real comprobada)
  useEffect(() => {
    StorageService.saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    StorageService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    StorageService.saveSalons(salons);
  }, [salons]);

  useEffect(() => {
    StorageService.saveServices(allServices);
  }, [allServices]);

  useEffect(() => {
    StorageService.saveSchedules(salonSchedules);
  }, [salonSchedules]);

  useEffect(() => {
    StorageService.saveCitas(citas);
  }, [citas]);

  useEffect(() => {
    StorageService.saveFichas(fichas);
  }, [fichas]);

  useEffect(() => {
    StorageService.saveHistorial(historial);
  }, [historial]);

  useEffect(() => {
    StorageService.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    StorageService.saveSubscriptions(suscripciones);
  }, [suscripciones]);

  useEffect(() => {
    StorageService.savePagos(pagos);
  }, [pagos]);

  useEffect(() => {
    StorageService.saveConfigPago(configPago);
  }, [configPago]);

  useEffect(() => {
    StorageService.savePlatformConfig(platformConfig);
  }, [platformConfig]);

  useEffect(() => {
    StorageService.saveFavorites(favorites);
  }, [favorites]);

  // Regla TuCita: Ningún salón sin suscripción (mínimo 1 mes inicial).
  // Salones con suscripción vencida pasan automáticamente a inactivas directamente.
  useEffect(() => {
    // 1. Asegurar suscripción para cualquier salón registrado
    setSuscripciones((prevSubs) => {
      let added = false;
      const nextSubs = [...prevSubs];
      salons.forEach((salon) => {
        if (!nextSubs.some((s) => s.salon_id === salon.id)) {
          added = true;
          const now = new Date();
          nextSubs.push({
            id: `sub-${salon.id}`,
            salon_id: salon.id,
            propietario_id: salon.propietarioId || '',
            tipo_plan: 'MENSUAL',
            monto: configPago.precio_mensual || 100,
            fecha_inicio: now.toISOString(),
            fecha_vencimiento: calculateExpirationDate(now, 'MENSUAL').toISOString(),
            estado: salon.estado === 'activo' ? 'ACTIVA' : 'PENDIENTE DE PAGO',
            fecha_creacion: now.toISOString(),
            fecha_actualizacion: now.toISOString(),
          });
        }
      });
      return added ? nextSubs : prevSubs;
    });

    // 2. Si la suscripción venció, marcar el salón en inactivo directamente
    setSalons((prevSalons) => {
      let changed = false;
      const updated = prevSalons.map((salon) => {
        const sub = suscripciones.find((s) => s.salon_id === salon.id);
        if (sub) {
          const remaining = calculateRemainingDays(sub.fecha_vencimiento);
          if ((remaining < 0 || sub.estado === 'VENCIDA') && salon.estado === 'activo') {
            changed = true;
            return {
              ...salon,
              estado: 'inactivo' as const,
              isAvailable: false,
            };
          }
        }
        return salon;
      });
      return changed ? updated : prevSalons;
    });

    // 3. Notificaciones automáticas de suscripción para propietarios
    setNotifications((prevNotifs) => {
      const newAlerts: NotificacionInterna[] = [];
      suscripciones.forEach((sub) => {
        const remaining = calculateRemainingDays(sub.fecha_vencimiento);
        let alertMsg = '';
        let alertTitle = '';

        if (remaining <= 0 || sub.estado === 'VENCIDA' || sub.estado === 'SUSPENDIDA') {
          alertTitle = 'Suscripción vencida';
          alertMsg = 'Tu suscripción ha vencido y tu salón se encuentra inactivo. Realiza tu pago mediante QR para reactivarlo.';
        } else if (remaining === 1) {
          alertTitle = 'Último día para renovar';
          alertMsg = 'Te falta 1 día para pagar tu suscripción/alquiler, si no, tu cuenta estará inactiva.';
        } else if (remaining <= 3) {
          alertTitle = 'Suscripción por vencer (3 días)';
          alertMsg = `Te faltan ${remaining} días para pagar tu suscripción de salón. Evita la pausa de tu catálogo.`;
        } else if (remaining <= 7) {
          alertTitle = 'Aviso de suscripción (7 días)';
          alertMsg = `Te faltan ${remaining} días para pagar tu alquiler de suscripción, si no, tu cuenta estará inactiva.`;
        }

        if (alertTitle && alertMsg) {
          const alreadyExists = prevNotifs.some(
            (n) => n.salon_id === sub.salon_id && n.titulo === alertTitle
          );
          if (!alreadyExists) {
            newAlerts.push({
              id: `notif-sub-${sub.salon_id}-${remaining}-${Date.now()}`,
              salon_id: sub.salon_id,
              cita_id: '',
              codigo_cita: sub.tipo_plan,
              titulo: alertTitle,
              mensaje: alertMsg,
              leida: false,
              fecha: new Date().toISOString(),
            });
          }
        }
      });
      return newAlerts.length > 0 ? [...newAlerts, ...prevNotifs] : prevNotifs;
    });
  }, [salons.length, configPago.precio_mensual]);

  // Verificación periódica y automática de caducidad (24 horas) para solicitudes PENDIENTE y PROPUESTA_ENVIADA
  useEffect(() => {
    const checkExpirations = () => {
      const now = new Date();
      let hasExpired = false;
      const expiredCitaIds: string[] = [];

      setCitas((prev) => {
        const next = prev.map((c) => {
          if ((c.estado === 'PENDIENTE' || c.estado === 'PROPUESTA_ENVIADA') && isAppointmentExpired(c, now)) {
            hasExpired = true;
            expiredCitaIds.push(c.id);
            return {
              ...c,
              estado: 'CADUCADA' as CitaEstado,
              motivo_rechazo:
                c.estado === 'PROPUESTA_ENVIADA'
                  ? 'Plazo límite de 24 horas para responder la contraoferta expirado sin confirmación.'
                  : 'Plazo límite de 24 horas del propietario expirado sin confirmación.',
              fecha_actualizacion: now.toISOString(),
            };
          }
          return c;
        });
        return hasExpired ? next : prev;
      });

      if (hasExpired && expiredCitaIds.length > 0) {
        // Liberar fichas bloqueadas por citas caducadas
        setFichas((prevFichas) =>
          prevFichas.map((f) => {
            if (f.cita_id && expiredCitaIds.includes(f.cita_id)) {
              return {
                ...f,
                estado: (f.estado === 'BLOQUEADA' ? 'BLOQUEADA' : 'DISPONIBLE') as FichaEstado,
                cita_id: undefined,
                cliente_nombre: undefined,
                servicio_nombre: undefined,
              };
            }
            return f;
          })
        );
      }
    };

    checkExpirations();
    const interval = setInterval(checkExpirations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Verificación periódica y purga estricta de 72 horas para nuevos salones sin pago confirmado
  useEffect(() => {
    const check72HourPurge = () => {
      const now = Date.now();
      setUsers((prevUsers) => {
        const purgedUserIds: string[] = [];
        const purgedSalonIds: string[] = [];

        prevUsers.forEach((u) => {
          if (u.rol === 'propietario' && u.expiraEn) {
            const expTime = new Date(u.expiraEn).getTime();
            if (now > expTime) {
              purgedUserIds.push(u.id);
              if (u.salonId) purgedSalonIds.push(u.salonId);
            }
          }
        });

        if (purgedUserIds.length === 0) return prevUsers;

        setSalons((prevSalons) =>
          prevSalons.filter((s) => {
            if (purgedSalonIds.includes(s.id)) {
              return s.estado === 'activo' || s.ordenPago?.estado === 'aprobado';
            }
            return true;
          })
        );
        setAllServices((prev) => prev.filter((srv) => !purgedSalonIds.includes(srv.salonId)));
        setSuscripciones((prev) => prev.filter((sub) => !purgedSalonIds.includes(sub.salon_id)));
        setPagos((prev) => prev.filter((p) => !purgedSalonIds.includes(p.salon_id)));

        setCurrentUser((current) => {
          if (current && purgedUserIds.includes(current.id)) {
            sessionStorage.removeItem('tucita_current_user');
            setCurrentView('login');
            return null;
          }
          return current;
        });

        return prevUsers.filter((u) => !purgedUserIds.includes(u.id));
      });
    };

    const interval = setInterval(check72HourPurge, 30000);
    return () => clearInterval(interval);
  }, []);

  // Al crear una nueva cita (cliente), también se vincula y reserva la Ficha de Atención (Requisito 6)
  const handleAddCita = (newCita: Cita) => {
    setCitas((prev) => [newCita, ...prev]);

    // Vincular y cambiar estado de la ficha correspondiente a PENDIENTE si existe
    setFichas((prev) =>
      prev.map((f) => {
        const matches =
          (newCita.ficha_id && f.id === newCita.ficha_id) ||
          (f.salon_id === newCita.salon_id &&
            f.fecha === newCita.fecha &&
            f.hora_inicio === newCita.hora_inicio);
        if (matches) {
          return {
            ...f,
            estado: 'PENDIENTE' as FichaEstado,
            cita_id: newCita.id,
            cliente_nombre: newCita.cliente_nombre,
            servicio_nombre: newCita.servicio_nombre,
          };
        }
        return f;
      })
    );

    const newNotif: NotificacionInterna = {
      id: `notif-${Date.now()}`,
      salon_id: newCita.salon_id,
      cita_id: newCita.id,
      codigo_cita: newCita.codigo_cita,
      titulo: newCita.tipo_reserva === 'SIN_FICHA' ? 'Nueva solicitud de cita sin ficha' : 'Nueva solicitud de cita',
      mensaje: `${newCita.cliente_nombre} solicitó ${newCita.servicio_nombre} para el ${formatYYYYMMDDtoDDMMYYYY(newCita.fecha)} (${newCita.hora_inicio} - ${newCita.hora_fin}). Plazo de respuesta: 24 horas.`,
      leida: false,
      fecha: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Handler para transiciones de estado de citas por el propietario (Requisitos 6, 7, 9, 10, 13, 14 y 15)
  const handleUpdateCitaStatus = (
    citaId: string,
    nuevoEstado: CitaEstado,
    observacion?: string,
    motivoRechazo?: string
  ) => {
    const targetCita = citas.find((c) => c.id === citaId);
    if (!targetCita) return;

    const nowIso = new Date().toISOString();

    // Actualizar la cita
    setCitas((prev) =>
      prev.map((c) => {
        if (c.id === citaId) {
          const updated: Cita = {
            ...c,
            estado: nuevoEstado,
            fecha_actualizacion: nowIso,
          };
          if (nuevoEstado === 'CONFIRMADA') {
            updated.fecha_confirmacion = nowIso;
          } else if (nuevoEstado === 'RECHAZADA') {
            updated.fecha_rechazo = nowIso;
            updated.motivo_rechazo = motivoRechazo;
          } else if (nuevoEstado === 'CANCELADA') {
            updated.fecha_cancelacion = nowIso;
          } else if (nuevoEstado === 'CADUCADA') {
            updated.motivo_rechazo = motivoRechazo || 'Plazo límite de 24 horas expirado sin confirmación.';
          }
          return updated;
        }
        return c;
      })
    );

    // Sincronizar estado de la Ficha de Atención asociada
    setFichas((prev) =>
      prev.map((f) => {
        const isAssociated =
          (targetCita.ficha_id && f.id === targetCita.ficha_id) ||
          f.cita_id === citaId ||
          (f.salon_id === targetCita.salon_id &&
            f.fecha === targetCita.fecha &&
            f.hora_inicio === targetCita.hora_inicio);

        if (!isAssociated) return f;

        if (nuevoEstado === 'CONFIRMADA') {
          return {
            ...f,
            estado: 'CONFIRMADA' as FichaEstado,
            cita_id: targetCita.id,
            cliente_nombre: targetCita.cliente_nombre,
            servicio_nombre: targetCita.servicio_nombre,
          };
        } else if (nuevoEstado === 'RECHAZADA' || nuevoEstado === 'CADUCADA') {
          return {
            ...f,
            estado: 'DISPONIBLE' as FichaEstado,
            cita_id: undefined,
            cliente_nombre: undefined,
            servicio_nombre: undefined,
          };
        } else if (nuevoEstado === 'CANCELADA') {
          return {
            ...f,
            estado: (f.estado === 'BLOQUEADA' ? 'BLOQUEADA' : 'DISPONIBLE') as FichaEstado,
            cita_id: undefined,
            cliente_nombre: undefined,
            servicio_nombre: undefined,
          };
        }
        return f;
      })
    );

    // Registrar en HISTORIAL_CITAS (Requisito 15)
    const newHistorialItem: HistorialCita = {
      id: `hist-${Date.now()}`,
      cita_id: targetCita.id,
      codigo_cita: targetCita.codigo_cita,
      salon_id: targetCita.salon_id,
      estado_anterior: targetCita.estado,
      estado_nuevo: nuevoEstado,
      usuario_id: currentUser?.id || 'usr-owner-1',
      usuario_nombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Propietario del salón',
      fecha: nowIso,
      observacion: observacion || `Estado actualizado a ${nuevoEstado}`,
    };
    setHistorial((prev) => [newHistorialItem, ...prev]);
  };

  // Envío de contraoferta por el propietario al cliente con 24 horas de plazo
  const handleSendCounterOffer = (
    citaId: string,
    propuesta: { fecha: string; hora_inicio: string; hora_fin: string; mensaje?: string }
  ) => {
    const targetCita = citas.find((c) => c.id === citaId);
    if (!targetCita) return;

    const now = new Date();
    const expirationDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const proposalData: PropuestaHorario = {
      fecha: propuesta.fecha,
      fecha_propuesta: propuesta.fecha,
      hora_inicio: propuesta.hora_inicio,
      hora_fin: propuesta.hora_fin,
      mensaje: propuesta.mensaje,
      fecha_envio: now.toISOString(),
      fecha_expiracion_propuesta: expirationDate.toISOString(),
    };

    setCitas((prev) =>
      prev.map((c) => {
        if (c.id === citaId) {
          return {
            ...c,
            estado: 'PROPUESTA_ENVIADA' as CitaEstado,
            propuesta_propietario: proposalData,
            fecha_expiracion: expirationDate.toISOString(),
            fecha_actualizacion: now.toISOString(),
          };
        }
        return c;
      })
    );

    const newHistorialItem: HistorialCita = {
      id: `hist-${Date.now()}`,
      cita_id: targetCita.id,
      codigo_cita: targetCita.codigo_cita,
      salon_id: targetCita.salon_id,
      estado_anterior: targetCita.estado,
      estado_nuevo: 'PROPUESTA_ENVIADA',
      usuario_id: currentUser?.id || 'usr-owner-1',
      usuario_nombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Propietario del salón',
      fecha: now.toISOString(),
      observacion: `Contraoferta enviada al cliente: ${formatYYYYMMDDtoDDMMYYYY(propuesta.fecha)} de ${propuesta.hora_inicio} a ${propuesta.hora_fin}. ${propuesta.mensaje ? `Mensaje: "${propuesta.mensaje}"` : ''}`,
    };
    setHistorial((prev) => [newHistorialItem, ...prev]);
  };

  // Aceptación de contraoferta por el cliente -> Cita CONFIRMADA y se crea/guarda la ficha en el sistema
  const handleAcceptCounterOffer = (citaId: string) => {
    const targetCita = citas.find((c) => c.id === citaId);
    if (!targetCita || !targetCita.propuesta_propietario) return;

    const prop = targetCita.propuesta_propietario;
    const nowIso = new Date().toISOString();

    // 1. Buscar si ya existe una ficha para ese día y horario en el salón
    const existingFicha = fichas.find(
      (f) =>
        f.salon_id === targetCita.salon_id &&
        f.fecha === prop.fecha_propuesta &&
        f.hora_inicio === prop.hora_inicio &&
        f.hora_fin === prop.hora_fin
    );

    let assignedFichaId = existingFicha ? existingFicha.id : `ficha-${targetCita.salon_id}-${Date.now()}`;

    // 2. Crear o actualizar la ficha en el sistema (Requisito: "así en el sistema se guarda la ficha")
    if (existingFicha) {
      setFichas((prev) =>
        prev.map((f) =>
          f.id === existingFicha.id
            ? {
                ...f,
                estado: 'CONFIRMADA' as FichaEstado,
                cita_id: targetCita.id,
                cliente_nombre: targetCita.cliente_nombre,
                servicio_nombre: targetCita.servicio_nombre,
              }
            : f
        )
      );
    } else {
      const newFicha: FichaAtencion = {
        id: assignedFichaId,
        salon_id: targetCita.salon_id,
        fecha: prop.fecha_propuesta,
        hora_inicio: prop.hora_inicio,
        hora_fin: prop.hora_fin,
        duracion: targetCita.duracion || targetCita.duracion_servicio || 60,
        estado: 'CONFIRMADA',
        cita_id: targetCita.id,
        cliente_nombre: targetCita.cliente_nombre,
        servicio_nombre: targetCita.servicio_nombre,
        tipo_creacion: 'MANUAL',
        fecha_creacion: nowIso,
      };
      setFichas((prev) => [newFicha, ...prev]);
    }

    // 3. Confirmar la cita con los datos de la contraoferta
    setCitas((prev) =>
      prev.map((c) => {
        if (c.id === citaId) {
          return {
            ...c,
            fecha: prop.fecha_propuesta,
            hora_inicio: prop.hora_inicio,
            hora_fin: prop.hora_fin,
            ficha_id: assignedFichaId,
            estado: 'CONFIRMADA' as CitaEstado,
            fecha_confirmacion: nowIso,
            fecha_actualizacion: nowIso,
          };
        }
        return c;
      })
    );

    // 4. Registrar en historial
    const newHistorialItem: HistorialCita = {
      id: `hist-${Date.now()}`,
      cita_id: targetCita.id,
      codigo_cita: targetCita.codigo_cita,
      salon_id: targetCita.salon_id,
      estado_anterior: targetCita.estado,
      estado_nuevo: 'CONFIRMADA',
      usuario_id: 'cliente',
      usuario_nombre: targetCita.cliente_nombre,
      fecha: nowIso,
      observacion: `El cliente aceptó la contraoferta de horario (${formatYYYYMMDDtoDDMMYYYY(prop.fecha_propuesta)} ${prop.hora_inicio}–${prop.hora_fin}). Cita y ficha confirmadas en el sistema.`,
    };
    setHistorial((prev) => [newHistorialItem, ...prev]);

    // 5. Notificar al propietario
    const newNotif: NotificacionInterna = {
      id: `notif-${Date.now()}`,
      salon_id: targetCita.salon_id,
      cita_id: targetCita.id,
      codigo_cita: targetCita.codigo_cita,
      titulo: 'Contraoferta aceptada por el cliente',
      mensaje: `¡Excelente noticia! ${targetCita.cliente_nombre} aceptó tu contraoferta para el ${formatYYYYMMDDtoDDMMYYYY(prop.fecha_propuesta)} de ${prop.hora_inicio} a ${prop.hora_fin}. La cita y su ficha quedaron confirmadas en tu agenda.`,
      leida: false,
      fecha: nowIso,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Rechazo de contraoferta por el cliente -> la solicitud se anula (CANCELADA) y no se genera ficha
  const handleRejectCounterOffer = (citaId: string, motivo?: string) => {
    const targetCita = citas.find((c) => c.id === citaId);
    if (!targetCita) return;
    const nowIso = new Date().toISOString();

    setCitas((prev) =>
      prev.map((c) => {
        if (c.id === citaId) {
          return {
            ...c,
            estado: 'CANCELADA' as CitaEstado,
            motivo_rechazo: motivo || 'El cliente rechazó la contraoferta de horario.',
            fecha_cancelacion: nowIso,
            fecha_actualizacion: nowIso,
          };
        }
        return c;
      })
    );

    // Liberar cualquier ficha que hubiese quedado asociada
    setFichas((prev) =>
      prev.map((f) => {
        if (f.cita_id === citaId || (targetCita.ficha_id && f.id === targetCita.ficha_id)) {
          return {
            ...f,
            estado: (f.estado === 'BLOQUEADA' ? 'BLOQUEADA' : 'DISPONIBLE') as FichaEstado,
            cita_id: undefined,
            cliente_nombre: undefined,
            servicio_nombre: undefined,
          };
        }
        return f;
      })
    );

    const newHistorialItem: HistorialCita = {
      id: `hist-${Date.now()}`,
      cita_id: targetCita.id,
      codigo_cita: targetCita.codigo_cita,
      salon_id: targetCita.salon_id,
      estado_anterior: targetCita.estado,
      estado_nuevo: 'CANCELADA',
      usuario_id: 'cliente',
      usuario_nombre: targetCita.cliente_nombre,
      fecha: nowIso,
      observacion: `El cliente no aceptó la contraoferta (${motivo || 'Rechazada por el cliente'}). Solicitud anulada.`,
    };
    setHistorial((prev) => [newHistorialItem, ...prev]);

    const newNotif: NotificacionInterna = {
      id: `notif-${Date.now()}`,
      salon_id: targetCita.salon_id,
      cita_id: targetCita.id,
      codigo_cita: targetCita.codigo_cita,
      titulo: 'Contraoferta rechazada',
      mensaje: `${targetCita.cliente_nombre} no aceptó la contraoferta propuesta para la solicitud #${targetCita.codigo_cita}. La solicitud ha sido anulada.`,
      leida: false,
      fecha: nowIso,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleOpenTrackingModal = (code?: string) => {
    setTrackingCode(code || '');
    setIsTrackingModalOpen(true);
  };

  // Gestión de Fichas de Atención del Salón (Requisitos 1, 2, 3, 6, 7 y 11)
  const handleCreateFicha = (
    fichaData: Omit<FichaAtencion, 'id' | 'fecha_creacion'>
  ): { success: boolean; error?: string } => {
    const currentSchedule = salonSchedules[fichaData.salon_id] || createDefaultSalonSchedule(fichaData.salon_id);
    const validation = validateFicha({
      salonId: fichaData.salon_id,
      fecha: fichaData.fecha,
      horaInicio: fichaData.hora_inicio,
      horaFin: fichaData.hora_fin,
      config: currentSchedule,
      existingFichas: fichas,
    });
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const newFicha: FichaAtencion = {
      ...fichaData,
      duracion: validation.duracion,
      id: `ficha-${fichaData.salon_id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fecha_creacion: new Date().toISOString(),
    };
    setFichas((prev) => [newFicha, ...prev]);
    return { success: true };
  };

  // Creación múltiple y atómica de Fichas de Atención (Requisito 8: Guardado en lote)
  const handleCreateMultipleFichas = (
    fichasList: Array<Omit<FichaAtencion, 'id' | 'fecha_creacion'>>
  ): { success: boolean; createdCount: number; errors?: string[] } => {
    if (!fichasList || fichasList.length === 0) {
      return { success: false, createdCount: 0, errors: ['No hay fichas para crear.'] };
    }

    const salonId = fichasList[0].salon_id;
    const currentSchedule = salonSchedules[salonId] || createDefaultSalonSchedule(salonId);

    const newFichasToInsert: FichaAtencion[] = [];
    const currentExisting = [...fichas];
    const errors: string[] = [];
    const nowBase = Date.now();

    for (let i = 0; i < fichasList.length; i++) {
      const item = fichasList[i];
      const validation = validateFicha({
        salonId: item.salon_id,
        fecha: item.fecha,
        horaInicio: item.hora_inicio,
        horaFin: item.hora_fin,
        config: currentSchedule,
        existingFichas: currentExisting,
      });

      if (!validation.valid) {
        errors.push(`Ficha #${i + 1} (${item.hora_inicio}–${item.hora_fin}): ${validation.error}`);
        continue;
      }

      const newFicha: FichaAtencion = {
        ...item,
        duracion: validation.duracion,
        id: `ficha-${item.salon_id}-${nowBase}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        fecha_creacion: new Date(nowBase + i * 10).toISOString(),
      };

      newFichasToInsert.push(newFicha);
      currentExisting.push(newFicha);
    }

    if (newFichasToInsert.length === 0) {
      return {
        success: false,
        createdCount: 0,
        errors: errors.length > 0 ? errors : ['No se pudo validar ninguna ficha.'],
      };
    }

    setFichas((prev) => [...newFichasToInsert, ...prev]);

    return {
      success: true,
      createdCount: newFichasToInsert.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  };

  const handleUpdateFicha = (
    ficha: FichaAtencion
  ): { success: boolean; error?: string } => {
    const target = fichas.find((f) => f.id === ficha.id);
    if (target && (target.cita_id || target.estado === 'CONFIRMADA' || target.estado === 'PENDIENTE')) {
      if (
        target.hora_inicio !== ficha.hora_inicio ||
        target.hora_fin !== ficha.hora_fin ||
        target.fecha !== ficha.fecha
      ) {
        return {
          success: false,
          error: 'Esta ficha tiene una solicitud o cita asociada. Gestiona primero la cita antes de modificar el horario.',
        };
      }
    }
    const currentSchedule = salonSchedules[ficha.salon_id] || createDefaultSalonSchedule(ficha.salon_id);
    const validation = validateFicha({
      salonId: ficha.salon_id,
      fecha: ficha.fecha,
      horaInicio: ficha.hora_inicio,
      horaFin: ficha.hora_fin,
      config: currentSchedule,
      existingFichas: fichas,
      ignoreFichaId: ficha.id,
    });
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    setFichas((prev) =>
      prev.map((f) => (f.id === ficha.id ? { ...ficha, duracion: validation.duracion } : f))
    );
    return { success: true };
  };

  const handleToggleBlockFicha = (fichaId: string) => {
    setFichas((prev) =>
      prev.map((f) => {
        if (f.id === fichaId) {
          if (f.estado === 'CONFIRMADA' || f.estado === 'PENDIENTE') return f;
          return {
            ...f,
            estado: (f.estado === 'BLOQUEADA' ? 'DISPONIBLE' : 'BLOQUEADA') as FichaEstado,
          };
        }
        return f;
      })
    );
  };

  const handleDeleteFicha = (fichaId: string): { success: boolean; error?: string } => {
    const target = fichas.find((f) => f.id === fichaId);
    if (!target) return { success: false, error: 'Ficha no encontrada' };

    // Validar si tiene una solicitud o cita activa (pendiente o confirmada)
    const citaAsociada = target.cita_id ? citas.find((c) => c.id === target.cita_id) : null;
    const tieneCitaActiva =
      target.estado === 'CONFIRMADA' ||
      target.estado === 'PENDIENTE' ||
      (citaAsociada && (citaAsociada.estado === 'PENDIENTE' || citaAsociada.estado === 'CONFIRMADA'));

    if (tieneCitaActiva) {
      return {
        success: false,
        error: 'Esta ficha tiene una solicitud o cita activa asociada. Gestiona primero la cita antes de eliminarla.',
      };
    }
    setFichas((prev) => prev.filter((f) => f.id !== fichaId));
    return { success: true };
  };

  const handleMarkNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, leida: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  // =========================================================================
  // SISTEMA DE SUSCRIPCIONES Y PAGOS QR (ETAPA 9)
  // =========================================================================

  // 1. Propietario registra un pago con comprobante (Requisitos 8, 9, 10, 11)
  const handleRegistrarPago = (nuevoPago: Omit<PagoSuscripcion, 'id' | 'estado'>) => {
    const newId = `pago-${Date.now()}`;
    const pagoCreado: PagoSuscripcion = {
      ...nuevoPago,
      id: newId,
      estado: 'PENDIENTE',
    };
    setPagos((prev) => [pagoCreado, ...prev]);

    // Cambiar estado a 'PENDIENTE DE VALIDACIÓN' (Requisito 11)
    setSuscripciones((prev) => {
      const exists = prev.some((s) => s.salon_id === nuevoPago.salon_id);
      if (exists) {
        return prev.map((s) =>
          s.salon_id === nuevoPago.salon_id
            ? {
                ...s,
                tipo_plan: nuevoPago.tipo_plan,
                monto: nuevoPago.monto,
                estado: 'PENDIENTE DE VALIDACIÓN',
                fecha_actualizacion: new Date().toISOString(),
              }
            : s
        );
      } else {
        const now = new Date();
        const nuevaSub: Suscripcion = {
          id: `sub-${nuevoPago.salon_id}-${Date.now()}`,
          salon_id: nuevoPago.salon_id,
          propietario_id: nuevoPago.propietario_id,
          tipo_plan: nuevoPago.tipo_plan,
          monto: nuevoPago.monto,
          fecha_inicio: now.toISOString(),
          fecha_vencimiento: calculateExpirationDate(now, nuevoPago.tipo_plan).toISOString(),
          estado: 'PENDIENTE DE VALIDACIÓN',
          fecha_creacion: now.toISOString(),
          fecha_actualizacion: now.toISOString(),
        };
        return [nuevaSub, ...prev];
      }
    });

    // Notificación interna
    const newNotif: NotificacionInterna = {
      id: `notif-${Date.now()}`,
      salon_id: nuevoPago.salon_id,
      cita_id: '',
      codigo_cita: nuevoPago.referencia,
      titulo: 'Comprobante de pago enviado',
      mensaje: `Tu comprobante por Bs ${nuevoPago.monto} (${nuevoPago.tipo_plan}) fue recibido y está pendiente de validación por el administrador.`,
      leida: false,
      fecha: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 2. Administrador aprueba el pago (Requisitos 14, 16, 17, 18, 21, 22)
  const handleApprovePayment = (pagoId: string) => {
    const pago = pagos.find((p) => p.id === pagoId);
    if (!pago) return;

    const now = new Date();
    const nowIso = now.toISOString();

    // Actualizar pago a APROBADO: aprobar el pago actual y cualquier otro registro pendiente del mismo salón
    setPagos((prev) =>
      prev.map((p) =>
        p.id === pagoId || (p.salon_id === pago.salon_id && p.estado === 'PENDIENTE')
          ? {
              ...p,
              estado: 'APROBADO',
              fecha_validacion: nowIso,
              validado_por: currentUser
                ? `${currentUser.nombre} ${currentUser.apellido} (admin)`
                : 'Administrador de TuCita',
            }
          : p
      )
    );

    // Actualizar suscripción
    setSuscripciones((prev) => {
      const existing = prev.find((s) => s.salon_id === pago.salon_id);
      if (existing) {
        const currentExp = new Date(existing.fecha_vencimiento);
        // Si está activa y no ha vencido, se extiende sumando al vencimiento previo; si venció, parte desde hoy
        const startDate = currentExp > now && existing.estado === 'ACTIVA' ? currentExp : now;
        const newExpDate = calculateExpirationDate(startDate, pago.tipo_plan);

        return prev.map((s) =>
          s.salon_id === pago.salon_id
            ? {
                ...s,
                tipo_plan: pago.tipo_plan,
                monto: pago.monto,
                estado: 'ACTIVA',
                fecha_inicio: s.estado === 'ACTIVA' && currentExp > now ? s.fecha_inicio : nowIso,
                fecha_vencimiento: newExpDate.toISOString(),
                fecha_actualizacion: nowIso,
              }
            : s
        );
      } else {
        const newExpDate = calculateExpirationDate(now, pago.tipo_plan);
        const nuevaSub: Suscripcion = {
          id: `sub-${pago.salon_id}-${Date.now()}`,
          salon_id: pago.salon_id,
          propietario_id: pago.propietario_id,
          tipo_plan: pago.tipo_plan,
          monto: pago.monto,
          fecha_inicio: nowIso,
          fecha_vencimiento: newExpDate.toISOString(),
          estado: 'ACTIVA',
          fecha_creacion: nowIso,
          fecha_actualizacion: nowIso,
        };
        return [nuevaSub, ...prev];
      }
    });

    // Reactivar el salón y marcarlo público (disponible para todos los clientes en Aiquile)
    setSalons((prev) =>
      prev.map((s) =>
        s.id === pago.salon_id
          ? {
              ...s,
              estado: 'activo',
              isAvailable: true,
              cuentaHabilitadaNotificacion: true,
              ordenPago: s.ordenPago
                ? {
                    ...s.ordenPago,
                    estado: 'aprobado',
                    fechaAprobacion: nowIso,
                  }
                : undefined,
            }
          : s
      )
    );

    // Actualizar usuario propietario: desbloquear las 72 horas y activar aviso
    setUsers((prev) =>
      prev.map((u) =>
        u.id === pago.propietario_id || u.salonId === pago.salon_id
          ? { ...u, expiraEn: undefined, cuentaHabilitadaNotificacion: true }
          : u
      )
    );

    if (currentUser && (currentUser.salonId === pago.salon_id || currentUser.id === pago.propietario_id)) {
      setCurrentUser((prev) =>
        prev
          ? { ...prev, expiraEn: undefined, cuentaHabilitadaNotificacion: true }
          : null
      );
    }

    // Notificar al propietario con el mensaje requerido
    const notif: NotificacionInterna = {
      id: `notif-${Date.now()}`,
      salon_id: pago.salon_id,
      cita_id: '',
      codigo_cita: pago.referencia,
      titulo: '¡Cuenta Habilitada y Salón Publicado!',
      mensaje: 'Se habilitó su cuenta de salón de belleza, ya están disponibles todas sus funciones.',
      leida: false,
      fecha: nowIso,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // 3. Administrador rechaza el pago con motivo (Requisito 15)
  const handleRejectPayment = (pagoId: string, motivo: string) => {
    const pago = pagos.find((p) => p.id === pagoId);
    if (!pago) return;

    const nowIso = new Date().toISOString();

    setPagos((prev) =>
      prev.map((p) =>
        p.id === pagoId
          ? {
              ...p,
              estado: 'RECHAZADO',
              motivo_rechazo: motivo,
              fecha_validacion: nowIso,
              validado_por: currentUser
                ? `${currentUser.nombre} ${currentUser.apellido} (admin)`
                : 'Administrador de TuCita',
            }
          : p
      )
    );

    setSuscripciones((prev) =>
      prev.map((s) => {
        if (s.salon_id === pago.salon_id && s.estado === 'PENDIENTE DE VALIDACIÓN') {
          const remaining = calculateRemainingDays(s.fecha_vencimiento);
          const nuevoEstado: SuscripcionEstado = remaining <= 0 ? 'SUSPENDIDA' : 'PENDIENTE DE PAGO';
          return {
            ...s,
            estado: nuevoEstado,
            fecha_actualizacion: nowIso,
          };
        }
        return s;
      })
    );

    const notif: NotificacionInterna = {
      id: `notif-${Date.now()}`,
      salon_id: pago.salon_id,
      cita_id: '',
      codigo_cita: pago.referencia,
      titulo: 'Comprobante de pago rechazado',
      mensaje: `Tu comprobante de pago fue rechazado. Motivo: "${motivo}". Por favor sube un comprobante válido desde la sección Suscripción.`,
      leida: false,
      fecha: nowIso,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // 4. Guardar configuración de QR y bancos (Requisito 7 & 28)
  const handleSaveConfigPago = (updatedConfig: ConfiguracionPago) => {
    setConfigPago(updatedConfig);
  };

  // 5. Guardar configuración general de la plataforma (Etapa 10)
  const handleSavePlatformConfig = (updatedPlatformConfig: PlatformConfig) => {
    setPlatformConfig(updatedPlatformConfig);
  };

  // 6. Actualizar contraseña de usuario con hashing SHA-256 seguro (Etapa 10)
  const handleUpdateUserPassword = (userId: string, newPlainTextOrHashed: string) => {
    const hashedPassword = newPlainTextOrHashed.startsWith('sha256$')
      ? newPlainTextOrHashed
      : hashPasswordSync(newPlainTextOrHashed);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, contrasena: hashedPassword } : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, contrasena: hashedPassword } : null));
    }
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Login handler with role based redirection matching specification (con verificación criptográfica)
  const handleLogin = (userOrEmail: string, pass: string): boolean => {
    const target = userOrEmail.toLowerCase().trim();
    const foundUser = users.find(
      (u) =>
        (u.usuario.toLowerCase() === target || u.correo.toLowerCase() === target) &&
        verifyPasswordSync(pass, u.contrasena)
    );

    if (!foundUser || foundUser.estado !== 'activo') {
      return false;
    }

    setCurrentUser(foundUser);

    if (foundUser.rol === 'admin') {
      setCurrentView('admin');
    } else if (foundUser.rol === 'propietario') {
      setCurrentView('propietario');
    } else if (foundUser.rol === 'cliente') {
      setCurrentView('cliente');
    } else {
      setCurrentView('home');
    }

    return true;
  };

  // Client registration handler: creates account, logs in and opens ClientDashboard
  const handleRegisterClient = (clientData: {
    nombre: string;
    apellido: string;
    telefono: string;
    whatsapp: string;
    correo: string;
    usuario: string;
    contrasena: string;
  }): { success: boolean; error?: string } => {
    const newClient: User = {
      id: `user-cliente-${Date.now()}`,
      nombre: clientData.nombre,
      apellido: clientData.apellido,
      correo: clientData.correo,
      usuario: clientData.usuario.toLowerCase().trim(),
      contrasena: hashPasswordSync(clientData.contrasena),
      rol: 'cliente',
      estado: 'activo',
      telefono: clientData.telefono,
      fecha_creacion: new Date().toISOString(),
    };

    setUsers((prev) => [newClient, ...prev]);
    setCurrentUser(newClient);
    setCurrentView('cliente');
    return { success: true };
  };

  // Salon Owner Registration handler: creates owner account + inactive salon + 72h invoice
  const handleRegisterSalonOwner = (
    ownerData: {
      nombre: string;
      apellido: string;
      telefono: string;
      whatsapp: string;
      correo: string;
      usuario: string;
      contrasena: string;
    },
    salonData: {
      name: string;
      tagline: string;
      address: string;
      phone: string;
      whatsapp: string;
    },
    plan: TipoPlan = 'MENSUAL'
  ): { success: boolean; error?: string } => {
    const now = new Date();
    const nowIso = now.toISOString();
    const exp72h = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
    const salonId = `salon-${Date.now().toString().slice(-6)}`;
    const ownerId = `user-prop-${Date.now().toString().slice(-6)}`;
    const facId = `FAC-2026-${Date.now().toString().slice(-5)}`;
    const montoPlan = plan === 'ANUAL' ? (configPago.precio_anual || 1100) : (configPago.precio_mensual || 100);

    // 1. Factura / Orden de Pago con plazo de 72 horas
    const ordenPago: SalonPaymentOrder = {
      id: facId,
      salonId,
      salonNombre: salonData.name,
      propietarioId: ownerId,
      propietarioNombre: `${ownerData.nombre} ${ownerData.apellido}`,
      propietarioTelefono: ownerData.telefono,
      propietarioEmail: ownerData.correo,
      montoBs: montoPlan,
      tipoPlan: plan,
      concepto: `Habilitación de Salón y Suscripción TuCita Aiquile - Plan ${plan}`,
      fechaCreacion: nowIso,
      fechaExpiracion: exp72h,
      estado: 'pendiente',
    };

    // 2. Salón en modo preparación (estado: 'inactivo', isAvailable: false)
    const newSalon: Salon = {
      id: salonId,
      propietarioId: ownerId,
      name: salonData.name,
      tagline: salonData.tagline || 'Salón de Belleza Profesional',
      shortDescription: salonData.tagline || 'Especialistas en belleza y cuidado personal en Aiquile.',
      description: `${salonData.name} es un nuevo salón de belleza en la comunidad de Aiquile. Ofrece atención profesional en cortes, peinados y tratamientos.`,
      neonSubtitle: salonData.tagline?.toUpperCase() || 'BELLEZA Y ESTILO',
      logoText: salonData.name.slice(0, 2).toUpperCase(),
      logoBgColor: '#7e22ce',
      rating: 5.0,
      reviewsCount: 1,
      zone: 'Zona Central',
      city: 'Aiquile',
      municipio: 'Aiquile',
      departamento: 'Cochabamba',
      address: salonData.address || 'Calle Sucre, Aiquile',
      phone: salonData.phone || ownerData.telefono,
      whatsapp: salonData.whatsapp || ownerData.whatsapp,
      email: ownerData.correo,
      schedule: 'Lun - Sáb: 08:30 - 19:30',
      estado: 'inactivo', // Modo preparación: no aparece en catálogo público de clientes
      isAvailable: false,
      coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
      heroImage: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
      serviceThumbnails: [],
      gallery: [],
      services: [],
      fecha_creacion: nowIso,
      ordenPago,
      cuentaHabilitadaNotificacion: false,
    };

    // 3. Propietario con expiraEn de 72 horas
    const newOwner: User = {
      id: ownerId,
      nombre: ownerData.nombre,
      apellido: ownerData.apellido,
      correo: ownerData.correo,
      usuario: ownerData.usuario.toLowerCase().trim(),
      contrasena: hashPasswordSync(ownerData.contrasena),
      rol: 'propietario',
      estado: 'activo',
      salonId,
      telefono: ownerData.telefono,
      fecha_creacion: nowIso,
      expiraEn: exp72h,
      cuentaHabilitadaNotificacion: false,
    };

    // 4. Servicios iniciales configurables
    const initialServices: ServiceItem[] = [
      {
        id: `srv-${salonId}-1`,
        salonId,
        name: 'Corte de Cabello y Estilizado',
        description: 'Corte personalizado con lavado y secado express.',
        image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
        price: 35,
        durationMinutes: 45,
        status: 'activo',
        category: 'Cabello',
        createdAt: nowIso,
      },
      {
        id: `srv-${salonId}-2`,
        salonId,
        name: 'Manicura Completa y Esmaltado',
        description: 'Limpieza de cutículas, limado, exfoliación y esmalte tradicional.',
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80',
        price: 30,
        durationMinutes: 40,
        status: 'activo',
        category: 'Uñas',
        createdAt: nowIso,
      },
    ];

    const defaultSchedule = createDefaultSalonSchedule(salonId);

    const nuevaSub: Suscripcion = {
      id: `sub-${salonId}`,
      salon_id: salonId,
      propietario_id: ownerId,
      tipo_plan: plan,
      monto: montoPlan,
      fecha_inicio: nowIso,
      fecha_vencimiento: exp72h,
      estado: 'PENDIENTE DE PAGO',
      fecha_creacion: nowIso,
      fecha_actualizacion: nowIso,
    };

    const initialPago: PagoSuscripcion = {
      id: `pago-${Date.now()}`,
      suscripcion_id: `sub-${salonId}`,
      salon_id: salonId,
      propietario_id: ownerId,
      tipo_plan: plan,
      monto: montoPlan,
      fecha_pago: nowIso,
      referencia: facId,
      comprobante: 'PENDIENTE_COMPROBANTE',
      observacion: `Orden de pago emitida por registro de nuevo local "${salonData.name}" (Plan ${plan} - Bs ${montoPlan}). Plazo: 72 horas.`,
      estado: 'PENDIENTE',
    };

    // Notificación para el Admin
    const notifAdmin: NotificacionInterna = {
      id: `notif-reg-${Date.now()}`,
      salon_id: salonId,
      cita_id: '',
      codigo_cita: facId,
      titulo: 'Nuevo Salón Registrado (Pendiente de Pago)',
      mensaje: `"${salonData.name}" se registró con Plan ${plan} (Bs ${montoPlan}). Factura: ${facId}. Plazo de pago: 72 horas.`,
      leida: false,
      fecha: nowIso,
    };

    setUsers((prev) => [newOwner, ...prev]);
    setSalons((prev) => [newSalon, ...prev]);
    setAllServices((prev) => [...initialServices, ...prev]);
    setSalonSchedules((prev) => ({ ...prev, [salonId]: defaultSchedule }));
    setSuscripciones((prev) => [nuevaSub, ...prev]);
    setPagos((prev) => [initialPago, ...prev]);
    setNotifications((prev) => [notifAdmin, ...prev]);

    // Persistir directamente a Supabase de forma secuencial y atómica
    StorageService.registerNewSalonOwnerDirectly({
      owner: newOwner,
      salon: newSalon,
      services: initialServices,
      schedule: defaultSchedule,
      sub: nuevaSub,
      pago: initialPago,
      notif: notifAdmin,
    });

    // Iniciar sesión y llevar a su panel
    setCurrentUser(newOwner);
    setCurrentView('propietario');
    return { success: true };
  };

  // Subir comprobante desde el panel del propietario
  const handleUploadVoucher = (fileDataUrl: string, referenceCode: string) => {
    if (!currentUser || !currentUser.salonId) return;
    const nowIso = new Date().toISOString();
    const salonId = currentUser.salonId;
    const userSalon = salons.find((s) => s.id === salonId);
    if (!userSalon) return;

    setSalons((prev) =>
      prev.map((s) =>
        s.id === salonId
          ? {
              ...s,
              ordenPago: s.ordenPago
                ? {
                    ...s.ordenPago,
                    estado: 'comprobante_subido',
                    comprobanteUrl: fileDataUrl,
                    codigoTransaccion: referenceCode,
                    fechaSubidaComprobante: nowIso,
                  }
                : undefined,
            }
          : s
      )
    );

    const sub = suscripciones.find((subItem) => subItem.salon_id === salonId);
    const monto = userSalon.ordenPago?.montoBs || configPago.precio_mensual || 100;
    const tipoPlan = userSalon.ordenPago?.tipoPlan || 'MENSUAL';

    const nuevoPago: PagoSuscripcion = {
      id: `pago-${Date.now()}`,
      suscripcion_id: sub?.id || `sub-${salonId}`,
      salon_id: salonId,
      propietario_id: currentUser.id,
      tipo_plan: tipoPlan,
      monto,
      fecha_pago: nowIso,
      referencia: referenceCode || userSalon.ordenPago?.id || `REF-${Date.now().toString().slice(-6)}`,
      comprobante: fileDataUrl,
      observacion: `Comprobante de habilitación de salón "${userSalon.name}" (${tipoPlan})`,
      estado: 'PENDIENTE',
    };

    // Si ya existía un pago pendiente para este salón (creado en el registro), se actualiza con la foto real
    setPagos((prev) => {
      const existingPendingIndex = prev.findIndex(
        (p) => p.salon_id === salonId && p.estado === 'PENDIENTE'
      );
      if (existingPendingIndex >= 0) {
        return prev.map((p, idx) =>
          idx === existingPendingIndex
            ? {
                ...p,
                comprobante: fileDataUrl,
                referencia: referenceCode || p.referencia || `REF-${Date.now().toString().slice(-6)}`,
                fecha_pago: nowIso,
                observacion: `Comprobante de habilitación de salón "${userSalon.name}" (${tipoPlan})`,
              }
            : p
        );
      }
      return [nuevoPago, ...prev];
    });

    setSuscripciones((prev) =>
      prev.map((s) =>
        s.salon_id === salonId
          ? { ...s, estado: 'PENDIENTE DE VALIDACIÓN', fecha_actualizacion: nowIso }
          : s
      )
    );

    const notifAdmin: NotificacionInterna = {
      id: `notif-comprobante-${Date.now()}`,
      salon_id: salonId,
      cita_id: '',
      codigo_cita: referenceCode,
      titulo: 'Comprobante de Salón Recibido',
      mensaje: `"${userSalon.name}" envió comprobante de Bs ${monto} (${referenceCode}) para habilitar su página. Revisa y aprueba el pago.`,
      leida: false,
      fecha: nowIso,
    };
    setNotifications((prev) => [notifAdmin, ...prev]);
  };

  // Descartar aviso de salón habilitado
  const handleDismissActivationNotice = () => {
    if (!currentUser) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, cuentaHabilitadaNotificacion: false } : u))
    );
    if (currentUser.salonId) {
      setSalons((prev) =>
        prev.map((s) => (s.id === currentUser.salonId ? { ...s, cuentaHabilitadaNotificacion: false } : s))
      );
    }
    setCurrentUser((prev) => (prev ? { ...prev, cuentaHabilitadaNotificacion: false } : null));
  };

  // Logout handler matching specification
  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('tucita_current_user');
    setCurrentView('login');
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenSalon = (salon: Salon, serviceId?: string) => {
    setSelectedSalon(salon);
    setSelectedServiceIdForSalon(serviceId || null);
    setCurrentView('salon-detail');
    setIsFavoritesOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreSalons = () => {
    setCurrentView('salones');
  };

  // Update services handler
  const handleUpdateServices = (salonId: string, updatedServices: ServiceItem[]) => {
    setAllServices((prev) => [
      ...prev.filter((s) => s.salonId !== salonId),
      ...updatedServices,
    ]);
  };

  // Update schedule handler (Etapa 5)
  const handleUpdateSchedule = (newConfig: SalonScheduleConfig) => {
    setSalonSchedules((prev) => ({
      ...prev,
      [newConfig.salonId]: newConfig,
    }));
  };

  // Admin: Update Salon status (Activo, Inactivo, Suspendido)
  const handleUpdateSalonStatus = (salonId: string, status: SalonStatus) => {
    setSalons((prev) =>
      prev.map((s) =>
        s.id === salonId
          ? {
              ...s,
              estado: status,
              isAvailable: status === 'activo',
            }
          : s
      )
    );
  };

  // Admin: Toggle user active/inactive
  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, estado: u.estado === 'activo' ? 'inactivo' : 'activo' } : u
      )
    );
  };

  // Admin: Register new salon & owner (con contraseñas protegidas mediante hash SHA-256)
  const handleRegisterSalon = (newSalon: Salon, newOwner: User) => {
    const ownerToSave: User = {
      ...newOwner,
      contrasena: newOwner.contrasena.startsWith('sha256$')
        ? newOwner.contrasena
        : hashPasswordSync(newOwner.contrasena),
    };
    setSalons((prev) => [newSalon, ...prev]);
    setUsers((prev) => [ownerToSave, ...prev]);

    // Crear suscripción inicial para el nuevo salón (Etapa 9)
    const now = new Date();
    const nuevaSub: Suscripcion = {
      id: `sub-${newSalon.id}`,
      salon_id: newSalon.id,
      propietario_id: newOwner.id,
      tipo_plan: 'MENSUAL',
      monto: configPago.precio_mensual || 100,
      fecha_inicio: now.toISOString(),
      fecha_vencimiento: calculateExpirationDate(now, 'MENSUAL').toISOString(),
      estado: newSalon.estado === 'activo' ? 'ACTIVA' : 'PENDIENTE DE PAGO',
      fecha_creacion: now.toISOString(),
      fecha_actualizacion: now.toISOString(),
    };
    setSuscripciones((prev) => [nuevaSub, ...prev]);
  };

  // Admin: Create or update owner (Etapa 8 & 10 con hash criptográfico)
  const handleSaveOwner = (ownerData: Partial<User> & { salonId: string; contrasena?: string }) => {
    const hashedPass = ownerData.contrasena
      ? (ownerData.contrasena.startsWith('sha256$')
          ? ownerData.contrasena
          : hashPasswordSync(ownerData.contrasena))
      : undefined;

    if (ownerData.id) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === ownerData.id) {
            return {
              ...u,
              ...ownerData,
              contrasena: hashedPass || u.contrasena,
            };
          }
          return u;
        })
      );
    } else {
      const newOwner: User = {
        id: `user-${Date.now()}`,
        nombre: ownerData.nombre || '',
        apellido: ownerData.apellido || '',
        correo: ownerData.correo || '',
        usuario: ownerData.usuario || '',
        contrasena: hashedPass || hashPasswordSync('propietario123'),
        rol: 'propietario',
        estado: ownerData.estado || 'activo',
        salonId: ownerData.salonId,
        telefono: ownerData.telefono || '',
        fecha_creacion: new Date().toISOString(),
      };
      setUsers((prev) => [newOwner, ...prev]);
    }
  };

  // Owner & Admin: Update salon details
  const handleUpdateSalon = (updatedSalon: Salon) => {
    setSalons((prev) => prev.map((s) => (s.id === updatedSalon.id ? updatedSalon : s)));
    setSelectedSalon((prev) => (prev && prev.id === updatedSalon.id ? updatedSalon : prev));
  };

  // Public Salons: Only active salons appear in the public catalog and searches (Requisitos 8, 21 y 22)
  // Un salón con suscripción SUSPENDIDA o VENCIDA queda fuera del catálogo público
  const publicSalons = salons
    .filter((s) => {
      if (s.estado !== 'activo') return false;
      const sub = suscripciones.find((subItem) => subItem.salon_id === s.id);
      if (sub && (sub.estado === 'SUSPENDIDA' || sub.estado === 'VENCIDA')) {
        return false;
      }
      return true;
    })
    .map((s) => ({
      ...s,
      services: allServices.filter((srv) => srv.salonId === s.id),
    }));

  const favoriteSalons = publicSalons.filter((s) => favorites.includes(s.id));

  const activeSelectedSalon = selectedSalon
    ? salons.find((s) => s.id === selectedSalon.id) || selectedSalon
    : null;

  // Find owner salon for current logged in owner
  const currentOwnerSalon = currentUser?.salonId
    ? salons.find((s) => s.id === currentUser.salonId)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfaff] text-slate-800 selection:bg-purple-200 selection:text-purple-950 font-sans">
      {/* Top Navigation Bar: rendered on public views */}
      {currentView !== 'login' && currentView !== 'admin' && currentView !== 'propietario' && currentView !== 'cliente' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
            setSelectedSalon(null);
            setSelectedServiceIdForSalon(null);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q && currentView === 'salon-detail') {
              setCurrentView('salones');
            }
          }}
          favoritesCount={favorites.length}
          onOpenFavorites={() => setIsFavoritesOpen(true)}
          currentUser={currentUser}
          onOpenLogin={() => setCurrentView('login')}
          onGoToDashboard={() => {
            if (currentUser?.rol === 'admin') setCurrentView('admin');
            else if (currentUser?.rol === 'propietario') setCurrentView('propietario');
            else if (currentUser?.rol === 'cliente') setCurrentView('cliente');
          }}
          onLogout={handleLogout}
          onOpenTracking={() => handleOpenTrackingModal()}
          salons={publicSalons}
          allServices={allServices}
          onSelectSalon={(salon, serviceId) => {
            handleOpenSalon(salon, serviceId);
          }}
        />
      )}

      {/* Main Content Area based on View */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE (ETAPA 1 + integration) */}
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <HeroBanner onExploreSalons={handleExploreSalons} />

            {/* Service Categories Circular Carousel */}
            <ServiceCategories
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                const el = document.getElementById('salones');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            {/* Featured Salons Section */}
            <SalonsSection
              salons={publicSalons}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onViewSalon={handleOpenSalon}
              selectedCategory={selectedCategory}
              globalSearch={searchQuery}
            />
          </>
        )}

        {/* VIEW 2: SALONES DIRECTORY PAGE (ETAPA 2) */}
        {currentView === 'salones' && (
          <SalonsPage
            salons={publicSalons}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectSalon={handleOpenSalon}
            onNavigateHome={() => setCurrentView('home')}
          />
        )}

        {/* VIEW 3: INDIVIDUAL SALON PAGE (ETAPA 2, 3, 5 & 6) */}
        {currentView === 'salon-detail' && activeSelectedSalon && (
          <SalonDetailPage
            salon={activeSelectedSalon}
            salonServices={allServices.filter((s) => s.salonId === activeSelectedSalon.id)}
            scheduleConfig={salonSchedules[activeSelectedSalon.id]}
            appointments={citas}
            fichas={fichas}
            currentUser={currentUser}
            onUpdateServices={handleUpdateServices}
            onAddAppointment={handleAddCita}
            onBack={() => {
              setCurrentView('salones');
              setSelectedServiceIdForSalon(null);
            }}
            isFavorite={favorites.includes(activeSelectedSalon.id)}
            onToggleFavorite={handleToggleFavorite}
            onOpenTracking={(code) => handleOpenTrackingModal(code)}
            initialSelectedServiceId={selectedServiceIdForSalon || undefined}
          />
        )}

        {/* VIEW 4: LOGIN PAGE (ETAPA 4) */}
        {currentView === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onNavigateHome={() => setCurrentView('home')}
            users={users}
            onRegisterClient={handleRegisterClient}
            onRegisterSalonOwner={handleRegisterSalonOwner}
          />
        )}

        {/* VIEW 5: ADMIN DASHBOARD (ETAPA 4, 8 & 9) */}
        {currentView === 'admin' && (
          currentUser && currentUser.rol === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              salons={salons}
              users={users}
              appointments={citas}
              historial={historial}
              suscripciones={suscripciones}
              pagos={pagos}
              configPago={configPago}
              onLogout={handleLogout}
              onNavigateHome={() => setCurrentView('home')}
              onUpdateSalonStatus={handleUpdateSalonStatus}
              onToggleUserStatus={handleToggleUserStatus}
              onRegisterSalon={handleRegisterSalon}
              onUpdateSalon={handleUpdateSalon}
              onSaveOwner={handleSaveOwner}
              onViewSalonPublic={(salon) => {
                setSelectedSalon(salon);
                setCurrentView('salon-detail');
              }}
              onSaveConfigPago={handleSaveConfigPago}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              platformConfig={platformConfig}
              onSavePlatformConfig={handleSavePlatformConfig}
              onUpdateUserPassword={handleUpdateUserPassword}
            />
          ) : (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-xl max-w-md text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso no autorizado</h2>
                <p className="text-xs text-slate-600">
                  Esta sección está reservada exclusivamente para el Administrador de TuCita.
                </p>
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold"
                >
                  Ir al inicio de sesión
                </button>
              </div>
            </div>
          )
        )}

        {/* VIEW 6: PROPIETARIO DASHBOARD (ETAPA 4, 5, 6, 7 & 9) */}
        {currentView === 'propietario' && (
          currentUser && currentUser.rol === 'propietario' ? (
            <OwnerDashboard
              currentUser={currentUser}
              salon={currentOwnerSalon}
              services={allServices.filter((s) => s.salonId === currentOwnerSalon?.id)}
              scheduleConfig={currentOwnerSalon ? salonSchedules[currentOwnerSalon.id] : undefined}
              appointments={citas}
              fichas={fichas}
              historial={historial}
              notifications={notifications}
              suscripcion={currentOwnerSalon ? suscripciones.find((s) => s.salon_id === currentOwnerSalon.id) : undefined}
              pagos={pagos}
              configPago={configPago}
              platformConfig={platformConfig}
              onLogout={handleLogout}
              onNavigateHome={() => setCurrentView('home')}
              onViewSalonPublic={(salon) => {
                setSelectedSalon(salon);
                setCurrentView('salon-detail');
              }}
              onUpdateSalon={handleUpdateSalon}
              onUpdateServices={handleUpdateServices}
              onUpdateSchedule={handleUpdateSchedule}
              onCreateFicha={handleCreateFicha}
              onCreateMultipleFichas={handleCreateMultipleFichas}
              onUpdateFicha={handleUpdateFicha}
              onToggleBlockFicha={handleToggleBlockFicha}
              onDeleteFicha={handleDeleteFicha}
              onUpdateCitaStatus={handleUpdateCitaStatus}
              onSendCounterOffer={handleSendCounterOffer}
              onMarkNotificationAsRead={handleMarkNotificationAsRead}
              onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
              onRegistrarPago={handleRegistrarPago}
              onUpdateUserPassword={handleUpdateUserPassword}
              onDismissActivationNotice={handleDismissActivationNotice}
              onUploadVoucher={handleUploadVoucher}
            />
          ) : (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-xl max-w-md text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso no autorizado</h2>
                <p className="text-xs text-slate-600">
                  Debes iniciar sesión con una cuenta de propietario para acceder a este panel.
                </p>
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold"
                >
                  Ir al inicio de sesión
                </button>
              </div>
            </div>
          )
        )}

        {/* VIEW 7: CLIENT DASHBOARD */}
        {currentView === 'cliente' && (
          currentUser && currentUser.rol === 'cliente' ? (
            <ClientDashboard
              currentUser={currentUser}
              appointments={citas}
              salons={publicSalons}
              allServices={allServices}
              salonSchedules={salonSchedules}
              fichas={fichas}
              onLogout={handleLogout}
              onNavigateHome={() => setCurrentView('home')}
              onViewSalonPublic={(salon) => {
                setSelectedSalon(salon);
                setCurrentView('salon-detail');
              }}
              onAcceptCounterOffer={handleAcceptCounterOffer}
              onRejectCounterOffer={handleRejectCounterOffer}
              onAddAppointment={handleAddCita}
              onOpenTracking={(code) => handleOpenTrackingModal(code)}
              onUpdateUserPassword={handleUpdateUserPassword}
            />
          ) : (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-xl max-w-md text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso no autorizado</h2>
                <p className="text-xs text-slate-600">
                  Debes iniciar sesión con tu cuenta de cliente para acceder a este panel.
                </p>
                <button
                  onClick={() => setCurrentView('login')}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold"
                >
                  Ir al inicio de sesión
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer: shown on public views */}
      {currentView !== 'login' && currentView !== 'admin' && currentView !== 'propietario' && currentView !== 'cliente' && (
        <Footer />
      )}

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoriteSalons={favoriteSalons}
        onRemoveFavorite={handleToggleFavorite}
        onViewSalon={handleOpenSalon}
      />

      {/* User Information Notice Modal */}
      <UserNoticeModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      {/* Appointment Tracking and Counteroffer Resolution Modal */}
      <AppointmentTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingCode('');
        }}
        appointments={citas}
        salons={salons}
        initialCode={trackingCode}
        onAcceptProposal={handleAcceptCounterOffer}
        onRejectProposal={handleRejectCounterOffer}
      />
    </div>
  );
}
