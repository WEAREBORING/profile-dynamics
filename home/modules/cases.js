/* Profile Dynamics home/modules/cases.js: data-p-cases (Section - Case studies). Oneindig, sleepbaar raster van tegels en een
   modal met de hele case. De inhoud komt uit een verborgen CMS-lijst: per case een data-p-case met erin de tegel
   (data-p-case-tile, wordt gekopieerd) en velden data-p-case-field="title|tag|org|text|challenge|approach|result|photos".
   Raster (cases.js van de demo): rastermaat 348 px (224 px onder 768), elke tweede rij een halve maat opgeschoven, rijen drijven
   24 px/s om en om naar rechts en links, slepen met inertie, horizontaal wiel. Tegel-hover: foto 1,05 en de overlay
   (data-p-case-over) komt in beeld. Modal (data-p-case-modal, met data-p-case-backdrop): openen met een klik of Enter, dicht met
   de knop (data-p-case-close), de donkere laag of Escape; vorige en volgende (data-p-prev, data-p-next, pijltjestoetsen); foto's
   wisselen elke 4 s; focus blijft in de modal en gaat bij sluiten terug naar de tegel; de pagina scrolt niet zolang hij open is
   (ook lenis.stop()). Blokken en tekst in de modal (data-p-block, data-p-rise) spelen bij openen en wisselen opnieuw af.
   Toetsenbord: één tabstop per case; een tegel met focus schuift in beeld en de drift staat stil. Zonder code toont CSS - Home
   de CMS-lijst (data-p-cases-list) als rij tegels; de code verbergt hem als het raster staat. */
var DRIFT = 24, DRAG = 1, WHEEL = 0.75, FOLLOW = 0.14, FLICK = 10, PHOTO_S = 4;
// Kleurensets van de blokken in de modal per case (case-nummer mod 4), zoals data-pal in de demo
var PAL = [['yellow', 'green', 'purple'], ['orange', 'light-blue', 'red'], ['light-blue', 'yellow', 'orange'], ['red', 'purple', 'green']];

