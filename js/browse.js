/* VORTEX GROUP — BROWSE JS (أقسام حسب التصنيف) */

(function () {

    const $ = id => document.getElementById(id);
    const T = (typeof TAX !== "undefined") ? TAX : { genres: [], types: [], status: [] };
    const gInfo = {};
    T.genres.forEach((g, i) => { gInfo[g.v] = { ar: g.ar, en: g.en, order: i }; });

    const PAGE = 24;
    const SORTS = {
        latest: "الأحدث إضافة",
        oldest: "الأقدم إضافة",
        title: "الاسم (أ - ي)"
    };

    const qs = new URLSearchParams(location.search);
    const legacySort = qs.get("sort");

    const view = {
        q: "",
        type: qs.get("type") || "",
        status: qs.get("status") || "",
        genre: qs.get("genre") || "",
        sort: SORTS[legacySort] ? legacySort : "latest",
        mode: (qs.get("mode") === "all" || legacySort || qs.get("genre")) ? "all" : "sections"
    };

    let data = [];
    let shown = PAGE;
    let hasType = true;

    /* ---------- بيانات ---------- */
    async function fetchAll() {
        const base = "manga?order=created_at.desc&limit=1000&select=";
        try {
            return await VortexAPI.rawGet(base + "id,title,english,japanese,status,cover_url,genres,type,created_at");
        } catch (e) {
            hasType = false;   // عمود type غير موجود بعد
            return await VortexAPI.rawGet(base + "id,title,english,japanese,status,cover_url,genres,created_at");
        }
    }

    /* ---------- فلترة وترتيب ---------- */
    const byLatest = (a, b) => new Date(b.created_at) - new Date(a.created_at);

    function sorted(list) {
        const l = [...list];
        if (view.sort === "oldest") l.sort((a, b) => -byLatest(a, b));
        else if (view.sort === "title") l.sort((a, b) => a.title.localeCompare(b.title, "ar"));
        else l.sort(byLatest);
        return l;
    }

    function filtered(skipType) {
        const q = view.q.trim().toLowerCase();
        return data.filter(m =>
            (skipType || !view.type || m.type === view.type) &&
            (!view.status || String(m.status || "").includes(view.status)) &&
            (!view.genre || (m.genres || []).includes(view.genre)) &&
            (!q || `${m.title} ${m.english || ""} ${m.japanese || ""}`.toLowerCase().includes(q))
        );
    }

    const labelOf = g => (gInfo[g] ? gInfo[g].ar : g);
    const enOf = g => (gInfo[g] ? gInfo[g].en : "");

    /* ---------- بناء الواجهة ---------- */
    function buildControls() {
        $("f-status").innerHTML = `<option value="">كل الحالات</option>` +
            T.status.map(s => `<option value="${V.esc(s.v)}">${V.esc(s.ar)}</option>`).join("");
        $("f-status").value = view.status;

        $("f-sort").innerHTML = Object.entries(SORTS).map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
        $("f-sort").value = view.sort;
    }

    function drawTypeTabs() {
        const base = filtered(true);
        const count = t => base.filter(m => m.type === t).length;
        const tabs = [`<button type="button" class="pill${!view.type ? " on" : ""}" data-type="">الكل <small>${base.length}</small></button>`];
        if (hasType) {
            T.types.forEach(t => {
                const n = count(t.v);
                if (n || view.type === t.v) {
                    tabs.push(`<button type="button" class="pill${view.type === t.v ? " on" : ""}" data-type="${V.esc(t.v)}">${V.esc(t.ar)} <small>${n}</small></button>`);
                }
            });
        }
        $("type-tabs").innerHTML = tabs.join("");
    }

    function drawModeSeg() {
        document.querySelectorAll(".seg button").forEach(b => b.classList.toggle("on", b.dataset.mode === view.mode));
    }

    function drawActive() {
        $("active").innerHTML = view.genre
            ? `<span class="active-pill">التصنيف: ${V.esc(labelOf(view.genre))}<button type="button" id="clear-genre" aria-label="إزالة">×</button></span>`
            : "";
        const c = $("clear-genre");
        if (c) c.addEventListener("click", () => { view.genre = ""; render(); });
    }

    function section(id, title, en, items, genre) {
        return `
        <section class="bsec" id="${id}"${genre ? ` data-g="${V.esc(genre)}"` : ""}>
            <div class="section-head">
                <div><h2>${title}${en ? ` <small>${V.esc(en)}</small>` : ""}</h2><span class="bcount">${items.length} عمل</span></div>
                ${genre ? `<button type="button" class="linkbtn" data-all="${V.esc(genre)}">عرض الكل</button>` : ""}
            </div>
            <div class="rail">${items.map(m => `<div class="rail-item">${V.mangaCard(m)}</div>`).join("")}</div>
        </section>`;
    }

    function renderSections(list) {

        const groups = new Map();
        list.forEach(m => (m.genres || []).forEach(g => {
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g).push(m);
        }));

        const entries = [...groups].sort((a, b) =>
            b[1].length - a[1].length || ((gInfo[a[0]]?.order ?? 999) - (gInfo[b[0]]?.order ?? 999)));

        const none = list.filter(m => !(m.genres || []).length);
        const latest = [...list].sort(byLatest).slice(0, 12);

        let html = section("latest", "🆕 أُضيفت حديثًا", "", latest, null);
        entries.forEach(([g, items], i) => { html += section("g-" + i, V.esc(labelOf(g)), enOf(g), sorted(items), g); });
        if (none.length) html += section("g-other", "أعمال أخرى", "", sorted(none), null);

        $("content").innerHTML = html;
        $("more").classList.add("hidden");

        $("jump").innerHTML = entries.map(([g, items], i) =>
            `<a class="chip" href="#g-${i}">${V.esc(labelOf(g))}<small>${items.length}</small></a>`).join("");
    }

    function renderGrid(list) {
        const l = sorted(list);
        $("jump").innerHTML = "";
        $("content").innerHTML = `<div class="manga-grid">${l.slice(0, shown).map(V.mangaCard).join("")}</div>`;
        $("more").classList.toggle("hidden", shown >= l.length);
    }

    function syncUrl() {
        const p = new URLSearchParams();
        if (view.mode === "all") p.set("mode", "all");
        if (view.type) p.set("type", view.type);
        if (view.status) p.set("status", view.status);
        if (view.genre) p.set("genre", view.genre);
        if (view.sort !== "latest") p.set("sort", view.sort);
        history.replaceState(null, "", p.toString() ? "?" + p : location.pathname);
    }

    function render() {

        const list = filtered(false);
        drawTypeTabs();
        drawModeSeg();
        drawActive();
        syncUrl();
        $("count").textContent = `${list.length} عمل`;

        if (!list.length) {
            $("jump").innerHTML = "";
            $("more").classList.add("hidden");
            $("content").innerHTML = V.empty(V.icon("search", 26), "لا توجد أعمال مطابقة",
                "جرّب تغيير الفلاتر أو كلمة البحث، أو استخدم البحث المتقدم.");
            return;
        }

        view.mode === "all" ? renderGrid(list) : renderSections(list);
    }

    /* ---------- أحداث ---------- */
    $("type-tabs").addEventListener("click", e => {
        const b = e.target.closest(".pill");
        if (!b) return;
        view.type = b.dataset.type;
        shown = PAGE;
        render();
    });

    $("f-status").addEventListener("change", e => { view.status = e.target.value; shown = PAGE; render(); });
    $("f-sort").addEventListener("change", e => { view.sort = e.target.value; render(); });

    let timer;
    $("q").addEventListener("input", e => {
        clearTimeout(timer);
        timer = setTimeout(() => { view.q = e.target.value; shown = PAGE; render(); }, 180);
    });

    document.querySelector(".seg").addEventListener("click", e => {
        const b = e.target.closest("button");
        if (!b) return;
        view.mode = b.dataset.mode;
        shown = PAGE;
        render();
    });

    $("content").addEventListener("click", e => {
        const b = e.target.closest("[data-all]");
        if (!b) return;
        view.genre = b.dataset.all;
        view.mode = "all";
        shown = PAGE;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    $("more").addEventListener("click", () => { shown += PAGE; render(); });

    /* ---------- تشغيل ---------- */
    function skeleton() {
        const card = `<div class="rail-item"><div class="manga-card skeleton"><div class="manga-cover"></div><div class="manga-card-body"><div class="sk-line"></div><div class="sk-line short"></div></div></div></div>`;
        return `<section class="bsec"><div class="rail">${card.repeat(7)}</div></section>`.repeat(2);
    }

    async function init() {
        buildControls();
        $("content").innerHTML = skeleton();
        try {
            data = await fetchAll();
            render();
        } catch (err) {
            console.error("VORTEX browse error:", err);
            $("content").innerHTML = V.empty(V.icon("info", 26), "تعذر تحميل الأعمال", "تحقق من الاتصال وحاول مرة ثانية.");
            $("content").querySelector(".empty").insertAdjacentHTML("beforeend",
                `<button type="button" class="btn secondary" id="retry">إعادة المحاولة</button>`);
            $("retry").addEventListener("click", init);
        }
    }

    init();

})();
