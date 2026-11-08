import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, DollarSign, Image as ImageIcon, Sparkles, Check, Upload, Trash2 } from 'lucide-react';
import { ServiceItem, ServiceCategory, ServiceStatus } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import {
  SERVICE_CATEGORIES,
  thumbHair,
  thumbNails,
  thumbMakeup,
  thumbFacial,
  galleryHairStyling,
  galleryPedicureSpa,
} from '../data/mockSalons';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: Omit<ServiceItem, 'id' | 'createdAt'> & { id?: string }) => void;
  serviceToEdit?: ServiceItem | null;
  salonId: string;
}

const PRESET_DURATIONS = [15, 30, 45, 60, 90, 120];

const PRESET_IMAGES = [
  { label: 'Corte / Peinado', url: thumbHair },
  { label: 'Uñas / Manicure', url: thumbNails },
  { label: 'Maquillaje glam', url: thumbMakeup },
  { label: 'Facial / Spa', url: thumbFacial },
  { label: 'Estilizado rulos', url: galleryHairStyling },
  { label: 'Pedicure spa', url: galleryPedicureSpa },
];

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  serviceToEdit,
  salonId,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Cabello');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(25);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [status, setStatus] = useState<ServiceStatus>('activo');
  const [selectedImage, setSelectedImage] = useState<string>(thumbHair);
  const [customImageUploading, setCustomImageUploading] = useState(false);
  const [customImageError, setCustomImageError] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCustomImageError('Por favor selecciona un archivo de imagen (JPG, PNG o WEBP).');
      return;
    }
    setCustomImageUploading(true);
    setCustomImageError('');
    try {
      // Comprime a resolución nítida pero liviana (<50KB)
      const compressed = await compressImageFile(file, 700, 700, 0.75);
      setSelectedImage(compressed);
    } catch {
      setCustomImageError('Ocurrió un error al procesar la imagen.');
    } finally {
      setCustomImageUploading(false);
    }
  };

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name);
      setCategory(serviceToEdit.category);
      setDescription(serviceToEdit.description);
      setPrice(serviceToEdit.price);
      setStatus(serviceToEdit.status);
      setSelectedImage(serviceToEdit.image || thumbHair);

      if (PRESET_DURATIONS.includes(serviceToEdit.durationMinutes)) {
        setDurationMinutes(serviceToEdit.durationMinutes);
        setIsCustomDuration(false);
        setCustomDuration('');
      } else {
        setIsCustomDuration(true);
        setCustomDuration(serviceToEdit.durationMinutes.toString());
        setDurationMinutes(serviceToEdit.durationMinutes);
      }
    } else {
      setName('');
      setCategory('Cabello');
      setDescription('');
      setPrice(30);
      setDurationMinutes(30);
      setIsCustomDuration(false);
      setCustomDuration('');
      setStatus('activo');
      setSelectedImage(thumbHair);
      setErrors({});
    }
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleDurationPresetClick = (minutes: number) => {
    setIsCustomDuration(false);
    setDurationMinutes(minutes);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDuration(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDurationMinutes(parsed);
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'El nombre del servicio es obligatorio.';
    if (!description.trim()) errs.description = 'La descripción es obligatoria.';
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) errs.price = 'Ingresa un precio válido en bolivianos.';
    if (durationMinutes <= 0) errs.duration = 'Ingresa una duración válida en minutos.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: serviceToEdit ? serviceToEdit.id : undefined,
      salonId,
      name: name.trim(),
      category,
      description: description.trim(),
      price: Number(price),
      durationMinutes,
      status,
      image: selectedImage,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-purple-100 my-8 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-100 bg-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-900 leading-tight">
                {serviceToEdit ? 'Editar servicio' : 'Agregar nuevo servicio'}
              </h3>
              <p className="text-xs text-purple-700 font-medium">
                Catálogo del salón · Etapa 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Nombre del servicio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center justify-between">
              <span>Nombre del servicio *</span>
              <span className="text-[11px] text-slate-400 font-normal lowercase">ej. Corte de cabello dama</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre comercial del servicio..."
              className={`w-full px-4 py-2.5 rounded-2xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                  : 'border-purple-200 focus:ring-purple-400 bg-purple-50/30 focus:bg-white'
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-950">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 bg-purple-50/30 focus:bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-950">
              Descripción *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla qué incluye el servicio, beneficios o técnicas aplicadas..."
              className={`w-full px-4 py-2.5 rounded-2xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                errors.description
                  ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                  : 'border-purple-200 focus:ring-purple-400 bg-purple-50/30 focus:bg-white'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 font-medium">{errors.description}</p>
            )}
          </div>

          {/* Precio y Duración en dos columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Precio en Bolivianos */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                <span>Precio (Bs) *</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-xs text-purple-700 pointer-events-none">
                  Bs
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="ej. 35"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                    errors.price
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-purple-200 focus:ring-purple-400 bg-purple-50/30 focus:bg-white'
                  }`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-600 font-medium">{errors.price}</p>}
            </div>

            {/* Estado Activo / Inactivo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-950">
                Estado del servicio
              </label>
              <div className="flex items-center gap-2 p-1 bg-purple-50/60 rounded-2xl border border-purple-200">
                <button
                  type="button"
                  onClick={() => setStatus('activo')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'activo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  🟢 Activo
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactivo')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    status === 'inactivo'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚪ Inactivo
                </button>
              </div>
            </div>
          </div>

          {/* Duración del servicio (Presets + Duración Personalizada) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Duración del servicio *</span>
              </label>
              <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                {durationMinutes} minutos
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleDurationPresetClick(preset)}
                  className={`py-2 px-2 rounded-xl font-bold transition-all border cursor-pointer ${
                    !isCustomDuration && durationMinutes === preset
                      ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                      : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  {preset} min
                </button>
              ))}
            </div>

            {/* Opción de Duración Personalizada */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(true);
                    if (!customDuration) setCustomDuration(durationMinutes.toString());
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isCustomDuration
                      ? 'bg-purple-100 text-purple-900 border-purple-400 font-bold'
                      : 'bg-white text-slate-600 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  ⏱ Otra duración personalizada
                </button>

                {isCustomDuration && (
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={customDuration}
                      onChange={handleCustomDurationChange}
                      placeholder="ej. 135"
                      className="w-full px-3 py-1.5 rounded-xl border border-purple-300 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">
                      minutos
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                La duración se utilizará para calcular automáticamente los bloques de horarios disponibles al reservar.
              </p>
            </div>
            {errors.duration && (
              <p className="text-xs text-red-600 font-medium">{errors.duration}</p>
            )}
          </div>

          {/* Imagen del servicio (Subir foto propia o elegir del catálogo) */}
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>Fotografía del servicio</span>
              </label>
              {selectedImage && !PRESET_IMAGES.some((p) => p.url === selectedImage) && (
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Foto propia cargada
                </span>
              )}
            </div>

            {/* Tarjeta de Carga desde Computadora o Celular */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Preview de la imagen actualmente seleccionada */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-300 bg-white shadow-xs shrink-0 relative group">
                  <img
                    src={selectedImage}
                    alt="Vista previa del servicio"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-purple-950/20 pointer-events-none" />
                </div>

                <div className="flex-1 w-full space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={customImageUploading}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{customImageUploading ? 'Comprimiendo foto...' : 'Subir foto de mi computadora'}</span>
                    </button>

                    {selectedImage !== thumbHair && (
                      <button
                        type="button"
                        onClick={() => setSelectedImage(thumbHair)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Restablecer</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sube una foto de tu trabajo (corte, tinte, uñas). Se optimiza automáticamente a ~40KB para no saturar la base de datos.
                  </p>
                  {customImageError && (
                    <p className="text-xs text-red-600 font-medium">{customImageError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Galería de imágenes de muestra opcionales */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                O elige una foto sugerida del catálogo:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImage === img.url
                        ? 'border-purple-600 ring-2 ring-purple-300 scale-102'
                        : 'border-purple-100 hover:border-purple-300 opacity-75 hover:opacity-100'
                    }`}
                    title={img.label}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === img.url && (
                      <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center text-white">
                        <Check className="w-5 h-5 drop-shadow" />
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 truncate px-1">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Buttons */}
        <div className="p-4 sm:p-5 border-t border-purple-100 bg-purple-50/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-purple-200 text-slate-700 hover:bg-purple-100/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all cursor-pointer"
          >
            {serviceToEdit ? 'Guardar cambios' : 'Guardar servicio'}
          </button>
        </div>
      </div>
    </div>
  );
};
