/* Profile Dynamics home.js v1.0.0: beweging van de pagina home-nieuw. Bron: home/home.js in WEAREBORING/profile-dynamics.
   Laadt alleen de modules waarvan het attribuut op de pagina staat (tabel "modules"), van dezelfde tag. De code leest alleen
   data-p-*-attributen, nooit classnamen. Zet html[data-p-ready] als alles klaarstaat; de css in "CSS - Home" verbergt tot dan
   wat binnenkomt (zie docs/code.md in de projectmap). */
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
var html = document.documentElement;
// Easing van het ontwerp, cubic-bezier(.22,1,.36,1) (easeOutQuint): in GSAP is dat power4.out
var EASE = 'power4.out';

function each(sel, fn) { [].forEach.call(document.querySelectorAll(sel), fn); }
function num(el, attr, fallback) { var v = parseFloat(el.getAttribute(attr)); return isNaN(v) ? fallback : v; }

/* GSAP staat op de site (site-footer, 3.12.2). Ontbreekt hij toch, dan dezelfde versie laden. */
var gsapWaiting;
function withGsap(fn) {
  if (window.gsap) return fn(window.gsap);
  if (gsapWaiting) return gsapWaiting.push(fn);
  gsapWaiting = [fn];
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  s.onload = function () { if (window.gsap) gsapWaiting.forEach(function (f) { f(window.gsap); }); };
  document.head.appendChild(s);
}

/* Lenis van de site: `let lenis` in de site-footer is een globale binding, geen eigenschap van window */
function getLenis() {
  /* global lenis */
  return (typeof lenis !== 'undefined' && lenis) || window.lenis || null;
}

/* Binnenkomen: beginstand en afspelen van data-p-block, -rise en -clip. Gedeeld door reveal (bij scrollen) en cases (bij openen). */
var PARTS = '[data-p-block], [data-p-rise], [data-p-clip]';
function startOf(el) {
  if (el.hasAttribute('data-p-clip')) return { clipPath: 'inset(0% 100% 0% 0%)' };
  if (el.hasAttribute('data-p-rise')) return { opacity: 0, y: num(el, 'data-p-rise', 28) };
  // Webflow schrijft een attribuut zonder waarde als "true": data-p-fade="1" en ="true" betekenen allebei ook van onzichtbaar
  var fade = el.hasAttribute('data-p-fade') && !/^(0|false)$/.test(el.getAttribute('data-p-fade'));
  return { xPercent: num(el, 'data-p-x', 0), yPercent: num(el, 'data-p-y', 0), rotation: num(el, 'data-p-rot', 0), scale: num(el, 'data-p-scale', 1), opacity: fade ? 0 : 1 };
}
function hideParts(gsap, els) { els.forEach(function (el) { gsap.killTweensOf(el); gsap.set(el, startOf(el)); }); }
function playParts(gsap, els) {
  els.forEach(function (el) {
    var d = num(el, 'data-p-delay', 0);
    if (el.hasAttribute('data-p-clip')) return gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, delay: d, ease: EASE, clearProps: 'clipPath' });
    var rise = el.hasAttribute('data-p-rise');
    // opacity zoals de css-standaard `ease` (power1.out), beweging met de ontwerp-easing
    gsap.to(el, { opacity: 1, duration: 0.8, delay: d, ease: 'power1.out' });
    gsap.to(el, rise ? { y: 0, duration: 0.9, delay: d, ease: EASE, clearProps: 'transform,opacity' }
      : { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, duration: 1, delay: d, ease: EASE, clearProps: 'transform,opacity' });
  });
}

/* In beeld: fn(ok, seen) bij elke wijziging. ok = minstens `at` van el zichtbaar (nooit meer dan er in het venster past),
   seen = iets van el zichtbaar. */
var steps = [];
for (var i = 0; i <= 20; i++) steps.push(i / 20);

