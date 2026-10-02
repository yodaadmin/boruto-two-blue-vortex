/* VORTEX — HOME JS */

(async function () {

    const featuredEl = document.getElementById("featured");
    const latestEl = document.getElementById("latest-chapters");
    const recentEl = document.getElementById("recent-manga");
    const popularEl = document.getElementById("popular-manga");

    const noWorks = V.empty("▣", "لا توجد أعمال بعد", "أضف أول عمل من لوحة الإدارة وسيظهر هنا.");
    const noChapters = V.empty("◈", "لا توجد فصول بعد", "الفصول المضافة حديثًا ستظهر هنا.");

    try {

        const [chapters, recent, popular] = await Promise.all([
            VortexAPI.latestChapters(8),
            VortexAPI.recentManga(12),
            VortexAPI.popularManga(6)
        ]);

        /* ---------- Hero ---------- */
        if (recent.length) {
            const m = recent[0];
            const cover = VortexAPI.fileUrl(m.cover_url);
            featuredEl.innerHTML = `
                ${cover ? `<img src="${V.esc(cover)}" alt="">` : ""}
                <div class="hero-content">
                    <span class="eyebrow">عمل مميز</span>
                    <h1>${V.esc(m.title)}</h1>
                    <p>${V.esc((m.description || "").slice(0, 220))}</p>
                    <div class="hero-actions">
                        <a class="btn primary" href="manga.html?id=${m.id}">ابدأ القراءة</a>
                        <a class="btn secondary" href="browse.html">تصفح المزيد</a>
                    </div>
                </div>`;
        } else {
            featuredEl.style.display = "none";
        }

        /* ---------- آخر الفصول ---------- */
        latestEl.innerHTML = chapters.length
            ? chapters.map(c => `
                <a class="chapter-card" href="chapter.html?id=${c.id}">
                    <div class="chapter-card-info">
                        <h3>${V.esc(c.manga?.title || "")} — فصل ${c.number}</h3>
                        <div class="chapter-card-meta">${V.esc(c.title)}</div>
                    </div>
                    <span class="section-link">اقرأ</span>
                </a>`).join("")
            : noChapters;

        /* ---------- أضيفت حديثًا ---------- */
        recentEl.innerHTML = recent.length ? recent.map(V.mangaCard).join("") : noWorks;

        /* ---------- شائعة ---------- */
        popularEl.innerHTML = popular.length ? popular.map(V.mangaCard).join("") : noWorks;

    } catch (err) {

        console.error("VORTEX home error:", err);

        const msg = V.empty("!", "تعذر تحميل البيانات", "تحقق من إعدادات الاتصال في config.js.");
        latestEl.innerHTML = msg;
        recentEl.innerHTML = msg;
        popularEl.innerHTML = msg;
        featuredEl.style.display = "none";

    }

})();
