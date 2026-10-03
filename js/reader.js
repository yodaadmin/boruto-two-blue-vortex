/* VORTEX — READER JS v2 */

(function () {

    const $ = id => document.getElementById(id);

    const KEY = "vortex-reader-v2";
    const DEF = { mode: "vertical", fit: "width", rtl: true, bg: "navy", bright: 100, gap: 0, remember: true };

    let S = { ...DEF };
    try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}

    const params = new URLSearchParams(location.search);
    const chapterId = params.get("chapter");
    const POS_KEY = "vortex-pos-" + chapterId;
    const self = location.pathname.split("/").pop() || "reader.html";

    const pagesEl = $("reader-pages");
    let wraps = [], srcs = [], cur = 0, zoom = 1, toastTimer, chapterList = null, currentChapter = null;

    const isPaged = () => S.mode !== "vertical";
    const step = () => (S.mode === "double" ? 2 : 1);
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
    const savePos = () => { if (S.remember) { try { localStorage.setItem(POS_KEY, String(cur)); } catch (e) {} } };

    function toast(msg) {
        const t = $("reader-toast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
    }

    function fail(msg) {
        $("reader-loading").classList.add("hidden");
        $("reader-content").classList.add("hidden");
        $("reader-error-message").textContent = msg;
        $("reader-error").classList.remove("hidden");
    }

    /* ---------- العرض ---------- */

    function updateCounter() {
        const c = $("page-counter");
        c.querySelector("strong").textContent = wraps.length ? cur + 1 : 0;
        c.querySelectorAll("span")[1].textContent = wraps.length;
        $("scrub-bubble").textContent = `${cur + 1} / ${wraps.length}`;
    }

    function renderView() {
        pagesEl.className = `reader-pages mode-${S.mode} fit-${S.fit} ${S.rtl ? "rtl" : "ltr"}` + (isPaged() ? " paged" : "");
        pagesEl.style.setProperty("--zoom", zoom);
        pagesEl.style.setProperty("--gap", S.gap + "px");
        pagesEl.style.filter = S.bright === 100 ? "" : `brightness(${S.bright}%)`;

        if (S.mode === "double") cur -= cur % 2;

        wraps.forEach((w, i) => {
            w.classList.toggle("current", isPaged() && (i === cur || (S.mode === "double" && i === cur + 1)));
        });

        if (isPaged()) {
            for (let k = 0; k < step(); k++) {
                const next = srcs[cur + step() + k];
                if (next) new Image().src = next;
            }
        }
        updateCounter();
    }

    function applySettings() {
        document.body.dataset.bg = S.bg;
        document.body.dataset.mode = S.mode;

        document.querySelectorAll(".settings-option").forEach(b => {
            const on = String(S[b.dataset.setting]) === b.dataset.value;
            b.classList.toggle("active", on);
            b.setAttribute("aria-pressed", on);
        });

        $("set-bright").value = S.bright;
        $("bright-value").textContent = S.bright + "%";
        $("set-gap").value = S.gap;
        $("gap-value").textContent = S.gap + "px";
        $("remember-position").checked = !!S.remember;
        renderView();
    }

    function goTo(i, smooth = true) {
        if (!wraps.length) return;
        cur = Math.max(0, Math.min(wraps.length - 1, i));
        if (isPaged()) {
            renderView();
            window.scrollTo({ top: 0 });
        } else {
            wraps[cur].scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
            updateCounter();
        }
        savePos();
    }

    function nextPage() {
        if (cur + step() >= wraps.length) { $("reader-end").scrollIntoView({ behavior: "smooth" }); return; }
        goTo(cur + step());
    }

    function prevPage() {
        if (cur <= 0) { toast("هذه أول صفحة"); return; }
        goTo(cur - step());
    }

    /* ---------- الشريط الجانبي (Webtoon) ---------- */

    const track = $("scrub-track"), thumb = $("scrub-thumb"), scrub = $("scrub");
    let dragging = false;

    function span() {
        const top = pagesEl.getBoundingClientRect().top + window.scrollY;
        return [top, Math.max(top + 1, top + pagesEl.offsetHeight - window.innerHeight)];
    }

    function scrubSync() {
        if (isPaged() || dragging) return;
        const [a, b] = span();
        const r = Math.min(1, Math.max(0, (window.scrollY - a) / (b - a)));
        thumb.style.top = `calc(${r} * (100% - 40px))`;
    }

    function scrubTo(y) {
        const rect = track.getBoundingClientRect();
        const r = Math.min(1, Math.max(0, (y - rect.top - 20) / (rect.height - 40)));
        thumb.style.top = `calc(${r} * (100% - 40px))`;
        const [a, b] = span();
        window.scrollTo(0, a + r * (b - a));
    }

    track.addEventListener("pointerdown", e => {
        dragging = true;
        track.setPointerCapture(e.pointerId);
        scrub.classList.add("active");
        scrubTo(e.clientY);
        e.preventDefault();
    });
    track.addEventListener("pointermove", e => { if (dragging) scrubTo(e.clientY); });
    const endDrag = () => { dragging = false; setTimeout(() => { if (!dragging) scrub.classList.remove("active"); }, 900); };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    /* ---------- تتبع التمرير ---------- */

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking || !wraps.length || isPaged()) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            let idx = 0;
            for (let i = 0; i < wraps.length; i++) {
                if (wraps[i].getBoundingClientRect().top <= window.innerHeight * 0.4) idx = i; else break;
            }
            if (idx !== cur) { cur = idx; updateCounter(); savePos(); }
            scrubSync();
        });
    }, { passive: true });

    /* ---------- النوافذ (إعدادات / فصول) ---------- */

    function closeAll() {
        $("reader-settings").classList.remove("open");
        $("chapters-modal").classList.remove("open");
        $("reader-overlay").classList.remove("open");
        $("reader-settings").setAttribute("aria-hidden", "true");
        $("toggle-settings").setAttribute("aria-expanded", "false");
    }

    function openSettings() {
        closeAll();
        $("reader-settings").classList.add("open");
        $("reader-overlay").classList.add("open");
        $("reader-settings").setAttribute("aria-hidden", "false");
        $("toggle-settings").setAttribute("aria-expanded", "true");
    }

    function openChapters() {
        closeAll();
        $("chapters-modal").classList.add("open");
        $("reader-overlay").classList.add("open");
        const cu = $("chapters-list").querySelector(".current");
        if (cu) cu.scrollIntoView({ block: "center" });
    }

    function renderChapterList() {
        if (!chapterList || !currentChapter) return;
        $("chapters-list").innerHTML = chapterList.map(c => `
            <a class="chapter-item${c.id === currentChapter.id ? " current" : ""}" href="${self}?chapter=${encodeURIComponent(c.id)}">
                <strong>فصل ${V.esc(c.number)}</strong>
                <span>${V.esc(c.title || "")}</span>
            </a>`).join("") || `<p class="hint">لا توجد فصول أخرى.</p>`;
    }

    $("toggle-settings").addEventListener("click", openSettings);
    $("toggle-chapters").addEventListener("click", openChapters);
    $("close-settings").addEventListener("click", closeAll);
    $("close-chapters").addEventListener("click", closeAll);
    $("reader-overlay").addEventListener("click", closeAll);

    /* ---------- ملء الشاشة ---------- */

    const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

    function syncFs() {
        $("toggle-fullscreen").classList.toggle("on", fsOn() || document.body.classList.contains("immersive"));
    }

    async function toggleFs() {
        const d = document.documentElement;
        try {
            if (fsOn()) {
                (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            } else if (d.requestFullscreen || d.webkitRequestFullscreen) {
                await (d.requestFullscreen || d.webkitRequestFullscreen).call(d);
            } else {
                document.body.classList.toggle("immersive");
            }
        } catch (e) {
            document.body.classList.toggle("immersive");
        }
        syncFs();
    }

    $("toggle-fullscreen").addEventListener("click", toggleFs);
    document.addEventListener("fullscreenchange", syncFs);
    document.addEventListener("webkitfullscreenchange", syncFs);

    /* ---------- الإعدادات ---------- */

    document.querySelectorAll(".settings-option").forEach(b => {
        b.addEventListener("click", () => {
            const key = b.dataset.setting;
            let val = b.dataset.value;
            if (key === "rtl") val = val === "true";
            S[key] = val;
            save();
            applySettings();
            if (key === "mode" || key === "fit") goTo(cur, false);
        });
    });

    $("set-bright").addEventListener("input", e => { S.bright = +e.target.value; $("bright-value").textContent = S.bright + "%"; renderView(); save(); });
    $("set-gap").addEventListener("input", e => { S.gap = +e.target.value; $("gap-value").textContent = S.gap + "px"; renderView(); save(); });
    $("remember-position").addEventListener("change", e => { S.remember = e.target.checked; save(); });

    $("reset-reader-settings").addEventListener("click", () => {
        S = { ...DEF };
        zoom = 1;
        $("zoom-reset").textContent = "100%";
        save();
        applySettings();
        goTo(cur, false);
        toast("تمت إعادة الضبط");
    });

    /* ---------- أزرار الأسفل ---------- */

    $("next-page").addEventListener("click", nextPage);
    $("previous-page").addEventListener("click", prevPage);
    $("reader-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    function setZoom(z) {
        zoom = Math.max(0.5, Math.min(3, z));
        pagesEl.style.setProperty("--zoom", zoom);
        $("zoom-reset").textContent = Math.round(zoom * 100) + "%";
    }
    $("zoom-in").addEventListener("click", () => setZoom(zoom + 0.25));
    $("zoom-out").addEventListener("click", () => setZoom(zoom - 0.25));
    $("zoom-reset").addEventListener("click", () => setZoom(1));
    $("retry-reader").addEventListener("click", () => location.reload());

    /* ---------- لوحة المفاتيح + لمس + سحب ---------- */

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { closeAll(); return; }
        if (e.target.tagName === "INPUT") return;
        const forward = S.rtl ? "ArrowLeft" : "ArrowRight";
        const back = S.rtl ? "ArrowRight" : "ArrowLeft";
        if (e.key === forward) nextPage();
        else if (e.key === back) prevPage();
        else if (isPaged() && (e.key === " " || e.key === "ArrowDown")) { e.preventDefault(); nextPage(); }
        else if (isPaged() && e.key === "ArrowUp") { e.preventDefault(); prevPage(); }
    });

    /* لمس نصف الصفحة: الجهة المحددة = الصفحة التالية */
    pagesEl.addEventListener("click", e => {
        if (!isPaged() || !e.target.closest("img")) return;
        const leftHalf = e.clientX < window.innerWidth / 2;
        (leftHalf === S.rtl) ? nextPage() : prevPage();
    });

    /* السحب باتجاه الصفحة المطلوبة */
    let tx = 0, ty = 0;
    pagesEl.addEventListener("touchstart", e => { const t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
    pagesEl.addEventListener("touchend", e => {
        if (!isPaged()) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - tx, dy = t.clientY - ty;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            (dx < 0) === S.rtl ? nextPage() : prevPage();
        }
    }, { passive: true });

    /* ---------- التحميل ---------- */

    async function init() {

        if (!chapterId) { fail("لم يتم تحديد الفصل."); return; }

        try {

            const [ch, pages] = await Promise.all([VortexAPI.getChapter(chapterId), VortexAPI.getPages(chapterId)]);

            if (!ch) { fail("لم يتم العثور على الفصل المطلوب."); return; }
            if (!pages.length) { fail("هذا الفصل لا يحتوي على صفحات بعد."); return; }

            currentChapter = ch;
            const title = ch.title || `الفصل ${ch.number}`;
            const mangaName = ch.manga_title || "المانجا";
            const mangaHref = ch.manga_id ? `manga.html?id=${encodeURIComponent(ch.manga_id)}` : "index.html";

            document.title = `VORTEX — ${mangaName} — ${title}`;
            $("reader-title").innerHTML = `<span>${V.esc(mangaName)} — ${V.esc(title)}</span>`;
            $("reader-manga-name").textContent = mangaName;
            $("reader-chapter-name").textContent = title;
            $("reader-chapter-description").textContent = ch.number ? `الفصل ${ch.number}` : "";
            ["manga-link", "reader-info-link", "reader-manga"].forEach(id => { $(id).href = mangaHref; });

            if (ch.previous_chapter) {
                $("reader-previous").href = `${self}?chapter=${encodeURIComponent(ch.previous_chapter)}`;
                $("reader-previous").classList.remove("hidden");
            }
            if (ch.next_chapter) {
                $("reader-next").href = `${self}?chapter=${encodeURIComponent(ch.next_chapter)}`;
                $("reader-next").classList.remove("hidden");
            }

            srcs = pages.map(p => VortexAPI.fileUrl(p.storage_path));
            wraps = srcs.map((src, i) => {
                const w = document.createElement("div");
                w.className = "reader-page";
                const img = document.createElement("img");
                img.src = src;
                img.alt = `صفحة ${i + 1}`;
                img.decoding = "async";
                img.loading = i < 2 ? "eager" : "lazy";
                img.addEventListener("error", () => w.classList.add("failed"));
                w.appendChild(img);
                pagesEl.appendChild(w);
                return w;
            });

            $("reader-loading").classList.add("hidden");
            $("reader-content").classList.remove("hidden");
            applySettings();
            scrubSync();

            if (ch.manga_id) {
                VortexAPI.chaptersByManga(ch.manga_id).then(l => { chapterList = l; renderChapterList(); }).catch(() => {
                    $("chapters-list").innerHTML = `<p class="hint">تعذر تحميل قائمة الفصول.</p>`;
                });
            }

            if (S.remember) {
                let saved = 0;
                try { saved = parseInt(localStorage.getItem(POS_KEY) || "0", 10) || 0; } catch (e) {}
                if (saved > 0 && saved < wraps.length) {
                    setTimeout(() => { goTo(saved, false); toast(`رجعناك للصفحة ${saved + 1}`); }, 300);
                }
            }

        } catch (err) {
            console.error("VORTEX reader error:", err);
            fail("تعذر الاتصال بالخادم. حاول مرة ثانية.");
        }
    }

    init();

})();
