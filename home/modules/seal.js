/* Profile Dynamics home/modules/seal.js: data-p-seal (Element - Zegel). De ring (data-p-seal-ring) draait in 30 s lineair rond,
   eindeloos; buiten beeld staat hij stil. De letters PD staan stil. Reduced motion: geen draaiing. */
export function init(container, a) {
  if (a.reduce.matches) return a.clean;
  a.withGsap(function (gsap) {
    a.each('[data-p-seal]', function (seal) {
      var ring = seal.querySelector('[data-p-seal-ring]') || (seal.hasAttribute('data-p-seal-ring') ? seal : null);
      if (!ring) return;
      var spin = gsap.to(ring, { rotation: 360, duration: 30, ease: 'none', repeat: -1, paused: true });
      a.view(seal, 0, function (ok, seen) { if (seen) spin.play(); else spin.pause(); });
      a.undo(function () { gsap.set(ring, { clearProps: 'transform' }); });
    });
  });
  return a.clean;
}
