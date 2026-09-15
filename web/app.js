(async () => {
  const app = document.getElementById("app");
  const ESC = { "&": "\u0026amp;", "<": "\u0026lt;", ">": "\u0026gt;", '"': "\u0026quot;", "'": "\u0026#39;" };
  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ESC[ch]);
  }
  function showError(err) {
    const msg = err && err.message ? err.message : String(err);
    app.innerHTML =
      '<main class="hub"><header class="hero"><div>' +
      '<p class="eyebrow">Desk</p><h1>Function sheets</h1>' +
      '<p class="lede">Could not load the catalog. Put <code>data.json</code> and <code>sheets/</code> next to <code>index.html</code>, then hard-refresh.</p>' +
      '<p class="lede">' +
      esc(msg) +
      "</p></div></header></main>";
  }

  let makers;
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json HTTP " + res.status);
    const data = await res.json();
    makers = data.makers;
    if (!Array.isArray(makers) || !makers.length) throw new Error("data.json has no makers list");
  } catch (err) {
    showError(err);
    return;
  }

  const sheetCache = new Map();
  async function loadSheet(key) {
    if (sheetCache.has(key)) return sheetCache.get(key);
    const res = await fetch("sheets/" + key.replace("/", "--") + ".json", { cache: "no-store" });
    if (!res.ok) throw new Error("sheet HTTP " + res.status);
    const sheet = await res.json();
    sheetCache.set(key, sheet);
    return sheet;
  }
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
    if (parts.length >= 2) {
      return { view: "sheet", key: `${parts[0]}/${parts[1]}`, makerId: parts[0], slug: parts[1] };
    }
    return { view: "hub" };
  }

  function renderHub() {
    document.title = "Function sheets";
    app.innerHTML = `<main class="hub">
      <header class="hero">
        <div>
          <p class="eyebrow">Desk · FN + VIA</p>
          <h1>Function sheets</h1>
          <p class="lede">Pick the manufacturer, then the board.</p>
        </div>
      </header>
      <ul class="makers"></ul>
    </main>`;
    const list = app.querySelector(".makers");
    for (const maker of makers) {
      const li = document.createElement("li");
      li.className = "maker";
      const open = openMaker === maker.id;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "maker-btn";
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = `<span class="maker-mark">${esc(maker.name.slice(0, 2))}</span><span class="maker-name">${esc(maker.name)}</span><span class="chev">▾</span>`;
      btn.addEventListener("click", () => {
        openMaker = openMaker === maker.id ? "" : maker.id;
        render();
      });
      li.append(btn);
      if (open) {
        const ul = document.createElement("ul");
        ul.className = "models";
        for (const model of maker.models) {
          const item = document.createElement("li");
          item.innerHTML = `<a href="#/${esc(maker.id)}/${esc(model.slug)}"><span><span class="model-name">${esc(model.name)}</span><span class="model-sum">${esc(model.summary)}</span></span><span class="badge">${model.config === "via" ? "VIA" : "FN"}</span></a>`;
          ul.append(item);
        }
        li.append(ul);
      }
      list.append(li);
    }
  }

  function renderSheet(key, sheet) {
    const [makerId, slug] = key.split("/");
    const maker = makers.find((m) => m.id === makerId);
    const model = maker?.models.find((m) => m.slug === slug);
    document.title = sheet.title;
    const byKey = new Map();
    for (const combo of sheet.combos) {
      for (const id of combo.keyIds) {
        const list = byKey.get(id) ?? [];
        list.push(combo);
        byKey.set(id, list);
      }
    }
    const groups = sheet.groups ?? [];
    if (group !== "all" && !groups.some((g) => g.id === group)) group = groups[0]?.id ?? "all";
    if (!selectedId) selectedId = sheet.combos[0]?.keyIds[0] ?? null;

    const list = group === "all" ? sheet.combos : sheet.combos.filter((c) => c.group === group);
    const selectedCombos = byKey.get(selectedId) ?? [];
    const focus = selectedCombos[0] ?? list[0];
    const hot = new Set(
      list.flatMap((c) => c.keyIds).concat(group === "all" ? (sheet.rows ?? []).flat().map((k) => k.id) : ["fn"]),
    );
    hot.add("fn");

    const density =
      sheet.layout === "numpad" ? "pad" : sheet.layout === "sixty" || sheet.layout === "sixtyfive" ? "sixty" : "";

    let board = "";
    if (sheet.layout === "notes" || !sheet.rows?.length) {
      board = `<p class="notes">No FN-firmware visualizer — this board is VIA. The list below is the config path.</p>`;
    } else {
      const rowsHtml = sheet.rows
        .map((row) => {
          const y = row[0]?.y ? ` style="--row-y: calc(var(--u) * ${row[0].y})"` : "";
          const keys = row
            .map((key) => {
              const mapped = hot.has(key.id);
              const cls = [
                "key",
                key.id === "fn" ? "fn" : mapped ? "mapped" : "",
                selectedId === key.id || pressed.has(key.id) ? "sel" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const label = key.sub
                ? `<span class="sub">${esc(key.sub)}</span><span>${esc(key.label)}</span>`
                : key.id === "spc"
                  ? `<span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden">Space</span>`
                  : esc(key.label);
              const h = key.h || 1;
              const kind = key.kind ? ` ${key.kind}` : "";
              const x = key.x ? `--x:${key.x};` : "";
              return `<button type="button" class="${cls}${kind}" style="--w:${key.w};--h:${h};${x}" data-key="${esc(key.id)}" aria-pressed="${selectedId === key.id}">${label}</button>`;
            })
            .join("");
          return `<div class="row"${y}>${keys}</div>`;
        })
        .join("");
      board = `<div class="plate ${density}"><div class="lamellae"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>${rowsHtml}</div>`;
    }

    function viaStepHtml(step, i) {
      const n = `<span class="via-n">${i + 1}</span>`;
      if (typeof step === "string") return `<li>${n}${esc(step)}</li>`;
      if (step.text) return `<li>${n}${esc(step.text)}</li>`;
      return `<li>${n}<span>${esc(step.before)}<a href="${esc(step.href)}" target="_blank" rel="noreferrer">${esc(step.label)}</a>${esc(step.after)}</span></li>`;
    }
    const via = sheet.via?.steps
      ? `<ol class="via-steps">${sheet.via.steps.map(viaStepHtml).join("")}</ol>`
      : "";

    const lights = sheet.lightsOut
      ? `<button type="button" class="lights-out" id="lights-out"><span class="lights-out-title">Lights out.</span> ${esc(sheet.lightsOut.copy)}</button>`
      : "";

    const chips = [{ id: "all", label: "All" }, ...groups]
      .map(
        (g) =>
          `<button type="button" class="chip" data-group="${esc(g.id)}" aria-pressed="${group === g.id}">${esc(g.label)}</button>`,
      )
      .join("");

    const combosHtml = list
      .map((combo) => {
        const active = focus?.id === combo.id || combo.keyIds.includes(selectedId);
        return `<li><button type="button" class="combo${active ? " active" : ""}${combo.danger ? " danger" : ""}" data-combo="${esc(combo.id)}"><kbd>${esc(combo.chord)}</kbd><span><span class="combo-title">${esc(combo.title)}</span>${combo.hold ? `<span class="combo-hold">${esc(combo.hold)}</span>` : ""}</span></button></li>`;
      })
      .join("");

    const detail = focus
      ? `<p class="group">${esc(focus.group)}</p><h2>${esc(focus.title)}</h2><p class="chord">${esc(focus.chord)}</p>${focus.hold ? `<p class="hold">${esc(focus.hold)}</p>` : ""}<p class="body">${esc(focus.detail)}</p><div class="tags"><span class="tag${focus.confirmed ? " ok" : ""}">${focus.confirmed ? "Confirmed" : "Family firmware"}</span>${focus.danger ? `<span class="tag danger">Destructive</span>` : ""}</div>`
      : "";

    const hint =
      sheet.layout === "notes"
        ? "VIA writes to onboard memory."
        : `Highlighted keys are in this filter. Hold Fn, then the highlighted key.`;

    const viaBtn = sheet.via?.jsonUrl
      ? `<a class="btn" href="${esc(sheet.via.jsonUrl)}" target="_blank" rel="noreferrer">VIA JSON</a>`
      : "";

    app.innerHTML = `<main>
      <a class="back" href="#/">${esc(maker?.name ?? makerId)} / ${esc(model?.name ?? slug)}</a>
      <header class="hero">
        <div>
          <p class="eyebrow">${esc(sheet.eyebrow)}</p>
          <h1>${esc(sheet.title)}</h1>
          <p class="lede">${esc(sheet.blurb)}</p>
        </div>
        <div class="hero-actions">${viaBtn}<button type="button" class="btn" id="print">Print</button></div>
      </header>
      ${via}
      <section class="plate-card">
        <div class="plate-toolbar">${lights}<nav class="chips" aria-label="Shortcut groups">${chips}</nav></div>
        <div class="keyboard-scroll">${board}</div>
        <p class="hint">${hint}</p>
      </section>
      <section class="grid">
        <ol class="combos">${combosHtml}</ol>
        <aside class="detail">${detail}</aside>
      </section>
      <footer>${esc(sheet.footer)}</footer>
    </main>`;

    app.querySelector("#print")?.addEventListener("click", () => window.print());
    app.querySelector("#lights-out")?.addEventListener("click", () => {
      group = "rgb";
      selectedId = sheet.lightsOut.keyId;
      render();
    });
    app.querySelectorAll("[data-group]").forEach((el) => {
      el.addEventListener("click", () => {
        group = el.getAttribute("data-group");
        if (group !== "all") {
          const first = sheet.combos.find((c) => c.group === group);
          if (first) selectedId = first.keyIds[0];
        }
        render();
      });
    });
    app.querySelectorAll("[data-key]").forEach((el) => {
      el.addEventListener("click", () => {
        selectedId = el.getAttribute("data-key");
        const hit = byKey.get(selectedId)?.[0];
        if (hit) group = hit.group;
        render();
      });
    });
    app.querySelectorAll("[data-combo]").forEach((el) => {
      el.addEventListener("click", () => {
        const combo = sheet.combos.find((c) => c.id === el.getAttribute("data-combo"));
        if (!combo) return;
        selectedId = combo.keyIds[0];
        group = combo.group;
        render();
      });
    });

    window.onFnKey = (e, down) => {
      const id = (sheet.rows ?? []).flat().find((k) => k.code === e.code)?.id;
      if (!id) return;
      if (down) {
        pressed.add(id);
        selectedId = id;
        const hit = byKey.get(id)?.[0];
        if (hit) group = hit.group;
      } else pressed.delete(id);
      render();
    };
  }

  async function render() {
    const r = route();
    if (r.view === "sheet") {
      let sheet;
      try {
        sheet = await loadSheet(r.key);
      } catch (err) {
        showError(err);
        return;
      }
      if (render.lastKey !== r.key) {
        group = sheet.groups?.[0]?.id ?? "all";
        selectedId = sheet.combos[0]?.keyIds[0] ?? null;
        pressed.clear();
        render.lastKey = r.key;
      }
      renderSheet(r.key, sheet);
    } else {
      render.lastKey = null;
      renderHub();
    }
  }

  window.addEventListener("hashchange", () => {
    render.lastKey = null;
    render();
  });
  window.addEventListener("keydown", (e) => window.onFnKey?.(e, true));
  window.addEventListener("keyup", (e) => window.onFnKey?.(e, false));
  await render();
})().catch((err) => {
  const app = document.getElementById("app");
  if (app) app.textContent = "Script error: " + err;
});
