/* VORTEX — HOME JS */

(async function () {

    const $ = id => document.getElementById(id);
    const featuredEl = $("featured");
    const latestEl = $("latest-chapters");
    const recentEl = $("recent-manga");

    try {

        const [chapters, recent] = await Promise.all([
            VortexAPI.latestChapters(8),
            VortexAPI.recentManga(18)
        ]);

        /* ---------- العمل المميز ---------- */
        if (recent.length) {
            const m = recent[0];
            const cover = VortexAPI.fileUrl(m.cover_url);
            const tags = (m.genres || []).slice(0, 4).map(g => `<span class="tag">${V.esc(g)}</span>`).join("");

            featuredEl.innerHTML = `
                ${cover ? `<div class="feature-bg" style="background-image:url('${V.esc(cover)}')"></div>` : ""}
                <div class="feature-inner">
                    <div class="feature-poster">${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}">` : ""}</div>
                    <div class="feature-text">
                        ${tags ? `<div class="tags">${tags}</div>` : ""}
                        <h1>${V.esc(m.title)}</h1>
                        <p>${V.esc(m.description || "")}</p>
                        <div class="feature-actions">
                            <a id="feature-read" class="btn primary" href="manga.html?id=${m.id}">${V.icon("play", 18)} ابدأ القراءة</a>
                            <a class="btn secondary" href="manga.html?id=${m.id}">${V.icon("info", 18)} تفاصيل العمل</a>
                        </div>
                    </div>
                </div>`;

            VortexAPI.chaptersByManga(m.id).then(list => {
                if (list.length) {
                    $("feature-read").href = `reader.html?chapter=${list[list.length - 1].id}`;
                }
            }).catch(() => {});
        }

        /* ---------- التصنيفات ---------- */
        const genres = [...new Set(recent.flatMap(m => m.genres || []))];
        if (genres.length) {
            $("genre-chips").innerHTML = genres.map(g =>
                `<a class="chip" href="browse.html?genre=${encodeURIComponent(g)}">${V.esc(g)}</a>`
            ).join("");
            $("genres-section").classList.remove("hidden");
        }

        /* ---------- آخر الفصول (مباشرة للقارئ) ---------- */
        latestEl.innerHTML = chapters.length
            ? chapters.map(c => {
                const cover = c.manga?.cover_url ? VortexAPI.fileUrl(c.manga.cover_url) : "";
                const when = V.date(c.published_at || c.created_at);
                return `
                <a class="chapter-card" href="reader.html?chapter=${c.id}">
                    <div class="chapter-thumb">${cover ? `<img src="${V.esc(cover)}" alt="" loading="lazy">` : ""}</div>
                    <div class="chapter-card-info">
                        <h3>${V.esc(c.manga?.title || "")}</h3>
                        <div class="chapter-card-meta">فصل ${c.number}${when ? " • " + when : ""}</div>
                    </div>
                    <span class="chapter-go">${V.icon("chevron")}</span>
                </a>`;
            }).join("")
            : V.empty(V.icon("book", 26), "لا توجد فصول بعد", "الفصول المضافة حديثًا ستظهر هنا.");

        /* ---------- أضيفت حديثًا ---------- */
        recentEl.innerHTML = recent.length
            ? recent.map(V.mangaCard).join("")
            : V.empty(V.icon("book", 26), "لا توجد أعمال بعد", "أضف أول عمل من لوحة الإدارة.");

    } catch (err) {

        console.error("VORTEX home error:", err);
        const msg = V.empty(V.icon("info", 26), "تعذر تحميل البيانات", "تحقق من الاتصال وحاول مرة ثانية.");
        latestEl.innerHTML = msg;
        recentEl.innerHTML = msg;
        featuredEl.style.display = "none";

    }

})();
