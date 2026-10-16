/* VORTEX GROUP — READER JS v4 */

(function () {

    const $ = id => document.getElementById(id);

    /* ---------- الأيقونات ---------- */
    function fillIcons(root) {
        (root || document).querySelectorAll("i[data-icon]").forEach(el => {
            el.outerHTML = V.icon(el.dataset.icon, el.dataset.size ? +el.dataset.size : 0);
        });
    }
    fillIcons();
    $("toggle-fullscreen").innerHTML =
        V.icon("expand").replace('class="icon"', 'class="icon ico-expand"') +
        V.icon("compress").replace('class="icon"', 'class="icon ico-compress"');

    /* ---------- الإعدادات ---------- */
    const KEY = "vortex-reader-v2";
    const DEF = { mode: "vertical", fit: "width", rtl: true, bg: "navy", bright: 100, gap: 0, remember: true, width: 920, speed: 4, autohide: true };

    let S = { ...DEF };
    try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}

    const params = new URLSearchParams(location.search);
    const chapterId = params.get("chapter");
    const POS_KEY = "vortex-pos-" + chapterId;
    const self = location.pathname.split("/").pop() || "reader.html";
    const VOL_SIZE = 4;

    const pagesEl = $("reader-pages");
    let wraps = [], srcs = [], cur = 0, zoom = 1, toastTimer, chapterList = null, currentChapter = null;

    const isPaged = () => S.mode !== "vertical";
    const step = () => (S.mode === "double" ? 2 : 1);
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
    const savePos = () => { if (S.remember) { try { localStorage.setItem(POS_KEY, String(cur)); } catch (e) {} } };
    const isDone = id => { try { return localStorage.getItem("vortex-done-" + id) === "1"; } catch (e) { return false; } };
    const markDone = () => { if (!chapterId || isDone(chapterId)) return; try { localStorage.setItem("vortex-done-" + chapterId, "1"); } catch (e) {} };

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

    const setUi = hidden => document.body.classList.toggle("ui-hidden", hidden);

    /* ---------- العرض ---------- */

    function updateCounter() {
        const c = $("page-counter");
        c.querySelector("strong").textContent = wraps.length ? cur + 1 : 0;
        c.querySelectorAll("span")[1].textContent = wraps.length;
        $("scrub-bubble").textContent = `${cur + 1} / ${wraps.length}`;
        if (wraps.length && cur >= wraps.length - 1) markDone();
        updateProgress();
        warmUp();
    }

    /* تحميل مسبق: الصفحات القادمة، ثم أول صفحات الفصل التالي عند الاقتراب من النهاية */
    let nextWarmed = false;
    function warmUp() {
        if (!wraps.length) return;
        for (let k = 1; k <= 3; k++) {
            const img = wraps[cur + k] && wraps[cur + k].firstChild;
            if (img && img.loading === "lazy") img.loading = "eager";
        }
        if (!nextWarmed && currentChapter && currentChapter.next_chapter && cur >= wraps.length - 4) {
            nextWarmed = true;
            VortexAPI.getPages(currentChapter.next_chapter).then(list => {
                list.slice(0, 3).forEach(p => { new Image().src = VortexAPI.fileUrl(p.storage_path); });
            }).catch(() => {});
        }
    }

    function updateProgress() {
        const bar = $("reader-progress");
        if (!wraps.length) { bar.style.width = "0"; return; }
        let r;
        if (isPaged()) {
            r = Math.min(1, (cur + step()) / wraps.length);
        } else {
            const top = pagesEl.getBoundingClientRect().top + window.scrollY;
            const end = Math.max(top + 1, top + pagesEl.offsetHeight - window.innerHeight);
            r = Math.min(1, Math.max(0, (window.scrollY - top) / (end - top)));
        }
        bar.style.width = (r * 100).toFixed(1) + "%";

        /* زر الفصل التالي العائم */
        const pill = $("next-pill");
        const hasNext = !!(currentChapter && currentChapter.next_chapter);
        const endTop = $("reader-end").getBoundingClientRect().top;
        const near = isPaged() ? cur + step() >= wraps.length : r > 0.9;
        pill.classList.toggle("show", hasNext && near && endTop > window.innerHeight * 0.55);
    }

    function renderView() {
        pagesEl.className = `reader-pages mode-${S.mode} fit-${S.fit} ${S.rtl ? "rtl" : "ltr"}` + (isPaged() ? " paged" : "");
        pagesEl.style.setProperty("--zoom", zoom);
        pagesEl.style.setProperty("--gap", S.gap + "px");
        pagesEl.style.setProperty("--maxw", S.width + "px");
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
        $("set-width").value = S.width;
        $("width-value").textContent = S.width + "px";
        $("set-speed").value = S.speed;
        $("speed-value").textContent = S.speed;
        $("remember-position").checked = !!S.remember;
        $("autohide").checked = !!S.autohide;
        $("previous-page").innerHTML = V.icon(S.rtl ? "right" : "left", 20);
        $("next-page").innerHTML = V.icon(S.rtl ? "left" : "right", 20);
        $("reader-bottom-inner").style.direction = S.rtl ? "rtl" : "ltr";
        if (!S.autohide) setUi(false);
        if (isPaged()) setAuto(false);
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

    /* ---------- التمرير التلقائي (Webtoon) ---------- */

    let auto = false, raf = 0, lastT = 0, acc = 0;

    function setAuto(on) {
        if (on && isPaged()) return;
        if (auto === on) return;
        auto = on;
        $("auto-btn").innerHTML = V.icon(auto ? "pause" : "play", 18);
        $("auto-btn").classList.toggle("auto-on", auto);
        cancelAnimationFrame(raf);
        if (auto) {
            lastT = performance.now(); acc = 0;
            raf = requestAnimationFrame(tick);
            toast(`تمرير تلقائي — السرعة ${S.speed}`);
        }
    }

    function tick(t) {
        if (!auto) return;
        const dt = Math.min(64, t - lastT);
        lastT = t;
        acc += S.speed * 28 * dt / 1000;
        const px = Math.floor(acc);
        if (px > 0) {
            acc -= px;
            window.scrollBy({ top: px, behavior: "instant" });
            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) { setAuto(false); return; }
        }
        raf = requestAnimationFrame(tick);
    }

    $("auto-btn").addEventListener("click", () => setAuto(!auto));
    ["wheel", "touchstart"].forEach(ev => window.addEventListener(ev, () => { if (auto) setAuto(false); }, { passive: true }));

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
            updateProgress();
        });
    }, { passive: true });

    /* إخفاء الأدوات عند النزول وإظهارها عند الصعود */
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
        const y = window.scrollY, d = y - lastY;
        if (Math.abs(d) < 8) return;
        if (S.autohide && !isPaged()) setUi(d > 0 && y > 160);
        lastY = y;
    }, { passive: true });

    /* ---------- النوافذ ---------- */

    const MODALS = ["chapters-modal"];

    function closeAll() {
        $("reader-settings").classList.remove("open");
        MODALS.forEach(id => $(id).classList.remove("open"));
        $("reader-overlay").classList.remove("open");
        $("reader-settings").setAttribute("aria-hidden", "true");
        $("toggle-settings").setAttribute("aria-expanded", "false");
    }

    const anyOpen = () => $("reader-settings").classList.contains("open") || MODALS.some(id => $(id).classList.contains("open"));

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

    /* قائمة الفصول: مجموعة حسب المجلد + بحث */
    function volMap() {
        const asc = [...chapterList].sort((a, b) => Number(a.number) - Number(b.number));
        const m = new Map();
        asc.forEach((c, i) => m.set(c.id, Math.floor(i / VOL_SIZE) + 1));
        return m;
    }

    function renderChapterList() {
        if (!chapterList || !currentChapter) return;
        const q = $("chapters-q").value.trim().toLowerCase();
        const vm = volMap();
        let lastVol = null, html = "";
        chapterList.forEach(c => {
            if (q && !(String(c.number).startsWith(q) || String(c.title || "").toLowerCase().includes(q))) return;
            const v = vm.get(c.id);
            if (v !== lastVol) { lastVol = v; html += `<div class="chapter-vol">${V.icon("layers", 14)} المجلد ${v}</div>`; }
            html += `
            <a class="chapter-item${c.id === currentChapter.id ? " current" : ""}" href="${self}?chapter=${encodeURIComponent(c.id)}">
                <b class="chapter-num">${V.esc(c.number)}</b>
                <span class="chapter-name">${V.esc(c.title || "الفصل " + c.number)}</span>
                ${isDone(c.id) && c.id !== currentChapter.id ? `<span class="chapter-done">${V.icon("check", 15)}</span>` : ""}
                ${c.views !== undefined ? `<small class="chapter-views">${V.icon("eye", 14)}<bdi dir="ltr">${V.num(c.views)}</bdi></small>` : ""}
            </a>`;
        });
        $("chapters-list").innerHTML = html || `<p class="hint">لا توجد فصول مطابقة.</p>`;
    }

    $("chapters-q").addEventListener("input", renderChapterList);

    $("toggle-settings").addEventListener("click", () => $("reader-settings").classList.contains("open") ? closeAll() : openSettings());
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
            if (key === "mode") setUi(false);
            if (key === "mode" || key === "fit") goTo(cur, false);
        });
    });

    $("set-bright").addEventListener("input", e => { S.bright = +e.target.value; $("bright-value").textContent = S.bright + "%"; renderView(); save(); });
    $("set-gap").addEventListener("input", e => { S.gap = +e.target.value; $("gap-value").textContent = S.gap + "px"; renderView(); save(); });
    $("set-width").addEventListener("input", e => { S.width = +e.target.value; $("width-value").textContent = S.width + "px"; pagesEl.style.setProperty("--maxw", S.width + "px"); save(); });
    $("set-speed").addEventListener("input", e => { S.speed = +e.target.value; $("speed-value").textContent = S.speed; save(); });
    $("remember-position").addEventListener("change", e => { S.remember = e.target.checked; save(); });
    $("autohide").addEventListener("change", e => { S.autohide = e.target.checked; if (!S.autohide) setUi(false); save(); });

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

    /* ---------- لوحة المفاتيح ---------- */

    const go = id => { const a = $(id); if (a && a.href && !a.classList.contains("hidden")) location.href = a.href; };

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { closeAll(); return; }
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            const c = e.code;
            if (c === "KeyF") { toggleFs(); return; }
            if (c === "KeyS") { $("reader-settings").classList.contains("open") ? closeAll() : openSettings(); return; }
            if (c === "KeyC") { $("chapters-modal").classList.contains("open") ? closeAll() : openChapters(); return; }
            if (c === "KeyA") { setAuto(!auto); return; }
            if (c === "KeyN") { go("next-chapter"); return; }
            if (c === "KeyP") { go("prev-chapter"); return; }
            if (c === "KeyM") {
                const order = ["vertical", "single", "double"];
                S.mode = order[(order.indexOf(S.mode) + 1) % order.length];
                save(); setUi(false); applySettings(); goTo(cur, false);
                toast({ vertical: "نمط Webtoon", single: "صفحة واحدة", double: "صفحتان" }[S.mode]);
                return;
            }
        }

        if (anyOpen()) return;
        const forward = S.rtl ? "ArrowLeft" : "ArrowRight";
        const back = S.rtl ? "ArrowRight" : "ArrowLeft";
        if (e.key === forward) nextPage();
        else if (e.key === back) prevPage();
        else if (isPaged() && (e.key === " " || e.key === "ArrowDown")) { e.preventDefault(); nextPage(); }
        else if (isPaged() && e.key === "ArrowUp") { e.preventDefault(); prevPage(); }
        else if (auto && !e.ctrlKey) setAuto(false);
    });

    /* ---------- لمس: الجوانب تنقل، الوسط يُظهر/يُخفي الأدوات ---------- */
    pagesEl.addEventListener("click", e => {
        if (!e.target.closest(".reader-page")) return;
        const x = e.clientX / window.innerWidth;
        if (!isPaged()) { setUi(!document.body.classList.contains("ui-hidden")); return; }
        if (x > 0.35 && x < 0.65) { setUi(!document.body.classList.contains("ui-hidden")); return; }
        (x < 0.5) === S.rtl ? nextPage() : prevPage();
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

    /* ---------- حماية الصفحات من الحفظ العادي ---------- */
    ["contextmenu", "dragstart", "selectstart", "copy", "cut"].forEach(ev =>
        pagesEl.addEventListener(ev, e => e.preventDefault()));

    document.addEventListener("contextmenu", e => {
        if (e.target.closest(".reader-pages, .pages-grid, .intro-cover")) e.preventDefault();
    });
    document.addEventListener("dragstart", e => {
        if (e.target.closest(".pages-grid")) e.preventDefault();
    });

    document.addEventListener("keydown", e => {
        const k = (e.key || "").toLowerCase();
        if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p")) { e.preventDefault(); toast("الحفظ والطباعة غير متاحين"); }
        if (e.key === "PrintScreen") {
            try { navigator.clipboard && navigator.clipboard.writeText(""); } catch (err) {}
            toast("لقطة الشاشة غير مسموحة");
        }
    });

    /* إخفاء الصفحات عند مغادرة التبويب (يمنع لقطات مبدّل التطبيقات) */
    document.addEventListener("visibilitychange", () => {
        pagesEl.style.visibility = document.hidden ? "hidden" : "";
        if (document.hidden) setAuto(false);
    });

    /* ---------- المشاهدات: مرة واحدة لكل جهاز كل 6 ساعات ---------- */
    function countView(ch) {
        const key = "vortex-view-" + ch.id;
        let last = 0;
        try { last = +localStorage.getItem(key) || 0; } catch (e) {}
        if (Date.now() - last < 6 * 3600 * 1000) return;
        setTimeout(async () => {
            try {
                const total = await VortexAPI.addView(ch.id);
                try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
                const el = $("views-count");
                if (el && total != null) el.textContent = V.num(total);
            } catch (e) { /* العمود/الدالة غير مضافة بعد: نتجاهل بصمت */ }
        }, 4000);
    }

    /* ---------- بعد تحميل قائمة الفصول ---------- */
    function onChapterList() {
        renderChapterList();
        const ch = currentChapter;
        const vm = volMap();
        const v = vm.get(ch.id);
        if (v) $("reader-chips").insertAdjacentHTML("afterbegin", `<span class="chip">${V.icon("layers", 15)} المجلد ${v}</span>`);
        if (ch.next_chapter) {
            const n = chapterList.find(c => c.id === ch.next_chapter);
            if (n) {
                $("end-next-title").textContent = `الفصل ${n.number}` + (n.title && n.title !== `الفصل ${n.number}` ? ` — ${n.title}` : "");
                $("next-pill").querySelector("span").textContent = `الفصل ${n.number}`;
            }
        }
    }

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
            $("reader-title").innerHTML = `<small>${V.esc(mangaName)}</small><b>${V.esc(title)}</b>`;
            $("reader-manga-name").textContent = mangaName;
            $("reader-chapter-name").textContent = title;

            const chips = [];
            if (ch.number) chips.push(`<span class="chip">${V.icon("book", 15)} فصل ${V.esc(ch.number)}</span>`);
            chips.push(`<span class="chip">${V.icon("image", 15)} ${pages.length} صفحة</span>`);
            if (ch.published_at || ch.created_at) chips.push(`<span class="chip">${V.icon("calendar", 15)}<bdi dir="ltr">${V.dateYMD(ch.published_at || ch.created_at)}</bdi></span>`);
            if (ch.views !== undefined) chips.push(`<span class="chip views">${V.icon("eye", 15)}<bdi dir="ltr" id="views-count">${V.num(ch.views)}</bdi> مشاهدة</span>`);
            $("reader-chips").innerHTML = chips.join("");

            ["manga-link", "reader-info-link", "reader-manga", "reader-cover-link"].forEach(id => { $(id).href = mangaHref; });
            const cv = ch.manga_cover ? VortexAPI.fileUrl(ch.manga_cover) : "";
            if (cv) $("reader-cover").src = cv; else $("reader-cover-link").classList.add("hidden");

            if (ch.previous_chapter) {
                const h = `${self}?chapter=${encodeURIComponent(ch.previous_chapter)}`;
                $("reader-previous").href = h; $("reader-previous").classList.remove("hidden");
                $("prev-chapter").href = h; $("prev-chapter").classList.remove("hidden");
            }
            if (ch.next_chapter) {
                const h = `${self}?chapter=${encodeURIComponent(ch.next_chapter)}`;
                $("reader-next").href = h; $("reader-next").classList.remove("hidden");
                $("next-chapter").href = h; $("next-chapter").classList.remove("hidden");
                $("next-pill").href = h;
            } else {
                $("end-text").textContent = "هذا آخر فصل منشور حتى الآن. ارجع لصفحة المانجا لتتابع جديدنا.";
            }

            /* المفضلة من نهاية الفصل */
            const syncFav = () => {
                const on = ch.manga_id && V.favs.has(ch.manga_id);
                $("end-fav").classList.toggle("on", !!on);
                $("end-fav-label").textContent = on ? "في المفضلة" : "إضافة للمفضلة";
            };
            $("end-fav").addEventListener("click", () => {
                if (!ch.manga_id) return;
                V.favs.toggle(ch.manga_id); syncFav();
                toast(V.favs.has(ch.manga_id) ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
            });
            syncFav();

            /* آخر فصل قرأه الزائر لهذا العمل */
            if (S.remember && ch.manga_id) {
                try { localStorage.setItem("vortex-last-" + ch.manga_id, JSON.stringify({ c: ch.id, t: Date.now() })); } catch (e) {}
            }

            srcs = pages.map(p => VortexAPI.fileUrl(p.storage_path));
            wraps = srcs.map((src, i) => {
                const w = document.createElement("div");
                w.className = "reader-page";
                const img = document.createElement("img");
                img.addEventListener("load", () => w.classList.add("loaded"));
                img.addEventListener("error", () => w.classList.add("failed"));
                img.alt = `صفحة ${i + 1}`;
                img.decoding = "async";
                img.draggable = false;
                img.loading = i < 3 ? "eager" : "lazy";
                if (i === 0) img.fetchPriority = "high";
                img.src = src;
                w.appendChild(img);
                pagesEl.appendChild(w);
                return w;
            });

            $("reader-loading").classList.add("hidden");
            $("reader-content").classList.remove("hidden");
            applySettings();
            scrubSync();
            $("auto-btn").innerHTML = V.icon("play", 18);

            countView(ch);

            if (ch.manga_id) {
                VortexAPI.chaptersByManga(ch.manga_id).then(l => { chapterList = l; onChapterList(); }).catch(() => {
                    $("chapters-list").innerHTML = `<p class="hint">تعذر تحميل قائمة الفصول.</p>`;
                });
            }

            if (S.remember) {
                let saved = 0;
                try { saved = parseInt(localStorage.getItem(POS_KEY) || "0", 10) || 0; } catch (e) {}
                if (saved > 0 && saved < wraps.length - 1) {
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
