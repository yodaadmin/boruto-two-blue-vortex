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
cover: "assets/cover.png",
chapters: []
};

/* =========================
LOCAL DATA
========================= */

function localData() {

try {

const saved =
  JSON.parse(
    localStorage.getItem("mangaData") || "{}"
  );

return {
  ...DEFAULT_DATA,
  ...saved,

  chapters:
    Array.isArray(saved.chapters)
      ? saved.chapters
      : []
};

} catch {

return DEFAULT_DATA;

}

}

/* =========================
ESCAPE HTML
========================= */

function esc(value) {

return String(value ?? "")
.replace(
/[&<>"']/g,
m => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
}[m])
);

}

/* =========================
LOAD DATA
========================= */

async function loadData() {

const cfg =
window.SITE_CONFIG || {};

/*

* إذا لم توجد إعدادات Supabase
* نستخدم البيانات المحلية.
  */

if (
!cfg.SUPABASE_URL ||
!cfg.SUPABASE_ANON_KEY
) {

return localData();

}

try {

/*
 * تحميل مكتبة Supabase
 */

if (!window.supabase) {

  const script =
    document.createElement("script");

  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  await new Promise(
    (resolve, reject) => {

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(
        script
      );

    }
  );

}


/*
 * إنشاء الاتصال
 */

const sb =
  window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );


/*
 * جلب بيانات المانجا
 */

const mangaResult =
  await sb
    .from("manga")
    .select("*")
    .limit(1)
    .maybeSingle();


if (
  mangaResult.error ||
  !mangaResult.data
) {

  return localData();

}


const manga =
  mangaResult.data;


/*
 * جلب الفصول
 */

const chaptersResult =
  await sb
    .from("chapters")
    .select(
      "id,number,title,published_at"
    )
    .eq(
      "manga_id",
      manga.id
    )
    .order(
      "number",
      {
        ascending: false,
        nullsFirst: false
      }
    );


if (chaptersResult.error) {

  return {
    ...DEFAULT_DATA,
    ...manga,
    cover:
      manga.cover_url ||
      "assets/cover.png",

    chapters: []
  };

}


const chapters =
  Array.isArray(
    chaptersResult.data
  )
    ? chaptersResult.data
    : [];


return {

  ...DEFAULT_DATA,

  ...manga,

  cover:
    manga.cover_url ||
    "assets/cover.png",

  chapters:
    chapters.map(
      chapter => ({

        ...chapter,

        date:
          chapter.published_at ||
          ""

      })
    )

};

} catch (error) {

console.error(
  "loadData error:",
  error
);

return localData();

}

}

/* =========================
RENDER
========================= */

async function render() {

const d =
await loadData();

/*

* معلومات المانجا
  */

for (
const key of [
"title",
"english",
"description",
"author",
"artist",
"japanese",
"status"
]
) {

const element =
  document.getElementById(key);

if (element) {

  element.textContent =
    d[key] || "";

}

}

/*

* الغلاف
  */

const cover =
document.getElementById("cover");

if (cover) {

cover.src =
  d.cover ||
  "assets/cover.png";

}

/*

* التصنيفات
  */

const genres =
document.getElementById("genres");

if (genres) {

genres.innerHTML =
  (d.genres || [])
    .map(
      genre =>
        `<span>${esc(genre)}</span>`
    )
    .join("");

}

/*

* وصف المانجا
  */

const about =
document.getElementById(
"aboutDescription"
);

if (about) {

about.textContent =
  d.description || "";

}

/*

* عدد الفصول
  */

const count =
document.getElementById(
"chapterCount"
);

if (count) {

count.textContent =
  (d.chapters || []).length;

}

/*

* شبكة الفصول
  */

const grid =
document.getElementById(
"chapterGrid"
);

if (!grid) {

return;

}

/*

* البحث
  */

const search =
document.getElementById(
"search"
);

const q =
(
search?.value ||
""
)
.trim()
.toLowerCase();

/*

* الترتيب
  */

const sort =
document.getElementById(
"sort"
)?.value ||
"desc";

/*

* تجهيز الفصول
  */

let chapters =
Array.isArray(d.chapters)
? [...d.chapters]
: [];

/*

* البحث برقم الفصل أو عنوانه
  */

chapters =
chapters.filter(
chapter => {

    const number =
      String(
        chapter.number ??
        ""
      );

    const title =
      String(
        chapter.title ??
        ""
      );

    return (
      `${number} ${title}`
        .toLowerCase()
        .includes(q)
    );

  }
);

/*

* ترتيب رقمي حقيقي
* 
* وليس ترتيبًا نصيًا.
  */

chapters.sort(
(a,b) => {

  const an =
    Number(a.number);

  const bn =
    Number(b.number);


  if (
    !Number.isFinite(an) &&
    !Number.isFinite(bn)
  ) {

    return 0;

  }


  if (!Number.isFinite(an)) {

    return 1;

  }


  if (!Number.isFinite(bn)) {

    return -1;

  }


  return sort === "desc"
    ? bn - an
    : an - bn;

}

);

/*

* لا توجد فصول
  */

if (!chapters.length) {

grid.innerHTML = `

  <div class="empty-chapters">

    <div class="empty-icon">
      渦
    </div>

    <h3>
      لا توجد فصول منشورة بعد
    </h3>

    <p>
      أضف أول فصل من لوحة الإدارة.
    </p>

  </div>

`;

return;

}

/*

* ==================================================
* IMPORTANT
* 
* رابط الفصل يستخدم:
* 
* reader-2.html?chapter=UUID
* 
* وليس:
* 
* reader.html?chapter=...
* 
* ==================================================
  */

grid.innerHTML =
chapters
.map(
(chapter, index) => {

      /*
       * UUID الحقيقي للفصل
       */

      const chapterId =
        String(
          chapter.id || ""
        ).trim();


      /*
       * رقم الفصل
       */

      const number =
        Number(
          chapter.number
        );


      const displayNumber =
        Number.isFinite(number)
          ? String(number).padStart(2, "0")
          : "--";


      /*
       * عنوان الفصل
       */

      const title =
        chapter.title ||
        (
          Number.isFinite(number)
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
       * حماية من UUID مفقود
       */

      if (!chapterId) {

        return `

          <div class="chapter-card">

            <div class="chapter-number">
              ${esc(displayNumber)}
            </div>

            <div class="chapter-info">

              <span>
                فصل غير صالح
              </span>

              <h3>
                ${esc(title)}
              </h3>

              <small>
                معرّف الفصل مفقود
              </small>

            </div>

          </div>

        `;

      }


      /*
       * الرابط الصحيح للقارئ
       */

      const readerUrl =
        "reader-2.html?chapter=" +
        encodeURIComponent(
          chapterId
        );


      return `

        <a
          class="chapter-card ${
            index === 0
              ? "latest"
              : ""
          }"
          href="${readerUrl}"
        >

          <div class="chapter-number">
            ${esc(displayNumber)}
          </div>

          <div class="chapter-info">

            <span>
              ${
                index === 0
                  ? "الأحدث"
                  : "الفصل"
              }
            </span>

            <h3>
              ${esc(title)}
            </h3>

            <small>
              ${esc(date)}
            </small>

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

/* =========================
SEARCH
========================= */

const searchInput =
document.getElementById(
"search"
);

if (searchInput) {

searchInput.addEventListener(
"input",
() => {

  render();

}

);

}

/* =========================
SORT
========================= */

const sortSelect =
document.getElementById(
"sort"
);

if (sortSelect) {

sortSelect.addEventListener(
"change",
() => {

  render();

}

);

}

/* =========================
START
========================= */

render();
