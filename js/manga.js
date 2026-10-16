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

    const readJSON = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
    const isDone = cid => { try { return localStorage.getItem("vortex-done-" + cid) === "1"; } catch (e) { return false; } };

    function toast(msg) {
        let t = document.getElementById("m-toast");
        if (!t) { t = document.createElement("div"); t.id = "m-toast"; t.className = "m-toast"; document.body.appendChild(t); }
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toast.t);
        toast.t = setTimeout(() => t.classList.remove("show"), 2000);
    }

    const statusClass = s => /مستمر|ongoing/i.test(s || "") ? "ok" : /مكتمل|منته|complete/i.test(s || "") ? "done" : "";

    try {

        const [m, chapters, volumes] = await Promise.all([VortexAPI.mangaById(id), VortexAPI.chaptersByManga(id), VortexAPI.volumesByManga(id)]);

        if (!m) { fail("العمل غير موجود", "ربما تم حذفه أو الرابط غير صحيح."); return; }

        document.title = `VORTEX GROUP — ${m.title}`;

        const cover = VortexAPI.fileUrl(m.cover_url);
        const genres = (m.genres || []).map(g => `<a class="tag" href="browse.html?mode=all&genre=${encodeURIComponent(g)}">${V.esc(g)}</a>`).join("");
        const first = chapters.length ? chapters[chapters.length - 1] : null;
        const last = chapters.length ? chapters[0] : null;

        /* آخر فصل قرأه الزائر (يحفظه القارئ)، وإلا أعلى فصل فيه موضع محفوظ */
        const lastRec = readJSON("vortex-last-" + m.id);
        const resume = (lastRec && chapters.find(c => c.id === lastRec.c)) || chapters.find(c => readPos(c.id) > 0) || null;
        const resumePos = resume ? readPos(resume.id) : 0;
        const resumePages = resume ? pagesOf(resume) : 0;
        const resumePct = resume && resumePages ? Math.min(100, Math.round(((resumePos + 1) / resumePages) * 100)) : 0;

        const totalViews = chapters.reduce((a, c) => a + (Number(c.views) || 0), 0);
        const volCount = Math.ceil(chapters.length / VOL_SIZE);
        const latestStamp = chapters.reduce((a, c) => { const d = c.published_at || c.created_at; return d && (!a || d > a) ? d : a; }, "");

        const stats = [
            ["book", chapters.length, "فصل"],
            ["layers", volCount, "مجلد"],
            hasViews(chapters) ? ["eye", V.num(totalViews), "مشاهدة"] : null,
            latestStamp ? ["calendar", V.dateYMD(latestStamp), "آخر تحديث"] : null
        ].filter(Boolean).map(r => `
            <div class="stat">
                <span class="stat-ico">${V.icon(r[0], 20)}</span>
                <div><b dir="ltr">${V.esc(r[1])}</b><small>${r[2]}</small></div>
            </div>`).join("");

        const facts = [["المؤلف", m.author], ["الرسام", m.artist]]
            .filter(r => r[1])
            .map(r => `<div class="fact"><small>${r[0]}</small><strong>${V.esc(r[1])}</strong></div>`).join("");

        const altNames = [m.english, m.japanese].filter(Boolean).map(x => V.esc(x)).join("  /  ");

        const startBtn = first ? `<a class="btn primary" href="reader.html?chapter=${first.id}">${V.icon("play", 18)} ابدأ من الفصل ${V.esc(first.number)}</a>` : "";

        root.innerHTML = `
        <section class="mhero">
            ${cover ? `<div class="mhero-bg" style="background-image:url('${V.esc(cover)}')"></div>` : ""}
            <img class="mhero-swirl" src="assets/vortex-mark-white.png" alt="">
            <div class="mhero-inner">
                <div class="mposter-wrap">
                    <div class="mposter" id="mposter">${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}">` : ""}</div>
                    ${m.status ? `<span class="status-pill ${statusClass(m.status)}"><i></i>${V.esc(m.status)}</span>` : ""}
                </div>
                <div class="mdetails">
                    <h1>${V.esc(m.title)}</h1>
                    ${altNames ? `<div class="alt-names">${altNames}</div>` : ""}
                    ${genres ? `<div class="tags">${genres}</div>` : ""}

                    <div class="stats">${stats}</div>

                    <div class="desc">
                        <p class="manga-description clamp" id="desc">${V.esc(m.description || "لا يوجد وصف لهذا العمل بعد.")}</p>
                        <button type="button" class="desc-toggle hidden" id="desc-toggle">عرض المزيد ${V.icon("down", 16)}</button>
                    </div>

                    ${facts ? `<div class="facts">${facts}</div>` : ""}

                    ${resume ? `
                    <a class="resume-card" href="reader.html?chapter=${resume.id}">
                        <span class="resume-ico">${V.icon("bookmark", 22)}</span>
                        <div class="resume-main">
                            <small>أكمل من حيث توقفت</small>
                            <b>${V.esc(resume.title || "الفصل " + resume.number)}</b>
                            ${resumePct ? `<div class="resume-bar"><i style="width:${resumePct}%"></i></div><em>الصفحة ${resumePos + 1} من ${resumePages}</em>` : ""}
                        </div>
                        <span class="resume-go">${V.icon("chevron", 20)}</span>
                    </a>` : ""}

                    <div class="hero-actions">
                        ${resume ? "" : startBtn}
                        ${last && first && last.id !== first.id ? `<a class="btn secondary" href="reader.html?chapter=${last.id}">${V.icon("clock", 18)} آخر فصل (${V.esc(last.number)})</a>` : ""}
                        <button type="button" id="fav-btn" class="btn secondary fav" aria-pressed="false">${V.icon("heart", 18)} <span id="fav-label">إضافة للمفضلة</span></button>
                        <button type="button" id="share-btn" class="btn secondary" aria-label="مشاركة">${V.icon("share", 18)} مشاركة</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="section chapters-sec">
            <div class="section-head">
                <div><span class="eyebrow">الفصول</span><h2>المجلدات والفصول</h2></div>
                <span class="ch-total">${chapters.length} فصل</span>
            </div>

            <div class="ch-tools">
                <label class="ch-search">${V.icon("search", 18)}<input id="ch-q" type="search" inputmode="search" placeholder="ابحث برقم الفصل أو العنوان..."></label>
                <button type="button" id="ch-sort" class="btn secondary">${V.icon("sort", 18)} <span id="ch-sort-label">الأحدث أولاً</span></button>
            </div>

            <div id="ch-info" class="ch-info"></div>
            <div id="ch-list" class="ch-list"></div>
            <div class="ch-more"><button type="button" id="ch-more" class="btn secondary hidden"></button></div>
        </section>

        <section class="section related hidden" id="related">
            <div class="section-head"><div><span class="eyebrow">اكتشف المزيد</span><h2>أعمال مشابهة</h2></div></div>
            <div class="related-rail" id="related-rail"></div>
        </section>`;

        /* ---------- المفضلة + المشاركة ---------- */
        const favBtn = document.getElementById("fav-btn");
        const syncFav = () => {
            const on = V.favs.has(m.id);
            favBtn.classList.toggle("on", on);
            favBtn.setAttribute("aria-pressed", on);
            document.getElementById("fav-label").textContent = on ? "في المفضلة" : "إضافة للمفضلة";
        };
        favBtn.addEventListener("click", () => {
            V.favs.toggle(m.id); syncFav();
            favBtn.classList.add("pop"); setTimeout(() => favBtn.classList.remove("pop"), 400);
            toast(V.favs.has(m.id) ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
        });
        syncFav();

        document.getElementById("share-btn").addEventListener("click", async () => {
            try {
                if (navigator.share) { await navigator.share({ title: m.title, url: location.href }); return; }
                await navigator.clipboard.writeText(location.href);
                toast("تم نسخ رابط العمل");
            } catch (e) { /* أُلغيت المشاركة */ }
        });

        /* وصف قابل للطي */
        const descEl = document.getElementById("desc"), descBtn = document.getElementById("desc-toggle");
        requestAnimationFrame(() => {
            if (descEl.scrollHeight > descEl.clientHeight + 4) descBtn.classList.remove("hidden");
        });
        descBtn.addEventListener("click", () => {
            const open = descEl.classList.toggle("clamp") === false;
            descBtn.firstChild.textContent = open ? "عرض أقل " : "عرض المزيد ";
            descBtn.classList.toggle("open", open);
        });

        /* ميلان خفيف للغلاف مع حركة المؤشر (للشاشات الكبيرة) */
        const poster = document.getElementById("mposter");
        if (poster && matchMedia("(hover: hover) and (min-width: 900px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            poster.addEventListener("pointermove", e => {
                const r = poster.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
                poster.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
            });
            poster.addEventListener("pointerleave", () => { poster.style.transform = ""; });
        }

        /* أعمال مشابهة */
        VortexAPI.relatedManga(m, 12).then(list => {
            if (!list.length) return;
            document.getElementById("related-rail").innerHTML = list.map(x => `<div class="related-item">${V.mangaCard(x)}</div>`).join("");
            document.getElementById("related").classList.remove("hidden");
        }).catch(() => {});

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
            const done = isDone(c.id);
            const n = String(c.number);
            const pg = pagesOf(c);
            const views = c.views !== undefined ? Number(c.views) || 0 : null;
            return `
            <a class="ch-row${fresh ? " is-new" : ""}${done ? " is-done" : ""}" href="reader.html?chapter=${c.id}">
                <div class="ch-num${n.length > 3 ? " long" : ""}"><small>فصل</small><b>${V.esc(n)}</b></div>
                <div class="ch-main">
                    <div class="ch-title">${V.esc(c.title || "الفصل " + n)}
                        ${fresh ? `<span class="ch-badge new">جديد</span>` : ""}
                        ${done ? `<span class="ch-badge read">${V.icon("check", 12)} مقروء</span>` : (pos > 0 ? `<span class="ch-badge resume">متابعة · ص ${pos + 1}</span>` : "")}
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
            const readCount = g.items.filter(c => isDone(c.id)).length;
            const pct = Math.round((readCount / g.items.length) * 100);
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
                            ${readCount ? `<span class="vol-read">${V.icon("check", 14)}${readCount}/${g.items.length} مقروء</span>` : ""}
                            ${hasViews ? `<span class="ch-views">${V.icon("eye", 14)}<bdi dir="ltr">${V.num(total)}</bdi></span>` : ""}
                        </div>
                    </div>
                    <span class="vol-chev">${V.icon("chevron", 22)}</span>
                    ${readCount ? `<span class="vol-bar"><i style="width:${pct}%"></i></span>` : ""}
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
