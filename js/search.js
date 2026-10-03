/* VORTEX — SEARCH JS (البحث المتقدم) */

(function () {

    const $ = id => document.getElementById(id);
    const qs = new URLSearchParams(location.search);
    const list = k => (qs.get(k) || "").split(",").filter(Boolean);

    const sel = {
        genres: new Set(list("genre")),
        tags: new Set(list("tags")),
        type: qs.get("type") || "",
        status: qs.get("status") || "",
        demo: qs.get("demo") || ""
    };

    const groups = [
        { key: "genres", title: "التصنيفات", multi: true, items: TAX.genres },
        { key: "type", title: "نوع العمل", items: TAX.types },
        { key: "status", title: "حالة العمل", items: TAX.status },
        { key: "demo", title: "الديموغرافية", items: TAX.demographics },
        { key: "tags", title: "الوسوم", multi: true, items: TAX.tags }
    ];

    const countOf = g => g.multi ? sel[g.key].size : (sel[g.key] ? 1 : 0);
    const total = () => groups.reduce((n, g) => n + countOf(g), 0);

    $("q").value = qs.get("q") || "";
    $("search-btn").innerHTML = `${V.icon("search", 18)} بحث`;

    function drawFilters() {
        $("filters").innerHTML = groups.map(g => `
            <details class="fgroup" ${countOf(g) ? "open" : ""}>
                <summary>${g.title} <span class="fcount" data-count="${g.key}">${countOf(g) || ""}</span></summary>
                <div class="fchips">
                    ${g.items.map(i => `<button type="button" class="fchip${(g.multi ? sel[g.key].has(i.v) : sel[g.key] === i.v) ? " active" : ""}" data-g="${g.key}" data-v="${V.esc(i.v)}">${V.esc(i.ar)} <small>${V.esc(i.en)}</small></button>`).join("")}
                </div>
            </details>`).join("");
    }

    function refreshUI() {
        const n = total();
        $("filters-toggle").innerHTML = `${V.icon("filter", 18)} الفلاتر${n ? ` (${n})` : ""}`;
        $("clear-btn").classList.toggle("hidden", !n && !$("q").value);
        groups.forEach(g => {
            const c = document.querySelector(`[data-count="${g.key}"]`);
            if (c) c.textContent = countOf(g) || "";
        });
    }

    $("filters").addEventListener("click", e => {
        const b = e.target.closest(".fchip");
        if (!b) return;
        const g = groups.find(x => x.key === b.dataset.g);
        const v = b.dataset.v;
        if (g.multi) {
            sel[g.key].has(v) ? sel[g.key].delete(v) : sel[g.key].add(v);
            b.classList.toggle("active");
        } else {
            const same = sel[g.key] === v;
            sel[g.key] = same ? "" : v;
            b.parentElement.querySelectorAll(".fchip").forEach(x => x.classList.remove("active"));
            if (!same) b.classList.add("active");
        }
        refreshUI();
        schedule();
    });

    $("filters-toggle").addEventListener("click", () => {
        const hidden = $("filters").classList.toggle("hidden");
        $("filters-toggle").setAttribute("aria-expanded", !hidden);
    });

    $("clear-btn").addEventListener("click", () => {
        sel.genres.clear(); sel.tags.clear();
        sel.type = sel.status = sel.demo = "";
        $("q").value = "";
        drawFilters();
        refreshUI();
        run();
    });

    $("search-btn").addEventListener("click", run);
    $("q").addEventListener("keydown", e => { if (e.key === "Enter") run(); });

    let timer;
    function schedule() { clearTimeout(timer); timer = setTimeout(run, 350); }

    const arr = set => `{${[...set].map(x => `"${x.replace(/"/g, "")}"`).join(",")}}`;

    async function run() {

        const q = $("q").value.trim().replace(/[,()*]/g, " ");
        const p = ["select=id,title,status,cover_url", "order=created_at.desc", "limit=60"];

        if (q) {
            const e = encodeURIComponent(`*${q}*`);
            p.push(`or=(title.ilike.${e},english.ilike.${e},japanese.ilike.${e})`);
        }
        if (sel.genres.size) p.push(`genres=cs.${encodeURIComponent(arr(sel.genres))}`);
        if (sel.tags.size) p.push(`tags=cs.${encodeURIComponent(arr(sel.tags))}`);
        if (sel.type) p.push(`type=eq.${encodeURIComponent(sel.type)}`);
        if (sel.demo) p.push(`demographic=eq.${encodeURIComponent(sel.demo)}`);
        if (sel.status) p.push(`status=ilike.${encodeURIComponent(`*${sel.status}*`)}`);

        const out = new URLSearchParams();
        if (q) out.set("q", q);
        if (sel.genres.size) out.set("genre", [...sel.genres].join(","));
        if (sel.tags.size) out.set("tags", [...sel.tags].join(","));
        if (sel.type) out.set("type", sel.type);
        if (sel.status) out.set("status", sel.status);
        if (sel.demo) out.set("demo", sel.demo);
        history.replaceState(null, "", out.toString() ? "?" + out : location.pathname);

        refreshUI();
        $("results").innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="loading-spinner"></div><p>جارٍ البحث...</p></div>`;

        try {
            const rows = await VortexAPI.rawGet(`manga?${p.join("&")}`);
            $("results-count").textContent = `${rows.length} نتيجة`;
            $("results").innerHTML = rows.length
                ? rows.map(V.mangaCard).join("")
                : V.empty(V.icon("search", 26), "لا توجد نتائج", "جرّب تقليل الفلاتر أو تغيير كلمة البحث.");
        } catch (err) {
            console.error("VORTEX search error:", err);
            $("results-count").textContent = "";
            $("results").innerHTML = V.empty(V.icon("info", 26), "تعذر البحث",
                "تأكد من تنفيذ أمر SQL الخاص بالأعمدة الجديدة (type, tags, demographic) في Supabase.");
        }
    }

    drawFilters();
    refreshUI();
    if (total()) $("filters").classList.remove("hidden");
    run();

})();
