import { Suscripcion, PagoSuscripcion, ConfiguracionPago } from '../types';

// Código QR vectorial de alta definición para TuCita (SVG base64 con logo y datos)
export const DEFAULT_TUCITA_QR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#ffffff" rx="30"/>
  <rect x="20" y="20" width="360" height="360" fill="none" stroke="#7e22ce" stroke-width="4" rx="20"/>
  
  <!-- QR Pattern Corners -->
  <rect x="45" y="45" width="90" height="90" fill="#4a044e" rx="12"/>
  <rect x="60" y="60" width="60" height="60" fill="#ffffff" rx="6"/>
  <rect x="72" y="72" width="36" height="36" fill="#7e22ce" rx="4"/>

  <rect x="265" y="45" width="90" height="90" fill="#4a044e" rx="12"/>
  <rect x="280" y="60" width="60" height="60" fill="#ffffff" rx="6"/>
  <rect x="292" y="72" width="36" height="36" fill="#7e22ce" rx="4"/>

  <rect x="45" y="265" width="90" height="90" fill="#4a044e" rx="12"/>
  <rect x="60" y="280" width="60" height="60" fill="#ffffff" rx="6"/>
  <rect x="72" y="292" width="36" height="36" fill="#7e22ce" rx="4"/>

  <!-- Simulated Data Matrix Blocks -->
  <g fill="#581c87">
    <rect x="155" y="50" width="20" height="20" rx="3"/>
    <rect x="185" y="50" width="20" height="20" rx="3"/>
    <rect x="215" y="50" width="20" height="20" rx="3"/>
    <rect x="155" y="80" width="40" height="20" rx="3"/>
    <rect x="215" y="80" width="20" height="40" rx="3"/>

    <rect x="50" y="155" width="20" height="30" rx="3"/>
    <rect x="80" y="155" width="30" height="20" rx="3"/>
    <rect x="120" y="155" width="20" height="20" rx="3"/>
    <rect x="50" y="200" width="30" height="30" rx="3"/>
    <rect x="100" y="195" width="30" height="20" rx="3"/>

    <rect x="250" y="155" width="40" height="20" rx="3"/>
    <rect x="310" y="155" width="35" height="20" rx="3"/>
    <rect x="260" y="190" width="20" height="40" rx="3"/>
    <rect x="300" y="190" width="45" height="20" rx="3"/>

    <rect x="155" y="250" width="30" height="20" rx="3"/>
    <rect x="200" y="250" width="20" height="35" rx="3"/>
    <rect x="235" y="250" width="40" height="20" rx="3"/>
    <rect x="155" y="285" width="20" height="45" rx="3"/>
    <rect x="190" y="300" width="35" height="25" rx="3"/>
    <rect x="240" y="285" width="25" height="45" rx="3"/>
    <rect x="280" y="270" width="30" height="30" rx="3"/>
    <rect x="325" y="280" width="25" height="40" rx="3"/>

    <rect x="150" y="340" width="40" height="20" rx="3"/>
    <rect x="205" y="340" width="30" height="20" rx="3"/>
    <rect x="250" y="340" width="40" height="20" rx="3"/>
    <rect x="310" y="335" width="35" height="25" rx="3"/>
  </g>

  <!-- Center Emblem TuCita -->
  <circle cx="200" cy="200" r="42" fill="#ffffff" stroke="#7e22ce" stroke-width="4"/>
  <circle cx="200" cy="200" r="34" fill="#6b21a8"/>
  <text x="200" y="198" font-family="sans-serif" font-size="12" font-weight="900" fill="#fdf4ff" text-anchor="middle" letter-spacing="1">TuCita</text>
  <text x="200" y="213" font-family="sans-serif" font-size="8" font-weight="700" fill="#fbcfe8" text-anchor="middle">QR PAGO</text>
</svg>
`)}`;

// Imagen de comprobante de demostración realista
export const SAMPLE_COMPROBANTE_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" width="100%" height="100%">
  <rect width="500" height="700" fill="#f8fafc" rx="20"/>
  <rect x="20" y="20" width="460" height="660" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="16"/>
  
  <rect x="20" y="20" width="460" height="90" fill="#0284c7" rx="16"/>
  <text x="250" y="55" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">BANCO UNIÓN S.A. - BANCA MÓVIL</text>
  <text x="250" y="80" font-family="sans-serif" font-size="12" fill="#e0f2fe" text-anchor="middle">COMPROBANTE DE TRANSFERENCIA SIMPLE / QR</text>

  <circle cx="250" cy="150" r="32" fill="#dcfce7" stroke="#16a34a" stroke-width="3"/>
  <path d="M238 150 L246 158 L264 140" fill="none" stroke="#16a34a" stroke-width="4" stroke-linecap="round"/>
  <text x="250" y="205" font-family="sans-serif" font-size="15" font-weight="bold" fill="#15803d" text-anchor="middle">¡TRANSFERENCIA EXITOSA!</text>

  <g font-family="sans-serif" font-size="12" fill="#475569">
    <text x="50" y="250">Monto Transferido:</text>
    <text x="450" y="250" text-anchor="end" font-weight="bold" font-size="16" fill="#0f172a">Bs 100.00</text>
    <line x1="50" y1="265" x2="450" y2="265" stroke="#f1f5f9" stroke-width="2"/>

    <text x="50" y="295">Destinatario:</text>
    <text x="450" y="295" text-anchor="end" font-weight="bold" fill="#0f172a">TuCita Bolivia S.R.L.</text>

    <text x="50" y="325">Cuenta Destino:</text>
    <text x="450" y="325" text-anchor="end" font-family="monospace">10000034982189 (Cta. Cte.)</text>

    <text x="50" y="355">Banco:</text>
    <text x="450" y="355" text-anchor="end">Banco Unión S.A.</text>
    <line x1="50" y1="370" x2="450" y2="370" stroke="#f1f5f9" stroke-width="2"/>

    <text x="50" y="400">Nro. de Operación / Ref:</text>
    <text x="450" y="400" text-anchor="end" font-weight="bold" font-family="monospace">REF-2026-984210</text>

    <text x="50" y="430">Fecha y Hora:</text>
    <text x="450" y="430" text-anchor="end">01/10/2026 - 10:45:12</text>

    <text x="50" y="460">Concepto / Glosa:</text>
    <text x="450" y="460" text-anchor="end" font-style="italic">Suscripción Mensual Salón Aura</text>
  </g>

  <rect x="50" y="520" width="400" height="90" fill="#f8fafc" stroke="#e2e8f0" rx="12"/>
  <text x="250" y="555" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Este documento es una constancia digital oficial de pago.</text>
  <text x="250" y="575" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Código de autorización electrónica: AUTH-BU-883921</text>
</svg>
`)}`;

export const DEFAULT_PAGO_CONFIG: ConfiguracionPago = {
  id: 'cfg-pago-001',
  qr_imagen: DEFAULT_TUCITA_QR,
  banco_nombre: 'Banco Unión S.A.',
  titular_cuenta: 'TuCita Bolivia S.R.L.',
  numero_cuenta: '10000034982189',
  fecha_actualizacion: new Date().toISOString(),
  precio_mensual: 100, // Requisito 1: Bs 100 / mes
  precio_anual: 1100,  // Requisito 1: Bs 1.100 / año
};

export const MOCK_SUSCRIPCIONES: Suscripcion[] = [];

export const MOCK_PAGOS: PagoSuscripcion[] = [];

