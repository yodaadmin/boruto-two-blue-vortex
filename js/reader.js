/* VORTEX — READER JS */

(function () {

    const $ = id => document.getElementById(id);

    /* ---------- الإعدادات ---------- */

    const KEY = "vortex-reader-settings";

    const DEFAULTS = {
        mode: "vertical",
        fit: "width",
        rtl: true,
        bg: "black",
        remember: true,
        reverse: false
    };

    let S = { ...DEFAULTS };

    try {
        S = {
            ...DEFAULTS,
            ...JSON.parse(
                localStorage.getItem(KEY) || "{}"
            )
        };
    } catch (e) {}

    const params = new URLSearchParams(location.search);

    const chapterId = params.get("chapter");

    const POS_KEY =
        "vortex-pos-" + chapterId;


    /* ---------- الحالة ---------- */

    const pagesEl = $("reader-pages");

    let wraps = [];
    let srcs = [];

    let cur = 0;
    let zoom = 1;

    let toastTimer;


    /* ---------- إضافة خيار ترتيب الصفحات ---------- */

    (function addReverseSetting() {

        const footer =
            document.querySelector(".settings-footer");

        if (!footer) return;

        /*
         * منع إنشاء الخيار أكثر من مرة
         */
        if (
            document.querySelector(
                '[data-setting="reverse"]'
            )
        ) {
            return;
        }

        const sec =
            document.createElement("div");

        sec.className =
            "settings-section";

        sec.innerHTML = `
            <label class="settings-label">
                ترتيب الصفحات
            </label>

            <div
                class="settings-options"
                role="group"
                aria-label="ترتيب الصفحات"
            >

                <button
                    type="button"
                    class="settings-option"
                    data-setting="reverse"
                    data-value="false"
                >
                    عادي
                </button>

                <button
                    type="button"
                    class="settings-option"
                    data-setting="reverse"
                    data-value="true"
                >
                    معكوس
                </button>

            </div>
        `;

        footer.parentNode.insertBefore(
            sec,
            footer
        );

    })();


    /* ---------- أدوات ---------- */

    function toast(msg) {

        const t = $("reader-toast");

        if (!t) return;

        t.textContent = msg;

        t.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer =
            setTimeout(() => {
                t.classList.remove("show");
            }, 1800);
    }


    function saveSettings() {

        try {

            localStorage.setItem(
                KEY,
                JSON.stringify(S)
            );

        } catch (e) {}
    }


    function savePos() {

        if (!S.remember) return;

        try {

            localStorage.setItem(
                POS_KEY,
                String(cur)
            );

        } catch (e) {}
    }


    const isPaged = () =>
        S.mode !== "vertical";


    const step = () =>
        S.mode === "double"
            ? 2
            : 1;


    function fail(msg) {

        $("reader-loading")?.classList.add("hidden");

        $("reader-content")?.classList.add("hidden");

        const errorMessage =
            $("reader-error-message");

        if (errorMessage) {
            errorMessage.textContent = msg;
        }

        $("reader-error")?.classList.remove(
            "hidden"
        );
    }


    /* ---------- عداد الصفحات ---------- */

    function updateCounter() {

        const c = $("page-counter");

        if (!c) return;

        const current =
            wraps.length
                ? (
                    wraps[cur]?.dataset.pageNumber ||
                    cur + 1
                )
                : 0;

        const total =
            wraps.length;


        const strong =
            c.querySelector("strong");

        if (strong) {
            strong.textContent = current;
        }


        const spans =
            c.querySelectorAll("span");

        if (spans.length > 1) {
            spans[1].textContent = total;
        }
    }


    /* ---------- العرض ---------- */

    function renderView() {

        if (!pagesEl) return;


        pagesEl.className =
            `reader-pages mode-${S.mode} fit-${S.fit} ` +
            `${S.rtl ? "rtl" : "ltr"}` +
            (isPaged() ? " paged" : "");


        pagesEl.style.setProperty(
            "--zoom",
            zoom
        );


        /*
         * وضع الصفحتين:
         * يبدأ دائمًا من صفحة زوجية صحيحة.
         */
        if (S.mode === "double") {

            cur -= cur % 2;

            cur = Math.max(
                0,
                Math.min(
                    wraps.length - 1,
                    cur
                )
            );
        }


        wraps.forEach((w, i) => {

            const on =
                isPaged() &&
                (
                    i === cur ||
                    (
                        S.mode === "double" &&
                        i === cur + 1
                    )
                );

            w.classList.toggle(
                "current",
                on
            );
        });


        /*
         * Preload للصفحات التالية.
         */

        if (isPaged()) {

            const preloadCount =
                S.mode === "double"
                    ? 2
                    : 2;

            for (
                let k = 1;
                k <= preloadCount;
                k++
            ) {

                const index =
                    cur +
                    step() +
                    k -
                    1;

                if (srcs[index]) {

                    const img =
                        new Image();

                    img.src =
                        srcs[index];
                }
            }
        }


        updateCounter();
    }


    /* ---------- تطبيق الإعدادات ---------- */

    function applySettings() {

        document.body.dataset.bg =
            S.bg;


        document
            .querySelectorAll(
                ".settings-option"
            )
            .forEach(b => {

                const key =
                    b.dataset.setting;

                const val =
                    String(S[key]);

                const on =
                    val === b.dataset.value;

                b.classList.toggle(
                    "active",
                    on
                );

                b.setAttribute(
                    "aria-pressed",
                    on
                );
            });


        const remember =
            $("remember-position");

        if (remember) {
            remember.checked =
                !!S.remember;
        }


        renderView();
    }


    /* ---------- الانتقال ---------- */

    function goTo(
        i,
        smooth = true
    ) {

        if (!wraps.length) return;


        cur =
            Math.max(
                0,
                Math.min(
                    wraps.length - 1,
                    i
                )
            );


        if (isPaged()) {

            renderView();

            window.scrollTo({
                top: 0,
                behavior: smooth
                    ? "smooth"
                    : "auto"
            });

        } else {

            const target =
                wraps[cur];

            if (target) {

                target.scrollIntoView({
                    behavior: smooth
                        ? "smooth"
                        : "auto",
                    block: "start"
                });
            }

            updateCounter();
        }


        savePos();
    }


    function nextPage() {

        if (!wraps.length) return;


        const next =
            cur + step();


        if (next >= wraps.length) {

            const end =
                $("reader-end");

            if (end) {

                end.scrollIntoView({
                    behavior: "smooth"
                });

            }

            return;
        }


        goTo(next);
    }


    function prevPage() {

        if (!wraps.length) return;


        if (cur <= 0) {

            toast("هذه أول صفحة");

            return;
        }


        goTo(
            Math.max(
                0,
                cur - step()
            )
        );
    }


    /* ---------- تتبع التمرير العمودي ---------- */

    let ticking = false;

    window.addEventListener(
        "scroll",
        () => {

            if (
                isPaged() ||
                ticking ||
                !wraps.length
            ) {
                return;
            }


            ticking = true;


            requestAnimationFrame(() => {

                ticking = false;

                let idx = 0;


                for (
                    let i = 0;
                    i < wraps.length;
                    i++
                ) {

                    if (
                        wraps[i]
                            .getBoundingClientRect()
                            .top
                        <=
                        window.innerHeight * 0.4
                    ) {

                        idx = i;

                    } else {

                        break;
                    }
                }


                if (idx !== cur) {

                    cur = idx;

                    updateCounter();

                    savePos();
                }

            });

        },
        {
            passive: true
        }
    );


    /* ---------- الإعدادات ---------- */

    function setSettings(open) {

        $("reader-settings")
            ?.classList.toggle(
                "open",
                open
            );

        $("reader-overlay")
            ?.classList.toggle(
                "open",
                open
            );


        $("reader-settings")
            ?.setAttribute(
                "aria-hidden",
                String(!open)
            );


        $("toggle-settings")
            ?.setAttribute(
                "aria-expanded",
                String(open)
            );
    }


    $("toggle-settings")
        ?.addEventListener(
            "click",
            () => setSettings(true)
        );


    $("toggle-reader-menu")
        ?.addEventListener(
            "click",
            () => setSettings(true)
        );


    $("close-settings")
        ?.addEventListener(
            "click",
            () => setSettings(false)
        );


    $("reader-overlay")
        ?.addEventListener(
            "click",
            () => setSettings(false)
        );


    document
        .querySelectorAll(
            ".settings-option"
        )
        .forEach(b => {

            b.addEventListener(
                "click",
                () => {

                    const key =
                        b.dataset.setting;

                    let val =
                        b.dataset.value;


                    if (
                        key === "rtl" ||
                        key === "reverse"
                    ) {

                        val =
                            val === "true";
                    }


                    S[key] = val;

                    saveSettings();


                    /*
                     * تغيير reverse يعني
                     * إعادة بناء الصفحات من البداية.
                     */
                    if (key === "reverse") {

                        try {

                            localStorage.removeItem(
                                POS_KEY
                            );

                        } catch (e) {}


                        location.reload();

                        return;
                    }


                    applySettings();


                    if (
                        key === "mode" ||
                        key === "fit"
                    ) {

                        goTo(
                            cur,
                            false
                        );
                    }

                }
            );

        });


    $("remember-position")
        ?.addEventListener(
            "change",
            e => {

                S.remember =
                    e.target.checked;

                saveSettings();

            }
        );


    $("reset-reader-settings")
        ?.addEventListener(
            "click",
            () => {

                S = {
                    ...DEFAULTS
                };

                zoom = 1;


                const zoomReset =
                    $("zoom-reset");

                if (zoomReset) {
                    zoomReset.textContent =
                        "100%";
                }


                saveSettings();

                applySettings();

                goTo(
                    cur,
                    false
                );

                toast(
                    "تمت إعادة الضبط"
                );
            }
        );


    /* ---------- أزرار الأسفل ---------- */

    $("next-page")
        ?.addEventListener(
            "click",
            nextPage
        );


    $("previous-page")
        ?.addEventListener(
            "click",
            prevPage
        );


    $("reader-top")
        ?.addEventListener(
            "click",
            () => {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


    /* ---------- التكبير ---------- */

    function setZoom(z) {

        zoom =
            Math.max(
                0.5,
                Math.min(
                    3,
                    z
                )
            );


        pagesEl?.style.setProperty(
            "--zoom",
            zoom
        );


        const reset =
            $("zoom-reset");

        if (reset) {

            reset.textContent =
                Math.round(
                    zoom * 100
                ) + "%";
        }
    }


    $("zoom-in")
        ?.addEventListener(
            "click",
            () => setZoom(
                zoom + 0.25
            )
        );


    $("zoom-out")
        ?.addEventListener(
            "click",
            () => setZoom(
                zoom - 0.25
            )
        );


    $("zoom-reset")
        ?.addEventListener(
            "click",
            () => setZoom(1)
        );


    $("retry-reader")
        ?.addEventListener(
            "click",
            () => location.reload()
        );


    /* ---------- لوحة المفاتيح ---------- */

    document.addEventListener(
        "keydown",
        e => {

            if (e.key === "Escape") {

                setSettings(false);

                return;
            }


            if (
                e.target.tagName === "INPUT" ||
                e.target.tagName === "TEXTAREA" ||
                e.target.isContentEditable
            ) {
                return;
            }


            const forward =
                S.rtl
                    ? "ArrowLeft"
                    : "ArrowRight";


            const back =
                S.rtl
                    ? "ArrowRight"
                    : "ArrowLeft";


            if (
                e.key === forward
            ) {

                nextPage();

            } else if (
                e.key === back
            ) {

                prevPage();

            } else if (
                isPaged() &&
                (
                    e.key === " " ||
                    e.key === "ArrowDown"
                )
            ) {

                e.preventDefault();

                nextPage();

            } else if (
                isPaged() &&
                e.key === "ArrowUp"
            ) {

                e.preventDefault();

                prevPage();
            }

        }
    );


    /* ---------- النقر على الصفحة ---------- */

    pagesEl?.addEventListener(
        "click",
        e => {

            if (
                !isPaged() ||
                !e.target.closest("img")
            ) {
                return;
            }


            const leftHalf =
                e.clientX <
                window.innerWidth / 2;


            if (
                leftHalf === S.rtl
            ) {

                nextPage();

            } else {

                prevPage();
            }

        }
    );


    /* ---------- التحميل ---------- */

    async function init() {

        if (!chapterId) {

            fail(
                "لم يتم تحديد الفصل."
            );

            return;
        }


        try {

            const [
                ch,
                pages
            ] = await Promise.all([

                VortexAPI.getChapter(
                    chapterId
                ),

                VortexAPI.getPages(
                    chapterId
                )

            ]);


            if (!ch) {

                fail(
                    "لم يتم العثور على الفصل المطلوب."
                );

                return;
            }


            if (
                !pages ||
                !pages.length
            ) {

                fail(
                    "هذا الفصل لا يحتوي على صفحات بعد."
                );

                return;
            }


            /* ---------- معلومات الفصل ---------- */

            const title =
                ch.title ||
                `الفصل ${ch.number}`;


            const mangaName =
                ch.manga_title ||
                "المانجا";


            const mangaHref =
                ch.manga_id
                    ? `manga.html?id=${encodeURIComponent(ch.manga_id)}`
                    : "index.html";


            const self =
                location.pathname
                    .split("/")
                    .pop() ||
                "reader.html";


            document.title =
                `VORTEX — ${mangaName} — ${title}`;


            $("reader-title").innerHTML =
                `<span>${V.esc(mangaName)} — ${V.esc(title)}</span>`;


            $("reader-manga-name").textContent =
                mangaName;


            $("reader-chapter-name").textContent =
                title;


            $("reader-chapter-description").textContent =
                ch.number
                    ? `الفصل ${ch.number}`
                    : "";


            [
                "manga-link",
                "reader-info-link",
                "reader-manga"
            ].forEach(id => {

                const el = $(id);

                if (el) {
                    el.href = mangaHref;
                }

            });


            /* ---------- الفصل السابق ---------- */

            if (ch.previous_chapter) {

                const el =
                    $("reader-previous");

                if (el) {

                    el.href =
                        `${self}?chapter=${encodeURIComponent(
                            ch.previous_chapter
                        )}`;

                    el.classList.remove(
                        "hidden"
                    );
                }
            }


            /* ---------- الفصل التالي ---------- */

            if (ch.next_chapter) {

                const el =
                    $("reader-next");

                if (el) {

                    el.href =
                        `${self}?chapter=${encodeURIComponent(
                            ch.next_chapter
                        )}`;

                    el.classList.remove(
                        "hidden"
                    );
                }
            }


            /* =====================================================
             * ترتيب الصفحات
             * ===================================================== */

            /*
             * api.js مسؤول عن ترتيب الصفحات
             * حسب page_number.
             *
             * هنا لا نعيد ترتيبها.
             *
             * reverse = عكس القائمة فقط.
             */

            const list =
                S.reverse
                    ? [...pages].reverse()
                    : [...pages];


            /* ---------- تنظيف ---------- */

            pagesEl.innerHTML = "";


            /* ---------- روابط الصور ---------- */

            srcs =
                list.map(
                    page =>
                        VortexAPI.fileUrl(
                            page.storage_path
                        )
                );


            /* ---------- إنشاء الصفحات ---------- */

            wraps =
                list.map(
                    (page, i) => {

                        const src =
                            srcs[i];


                        const w =
                            document.createElement(
                                "div"
                            );


                        w.className =
                            "reader-page";


                        /*
                         * الرقم الحقيقي للصفحة.
                         */
                        w.dataset.pageNumber =
                            String(
                                page.page_number ??
                                i + 1
                            );


                        /*
                         * ترتيبها داخل القارئ.
                         */
                        w.dataset.index =
                            String(i);


                        const img =
                            document.createElement(
                                "img"
                            );


                        img.src = src;


                        img.alt =
                            `صفحة ${
                                page.page_number ??
                                i + 1
                            }`;


                        img.decoding =
                            "async";


                        /*
                         * تحميل أول صفحتين فورًا.
                         */
                        img.loading =
                            i < 2
                                ? "eager"
                                : "lazy";


                        img.addEventListener(
                            "error",
                            () => {

                                w.classList.add(
                                    "failed"
                                );

                            }
                        );


                        w.appendChild(img);


                        /* ---------- Debug ---------- */

                        if (
                            params.get(
                                "debug"
                            )
                        ) {

                            w.style.position =
                                "relative";


                            const b =
                                document.createElement(
                                    "div"
                                );


                            b.textContent =
                                `${
                                    page.page_number ??
                                    i + 1
                                } — ${
                                    String(
                                        page.storage_path ||
                                        ""
                                    )
                                        .split("/")
                                        .pop()
                                }`;


                            b.style.cssText = `
                                position:absolute;
                                top:8px;
                                right:8px;
                                z-index:5;
                                padding:4px 12px;
                                border-radius:999px;
                                background:#ffeb3b;
                                color:#000;
                                font:700 15px/1.5 sans-serif;
                                direction:ltr;
                            `;


                            w.appendChild(b);
                        }


                        pagesEl.appendChild(w);


                        return w;
                    }
                );


            /* ---------- جاهز ---------- */

            $("reader-loading")
                ?.classList.add(
                    "hidden"
                );


            $("reader-content")
                ?.classList.remove(
                    "hidden"
                );


            applySettings();


            /* ---------- استعادة الموضع ---------- */

            if (S.remember) {

                let saved = 0;

                try {

                    saved =
                        parseInt(
                            localStorage.getItem(
                                POS_KEY
                            ) || "0",
                            10
                        ) || 0;

                } catch (e) {}


                if (
                    saved > 0 &&
                    saved < wraps.length
                ) {

                    setTimeout(
                        () => {

                            goTo(
                                saved,
                                false
                            );

                            const pageNumber =
                                wraps[saved]
                                    ?.dataset
                                    .pageNumber ||
                                saved + 1;


                            toast(
                                `رجعناك للصفحة ${pageNumber}`
                            );

                        },
                        300
                    );
                }
            }


        } catch (err) {

            console.error(
                "VORTEX reader error:",
                err
            );


            fail(
                "تعذر الاتصال بالخادم. حاول مرة ثانية."
            );
        }
    }


    /* ---------- تشغيل ---------- */

    init();

})();
