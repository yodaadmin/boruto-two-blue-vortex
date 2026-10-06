/* VORTEX GROUP — HOME JS */

(async function () {

    const $ = id => document.getElementById(id);
    const featuredEl = $("featured");
    const latestEl = $("latest-chapters");
    const recentEl = $("recent-manga");

    /* ---------- أدوات ---------- */
    const unit = (n, one, two, few, many) => n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`;

    function ago(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return "";
        const s = (Date.now() - d) / 1000;
        if (s < 60) return "الآن";
        const m = Math.floor(s / 60);
        if (m < 60) return "منذ " + unit(m, "دقيقة", "دقيقتين", "دقائق", "دقيقة");
        const h = Math.floor(m / 60);
        if (h < 24) return "منذ " + unit(h, "ساعة", "ساعتين", "ساعات", "ساعة");
        const dd = Math.floor(h / 24);
        if (dd < 30) return "منذ " + unit(dd, "يوم", "يومين", "أيام", "يومًا");
        return V.date(iso);
    }

    function reveal() {
        const els = document.querySelectorAll(".reveal");
        if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
        const io = new IntersectionObserver(list => list.forEach(x => {
            if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); }
        }), { threshold: 0.12 });
        els.forEach(e => io.observe(e));
    }

    reveal();

    try {

        const [chapters, recent] = await Promise.all([
            VortexAPI.latestChapters(3),
            VortexAPI.recentManga(18)
        ]);

        /* ---------- العمل المميز ---------- */
        if (recent.length) {
            const m = recent[0];
            const cover = VortexAPI.fileUrl(m.cover_url);
            const tags = (m.genres || []).slice(0, 4).map(g => `<span class="tag">${V.esc(g)}</span>`).join("");

            featuredEl.innerHTML = `
                ${cover ? `<div class="feature-bg" style="background-image:url('${V.esc(cover)}')"></div>` : ""}
                <img class="feature-swirl" src="assets/vortex-mark-white.png" alt="">
                <div class="feature-inner">
                    <div class="feature-poster">${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}">` : ""}</div>
                    <div class="feature-text">
                        <span class="feature-kicker"><i></i> مميّز الآن</span>
                        ${tags ? `<div class="tags">${tags}</div>` : ""}
                        <h1>${V.esc(m.title)}</h1>
                        <p>${V.esc(m.description || "")}</p>
                        <div class="feature-actions">
                            <a id="feature-read" class="btn primary glow" href="manga.html?id=${m.id}">${V.icon("play", 18)} ابدأ القراءة</a>
                            <a class="btn secondary" href="manga.html?id=${m.id}">${V.icon("info", 18)} تفاصيل العمل</a>
                        </div>
                    </div>
                </div>`;

            VortexAPI.chaptersByManga(m.id).then(list => {
                if (list.length) $("feature-read").href = `reader.html?chapter=${list[list.length - 1].id}`;
            }).catch(() => {});
        }

        /* ---------- آخر 3 فصول (حسب آخر تحديث) ---------- */
        latestEl.innerHTML = chapters.length
            ? chapters.map((c, i) => {
                const cover = c.manga?.cover_url ? VortexAPI.fileUrl(c.manga.cover_url) : "";
                const stamp = c.created_at || c.published_at;
                const fresh = stamp && (Date.now() - new Date(stamp)) < 3 * 86400000;
                return `
                <a class="latest-card" style="--i:${i}" href="reader.html?chapter=${c.id}">
                    <div class="latest-cover">${cover ? `<img src="${V.esc(cover)}" alt="" loading="lazy">` : ""}</div>
                    <div class="latest-info">
                        ${fresh ? `<span class="new-badge"><i></i> جديد</span>` : ""}
                        <h3>${V.esc(c.manga?.title || "")}</h3>
                        <div class="latest-chapter">الفصل ${V.esc(c.number)}</div>
                        <div class="latest-time">${ago(stamp)}</div>
                    </div>
                    <span class="latest-go">${V.icon("chevron")}</span>
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
