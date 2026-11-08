import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-purple-100 text-slate-700 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-purple-100/80">
          {/* Brand Logo & Slogan */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <Logo variant="footer" />
            <p className="text-xs text-purple-900/70 font-medium italic pl-1 pt-1">
              “Tu belleza, siempre más cerca.”
            </p>
          </div>

          {/* Community & Location Badge */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-900 font-semibold border border-purple-200/60">
              <MapPin className="w-3.5 h-3.5 text-purple-700" />
              <span>Aiquile, Cochabamba · Bolivia</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-purple-700/80">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Plataforma comunitaria de belleza</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Stage 1 Badge */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © 2026 TuCita. Todos los derechos reservados.
          </div>
          <div className="text-[11px] text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 font-medium">
            Etapa 10: Integración Final y Plataforma Consolidada
          </div>
        </div>
      </div>
    </footer>
  );
};
