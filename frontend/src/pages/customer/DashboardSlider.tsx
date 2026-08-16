import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

import accessoriesSlider from '../../images/sliders/Accessories Sliders.png';
import engineSlider from '../../images/sliders/Engine slider.png';
import filterSlider from '../../images/sliders/Filter Slider.png';
import suspensionSlider from '../../images/sliders/Suspension Sliders.png';

interface Slide {
  id: number;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  link: string;
}

const slides: Slide[] = [
  {
    id: 1,
    image: accessoriesSlider,
    badge: 'Genuine BMW Accessories',
    title: 'Elevate Your BMW Experience',
    subtitle: 'Precision-engineered floor mats, key fob cases, and aerodynamic M-Performance styling accessories.',
    ctaText: 'Explore Accessories',
    link: '/customer/catalog?search=Accessories'
  },
  {
    id: 2,
    image: engineSlider,
    badge: 'TwinPower Turbo Spares',
    title: 'Uncompromised Engine Power',
    subtitle: 'OEM direct ignition coils, high-performance spark plugs, and Shell Longlife-04 turbo lubricants.',
    ctaText: 'Shop Engine Parts',
    link: '/customer/catalog?search=Engine'
  },
  {
    id: 3,
    image: filterSlider,
    badge: 'High-Efficiency Filtration',
    title: 'Breathe Pure Performance',
    subtitle: 'Dual-stage activated charcoal cabin microfilters & multi-layer synthetic engine air filter cartridges.',
    ctaText: 'View Filter Systems',
    link: '/customer/catalog?search=Filter'
  },
  {
    id: 4,
    image: suspensionSlider,
    badge: 'Dynamics & Handling',
    title: 'Precision Ride & Braking Control',
    subtitle: 'BILSTEIN gas-pressure shock absorbers, forged control arms, and vented high-carbon brake disc sets.',
    ctaText: 'Discover Suspension & Brakes',
    link: '/customer/catalog?search=Suspension'
  }
];

const SLIDE_DURATION = 3500; // 3.5 seconds auto-switch

export const DashboardSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgressKey((prev) => prev + 1);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgressKey((prev) => prev + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgressKey((prev) => prev + 1);
  };

  // Automatic slide interval (3.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 group select-none">
      {/* Top Animated Progress Timer Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80 z-30 overflow-hidden">
        <div
          key={progressKey}
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-400 animate-slide-progress"
          style={{
            animation: `progressAnimation ${SLIDE_DURATION}ms linear forwards`
          }}
        />
      </div>

      <style>{`
        @keyframes progressAnimation {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Slide Container */}
      <div className="relative w-full h-[250px] sm:h-[320px] md:h-[370px] lg:h-[420px]">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Slide Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover object-center transform transition-transform duration-[4000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Gradient Overlays for Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

              {/* Text & Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-14 max-w-2xl">
                <div
                  className={`space-y-3 transform transition-all duration-500 delay-75 ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/40 backdrop-blur-md text-blue-300 text-xs font-semibold tracking-wide shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>{slide.badge}</span>
                  </div>

                  {/* Heading */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                    {slide.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 drop-shadow">
                    {slide.subtitle}
                  </p>

                  {/* CTA Button */}
                  <div className="pt-2">
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all hover:gap-3 group/btn"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-8 bg-blue-500 shadow-md shadow-blue-500/50'
                  : 'w-2 bg-slate-500/60 hover:bg-slate-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DashboardSlider;
