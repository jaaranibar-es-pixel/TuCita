import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowLeft,
  Shield,
  Store,
  AlertCircle,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  CalendarCheck,
  Building,
  MapPin,
  Clock,
  Receipt,
  Scissors
} from 'lucide-react';
import { Logo } from './Logo';
import { User, TipoPlan } from '../types';

interface LoginPageProps {
  onLogin: (userOrEmail: string, pass: string) => boolean;
  onNavigateHome: () => void;
  users: User[];
  onRegisterClient?: (clientData: {
    nombre: string;
    apellido: string;
    telefono: string;
    whatsapp: string;
    correo: string;
    usuario: string;
    contrasena: string;
  }) => { success: boolean; error?: string };
  onRegisterSalonOwner?: (
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
    plan: TipoPlan
  ) => { success: boolean; error?: string };
  initialTab?: 'login' | 'register_client' | 'register_salon';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onNavigateHome,
  users,
  onRegisterClient,
  onRegisterSalonOwner,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register_client' | 'register_salon'>(initialTab);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register Client form state
  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regUsuario, setRegUsuario] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Register Salon Owner form state
  const [salonOwnerName, setSalonOwnerName] = useState('');
  const [salonOwnerLastName, setSalonOwnerLastName] = useState('');
  const [salonOwnerPhone, setSalonOwnerPhone] = useState('');
  const [salonOwnerEmail, setSalonOwnerEmail] = useState('');
  const [salonOwnerUser, setSalonOwnerUser] = useState('');
  const [salonOwnerPass, setSalonOwnerPass] = useState('');
  const [salonOwnerConfirmPass, setSalonOwnerConfirmPass] = useState('');
  const [salonName, setSalonName] = useState('');
  const [salonTagline, setSalonTagline] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  const [salonPlan, setSalonPlan] = useState<TipoPlan>('MENSUAL');
  const [salonRegError, setSalonRegError] = useState('');
  const [salonRegSuccess, setSalonRegSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(true);
      setErrorMessage('Por favor ingresa tu usuario o correo y contraseña.');
      return;
    }

    // Check if account was expired due to 72h rule
    const target = identifier.toLowerCase().trim();
    const foundUser = users.find(
      (u) => u.usuario.toLowerCase() === target || u.correo.toLowerCase() === target
    );

    if (foundUser && foundUser.rol === 'propietario' && foundUser.expiraEn) {
      const expTime = new Date(foundUser.expiraEn).getTime();
      if (Date.now() > expTime) {
        setError(true);
        setErrorMessage(
          'Tu plazo de 72 horas para confirmar el pago ha expirado. Por favor regístrate nuevamente para activar tu salón.'
        );
        return;
      }
    }

    const success = onLogin(identifier.trim(), password.trim());
    if (!success) {
      setError(true);
      setErrorMessage('Usuario o contraseña incorrectos.');
    }
  };

  const handleRegisterClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regNombre.trim() || !regApellido.trim()) {
      setRegError('Por favor ingresa tu nombre y apellido.');
      return;
    }

    if (!regTelefono.trim() || regTelefono.trim().length < 7) {
      setRegError('Ingresa un número de celular o WhatsApp válido (al menos 7 dígitos).');
      return;
    }

    if (!regUsuario.trim() || regUsuario.trim().length < 3) {
      setRegError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden.');
      return;
    }

    // Check if username or email already exists
    const exists = users.some(
      (u) =>
        u.usuario.toLowerCase() === regUsuario.trim().toLowerCase() ||
        (regCorreo.trim() && u.correo && u.correo.toLowerCase() === regCorreo.trim().toLowerCase())
    );

    if (exists) {
      setRegError('El nombre de usuario o correo ya se encuentra registrado.');
      return;
    }

    if (onRegisterClient) {
      const res = onRegisterClient({
        nombre: regNombre.trim(),
        apellido: regApellido.trim(),
        telefono: regTelefono.trim(),
        whatsapp: regTelefono.trim(),
        correo: regCorreo.trim() || `${regUsuario.trim()}@cliente.tucita.bo`,
        usuario: regUsuario.trim(),
        contrasena: regPassword,
      });

      if (!res.success) {
        setRegError(res.error || 'No se pudo crear la cuenta.');
      } else {
        setRegSuccess(true);
      }
    }
  };

  const handleRegisterSalonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSalonRegError('');

    if (!salonOwnerName.trim() || !salonOwnerLastName.trim()) {
      setSalonRegError('Por favor ingresa el nombre y apellido del propietario.');
      return;
    }

    if (!salonOwnerPhone.trim() || salonOwnerPhone.trim().length < 7) {
      setSalonRegError('Ingresa un número de celular o WhatsApp válido del propietario (mínimo 7 dígitos).');
      return;
    }

    if (!salonOwnerUser.trim() || salonOwnerUser.trim().length < 3) {
      setSalonRegError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (!salonOwnerPass || salonOwnerPass.length < 4) {
      setSalonRegError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (salonOwnerPass !== salonOwnerConfirmPass) {
      setSalonRegError('Las contraseñas no coinciden.');
      return;
    }

    if (!salonName.trim() || salonName.trim().length < 3) {
      setSalonRegError('Por favor ingresa el nombre comercial de tu salón de belleza.');
      return;
    }

    if (!salonAddress.trim()) {
      setSalonRegError('Por favor indica la dirección o zona de tu local en Aiquile.');
      return;
    }

    // Check uniqueness
    const exists = users.some(
      (u) =>
        u.usuario.toLowerCase() === salonOwnerUser.trim().toLowerCase() ||
        (salonOwnerEmail.trim() && u.correo && u.correo.toLowerCase() === salonOwnerEmail.trim().toLowerCase())
    );

    if (exists) {
      setSalonRegError('El nombre de usuario o correo ya se encuentra registrado.');
      return;
    }

    if (onRegisterSalonOwner) {
      const res = onRegisterSalonOwner(
        {
          nombre: salonOwnerName.trim(),
          apellido: salonOwnerLastName.trim(),
          telefono: salonOwnerPhone.trim(),
          whatsapp: salonOwnerPhone.trim(),
          correo: salonOwnerEmail.trim() || `${salonOwnerUser.trim()}@salon.tucita.bo`,
          usuario: salonOwnerUser.trim(),
          contrasena: salonOwnerPass,
        },
        {
          name: salonName.trim(),
          tagline: salonTagline.trim() || 'Salón de Belleza Profesional',
          address: salonAddress.trim(),
          phone: salonPhone.trim() || salonOwnerPhone.trim(),
          whatsapp: salonPhone.trim() || salonOwnerPhone.trim(),
        },
        salonPlan
      );

      if (!res.success) {
        setSalonRegError(res.error || 'No se pudo registrar el salón.');
      } else {
        setSalonRegSuccess(true);
      }
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setError(false);
    onLogin(user, pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#240643] via-[#380e5e] to-[#17032d] text-white flex flex-col justify-between relative overflow-hidden py-8 px-4 sm:px-6">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Home Link */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between z-10">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-200 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al portal público TuCita</span>
        </button>

        <span className="text-[11px] uppercase tracking-widest text-purple-300 font-bold bg-white/10 px-3 py-1 rounded-full border border-purple-400/20">
          TuCita · Aiquile
        </span>
      </div>

      {/* Main Login / Register Card */}
      <div className="max-w-xl w-full mx-auto my-auto z-10 pt-4 pb-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-purple-200 space-y-6">
          {/* Logo & Identity */}
          <div className="text-center space-y-1.5">
            <div className="flex justify-center">
              <Logo variant="header" />
            </div>
            <p className="text-xs font-semibold text-purple-700 italic">
              “Tu belleza, siempre más cerca.”
            </p>
            <h1 className="text-2xl font-serif font-extrabold text-slate-900 tracking-tight pt-1">
              {activeTab === 'login' && 'Iniciar Sesión'}
              {activeTab === 'register_client' && 'Registro de Cliente'}
              {activeTab === 'register_salon' && 'Registrar mi Salón de Belleza'}
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {activeTab === 'login' &&
                'Accede a tu cuenta de cliente, a tu panel de salón o a la administración de TuCita.'}
              {activeTab === 'register_client' &&
                'Crea tu cuenta gratis para solicitar citas, responder contraofertas y pedir fichas directas.'}
              {activeTab === 'register_salon' &&
                'Publica tu negocio en Aiquile. Configura tus servicios y horarios mientras se valida tu pago (72 horas).'}
            </p>
          </div>

          {/* Mode Tabs: 3 Tabs (Login / Cliente / Registrar Salón) */}
          <div className="flex p-1 bg-purple-100/70 rounded-2xl border border-purple-200 gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-purple-800 text-white shadow-sm'
                  : 'text-purple-900 hover:text-purple-950 hover:bg-white/50'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register_client');
                setRegError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register_client'
                  ? 'bg-purple-800 text-white shadow-sm'
                  : 'text-purple-900 hover:text-purple-950 hover:bg-white/50'
              }`}
            >
              Soy Cliente
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register_salon');
                setSalonRegError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'register_salon'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-800 text-white shadow-sm'
                  : 'text-purple-900 hover:text-purple-950 hover:bg-white/50'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-pink-500" />
              <span>Registrar Salón</span>
            </button>
          </div>

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <>
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage || 'Usuario o contraseña incorrectos.'}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Usuario o correo electrónico</span>
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError(false);
                    }}
                    placeholder="ej. ana.flores, maria.lopez o admin"
                    className="w-full px-4 py-3 rounded-2xl border border-purple-200 bg-purple-50/40 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Contraseña</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(false);
                      }}
                      placeholder="Tu contraseña..."
                      className="w-full pl-4 pr-11 py-3 rounded-2xl border border-purple-200 bg-purple-50/40 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded border-purple-300 text-purple-700 focus:ring-purple-400 w-3.5 h-3.5"
                    />
                    <span>Mostrar contraseña</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-950/20 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 uppercase"
                >
                  INICIAR SESIÓN
                </button>
              </form>

              {/* Quick Access Demonstrators for Evaluation */}
              <div className="pt-4 border-t border-purple-100 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
                  Accesos rápidos de demostración (1 clic):
                </span>

                <div className="space-y-1.5 text-xs">
                  {/* Demo Client button */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ana.flores', 'cliente123')}
                    className="w-full p-2.5 rounded-xl bg-purple-50/80 hover:bg-purple-100 border border-purple-300 text-purple-950 font-medium flex items-center justify-between transition-colors cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-purple-700" />
                      <span className="font-bold">Cliente: Ana Flores</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      ana.flores / cliente123
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('maria.lopez', 'aura123')}
                    className="w-full p-2.5 rounded-xl bg-purple-50/60 hover:bg-purple-100 border border-purple-200/80 text-purple-950 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-pink-600" />
                      <span>Propietaria Salón Aura</span>
                    </div>
                    <span className="text-[10px] font-bold text-pink-700 bg-white px-2 py-0.5 rounded-md">
                      maria.lopez / aura123
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin123')}
                    className="w-full p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-purple-950 font-medium flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-700" />
                      <span>Administrador General TuCita</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md">
                      admin / admin123
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: REGISTER CLIENT */}
          {activeTab === 'register_client' && (
            <div className="space-y-4">
              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Cuenta creada con éxito! Ingresando a tu panel...</span>
                </div>
              )}

              <form onSubmit={handleRegisterClientSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      placeholder="ej. Lucía"
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={regApellido}
                      onChange={(e) => setRegApellido(e.target.value)}
                      placeholder="ej. Morales"
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    <span>Celular / WhatsApp *</span>
                  </label>
                  <input
                    type="tel"
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    placeholder="ej. 71234567"
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    required
                  />
                  <span className="text-[10px] text-slate-500">
                    Se usará para enviarte avisos de citas y contraofertas.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    <span>Correo electrónico (opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={regCorreo}
                    onChange={(e) => setRegCorreo(e.target.value)}
                    placeholder="ej. lucia.morales@gmail.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Nombre de Usuario *</span>
                  </label>
                  <input
                    type="text"
                    value={regUsuario}
                    onChange={(e) => setRegUsuario(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="ej. lucia.morales"
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-purple-950">
                      Confirmar *
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-800 hover:to-fuchsia-800 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-950/20 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 uppercase"
                >
                  CREAR MI CUENTA Y ACCEDER AL PANEL
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer underline"
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER SALON OWNER (NEW LOCAL) */}
          {activeTab === 'register_salon' && (
            <div className="space-y-4">
              {/* Notice Explanation Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Modo Preparación con Factura y Plazo de 72 Horas</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Al registrarte, ingresarás a tu panel para personalizar tus horarios, servicios y fotos. Tu salón permanecerá <strong>privado</strong> hasta que el administrador verifique tu pago dentro de las <strong>72 horas</strong>. Al confirmar, ¡se publicará automáticamente!
                </p>
                <p className="text-[10px] text-amber-700 font-semibold pt-0.5">
                  ⚠️ Si no se confirma el pago en 72 horas, la cuenta y los datos del salón se eliminarán por seguridad.
                </p>
              </div>

              {salonRegError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{salonRegError}</span>
                </div>
              )}

              {salonRegSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Salón registrado con éxito! Abriendo tu panel y factura...</span>
                </div>
              )}

              <form onSubmit={handleRegisterSalonSubmit} className="space-y-4">
                {/* Section 1: Salon Owner Details */}
                <div className="space-y-2.5 pb-3 border-b border-purple-100">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-pink-600" />
                    <span>1. Datos del Propietario(a)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Nombre *</label>
                      <input
                        type="text"
                        value={salonOwnerName}
                        onChange={(e) => setSalonOwnerName(e.target.value)}
                        placeholder="ej. María"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Apellido *</label>
                      <input
                        type="text"
                        value={salonOwnerLastName}
                        onChange={(e) => setSalonOwnerLastName(e.target.value)}
                        placeholder="ej. López"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Celular / WhatsApp *</label>
                      <input
                        type="tel"
                        value={salonOwnerPhone}
                        onChange={(e) => setSalonOwnerPhone(e.target.value)}
                        placeholder="ej. 72891234"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Correo (Opcional)</label>
                      <input
                        type="email"
                        value={salonOwnerEmail}
                        onChange={(e) => setSalonOwnerEmail(e.target.value)}
                        placeholder="maria@ejemplo.com"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Usuario *</label>
                      <input
                        type="text"
                        value={salonOwnerUser}
                        onChange={(e) => setSalonOwnerUser(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="maria.lopez"
                        className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Contraseña *</label>
                      <input
                        type="password"
                        value={salonOwnerPass}
                        onChange={(e) => setSalonOwnerPass(e.target.value)}
                        placeholder="****"
                        className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Repetir *</label>
                      <input
                        type="password"
                        value={salonOwnerConfirmPass}
                        onChange={(e) => setSalonOwnerConfirmPass(e.target.value)}
                        placeholder="****"
                        className="w-full px-2.5 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Salon Details */}
                <div className="space-y-2.5 pb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-700" />
                    <span>2. Datos de tu Salón de Belleza</span>
                  </span>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Nombre Comercial del Salón *</label>
                    <input
                      type="text"
                      value={salonName}
                      onChange={(e) => setSalonName(e.target.value)}
                      placeholder="ej. Salón & Spa Bella Vista"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Especialidad / Eslogan</label>
                      <input
                        type="text"
                        value={salonTagline}
                        onChange={(e) => setSalonTagline(e.target.value)}
                        placeholder="ej. Cortes, tintes y alisados"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Teléfono / WhatsApp de Atención</label>
                      <input
                        type="tel"
                        value={salonPhone}
                        onChange={(e) => setSalonPhone(e.target.value)}
                        placeholder="ej. 72891234"
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Dirección o Zona en Aiquile *</label>
                    <input
                      type="text"
                      value={salonAddress}
                      onChange={(e) => setSalonAddress(e.target.value)}
                      placeholder="ej. Calle Bolívar entre Sucre y Campero, Zona Central"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  {/* Plan Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Plan de Suscripción TuCita</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label
                        className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                          salonPlan === 'MENSUAL'
                            ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-400'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Plan Mensual</span>
                          <input
                            type="radio"
                            name="plan"
                            checked={salonPlan === 'MENSUAL'}
                            onChange={() => setSalonPlan('MENSUAL')}
                            className="text-purple-700"
                          />
                        </div>
                        <span className="text-base font-black text-purple-900 mt-1">Bs. 100 / mes</span>
                        <span className="text-[10px] text-slate-500">72h para pagar con QR</span>
                      </label>

                      <label
                        className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                          salonPlan === 'ANUAL'
                            ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-400'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Plan Anual</span>
                          <input
                            type="radio"
                            name="plan"
                            checked={salonPlan === 'ANUAL'}
                            onChange={() => setSalonPlan('ANUAL')}
                            className="text-purple-700"
                          />
                        </div>
                        <span className="text-base font-black text-pink-600 mt-1">Bs. 1.100 / año</span>
                        <span className="text-[10px] text-emerald-600 font-bold">¡1 mes gratis de ahorro!</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-800 via-purple-900 to-pink-800 hover:from-purple-900 hover:to-pink-900 text-white font-bold text-xs tracking-wider shadow-lg shadow-purple-950/20 transition-all cursor-pointer uppercase flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>REGISTRAR LOCAL Y VER FACTURA DE PAGO</span>
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer underline"
                >
                  ¿Ya tienes cuenta de salón? Inicia sesión aquí
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-purple-300/70 z-10">
        TuCita © 2026 · Plataforma Oficial de Salones de Belleza de Aiquile
      </div>
    </div>
  );
};
