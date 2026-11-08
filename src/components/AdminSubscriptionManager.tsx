import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Ban,
  Search,
  Eye,
  QrCode
} from 'lucide-react';
import {
  Salon,
  User as UserType,
  Suscripcion,
  PagoSuscripcion,
  ConfiguracionPago,
  SuscripcionEstado,
  TipoPlan
} from '../types';
import {
  calculateRemainingDays,
  formatISODateToDDMMYYYY
} from '../utils/subscriptionManager';
import { AdminValidatePaymentModal } from './AdminValidatePaymentModal';

interface AdminSubscriptionManagerProps {
  salons: Salon[];
  users: UserType[];
  suscripciones: Suscripcion[];
  pagos: PagoSuscripcion[];
  configPago: ConfiguracionPago;
  onOpenQRConfig: () => void;
  onApprovePayment: (pagoId: string) => void;
  onRejectPayment: (pagoId: string, motivo: string) => void;
}

export type SubscriptionDisplayStatus =
  | 'ACTIVA'
  | 'POR_VALIDAR'
  | 'POR_VENCER'
  | 'VENCIDA'
  | 'SUSPENDIDA';

export const AdminSubscriptionManager: React.FC<AdminSubscriptionManagerProps> = ({
  salons,
  users,
  suscripciones,
  pagos,
  configPago,
  onOpenQRConfig,
  onApprovePayment,
  onRejectPayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [planFilter, setPlanFilter] = useState<string>('todos');

  // Modal para validar pago pendiente
  const [paymentToValidate, setPaymentToValidate] = useState<PagoSuscripcion | null>(null);

  // Modal para ver comprobante directo
  const [receiptModalImage, setReceiptModalImage] = useState<string | null>(null);

  // Lista combinada de salones con su respectiva suscripción
  // Regla TuCita: Ningún salón existe ni se registra sin suscripción.
  // Todo salón cuenta con suscripción inicial (mínimo 1 mes). Al vencerse, pasa a inactivo.
  const rows = useMemo(() => {
    return salons.map((salon) => {
      let sub = suscripciones.find((s) => s.salon_id === salon.id);
      if (!sub) {
        // Fallback garantizado: suscripción mensual activa de 1 mes
        const now = new Date();
        const exp = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        sub = {
          id: `sub-${salon.id}`,
          salon_id: salon.id,
          propietario_id: salon.propietarioId || '',
          tipo_plan: 'MENSUAL',
          monto: configPago.precio_mensual || 100,
          fecha_inicio: now.toISOString(),
          fecha_vencimiento: exp.toISOString(),
          estado: salon.estado === 'activo' ? 'ACTIVA' : 'SUSPENDIDA',
          fecha_creacion: now.toISOString(),
          fecha_actualizacion: now.toISOString(),
        };
      }

      const salonPagos = pagos.filter((p) => p.salon_id === salon.id);
      const latestPayment = salonPagos[salonPagos.length - 1];
      const pendingPayment = salonPagos.find((p) => p.estado === 'PENDIENTE');
      const owner = users.find((u) => u.salonId === salon.id || u.id === salon.propietarioId);

      const daysRemaining = calculateRemainingDays(sub.fecha_vencimiento);

      // Clasificación unificada de los 5 estados exactos solicitados:
      // 1. ACTIVA (al día, > 7 días restantes)
      // 2. POR VALIDAR (comprobante de pago QR pendiente de revisión)
      // 3. POR VENCER (<= 7 días restantes)
      // 4. VENCIDA (tiempo agotado -> salón inactivo)
      // 5. SUSPENDIDA (bloqueada o pausada)
      let displayStatus: SubscriptionDisplayStatus = 'ACTIVA';
      if (pendingPayment || sub.estado === 'PENDIENTE DE VALIDACIÓN' || sub.estado === 'PENDIENTE DE PAGO') {
        displayStatus = 'POR_VALIDAR';
      } else if (sub.estado === 'SUSPENDIDA' || salon.estado === 'suspendido') {
        displayStatus = 'SUSPENDIDA';
      } else if (sub.estado === 'VENCIDA' || daysRemaining < 0) {
        displayStatus = 'VENCIDA';
      } else if (daysRemaining <= 7) {
        displayStatus = 'POR_VENCER';
      } else {
        displayStatus = 'ACTIVA';
      }

      return {
        salon,
        sub,
        owner,
        latestPayment,
        pendingPayment,
        daysRemaining,
        displayStatus,
      };
    });
  }, [salons, suscripciones, pagos, users, configPago]);

  // Estadísticas dinámicas de suscripciones calculadas 1:1 con las filas
  const stats = useMemo(() => {
    let activas = 0;
    let porValidar = 0;
    let porVencer = 0;
    let vencidas = 0;
    let suspendidas = 0;

    rows.forEach((r) => {
      if (r.displayStatus === 'ACTIVA') activas++;
      else if (r.displayStatus === 'POR_VALIDAR') porValidar++;
      else if (r.displayStatus === 'POR_VENCER') porVencer++;
      else if (r.displayStatus === 'VENCIDA') vencidas++;
      else if (r.displayStatus === 'SUSPENDIDA') suspendidas++;
    });

    return {
      activas,
      porValidar,
      porVencer,
      vencidas,
      suspendidas,
    };
  }, [rows]);

  // Filtrado de la tabla
  const filteredRows = useMemo(() => {
    return rows.filter(({ salon, sub, owner, latestPayment, displayStatus }) => {
      // Filtro de estado unificado
      if (statusFilter !== 'todos' && displayStatus !== statusFilter) {
        return false;
      }

      // Filtro de plan
      if (planFilter !== 'todos' && sub?.tipo_plan !== planFilter) {
        return false;
      }

      // Buscador
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          salon.name.toLowerCase().includes(q) ||
          salon.city.toLowerCase().includes(q) ||
          (owner && `${owner.nombre} ${owner.apellido}`.toLowerCase().includes(q)) ||
          (latestPayment && latestPayment.referencia.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [rows, statusFilter, planFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-300 text-xs font-semibold border border-white/10">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gestión Maestra de Suscripciones · TuCita</span>
          </div>
          <h2 className="text-2xl font-serif font-extrabold tracking-tight">
            Control de Suscripciones y Pagos
          </h2>
          <p className="text-xs sm:text-sm text-purple-200">
            Supervisa los planes de los salones. Todo salón cuenta con suscripción activa; al vencer pasa directamente a inactivo.
          </p>
        </div>

        <button
          onClick={onOpenQRConfig}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-purple-100 text-xs font-bold border border-white/20 flex items-center gap-2 cursor-pointer transition-colors shrink-0 self-start md:self-auto"
        >
          <QrCode className="w-4 h-4 text-pink-300" />
          <span>Configurar QR Oficial</span>
        </button>
      </div>

      {/* 5 Tarjetas Estadísticas Principales: Activas, Por Validar, Por Vencer, Vencidas, Suspendidas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* 1. Activas */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ACTIVA' ? 'todos' : 'ACTIVA')}
          className={`bg-white p-4 rounded-3xl border shadow-xs space-y-1 transition-all cursor-pointer ${
            statusFilter === 'ACTIVA' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Activas
          </span>
          <div className="text-2xl font-extrabold text-emerald-950 font-mono">
            {stats.activas}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block">Vigentes en catálogo</span>
        </div>

        {/* 2. Por Validar */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'POR_VALIDAR' ? 'todos' : 'POR_VALIDAR')}
          className={`bg-white p-4 rounded-3xl border shadow-xs space-y-1 transition-all cursor-pointer ${
            statusFilter === 'POR_VALIDAR' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
            Por Validar
          </span>
          <div className="text-2xl font-extrabold text-amber-900 font-mono flex items-center justify-between">
            <span>{stats.porValidar}</span>
            {stats.porValidar > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] text-amber-700 block">Pagos pendientes</span>
        </div>

        {/* 3. Por Vencer */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'POR_VENCER' ? 'todos' : 'POR_VENCER')}
          className={`bg-white p-4 rounded-3xl border shadow-xs space-y-1 transition-all cursor-pointer ${
            statusFilter === 'POR_VENCER' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-200 hover:border-purple-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
            Por Vencer
          </span>
          <div className="text-2xl font-extrabold text-purple-950 font-mono">
            {stats.porVencer}
          </div>
          <span className="text-[10px] text-purple-700 block">&le; 7 días restantes</span>
        </div>

        {/* 4. Vencidas */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'VENCIDA' ? 'todos' : 'VENCIDA')}
          className={`bg-white p-4 rounded-3xl border shadow-xs space-y-1 transition-all cursor-pointer ${
            statusFilter === 'VENCIDA' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-100 hover:border-rose-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
            Vencidas
          </span>
          <div className="text-2xl font-extrabold text-rose-950 font-mono">
            {stats.vencidas}
          </div>
          <span className="text-[10px] text-rose-600 block">Salón inactivo</span>
        </div>

        {/* 5. Suspendidas */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'SUSPENDIDA' ? 'todos' : 'SUSPENDIDA')}
          className={`bg-white p-4 rounded-3xl border shadow-xs space-y-1 transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'SUSPENDIDA' ? 'border-slate-600 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
            Suspendidas
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {stats.suspendidas}
          </div>
          <span className="text-[10px] text-slate-500 block">Acceso restringido</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre de salón, propietario o referencia bancaria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/20"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="ACTIVA">Solo Activas</option>
            <option value="POR_VALIDAR">Por Validar (Pago pendiente)</option>
            <option value="POR_VENCER">Por Vencer (&le; 7 días)</option>
            <option value="VENCIDA">Vencidas (Inactivas)</option>
            <option value="SUSPENDIDA">Suspendidas</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl border border-purple-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
          >
            <option value="todos">Todos los planes</option>
            <option value="MENSUAL">Plan Mensual (Bs {configPago.precio_mensual || 100})</option>
            <option value="ANUAL">Plan Anual (Bs {configPago.precio_anual || 1100})</option>
          </select>
        </div>
      </div>

      {/* Table Suscripciones y Pagos */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-purple-50/80 border-b border-purple-100 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                <th className="py-3 px-4">Salón</th>
                <th className="py-3 px-3">Propietario</th>
                <th className="py-3 px-3">Plan / Monto</th>
                <th className="py-3 px-3">Vencimiento</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Comprobante</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredRows.length > 0 ? (
                filteredRows.map(({ salon, sub, owner, latestPayment, pendingPayment, daysRemaining, displayStatus }) => (
                  <tr key={salon.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Salón */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: salon.logoBgColor || '#7e22ce' }}
                        >
                          {salon.logoText || salon.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="block text-slate-900 font-bold">{salon.name}</span>
                          <span className="text-[10px] text-slate-400">{salon.city}</span>
                        </div>
                      </div>
                    </td>

                    {/* Propietario */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-900 block">
                        {owner ? `${owner.nombre} ${owner.apellido}` : 'Sin propietario'}
                      </span>
                      <span className="text-[10px] text-purple-700 font-mono">
                        {owner?.telefono || '@' + owner?.usuario}
                      </span>
                    </td>

                    {/* Plan / Monto */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-purple-950 block">
                        {sub.tipo_plan === 'MENSUAL' ? 'Plan Mensual' : 'Plan Anual'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Bs {sub.monto}
                      </span>
                    </td>

                    {/* Vencimiento */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          {formatISODateToDDMMYYYY(sub.fecha_vencimiento)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold block ${
                            displayStatus === 'VENCIDA'
                              ? 'text-rose-600 font-bold'
                              : displayStatus === 'POR_VENCER'
                              ? 'text-purple-700 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {displayStatus === 'VENCIDA'
                            ? 'Vencida (Inactivo)'
                            : `${daysRemaining} días rest.`}
                        </span>
                      </div>
                    </td>

                    {/* Estado Suscripción (Los 5 estados exactos) */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {displayStatus === 'ACTIVA' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ACTIVA
                        </span>
                      )}
                      {displayStatus === 'POR_VALIDAR' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          POR VALIDAR
                        </span>
                      )}
                      {displayStatus === 'POR_VENCER' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
                          <AlertCircle className="w-3 h-3 text-purple-700" />
                          POR VENCER
                        </span>
                      )}
                      {displayStatus === 'VENCIDA' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          VENCIDA
                        </span>
                      )}
                      {displayStatus === 'SUSPENDIDA' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-700 text-white border border-slate-800">
                          <Ban className="w-3 h-3 text-slate-300" />
                          SUSPENDIDA
                        </span>
                      )}
                    </td>

                    {/* Comprobante */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {(salon.ordenPago?.comprobanteUrl || (pendingPayment?.comprobante && pendingPayment.comprobante !== 'PENDIENTE_COMPROBANTE')) ? (
                        <button
                          type="button"
                          onClick={() => setReceiptModalImage(salon.ordenPago?.comprobanteUrl || pendingPayment?.comprobante || '')}
                          className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-950 font-bold hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver comprobante</span>
                        </button>
                      ) : latestPayment && latestPayment.comprobante !== 'PENDIENTE_COMPROBANTE' ? (
                        <button
                          type="button"
                          onClick={() => setReceiptModalImage(latestPayment.comprobante)}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Último pago</span>
                        </button>
                      ) : (
                        <span className="text-amber-700 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          Esperando comprobante
                        </span>
                      )}
                    </td>

                    {/* Acción: Validar Pago si está pendiente */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {pendingPayment ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentToValidate({
                              ...pendingPayment,
                              comprobante: salon.ordenPago?.comprobanteUrl || pendingPayment.comprobante,
                            })
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Revisar Pago</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Al día
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron salones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Validar Pago */}
      {paymentToValidate && (
        <AdminValidatePaymentModal
          isOpen={true}
          pago={paymentToValidate}
          salon={salons.find((s) => s.id === paymentToValidate.salon_id)}
          owner={users.find((u) => u.id === paymentToValidate.propietario_id)}
          onClose={() => setPaymentToValidate(null)}
          onApprove={(pagoId) => {
            onApprovePayment(pagoId);
            setPaymentToValidate(null);
          }}
          onReject={(pagoId, motivo) => {
            onRejectPayment(pagoId, motivo);
            setPaymentToValidate(null);
          }}
        />
      )}

      {/* Lightbox Comprobante */}
      {receiptModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setReceiptModalImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                Comprobante de Transferencia QR
              </span>
              <button
                onClick={() => setReceiptModalImage(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-2 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={receiptModalImage}
                alt="Comprobante"
                className="max-h-[60vh] w-auto object-contain rounded-xl shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
