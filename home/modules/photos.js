/* Profile Dynamics home/modules/photos.js: data-p-photos (fotolijst in de hero). De beelden erin liggen over elkaar (class)
   en wisselen met een crossfade: 6 s per foto, overgang 1,2 s lineair; de eerste staat bij laden 4,8 s. Reduced motion: alleen
   de eerste. */
export function init(container, a) {
  a.withGsap(function (gsap) {
    a.each('[data-p-photos]', function (frame) {
      var imgs = [].slice.call(frame.querySelectorAll('img'));
      if (imgs.length < 2) return;
      var cur = 0;
      gsap.set(imgs, { opacity: 0 });
      gsap.set(imgs[0], { opacity: 1 });
      a.undo(function () { gsap.set(imgs, { clearProps: 'opacity' }); });
      if (a.reduce.matches) return;
      // delayedCall loopt op de ticker van GSAP: in een verborgen tabblad stapelen er geen wissels op
      function next() {
        var out = imgs[cur];
        cur = (cur + 1) % imgs.length;
        gsap.to(out, { opacity: 0, duration: 1.2, ease: 'none' });
        gsap.to(imgs[cur], { opacity: 1, duration: 1.2, ease: 'none' });
        gsap.delayedCall(6, next);
      }
      gsap.delayedCall(4.8, next);
    });
  });
  return a.clean;
}
