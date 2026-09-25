const DEFAULT_DATA = {
  title: "بوروتو: دوامتان زرقاوتان",
  english: "BORUTO -TWO BLUE VORTEX-",
  japanese: "BORUTO -TWO BLUE VORTEX-",
  status: "مستمرة (مانجا شهرية)",
  author: "Masashi Kishimoto",
  artist: "Mikio Ikemoto",
  genres: [
    "أكشن",
    "مغامرات",
    "شونين",
    "قوة خارقة",
    "دراما",
    "خيال علمي"
  ],
  description:
    "بعد أن تم تعديل ذكريات الجميع، يجد بوروتو نفسه مطارداً من قريته. وبعد هروبه مع ساسكي، ما المستقبل الذي ينتظر بوروتو...؟",
  cover: "cover.png",
  chapters: []
};


/* =========================================================
   HELPERS
========================================================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m];
    }
  );
}


function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}


function safeNumber(value, fallback = null) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


/* =========================================================
   SUPABASE
========================================================= */

async function getSupabase() {

  const cfg = window.SITE_CONFIG || {};

  if (
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "إعدادات Supabase غير موجودة في config.js."
    );
  }


  /*
   * إذا كانت مكتبة Supabase موجودة بالفعل
   */
  if (window.supabase) {

    return window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );

  }


  /*
   * تحميل مكتبة Supabase تلقائيًا
   */
  const script =
    document.createElement("script");

  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


  await new Promise(
    function (resolve, reject) {

      script.onload = resolve;

      script.onerror = function () {
        reject(
          new Error(
            "تعذر تحميل مكتبة Supabase."
          )
        );
      };

      document.head.appendChild(script);

    }
  );


  if (!window.supabase) {

    throw new Error(
      "مكتبة Supabase لم يتم تحميلها."
    );

  }


  return window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

  const sb =
    await getSupabase();


  /* =======================================================
     MANGA
  ======================================================= */

  let manga = {};

  const mangaResult =
    await sb
      .from("manga")
      .select("*")
      .limit(1);


  if (mangaResult.error) {

    throw new Error(
      "خطأ في قراءة جدول manga: " +
      mangaResult.error.message
    );

  }


  if (
    Array.isArray(mangaResult.data) &&
    mangaResult.data.length
  ) {

    manga =
      mangaResult.data[0];

  }


  /* =======================================================
     CHAPTERS

     مهم جدًا:
     لا نعتمد على localStorage.

     Supabase هو المصدر الوحيد للفصول.
  ======================================================= */

  const chaptersResult =
    await sb
      .from("chapters")
      .select(
        "id,number,title,published_at,manga_id"
      )
      .order(
        "number",
        {
          ascending: false,
          nullsFirst: false
        }
      );


  if (chaptersResult.error) {

    throw new Error(
      "خطأ في قراءة جدول chapters: " +
      chaptersResult.error.message
    );

  }


  const rawChapters =
    Array.isArray(chaptersResult.data)
      ? chaptersResult.data
      : [];


  /* =======================================================
     تنظيف الفصول

     نسمح فقط بالفصل الذي لديه UUID حقيقي.
  ======================================================= */

  const chapters =
    rawChapters
      .filter(
        function (chapter) {

          return (
            chapter &&
            isValidUUID(chapter.id)
          );

        }
      )
      .map(
        function (chapter) {

          const number =
            safeNumber(
              chapter.number,
              null
            );


          return {

            id:
              String(
                chapter.id
              ).trim(),

            number:
              number,

            title:
              chapter.title
                ? String(chapter.title)
                : "",

            published_at:
              chapter.published_at || "",

            date:
              chapter.published_at || "",

            manga_id:
              chapter.manga_id || null

          };

        }
      );


  /* =======================================================
     إزالة UUID المكرر
  ======================================================= */

  const unique =
    new Map();


  for (
    const chapter of chapters
  ) {

    if (
      !unique.has(
        chapter.id
      )
    ) {

      unique.set(
        chapter.id,
        chapter
      );

    }

  }


  const cleanChapters =
    Array.from(
      unique.values()
    );


  /* =======================================================
     ترتيب رقمي حقيقي

     10
     9
     8
     7
     6
  ======================================================= */

  cleanChapters.sort(
    function (a, b) {

      const an =
        safeNumber(
          a.number,
          -Infinity
        );

      const bn =
        safeNumber(
          b.number,
          -Infinity
        );


      return bn - an;

    }
  );


  /* =======================================================
     البيانات النهائية
  ======================================================= */

  return {

    ...DEFAULT_DATA,

    ...manga,

    title:
      manga.title ||
      DEFAULT_DATA.title,

    english:
      manga.english ||
      DEFAULT_DATA.english,

    japanese:
      manga.japanese ||
      DEFAULT_DATA.japanese,

    status:
      manga.status ||
      DEFAULT_DATA.status,

    author:
      manga.author ||
      DEFAULT_DATA.author,

    artist:
      manga.artist ||
      DEFAULT_DATA.artist,

    description:
      manga.description ||
      DEFAULT_DATA.description,

    genres:
      Array.isArray(
        manga.genres
      )
        ? manga.genres
        : DEFAULT_DATA.genres,

    /*
     * ملف الغلاف موجود عندك في الجذر
     */
    cover:
      manga.cover_url ||
      manga.cover ||
      DEFAULT_DATA.cover,

    chapters:
      cleanChapters

  };

}