export function init(container, a) {
  var wide = window.matchMedia('(min-width: 768px)'), mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  a.withGsap(function (gsap) {
    a.each('[data-p-cases]', function (section) {
      var grid = section.querySelector('[data-p-cases-grid]');
      var items = [].slice.call(section.querySelectorAll('[data-p-case]'));
      if (!grid || !items.length) return;
      var reduce = a.reduce;
      var CASES = items.map(function (item) {
        var c = { tile: item.querySelector('[data-p-case-tile]'), text: {}, photos: [] };
        [].forEach.call(item.querySelectorAll('[data-p-case-field]'), function (f) {
          var k = f.getAttribute('data-p-case-field');
          // Webflow publiceert een leeg beeldveld als img.w-dyn-bind-empty en een verborgen element met .w-condition-invisible
          if (k === 'photos') c.photos = [].filter.call(f.querySelectorAll('img'), function (img) { return !img.closest('.w-dyn-bind-empty, .w-condition-invisible'); });
          else c.text[k] = f.textContent.trim();
        });
        return c;
      }).filter(function (c) { return c.tile; });
      if (!CASES.length) return;

      /* ---------- raster ---------- */
      var collection = document.createElement('div');
      collection.style.cssText = 'position:absolute;left:0;top:0;will-change:transform';
      grid.appendChild(collection);
      var gridStyle = grid.style.cssText;
      grid.style.touchAction = 'pan-y';
      grid.style.userSelect = grid.style.webkitUserSelect = 'none';
      grid.style.cursor = 'grab';
      if (getComputedStyle(grid).position === 'static') grid.style.position = 'relative';
      a.undo(function () { collection.remove(); grid.style.cssText = gridStyle; });
      // Zonder code staat de CMS-lijst als rij tegels over het vlak (CSS - Home); nu het raster er is, weg
      var list = section.querySelector('[data-p-cases-list]');
      if (list) { list.style.display = 'none'; a.undo(function () { list.style.display = ''; }); }
      // Het vlak scrolt nooit zelf: de browser schuift het (overflow hidden) anders naar een tegel met focus
      a.listen(grid, 'scroll', function () { grid.scrollLeft = grid.scrollTop = 0; });

      var PITCH = 348, W = 0, H = 0, cx = 0, cy = 0, tx = 0, ty = 0, phase = 0, rows = [], built = false, running = false, lastT = 0, visible = false;
      var down = false, moved = false, sx = 0, sy = 0, lx = 0, ly = 0, lastDx = 0, lastDy = 0, focused = false;
      function tile(i, focusable) {
        var cell = document.createElement('div');
        var pad = wide.matches ? 24 : 12;
        cell.style.cssText = 'flex:none;box-sizing:border-box;width:' + PITCH + 'px;height:' + PITCH + 'px;padding:' + pad + 'px';
        var el = CASES[i].tile.cloneNode(true);
        el.removeAttribute('id');
        el.style.width = el.style.height = '100%';
        el.style.boxSizing = 'border-box';
        el.setAttribute('data-p-case-index', i);
        el.setAttribute('draggable', 'false');
        [].forEach.call(el.querySelectorAll('img'), function (img) { img.setAttribute('draggable', 'false'); img.style.pointerEvents = 'none'; });
        if (!focusable) { el.setAttribute('tabindex', '-1'); el.setAttribute('aria-hidden', 'true'); }
        else {
          if (!el.matches('a[href], button')) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); }
          if (CASES[i].text.title) el.setAttribute('aria-label', CASES[i].text.title);
        }
        cell.appendChild(el);
        return cell;
      }
      // Elke rij is een strook die zijwaarts wikkelt (twee keer dezelfde rij achter elkaar); verticaal wikkelt het hele raster (2 kopieën)
      function build() {
        PITCH = wide.matches ? 348 : 224;
        var cols = Math.max(4, Math.ceil(grid.clientWidth / PITCH) + 1), nrows = Math.max(3, Math.ceil(grid.clientHeight / PITCH) + 1);
        if (nrows % 2) nrows++;   // even, zodat het verspringen klopt bij het verticale wikkelen
        W = cols * PITCH; H = nrows * PITCH;
        collection.textContent = '';
        rows = [];
        // Eén tabstop per case: de eerste tegel van elke case in de eerste kopie (review #1)
        var seen = {};
        for (var l = 0; l < 2; l++) {
          var copy = document.createElement('div');
          copy.style.cssText = 'position:absolute;left:0;width:0;top:' + (l * H) + 'px;height:' + H + 'px';
          if (l) copy.setAttribute('aria-hidden', 'true');
          for (var r = 0; r < nrows; r++) {
            var row = document.createElement('div');
            row.style.cssText = 'position:absolute;left:0;display:flex;will-change:transform;top:' + (r * PITCH) + 'px';
            for (var c = 0; c < cols * 2; c++) {
              var i = (r * cols + (c % cols)) % CASES.length, focus = l === 0 && c < cols && !seen[i];
              var cell = row.appendChild(tile(i, focus));
              if (focus) { seen[i] = true; cell.firstChild._pPos = { c: c, r: r, odd: r % 2 === 1 }; }
            }
            copy.appendChild(row);
            rows.push({ el: row, odd: r % 2 === 1 });
          }
          collection.appendChild(copy);
        }
        if (!built) { cx = tx = PITCH * 0.25; cy = ty = PITCH; built = true; }
        apply();
      }
      // Een halve pixel voor de naad telt als 0: een tegel met focus op de rand (eerste kolom of rij) springt dan niet naar de kopie
      function wrap(v, m) { v = ((v % m) + m) % m; return v > m - 0.5 ? v - m : v; }
      function apply() {
        collection.style.transform = 'translate3d(0,' + (-wrap(cy, H)).toFixed(1) + 'px,0)';
        rows.forEach(function (q) {
          var off = cx + (q.odd ? PITCH / 2 + phase : -phase);   // 1e, 3e, ... rij naar rechts, 2e, 4e, ... naar links
          q.el.style.transform = 'translate3d(' + (-wrap(off, W)).toFixed(1) + 'px,0,0)';
        });
      }
      function drifting() { return visible && !open && !down && !focused && !reduce.matches; }
      // Toetsenbord: een tegel met focus die niet helemaal in beeld staat, schuift naar het midden (of zo ver als het wikkelen toelaat)
      function near(d, m) { return d - Math.round(d / m) * m; }
      function into(el) {
        var p = el._pPos;
        if (!p) return;
        var gw = grid.clientWidth, gh = grid.clientHeight, ox = tx + (p.odd ? PITCH / 2 + phase : -phase);
        var x = p.c * PITCH - wrap(ox, W), y = p.r * PITCH - wrap(ty, H);
        if (x < -1 || x > gw - PITCH + 1) tx += near(Math.max(0, p.c * PITCH - (gw - PITCH) / 2) - wrap(ox, W), W);
        if (y < -1 || y > gh - PITCH + 1) ty += near(Math.max(0, p.r * PITCH - (gh - PITCH) / 2) - wrap(ty, H), H);
        kick();
      }
      function loop(now) {
        var dt = lastT ? Math.min(64, now - lastT) : 16;
        lastT = now;
        if (drifting()) phase += DRIFT * dt / 1000;
        var dx = tx - cx, dy = ty - cy;
        if (reduce.matches) { cx = tx; cy = ty; apply(); running = false; lastT = 0; return; }
        cx += dx * FOLLOW; cy += dy * FOLLOW;
        apply();
        if (drifting() || Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) a.raf(loop); else { running = false; lastT = 0; }
      }
      function kick() { if (!running) { running = true; lastT = 0; a.raf(loop); } }

      // Raster komt in beeld met een fade (0,8 s), zoals data-reveal in de demo
      if (!reduce.matches) gsap.set(grid, { opacity: 0 });
      a.view(grid, 0.3, function (ok, seen) {
        visible = seen;
        if (seen) kick();
        if (reduce.matches) return;
        if (ok) gsap.to(grid, { opacity: 1, duration: 0.8, ease: 'power1.out', overwrite: true });
        else if (!seen) { gsap.killTweensOf(grid); gsap.set(grid, { opacity: 0 }); }
      });

      /* ---------- slepen, wiel, hover ---------- */
      var hint = section.querySelector('[data-p-cases-hint]');
      function hideHint() { if (hint) gsap.to(hint, { opacity: 0, duration: 0.5, ease: 'power1.out' }); hint = null; }
      a.listen(grid, 'pointerdown', function (e) {
        if (e.button !== 0 || open) return;
        down = true; moved = false; sx = lx = e.clientX; sy = ly = e.clientY; lastDx = lastDy = 0;
      });
      a.listen(window, 'pointermove', function (e) {
        if (!down) return;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
        if (!moved) { moved = true; grid.style.cursor = 'grabbing'; hideHint(); }
        lastDx = (e.clientX - lx) * DRAG; lastDy = (e.clientY - ly) * DRAG; lx = e.clientX; ly = e.clientY;
        tx -= lastDx; ty -= lastDy;
        kick();
      });
      function release() {
        if (!down) return;
        down = false;
        if (moved) { tx -= lastDx * FLICK; ty -= lastDy * FLICK; }
        grid.style.cursor = 'grab';
        kick();
      }
      a.listen(window, 'pointerup', release);
      a.listen(window, 'pointercancel', release);
      a.listen(grid, 'wheel', function (e) {
        var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
        if (!horizontal || open) return;   // verticaal blijft de pagina scrollen
        e.preventDefault();
        tx += (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * WHEEL;
        kick();
        hideHint();
      }, { passive: false });
      a.listen(grid, 'dragstart', function (e) { e.preventDefault(); });
      function tileOf(node) { return node && node.closest ? node.closest('[data-p-case-index]') : null; }
      function hover(el, on) {
        var img = el.querySelector('img'), over = el.querySelector('[data-p-case-over]'), t = reduce.matches ? 0 : 1;
        if (img) gsap.to(img, { scale: on ? 1.05 : 1, duration: 0.8 * t, ease: a.ease, overwrite: true });
        // Onder 768 staat de overlay altijd aan (class), dan niet aanraken
        if (over && wide.matches) gsap.to(over, { opacity: on ? 1 : 0, duration: 0.35 * t, ease: 'power1.out', overwrite: true });
      }
      a.listen(collection, 'mouseover', function (e) { var el = tileOf(e.target); if (el && mouse.matches && !el.contains(e.relatedTarget)) hover(el, true); });
      a.listen(collection, 'mouseout', function (e) { var el = tileOf(e.target); if (el && mouse.matches && !el.contains(e.relatedTarget)) hover(el, false); });
      a.listen(collection, 'focusin', function (e) {
        var el = tileOf(e.target);
        if (!el) return;
        hover(el, true);
        // Alleen bij focus met het toetsenbord stopt de drift en schuift het raster; een klik met de muis laat alles staan
        if (el.matches(':focus-visible')) { focused = true; into(el); }
      });
      a.listen(collection, 'focusout', function (e) {
        var el = tileOf(e.target);
        if (el) hover(el, false);
        if (!collection.contains(e.relatedTarget)) { focused = false; kick(); }
      });

      /* ---------- modal ---------- */
      var modal = section.querySelector('[data-p-case-modal]'), backdrop = section.querySelector('[data-p-case-backdrop]');
      var open = false, cur = 0, opener = null, slide = 0, photoCall = null;
      a.listen(collection, 'click', function (e) {
        var el = e.target.closest('[data-p-case-index]');
        if (!el) return;
        e.preventDefault();   // een tegel als link naar de casepagina werkt zonder code nog wel
        if (moved) { moved = false; return; }
        if (modal) openCase(+el.getAttribute('data-p-case-index'), el);
      });
      a.listen(collection, 'keydown', function (e) {
        var el = e.target.closest('[data-p-case-index]');
        if (el && el.getAttribute('role') === 'button' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (modal) openCase(+el.getAttribute('data-p-case-index'), el); }
      });
      if (modal) {
        var close = modal.querySelector('[data-p-case-close]');
        var prev = modal.querySelector('[data-p-prev]'), next = modal.querySelector('[data-p-next]');
        var slides = modal.querySelector('[data-p-case-field="photos"]'), numEl = modal.querySelector('[data-p-case-num]');
        var parts = a.parts(modal), blocks = parts.filter(function (el) { return el.hasAttribute('data-p-block'); });
        var lenisWasStopped = false;
        if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');
        // Lenis laat het wiel in de modal dan door (de modal scrolt zelf als hij hoger is dan het scherm)
        modal.setAttribute('data-lenis-prevent', '');
        if (slides && getComputedStyle(slides).position === 'static') slides.style.position = 'relative';
        var pad2 = function (n) { return ('0' + n).slice(-2); };
        var show = function (n) {
          var imgs = slides ? slides.children : [];
          if (!imgs.length) return;
          var t = reduce.matches ? 0 : 1, old = imgs[slide];
          slide = (n + imgs.length) % imgs.length;
          if (old !== imgs[slide]) gsap.to(old, { opacity: 0, duration: 0.6 * t, ease: 'power1.out' });
          gsap.to(imgs[slide], { opacity: 1, duration: 0.6 * t, ease: 'power1.out' });
        };
        var photoAuto = function (on) {
          if (photoCall) photoCall.kill();
          photoCall = null;
          if (!on || reduce.matches || !slides || slides.children.length < 2) return;
          photoCall = gsap.delayedCall(PHOTO_S, function tick() { show(slide + 1); photoCall = gsap.delayedCall(PHOTO_S, tick); });
        };
        var fill = function (i) {
          var c = CASES[i];
          cur = i;
          [].forEach.call(modal.querySelectorAll('[data-p-case-field]'), function (el) {
            var k = el.getAttribute('data-p-case-field');
            if (k !== 'photos' && k in c.text) el.textContent = c.text[k];
          });
          if (slides) {
            slides.textContent = '';
            c.photos.forEach(function (p, n) {
              var img = p.cloneNode(true);
              img.removeAttribute('id');
              img.removeAttribute('loading');
              img.setAttribute('draggable', 'false');
              if (!img.getAttribute('alt')) img.setAttribute('alt', (c.text.title || 'Case study') + ', foto ' + (n + 1));
              img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:' + (n ? 0 : 1);
              slides.appendChild(img);
            });
            slide = 0;
          }
          if (numEl) numEl.textContent = pad2(i + 1) + ' / ' + pad2(CASES.length);
          if (c.text.title) modal.setAttribute('aria-label', c.text.title);
          blocks.forEach(function (b, k) {
            var col = 'var(--color--brand--' + PAL[i % 4][k % 3] + ')', cs = getComputedStyle(b);
            if (parseFloat(cs.borderTopWidth)) b.style.borderColor = col;
            else if (cs.boxShadow !== 'none') b.style.boxShadow = cs.boxShadow.replace(/rgba?\([^)]*\)/, col);
            else b.style.backgroundColor = col;
          });
          photoAuto(true);
        };
        var replay = function () { if (!reduce.matches) { a.hide(parts); a.play(parts); } };
        var lock = function (on) {
          var l = a.lenis;
          if (l && on) { lenisWasStopped = !!l.isStopped; l.stop(); }
          else if (l && !lenisWasStopped) l.start();
          document.documentElement.style.overflow = document.body.style.overflow = on ? 'hidden' : '';
        };
        var openCase = function (i, from) {
          if (!CASES[i]) return;
          var t = reduce.matches ? 0 : 1, layers = [modal, backdrop].filter(Boolean);
          gsap.killTweensOf(layers);
          fill(i);
          opener = from || null;
          if (!open) {
            open = true;
            layers.forEach(function (el) { el.setAttribute('data-p-open', ''); });
            modal.setAttribute('aria-hidden', 'false');
            lock(true);
            gsap.fromTo(layers, { opacity: 0 }, { opacity: 1, duration: 0.5 * t, ease: 'power1.out' });
            gsap.from(modal, { y: '+=24', duration: 0.7 * t, ease: a.ease, clearProps: 'transform' });
          }
          replay();
          a.wait(function () { if (open && close) close.focus({ preventScroll: true }); }, 50);
        };
        var step = function (d) { if (open) { fill((cur + d + CASES.length) % CASES.length); replay(); } };
        var closeCase = function () {
          if (!open) return;
          open = false;
          photoAuto(false);
          var t = reduce.matches ? 0 : 1, layers = [modal, backdrop].filter(Boolean);
          gsap.killTweensOf(layers);
          gsap.to(layers, { opacity: 0, duration: 0.5 * t, ease: 'power1.out', onComplete: function () {
            layers.forEach(function (el) { el.removeAttribute('data-p-open'); });
            gsap.set(layers, { clearProps: 'opacity,transform' });
          } });
          modal.setAttribute('aria-hidden', 'true');
          lock(false);
          if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
          kick();
        };
        if (close) a.listen(close, 'click', closeCase);
        if (backdrop) a.listen(backdrop, 'click', closeCase);
        if (prev) a.listen(prev, 'click', function () { step(-1); });
        if (next) a.listen(next, 'click', function () { step(1); });
        a.listen(document, 'keydown', function (e) {
          if (!open) return;
          if (e.key === 'Escape') closeCase();
          else if (e.key === 'ArrowLeft') step(-1);
          else if (e.key === 'ArrowRight') step(1);
          else if (e.key === 'Tab') {
            // Focus blijft in de modal
            var f = [].filter.call(modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'), function (el) { return el.getClientRects().length; });
            if (!f.length) return;
            var first = f[0], last = f[f.length - 1], at = document.activeElement;
            if (!modal.contains(at)) { e.preventDefault(); first.focus(); }
            else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
          }
        });
        a.undo(function () { if (open) { lock(false); [modal, backdrop].forEach(function (el) { if (el) el.removeAttribute('data-p-open'); }); } });
      }

      /* ---------- start en herbouwen bij andere breedte ---------- */
      var rt = 0, lastW = 0;
      a.listen(window, 'resize', function () { clearTimeout(rt); rt = a.wait(function () { if (grid.clientWidth !== lastW) { lastW = grid.clientWidth; build(); } }, 200); });
      lastW = grid.clientWidth;
      build();
    });
  });
  return a.clean;
}
