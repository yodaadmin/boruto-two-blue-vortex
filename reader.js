const DEFAULT_DATA = {
  title: "بوروتو: دوامتان زرقاوتان",
  chapters: []
};

const cfg = window.SITE_CONFIG || {};
const q = new URLSearchParams(window.location.search);

const settings = {
  mode: localStorage.getItem("readerMode") || "vertical",
  fit: localStorage.getItem("readerFit") || "width",
  bg: localStorage.getItem("readerBg") || "dark",
  rtl: localStorage.getItem("readerRTL") !== "false",
  remember: localStorage.getItem("readerRemember") !== "false"
};

/* =========================
   DOM
========================= */

const reader = document.getElementById("reader");
const mangaName = document.getElementById("mangaName");
const chapterName = document.getElementById("chapterName");
const bottomNav = document.getElementById("bottomNav");

const settingsBtn = document.getElementById("settingsBtn");
const closeSettings = document.getElementById("closeSettings");
const settingsPanel = document.getElementById("settingsPanel");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const readerMode = document.getElementById("readerMode");
const fitMode = document.getElementById("fitMode");
const readerBg = document.getElementById("readerBg");
const rtlMode = document.getElementById("rtlMode");
const rememberPos = document.getElementById("rememberPos");

/* =========================
   Helpers
========================= */

function safeNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function getChapterId() {
  const id = q.get("chapter");
  return id ? id.trim() : null;
}

function getReaderUrl(chapterId) {
  if (!chapterId) return "reader-2.html";

  return `reader-2.html?chapter=${encodeURIComponent(String(chapterId))}`;
}

/*
 * نحاول عرض رقم الفصل بدون السماح بظهور NaN.
 * إذا كان الرقم غير صالح، نستخدم العنوان بدل اختراع رقم.
 */
function getChapterLabel(chapter) {
  const number = safeNumber(chapter?.number);

  if (number !== null) {
    return `الفصل ${number}`;
  }

  if (chapter?.title) {
    return safeText(chapter.title);
  }

  return "الفصل";
}

/* =========================
   Local Storage
========================= */

function localData() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("mangaData") || "{}"
    );

    return {
      ...DEFAULT_DATA,
      ...saved,
      chapters: Array.isArray(saved.chapters)
        ? saved.chapters
        : []
    };
  } catch {
    return DEFAULT_DATA;
  }
}

/* =========================
   IndexedDB
========================= */

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mangaCMS", 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("pages")) {
        db.createObjectStore("pages");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getBlob(db, key) {
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("pages", "readonly")
      .objectStore("pages")
      .get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* =========================
   Supabase
========================= */

async function cloudClient() {
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    throw new Error("Supabase configuration is missing");
  }

  if (!window.supabase) {
    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );
}

/* =========================
   Cloud Data
========================= */

async function getCloud() {
  const sb = await cloudClient();

  /*
   * جلب المانجا
   */
  const mangaResult = await sb
    .from("manga")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (mangaResult.error) {
    throw mangaResult.error;
  }

  if (!mangaResult.data) {
    throw new Error("No manga found");
  }

  const manga = mangaResult.data;

  /*
   * جلب الفصول
   */
  const chaptersResult = await sb
    .from("chapters")
    .select("id,number,title,published_at")
    .eq("manga_id", manga.id)
    .order("number", {
      ascending: false,
      nullsFirst: false
    });

  if (chaptersResult.error) {
    throw chaptersResult.error;
  }

  const chaptersData = Array.isArray(chaptersResult.data)
    ? chaptersResult.data
    : [];

  /*
   * UUID الموجود في الرابط
   */
  const requestedId = getChapterId();

  let selected = null;

  if (requestedId) {
    selected = chaptersData.find(
      chapter =>
        String(chapter.id).trim() === requestedId
    );
  }

  /*
   * دعم ?latest
   */
  if (!selected && q.has("latest")) {
    selected = chaptersData[0] || null;
  }

  /*
   * لا يوجد فصل بهذا UUID
   */
  if (!selected) {
    return {
      d: {
        ...DEFAULT_DATA,
        ...manga,
        title: manga.title || DEFAULT_DATA.title,
        cover: manga.cover_url || null,
        chapters: chaptersData
      },
      ch: null
    };
  }

  /*
   * جلب صفحات الفصل باستخدام UUID الخاص بالفصل
   */
  const pagesResult = await sb
    .from("pages")
    .select("page_number,storage_path")
    .eq("chapter_id", selected.id)
    .order("page_number", {
      ascending: true,
      nullsFirst: false
    });

  if (pagesResult.error) {
    throw pagesResult.error;
  }

  const bucket =
    cfg.STORAGE_BUCKET || "manga-pages";

  const pages = Array.isArray(pagesResult.data)
    ? pagesResult.data
    : [];

  const urls = pages
    .filter(page => page && page.storage_path)
    .map((page, index) => {
      const publicUrl =
        sb.storage
          .from(bucket)
          .getPublicUrl(page.storage_path)
          ?.data
          ?.publicUrl || "";

      const pageNumber = safeNumber(
        page.page_number,
        index + 1
      );

      return {
        url: publicUrl,
        name: String(pageNumber)
      };
    })
    .filter(page => page.url);

  return {
    d: {
      ...DEFAULT_DATA,
      ...manga,
      title: manga.title || DEFAULT_DATA.title,
      cover: manga.cover_url || null,
      chapters: chaptersData
    },

    ch: {
      ...selected,
      date: selected.published_at || null,
      pages: urls,
      remotePages: true
    }
  };
}