/* =========================================================
   RENDER MANGA INFORMATION
========================================================= */

function renderMangaInfo(data) {

  const fields = [
    "title",
    "english",
    "description",
    "author",
    "artist",
    "japanese",
    "status"
  ];


  for (
    const field of fields
  ) {

    const element =
      document.getElementById(
        field
      );


    if (!element) {
      continue;
    }


    element.textContent =
      data[field] || "";

  }


  /* =======================================================
     COVER
  ======================================================= */

  const cover =
    document.getElementById(
      "cover"
    );


  if (cover) {

    cover.src =
      data.cover ||
      DEFAULT_DATA.cover;

    cover.onerror =
      function () {

        /*
         * إذا كان الرابط القادم من Supabase
         * غير صالح، نعود إلى الغلاف المحلي.
         */

        if (
          cover.src !==
          new URL(
            DEFAULT_DATA.cover,
            location.href
          ).href
        ) {

          cover.src =
            DEFAULT_DATA.cover;

        }

      };

  }


  /* =======================================================
     ABOUT DESCRIPTION
  ======================================================= */

  const aboutDescription =
    document.getElementById(
      "aboutDescription"
    );


  if (aboutDescription) {

    aboutDescription.textContent =
      data.description || "";

  }


  /* =======================================================
     GENRES
  ======================================================= */

  const genres =
    document.getElementById(
      "genres"
    );


  if (genres) {

    const list =
      Array.isArray(data.genres)
        ? data.genres
        : [];


    genres.innerHTML =
      list
        .map(
          function (genre) {

            return `
              <span>
                ${esc(genre)}
              </span>
            `;

          }
        )
        .join("");

  }


  /* =======================================================
     CHAPTER COUNT
  ======================================================= */

  const chapterCount =
    document.getElementById(
      "chapterCount"
    );


  if (chapterCount) {

    chapterCount.textContent =
      String(
        data.chapters.length
      );

  }


  /*
   * تحديث زر "ابدأ القراءة"
   * بأحدث فصل حقيقي من Supabase.
   */

  updateLatestReaderLink(
    data.chapters
  );

}


/* =========================================================
   LATEST CHAPTER LINK
========================================================= */

function updateLatestReaderLink(
  chapters
) {

  const links =
    document.querySelectorAll(
      'a[href*="latest"]'
    );


  if (!links.length) {
    return;
  }


  /*
   * الفصول مرتبة تنازليًا،
   * لذلك أول عنصر هو الأحدث.
   */

  const latest =
    Array.isArray(chapters) &&
    chapters.length
      ? chapters[0]
      : null;


  for (
    const link of links
  ) {

    if (
      latest &&
      isValidUUID(latest.id)
    ) {

      link.href =
        "reader-2.html?chapter=" +
        encodeURIComponent(
          latest.id
        );

    } else {

      /*
       * لا نرسل المستخدم إلى
       * latest=1 لأن القارئ يعتمد
       * على UUID.
       */

      link.href =
        "#chapters";

    }

  }

}


/* =========================================================
   RENDER CHAPTERS
========================================================= */

