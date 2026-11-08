import React, { useState, useEffect } from 'react';
import { X, Building, Save, MapPin, Phone, MessageCircle, Mail, AlertTriangle } from 'lucide-react';
import { Salon, SalonStatus } from '../types';

interface AdminSalonEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: Salon | null;
  onSave: (updatedSalon: Salon) => void;
}

export const AdminSalonEditModal: React.FC<AdminSalonEditModalProps> = ({
  isOpen,
  onClose,
  salon,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<SalonStatus>('activo');
  const [logoBgColor, setLogoBgColor] = useState('#7e22ce');
  const [bannerGradient, setBannerGradient] = useState('');

  useEffect(() => {
    if (salon) {
      setName(salon.name || '');
      setTagline(salon.tagline || '');
      setDescription(salon.description || salon.shortDescription || '');
      setAddress(salon.address || '');
      setCity(salon.city || '');
      setZone(salon.zone || '');
      setPhone(salon.phone || '');
      setWhatsapp(salon.whatsapp || '');
      setEmail(salon.email || '');
      setEstado(salon.estado || 'activo');
      setLogoBgColor(salon.logoBgColor || '#7e22ce');
      setBannerGradient(salon.bannerGradient || '');
    }
  }, [salon]);

  if (!isOpen || !salon) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: Salon = {
      ...salon,
      name: name.trim(),
      tagline: tagline.trim(),
      shortDescription: description.slice(0, 120),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      zone: zone.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      estado,
      isAvailable: estado === 'activo',
      logoBgColor,
      bannerGradient,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
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
                Administración General
              </span>
              <h3 className="font-serif font-bold text-xl text-white">Editar Datos del Salón</h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Nombre del salón *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Estado del salón *</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as SalonStatus)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold bg-white cursor-pointer"
              >
                <option value="activo">ACTIVO (Visible y agendable)</option>
                <option value="inactivo">INACTIVO (Pausado)</option>
                <option value="suspendido">SUSPENDIDO (Bloqueado al público)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800">Eslogan comercial</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800">Descripción completa</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Municipio</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Zona / Barrio</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Correo de contacto</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Color distintivo / Logo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={logoBgColor}
                  onChange={(e) => setLogoBgColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-purple-200 p-0.5"
                />
                <input
                  type="text"
                  value={logoBgColor}
                  onChange={(e) => setLogoBgColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Gradiente de Banner</label>
              <input
                type="text"
                placeholder="ej: from-purple-900 to-indigo-950"
                value={bannerGradient}
                onChange={(e) => setBannerGradient(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-purple-100 flex items-center justify-end gap-3 shrink-0">
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
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
