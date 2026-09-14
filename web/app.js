(async () => {
  const { groups, combos, rows, codeToId } = await fetch("data.json").then((r) => r.json());
  const byKey = new Map();
  for (const combo of combos) {
    for (const id of combo.keyIds) {
      const list = byKey.get(id) ?? [];
      list.push(combo);
      byKey.set(id, list);
    }
  }

  const state = { group: "rgb", selectedId: "bsls", pressed: new Set() };
  const $chips = document.getElementById("chips");
  const $board = document.getElementById("board");
  const $combos = document.getElementById("combos");
  const $detail = document.getElementById("detail");

  document.getElementById("print").addEventListener("click", () => window.print());
  document.getElementById("lights-out").addEventListener("click", () => {
    state.group = "rgb";
    state.selectedId = "x";
    render();
  });

  function listForGroup() {
    if (state.group === "all") return combos;
    return combos.filter((c) => c.group === state.group);
  }

  function setGroup(id) {
    state.group = id;
    if (id !== "all") {
      const first = combos.find((c) => c.group === id);
      if (first) state.selectedId = first.keyIds[0];
    }
    render();
  }

  function selectKey(id) {
    state.selectedId = id;
    const hit = byKey.get(id)?.[0];
    if (hit) state.group = hit.group;
    render();
  }

  function renderChips() {
    const items = [{ id: "all", label: "All" }, ...groups];
    $chips.replaceChildren(
      ...items.map((g) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = g.label;
        b.setAttribute("aria-pressed", String(state.group === g.id));
        b.addEventListener("click", () => setGroup(g.id));
        return b;
      }),
    );
  }

  function renderBoard() {
    const hot = new Set(
      listForGroup()
        .flatMap((c) => c.keyIds)
        .concat(state.group === "all" ? rows.flat().map((k) => k.id) : ["fn"]),
    );
    hot.add("fn");
    const plate = document.createElement("div");
    plate.className = "plate";
    const lam = document.createElement("div");
    lam.className = "lamellae";
    lam.innerHTML = "<span></span><span></span><span></span><span></span><span></span><span></span><span></span>";
    plate.append(lam);
    for (const row of rows) {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      if (row[0]?.y) rowEl.style.setProperty("--row-y", `calc(var(--u) * ${row[0].y})`);
      for (const key of row) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key";
        btn.style.setProperty("--w", String(key.w));
        if (key.x) btn.style.setProperty("--x", String(key.x));
        const mapped = hot.has(key.id);
        if (key.id === "fn") btn.classList.add("fn");
        else if (mapped) btn.classList.add("mapped");
        if (state.selectedId === key.id || state.pressed.has(key.id)) btn.classList.add("sel");
        const chords = (byKey.get(key.id) ?? []).map((c) => c.chord).join(", ");
        btn.setAttribute("aria-pressed", String(state.selectedId === key.id));
        btn.setAttribute("aria-label", (key.label || "Space") + (chords ? `, ${chords}` : ""));
        if (key.sub) {
          btn.innerHTML = `<span class="sub">${escapeHtml(key.sub)}</span><span>${escapeHtml(key.label)}</span>`;
        } else if (key.id === "spc") {
          const sr = document.createElement("span");
          sr.className = "sr-only";
          sr.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden";
          sr.textContent = "Space";
          btn.append(sr);
        } else {
          btn.textContent = key.label;
        }
        btn.addEventListener("click", () => selectKey(key.id));
        rowEl.append(btn);
      }
      plate.append(rowEl);
    }
    $board.replaceChildren(plate);
  }

  function renderCombos() {
    const list = listForGroup();
    const selectedCombos = byKey.get(state.selectedId) ?? [];
    const focus = selectedCombos[0] ?? list[0];
    $combos.replaceChildren(
      ...list.map((combo) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        b.className = "combo";
        if (focus?.id === combo.id || combo.keyIds.includes(state.selectedId)) b.classList.add("active");
        if (combo.danger) b.classList.add("danger");
        b.innerHTML = `<kbd>${escapeHtml(combo.chord)}</kbd><span><span class="combo-title">${escapeHtml(combo.title)}</span>${combo.hold ? `<span class="combo-hold">${escapeHtml(combo.hold)}</span>` : ""}</span>`;
        b.addEventListener("click", () => {
          state.selectedId = combo.keyIds[0];
          state.group = combo.group;
          render();
        });
        li.append(b);
        return li;
      }),
    );
    if (!focus) {
      $detail.replaceChildren();
      return;
    }
    $detail.innerHTML = `<p class="group">${escapeHtml(focus.group)}</p><h2>${escapeHtml(focus.title)}</h2><p class="chord">${escapeHtml(focus.chord)}</p>${focus.hold ? `<p class="hold">${escapeHtml(focus.hold)}</p>` : ""}<p class="body">${escapeHtml(focus.detail)}</p><div class="tags"><span class="tag${focus.confirmed ? " ok" : ""}">${focus.confirmed ? "Confirmed on AKC087" : "Family firmware"}</span>${focus.danger ? `<span class="tag danger">Destructive</span>` : ""}</div>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&": return "\u0026amp;";
        case "<": return "\u0026lt;";
        case ">": return "\u0026gt;";
        case '"': return "\u0026quot;";
        default: return "\u0026#39;";
      }
    });
  }

  function render() {
    renderChips();
    renderBoard();
    renderCombos();
  }

  window.addEventListener("keydown", (e) => {
    const id = codeToId[e.code];
    if (!id) return;
    state.pressed.add(id);
    state.selectedId = id;
    const hit = byKey.get(id)?.[0];
    if (hit) state.group = hit.group;
    render();
  });
  window.addEventListener("keyup", (e) => {
    const id = codeToId[e.code];
    if (!id) return;
    state.pressed.delete(id);
    render();
  });

  render();
})();
