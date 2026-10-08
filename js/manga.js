/* VORTEX GROUP — MANGA PAGE JS */

(async function () {

    const root = document.getElementById("manga-page");
    const id = new URLSearchParams(location.search).get("id");
    const STEP = 10;

    const fail = (title, text) => { root.innerHTML = V.empty("!", title, text); };

    if (!id) { fail("لم يتم تحديد العمل", "ارجع للتصفح واختر عملاً."); return; }

    const readPos = cid => { try { return parseInt(localStorage.getItem("vortex-pos-" + cid) || "0", 10) || 0; } catch (e) { return 0; } };
    const pagesOf = c => (c.pages && c.pages[0] && c.pages[0].count) || 0;

    try {

        const [m, chapters] = await Promise.all([VortexAPI.mangaById(id), VortexAPI.chaptersByManga(id)]);

        if (!m) { fail("العمل غير موجود", "ربما تم حذفه أو الرابط غير صحيح."); return; }

        document.title = `VORTEX GROUP — ${m.title}`;

        const cover = VortexAPI.fileUrl(m.cover_url);
        const genres = (m.genres || []).map(g => `<span class="tag">${V.esc(g)}</span>`).join("");
        const first = chapters.length ? chapters[chapters.length - 1] : null;
        const last = chapters.length ? chapters[0] : null;
        const resume = chapters.find(c => readPos(c.id) > 0);   // أعلى فصل فيه موضع محفوظ

        const info = [
            ["الحالة", m.status], ["المؤلف", m.author], ["الرسام", m.artist],
            ["الاسم الإنجليزي", m.english], ["الاسم الياباني", m.japanese]
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

        /* ---------- قائمة الفصول: بحث + ترتيب + عرض تدريجي ---------- */
        const st = { q: "", desc: true, shown: STEP };
        const listEl = document.getElementById("ch-list");
        const moreEl = document.getElementById("ch-more");
        const infoEl = document.getElementById("ch-info");

        function visible() {
            const q = st.q.trim().toLowerCase();
            let l = chapters.filter(c => !q || String(c.number).startsWith(q) || String(c.title || "").toLowerCase().includes(q));
            l.sort((a, b) => st.desc ? Number(b.number) - Number(a.number) : Number(a.number) - Number(b.number));
            if (/^\d+$/.test(q)) {                      // تطابق تام لرقم الفصل يظهر أولاً
                const i = l.findIndex(c => String(c.number) === q);
                if (i > 0) l.unshift(l.splice(i, 1)[0]);
            }
            return l;
        }

        function row(c) {
            const stamp = c.published_at || c.created_at;
            const date = V.dateYMD(stamp);
            const fresh = (c.created_at || c.published_at) && (Date.now() - new Date(c.created_at || c.published_at)) < 7 * 86400000;
            const pos = readPos(c.id);
            const n = String(c.number);
            const pg = pagesOf(c);
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
                        ${pg ? `<span>${V.icon("file", 14)}${pg} صفحة</span>` : ""}
                    </div>
                </div>
                <span class="ch-go">${V.icon("chevron")}</span>
            </a>`;
        }

        function render() {
            const l = visible();
            const part = l.slice(0, st.shown);
            listEl.innerHTML = part.length ? part.map(row).join("")
                : V.empty(V.icon("search", 26), chapters.length ? "لا توجد فصول مطابقة" : "لا توجد فصول بعد",
                    chapters.length ? "جرّب رقماً أو كلمة أخرى." : "سيتم إضافة الفصول قريبًا.");
            infoEl.textContent = chapters.length ? (st.q ? `${l.length} نتيجة من ${chapters.length} فصل` : `عرض ${part.length} من ${l.length} فصل`) : "";
            const left = l.length - part.length;
            moreEl.classList.toggle("hidden", left <= 0);
            moreEl.textContent = `عرض المزيد (${Math.min(STEP, left)} من ${left} متبقي)`;
        }

        let t;
        document.getElementById("ch-q").addEventListener("input", e => {
            clearTimeout(t);
            t = setTimeout(() => { st.q = e.target.value; st.shown = STEP; render(); }, 150);
        });
        document.getElementById("ch-sort").addEventListener("click", () => {
            st.desc = !st.desc;
            document.getElementById("ch-sort-label").textContent = st.desc ? "الأحدث أولاً" : "الأقدم أولاً";
            st.shown = STEP;
            render();
        });
        moreEl.addEventListener("click", () => { st.shown += STEP; render(); });

        render();

    } catch (err) {
        console.error("VORTEX manga error:", err);
        fail("تعذر تحميل العمل", "تحقق من الاتصال وحاول مرة ثانية.");
    }

})();
