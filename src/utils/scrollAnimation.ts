import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollController {
  lenis: Lenis | null;
  destroy: () => void;
  refresh: () => void;
}

/**
 * Initializes Lenis smooth scrolling coupled to GSAP ScrollTrigger.
 * Respects mobile devices with reduced motion / lighter inertia to preserve 60FPS.
 */
export function initSmoothScrollWithGsap(): ScrollController {
  const isMobile =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lenisInstance: Lenis | null = null;

  if (!prefersReducedMotion) {
    lenisInstance = new Lenis({
      duration: isMobile ? 0.9 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: isMobile ? 1.0 : 1.5,
      wheelMultiplier: 1.0
    });

    // Expose the instance so the scroll intro (intro.js) can reposition it without a jump
    window.__vcLenis = lenisInstance;

    // Synchronize Lenis with GSAP ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenisInstance?.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return {
      lenis: lenisInstance,
      destroy: () => {
        gsap.ticker.remove(tickerCallback);
        if (window.__vcLenis === lenisInstance) window.__vcLenis = undefined;
        lenisInstance?.destroy();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      },
      refresh: () => {
        ScrollTrigger.refresh();
      }
    };
  }

  return {
    lenis: null,
    destroy: () => {},
    refresh: () => {
      ScrollTrigger.refresh();
    }
  };
}

/**
 * Registers scroll entrance animations across sections.
 * Viewport entrance: elements fade in (opacity 0 -> 1) and translate upward (y: 50 -> 0).
 * Mobile optimized: drops distance from 50px to 20px and shortens duration.
 */
export function registerScrollEntranceAnimations(containerSelector: string = '[data-scroll-container]') {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return () => {};

  // When the scroll intro is removed the page height changes, so positions must be recalculated.
  const onIntroFinished = () => ScrollTrigger.refresh();
  window.addEventListener('vc-intro-finished', onIntroFinished);

  const ctx = gsap.context(() => {
    const sections = gsap.utils.toArray<HTMLElement>('[data-scroll-section]');

    sections.forEach((section) => {
      const animatedElements = section.querySelectorAll('[data-scroll-reveal]');
      const targets = animatedElements.length > 0 ? animatedElements : [section];

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: isMobile ? 24 : 50
        },
        {
          opacity: 1,
          y: 0,
          duration: isMobile ? 0.5 : 0.8,
          ease: 'power2.out',
          stagger: isMobile ? 0.05 : 0.1,
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });
  });

  return () => {
    window.removeEventListener('vc-intro-finished', onIntroFinished);
    ctx.revert();
  };
}
