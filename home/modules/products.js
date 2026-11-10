/* Profile Dynamics home/modules/products.js: data-p-products (de vier balken van de Product Suite), per balk data-p-product
   met erin -num, -label (naam), -vlabel (verticale naam, desktop), -detail (wit vlak) en -ill (illustratie, in het detail).
   Verschijnen: zodra 90% van de stack in beeld is (waarde van data-p-products) komen de balken één voor één van boven tevoorschijn
   (clip-path, 0,7 s, 0,1 s ertussen); helemaal uit beeld direct terug.
   Openen: muis erop (desktop), tik (touch; tik op een open balk sluit), focus; dicht bij muis van de stack af, focus eruit, Escape.
   De open balk groeit met een veer op flex-grow (zoals main.js van de demo): vanaf 992 px in de breedte, daaronder in de hoogte
   (de richting komt uit de class). Wat in de demo de css deed (cijfer, namen, detail, illustratie) doet hier GSAP, met de
   waarden uit animatiewaarden.md en responsive.css. De ruststand komt uit de classes; de code verbergt bij het starten het detail,
   de illustratie en de verticale naam. */
var GROW = 10, STIFF = 55, STIFF_OUT = 100;

export function init(container, a) {
  var wide = window.matchMedia('(min-width: 992px)'), tablet = window.matchMedia('(min-width: 768px)'), noHover = window.matchMedia('(hover: none)');
  a.withGsap(function (gsap) {
    a.each('[data-p-products]', function (stack) {
      var panels = [].slice.call(stack.querySelectorAll('[data-p-product]'));
      if (!panels.length) return;
      var t = a.reduce.matches ? 0 : 1;
      var X = panels.map(function (p) {
        function q(s) { return p.querySelector('[data-p-product-' + s + ']'); }
        var detail = q('detail'), ill = q('ill');
        // Tekst in het detail: de kinderen, of de kinderen van het enige tekstblok (kop, tekst, punten, knop)
        var text = detail ? [].filter.call(detail.children, function (el) { return el !== ill && !el.contains(ill); }) : [];
        if (text.length === 1 && text[0].children.length > 1) text = [].slice.call(text[0].children);
        var x = { p: p, num: q('num'), label: q('label'), vlabel: q('vlabel'), detail: detail, ill: ill, text: text };
        x.parts = [x.num, x.label, x.vlabel, detail, ill].concat(text).filter(Boolean);
        return x;
      });
      var all = [].concat.apply([], X.map(function (x) { return x.parts; }));
      var PROPS = 'left,top,bottom,fontSize,transform,opacity,pointerEvents';
      function css(el, prop) { return el ? getComputedStyle(el)[prop] : ''; }

      // Ruststand uit de classes (opnieuw bij een andere breedte)
      function base() {
        gsap.killTweensOf(all);
        gsap.set(all, { clearProps: PROPS });
        X.forEach(function (x) {
          x.rest = { numLeft: css(x.num, 'left'), numTop: css(x.num, 'top'), numFs: parseFloat(css(x.num, 'fontSize')), labelBottom: css(x.label, 'bottom'), labelFs: parseFloat(css(x.label, 'fontSize')), vLeft: css(x.vlabel, 'left') };
          if (x.detail) gsap.set(x.detail, { opacity: 0, pointerEvents: 'none' });
          x.text.forEach(function (el) { gsap.set(el, { opacity: 0, y: el.hasAttribute('data-p-btn') ? 0 : 16 }); });
          if (x.ill) gsap.set(x.ill, { opacity: 0, y: 16 });
          if (x.vlabel) gsap.set(x.vlabel, { opacity: 0 });
        });
      }
      function go(el, vars, d, delay) { if (el) gsap.to(el, Object.assign({ duration: d * t, delay: (delay || 0) * t, ease: a.ease }, vars)); }
      function fade(el, o, d, delay) { if (el) gsap.to(el, { opacity: o, duration: d * t, delay: (delay || 0) * t, ease: 'power1.out' }); }

      // Stand van één balk: 'rest' (niets open), 'on' (deze open) of 'off' (een andere open)
      function look(x, s) {
        var r = x.rest, on = s === 'on', off = s === 'off';
        // Eerst alles van deze balk stoppen: een uitgestelde tween van de vorige stand mag de nieuwe niet overschrijven
        gsap.killTweensOf(x.parts);
        if (wide.matches) {
          go(x.num, off ? { left: '50%', xPercent: -50, x: 0, fontSize: r.numFs * 0.5 } : { left: r.numLeft, xPercent: 0, x: on ? 10 : 0, fontSize: r.numFs }, 0.5);
          fade(x.label, s === 'rest' ? 1 : 0, 0.3);
          go(x.vlabel, off ? { left: '50%', xPercent: -50 } : { left: r.vLeft, xPercent: 0 }, 0.5);
          fade(x.vlabel, off ? 1 : 0, 0.3);
        } else {
          // Onder elkaar: dichte balken krijgen cijfer en naam klein en verticaal in het midden (responsive.css)
          var small = !tablet.matches;
          go(x.num, off ? { top: '50%', yPercent: -50, y: 0, fontSize: r.numFs * (small ? 0.5 : 0.46) } : { top: r.numTop, yPercent: 0, y: on ? 12 : 0, fontSize: r.numFs }, 0.5);
          go(x.label, off ? { bottom: '50%', yPercent: 50, x: small ? 44 : 52, fontSize: r.labelFs * (small ? 0.75 : 0.72) } : { bottom: r.labelBottom, yPercent: 0, x: 0, fontSize: r.labelFs }, 0.5);
          fade(x.label, on ? 0 : 1, 0.3);
        }
        fade(x.detail, on ? 1 : 0, on ? 0.4 : 0.22, on ? 0.25 : 0);
        if (x.detail) x.detail.style.pointerEvents = on ? 'auto' : 'none';
        x.text.concat(x.ill ? [x.ill] : []).forEach(function (el, i) {
          var delay = el === x.ill ? 0.65 : 0.35 + i * 0.15;
          fade(el, on ? 1 : 0, on ? 0.9 : 0.2, on ? delay : 0);
          // De knop alleen crossfade, geen beweging
          if (!el.hasAttribute('data-p-btn')) go(el, { y: on ? 0 : 16 }, on ? 0.9 : 0.2, on ? delay : 0);
        });
      }

      // Veer op flex-grow, kritisch gedempt (main.js van de demo)
      var cur = panels.map(function () { return 1; }), vel = cur.map(function () { return 0; }), tgt = cur.slice();
      var stiff = STIFF, running = false, last = 0, active = null;
      function apply() { panels.forEach(function (p, i) { p.style.flexGrow = cur[i].toFixed(4); }); }
      function step(now) {
        var dt = Math.max(0, Math.min(0.032, (now - last) / 1000)), c = 2 * Math.sqrt(stiff), moving = false;
        last = now;
        for (var i = 0; i < panels.length; i++) {
          vel[i] += (stiff * (tgt[i] - cur[i]) - c * vel[i]) * dt;
          cur[i] += vel[i] * dt;
          if (Math.abs(tgt[i] - cur[i]) > 0.0006 || Math.abs(vel[i]) > 0.0006) moving = true; else { cur[i] = tgt[i]; vel[i] = 0; }
        }
        apply();
        if (moving) a.raf(step); else running = false;
      }
      function spring(p) {
        panels.forEach(function (x, i) { tgt[i] = x === p ? GROW : 1; });
        stiff = p ? STIFF : STIFF_OUT;
        if (!t) { cur = tgt.slice(); vel = vel.map(function () { return 0; }); apply(); return; }
        if (!running) { running = true; last = performance.now(); a.raf(step); }
      }
      function activate(p) {
        if (p === active) return;
        active = p;
        X.forEach(function (x) { look(x, x.p === p ? 'on' : 'off'); });
        spring(p);
      }
      function clear() {
        if (!active) return;
        active = null;
        X.forEach(function (x) { look(x, 'rest'); });
        spring(null);
      }
      function reset() {
        active = null;
        cur = cur.map(function () { return 1; }); vel = vel.map(function () { return 0; }); tgt = cur.slice();
        panels.forEach(function (p) { p.style.flexGrow = ''; });
        base();
      }

      base();
      // Naam voor de schermlezer (cijfer en namen zijn aria-hidden). Geen aria-expanded: dat hoort niet bij een article, en de
      // inhoud van het detail is voor een schermlezer altijd leesbaar; open en dicht is alleen beeld (review #12)
      var named = X.filter(function (x) { return x.label && !x.p.hasAttribute('aria-label'); });
      named.forEach(function (x) { x.p.setAttribute('aria-label', x.label.textContent.trim()); });
      panels.forEach(function (p) {
        if (!p.hasAttribute('tabindex')) p.setAttribute('tabindex', '0');
        a.listen(p, 'pointerenter', function (e) { if (e.pointerType === 'mouse') activate(p); });
        a.listen(p, 'focusin', function () { activate(p); });
        a.listen(p, 'pointerdown', function () { p._pWas = p === active; });
        a.listen(p, 'click', function (e) {
          var was = p._pWas;
          p._pWas = false;
          if (was && noHover.matches && !e.target.closest('a')) clear(); else activate(p);
        });
        a.listen(p, 'keydown', function (e) { if (e.key === 'Escape') { clear(); if (document.activeElement) document.activeElement.blur(); } });
      });
      a.listen(stack, 'pointerleave', function (e) { if (e.pointerType === 'mouse') clear(); });
      // Extra: een muisbeweging boven een balk opent hem ook (pointerenter komt niet als de balk onder een stilstaande muis verschijnt)
      a.listen(stack, 'pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var p = e.target.closest('[data-p-product]');
        if (p && p !== active && panels.indexOf(p) > -1) activate(p);
      });
      a.listen(stack, 'focusout', function (e) { if (!stack.contains(e.relatedTarget)) clear(); });
      a.listen(wide, 'change', reset);
      a.listen(tablet, 'change', reset);
      var rt = 0;
      a.listen(window, 'resize', function () { clearTimeout(rt); rt = a.wait(function () { if (!active) base(); }, 200); });

      // Verschijnen bij scrollen
      if (t) {
        var shown = false, hidden = { clipPath: 'inset(0% 0% 100% 0%)' };
        gsap.set(panels, hidden);
        a.view(stack, a.num(stack, 'data-p-products', 0.9), function (ok, seen) {
          if (ok && !shown) {
            shown = true;
            gsap.to(panels, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: a.ease, stagger: 0.1, clearProps: 'clipPath' });
          } else if (!seen && shown) {
            shown = false;
            gsap.killTweensOf(panels, 'clipPath');
            gsap.set(panels, hidden);
            clear();
          }
        });
      }
      a.undo(function () {
        gsap.set(all, { clearProps: PROPS });
        panels.forEach(function (p) { p.style.flexGrow = ''; p.style.clipPath = ''; });
        named.forEach(function (x) { x.p.removeAttribute('aria-label'); });
      });
    });
  });
  return a.clean;
}
