import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Lock, Shield, User as UserIcon } from 'lucide-react';
import { User, Salon, UserStatus } from '../types';

interface AdminOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerToEdit?: User | null;
  salons: Salon[];
  onSaveOwner: (ownerData: Partial<User> & { salonId: string; contrasena?: string }) => void;
}

export const AdminOwnerModal: React.FC<AdminOwnerModalProps> = ({
  isOpen,
  onClose,
  ownerToEdit,
  salons,
  onSaveOwner,
}) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [salonId, setSalonId] = useState('');
  const [estado, setEstado] = useState<UserStatus>('activo');
  const [error, setError] = useState('');

  useEffect(() => {
    if (ownerToEdit) {
      setNombre(ownerToEdit.nombre || '');
      setApellido(ownerToEdit.apellido || '');
      setCorreo(ownerToEdit.correo || '');
      setTelefono(ownerToEdit.telefono || '');
      setUsuario(ownerToEdit.usuario || '');
      setContrasena(''); // Do not display existing password
      setSalonId(ownerToEdit.salonId || (salons[0]?.id ?? ''));
      setEstado(ownerToEdit.estado || 'activo');
    } else {
      setNombre('');
      setApellido('');
      setCorreo('');
      setTelefono('');
      setUsuario('');
      setContrasena('propietario123');
      setSalonId(salons[0]?.id ?? '');
      setEstado('activo');
    }
    setError('');
  }, [ownerToEdit, salons, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !usuario.trim()) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (!salonId) {
      setError('Debes asociar el propietario a un salón existente.');
      return;
    }

    if (!ownerToEdit && !contrasena.trim()) {
      setError('Por favor define una contraseña temporal.');
      return;
    }

    onSaveOwner({
      id: ownerToEdit?.id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.trim() || `${usuario.trim()}@tucita.bo`,
      telefono: telefono.trim(),
      usuario: usuario.trim().toLowerCase(),
      contrasena: contrasena.trim() || undefined,
      salonId,
      estado,
      rol: 'propietario',
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-pink-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-300 block">
                {ownerToEdit ? 'Editar Propietario' : 'Nuevo Propietario'}
              </span>
              <h3 className="font-serif font-bold text-xl text-white">
                {ownerToEdit ? 'Modificar Datos de Propietario' : 'Registrar Nuevo Propietario'}
              </h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Nombre *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Apellido *</label>
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Nombre de Usuario *</label>
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej: paola.aura"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">
                {ownerToEdit ? 'Nueva Contraseña (opcional)' : 'Contraseña Temporal *'}
              </label>
              <input
                type="password"
                required={!ownerToEdit}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder={ownerToEdit ? 'Dejar en blanco para no cambiar' : 'Contraseña temporal'}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="79781234"
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Correo Electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>
          </div>

          {/* Salón Asociado (Requisito 6 y 10: no permitir salones inexistentes) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800">
              Salón Asociado * (Asignación exclusiva)
            </label>
            <select
              value={salonId}
              required
              onChange={(e) => setSalonId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-semibold cursor-pointer"
            >
              {salons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city} - {s.estado.toUpperCase()})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 block">
              El propietario solo podrá acceder y modificar este salón específico.
            </span>
          </div>

          {/* Estado del Propietario */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800">Estado de la cuenta</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as UserStatus)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white cursor-pointer font-semibold"
            >
              <option value="activo">Activo (Puede iniciar sesión)</option>
              <option value="inactivo">Inactivo (Acceso bloqueado)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{ownerToEdit ? 'Guardar Cambios' : 'Crear Propietario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
