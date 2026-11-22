/* ==========================================================
   Alan Copetez · @copeteztattoo
   Vanilla JS · sin dependencias
   ========================================================== */

/* ==========================================================================
   ⚙️ CONFIGURACIÓN — edita solo este bloque
   ========================================================================== */
const CONFIG = {
  // --- Contacto -------------------------------------------------------------
  whatsapp: "5210000000000",        // País + número, solo dígitos. México: 52 + 10 dígitos
  email: "contacto@ejemplo.com",    // Correo real de Alan
  instagram: "copeteztattoo",

  // --- Panel privado de Alan ------------------------------------------------
  // ⚠️ El PIN vive en el código del navegador: sirve para ocultar el panel a
  // curiosos, NO es seguridad real. Para datos sensibles usa Supabase con
  // autenticación real y no expongas la tabla en modo lectura.
  adminPin: "1234",

  // --- Preloader ------------------------------------------------------------
  preloaderMs: 2200,                // duración mínima de la intro
  heroIntervalMs: 4000,             // cada cuánto cambia la tarjeta del hero (ms)

  // --- ENVÍO REAL DEL FORMULARIO (opcional) ---------------------------------
  // Mientras estén vacíos, el sistema funciona en "modo local": las solicitudes
  // se guardan en IndexedDB de ESTE navegador (demo / pruebas). Puedes activar
  // uno o ambos servicios; siempre se conserva además la copia local.

  // OPCIÓN A · Formspree (la más simple: llega a tu correo)
  //   1. Crea un formulario en https://formspree.io
  //   2. Pega aquí su endpoint, ej. "https://formspree.io/f/abcdwxyz"
  //   (La subida de archivos requiere un plan de pago de Formspree.)
  formspreeUrl: "",

  // OPCIÓN B · Supabase (base de datos + subida real de imágenes)
  //   1. Crea un proyecto en https://supabase.com
  //   2. Project Settings > API: copia "Project URL" y la clave "anon public"
  //   3. Ejecuta esto en el SQL Editor:
  //
  //      create table cotizaciones (
  //        id bigint generated always as identity primary key,
  //        created_at timestamptz default now(),
  //        nombre text, idea text, zona text, tamano_cm int, ciudad text,
  //        telefono text, referencia_url text, estado text default 'Pendiente'
  //      );
  //      alter table cotizaciones enable row level security;
  //      create policy "anon puede insertar" on cotizaciones
  //        for insert to anon with check (true);
  //
  //   4. Storage > New bucket "referencias" (público) y en el SQL Editor:
  //
  //      create policy "anon puede subir" on storage.objects
  //        for insert to anon with check (bucket_id = 'referencias');
  //
  //   La clave anon es pública por diseño; la protección real son las
  //   políticas RLS de arriba (solo insertar, nadie puede leer desde la web).
  supabase: {
    url: "",        // ej. "https://xxxxxxxx.supabase.co"
    anonKey: "",    // ej. "eyJhbGciOi..."
    table: "cotizaciones",
    bucket: "referencias"
  }
};

