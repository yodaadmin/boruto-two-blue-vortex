/* VORTEX — READER JS */

(function () {

    const $ = id => document.getElementById(id);

    const KEY = "vortex-reader-settings";
    const DEFAULTS = { mode: "vertical", fit: "width", rtl: true, bg: "black", remember: true, reverse: false };

    let S = { ...DEFAULTS };
    try { S = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}

    const params = new URLSearchParams(location.search);
    const chapterId = params.get("chapter");
    const POS_KEY = "vortex-pos-" + chapterId;

    const pagesEl = $("reader-pages");
    let wraps = [];
    let srcs = [];
    let cur = 0;
    let zoom = 1;
    let toastTimer;

    /* ---------- إضافة خيار ترتيب الصفحات للإعدادات ---------- */

    (function addReverseSetting() {
        const footer = document.querySelector(".settings-footer");
        if (!footer) return;
        const sec = document.createElement("div");
        sec.className = "settings-section";
        sec.innerHTML = `
            <label class="settings-label">ترتيب الصفحات</label>
            <div class="settings-options" role="group" aria-label="ترتيب الصفحات">
                <button type="button" class="settings-option" data-setting="reverse" data-value="false">عادي</button>
                <button type="button" class="settings-option" data-setting="reverse" data-value="true">معكوس</button>
            </div>`;
        footer.parentNode.insertBefore(sec, footer);
    })();

    /* ---------- أدوات ---------- */

    function toast(msg) {
        const t = $("reader-toast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
    }

    function saveSettings() {
        try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    }

    function savePos() {
        if (!S.remember) return;
        try { localStorage.setItem(POS_KEY, String(cur)); } catch (e) {}
    }

    const isPaged = () => S.mode !== "vertical";
    const step = () => (S.mode === "double" ? 2 : 1);

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
    }

    function renderView() {
        pagesEl.className =
            `reader-pages mode-${S.mode} fit-${S.fit} ${S.rtl ? "rtl" : "ltr"}` +
            (isPaged() ? " paged" : "");
        pagesEl.style.setProperty("--zoom", zoom);

        if (S.mode === "double") cur -= cur % 2;

        wraps.forEach((w, i) => {
            const on = isPaged() && (i === cur || (S.mode === "double" && i === cur + 1));
            w.classList.toggle("current", on);
        });

        if (isPaged()) {
            for (let k = 1; k <= step(); k++) {
                if (srcs[cur + step() + k - 1]) { new Image().src = srcs[cur + step() + k - 1]; }
            }
        }

        updateCounter();
    }

    function applySettings() {
        document.body.dataset.bg = S.bg;

        document.querySelectorAll(".settings-option").forEach(b => {
            const val = String(S[b.dataset.setting]);
            const on = val === b.dataset.value;
            b.classList.toggle("active", on);
            b.setAttribute("aria-pressed", on);
        });

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
        if (cur + step() >= wraps.length) {
            $("reader-end").scrollIntoView({ behavior: "smooth" });
            return;
        }
        goTo(cur + step());
    }

    function prevPage() {
        if (cur <= 0) { toast("هذه أول صفحة"); return; }
        goTo(cur - step());
    }

    /* ---------- تتبع التمرير (العمودي) ---------- */

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (isPaged() || ticking || !wraps.length) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            let idx = 0;
            for (let i = 0; i < wraps.length; i++) {
                if (wraps[i].getBoundingClientRect().top <= window.innerHeight * 0.4) idx = i;
                else break;
            }
            if (idx !== cur) { cur = idx; updateCounter(); savePos(); }
        });
    }, { passive: true });

    /* ---------- الإعدادات ---------- */

    function setSettings(open) {
        $("reader-settings").classList.toggle("open", open);
        $("reader-overlay").classList.toggle("open", open);
        $("reader-settings").setAttribute("aria-hidden", !open);
        $("toggle-settings").setAttribute("aria-expanded", open);
    }

    $("toggle-settings").addEventListener("click", () => setSettings(true));
    $("toggle-reader-menu").addEventListener("click", () => setSettings(true));
    $("close-settings").addEventListener("click", () => setSettings(false));
    $("reader-overlay").addEventListener("click", () => setSettings(false));

    document.querySelectorAll(".settings-option").forEach(b => {
        b.addEventListener("click", () => {
            const key = b.dataset.setting;
            let val = b.dataset.value;
            if (key === "rtl" || key === "reverse") val = val === "true";
            S[key] = val;
            saveSettings();
            if (key === "reverse") {
                try { localStorage.removeItem(POS_KEY); } catch (e) {}
                location.reload();
                return;
            }
            applySettings();
            if (key === "mode" || key === "fit") goTo(cur, false);
        });
    });

    $("remember-position").addEventListener("change", e => {
        S.remember = e.target.checked;
        saveSettings();
    });

    $("reset-reader-settings").addEventListener("click", () => {
        S = { ...DEFAULTS };
        zoom = 1;
        $("zoom-reset").textContent = "100%";
        saveSettings();
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

    /* ---------- لوحة المفاتيح + النقر ---------- */

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { setSettings(false); return; }
        if (e.target.tagName === "INPUT") return;

        const forward = S.rtl ? "ArrowLeft" : "ArrowRight";
        const back = S.rtl ? "ArrowRight" : "ArrowLeft";

        if (e.key === forward) nextPage();
        else if (e.key === back) prevPage();
        else if (isPaged() && (e.key === " " || e.key === "ArrowDown")) { e.preventDefault(); nextPage(); }
        else if (isPaged() && e.key === "ArrowUp") { e.preventDefault(); prevPage(); }
    });

    pagesEl.addEventListener("click", e => {
        if (!isPaged() || !e.target.closest("img")) return;
        const leftHalf = e.clientX < window.innerWidth / 2;
        if (leftHalf === S.rtl) nextPage(); else prevPage();
    });

    /* ---------- التحميل ---------- */

    async function init() {

        if (!chapterId) { fail("لم يتم تحديد الفصل."); return; }

        try {

            const [ch, pages] = await Promise.all([
                VortexAPI.getChapter(chapterId),
                VortexAPI.getPages(chapterId)
            ]);

            if (!ch) { fail("لم يتم العثور على الفصل المطلوب."); return; }
            if (!pages.length) { fail("هذا الفصل لا يحتوي على صفحات بعد."); return; }

            const title = ch.title || `الفصل ${ch.number}`;
            const mangaName = ch.manga_title || "المانجا";
            const mangaHref = ch.manga_id ? `manga.html?id=${encodeURIComponent(ch.manga_id)}` : "index.html";
            const self = location.pathname.split("/").pop() || "reader.html";

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

            const list = S.reverse ? [...pages].reverse() : pages;
            srcs = list.map(p => VortexAPI.fileUrl(p.storage_path));

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
                if (params.get("debug")) {
                    w.style.position = "relative";
                    const b = document.createElement("div");
                    b.textContent = list[i].storage_path.split("/").pop();
                    b.style.cssText = "position:absolute;top:8px;right:8px;z-index:5;padding:4px 12px;border-radius:999px;background:#ffeb3b;color:#000;font:700 15px/1.5 sans-serif;direction:ltr";
                    w.appendChild(b);
                }
                pagesEl.appendChild(w);
                return w;
            });

            $("reader-loading").classList.add("hidden");
            $("reader-content").classList.remove("hidden");

            applySettings();

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
