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
cover: "assets/cover.png"
};

/* =========================================================
HELPERS
========================================================= */

function esc(value) {
return String(value ?? "").replace(
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
SUPABASE CLIENT
========================================================= */

async function getSupabase() {

const cfg = window.SITE_CONFIG || {};

if (
!cfg.SUPABASE_URL ||
!cfg.SUPABASE_ANON_KEY
) {
throw new Error(
"إعدادات Supabase غير موجودة في config.js"
);
}

/*

* إذا كانت المكتبة موجودة مسبقًا
* نستخدمها مباشرة.
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
(resolve, reject) => {

  script.onload = resolve;

  script.onerror = () =>
    reject(
      new Error(
        "تعذر تحميل مكتبة Supabase."
      )
    );

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
LOCAL DATA
========================================================= */

function getLocalData() {

try {

const saved =
  JSON.parse(
    localStorage.getItem(
      "mangaData"
    ) || "{}"
  );


return {
  ...DEFAULT_DATA,
  ...saved
};

} catch {

return {
  ...DEFAULT_DATA
};

}

}

/* =========================================================
LOAD MANGA + CHAPTERS FROM SUPABASE
========================================================= */

async function loadData() {

const sb =
await getSupabase();

/* -------------------------------------------------------
جلب المانجا
------------------------------------------------------- */

const mangaResult =
await sb
.from("manga")
.select("*")
.limit(1)
.maybeSingle();

if (mangaResult.error) {

throw new Error(
  "خطأ في قراءة جدول manga: " +
  mangaResult.error.message
);

}

const manga =
mangaResult.data || {};

/* -------------------------------------------------------
جلب الفصول الموجودة فعليًا

 مهم جدًا:
 لا نستخدم localStorage للفصول هنا.
 Supabase هو المصدر الرئيسي.

------------------------------------------------------- */

let chaptersQuery =
sb
.from("chapters")
.select(
"id,number,title,published_at,manga_id"
);

/*

* إذا كان manga يحتوي id
* نربط الفصول بهذه المانجا فقط.
  */

if (manga.id) {

chaptersQuery =
  chaptersQuery.eq(
    "manga_id",
    manga.id
  );

}

const chaptersResult =
await chaptersQuery
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

/*

* Supabase هو المصدر الوحيد للفصول.
  */

const rawChapters =
Array.isArray(
chaptersResult.data
)
? chaptersResult.data
: [];

/*

* ننظف البيانات.
* 
* أي سجل ليس لديه UUID صالح
* لن يظهر كفصل قابل للفتح.
  */

const chapters =
rawChapters
.filter(
chapter =>
chapter &&
isValidUUID(
chapter.id
)
)
.map(
chapter => ({

      id:
        String(
          chapter.id
        ).trim(),

      number:
        safeNumber(
          chapter.number
        ),

      title:
        chapter.title || "",

      published_at:
        chapter.published_at ||
        "",

      date:
        chapter.published_at ||
        "",

      manga_id:
        chapter.manga_id || null

    })
  );

/*

* إزالة أي UUID مكرر
  */

const unique = new Map();

for (const chapter of chapters) {

if (!unique.has(chapter.id)) {

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

/*

* ترتيب رقمي حقيقي.
* 
* مثال:
* 
* 10
* 9
* 8
* 7
* 
* وليس:
* 
* 9
* 8
* 7
* 10
  */

cleanChapters.sort(
(a, b) => {

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

for (const field of fields) {

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

/*

* الغلاف
  */

const cover =
document.getElementById(
"cover"
);

if (cover) {

cover.src =
  data.cover ||
  DEFAULT_DATA.cover;

}

/*

* وصف قسم المعلومات
  */

const aboutDescription =
document.getElementById(
"aboutDescription"
);

if (aboutDescription) {

aboutDescription.textContent =
  data.description || "";

}

/*

* التصنيفات
  */

const genres =
document.getElementById(
"genres"
);

if (genres) {

genres.innerHTML =
  (data.genres || [])
    .map(
      genre =>
        `<span>${esc(genre)}</span>`
    )
    .join("");

}

/*

* عدد الفصول
  */

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

/*

* البحث
  */

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

/*

* الترتيب
  */

const sortSelect =
document.getElementById(
"sort"
);

const sort =
sortSelect?.value ||
"desc";

/*

* نسخة مستقلة من الفصول
  */

let chapters =
[...data.chapters];

/*

* البحث
  */

if (search) {

chapters =
  chapters.filter(
    chapter => {

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

/*

* الترتيب
  */

chapters.sort(
(a, b) => {

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

/*

* لا توجد نتائج
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
      أضف فصلًا من لوحة الإدارة.
    </p>

  </div>

`;

return;

}

/*

* إنشاء بطاقات الفصول
  */

grid.innerHTML =
chapters
.map(
(chapter, index) => {

      /*
       * UUID الحقيقي
       */

      const id =
        String(
          chapter.id
        ).trim();


      /*
       * لا نعرض رابطًا لفصل
       * بدون UUID صالح.
       *
       * لكن هذا لن يحدث عادةً
       * لأن loadData قام بتنقيته.
       */

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
          chapter.number
        );


      const numberText =
        number !== null
          ? String(
              number
            ).padStart(2, "0")
          : "--";


      /*
       * عنوان الفصل
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
       * الرابط النهائي.
       *
       * مهم:
       *
       * reader-2.html
       *
       * وليس reader.html
       */

      const readerUrl =
        "reader-2.html?chapter=" +
        encodeURIComponent(id);


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
            ${esc(numberText)}
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
EVENTS
========================================================= */

const searchInput =
document.getElementById(
"search"
);

if (searchInput) {

searchInput.addEventListener(
"input",
() => {

  if (window.MANGA_DATA) {

    renderChapters(
      window.MANGA_DATA
    );

  }

}

);

}

const sortSelect =
document.getElementById(
"sort"
);

if (sortSelect) {

sortSelect.addEventListener(
"change",
() => {

  if (window.MANGA_DATA) {

    renderChapters(
      window.MANGA_DATA
    );

  }

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
 * نخزن البيانات الحالية
 * في الذاكرة فقط.
 *
 * لا نخزن الفصول في localStorage.
 */

window.MANGA_DATA =
  data;


renderMangaInfo(
  data
);


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
        chapter =>
          chapter.id
      )
  }
);

} catch (error) {

console.error(
  "Site initialization error:",
  error
);


/*
 * لا نعرض بيانات قديمة
 * إذا فشل Supabase.
 *
 * لأن المطلوب أن تكون
 * قائمة الفصول مطابقة
 * لما هو موجود فعليًا
 * في Supabase.
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
        تحقق من اتصال Supabase
        ثم أعد تحميل الصفحة.
      </p>

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
