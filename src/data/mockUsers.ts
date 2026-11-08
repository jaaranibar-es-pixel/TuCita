import { User } from '../types';

/**
 * TuCita Aiquile - Usuarios de Sistema
 * Estado Inicial Limpio: Únicamente cuenta Maestra del Administrador General
 */
export const MOCK_USERS: User[] = [
  {
    id: 'user-admin-1',
    nombre: 'Administrador',
    apellido: 'General',
    correo: 'admin@tucita.bo',
    usuario: 'admin',
    contrasena: 'admin123',
    rol: 'admin',
    estado: 'activo',
    telefono: '+591 72891234',
    fecha_creacion: '2026-01-01T08:00:00.000Z',
  },
];