/* =========================
   Local Data
========================= */

async function getLocal() {
  const d = localData();
  const requestedId = getChapterId();

  let ch = null;

  if (requestedId) {
    ch =
      (d.chapters || []).find(
        chapter =>
          String(chapter.id).trim() === requestedId
      ) || null;
  }

  if (!ch && q.has("latest")) {
    ch =
      [...(d.chapters || [])]
        .sort((a, b) => {
          const an = safeNumber(a.number, -Infinity);
          const bn = safeNumber(b.number, -Infinity);
          return bn - an;
        })[0] || null;
  }

  return {
    d,
    ch
  };
}

/* =========================
   Load Pages
========================= */

async function loadPages(chapter) {
  /*
   * Supabase
   */
  if (chapter.remotePages) {
    return Array.isArray(chapter.pages)
      ? chapter.pages
      : [];
  }

  /*
   * IndexedDB
   */
  const db = await openDB();
  const output = [];

  for (const page of chapter.pages || []) {
    if (!page?.key) continue;

    const blob = await getBlob(db, page.key);

    if (blob) {
      output.push({
        name: safeText(
          page.name,
          String(output.length + 1)
        ),
        blob
      });
    }
  }

  return output;
}

/* =========================
   Render Reader
========================= */

function renderPages(pages) {
  if (!reader) return;

  reader.className =
    `reader-canvas mode-${settings.mode} ` +
    `fit-${settings.fit} bg-${settings.bg} ` +
    `${settings.rtl ? "rtl" : "ltr"}`;

  if (!pages.length) {
    reader.innerHTML = `
      <div class="reader-empty">
        <b>هذا الفصل لا يحتوي على صفحات.</b>
        <a href="index.html#chapters">العودة إلى الفصول</a>
      </div>
    `;

    return;
  }

  reader.innerHTML = "";

  pages.forEach((page, index) => {
    const img = document.createElement("img");

    img.className = "manga-page";
    img.alt = `صفحة ${index + 1}`;
    img.dataset.index = String(index);

    if (page.blob) {
      img.src = URL.createObjectURL(page.blob);
    } else if (page.url) {
      img.src = page.url;
    }

    img.loading = index < 2 ? "eager" : "lazy";

    reader.appendChild(img);
  });
}

/* =========================
   Navigation
========================= */

function renderNavigation(chapter, chapters) {
  if (!bottomNav) return;

  const index = chapters.findIndex(
    item => String(item.id) === String(chapter.id)
  );

  /*
   * الفصول مرتبة تنازليًا:
   *
   * [10, 9, 8, 7, 6]
   *
   * إذا نحن في 8:
   * index + 1 = 7 ← السابق
   * index - 1 = 9 ← التالي
   */

  const previous =
    index >= 0 ? chapters[index + 1] : null;

  const next =
    index > 0 ? chapters[index - 1] : null;

  let html = `
    <a href="index.html#chapters">
      الفصول
    </a>
  `;

  if (previous) {
    html += `
      <a href="${getReaderUrl(previous.id)}">
        ‹ السابق
      </a>
    `;
  }

  if (next) {
    html += `
      <a class="next" href="${getReaderUrl(next.id)}">
        التالي ›
      </a>
    `;
  }

  bottomNav.innerHTML = html;
}

/* =========================
   Main
========================= */

