-- ==============================================================================
-- TuCita Aiquile - Esquema Oficial de Base de Datos PostgreSQL para Supabase
-- Sistema Integral de Salones de Belleza, Citas, Fichas y Suscripciones QR
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: usuarios
-- Admins, Propietarios de Salones y Clientes registrados
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT,
    usuario TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'propietario', 'cliente')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    salon_id TEXT,
    telefono TEXT,
    expira_en TIMESTAMPTZ, -- Límite de 72 horas para nuevos propietarios sin pago
    cuenta_habilitada_notificacion BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABLA: salones
-- Salones de belleza de Aiquile (Públicos o en modo preparación)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.salones (
    id TEXT PRIMARY KEY DEFAULT ('salon-' || substr(md5(random()::text), 1, 8)),
    propietario_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    tagline TEXT DEFAULT 'Salón de Belleza Profesional',
    short_description TEXT DEFAULT 'Especialistas en estética y belleza en Aiquile.',
    description TEXT,
    neon_subtitle TEXT DEFAULT 'ESTILISMO PROFESIONAL',
    logo_text TEXT DEFAULT 'TC',
    logo_bg_color TEXT DEFAULT '#7e22ce',
    logo_image TEXT,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    zone TEXT DEFAULT 'Zona Central',
    city TEXT DEFAULT 'Aiquile',
    municipio TEXT DEFAULT 'Aiquile',
    departamento TEXT DEFAULT 'Cochabamba',
    address TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    schedule TEXT DEFAULT 'Lun - Sáb: 08:30 - 19:30',
    estado TEXT NOT NULL DEFAULT 'inactivo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    cover_image TEXT DEFAULT 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    banner_image TEXT DEFAULT 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
    banner_gradient TEXT,
    hero_image TEXT,
    service_thumbnails JSONB DEFAULT '[]'::jsonb,
    gallery JSONB DEFAULT '[]'::jsonb,
    additional_info JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT FALSE,
    orden_pago JSONB, -- Factura / Orden de pago de 72 horas
    cuenta_habilitada_notificacion BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Evitar restricción circular en inserción inicial:
ALTER TABLE public.usuarios 
    DROP CONSTRAINT IF EXISTS fk_usuario_salon;

-- ==============================================================================
-- 4. TABLA: servicios
-- Servicios capilares, manicura, maquillaje, barbería, etc.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.servicios (
    id TEXT PRIMARY KEY DEFAULT ('srv-' || substr(md5(random()::text), 1, 8)),
    salon_id TEXT NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    duration_minutes INT NOT NULL DEFAULT 45,
    status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
    category TEXT NOT NULL DEFAULT 'Cabello',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABLA: horarios_salon
-- Configuración de días laborables, descansos y almuerzo
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.horarios_salon (
    id TEXT PRIMARY KEY DEFAULT ('sch-' || substr(md5(random()::text), 1, 8)),
    salon_id TEXT UNIQUE NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    intervalo_minutos TEXT DEFAULT '30',
    permitir_almuerzo BOOLEAN DEFAULT FALSE,
    dias JSONB NOT NULL DEFAULT '[]'::jsonb,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABLA: fichas_atencion
-- Fichas generadas para turnos rápidos en Aiquile
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fichas_atencion (
    id TEXT PRIMARY KEY DEFAULT ('ficha-' || substr(md5(random()::text), 1, 10)),
    salon_id TEXT NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    fecha TEXT NOT NULL, -- YYYY-MM-DD
    hora_inicio TEXT NOT NULL, -- HH:MM
    hora_fin TEXT NOT NULL, -- HH:MM
    duracion INT NOT NULL DEFAULT 30,
    estado TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'PENDIENTE', 'CONFIRMADA', 'BLOQUEADA')),
    cita_id TEXT,
    cliente_nombre TEXT,
    servicio_nombre TEXT,
    observacion TEXT,
    tipo_creacion TEXT DEFAULT 'MANUAL',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABLA: citas
-- Solicitudes de atención con o sin ficha y contraofertas de horario
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.citas (
    id TEXT PRIMARY KEY DEFAULT ('cita-' || substr(md5(random()::text), 1, 8)),
    codigo_cita TEXT UNIQUE NOT NULL,
    salon_id TEXT NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    servicio_id TEXT,
    salon_nombre TEXT NOT NULL,
    servicio_nombre TEXT NOT NULL,
    cliente_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_whatsapp TEXT NOT NULL,
    cliente_correo TEXT,
    ficha_id TEXT,
    fecha TEXT NOT NULL, -- YYYY-MM-DD
    hora_inicio TEXT NOT NULL, -- HH:MM
    hora_fin TEXT NOT NULL, -- HH:MM
    duracion INT NOT NULL DEFAULT 45,
    precio NUMERIC NOT NULL DEFAULT 0,
    nota TEXT,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'PROPUESTA_ENVIADA', 'CADUCADA')),
    tipo_reserva TEXT DEFAULT 'SIN_FICHA' CHECK (tipo_reserva IN ('CON_FICHA', 'SIN_FICHA')),
    preferencia_horaria TEXT DEFAULT 'MANANA' CHECK (preferencia_horaria IN ('MANANA', 'TARDE', 'INDIFERENTE')),
    propuesta_propietario JSONB, -- Contraoferta con mensaje, nueva fecha/hora y expiración (24h)
    motivo_rechazo TEXT,
    fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ,
    fecha_confirmacion TIMESTAMPTZ,
    fecha_rechazo TIMESTAMPTZ,
    fecha_cancelacion TIMESTAMPTZ
);

