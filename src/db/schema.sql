-- ============================================================================
-- PROYECTO TuCita - ESQUEMA Y MIGRACIÓN FINAL DE BASE DE DATOS (ETAPA 10)
-- Plataforma: PostgreSQL / Supabase
-- Entorno: TuCita - "Tu belleza, siempre más cerca." (Aiquile, Cochabamba, Bolivia)
-- ============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLA: usuarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id VARCHAR(64) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'propietario', 'cliente')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    salon_id VARCHAR(64),
    telefono VARCHAR(30),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_salon_id ON public.usuarios(salon_id);

-- ============================================================================
-- 2. TABLA: salones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.salones (
    id VARCHAR(64) PRIMARY KEY,
    propietario_id VARCHAR(64) REFERENCES public.usuarios(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    tagline VARCHAR(150),
    short_description VARCHAR(255),
    description TEXT,
    neon_subtitle VARCHAR(100) DEFAULT 'BELLEZA & BIENESTAR',
    logo_text VARCHAR(10),
    logo_bg_color VARCHAR(30) DEFAULT '#7e22ce',
    rating NUMERIC(3,2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    zone VARCHAR(100) DEFAULT 'Centro',
    city VARCHAR(100) NOT NULL DEFAULT 'Cochabamba',
    municipio VARCHAR(100) DEFAULT 'Aiquile',
    departamento VARCHAR(100) DEFAULT 'Cochabamba',
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    schedule VARCHAR(100) DEFAULT 'Lun a Sáb: 08:30 - 19:30',
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    is_available BOOLEAN NOT NULL DEFAULT true,
    cover_image TEXT,
    banner_image TEXT,
    banner_gradient VARCHAR(100) DEFAULT 'from-purple-900 to-indigo-950',
    hero_image TEXT,
    service_thumbnails JSONB DEFAULT '[]'::jsonb,
    gallery JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salones_estado ON public.salones(estado);
CREATE INDEX IF NOT EXISTS idx_salones_propietario ON public.salones(propietario_id);
CREATE INDEX IF NOT EXISTS idx_salones_city ON public.salones(city);

-- ============================================================================
-- 3. TABLA: servicios
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.servicios (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Cabello', 'Uñas', 'Maquillaje', 'Barbería', 'Tratamientos',
        'Cejas y pestañas', 'Faciales', 'Otros'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicios_salon_id ON public.servicios(salon_id);
CREATE INDEX IF NOT EXISTS idx_servicios_status ON public.servicios(status);

-- ============================================================================
-- 4. TABLA: configuracion_horarios_salon
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.horarios_salon (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) NOT NULL UNIQUE REFERENCES public.salones(id) ON DELETE CASCADE,
    intervalo_minutos VARCHAR(20) NOT NULL DEFAULT '30',
    dias JSONB NOT NULL DEFAULT '[]'::jsonb,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horarios_salon_id ON public.horarios_salon(salon_id);

-- ============================================================================
-- 5. TABLA: citas (Reservas de clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.citas (
    id VARCHAR(64) PRIMARY KEY,
    codigo_cita VARCHAR(30) NOT NULL UNIQUE,
    salon_id VARCHAR(64) NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    servicio_id VARCHAR(64) NOT NULL REFERENCES public.servicios(id) ON DELETE RESTRICT,
    salon_nombre VARCHAR(120) NOT NULL,
    servicio_nombre VARCHAR(150) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(30) NOT NULL,
    cliente_whatsapp VARCHAR(30) NOT NULL,
    cliente_correo VARCHAR(150),
    fecha DATE NOT NULL,
    hora_inicio VARCHAR(10) NOT NULL,
    hora_fin VARCHAR(10) NOT NULL,
    duracion INT NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    nota TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (
        estado IN ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA')
    ),
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo_rechazo TEXT,
    fecha_confirmacion TIMESTAMPTZ,
    fecha_rechazo TIMESTAMPTZ,
    fecha_cancelacion TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_citas_salon_fecha ON public.citas(salon_id, fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_codigo ON public.citas(codigo_cita);

-- ============================================================================
-- 6. TABLA: historial_citas (Auditoría de cambios de estado)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.historial_citas (
    id VARCHAR(64) PRIMARY KEY,
    cita_id VARCHAR(64) NOT NULL REFERENCES public.citas(id) ON DELETE CASCADE,
    codigo_cita VARCHAR(30) NOT NULL,
    salon_id VARCHAR(64) NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20) NOT NULL,
    estado_nuevo VARCHAR(20) NOT NULL,
    usuario_id VARCHAR(64) NOT NULL,
    usuario_nombre VARCHAR(150) NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observacion TEXT
);

CREATE INDEX IF NOT EXISTS idx_historial_cita_id ON public.historial_citas(cita_id);
CREATE INDEX IF NOT EXISTS idx_historial_salon_id ON public.historial_citas(salon_id);

-- ============================================================================
-- 7. TABLA: notificaciones_internas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    cita_id VARCHAR(64),
    codigo_cita VARCHAR(30),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_salon_leida ON public.notificaciones(salon_id, leida);

-- ============================================================================
-- 8. TABLA: suscripciones (Planes Oficiales de TuCita: Mensual y Anual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suscripciones (
    id VARCHAR(64) PRIMARY KEY,
    salon_id VARCHAR(64) NOT NULL UNIQUE REFERENCES public.salones(id) ON DELETE CASCADE,
    propietario_id VARCHAR(64) NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_plan VARCHAR(20) NOT NULL CHECK (tipo_plan IN ('MENSUAL', 'ANUAL')),
    monto NUMERIC(10,2) NOT NULL CHECK (monto IN (100.00, 1100.00)),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE DE PAGO' CHECK (
        estado IN ('ACTIVA', 'PENDIENTE DE PAGO', 'PENDIENTE DE VALIDACIÓN', 'VENCIDA', 'SUSPENDIDA')
    ),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_salon ON public.suscripciones(salon_id);
CREATE INDEX IF NOT EXISTS idx_sub_estado ON public.suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_sub_vencimiento ON public.suscripciones(fecha_vencimiento);

-- ============================================================================
-- 9. TABLA: pagos_suscripcion (Comprobantes y validación administrativa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pagos_suscripcion (
    id VARCHAR(64) PRIMARY KEY,
    suscripcion_id VARCHAR(64) NOT NULL REFERENCES public.suscripciones(id) ON DELETE CASCADE,
    salon_id VARCHAR(64) NOT NULL REFERENCES public.salones(id) ON DELETE CASCADE,
    propietario_id VARCHAR(64) NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_plan VARCHAR(20) NOT NULL CHECK (tipo_plan IN ('MENSUAL', 'ANUAL')),
    monto NUMERIC(10,2) NOT NULL CHECK (monto IN (100.00, 1100.00)),
    fecha_pago DATE NOT NULL,
    referencia VARCHAR(100) NOT NULL,
    comprobante TEXT NOT NULL, -- Imagen en base64 o URL segura de Storage
    observacion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (
        estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')
    ),
    fecha_validacion TIMESTAMPTZ,
    validado_por VARCHAR(150),
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_salon ON public.pagos_suscripcion(salon_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos_suscripcion(estado);

-- ============================================================================
-- 10. TABLA: configuracion_pago (QR Oficial configurable por el Administrador)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.configuracion_pago (
    id VARCHAR(64) PRIMARY KEY,
    qr_imagen TEXT NOT NULL,
    banco_nombre VARCHAR(120) NOT NULL DEFAULT 'Banco Unión S.A.',
    titular_cuenta VARCHAR(150) NOT NULL DEFAULT 'TuCita Bolivia S.R.L.',
    numero_cuenta VARCHAR(50) NOT NULL DEFAULT '10000034982189',
    precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    precio_anual NUMERIC(10,2) NOT NULL DEFAULT 1100.00,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. TABLA: configuracion_plataforma (Datos generales de contacto)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.configuracion_plataforma (
    id VARCHAR(64) PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL DEFAULT 'TuCita',
    tagline VARCHAR(150) NOT NULL DEFAULT 'Tu belleza, siempre más cerca.',
    contact_phone VARCHAR(30) NOT NULL DEFAULT '+591 79781234',
    contact_whatsapp VARCHAR(30) NOT NULL DEFAULT '+591 79781234',
    contact_email VARCHAR(150) NOT NULL DEFAULT 'contacto@tucita.bo',
    address VARCHAR(255) NOT NULL DEFAULT 'Av. Libertador Bolívar #1040, Cochabamba, Bolivia',
    version VARCHAR(20) NOT NULL DEFAULT '1.10.0'
);

-- ============================================================================
-- 12. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_salon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_suscripcion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_plataforma ENABLE ROW LEVEL SECURITY;

-- Regla 1: Salones públicos sólo activos para clientes; propietarios acceden a su salón; admin a todo.
CREATE POLICY "Publico puede ver salones activos" ON public.salones
    FOR SELECT USING (estado = 'activo');

CREATE POLICY "Admin gestiona todos los salones" ON public.salones
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Regla 2: Servicios públicos sólo de salones activos; propietario edita su salón
CREATE POLICY "Publico puede ver servicios activos" ON public.servicios
    FOR SELECT USING (status = 'activo');

CREATE POLICY "Propietario gestiona servicios de su salon" ON public.servicios
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM public.usuarios
            WHERE id = auth.uid()::text AND rol = 'propietario'
        )
    );

-- Regla 3: Citas - Cliente puede insertar con PENDIENTE; propietario gestiona su salón
CREATE POLICY "Cualquier persona puede solicitar cita" ON public.citas
    FOR INSERT WITH CHECK (estado = 'PENDIENTE');

CREATE POLICY "Propietario gestiona citas de su salon" ON public.citas
    FOR ALL USING (
        salon_id IN (
            SELECT salon_id FROM public.usuarios
            WHERE id = auth.uid()::text AND rol = 'propietario'
        )
    );

-- Regla 4: Suscripciones y Pagos - Solo Admin aprueba o rechaza; Propietario registra su pago
CREATE POLICY "Propietario ve y registra su pago" ON public.pagos_suscripcion
    FOR INSERT WITH CHECK (
        propietario_id = auth.uid()::text AND estado = 'PENDIENTE'
    );

CREATE POLICY "Admin valida todos los pagos" ON public.pagos_suscripcion
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Propietario lee su suscripcion" ON public.suscripciones
    FOR SELECT USING (propietario_id = auth.uid()::text);

CREATE POLICY "Admin gestiona todas las suscripciones" ON public.suscripciones
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
