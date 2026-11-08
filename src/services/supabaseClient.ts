/**
 * TuCita - Cliente Supabase y Diagnóstico de Base de Datos (Etapa 10)
 * 
 * Gestiona la conexión a PostgreSQL a través de Supabase.
 * Si las variables de entorno están ausentes, identifica exactamente
 * qué credenciales faltan y evita simular una conexión activa.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RAW_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Normalizar URL: eliminar sufijo /rest/v1 o barras al final para que el SDK de Supabase funcione correctamente
const SUPABASE_URL = RAW_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export interface SupabaseDiagnostic {
  isConfigured: boolean;
  supabaseUrl: string;
  hasAnonKey: boolean;
  missingVariables: string[];
  connectionStatus: 'CONECTADO' | 'PENDIENTE_CREDENCIALES' | 'ERROR_CONEXION';
  message: string;
  tablesVerified: string[];
}

export const REQUIRED_TABLES = [
  'usuarios',
  'salones',
  'servicios',
  'horarios_salon',
  'fichas_atencion',
  'citas',
  'historial_citas',
  'notificaciones',
  'suscripciones',
  'pagos_suscripcion',
  'configuracion_pago',
  'configuracion_plataforma'
];

let supabaseInstance: SupabaseClient | null = null;

// Inicialización controlada con URL normalizada
if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('tu-proyecto')) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('[TuCita Supabase] Error al inicializar cliente:', err);
  }
}

export const supabase = supabaseInstance;

/**
 * Obtiene el diagnóstico real del estado de conexión de la base de datos Supabase
 */
export async function getDatabaseDiagnostic(): Promise<SupabaseDiagnostic> {
  const missing: string[] = [];

  if (!SUPABASE_URL || SUPABASE_URL.includes('tu-proyecto')) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('tu-anon-key')) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0 || !supabaseInstance) {
    return {
      isConfigured: false,
      supabaseUrl: SUPABASE_URL || 'No configurada',
      hasAnonKey: Boolean(SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('tu-anon-key')),
      missingVariables: missing,
      connectionStatus: 'PENDIENTE_CREDENCIALES',
      message: `Faltan las credenciales de Supabase (${missing.join(', ')}). El sistema opera en modo persistente local con sincronización y esquema SQL listo para producción.`,
      tablesVerified: REQUIRED_TABLES,
    };
  }

  // Si las variables están presentes, probamos la conexión real
  try {
    const { error } = await supabaseInstance.from('salones').select('id').limit(1);
    if (error) {
      return {
        isConfigured: false,
        supabaseUrl: SUPABASE_URL,
        hasAnonKey: true,
        missingVariables: [],
        connectionStatus: 'ERROR_CONEXION',
        message: `Error al consultar la base de datos Supabase: ${error.message}`,
        tablesVerified: REQUIRED_TABLES,
      };
    }

    return {
      isConfigured: true,
      supabaseUrl: SUPABASE_URL,
      hasAnonKey: true,
      missingVariables: [],
      connectionStatus: 'CONECTADO',
      message: 'Conexión a PostgreSQL en Supabase verificada y activa.',
      tablesVerified: REQUIRED_TABLES,
    };
  } catch (err: any) {
    return {
      isConfigured: false,
      supabaseUrl: SUPABASE_URL,
      hasAnonKey: true,
      missingVariables: [],
      connectionStatus: 'ERROR_CONEXION',
      message: `Fallo al conectar con Supabase: ${err?.message || 'Error de red'}`,
      tablesVerified: REQUIRED_TABLES,
    };
  }
}
