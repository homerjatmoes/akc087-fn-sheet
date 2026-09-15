(async () => {
  const { makers } = await fetch("data.json").then((r) => r.json());
  const sheetCache = new Map();
  async function loadSheet(key) {
    if (sheetCache.has(key)) return sheetCache.get(key);
    const sheet = await fetch("sheets/" + key.replace("/", "--") + ".json").then((r) => r.json());
    sheetCache.set(key, sheet);
    return sheet;
  }
  const app = document.getElementById("app");
  const pressed = new Set();
  let openMaker = "ajazz";
  let group = "rgb";
  let selectedId = null;
  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    if (raw === "aula/f75-ultra") {
      location.hash = "#/epomaker/aula-f75-ultra";
      return { view: "hub" };
    }
    const parts = raw.split("/").filter(Boolean);
    if (parts.length >= 2) return { view: "sheet", key: parts[0] + "/" + parts[1] };
    return { view: "hub" };
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      if (ch === "&") return "&";
      if (ch === "<") return "<";
      if (ch === ">") return ">";
      if (ch === '"') return """;
      return "&#39;";
    });
  }
  function renderHub() {
    document.title = "Function sheets";
    app.innerHTML = '<main class="hub"><header class="hero"><div><p class="eyebrow">Desk \u00b7 FN + VIA</p><h1>Function sheets</h1><p class="lede">Pick the manufacturer, then the board.</p></div></header><ul class="makers"></ul></main>';
    const list = app.querySelector(".makers");
    makers.forEach(function (maker) {
      const li = document.createElement("li");
      li.className = "maker";
      const open = openMaker === maker.id;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "maker-btn";
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = '<span class="maker-mark">' + esc(maker.name.slice(0, 2)) + '</span><span><span class="maker-name">' + esc(maker.name) + '</span><span class="maker-blurb">' + esc(maker.blurb) + '</span></span><span class="chev">\u25be</span>';
      btn.addEventListener("click", function () {
        openMaker = openMaker === maker.id ? "" : maker.id;
        render();
      });
      li.append(btn);
      if (open) {
        const ul = document.createElement("ul");
        ul.className = "models";
        maker.models.forEach(function (model) {
          const item = document.createElement("li");
          item.innerHTML = '<a href="#/' + esc(maker.id) + '/' + esc(model.slug) + '"><span><span class="model-name">' + esc(model.name) + '</span><span class="model-sum">' + esc(model.summary) + '</span></span><span class="badge">' + (model.config === "via" ? "VIA" : "FN") + '</span></a>';
          ul.append(item);
        });
        li.append(ul);
      }
      list.append(li);
    });
  }
  function keyButton(key, hot) {
    const mapped = hot.has(key.id);
    const cls = ["key", key.id === "fn" ? "fn" : mapped ? "mapped" : "", selectedId === key.id || pressed.has(key.id) ? "sel" : ""].filter(Boolean).join(" ");
    const label = key.sub
      ? '<span class="sub">' + esc(key.sub) + '</span><span>' + esc(key.label) + '</span>'
      : key.id === "spc"
        ? '<span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden">Space</span>'
        : esc(key.label);
    const x = key.x ? "--x:" + key.x + ";" : "";
    return '<button type="button" class="' + cls + '" style="--w:' + key.w + ';' + x + '" data-key="' + esc(key.id) + '" aria-pressed="' + (selectedId === key.id) + '">' + label + '</button>';
  }
  function renderSheet(key, sheet) {
    const parts = key.split("/");
    const maker = makers.find(function (m) { return m.id === parts[0]; });
    const model = maker && maker.models.find(function (m) { return m.slug === parts[1]; });
    document.title = sheet.title;
    const byKey = new Map();
    sheet.combos.forEach(function (combo) {
      combo.keyIds.forEach(function (id) {
        const list = byKey.get(id) || [];
        list.push(combo);
        byKey.set(id, list);
      });
    });
    const groups = sheet.groups || [];
    if (!groups.some(function (g) { return g.id === group; })) group = groups[0] ? groups[0].id : "all";
    if (!selectedId && sheet.combos[0]) selectedId = sheet.combos[0].keyIds[0];
    const list = group === "all" ? sheet.combos : sheet.combos.filter(function (c) { return c.group === group; });
    const selectedCombos = byKey.get(selectedId) || [];
    const focus = selectedCombos[0] || list[0];
    const hot = new Set(list.flatMap(function (c) { return c.keyIds; }).concat(group === "all" && sheet.rows ? sheet.rows.flat().map(function (k) { return k.id; }) : ["fn"]));
    hot.add("fn");
    const density = sheet.layout === "numpad" ? "pad" : (sheet.layout === "sixty" || sheet.layout === "sixtyfive" ? "sixty" : "");
    var board = "";
    if (sheet.layout === "notes" || !sheet.rows || !sheet.rows.length) {
      board = '<p class="notes">No FN-firmware visualizer. The list below is the config path.</p>';
    } else {
      board = '<div class="plate ' + density + '"><div class="lamellae"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
        sheet.rows.map(function (row) {
          const y = row[0] && row[0].y ? ' style="--row-y: calc(var(--u) * ' + row[0].y + ')"' : "";
          return '<div class="row"' + y + '>' + row.map(function (k) { return keyButton(k, hot); }).join("") + '</div>';
        }).join("") + '</div>';
    }
    const via = sheet.via && sheet.via.steps
      ? '<ol class="via-steps">' + sheet.via.steps.map(function (s, i) { return '<li><span class="via-n">' + (i + 1) + '</span>' + esc(s) + '</li>'; }).join("") + '</ol>'
      : "";
    const lights = sheet.lightsOut
      ? '<button type="button" class="lights-out" id="lights-out"><span class="lights-out-title">Lights out.</span> ' + esc(sheet.lightsOut.copy) + '</button>'
      : "";
    const chips = [{ id: "all", label: "All" }].concat(groups).map(function (g) {
      return '<button type="button" class="chip" data-group="' + esc(g.id) + '" aria-pressed="' + (group === g.id) + '">' + esc(g.label) + '</button>';
    }).join("");
    const combosHtml = list.map(function (combo) {
      const active = (focus && focus.id === combo.id) || combo.keyIds.indexOf(selectedId) !== -1;
      return '<li><button type="button" class="combo' + (active ? ' active' : '') + (combo.danger ? ' danger' : '') + '" data-combo="' + esc(combo.id) + '"><kbd>' + esc(combo.chord) + '</kbd><span><span class="combo-title">' + esc(combo.title) + '</span>' + (combo.hold ? '<span class="combo-hold">' + esc(combo.hold) + '</span>' : '') + '</span></button></li>';
    }).join("");
    const detail = focus
      ? '<p class="group">' + esc(focus.group) + '</p><h2>' + esc(focus.title) + '</h2><p class="chord">' + esc(focus.chord) + '</p>' + (focus.hold ? '<p class="hold">' + esc(focus.hold) + '</p>' : '') + '<p class="body">' + esc(focus.detail) + '</p><div class="tags"><span class="tag' + (focus.confirmed ? ' ok' : '') + '">' + (focus.confirmed ? 'Confirmed' : 'Family firmware') + '</span>' + (focus.danger ? '<span class="tag danger">Destructive</span>' : '') + '</div>'
      : "";
    const hint = sheet.layout === "notes" ? "VIA writes to onboard memory." : "Highlighted keys are in this filter. Hold Fn, then the highlighted key.";
    const makerName = maker ? maker.name : parts[0];
    const modelName = model ? model.name : parts[1];
    app.innerHTML = '<main><a class="back" href="#/">' + esc(makerName) + ' / ' + esc(modelName) + '</a><header class="hero"><div><p class="eyebrow">' + esc(sheet.eyebrow) + '</p><h1>' + esc(sheet.title) + '</h1><p class="lede">' + esc(sheet.blurb) + '</p></div><button type="button" class="btn" id="print">Print</button></header>' + via + '<section class="plate-card"><div class="plate-toolbar">' + lights + '<nav class="chips" aria-label="Shortcut groups">' + chips + '</nav></div><div class="keyboard-scroll">' + board + '</div><p class="hint">' + hint + '</p></section><section class="grid"><ol class="combos">' + combosHtml + '</ol><aside class="detail">' + detail + '</aside></section><footer>' + esc(sheet.footer) + '</footer></main>';
    var printBtn = app.querySelector("#print");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    var lightsBtn = app.querySelector("#lights-out");
    if (lightsBtn) lightsBtn.addEventListener("click", function () { group = "rgb"; selectedId = sheet.lightsOut.keyId; render(); });
    app.querySelectorAll("[data-group]").forEach(function (el) {
      el.addEventListener("click", function () {
        group = el.getAttribute("data-group");
        if (group !== "all") {
          const first = sheet.combos.find(function (c) { return c.group === group; });
          if (first) selectedId = first.keyIds[0];
        }
        render();
      });
    });
    app.querySelectorAll("[data-key]").forEach(function (el) {
      el.addEventListener("click", function () {
        selectedId = el.getAttribute("data-key");
        const hit = byKey.get(selectedId);
        if (hit && hit[0]) group = hit[0].group;
        render();
      });
    });
    app.querySelectorAll("[data-combo]").forEach(function (el) {
      el.addEventListener("click", function () {
        const combo = sheet.combos.find(function (c) { return c.id === el.getAttribute("data-combo"); });
        if (!combo) return;
        selectedId = combo.keyIds[0];
        group = combo.group;
        render();
      });
    });
    window.onFnKey = function (e, down) {
      const found = (sheet.rows || []).flat().find(function (k) { return k.code === e.code; });
      if (!found) return;
      if (down) {
        pressed.add(found.id);
        selectedId = found.id;
        const hit = byKey.get(found.id);
        if (hit && hit[0]) group = hit[0].group;
      } else pressed.delete(found.id);
      render();
    };
  }
  async function render() {
    const r = route();
    if (r.view === "sheet") {
      var sheet;
      try { sheet = await loadSheet(r.key); } catch (e) { renderHub(); return; }
      if (render.lastKey !== r.key) {
        group = sheet.groups && sheet.groups[0] ? sheet.groups[0].id : "all";
        selectedId = sheet.combos[0] ? sheet.combos[0].keyIds[0] : null;
        pressed.clear();
        render.lastKey = r.key;
      }
      renderSheet(r.key, sheet);
    } else {
      render.lastKey = null;
      renderHub();
    }
  }
  window.addEventListener("hashchange", function () { render.lastKey = null; render(); });
  window.addEventListener("keydown", function (e) { if (window.onFnKey) window.onFnKey(e, true); });
  window.addEventListener("keyup", function (e) { if (window.onFnKey) window.onFnKey(e, false); });
  render();
})();
