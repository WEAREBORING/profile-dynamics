/* Profile Dynamics home/modules/reveal.js: data-p-reveal. Blokken (data-p-block), stijgers (data-p-rise) en foto's
   (data-p-clip) in een compositie komen binnen zodra die voor een deel in beeld is (waarde van data-p-reveal, standaard 0.3).
   Composities met dezelfde data-p-group starten samen. Helemaal uit beeld (en geen van de groep meer in beeld) gaat alles
   direct terug naar de beginstand, zodat het bij terugscrollen opnieuw speelt, zoals de demo. */
export function init(container, a) {
  if (a.reduce.matches) return a.clean;
  var roots = [].slice.call(container.querySelectorAll('[data-p-reveal]'));
  roots.forEach(function (r) { r._pParts = a.parts(r); r._pIn = false; a.hide(r._pParts); });
  roots.forEach(function (r) {
    var g = r.getAttribute('data-p-group');
    var mates = g ? roots.filter(function (m) { return m.getAttribute('data-p-group') === g; }) : [r];
    a.view(r, a.num(r, 'data-p-reveal', 0.3), function (ok, seen) {
      r._pSeen = seen;
      if (ok) mates.forEach(function (m) { if (!m._pIn) { m._pIn = true; a.play(m._pParts); } });
      else if (!seen && !mates.some(function (m) { return m._pSeen; })) mates.forEach(function (m) { if (m._pIn) { m._pIn = false; a.hide(m._pParts); } });
    });
  });
  a.undo(function () { roots.forEach(function (r) { r._pParts.forEach(function (el) { window.gsap.set(el, { clearProps: 'transform,opacity,clipPath' }); }); }); });
  return a.clean;
}
