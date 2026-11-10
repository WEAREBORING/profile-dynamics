/* Profile Dynamics home/modules/marquee.js: data-p-marquee (lopende band met logo's). Het eerste kind is de set (rij logo's,
   met rechts dezelfde ruimte als tussen de logo's); de code zet er kopieën naast tot de band vol is en schuift alles eindeloos
   naar links: 80 s per set van 20 logo's (4 s per logo). Pauze bij hover. Randen vervagen (mask van 8%). Reduced motion: geen
   kopieën, de set staat gecentreerd en mag afbreken. */
export function init(container, a) {
  a.withGsap(function (gsap) {
    a.each('[data-p-marquee]', function (band) {
      var set = band.firstElementChild;
      if (!set) return;
      var mask = 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)';
      band.style.webkitMaskImage = band.style.maskImage = mask;
      a.undo(function () { band.style.webkitMaskImage = band.style.maskImage = ''; });
      if (a.reduce.matches) {
        set.style.flexWrap = 'wrap';
        set.style.justifyContent = 'center';
        a.undo(function () { set.style.flexWrap = set.style.justifyContent = ''; });
        return;
      }
      var copies = [], tween = null, width = 0;
      function build() {
        if (tween) tween.kill();
        copies.forEach(function (c) { c.remove(); });
        copies = [];
        gsap.set(set, { x: 0 });
        var w = set.getBoundingClientRect().width;
        if (!w) return;
        // Genoeg kopieën om de band plus één set te vullen
        for (var n = Math.ceil(band.clientWidth / w) + 1; n > 0; n--) {
          var c = set.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          c.removeAttribute('id');
          [].forEach.call(c.querySelectorAll('[id]'), function (el) { el.removeAttribute('id'); });
          band.appendChild(c);
          copies.push(c);
        }
        // Stap = afstand tussen het begin van twee sets, dus inclusief een eventuele gap van de band
        var step = copies[0].offsetLeft - set.offsetLeft;
        tween = gsap.fromTo([set].concat(copies), { x: 0 }, { x: -step, duration: 4 * Math.max(1, set.children.length), ease: 'none', repeat: -1 });
        width = band.clientWidth;
      }
      build();
      var rt = 0;
      a.listen(window, 'resize', function () { clearTimeout(rt); rt = a.wait(function () { if (band.clientWidth !== width) build(); }, 150); });
      a.listen(band, 'pointerenter', function (e) { if (e.pointerType === 'mouse' && tween) tween.pause(); });
      a.listen(band, 'pointerleave', function () { if (tween) tween.play(); });
      a.undo(function () { if (tween) tween.kill(); copies.forEach(function (c) { c.remove(); }); gsap.set(set, { clearProps: 'transform' }); });
    });
  });
  return a.clean;
}
