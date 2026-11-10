/* Profile Dynamics home/modules/testimonials.js: data-p-testimonials (Section - Testimonials). Eén kaart (data-p-tcard) tegelijk;
   de kaarten liggen in dezelfde gridcel (class). Wisselen met data-p-prev en data-p-next of een klik op een dot, eindeloos rond.
   Oude kaart uit: opacity 0,4 s en 16 px naar rechts in 0,6 s; nieuwe kaart in na 0,15 s: opacity 0,6 s, vanaf 16 px rechts
   in 0,8 s. Dots: de code maakt er één per kaart van de eerste data-p-tdot; rust = achtergrond van de class, actief = de
   tekstkleur (color) van de class, overgang 0,4 s. Reduced motion: zonder overgang. */
export function init(container, a) {
  a.withGsap(function (gsap) {
    a.each('[data-p-testimonials]', function (sec) {
      var cards = [].slice.call(sec.querySelectorAll('[data-p-tcard]'));
      if (cards.length < 2) return;
      var t = a.reduce.matches ? 0 : 1, cur = 0;
      var first = sec.querySelector('[data-p-tdot]'), dots = [], off = '', on = '';
      if (first) {
        var extra = [].slice.call(sec.querySelectorAll('[data-p-tdot]')).slice(1);
        extra.forEach(function (d) { d.remove(); });
        dots = cards.map(function (c, i) { return i ? first.parentNode.appendChild(first.cloneNode(true)) : first; });
        var cs = getComputedStyle(first);
        off = cs.backgroundColor; on = cs.color;
        a.undo(function () { dots.slice(1).forEach(function (d) { d.remove(); }); extra.forEach(function (d) { first.parentNode.appendChild(d); }); gsap.set(first, { clearProps: 'backgroundColor' }); });
      }
      cards[0].parentNode.setAttribute('aria-live', 'polite');
      cards.forEach(function (c, i) {
        c.setAttribute('aria-hidden', String(i !== 0));
        if (i) gsap.set(c, { autoAlpha: 0, x: 16 });
      });
      dots.forEach(function (d, i) { gsap.set(d, { backgroundColor: i ? off : on }); });
      function show(n) {
        var old = cards[cur];
        cur = (n + cards.length) % cards.length;
        var nu = cards[cur];
        if (old === nu) return;
        gsap.killTweensOf([old, nu]);
        cards.forEach(function (c, i) { c.setAttribute('aria-hidden', String(i !== cur)); });
        gsap.to(old, { opacity: 0, duration: 0.4 * t, ease: 'power1.out', onComplete: function () { gsap.set(old, { visibility: 'hidden' }); } });
        gsap.to(old, { x: 16, duration: 0.6 * t, ease: a.ease });
        gsap.set(nu, { visibility: 'visible' });
        gsap.to(nu, { opacity: 1, duration: 0.6 * t, delay: 0.15 * t, ease: 'power1.out' });
        gsap.to(nu, { x: 0, duration: 0.8 * t, delay: 0.15 * t, ease: a.ease });
        dots.forEach(function (d, i) { gsap.to(d, { backgroundColor: i === cur ? on : off, duration: 0.4 * t, ease: 'power1.out', overwrite: true }); });
      }
      var prev = sec.querySelector('[data-p-prev]'), next = sec.querySelector('[data-p-next]');
      if (prev) a.listen(prev, 'click', function () { show(cur - 1); });
      if (next) a.listen(next, 'click', function () { show(cur + 1); });
      dots.forEach(function (d, i) { a.listen(d, 'click', function () { show(i); }); });
      a.undo(function () { gsap.set(cards, { clearProps: 'opacity,visibility,transform' }); cards.forEach(function (c) { c.removeAttribute('aria-hidden'); }); });
    });
  });
  return a.clean;
}
