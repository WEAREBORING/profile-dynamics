/* Profile Dynamics home/modules/btn.js: data-p-btn (Button - Pijl, de knoppen van Element - Pijlknoppen, de sluitknop van de
   case-modal). Bij hover (alleen muis op desktop) of toetsenbordfocus, in 0,45 s:
   - Met een vulling (data-p-btn-fill, Button - Pijl): crossfade van de vulling; de ruststand komt uit de class. Gevuld wordt
     leeg en de tekst krijgt de kleur van de vulling; outline wordt gevuld en de tekst krijgt de achtergrondkleur onder de knop
     (wit op een witte sectie, blauw op een blauwe).
   - Zonder vulling (Element - Pijlknoppen, sluitknop): de knop wordt oranje en de pijl zwart (.tarrow in de demo).
   Het pijltje (data-p-btn-icon) beweegt 6 px heen en weer, 1 s per keer, tot de hover of focus stopt; in data-p-prev naar links.
   Reduced motion: wissel zonder overgang, pijltje stil. */
export function init(container, a) {
  var mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  var root = getComputedStyle(document.documentElement);
  var ORANGE = root.getPropertyValue('--color--brand--orange').trim() || '#FFA023';
  var BLACK = root.getPropertyValue('--color--black').trim() || '#111';
  function clear(c) { return !c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c); }
  // Achtergrond onder de knop: de eerste voorouder met een achtergrondkleur
  function behind(el) {
    for (var p = el.parentElement; p; p = p.parentElement) { var c = getComputedStyle(p).backgroundColor; if (!clear(c)) return c; }
    return '#fff';
  }
  a.withGsap(function (gsap) {
    a.each('[data-p-btn]', function (btn) {
      var fill = btn.querySelector('[data-p-btn-fill]'), icon = btn.querySelector('[data-p-btn-icon]');
      var dir = btn.closest('[data-p-prev]') || btn.querySelector('[data-p-prev]') ? -1 : 1;
      var t = a.reduce.matches ? 0 : 1, on = false, bob = null, rest = null, hover = null;
      // Tekst en pijl erven de kleur meestal van de knop; heeft een kind een eigen kleur, dan gaat die mee
      var inks = [btn].concat([].filter.call(btn.children, function (el) { return el !== fill; }));
      function measure() {
        var cs = getComputedStyle(btn);
        rest = { color: cs.color, bg: cs.backgroundColor, fill: fill ? parseFloat(getComputedStyle(fill).opacity) : 0 };
        hover = fill
          ? { color: rest.fill >= 0.5 ? getComputedStyle(fill).backgroundColor : behind(btn), fill: rest.fill >= 0.5 ? 0 : 1 }
          : { color: BLACK, bg: ORANGE };
      }
      function set(v) {
        if (v === on) return;
        if (v && !on) measure();
        on = v;
        var d = 0.45 * t;
        gsap.to(inks, { color: v ? hover.color : rest.color, duration: d, ease: a.ease, overwrite: true, onComplete: v ? null : function () { gsap.set(inks, { clearProps: 'color' }); } });
        if (fill) gsap.to(fill, { opacity: v ? hover.fill : rest.fill, duration: d, ease: 'power1.out', overwrite: true, onComplete: v ? null : function () { gsap.set(fill, { clearProps: 'opacity' }); } });
        else gsap.to(btn, { backgroundColor: v ? hover.bg : rest.bg, duration: d, ease: 'power1.out', overwrite: 'auto', onComplete: v ? null : function () { gsap.set(btn, { clearProps: 'backgroundColor' }); } });
        if (!icon) return;
        // Bij hover-uit stopt het pijltje direct en staat het weer in rust
        if (bob) { bob.kill(); bob = null; gsap.set(icon, { clearProps: 'transform' }); }
        if (v && t) bob = gsap.to(icon, { x: 6 * dir, duration: 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
      }
      function focused() { return btn.matches(':focus-visible') || !!btn.querySelector(':focus-visible'); }
      a.listen(btn, 'pointerenter', function (e) { if (e.pointerType === 'mouse' && mouse.matches) set(true); });
      a.listen(btn, 'pointerleave', function () { if (!focused()) set(false); });
      a.listen(btn, 'focusin', function () { if (focused()) set(true); });
      a.listen(btn, 'focusout', function () { if (!btn.matches(':hover')) set(false); });
      a.undo(function () { gsap.set(inks.concat([fill, icon]).filter(Boolean), { clearProps: 'color,opacity,transform,backgroundColor' }); });
    });
  });
  return a.clean;
}