var modules = [
  ['reveal', '[data-p-reveal]'],
  ['photos', '[data-p-photos]'],
  ['seal', '[data-p-seal]'],
  ['btn', '[data-p-btn]'],
  ['marquee', '[data-p-marquee]'],
  ['products', '[data-p-products]'],
  ['cases', '[data-p-cases]'],
  ['testimonials', '[data-p-testimonials]']
];
// Lokaal de gewone bestanden, op jsDelivr de .min-bestanden (die maakt jsDelivr bij het eerste verzoek)
var dir = new URL('modules/', import.meta.url).href, ext = /\.min\.js/.test(import.meta.url) ? '.min.js' : '.js';

/* Wat een module krijgt. Listeners, timers, frames, observers en tweens via a ruimt a.clean op; wat de module verder aan de
   DOM verandert, geeft hij door met a.undo(fn). */
function scope() {
  var a = {}, ac = new AbortController(), undos = [], timers = new Set(), live = [], dead = false;
  // Afgelopen tweens hebben geen parent meer; laat de lijst niet groeien bij elke hover
  function track(t) { if (live.length > 80) live = live.filter(function (x) { return x.parent; }); live.push(t); return t; }
  a.reduce = reduce;
  a.ease = EASE;
  a.each = each;
  a.num = num;
  a.listen = function (target, type, fn, options) { target.addEventListener(type, fn, Object.assign({ signal: ac.signal }, options)); };
  a.wait = function (fn, ms) { var id = setTimeout(function () { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  a.raf = function (fn) { return requestAnimationFrame(function (t) { if (!dead) fn(t); }); };
  a.undo = function (fn) { undos.push(fn); };
  a.view = function (el, at, fn) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var need = Math.min(at, (window.innerHeight - 100) / (e.boundingClientRect.height || 1));
        fn(e.isIntersecting && e.intersectionRatio >= need - 0.001, e.isIntersecting);
      });
    }, { threshold: steps });
    io.observe(el);
    undos.push(function () { io.disconnect(); });
  };
  Object.defineProperty(a, 'lenis', { get: getLenis });
  a.withGsap = function (fn) {
    withGsap(function (gsap) {
      if (dead) return;
      // Zelfde gsap, maar elke tween komt op de opruimlijst
      var g = Object.create(gsap);
      ['to', 'from', 'fromTo', 'timeline', 'delayedCall'].forEach(function (name) { g[name] = function () { return track(gsap[name].apply(gsap, arguments)); }; });
      fn(g);
    });
  };
  a.parts = function (root) { return [].slice.call(root.querySelectorAll(PARTS)); };
  a.hide = function (els) { withGsap(function (g) { hideParts(g, els); }); };
  a.play = function (els) { a.withGsap(function (g) { playParts(g, els); }); };
  a.clean = function () {
    if (dead) return;
    dead = true;
    ac.abort();
    timers.forEach(clearTimeout);
    live.forEach(function (t) { t.kill(); });
    undos.reverse().forEach(function (fn) { fn(); });
  };
  return a;
}

var cleaners = [];
var wanted = modules.filter(function (m) { return document.querySelector(m[1]); });
// Laadt GSAP niet binnen 3 s, dan start niets en staat alles in de eindstand
var gsapReady = new Promise(function (done) { var cap = setTimeout(done, 3000); withGsap(function () { clearTimeout(cap); done(); }); });

export var ready = Promise.all(wanted.map(function (m) {
  return import(dir + m[0] + ext).catch(function (e) { console.error('Profile Dynamics: module ' + m[0] + ' niet geladen', e); });
}).concat(gsapReady)).then(function (loaded) {
  if (window.gsap) wanted.forEach(function (m, i) {
    if (!loaded[i]) return;
    // Een fout in één module mag de andere niet stoppen
    try { cleaners.push(loaded[i].init(document, scope())); } catch (e) { console.error('Profile Dynamics: module ' + m[0] + ' fout', e); }
  });
  html.setAttribute('data-p-ready', '');
});

/* Alles opruimen (testpagina; een paginaovergang is er op deze site niet) */
export function stop() {
  cleaners.forEach(function (clean) { if (clean) clean(); });
  cleaners = [];
}