-- ==============================================================================
-- 8. TABLA: historial_citas
-- Trazabilidad y auditoría de transiciones de estados de citas
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.historial_citas (
    id TEXT PRIMARY KEY DEFAULT ('hist-' || substr(md5(random()::text), 1, 10)),
    cita_id TEXT NOT NULL REFERENCES public.citas(id) ON DELETE CASCADE,
    codigo_cita TEXT NOT NULL,
    salon_id TEXT NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    estado_anterior TEXT NOT NULL,
    estado_nuevo TEXT NOT NULL,
    usuario_id TEXT,
    usuario_nombre TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    observacion TEXT
);

-- ==============================================================================
-- 9. TABLA: notificaciones
-- Avisos internos para salones y administradores
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || substr(md5(random()::text), 1, 10)),
    salon_id TEXT NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    cita_id TEXT,
    codigo_cita TEXT,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. TABLA: suscripciones
-- Planes mensuales y anuales de los salones
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suscripciones (
    id TEXT PRIMARY KEY DEFAULT ('sub-' || substr(md5(random()::text), 1, 8)),
    salon_id TEXT UNIQUE NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    propietario_id TEXT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_plan TEXT NOT NULL DEFAULT 'MENSUAL' CHECK (tipo_plan IN ('MENSUAL', 'ANUAL')),
    monto NUMERIC NOT NULL DEFAULT 100,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE DE PAGO' CHECK (estado IN ('ACTIVA', 'PENDIENTE DE PAGO', 'PENDIENTE DE VALIDACIÓN', 'VENCIDA', 'SUSPENDIDA')),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. TABLA: pagos_suscripcion
-- Comprobantes QR y pagos validados por el administrador
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pagos_suscripcion (
    id TEXT PRIMARY KEY DEFAULT ('pago-' || substr(md5(random()::text), 1, 10)),
    suscripcion_id TEXT NOT NULL REFERENCES public.suscripciones(id) ON DELETE CASCADE,
    salon_id TEXT NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    propietario_id TEXT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_plan TEXT NOT NULL DEFAULT 'MENSUAL',
    monto NUMERIC NOT NULL,
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referencia TEXT NOT NULL,
    comprobante TEXT NOT NULL,
    observacion TEXT,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    fecha_validacion TIMESTAMPTZ,
    validado_por TEXT,
    motivo_rechazo TEXT
);

-- ==============================================================================
-- 12. TABLA: configuracion_pago
-- Cuenta bancaria oficial y QR Simple de cobro TuCita
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.configuracion_pago (
    id TEXT PRIMARY KEY DEFAULT 'config-pago-default',
    qr_imagen TEXT NOT NULL,
    banco_nombre TEXT NOT NULL DEFAULT 'Banco Unión S.A.',
    titular_cuenta TEXT NOT NULL DEFAULT 'TuCita Aiquile - Administración General',
    numero_cuenta TEXT NOT NULL DEFAULT '10000045892182',
    precio_mensual NUMERIC NOT NULL DEFAULT 100,
    precio_anual NUMERIC NOT NULL DEFAULT 1100,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. TABLA: configuracion_plataforma
-- Identidad y contacto general de soporte TuCita
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.configuracion_plataforma (
    id TEXT PRIMARY KEY DEFAULT 'config-platform-default',
    platform_name TEXT NOT NULL DEFAULT 'TuCita',
    tagline TEXT NOT NULL DEFAULT 'Tu belleza, siempre más cerca.',
    contact_phone TEXT NOT NULL DEFAULT '+591 72891234',
    contact_whatsapp TEXT NOT NULL DEFAULT '+591 72891234',
    contact_email TEXT NOT NULL DEFAULT 'contacto@tucita.bo',
    address TEXT NOT NULL DEFAULT 'Calle Bolívar esq. Sucre, Aiquile, Cochabamba',
    version TEXT NOT NULL DEFAULT '1.10.0'
);

-- ==============================================================================
-- ÍNDICES PARA BÚSQUEDAS RÁPIDAS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_salones_estado ON public.salones(estado, is_available);
CREATE INDEX IF NOT EXISTS idx_servicios_salon ON public.servicios(salon_id, status);
CREATE INDEX IF NOT EXISTS idx_fichas_salon_fecha ON public.fichas_atencion(salon_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_citas_salon_fecha ON public.citas(salon_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_citas_codigo ON public.citas(codigo_cita);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON public.citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos_suscripcion(estado);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_salon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_atencion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_plataforma ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso amplio para sincronización en tiempo real
CREATE POLICY "Permitir gestión total de salones" ON public.salones
    FOR ALL USING (true);

CREATE POLICY "Permitir gestión total de servicios" ON public.servicios
    FOR ALL USING (true);

CREATE POLICY "Permitir gestión total de horarios" ON public.horarios_salon
    FOR ALL USING (true);

CREATE POLICY "Lectura pública de fichas disponibles" ON public.fichas_atencion
    FOR SELECT USING (true);

CREATE POLICY "Acceso total a configuración de pago" ON public.configuracion_pago
    FOR ALL USING (true);

CREATE POLICY "Acceso total a configuración de plataforma" ON public.configuracion_plataforma
    FOR ALL USING (true);

-- Permisos amplios para operaciones de clientes y salones con clave anónima / autenticada
CREATE POLICY "Permitir registro de usuarios" ON public.usuarios
    FOR ALL USING (true);

CREATE POLICY "Permitir creación y actualización de citas" ON public.citas
    FOR ALL USING (true);

CREATE POLICY "Permitir actualización de fichas" ON public.fichas_atencion
    FOR ALL USING (true);

CREATE POLICY "Permitir suscripciones y pagos" ON public.suscripciones
    FOR ALL USING (true);

CREATE POLICY "Permitir pagos de suscripción" ON public.pagos_suscripcion
    FOR ALL USING (true);

CREATE POLICY "Permitir historial de citas" ON public.historial_citas
    FOR ALL USING (true);

CREATE POLICY "Permitir notificaciones" ON public.notificaciones
    FOR ALL USING (true);

-- ==============================================================================
-- DATOS INICIALES SEMILLA (SEED)
-- Únicamente el Administrador Maestro y Configuraciones oficiales
-- ==============================================================================

-- 1. Administrador Maestro TuCita (Contraseña sha256 para 'admin123')
INSERT INTO public.usuarios (
    id, nombre, apellido, correo, usuario, contrasena, rol, estado, telefono, fecha_creacion
) VALUES (
    'user-admin-1',
    'Administrador',
    'General',
    'admin@tucita.bo',
    'admin',
    'admin123',
    'admin',
    'activo',
    '+591 72891234',
    NOW()
) ON CONFLICT (usuario) DO NOTHING;

-- 2. Configuración de Pagos TuCita
INSERT INTO public.configuracion_pago (
    id, qr_imagen, banco_nombre, titular_cuenta, numero_cuenta, precio_mensual, precio_anual
) VALUES (
    'config-pago-default',
    'https://images.unsplash.com/photo-1595079672139-5470805086e3?auto=format&fit=crop&w=500&q=80',
    'Banco Unión S.A.',
    'TuCita Aiquile - Administración General',
    '10000045892182',
    100,
    1100
) ON CONFLICT (id) DO NOTHING;

-- 3. Configuración de Plataforma TuCita
INSERT INTO public.configuracion_plataforma (
    id, platform_name, tagline, contact_phone, contact_whatsapp, contact_email, address, version
) VALUES (
    'config-platform-default',
    'TuCita',
    'Tu belleza, siempre más cerca.',
    '+591 72891234',
    '+591 72891234',
    'contacto@tucita.bo',
    'Calle Bolívar esq. Sucre, Aiquile, Cochabamba',
    '1.10.0'
) ON CONFLICT (id) DO NOTHING;
