"use client";

import { useEffect, useState } from "react";

type HeroImage = {
  id: string;
  title: string;
  imageUrl: string;
};

const fallbackImages: HeroImage[] = [
  {
    id: "fade",
    title: "Degradê moderno",
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=2000&q=85",
  },
  {
    id: "barber",
    title: "Detalhe de barbearia",
    imageUrl:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=2000&q=85",
  },
  {
    id: "style",
    title: "Estilo clássico",
    imageUrl:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=2000&q=85",
  },
];

export default function HeroBackground({ images }: { images: HeroImage[] }) {
  const slides =
    images.length >= 2
      ? images
      : [...images, ...fallbackImages.slice(0, 3 - images.length)];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isPaused || reducedMotion || slides.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  const showSlide = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  return (
    <div
      className="hero-slideshow absolute inset-0 z-0 overflow-hidden"
      role="region"
      aria-label="Slideshow de cortes"
      aria-roledescription="carrossel"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-slide ${index === activeIndex ? "is-active" : ""}`}
          role="img"
          aria-label={slide.title}
          aria-hidden={index !== activeIndex}
          style={{ backgroundImage: `url("${slide.imageUrl}")` }}
        />
      ))}

      <div className="hero-slide-shade absolute inset-0" />
      <div className="hero-wordmark pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
        <span>Barbeiro Exclusivo: Diogo Viegas</span>
        <p>VIEGAS BARBER</p>
        <span>Mais que um corte.</span>
      </div>

      {slides.length > 1 && (
        <div className="hero-slideshow-controls absolute right-6 top-6 z-20 flex items-center gap-2 sm:right-10">
          <button
            type="button"
            className="hero-control-button"
            onClick={() => showSlide(activeIndex - 1)}
            aria-label="Imagem anterior"
          >
            <span aria-hidden="true">←</span>
          </button>
          <div className="flex items-center gap-1.5" aria-label="Escolher imagem">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`hero-slide-dot ${index === activeIndex ? "is-active" : ""}`}
                onClick={() => showSlide(index)}
                aria-label={`Mostrar imagem ${index + 1}: ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
          <button
            type="button"
            className="hero-control-button"
            onClick={() => showSlide(activeIndex + 1)}
            aria-label="Imagem seguinte"
          >
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            className="hero-control-button hero-play-button"
            onClick={() => setIsPaused((paused) => !paused)}
            aria-label={isPaused ? "Retomar slideshow automático" : "Pausar slideshow automático"}
          >
            <span aria-hidden="true">{isPaused ? "▶" : "Ⅱ"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
