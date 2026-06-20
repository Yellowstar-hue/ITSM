/* ===========================================================
   Le Perspective — interactions
   =========================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Loader ---------- */
  const loader = document.getElementById("loader");
  const loaderNum = document.getElementById("loaderNum");

  function revealHero() {
    document.querySelectorAll('.hero [data-stagger]').forEach((el, i) => {
      el.style.transition = "transform .9s var(--ease) " + (i * 0.07) + "s, opacity .9s var(--ease) " + (i * 0.07) + "s";
      requestAnimationFrame(() => {
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      });
    });
    document.querySelectorAll('.hero .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add("in"), 300 + i * 120);
    });
  }

  if (loader && !reduceMotion) {
    let pct = 0;
    const tick = setInterval(() => {
      pct += Math.random() * 16 + 6;
      if (pct >= 100) { pct = 100; clearInterval(tick); finishLoad(); }
      if (loaderNum) loaderNum.textContent = Math.floor(pct);
    }, 110);

    function finishLoad() {
      setTimeout(() => {
        loader.classList.add("is-done");
        document.body.style.overflow = "";
        revealHero();
      }, 350);
    }
    document.body.style.overflow = "hidden";
  } else if (loader) {
    loader.style.display = "none";
    revealHero();
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover: hover)").matches && window.innerWidth > 820) {
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy, shown = false;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { cursor.style.opacity = "1"; shown = true; }
    });

    function renderCursor() {
      cx = lerp(cx, tx, 0.2);
      cy = lerp(cy, ty, 0.2);
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const hoverables = "a, button, .era, .wcard, .cover__item, .hero__title .outline";
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Scroll progress + nav + totop ---------- */
  const progressBar = document.querySelector(".progress__bar");
  const nav = document.getElementById("nav");
  const totop = document.getElementById("totop");
  let lastScroll = 0;

  function onScroll() {
    const st = window.scrollY || document.documentElement.scrollTop;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? (st / docH) * 100 : 0;
    if (progressBar) progressBar.style.width = p + "%";

    if (nav) {
      if (st > 80 && st > lastScroll) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      nav.classList.toggle("is-scrolled", st > 80);
    }
    if (totop) totop.classList.toggle("in", st > window.innerHeight * 1.2);

    lastScroll = st;
    updatePin();
  }

  if (totop) {
    totop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
    );
  }

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => {
      if (!el.closest(".hero")) io.observe(el);
    });

    // Manifesto line-by-line
    const rlines = document.querySelectorAll(".manifesto__lead .rline");
    const lineIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) lineIn(e.target); }),
      { threshold: 0.6 }
    );
    rlines.forEach((l, i) => {
      l.style.opacity = "0";
      l.style.transform = "translateY(40px)";
      l.style.transition = "opacity .8s var(--ease) " + i * 0.06 + "s, transform .8s var(--ease) " + i * 0.06 + "s";
      lineIO.observe(l);
    });
    function lineIn(el) { el.style.opacity = "1"; el.style.transform = "none"; lineIO.unobserve(el); }
  } else {
    document.querySelectorAll(".reveal, .manifesto__lead .rline").forEach((el) => el.classList.add("in"));
  }

  /* ---------- Pinned horizontal timeline ---------- */
  const pin = document.getElementById("pin");
  const track = document.getElementById("track");
  const pinBar = document.getElementById("pinBar");
  let pinMetrics = null;

  function measurePin() {
    if (!pin || !track) return;
    const maxX = track.scrollWidth - window.innerWidth + window.innerWidth * 0.04;
    pinMetrics = {
      top: pin.offsetTop,
      height: pin.offsetHeight,
      vh: window.innerHeight,
      maxX: Math.max(0, maxX),
    };
  }

  function updatePin() {
    if (!pin || !track || !pinMetrics) return;
    const st = window.scrollY || document.documentElement.scrollTop;
    const start = pinMetrics.top;
    const distance = pinMetrics.height - pinMetrics.vh;
    let prog = (st - start) / distance;
    prog = clamp(prog, 0, 1);
    const x = -prog * pinMetrics.maxX;
    track.style.transform = `translate3d(${x}px,0,0)`;
    if (pinBar) pinBar.style.width = (prog * 100).toFixed(2) + "%";
  }

  /* ---------- Hero parallax ---------- */
  const heroTitle = document.querySelector(".hero__title");
  function heroParallax() {
    if (!heroTitle || reduceMotion) return;
    const st = window.scrollY;
    if (st < window.innerHeight) {
      heroTitle.style.transform = `translateY(${st * 0.18}px)`;
      heroTitle.style.opacity = String(1 - (st / window.innerHeight) * 0.7);
    }
  }

  /* ---------- rAF scroll loop ---------- */
  let ticking = false;
  function onRawScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        heroParallax();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onRawScroll, { passive: true });
  window.addEventListener("resize", () => { measurePin(); onScroll(); });
  window.addEventListener("load", () => { measurePin(); onScroll(); });
  measurePin();
  onScroll();

  /* ---------- Smooth anchor scrolling ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id === "#top") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  });
})();
