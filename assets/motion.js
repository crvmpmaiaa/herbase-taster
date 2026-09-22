/* Scroll motion layer. Sits on top of the page's own .rv reveal observer and
   adds the things that make a long page feel alive: headings that wipe in,
   numbers that count up, images that drift against the scroll, dark sections
   that rise into view and rules that draw themselves. Transform and opacity
   only, one rAF, nothing runs under prefers-reduced-motion. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var doc = document, root = doc.documentElement;
  root.classList.add('motion');

  /* 1. Headings: wrap the text so the clip can sit on a child. A clip-path
        on the observed element itself zeroes its intersection ratio. */
  doc.querySelectorAll('h1.dsp.rv, h2.dsp.rv, .head h2.dsp, .reiss__pull q').forEach(function (h) {
    if (h.querySelector('.wipe')) return;
    var s = doc.createElement('span'); s.className = 'wipe';
    while (h.firstChild) s.appendChild(h.firstChild);
    h.appendChild(s);
    h.classList.add('rv--wipe');
  });

  /* 2. Sections and blocks that need their own "in" state. */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.matches('.strip')) count(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  doc.querySelectorAll('.strip, .turn, .reiss, .aggr, .tbl, .foot, .best__grid, .shopgroup, .jlist, .pdp, .prose').forEach(function (el) { io.observe(el); });

  /* 3. Counters: the strip numbers run up to their value once, ~1s, eased. */
  function count(strip) {
    strip.querySelectorAll('.strip__n').forEach(function (n) {
      var txt = n.textContent.trim(), end = parseInt(txt, 10);
      if (isNaN(end)) return;
      var start = end > 1000 ? end - 40 : 0, t0 = null, dur = 1100;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur); p = 1 - Math.pow(1 - p, 4);
        n.textContent = String(Math.round(start + (end - start) * p));
        if (p < 1) requestAnimationFrame(step); else n.textContent = txt;
      }
      requestAnimationFrame(step);
    });
  }

  /* 4. Parallax: images drift against the scroll inside their frames. */
  var plx = [];
  doc.querySelectorAll('.prod__img img, .card2__img img, .jcard__img img, .article__lead img, .pdp__img img, .close__shot img').forEach(function (img) {
    var frame = img.parentElement;
    if (!frame || frame.closest('.hero')) return;
    frame.classList.add('plx');
    plx.push({ img: img, frame: frame, k: frame.matches('.article__lead, .jcard__img') ? 0.12 : 0.08 });
  });
  var ticking = false, vh = innerHeight;
  addEventListener('resize', function () { vh = innerHeight; }, { passive: true });
  function frame() {
    ticking = false;
    for (var i = 0; i < plx.length; i++) {
      var r = plx[i].frame.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      var c = (r.top + r.height / 2 - vh / 2) / vh;      /* -0.5 above centre … +0.5 below */
      plx[i].img.style.transform = 'translate3d(0,' + (c * plx[i].k * -100).toFixed(2) + '%,0) scale(1.12)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (plx.length) { addEventListener('scroll', onScroll, { passive: true }); frame(); }
})();
