/* VORTEX GROUP — MANGA PAGE JS */

(async function () {

    const root = document.getElementById("manga-page");
    const id = new URLSearchParams(location.search).get("id");
    const VOL_SIZE = 4;      // عدد الفصول بكل مجلد
    const VSTEP = 6;         // عدد المجلدات المعروضة بكل دفعة

    const fail = (title, text) => { root.innerHTML = V.empty("!", title, text); };

    if (!id) { fail("لم يتم تحديد العمل", "ارجع للتصفح واختر عملاً."); return; }

    const readPos = cid => { try { return parseInt(localStorage.getItem("vortex-pos-" + cid) || "0", 10) || 0; } catch (e) { return 0; } };
    const pagesOf = c => (c.pages && c.pages[0] && c.pages[0].count) || 0;
    const hasViews = list => list.some(c => c.views !== undefined);

    try {

        const [m, chapters, volumes] = await Promise.all([VortexAPI.mangaById(id), VortexAPI.chaptersByManga(id), VortexAPI.volumesByManga(id)]);

        if (!m) { fail("العمل غير موجود", "ربما تم حذفه أو الرابط غير صحيح."); return; }

        document.title = `VORTEX GROUP — ${m.title}`;

        const cover = VortexAPI.fileUrl(m.cover_url);
        const genres = (m.genres || []).map(g => `<span class="tag">${V.esc(g)}</span>`).join("");
        const first = chapters.length ? chapters[chapters.length - 1] : null;
        const last = chapters.length ? chapters[0] : null;
        const resume = chapters.find(c => readPos(c.id) > 0);   // أعلى فصل فيه موضع محفوظ

        const totalViews = chapters.reduce((a, c) => a + (Number(c.views) || 0), 0);
        const info = [
            ["الحالة", m.status], ["المؤلف", m.author], ["الرسام", m.artist],
            ["الاسم الإنجليزي", m.english], ["الاسم الياباني", m.japanese],
            ["المشاهدات", hasViews(chapters) ? V.num(totalViews) : ""]
        ].filter(r => r[1]).map(r => `<div class="info-row"><span>${r[0]}</span><strong>${V.esc(r[1])}</strong></div>`).join("");

        root.innerHTML = `
        <section class="manga-header">
            <div class="manga-poster">${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}">` : ""}</div>
            <div class="manga-details">
                <span class="eyebrow">مانجا</span>
                <h1>${V.esc(m.title)}</h1>
                ${genres ? `<div class="tags">${genres}</div>` : ""}
                <div class="info-list">${info}</div>
                <p class="manga-description">${V.esc(m.description || "لا يوجد وصف.")}</p>
                <div class="hero-actions">
                    ${resume ? `<a class="btn primary glow" href="reader.html?chapter=${resume.id}">${V.icon("play", 18)} متابعة القراءة · فصل ${V.esc(resume.number)}</a>` : (first ? `<a class="btn primary" href="reader.html?chapter=${first.id}">${V.icon("play", 18)} ابدأ القراءة</a>` : "")}
                    ${last && first && last.id !== first.id ? `<a class="btn secondary" href="reader.html?chapter=${last.id}">آخر فصل (${V.esc(last.number)})</a>` : ""}
                    <button type="button" id="fav-btn" class="btn secondary fav" aria-pressed="false">${V.icon("heart", 18)} <span id="fav-label">إضافة للمفضلة</span></button>
                </div>
            </div>
        </section>

        <section class="section chapters-sec">
            <div class="section-head">
                <div><span class="eyebrow">الفصول</span><h2>قائمة الفصول</h2></div>
                <span class="ch-total">${chapters.length} فصل</span>
            </div>

            <div class="ch-tools">
                <label class="ch-search">${V.icon("search", 18)}<input id="ch-q" type="search" inputmode="search" placeholder="ابحث برقم الفصل أو العنوان..."></label>
                <button type="button" id="ch-sort" class="btn secondary">${V.icon("sort", 18)} <span id="ch-sort-label">الأحدث أولاً</span></button>
            </div>

            <div id="ch-info" class="ch-info"></div>
            <div id="ch-list" class="ch-list"></div>
            <div class="ch-more"><button type="button" id="ch-more" class="btn secondary hidden"></button></div>
        </section>`;

        /* ---------- المفضلة ---------- */
        const favBtn = document.getElementById("fav-btn");
        const syncFav = () => {
            const on = V.favs.has(m.id);
            favBtn.classList.toggle("on", on);
            favBtn.setAttribute("aria-pressed", on);
            document.getElementById("fav-label").textContent = on ? "في المفضلة" : "إضافة للمفضلة";
        };
        favBtn.addEventListener("click", () => { V.favs.toggle(m.id); syncFav(); favBtn.classList.add("pop"); setTimeout(() => favBtn.classList.remove("pop"), 400); });
        syncFav();

        /* ---------- المجلدات: كل 4 فصول بمجلد (تلقائيًا) ---------- */
        const asc = [...chapters].sort((a, b) => Number(a.number) - Number(b.number));
        const groups = [];
        asc.forEach((c, i) => {
            const n = Math.floor(i / VOL_SIZE) + 1;
            if (!groups[n - 1]) groups[n - 1] = { n, items: [], meta: volumes.find(v => Number(v.number) === n) || {} };
            groups[n - 1].items.push(c);
        });

        const st = { q: "", desc: true, shown: VSTEP, open: new Set() };
        const listEl = document.getElementById("ch-list");
        const moreEl = document.getElementById("ch-more");
        const infoEl = document.getElementById("ch-info");
        const ordered = () => (st.desc ? [...groups].reverse() : groups);
        const openFirst = () => { st.open = new Set(); const f = ordered()[0]; if (f) st.open.add(f.n); };
        openFirst();

        function view() {
            const q = st.q.trim().toLowerCase();
            const out = [];
            ordered().forEach(g => {
                let l = g.items.filter(c => !q || String(c.number).startsWith(q) || String(c.title || "").toLowerCase().includes(q));
                if (!l.length) return;
                l = [...l].sort((a, b) => st.desc ? Number(b.number) - Number(a.number) : Number(a.number) - Number(b.number));
                if (/^\d+$/.test(q)) {
                    const i = l.findIndex(c => String(c.number) === q);
                    if (i > 0) l.unshift(l.splice(i, 1)[0]);
                }
                out.push({ g, items: l });
            });
            if (/^\d+$/.test(q)) {
                const i = out.findIndex(x => x.items.some(c => String(c.number) === q));
                if (i > 0) out.unshift(out.splice(i, 1)[0]);
            }
            return out;
        }

        function row(c) {
            const stamp = c.published_at || c.created_at;
            const date = V.dateYMD(stamp);
            const fresh = (c.created_at || c.published_at) && (Date.now() - new Date(c.created_at || c.published_at)) < 7 * 86400000;
            const pos = readPos(c.id);
            const n = String(c.number);
            const pg = pagesOf(c);
            const views = c.views !== undefined ? Number(c.views) || 0 : null;
            return `
            <a class="ch-row${fresh ? " is-new" : ""}" href="reader.html?chapter=${c.id}">
                <div class="ch-num${n.length > 3 ? " long" : ""}"><small>فصل</small><b>${V.esc(n)}</b></div>
                <div class="ch-main">
                    <div class="ch-title">${V.esc(c.title || "الفصل " + n)}
                        ${fresh ? `<span class="ch-badge new">جديد</span>` : ""}
                        ${pos > 0 ? `<span class="ch-badge resume">متابعة · ص ${pos + 1}</span>` : ""}
                    </div>
                    <div class="ch-meta">
                        ${date ? `<span class="ch-date">${V.icon("calendar", 14)}<bdi dir="ltr">${date}</bdi></span>` : ""}
                        ${pg ? `<span>${V.icon("image", 14)}${pg} صفحة</span>` : ""}
                        ${views !== null ? `<span class="ch-views" title="عدد المشاهدات">${V.icon("eye", 15)}<bdi dir="ltr">${V.num(views)}</bdi> مشاهدة</span>` : ""}
                    </div>
                </div>
                <span class="ch-go">${V.icon("chevron")}</span>
            </a>`;
        }

        function volume(x, forceOpen) {
            const g = x.g, meta = g.meta;
            const cover = meta.cover_url ? VortexAPI.fileUrl(meta.cover_url) : "";
            const first = g.items[0].number, last = g.items[g.items.length - 1].number;
            const total = g.items.reduce((a, c) => a + (Number(c.views) || 0), 0);
            const hasViews = g.items.some(c => c.views !== undefined);
            const fresh = g.items.some(c => (c.created_at || c.published_at) && (Date.now() - new Date(c.created_at || c.published_at)) < 7 * 86400000);
            const open = forceOpen || st.open.has(g.n);
            return `
            <section class="vol${open ? " open" : ""}" data-n="${g.n}">
                <button type="button" class="vol-head" aria-expanded="${open}">
                    <div class="vol-cover">${cover ? `<img src="${V.esc(cover)}" alt="" loading="lazy">` : `<b>${g.n}</b>`}</div>
                    <div class="vol-info">
                        <small>مجلد ${g.n}${fresh ? ` <span class="ch-badge new">جديد</span>` : ""}</small>
                        <h3>${V.esc(meta.title || "المجلد " + g.n)}</h3>
                        <div class="vol-meta">
                            <span>${V.icon("book", 14)}${String(first) === String(last) ? "فصل " + V.esc(first) : "فصول " + V.esc(first) + " - " + V.esc(last)}</span>
                            <span>${V.icon("list", 14)}${g.items.length} فصل</span>
                            ${hasViews ? `<span class="ch-views">${V.icon("eye", 14)}<bdi dir="ltr">${V.num(total)}</bdi></span>` : ""}
                        </div>
                    </div>
                    <span class="vol-chev">${V.icon("chevron", 22)}</span>
                </button>
                <div class="vol-body"><div class="vol-rows">${x.items.map(row).join("")}</div></div>
            </section>`;
        }

        function render() {
            const l = view();
            const searching = !!st.q.trim();
            const part = searching ? l : l.slice(0, st.shown);
            listEl.innerHTML = part.length ? part.map(x => volume(x, searching)).join("")
                : V.empty(V.icon("search", 26), chapters.length ? "لا توجد فصول مطابقة" : "لا توجد فصول بعد",
                    chapters.length ? "جرّب رقماً أو كلمة أخرى." : "سيتم إضافة الفصول قريبًا.");
            if (!chapters.length) infoEl.textContent = "";
            else if (searching) infoEl.textContent = `${l.reduce((a, x) => a + x.items.length, 0)} نتيجة من ${chapters.length} فصل`;
            else infoEl.textContent = `${groups.length} مجلد · ${chapters.length} فصل`;
            const left = searching ? 0 : l.length - part.length;
            moreEl.classList.toggle("hidden", left <= 0);
            moreEl.textContent = `عرض المزيد (${left} مجلد متبقي)`;
        }

        listEl.addEventListener("click", e => {
            const h = e.target.closest(".vol-head");
            if (!h) return;
            const sec = h.closest(".vol"), n = Number(sec.dataset.n);
            const on = !sec.classList.contains("open");
            sec.classList.toggle("open", on);
            h.setAttribute("aria-expanded", on);
            on ? st.open.add(n) : st.open.delete(n);
        });

        let t;
        document.getElementById("ch-q").addEventListener("input", e => {
            clearTimeout(t);
            t = setTimeout(() => { st.q = e.target.value; st.shown = VSTEP; render(); }, 150);
        });
        document.getElementById("ch-sort").addEventListener("click", () => {
            st.desc = !st.desc;
            document.getElementById("ch-sort-label").textContent = st.desc ? "الأحدث أولاً" : "الأقدم أولاً";
            st.shown = VSTEP;
            openFirst();
            render();
        });
        moreEl.addEventListener("click", () => { st.shown += VSTEP; render(); });

        render();

    } catch (err) {
        console.error("VORTEX manga error:", err);
        fail("تعذر تحميل العمل", "تحقق من الاتصال وحاول مرة ثانية.");
    }

})();
