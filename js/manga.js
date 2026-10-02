/* VORTEX — MANGA PAGE JS */

(async function () {

    const root = document.getElementById("manga-page");
    const id = new URLSearchParams(location.search).get("id");

    function fail(title, text) {
        root.innerHTML = V.empty("!", title, text);
    }

    if (!id) {
        fail("لم يتم تحديد العمل", "ارجع للتصفح واختر عملًا.");
        return;
    }

    try {

        const [m, chapters] = await Promise.all([
            VortexAPI.mangaById(id),
            VortexAPI.chaptersByManga(id)
        ]);

        if (!m) {
            fail("العمل غير موجود", "ربما تم حذفه أو الرابط غير صحيح.");
            return;
        }

        document.title = `VORTEX — ${m.title}`;

        const cover = VortexAPI.fileUrl(m.cover_url);
        const genres = (m.genres || []).map(g => `<span class="tag">${V.esc(g)}</span>`).join("");

        const first = chapters.length ? chapters[chapters.length - 1] : null;
        const last = chapters.length ? chapters[0] : null;

        const info = [
            ["الحالة", m.status],
            ["المؤلف", m.author],
            ["الرسام", m.artist],
            ["الاسم الإنجليزي", m.english],
            ["الاسم الياباني", m.japanese]
        ].filter(r => r[1]).map(r => `
            <div class="info-row"><span>${r[0]}</span><strong>${V.esc(r[1])}</strong></div>`).join("");

        root.innerHTML = `
        <section class="manga-header">
            <div class="manga-poster">
                ${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}">` : ""}
            </div>
            <div class="manga-details">
                <span class="eyebrow">مانجا</span>
                <h1>${V.esc(m.title)}</h1>
                ${genres ? `<div class="tags">${genres}</div>` : ""}
                <div class="info-list">${info}</div>
                <p class="manga-description">${V.esc(m.description || "لا يوجد وصف.")}</p>
                <div class="hero-actions">
                    ${first ? `<a class="btn primary" href="chapter.html?id=${first.id}">ابدأ القراءة</a>` : ""}
                    ${last && last.id !== first.id ? `<a class="btn secondary" href="chapter.html?id=${last.id}">آخر فصل</a>` : ""}
                </div>
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <div>
                    <span class="eyebrow">الفصول</span>
                    <h2>قائمة الفصول (${chapters.length})</h2>
                </div>
            </div>
            <div class="chapter-grid">
                ${chapters.length ? chapters.map(c => `
                <a class="chapter-card" href="chapter.html?id=${c.id}">
                    <div class="chapter-card-info">
                        <h3>فصل ${c.number}</h3>
                        <div class="chapter-card-meta">${V.esc(c.title)}${c.published_at ? " • " + V.esc(c.published_at) : ""}</div>
                    </div>
                    <span class="section-link">اقرأ</span>
                </a>`).join("") : V.empty("◈", "لا توجد فصول بعد", "سيتم إضافة الفصول قريبًا.")}
            </div>
        </section>`;

    } catch (err) {
        console.error("VORTEX manga error:", err);
        fail("تعذر تحميل العمل", "تحقق من الاتصال وحاول مرة ثانية.");
    }

})();
