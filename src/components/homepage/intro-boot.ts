/**
 * Intro boot script, kept in a plain (non-"use client") module so the server root layout
 * can inline it. Runs before first paint: adds `js` to <html> for progressive-enhancement
 * CSS, and marks the preloader as skipped for repeat visits, reduced motion, and phones/
 * tablets (on touch devices the hero renders immediately so the headline is the first paint).
 */
export const INTRO_SESSION_KEY = "rh-intro-seen";

export const INTRO_BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('${INTRO_SESSION_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(min-width: 1024px) and (pointer: fine)').matches){d.dataset.intro='skip'}}catch(e){d.dataset.intro='skip'}})();`;
