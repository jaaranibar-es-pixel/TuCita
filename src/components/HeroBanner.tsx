import React from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { heroBannerImg } from '../data/mockSalons';
import modelTransparentImg from '../assets/images/model_coqueta_transparent.png';
import { Logo } from './Logo';

interface HeroBannerProps {
  onExploreSalons: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreSalons }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#240643] via-[#3d0d66] to-[#1a0433] text-white">
      {/* Background Photography with Luxury Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBannerImg}
          alt="Salón de belleza elegante TuCita"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105"
        />
        {/* Measured Gradient Scrim for high legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#240642] via-[#2f0857]/95 to-[#4a1278]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0433] via-transparent to-transparent" />
      </div>

      {/* Decorative ambient neon orbs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content Container - Reducido a media pantalla */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 md:pt-8 md:pb-3 lg:pb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[300px] md:min-h-[340px] lg:min-h-[360px]">
          {/* Left Column: Brand & Copy */}
          <div className="md:col-span-7 lg:col-span-7 xl:col-span-7 space-y-4 z-20 py-2">
            {/* Hero Brand Identity Lockup */}
            <div className="inline-block">
              <Logo variant="hero" theme="white" />
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold tracking-tight text-white leading-[1.15]">
                Tu belleza, <br />
                <span className="bg-gradient-to-r from-purple-200 via-pink-100 to-white bg-clip-text text-transparent">
                  siempre más cerca
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-purple-100/90 max-w-xl font-normal leading-relaxed">
              Descubre los salones de belleza de nuestra comunidad. <br className="hidden sm:inline" />
              Reserva tus citas de forma fácil, rápida y segura.
            </p>

            {/* Explorar Salones CTA Button */}
            <div className="pt-1 flex flex-wrap items-center gap-4">
              <button
                onClick={onExploreSalons}
                className="group inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#9333ea] to-[#7e22ce] hover:from-[#a855f7] hover:to-[#9333ea] text-white font-semibold text-sm sm:text-base rounded-2xl shadow-lg shadow-purple-950/40 hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                <span>Explorar salones</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Column: Modelo transparente más pequeña con insignia de corazón reubicada fuera de su rostro */}
          <div className="md:col-span-5 lg:col-span-5 xl:col-span-5 relative flex justify-center md:justify-end items-end self-end h-full pt-2 md:pt-0">
            {/* Ambient Backlight Glow */}
            <div className="absolute top-1/2 left-1/2 md:left-auto md:right-10 -translate-y-1/2 w-60 h-64 md:w-72 md:h-72 bg-gradient-to-t from-fuchsia-600/25 via-purple-500/20 to-pink-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* Insignia 'Realza tu estilo' con corazón: Centrado, más vistoso y grandecito */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 md:left-1/3 md:-translate-x-1/2 z-30 flex items-center gap-2.5 bg-gradient-to-r from-purple-950/80 via-fuchsia-950/80 to-purple-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-pink-400/50 shadow-xl pointer-events-none select-none">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300 drop-shadow-[0_0_12px_rgba(244,114,182,1)] fill-pink-500/40 stroke-[2] animate-pulse" />
              <span className="font-serif italic font-bold text-sm sm:text-base text-pink-100 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)] tracking-wide whitespace-nowrap">
                Realza tu estilo
              </span>
            </div>

            {/* Transparent Model: Tamaño reducido y estilizado */}
            <div className="relative z-20 flex justify-center md:justify-end items-end w-full">
              <img
                src={modelTransparentImg}
                alt="Modelo de cuerpo completo con fondo transparente TuCita"
                referrerPolicy="no-referrer"
                className="w-auto h-[230px] sm:h-[260px] md:h-[300px] lg:h-[340px] xl:h-[360px] object-contain object-bottom drop-shadow-[0_12px_24px_rgba(15,2,26,0.6)] transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom S-Curve / Wave Divider */}
      <div className="relative w-full overflow-hidden leading-none z-10 -mt-1">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8 md:h-12 lg:h-14 text-[#fcfaff] preserve-3d"
          preserveAspectRatio="none"
        >
          <path
            d="M0,24 C320,60 520,0 960,34 C1200,50 1360,15 1440,24 L1440,60 L0,60 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};