(async function initReader() {
  try {
    let result;

    /*
     * إذا كان Supabase موجودًا:
     * استخدم السحابة.
     *
     * وإلا استخدم البيانات المحلية.
     */
    if (
      cfg.SUPABASE_URL &&
      cfg.SUPABASE_ANON_KEY
    ) {
      try {
        result = await getCloud();
      } catch (cloudError) {
        console.warn(
          "Cloud reader failed, using local data:",
          cloudError
        );

        result = await getLocal();
      }
    } else {
      result = await getLocal();
    }

    const d = result.d;
    const ch = result.ch;

    /*
     * اسم المانجا
     */
    if (mangaName) {
      mangaName.textContent =
        d.title || DEFAULT_DATA.title;
    }

    /*
     * الفصل غير موجود
     */
    if (!ch) {
      if (chapterName) {
        chapterName.textContent = "لا يوجد فصل";
      }

      if (reader) {
        reader.innerHTML = `
          <div class="reader-empty">
            <b>
              لا يوجد فصل بهذا المعرّف.
            </b>

            <a href="index.html#chapters">
              العودة إلى الفصول
            </a>
          </div>
        `;
      }

      return;
    }

    /*
     * عنوان الصفحة
     */
    const chapterTitle =
      ch.title ||
      getChapterLabel(ch);

    document.title =
      `${chapterTitle} — ${d.title || DEFAULT_DATA.title}`;

    if (chapterName) {
      chapterName.textContent = chapterTitle;
    }

    /*
     * تحميل الصفحات
     */
    const pages = await loadPages(ch);

    /*
     * عرض الصفحات
     */
    renderPages(pages);

    /*
     * أزرار السابق / التالي
     */
    renderNavigation(
      ch,
      Array.isArray(d.chapters)
        ? d.chapters
        : []
    );

  } catch (error) {
    console.error(
      "Reader initialization error:",
      error
    );

    if (reader) {
      reader.innerHTML = `
        <div class="reader-empty">
          <b>تعذر تحميل الفصل.</b>

          <p>
            تحقق من اتصال الموقع وقاعدة البيانات.
          </p>

          <a href="index.html#chapters">
            العودة إلى الفصول
          </a>
        </div>
      `;
    }
  }
})();

/* =========================
   Settings
========================= */

if (settingsBtn && settingsPanel) {
  settingsBtn.onclick = () => {
    settingsPanel.hidden = !settingsPanel.hidden;
  };
}

if (closeSettings && settingsPanel) {
  closeSettings.onclick = () => {
    settingsPanel.hidden = true;
  };
}

if (fullscreenBtn) {
  fullscreenBtn.onclick = () => {
    document.documentElement.requestFullscreen?.();
  };
}

/*
 * تحميل الإعدادات الحالية
 */
if (readerMode) {
  readerMode.value = settings.mode;
}

if (fitMode) {
  fitMode.value = settings.fit;
}

if (readerBg) {
  readerBg.value = settings.bg;
}

if (rtlMode) {
  rtlMode.checked = settings.rtl;
}

if (rememberPos) {
  rememberPos.checked = settings.remember;
}

/*
 * تغيير وضع القراءة
 */
if (readerMode) {
  readerMode.onchange = event => {
    settings.mode = event.target.value;

    localStorage.setItem(
      "readerMode",
      settings.mode
    );

    location.reload();
  };
}

/*
 * تغيير ملاءمة الصفحة
 */
if (fitMode) {
  fitMode.onchange = event => {
    settings.fit = event.target.value;

    localStorage.setItem(
      "readerFit",
      settings.fit
    );

    location.reload();
  };
}

/*
 * تغيير الخلفية
 */
if (readerBg) {
  readerBg.onchange = event => {
    settings.bg = event.target.value;

    localStorage.setItem(
      "readerBg",
      settings.bg
    );

    location.reload();
  };
}

/*
 * RTL / LTR
 */
if (rtlMode) {
  rtlMode.onchange = event => {
    settings.rtl = event.target.checked;

    localStorage.setItem(
      "readerRTL",
      String(settings.rtl)
    );

    location.reload();
  };
}

/*
 * تذكر مكان القراءة
 */
if (rememberPos) {
  rememberPos.onchange = event => {
    settings.remember =
      event.target.checked;

    localStorage.setItem(
      "readerRemember",
      String(settings.remember)
    );
  };
}

/* =========================
   Remember Reading Position
========================= */

window.addEventListener("scroll", () => {
  const chapterId = getChapterId();

  if (
    chapterId &&
    settings.remember
  ) {
    localStorage.setItem(
      `pos_${chapterId}`,
      String(window.scrollY)
    );
  }
});

window.addEventListener("load", () => {
  const chapterId = getChapterId();

  if (!chapterId || !settings.remember) {
    return;
  }

  const position = safeNumber(
    localStorage.getItem(`pos_${chapterId}`),
    0
  );

  if (position > 50) {
    setTimeout(() => {
      window.scrollTo(0, position);
    }, 300);
  }
});

/* =========================
   Keyboard
========================= */

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (settingsPanel) {
      settingsPanel.hidden = true;
    }
  }

  if (event.key.toLowerCase() === "f") {
    document.documentElement.requestFullscreen?.();
  }
});