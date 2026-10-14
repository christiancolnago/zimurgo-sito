/* Scene a scorrimento di Zimurgo. Vanilla JS, nessuna dipendenza.
   Imposta --p (0→1) su ogni [data-scene] in base allo scroll e accende i passi (spine, ripiani, righe, parole). */
(function () {
  "use strict";

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  // Frigoriferi: disegnati qui per tenere l'HTML leggero (decorativi)
  var fr = document.getElementById("fridges");
  if (fr) {
    var colors = ["#e8a93a", "#45a74f", "#841b30", "#ece8d8", "#c9751c", "#8fc46f"];
    var out = '<rect x="20" y="16" width="280" height="388" rx="16" fill="#12261d" stroke="#ece8d8" stroke-width="3"/>' +
              '<rect x="340" y="16" width="280" height="388" rx="16" fill="#12261d" stroke="#ece8d8" stroke-width="3"/>';
    for (var r = 0; r < 4; r++) {
      var base = 96 + r * 88, g = '<g class="row" data-r="' + r + '">';
      [0, 1].forEach(function (f) {
        var x0 = 40 + f * 320;
        g += '<rect x="' + (x0 - 6) + '" y="' + (base + 2) + '" width="252" height="4" rx="2" fill="#3a5a4a"/>';
        for (var i = 0; i < 7; i++) {
          var c = colors[(i + r * 2 + f * 3) % colors.length], x = x0 + i * 36;
          if ((i + r + f) % 3 === 0) {
            g += '<rect x="' + (x + 8) + '" y="' + (base - 66) + '" width="12" height="20" rx="4" fill="' + c + '"/>' +
                 '<rect x="' + (x + 3) + '" y="' + (base - 48) + '" width="22" height="48" rx="6" fill="' + c + '"/>';
          } else {
            g += '<rect x="' + (x + 3) + '" y="' + (base - 44) + '" width="22" height="44" rx="5" fill="' + c + '"/>' +
                 '<rect x="' + (x + 3) + '" y="' + (base - 36) + '" width="22" height="6" fill="#0f1f18" opacity=".35"/>';
          }
        }
      });
      out += g + "</g>";
    }
    fr.innerHTML = out;
  }

  // Testo che si accende parola per parola
  var wordEls = document.querySelector("[data-words]");
  var words = [];
  if (wordEls) {
    var txt = wordEls.textContent.replace(/\s+/g, " ").trim().split(" ");
    wordEls.textContent = "";
    txt.forEach(function (t, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.textContent = t;
      wordEls.appendChild(s);
      if (i < txt.length - 1) wordEls.appendChild(document.createTextNode(" "));
      words.push(s);
    });
  }

  // Senza animazioni, o con un riquadro alto come tutta la pagina (anteprime che non hanno una vera altezza di schermo):
  // sezioni normali, tutto visibile
  if (reduce || window.innerHeight > 2200) return;

  document.documentElement.classList.add("fx");

  var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));
  var taps = Array.prototype.slice.call(document.querySelectorAll(".tapsvg .tap"));
  var rows = Array.prototype.slice.call(document.querySelectorAll(".fridges .row"));
  var wlines = Array.prototype.slice.call(document.querySelectorAll(".wine-lines li"));
  var stepOut = document.querySelector("[data-step-out]");
  var STYLES = ["Chiara", "Torbida", "Ambrata", "Rossa", "Scura", "Acida"];
  var ticking = false;

  // Scena 1: geometria calcolata sullo schermo reale
  var hero = document.querySelector('[data-scene="hero"]');
  var hStage = hero && hero.querySelector(".stage");
  var hCopy = hero && hero.querySelector(".hero-copy");
  var hGlass = hero && hero.querySelector(".glass");
  var G = null;
  function layoutHero() {
    if (!hero) return;
    var vw = hStage.clientWidth, vh = hStage.clientHeight;
    var cb = hCopy.offsetTop + hCopy.offsetHeight + 24;
    var W = Math.max(110, Math.min(340, vw * 0.46, (vh - cb - 16) / 1.5));
    var H = 1.5 * W;
    var top = Math.min(cb, vh - H - 16);
    hGlass.style.width = W + "px";
    hGlass.style.left = ((vw - W) / 2) + "px";
    hGlass.style.top = top + "px";
    G = { vw: vw, vh: vh, W: W, ys: top + 0.62 * H, cb: cb, S: (0.86 * Math.min(vw, vh)) / (0.36 * W) };
  }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function heroFrame(p) {
    if (!G) return;
    var e = easeIO(clamp(p / 0.6));
    var s = Math.pow(G.S, e);
    var dy = (G.vh / 2 - G.ys) * e;
    var vis = (G.vh - G.cb < 150) ? clamp((p - 0.06) / 0.1) : 1; // schermo molto basso: il bicchiere entra dopo il testo
    hGlass.style.transform = "translate(0," + dy.toFixed(1) + "px) scale(" + s.toFixed(4) + ")";
    hGlass.style.opacity = (vis * (1 - clamp((p - 0.88) / 0.12))).toFixed(3);
    hero.style.setProperty("--bg", clamp((p - 0.25) / 0.3).toFixed(3));
    hCopy.classList.toggle("is-gone", p > 0.16);
  }

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    afterHero();
    scenes.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var span = r.height - vh;
      var p = span > 0 ? clamp(-r.top / span) : 0;
      s.style.setProperty("--p", p.toFixed(4));
      var kind = s.getAttribute("data-scene");

      if (kind === "hero") {
        heroFrame(p);
      } else if (kind === "taps") {
        var q = clamp(p * 1.08) * taps.length;
        var i = Math.min(taps.length - 1, Math.floor(q));
        taps.forEach(function (t, k) {
          var f = clamp(q - k);
          t.style.setProperty("--f", f.toFixed(3));
          t.classList.toggle("on", k === i && f < 1);
          t.classList.toggle("seen", k < i || f >= 1);
        });
        if (stepOut) stepOut.textContent = p < 0.01 ? "Sei vie, sei stili" : STYLES[i];
      } else if (kind === "fridges") {
        var n = Math.min(rows.length, Math.floor(p * 1.25 * rows.length) + 1);
        rows.forEach(function (row, k) { row.classList.toggle("on", k < n); });
      } else if (kind === "wine") {
        var m = Math.floor(p * 1.3 * wlines.length) + (p > 0.08 ? 1 : 0);
        wlines.forEach(function (l, k) { l.classList.toggle("on", k < m); });
      } else if (kind === "words") {
        var lit = Math.floor(clamp(p * 1.3) * words.length);
        words.forEach(function (w, k) { w.classList.toggle("on", k < lit); });
      }
    });
  }

  function afterHero() {
    if (!hero) return;
    document.documentElement.classList.toggle("past-hero", hero.getBoundingClientRect().bottom < window.innerHeight * 1.05);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { layoutHero(); onScroll(); });
  layoutHero();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutHero(); update(); });
  update();

  // Arrivo con #ancora (da un'altra pagina o da un link diretto): le scene cambiano l'altezza della pagina
  // dopo il caricamento, quindi si torna sull'ancora quando il layout è stabile.
  function goHash() {
    if (!location.hash || location.hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    var r = target.getBoundingClientRect();
    var y = r.top + window.pageYOffset;
    y += target.classList.contains("scene") ? Math.max(0, (r.height - window.innerHeight) * 0.14) : -64;
    window.scrollTo(0, Math.max(0, y));
  }
  if (location.hash) {
    setTimeout(goHash, 60);
    window.addEventListener("load", function () { setTimeout(goHash, 60); });
  }
})();
