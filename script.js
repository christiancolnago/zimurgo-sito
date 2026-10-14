/* Zimurgo — script minimo, nessun tracker, nessuna libreria */
(function () {
  "use strict";

  // Ogni pagina si apre dall'inizio quando arrivi da un'altra pagina del sito (anche dentro anteprime incorporate)
  try {
    var navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var navType = navEntry && navEntry.type;
    if (!location.hash && navType !== "back_forward" && navType !== "reload") {
      window.scrollTo(0, 0);
      if (window.self !== window.top && document.body && document.body.scrollIntoView) {
        document.body.scrollIntoView({ block: "start" });
      }
    }
  } catch (e0) {}

  // Prima di aprire un'altra pagina del sito: porta in cima la vista (serve dentro anteprime incorporate, che tengono lo scorrimento esterno)
  try { if ("scrollRestoration" in history) history.scrollRestoration = "auto"; } catch (e2) {}
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank" || a.target === "_top") return;
    var h = a.getAttribute("href");
    if (!h || h.charAt(0) === "#" || /^(tel:|mailto:|https?:)/.test(h) || h.indexOf("#") > -1) return;
    window.scrollTo(0, 0);
    if (window.self !== window.top && document.documentElement.scrollIntoView) document.documentElement.scrollIntoView({ block: "start" });
  }, true);

  // Prima di aprire un'altra pagina del sito: porta in cima la vista (serve dentro anteprime incorporate, che tengono lo scorrimento esterno)
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank" || a.target === "_top") return;
    var h = a.getAttribute("href");
    if (!h || h.charAt(0) === "#" || /^(tel:|mailto:|https?:)/.test(h) || h.indexOf("#") > -1) return;
    window.scrollTo(0, 0);
    if (window.self !== window.top && document.documentElement.scrollIntoView) document.documentElement.scrollIntoView({ block: "start" });
  }, true);

  // Anno nel footer
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Mappa Google caricata solo su richiesta (nessun cookie di terzi prima del click)
  var btn = document.getElementById("load-map");
  var box = document.getElementById("mapbox");
  if (btn && box) {
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-src");
      f.title = "Mappa: Zimurgo Beer & Wine, Via Varesina 22, Jerago con Orago";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.allowFullscreen = true;
      box.textContent = "";
      box.appendChild(f);
    });
  }

  // Lavagna online: legge taps.json (se contiene voci) e la mostra in home e nel menù.
  // Per aggiornare la lista basta modificare taps.json, vedi GUIDA-SITO.md.
  function render(el, title, items, kind) {
    if (!el || !items || !items.length) return;
    var h = document.createElement("h4");
    h.textContent = title;
    var ul = document.createElement("ul");
    items.forEach(function (it) {
      var li = document.createElement("li");
      var main = document.createElement("strong");
      main.textContent = it.name || "";
      li.appendChild(main);
      var bits = [];
      if (kind === "beer") {
        if (it.brewery) bits.push(it.brewery);
        if (it.style) bits.push(it.style);
        if (it.abv) bits.push(it.abv);
      } else {
        if (it.producer) bits.push(it.producer);
        if (it.area) bits.push(it.area);
        if (it.type) bits.push(it.type);
      }
      if (it.price) bits.push(it.price);
      if (bits.length) {
        var s = document.createElement("small");
        s.textContent = " · " + bits.join(" · ");
        li.appendChild(s);
      }
      ul.appendChild(li);
    });
    el.textContent = "";
    el.appendChild(h);
    el.appendChild(ul);
    el.hidden = false;
  }

  if ("fetch" in window) {
    fetch("taps.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var stamp = d.aggiornato ? " (aggiornato il " + d.aggiornato + ")" : "";
        document.querySelectorAll("#lavagna-birre").forEach(function (el) {
          render(el, "Alla spina adesso" + stamp, d.birre, "beer");
        });
        document.querySelectorAll("#lavagna-vini").forEach(function (el) {
          render(el, "Vini al calice adesso" + stamp, d.vini, "wine");
        });
      })
      .catch(function () { /* nessuna lavagna online: nessun problema */ });
  }

  // Orari: la tabella #orari è l'unica fonte. Da lì si ricava "Aperto ora / Chiuso ora" (ora italiana) e il giorno evidenziato.
  (function () {
    var list = document.getElementById("orari");
    if (!list) return;
    var WEEK = 7 * 1440;
    var DAYNAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
    var intervals = [];
    Array.prototype.forEach.call(list.querySelectorAll("li[data-day]"), function (li) {
      var d = parseInt(li.getAttribute("data-day"), 10);
      var slots = li.getAttribute("data-slots");
      if (!slots) return;
      slots.split(",").forEach(function (sl) {
        var p = sl.split("-");
        var a = p[0].split(":"), b = p[1].split(":");
        var s = d * 1440 + (+a[0]) * 60 + (+a[1]);
        var e = d * 1440 + (+b[0]) * 60 + (+b[1]);
        if (e <= s) e += 1440; // chiude dopo mezzanotte
        intervals.push({ s: s, e: e });
      });
    });
    function romeNow() {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (x) { o[x.type] = x.value; });
      var idx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { day: idx, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    }
    function hhmm(m) {
      m = ((m % 1440) + 1440) % 1440;
      if (m === 0) return "mezzanotte";
      var h = Math.floor(m / 60), mm = m % 60;
      return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
    }
    function status() {
      var n = romeNow(), now = n.day * 1440 + n.min, i, it;
      for (i = 0; i < intervals.length; i++) {
        it = intervals[i];
        if ((now >= it.s && now < it.e) || (now + WEEK >= it.s && now + WEEK < it.e)) {
          var end = it.e % 1440;
          return { open: true, text: "Aperto ora" + (end === 0 ? " fino a mezzanotte" : " fino alle " + hhmm(end)) };
        }
      }
      var best = null;
      intervals.forEach(function (x) {
        [x.s, x.s + WEEK].forEach(function (s) { if (s > now && (best === null || s < best)) best = s; });
      });
      if (best === null) return { open: false, text: "Chiuso ora" };
      var dayDiff = Math.floor(best / 1440) - n.day;
      var when = dayDiff === 0 ? "oggi" : dayDiff === 1 ? "domani" : DAYNAMES[Math.floor(best / 1440) % 7];
      return { open: false, text: "Chiuso ora · riapre " + when + " alle " + hhmm(best % 1440) };
    }
    function paint() {
      var st = status(), n = romeNow();
      ["open-now", "open-now-hero"].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = st.text;
        el.setAttribute("data-open", st.open ? "1" : "0");
        el.hidden = false;
      });
      Array.prototype.forEach.call(list.querySelectorAll("li[data-day]"), function (li) {
        li.classList.toggle("today", parseInt(li.getAttribute("data-day"), 10) === n.day);
      });
    }
    paint();
    setInterval(paint, 60000);
  })();

  // Foto del locale: la sezione compare solo se locale.jpg esiste davvero (niente spazio vuoto, niente salti di pagina)
  var fotoSez = document.getElementById("foto-sezione");
  if (fotoSez) {
    var fotoImg = fotoSez.querySelector("img");
    var probe = new Image();
    probe.onload = function () { fotoImg.src = fotoImg.getAttribute("data-src"); fotoSez.hidden = false; };
    probe.src = fotoImg.getAttribute("data-src");
  }

  // Link interni (#sezione) e logo: scorrimento affidabile anche nei riquadri incorporati
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("a[href]") : null;
    if (!t) return;
    var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var behavior = reduceMotion ? "auto" : "smooth";
    var href = t.getAttribute("href");
    // logo su una pagina che è già la home: torna in cima
    if ((href === "./" || href === "/") && /\/(index\.html)?$/.test(location.pathname)) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: behavior });
      if (window.self !== window.top && document.body.scrollIntoView) document.body.scrollIntoView({ block: "start", behavior: behavior });
      return;
    }
    if (href.charAt(0) !== "#" || href.length < 2) return;
    var el = document.getElementById(href.slice(1));
    if (!el) return;
    e.preventDefault();
    if (document.documentElement.classList.contains("fx")) {
      var r = el.getBoundingClientRect();
      var top = r.top + window.pageYOffset;
      top += el.classList.contains("scene") ? Math.max(0, (r.height - window.innerHeight) * 0.14) : -64;
      window.scrollTo({ top: Math.max(0, top), behavior: behavior });
    } else {
      el.scrollIntoView({ behavior: behavior, block: "start" });
    }
  });

  // Recensioni Google: si leggono da recensioni.json. La sezione compare solo se ci sono recensioni vere.
  (function () {
    var sec = document.getElementById("recensioni");
    if (!sec || !("fetch" in window)) return;
    fetch("recensioni.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.recensioni || !d.recensioni.length) return;
        var list = document.getElementById("reviews-list");
        d.recensioni.forEach(function (it) {
          if (!it.testo) return;
          var n = Math.max(1, Math.min(5, parseInt(it.stelle, 10) || 5));
          var li = document.createElement("li");
          li.className = "review";
          var st = document.createElement("p");
          st.className = "stars";
          st.setAttribute("role", "img");
          st.setAttribute("aria-label", n + " stelle su 5");
          st.textContent = "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
          var q = document.createElement("blockquote");
          q.textContent = it.testo;
          var who = document.createElement("p");
          who.className = "who";
          who.textContent = [it.autore, it.data].filter(Boolean).join(" · ") + (it.autore || it.data ? " · " : "") + "Recensione su Google";
          li.appendChild(st); li.appendChild(q); li.appendChild(who);
          list.appendChild(li);
        });
        if (!list.children.length) return;
        var sum = document.getElementById("reviews-summary");
        if (d.valutazione) {
          sum.textContent = "★ " + d.valutazione + " su 5" + (d.numero ? " · " + d.numero + " recensioni su Google" : " su Google");
        } else { sum.hidden = true; }
        if (d.link) document.getElementById("reviews-link").href = d.link;
        sec.hidden = false;
      })
      .catch(function () { /* nessuna recensione: la sezione resta nascosta */ });
  })();
})();