(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const GALLERY = window.GALLERY || [];
  const CATEGORIES = window.GALLERY_CATEGORIES || {};
  const catLabel = key => CATEGORIES[key] || key;
  const pieceLabel = p => p.label || p.cat.split(" ").map(catLabel).join(" · ");
  const imgAttrs = p => (p.w && p.h ? ` width="${p.w}" height="${p.h}"` : "");

  /* ==========================================================
     PRELOADER
     ========================================================== */
  const preloader = $("#preloader");
  let revealReady = false;
  let revealObserver = null;
  const pendingReveal = [];

  function finishPreloader() {
    if (!preloader || preloader.classList.contains("is-done")) return;
    preloader.classList.add("is-done");
    document.body.classList.add("is-ready");
    startReveal();
    Hero.start();
    setTimeout(() => preloader.remove(), 1200);
  }

  (function initPreloader() {
    if (!preloader) { document.body.classList.add("is-ready"); startReveal(); queueMicrotask(() => Hero.start()); return; }
    const minMs = prefersReduced ? 400 : CONFIG.preloaderMs;
    const minWait = new Promise(r => setTimeout(r, minMs));
    const loaded = new Promise(r => {
      if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true });
    });
    // espera mínima + carga, con tope de seguridad de 4.5 s
    Promise.race([Promise.all([minWait, loaded]), new Promise(r => setTimeout(r, 4500))]).then(finishPreloader);
    preloader.addEventListener("click", finishPreloader); // permite saltar la intro con un toque
  })();

  /* ==========================================================
     SCROLL REVEAL
     ========================================================== */
  function prepareReveal(root = document) {
    $$("[data-stagger]", root).forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
        child.style.setProperty("--d", (i * 0.11).toFixed(2) + "s");
      });
    });
  }

  function registerReveal(el, delay) {
    if (delay != null) el.style.setProperty("--d", delay + "s");
    if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
    if (revealReady) observe(el); else pendingReveal.push(el);
  }

  function observe(el) {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("is-visible");
  }

  function startReveal() {
    if (revealReady) return;
    revealReady = true;
    const reveal = el => {
      if (el.classList.contains("is-visible")) return;
      el.classList.add("is-visible");
      if (revealObserver) revealObserver.unobserve(el);
      // al terminar la entrada, quita el estado "reveal" para que los hover propios vuelvan a funcionar
      const d = parseFloat(el.style.getPropertyValue("--d")) || 0;
      setTimeout(() => { el.removeAttribute("data-reveal"); el.style.removeProperty("--d"); }, (d + 1) * 1000);
    };
    if ("IntersectionObserver" in window && !prefersReduced) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }
    $$("[data-reveal]").forEach(observe);
    pendingReveal.length = 0;
    // respaldo: revela de inmediato lo que ya está en pantalla (por si el observer tarda)
    requestAnimationFrame(() => $$("[data-reveal]").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.94 && r.bottom > 0) reveal(el);
    }));
  }

  prepareReveal();

  /* ==========================================================
     BÁSICOS: año, enlaces, topbar, FAB, parallax
     ========================================================== */
  $("#year").textContent = new Date().getFullYear();
  $('[data-link="email"]').href = "mailto:" + CONFIG.email;
  $("[data-email-label]").textContent = CONFIG.email;

  const topbar = $("#topbar");
  const fab = $("#fab");
  const hero = $("#inicio");
  const heroBg = $("#heroBg");
  const quoteSection = $("#cotizar");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    topbar.classList.toggle("is-solid", y > 40);
    const q = quoteSection.getBoundingClientRect();
    const inQuote = q.top < window.innerHeight * 0.6 && q.bottom > 0;
    fab.classList.toggle("is-visible", y > hero.offsetHeight - 200 && !inQuote);
    if (!prefersReduced && y < hero.offsetHeight) heroBg.style.setProperty("--py", (y * 0.16).toFixed(1) + "px");
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ==========================================================
     HERO: baraja editorial (slide + fade, sin zoom)
     Usa las piezas de GALLERY (featured !== false). Dos tarjetas
     superpuestas rotan con desplazamiento + difuminado sin escalar
     por encima de la resolución nativa (object-fit: contain).
     ========================================================== */
  const Hero = (() => {
    const deck = $("#heroDeck");
    const bar = $("#heroProgress");
    const cards = [$("#heroSlideA"), $("#heroSlideB")];
    const TRANSITION_MS = 850;
    const pieces = GALLERY.filter(p => p.featured !== false);
    let cur = 0, idx = 0, timer = null, busy = false, started = false, inView = true, hovered = false;
    let remaining = CONFIG.heroIntervalMs, startedAt = 0;

    const canRotate = !!(deck && cards[0] && cards[1] && pieces.length > 1 && !prefersReduced);
    const fmt = (i, n) => `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;

    if (bar) bar.style.setProperty("--hero-ms", CONFIG.heroIntervalMs + "ms");

    function fill(card, piece, i, withSrc = true) {
      const img = $("img", card);
      if (withSrc) img.src = piece.src;
      img.alt = piece.alt;
      $(".hero__label", card).textContent = pieceLabel(piece);
      $(".hero__counter", card).textContent = fmt(i, pieces.length);
    }

    function restartBar() {
      remaining = CONFIG.heroIntervalMs;
      if (!bar || !canRotate) return;
      bar.classList.remove("is-running");
      void bar.offsetWidth;
      bar.classList.add("is-running");
    }

    // arranque: primera tarjeta con la pieza marcada hero:true (o la primera)
    if (cards[0] && pieces.length) {
      const start = pieces.findIndex(p => p.hero);
      idx = start >= 0 ? start : 0;
      const p = pieces[idx];
      const img = $("img", cards[0]);
      fill(cards[0], p, idx, !img.src.endsWith(p.src));
    }

    async function next() {
      if (busy) return;
      busy = true;
      const out = cards[cur], inc = cards[1 - cur];
      const incImg = $("img", inc);

      // salta piezas que no carguen
      let nIdx = idx, ok = false;
      for (let tries = 0; tries < pieces.length && !ok; tries++) {
        nIdx = (nIdx + 1) % pieces.length;
        incImg.src = pieces[nIdx].src;
        // decode() con tope de 2.5 s: nunca deja la rotación colgada si el navegador la throttlea
        try { await Promise.race([incImg.decode(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500))]); ok = true; }
        catch (e) { ok = incImg.complete && incImg.naturalWidth > 0; }
      }
      if (!ok) { busy = false; return; }

      fill(inc, pieces[nIdx], nIdx, false);
      inc.classList.remove("is-leaving", "is-active");
      inc.classList.add("is-prep");
      inc.removeAttribute("aria-hidden");
      void inc.offsetWidth;

      out.classList.remove("is-active");
      out.classList.add("is-leaving");
      out.setAttribute("aria-hidden", "true");
      inc.classList.remove("is-prep");
      inc.classList.add("is-active");

      idx = nIdx; cur = 1 - cur;
      deck.classList.toggle("is-alt", cur === 1);
      restartBar();
      preloadAfter();

      setTimeout(() => { out.classList.remove("is-leaving"); busy = false; }, TRANSITION_MS + 80);
    }

    function preloadAfter() { new Image().src = pieces[(idx + 1) % pieces.length].src; }

    function schedule() {
      if (!started || !inView || document.hidden || hovered) {
        if (timer) {
          remaining = Math.max(200, remaining - (Date.now() - startedAt));
          clearTimeout(timer);
          timer = null;
        }
        return;
      }
      if (timer) return;
      startedAt = Date.now();
      timer = setTimeout(async () => {
        timer = null;
        if (busy) { remaining = 120; schedule(); return; }
        await next();
        schedule();
      }, remaining);
    }

    function syncPause() {
      hero.classList.toggle("is-paused", !inView || document.hidden || hovered);
      schedule();
    }

    if (deck && pieces.length) {
      deck.addEventListener("click", () => lbOpen(pieces, idx));
    }

    function start() {
      if (!canRotate || started) return;
      started = true;
      restartBar();
      preloadAfter();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; syncPause(); }, { threshold: 0.05 }).observe(hero);
      }
      deck.addEventListener("pointerenter", () => { hovered = true; syncPause(); });
      deck.addEventListener("pointerleave", () => { hovered = false; syncPause(); });
      document.addEventListener("visibilitychange", syncPause);
      schedule();
    }

    return { start };
  })();

  /* ==========================================================
     GLOW QUE SIGUE AL CURSOR (solo escritorio)
     ========================================================== */
  (function initGlow() {
    const glow = $("#glow");
    if (!glow || prefersReduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, raf = null;
    const tick = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : null;
    };
    window.addEventListener("pointermove", e => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerleave", () => glow.classList.remove("is-on"));
  })();

  /* ==========================================================
     LIGHTBOX (genérico: recibe una lista de piezas)
     ========================================================== */
  const lb = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCaption = $("#lbCaption");
  let lbList = [], lbIndex = 0, lbFocus = null;

  function lbShow(i) {
    if (!lbList.length) return;
    lbIndex = (i + lbList.length) % lbList.length;
    const p = lbList[lbIndex];
    lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    lbCaption.textContent = `${p.alt} · ${lbIndex + 1} / ${lbList.length}`;
    [lbIndex - 1, lbIndex + 1].forEach(n => { new Image().src = lbList[(n + lbList.length) % lbList.length].src; });
  }

  function lbOpen(list, index) {
    lbFocus = document.activeElement;
    lbList = list;
    lb.hidden = false;
    document.body.classList.add("no-scroll");
    lbShow(index);
    requestAnimationFrame(() => lb.classList.add("is-open"));
    $("#lbClose").focus();
  }

  function lbClose() {
    lb.classList.remove("is-open");
    if (!anyModalOpen(true)) document.body.classList.remove("no-scroll");
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute("src"); }, 300);
    if (lbFocus) lbFocus.focus();
  }

  $("#lbClose").addEventListener("click", lbClose);
  $("#lbPrev").addEventListener("click", () => lbShow(lbIndex - 1));
  $("#lbNext").addEventListener("click", () => lbShow(lbIndex + 1));
  lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lightbox__figure")) lbClose(); });

  let sx = 0, sy = 0;
  lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lbIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ==========================================================
     GALERÍA (se genera desde gallery-data.js)
     ========================================================== */
  const galleryEl = $("#gallery");
  const filtersEl = $("#filters");
  const emptyEl = $("#galleryEmpty");
  let galleryItems = [];

  function renderGallery() {
    galleryEl.innerHTML = GALLERY.map((p, i) => `
      <li class="gallery__item" data-cat="${esc(p.cat)}" data-i="${i}">
        <button class="gallery__btn" type="button" aria-label="Ampliar: ${esc(p.alt)}">
          <img src="${esc(p.src)}"${imgAttrs(p)} loading="lazy" decoding="async" alt="${esc(p.alt)}">
          <span class="gallery__tag">${esc(pieceLabel(p))}</span>
        </button>
      </li>`).join("");
    galleryItems = $$(".gallery__item", galleryEl);
    galleryItems.forEach((item, i) => {
      registerReveal(item, (i % 4) * 0.09);
      $(".gallery__btn", item).addEventListener("click", () => {
        const visible = galleryItems.filter(it => !it.classList.contains("is-hidden"));
        lbOpen(visible.map(it => GALLERY[+it.dataset.i]), visible.indexOf(item));
      });
    });

    // filtros: solo categorías con piezas
    const used = Object.keys(CATEGORIES).filter(k => GALLERY.some(p => p.cat.split(" ").includes(k)));
    filtersEl.innerHTML =
      `<button class="chip is-active" data-filter="all" role="tab" aria-selected="true">Todos</button>` +
      used.map(k => `<button class="chip" data-filter="${esc(k)}" role="tab" aria-selected="false">${esc(CATEGORIES[k])}</button>`).join("");
    $$(".chip", filtersEl).forEach(chip => chip.addEventListener("click", () => applyFilter(chip)));
  }

  function applyFilter(chip) {
    const filter = chip.dataset.filter;
    $$(".chip", filtersEl).forEach(c => {
      const on = c === chip;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-selected", on);
    });
    let visible = 0;
    galleryItems.forEach(item => {
      const show = filter === "all" || item.dataset.cat.split(" ").includes(filter);
      item.classList.toggle("is-hidden", !show);
      item.classList.remove("is-in");
      if (show) {
        visible++;
        item.removeAttribute("data-reveal");
        void item.offsetWidth;
        item.classList.add("is-in");
      }
    });
    emptyEl.hidden = visible > 0;
  }

  /* ==========================================================
     MARQUEES
     ========================================================== */
  function cloneGroup(track, group) {
    const clone = group.cloneNode(true);
    clone.removeAttribute("data-marquee-source");
    clone.setAttribute("aria-hidden", "true");
    $$("button, a", clone).forEach(el => el.setAttribute("tabindex", "-1"));
    track.appendChild(clone);
  }

  function renderPhotoMarquee() {
    const track = $("#photoTrack");
    const featured = GALLERY.filter(p => p.featured !== false);
    if (!featured.length) { $("#feed").hidden = true; return; }
    const group = document.createElement("div");
    group.className = "marquee__group";
    group.innerHTML = featured.map((p, i) => `
      <button class="feed__item" type="button" data-i="${i}" aria-label="Ampliar: ${esc(p.alt)}">
        <img src="${esc(p.src)}"${imgAttrs(p)} loading="lazy" decoding="async" alt="${esc(p.alt)}" draggable="false">
      </button>`).join("");
    track.appendChild(group);
    const open = i => lbOpen(featured, i);
    group.addEventListener("click", e => {
      const b = e.target.closest(".feed__item");
      if (b) open(+b.dataset.i);
    });
    cloneGroup(track, group);
    // clic también en el clon (mismo índice)
    track.lastElementChild.addEventListener("click", e => {
      const b = e.target.closest(".feed__item");
      if (b) open(+b.dataset.i);
    });
    track.style.setProperty("--dur", Math.max(24, featured.length * 7) + "s");
    $("#photoMarquee").classList.add("marquee--rev");
  }

  function initTextMarquee() {
    const track = $(".marquee--text .marquee__track");
    const group = $("[data-marquee-source]", track);
    // repite el contenido hasta que un grupo supere el ancho de pantalla; luego se duplica para el loop sin cortes
    const original = group.innerHTML;
    let guard = 0;
    while (group.scrollWidth < window.innerWidth * 1.5 && guard++ < 6) group.insertAdjacentHTML("beforeend", original);
    cloneGroup(track, group);
  }

  renderGallery();
  renderPhotoMarquee();
  initTextMarquee();

  /* ==========================================================
     BASE DE DATOS LOCAL (IndexedDB con respaldo en localStorage)
     ========================================================== */
  const DB = (() => {
    const NAME = "copetez-db", STORE = "cotizaciones", LS_KEY = "copetez_cotizaciones";
    let dbPromise = null;

    const open = () => dbPromise || (dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("IndexedDB no disponible"));
      const r = indexedDB.open(NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    }));

    const run = (mode, fn) => open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req && req.result);
      t.onerror = t.onabort = () => reject(t.error);
    }));

    // --- respaldo localStorage ---
    const lsRead = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
    const lsWrite = arr => localStorage.setItem(LS_KEY, JSON.stringify(arr));

    async function safe(idb, ls) {
      try { return await idb(); } catch (err) { console.warn("IndexedDB falló, usando localStorage:", err); return ls(); }
    }

    return {
      add: rec => safe(
        () => run("readwrite", s => s.add(rec)),
        () => { const a = lsRead(); rec.id = Date.now(); a.push(rec); lsWrite(a); return rec.id; }
      ),
      put: rec => safe(
        () => run("readwrite", s => s.put(rec)),
        () => { lsWrite(lsRead().map(r => r.id === rec.id ? rec : r)); }
      ),
      all: () => safe(
        () => run("readonly", s => s.getAll()),
        () => lsRead()
      ),
      remove: id => safe(
        () => run("readwrite", s => s.delete(id)),
        () => { lsWrite(lsRead().filter(r => r.id !== id)); }
      )
    };
  })();

  /* ==========================================================
     FORMULARIO
     ========================================================== */
  const form = $("#quoteForm");
  const fileInput = $("#referencia");
  const uploadBox = $("#uploadBox");
  const preview = $("#uploadPreview");
  const uploadText = $("#uploadText");
  const statusEl = $("#formStatus");
  let objectUrl = null;

  const remoteConfigured = {
    supabase: !!(CONFIG.supabase.url && CONFIG.supabase.anonKey),
    formspree: !!CONFIG.formspreeUrl
  };
  if (remoteConfigured.supabase || remoteConfigured.formspree) {
    $("#uploadHint").textContent = "La imagen se sube junto con tu solicitud.";
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (!file) {
      preview.hidden = true; preview.removeAttribute("src");
      uploadBox.classList.remove("has-file");
      uploadText.lastChild.textContent = "Toca para elegir una imagen";
      return;
    }
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    uploadBox.classList.add("has-file");
    uploadText.lastChild.textContent = file.name + " · toca para cambiar";
  });

  const rules = {
    nombre: v => v.trim().length >= 2 || "Escribe tu nombre.",
    idea: v => v.trim().length >= 10 || "Cuéntame un poco más de tu idea (mín. 10 caracteres).",
    zona: v => v !== "" || "Selecciona la zona del cuerpo.",
    tamano: v => (Number(v) >= 1 && Number(v) <= 200) || "Indica un tamaño aproximado en cm."
  };

  function validate() {
    let firstBad = null;
    Object.keys(rules).forEach(name => {
      const el = form.elements[name];
      const res = rules[name](el.value);
      const ok = res === true;
      el.closest(".field").classList.toggle("has-error", !ok);
      $(`[data-error-for="${name}"]`).textContent = ok ? "" : res;
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  Object.keys(rules).forEach(name => {
    const el = form.elements[name];
    ["input", "change"].forEach(evt => el.addEventListener(evt, () => {
      if (rules[name](el.value) === true) {
        el.closest(".field").classList.remove("has-error");
        $(`[data-error-for="${name}"]`).textContent = "";
      }
    }));
  });

  /* ---- utilidades de envío ---- */
  function fileToDataUrl(file, max = 1200, quality = 0.82) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  const normalizePhone = raw => {
    const d = String(raw || "").replace(/\D/g, "");
    if (!d) return "";
    return d.length === 10 ? "52" + d : d;
  };

  function buildMessage(r) {
    return [
      "¡Hola Alan! Quiero cotizar un tatuaje 🖤",
      "",
      `👤 Nombre: ${r.nombre}`,
      `💡 Idea: ${r.idea}`,
      `📍 Zona del cuerpo: ${r.zona}`,
      `📏 Tamaño aprox.: ${r.tamano} cm`,
      `🏙️ Ciudad: ${r.ciudad}`,
      r.telefono ? `📱 Mi WhatsApp: ${r.telefono}` : null,
      r.referenciaUrl
        ? `🖼️ Referencia: ${r.referenciaUrl}`
        : r.imagenNombre
          ? `🖼️ Referencia: te comparto la imagen (${r.imagenNombre}) en este chat.`
          : "🖼️ Referencia: aún no tengo, ¿me ayudas a definirla?",
      "",
      "Quedo atento a la cotización. ¡Gracias!"
    ].filter(l => l !== null).join("\n");
  }

  async function fetchTimeout(url, opts, ms = 20000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
    finally { clearTimeout(t); }
  }

  /* ---- Supabase (REST, sin SDK) ---- */
  async function sendToSupabase(record, file) {
    const { url, anonKey, table, bucket } = CONFIG.supabase;
    const base = url.replace(/\/$/, "");
    const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };

    // 1) subir imagen real al bucket público
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await fetchTimeout(`${base}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" },
        body: file
      });
      if (!up.ok) throw new Error("Supabase Storage: " + up.status);
      record.referenciaUrl = `${base}/storage/v1/object/public/${bucket}/${path}`;
    }

    // 2) insertar la fila
    const res = await fetchTimeout(`${base}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        nombre: record.nombre, idea: record.idea, zona: record.zona,
        tamano_cm: Number(record.tamano), ciudad: record.ciudad,
        telefono: record.telefono || null, referencia_url: record.referenciaUrl || null,
        estado: "Pendiente"
      })
    });
    if (!res.ok) throw new Error("Supabase DB: " + res.status);
  }

  /* ---- Formspree ---- */
  async function sendToFormspree(record, file, message) {
    const fd = new FormData();
    fd.append("nombre", record.nombre);
    fd.append("idea", record.idea);
    fd.append("zona", record.zona);
    fd.append("tamano_cm", record.tamano);
    fd.append("ciudad", record.ciudad);
    fd.append("telefono", record.telefono || "");
    if (record.referenciaUrl) fd.append("referencia_url", record.referenciaUrl);
    fd.append("mensaje", message);
    if (file) fd.append("referencia", file, file.name);
    const res = await fetchTimeout(CONFIG.formspreeUrl, { method: "POST", body: fd, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Formspree: " + res.status);
  }

  async function sendRemote(record, file, message) {
    const result = { attempted: false, ok: true, errors: [] };
    if (remoteConfigured.supabase) {
      result.attempted = true;
      try { await sendToSupabase(record, file); } catch (e) { result.ok = false; result.errors.push(e.message); }
    }
    if (remoteConfigured.formspree) {
      result.attempted = true;
      try { await sendToFormspree(record, file, message); } catch (e) { result.ok = false; result.errors.push(e.message); }
    }
    return result;
  }

  /* ---- UI del envío ---- */
  let channel = "whatsapp";
  const submitBtns = $$('button[type="submit"]', form);
  submitBtns.forEach(b => b.addEventListener("click", () => { channel = b.dataset.channel; }));

  function setStatus(msg, isError) {
    statusEl.hidden = !msg;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", !!isError);
  }

  function setBusy(busy) {
    submitBtns.forEach(b => {
      b.disabled = busy;
      const label = $("span", b) || b;
      if (busy && b.dataset.channel === channel) { b.dataset.label = label.textContent; label.textContent = "Enviando…"; }
      else if (!busy && b.dataset.label) { label.textContent = b.dataset.label; delete b.dataset.label; }
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("");
    setBusy(true);

    try {
      const d = new FormData(form);
      const file = fileInput.files[0] || null;
      const record = {
        fecha: new Date().toISOString(),
        nombre: d.get("nombre").trim(),
        idea: d.get("idea").trim(),
        zona: d.get("zona"),
        tamano: Number(d.get("tamano")),
        ciudad: d.get("ciudad"),
        telefono: d.get("telefono").trim(),
        canal: channel,
        estado: "Pendiente",
        imagen: file ? await fileToDataUrl(file) : null,   // Base64 (vista previa local)
        imagenNombre: file ? file.name : "",
        referenciaUrl: "",
        sync: "local"
      };

      // 1) envío remoto (si está configurado) — puede completar referenciaUrl
      const message0 = buildMessage(record);
      const remote = await sendRemote(record, file, message0);
      record.sync = !remote.attempted ? "local" : remote.ok ? "remoto" : "error";

      // 2) copia local siempre
      try { await DB.add(record); } catch (err) { console.warn("No se pudo guardar localmente", err); }

      // 3) mensaje final (ya con la URL de la imagen si se subió)
      const message = buildMessage(record);
      showSuccess(record, message, remote);

      if (channel === "email") {
        window.location.href = mailtoUrl(record, message);
      } else {
        const w = window.open(waUrl(message), "_blank", "noopener");
        if (!w) { /* bloqueado: el botón de la tarjeta de éxito sirve de respaldo */ }
      }
    } catch (err) {
      console.error(err);
      setStatus("Ocurrió un error al procesar tu solicitud. Intenta de nuevo.", true);
    } finally {
      setBusy(false);
    }
  });

  const waUrl = message => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  const mailtoUrl = (r, message) =>
    `mailto:${CONFIG.email}?subject=${encodeURIComponent("Cotización de tatuaje · " + r.nombre)}&body=${encodeURIComponent(message)}`;

  const success = $("#quoteSuccess");
  function showSuccess(record, message, remote) {
    $("#successWa").href = waUrl(message);
    $("#successMail").href = mailtoUrl(record, message);
    $("#successMsg").textContent = remote.attempted && remote.ok
      ? "Tu cotización fue recibida. Si el mensaje no se abrió solo, continúa por tu canal favorito."
      : "Tu mensaje está listo. Si no se abrió solo, usa uno de los botones para enviarlo.";
    const warn = $("#successWarn");
    warn.hidden = !(remote.attempted && !remote.ok);
    if (!warn.hidden) warn.textContent = "No pudimos guardar tu solicitud en línea, pero tu mensaje sigue listo para enviarse.";
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $("#newQuote").addEventListener("click", () => {
    form.reset();
    fileInput.dispatchEvent(new Event("change"));
    success.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ==========================================================
     MODALES + PANEL DE ADMINISTRACIÓN
     ========================================================== */
  const pinModal = $("#pinModal");
  const adminModal = $("#adminModal");
  const zoom = $("#zoom");
  let modalFocus = null;

  function anyModalOpen(ignoreLightbox) {
    return [pinModal, adminModal].some(m => !m.hidden) || (!ignoreLightbox && !lb.hidden);
  }

  function openModal(m) {
    modalFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => m.classList.add("is-open"));
  }
  function closeModal(m) {
    m.classList.remove("is-open");
    setTimeout(() => { m.hidden = true; if (!anyModalOpen()) document.body.classList.remove("no-scroll"); }, 300);
    if (modalFocus) modalFocus.focus();
  }

  [pinModal, adminModal].forEach(m => {
    m.addEventListener("click", e => { if (e.target === m || e.target.hasAttribute("data-close")) closeModal(m); });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!zoom.hidden) zoom.hidden = true;
      else if (!adminModal.hidden) closeModal(adminModal);
      else if (!pinModal.hidden) closeModal(pinModal);
      else if (!lb.hidden) lbClose();
    }
    if (!lb.hidden && modalsClosed()) {
      if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
      if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    }
  });
  const modalsClosed = () => pinModal.hidden && adminModal.hidden;

  zoom.addEventListener("click", () => { zoom.hidden = true; });

  /* ---- PIN ---- */
  const pinForm = $("#pinForm");
  const pinInput = $("#pinInput");
  const pinError = $("#pinError");
  let unlocked = false, fails = 0, lockedUntil = 0;

  $("#adminOpen").addEventListener("click", () => {
    if (unlocked) { openAdmin(); return; }
    pinInput.value = ""; pinError.textContent = "";
    openModal(pinModal);
    setTimeout(() => pinInput.focus(), 120);
  });

  pinForm.addEventListener("submit", e => {
    e.preventDefault();
    const now = Date.now();
    if (now < lockedUntil) {
      pinError.textContent = `Demasiados intentos. Espera ${Math.ceil((lockedUntil - now) / 1000)} s.`;
      return;
    }
    if (pinInput.value === String(CONFIG.adminPin)) {
      unlocked = true; fails = 0;
      closeModal(pinModal);
      setTimeout(openAdmin, 320);
    } else {
      fails++;
      pinError.textContent = "PIN incorrecto.";
      pinInput.value = "";
      const panel = pinModal.firstElementChild;
      panel.classList.remove("shake"); void panel.offsetWidth; panel.classList.add("shake");
      if (fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; pinError.textContent = "Demasiados intentos. Espera 30 s."; }
    }
  });

  /* ---- Panel ---- */
  const adminBody = $("#adminBody");
  const adminEmpty = $("#adminEmpty");
  const adminSummary = $("#adminSummary");
  let adminRecords = [];
  let adminFilter = "all";
  const STATUSES = ["Pendiente", "Cotizada", "Agendada"];

  async function openAdmin() {
    $("#adminNote").textContent = (remoteConfigured.supabase || remoteConfigured.formspree)
      ? "Este panel muestra las solicitudes guardadas en este navegador. Las enviadas en línea se consultan en tu Supabase / Formspree."
      : "Modo local: las solicitudes se guardan solo en este navegador. Conecta Supabase o Formspree en CONFIG para recibirlas desde cualquier dispositivo.";
    openModal(adminModal);
    await loadAdmin();
  }

  async function loadAdmin() {
    adminRecords = (await DB.all()).sort((a, b) => b.fecha.localeCompare(a.fecha));
    renderAdmin();
  }

  const fmtDate = iso => new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });

  function replyUrl(r) {
    const phone = normalizePhone(r.telefono);
    const text = phone
      ? `Hola ${r.nombre}, soy Alan Copetez (@copeteztattoo). Te escribo por tu solicitud de cotización: ${r.idea.slice(0, 80)}${r.idea.length > 80 ? "…" : ""}`
      : `Cotización de ${r.nombre}\n💡 ${r.idea}\n📍 ${r.zona} · 📏 ${r.tamano} cm · 🏙️ ${r.ciudad}\nEstado: ${r.estado}`;
    return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  function renderAdmin() {
    const counts = STATUSES.reduce((o, s) => (o[s] = adminRecords.filter(r => r.estado === s).length, o), {});
    adminSummary.textContent = `${adminRecords.length} en total · ${counts.Pendiente} pendientes · ${counts.Cotizada} cotizadas · ${counts.Agendada} agendadas`;
    const list = adminRecords.filter(r => adminFilter === "all" || r.estado === adminFilter);
    adminEmpty.hidden = list.length > 0;
    adminEmpty.textContent = adminRecords.length ? "No hay cotizaciones con este estado." : "Aún no hay cotizaciones en este navegador.";

    adminBody.innerHTML = list.map(r => `
      <tr data-id="${r.id}">
        <td data-label="Fecha"><span class="admin__sub">${esc(fmtDate(r.fecha))}</span></td>
        <td data-label="Cliente">
          <div class="admin__name">${esc(r.nombre)}</div>
          <div class="admin__sub">${esc(r.ciudad)}${r.telefono ? " · " + esc(r.telefono) : ""}</div>
        </td>
        <td data-label="Pieza">
          <div class="admin__idea">${esc(r.idea)}</div>
          <div class="admin__sub">${esc(r.zona)} · ${esc(r.tamano)} cm</div>
        </td>
        <td data-label="Referencia">
          ${r.imagen
            ? `<img class="admin__thumb" src="${r.imagen}" alt="Referencia de ${esc(r.nombre)}" data-zoom>`
            : r.referenciaUrl
              ? `<a class="iconbtn" href="${esc(r.referenciaUrl)}" target="_blank" rel="noopener">Ver imagen</a>`
              : `<span class="admin__none">—</span>`}
        </td>
        <td data-label="Estado">
          <select class="status" data-v="${esc(r.estado)}" data-status aria-label="Estado de la cotización">
            ${STATUSES.map(s => `<option${s === r.estado ? " selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td data-label="Acciones">
          <div class="admin__actions">
            <a class="iconbtn iconbtn--wa" href="${replyUrl(r)}" target="_blank" rel="noopener">WhatsApp</a>
            <button class="iconbtn iconbtn--del" type="button" data-del>Eliminar</button>
          </div>
        </td>
      </tr>`).join("");
  }

  adminBody.addEventListener("change", async e => {
    const sel = e.target.closest("[data-status]");
    if (!sel) return;
    const id = +sel.closest("tr").dataset.id;
    const rec = adminRecords.find(r => r.id === id);
    if (!rec) return;
    rec.estado = sel.value;
    sel.dataset.v = sel.value;
    await DB.put(rec);
    renderAdmin();
  });

  adminBody.addEventListener("click", async e => {
    const tr = e.target.closest("tr");
    if (!tr) return;
    const id = +tr.dataset.id;
    if (e.target.closest("[data-zoom]")) {
      $("#zoomImg").src = e.target.closest("[data-zoom]").src;
      zoom.hidden = false;
    }
    if (e.target.closest("[data-del]")) {
      const rec = adminRecords.find(r => r.id === id);
      if (rec && confirm(`¿Eliminar la cotización de ${rec.nombre}? Esta acción no se puede deshacer.`)) {
        await DB.remove(id);
        await loadAdmin();
      }
    }
  });

  $$("#adminFilters .chip").forEach(chip => chip.addEventListener("click", () => {
    adminFilter = chip.dataset.status;
    $$("#adminFilters .chip").forEach(c => c.classList.toggle("is-active", c === chip));
    renderAdmin();
  }));

  $("#adminExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(adminRecords, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cotizaciones-copetez-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("#adminLock").addEventListener("click", () => { unlocked = false; closeModal(adminModal); });
})();