function renderChapters(data) {

  const grid =
    document.getElementById(
      "chapterGrid"
    );


  if (!grid) {
    return;
  }


  /* =======================================================
     SEARCH
  ======================================================= */

  const searchInput =
    document.getElementById(
      "search"
    );


  const search =
    (
      searchInput?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  /* =======================================================
     SORT
  ======================================================= */

  const sortSelect =
    document.getElementById(
      "sort"
    );


  const sort =
    sortSelect?.value ||
    "desc";


  /* =======================================================
     COPY
  ======================================================= */

  let chapters =
    Array.isArray(data.chapters)
      ? [...data.chapters]
      : [];


  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  if (search) {

    chapters =
      chapters.filter(
        function (chapter) {

          const number =
            String(
              chapter.number ?? ""
            );


          const title =
            String(
              chapter.title || ""
            );


          return (
            `${number} ${title}`
              .toLowerCase()
              .includes(search)
          );

        }
      );

  }


  /* =======================================================
     SORT
  ======================================================= */

  chapters.sort(
    function (a, b) {

      const an =
        safeNumber(
          a.number,
          -Infinity
        );


      const bn =
        safeNumber(
          b.number,
          -Infinity
        );


      return sort === "asc"
        ? an - bn
        : bn - an;

    }
  );


  /* =======================================================
     EMPTY
  ======================================================= */

  if (!chapters.length) {

    grid.innerHTML = `

      <div class="empty-chapters">

        <div class="empty-icon">
          渦
        </div>

        <h3>
          ${
            search
              ? "لا توجد نتائج"
              : "لا توجد فصول منشورة بعد"
          }
        </h3>

        <p>
          ${
            search
              ? "جرّب البحث برقم أو اسم فصل آخر."
              : "لا توجد فصول متاحة حاليًا في قاعدة البيانات."
          }
        </p>

      </div>

    `;

    return;

  }


  /* =======================================================
     CHAPTER CARDS
  ======================================================= */

  grid.innerHTML =
    chapters
      .map(
        function (chapter, index) {

          /*
           * UUID الحقيقي
           */

          const id =
            String(
              chapter.id
            ).trim();


          if (
            !isValidUUID(id)
          ) {

            return "";

          }


          /*
           * رقم الفصل
           */

          const number =
            safeNumber(
              chapter.number,
              null
            );


          const numberText =
            number !== null
              ? String(number)
                  .padStart(2, "0")
              : "--";


          /*
           * العنوان
           */

          const title =
            chapter.title ||
            (
              number !== null
                ? `الفصل ${number}`
                : "الفصل"
            );


          /*
           * التاريخ
           */

          const date =
            chapter.date ||
            chapter.published_at ||
            "";


          /*
           * UUID هو الذي يفتح الفصل.
           */

          const readerUrl =
            "reader-2.html?chapter=" +
            encodeURIComponent(id);


          return `

            <a
              class="chapter-card ${
                index === 0 &&
                sort === "desc"
                  ? "latest"
                  : ""
              }"
              href="${readerUrl}"
            >

              <div class="chapter-number">
                ${esc(numberText)}
              </div>

              <div class="chapter-info">

                <span>
                  ${
                    index === 0 &&
                    sort === "desc"
                      ? "الأحدث"
                      : "الفصل"
                  }
                </span>

                <h3>
                  ${esc(title)}
                </h3>

                ${
                  date
                    ? `
                      <small>
                        ${esc(date)}
                      </small>
                    `
                    : ""
                }

              </div>

              <span class="chapter-arrow">
                ←
              </span>

            </a>

          `;

        }
      )
      .join("");

}


/* =========================================================
   SEARCH EVENT
========================================================= */

const searchInput =
  document.getElementById(
    "search"
  );


if (searchInput) {

  searchInput.addEventListener(
    "input",
    function () {

      if (window.MANGA_DATA) {

        renderChapters(
          window.MANGA_DATA
        );

      }

    }
  );

}


/* =========================================================
   SORT EVENT
========================================================= */

const sortSelect =
  document.getElementById(
    "sort"
  );


if (sortSelect) {

  sortSelect.addEventListener(
    "change",
    function () {

      if (window.MANGA_DATA) {

        renderChapters(
          window.MANGA_DATA
        );

      }

    }
  );

}


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenu =
  document.getElementById(
    "mobileMenu"
  );


if (mobileMenu) {

  mobileMenu.addEventListener(
    "click",
    function () {

      document.body.classList.toggle(
        "menu-open"
      );

    }
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initSite() {

  try {

    const data =
      await loadData();


    /*
     * البيانات الحالية في الذاكرة فقط.
     */
    window.MANGA_DATA =
      data;


    /*
     * عرض معلومات المانجا.
     */
    renderMangaInfo(
      data
    );


    /*
     * عرض الفصول.
     */
    renderChapters(
      data
    );


    console.log(
      "Manga loaded successfully.",
      {
        chapters:
          data.chapters.length,

        ids:
          data.chapters.map(
            function (chapter) {
              return chapter.id;
            }
          )
      }
    );


  } catch (error) {

    console.error(
      "Site initialization error:",
      error
    );


    /*
     * لا نستخدم بيانات قديمة
     * من localStorage.
     */

    const grid =
      document.getElementById(
        "chapterGrid"
      );


    if (grid) {

      grid.innerHTML = `

        <div class="empty-chapters">

          <div class="empty-icon">
            !
          </div>

          <h3>
            تعذر تحميل الفصول
          </h3>

          <p>
            ${
              esc(
                error.message ||
                "حدث خطأ أثناء الاتصال بقاعدة البيانات."
              )
            }
          </p>

          <button
            type="button"
            onclick="location.reload()"
            style="
              margin-top:15px;
              padding:10px 18px;
              border:0;
              border-radius:10px;
              cursor:pointer;
            "
          >
            إعادة المحاولة
          </button>

        </div>

      `;

    }


    const count =
      document.getElementById(
        "chapterCount"
      );


    if (count) {

      count.textContent =
        "0";

    }

  }

}


/* =========================================================
   START
========================================================= */

initSite();
