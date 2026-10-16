/* VORTEX — CORE JS (خطوط، أيقونات، هيدر، فوتر، أدوات) */

(function loadFavicon() {
    if (document.querySelector('link[rel="icon"]')) return;
    const add = (rel, href, extra) => {
        const l = document.createElement("link");
        l.rel = rel; l.href = href;
        if (extra) Object.assign(l, extra);
        document.head.appendChild(l);
    };
    add("icon", "assets/favicon-32.png", { type: "image/png", sizes: "32x32" });
    add("icon", "assets/favicon-192.png", { type: "image/png", sizes: "192x192" });
    add("apple-touch-icon", "assets/apple-touch-icon.png");
})();

(function loadFont() {
    const a = document.createElement("link");
    a.rel = "preconnect"; a.href = "https://fonts.googleapis.com";
    const b = document.createElement("link");
    b.rel = "preconnect"; b.href = "https://fonts.gstatic.com"; b.crossOrigin = "";
    const c = document.createElement("link");
    c.rel = "stylesheet";
    c.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap";
    document.head.append(a, b, c);
})();

const ICONS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    filter: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 13H8M16 17H8"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    sort: '<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
    play: '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z"/>',
    chevron: '<path d="m15 18-6-6 6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    list: '<path d="M10 6h11M10 12h11M10 18h11M4 10h2M4 6h1v4M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    compress: '<path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    up: '<path d="m5 12 7-7 7 7M12 19V5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    rows: '<rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/>',
    single: '<rect x="5" y="3" width="14" height="18" rx="2"/>',
    double: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/>',
    arrows_h: '<path d="m18 8 4 4-4 4M6 8l-4 4 4 4M2 12h20"/>',
    arrows_v: '<path d="m8 18 4 4 4-4M8 6l4-4 4 4M12 2v20"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    keyboard: '<path d="M10 8h.01M12 12h.01M14 8h.01M16 12h.01M18 8h.01M6 8h.01M7 16h10M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
};

const V = {

    icon(name, size) {
        const s = size ? ` style="width:${size}px;height:${size}px"` : "";
        return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"${s}>${ICONS[name] || ""}</svg>`;
    },

    esc(text) {
        return String(text ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    },

    date(value) {
        if (!value) return "";
        const d = new Date(value);
        if (isNaN(d)) return String(value);
        return new Intl.DateTimeFormat("ar-IQ", { year: "numeric", month: "long", day: "numeric" }).format(d);
    },

    mangaCard(m) {
        const cover = VortexAPI.fileUrl(m.cover_url);
        return `
        <article class="manga-card">
            <a class="manga-cover" href="manga.html?id=${m.id}">
                ${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}" loading="lazy">` : ""}
                ${m.status ? `<span class="manga-tag">${V.esc(String(m.status).split(" ")[0])}</span>` : ""}
            </a>
            <div class="manga-card-body">
                <h3><a href="manga.html?id=${m.id}">${V.esc(m.title)}</a></h3>
                <span class="manga-rating">${V.esc(m.status || "")}</span>
            </div>
        </article>`;
    },

    empty(icon, title, text) {
        return `
        <div class="empty" style="grid-column:1/-1">
            <div class="empty-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${text}</p>
        </div>`;
    }

};


/* تاريخ بصيغة 2023/08/26 (أرقام إنجليزية) */
V.dateYMD = function (value) {
    if (!value) return "";
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10).replace(/-/g, "/");
    const d = new Date(s);
    if (isNaN(d)) return "";
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
};

/* المفضلة (محفوظة على جهاز القارئ) */
V.num = function (n) {
    n = Number(n) || 0;
    return n.toLocaleString("en-US");
};

V.favs = {
    key: "vortex-favorites",
    all() { try { return JSON.parse(localStorage.getItem(this.key) || "[]"); } catch (e) { return []; } },
    has(id) { return this.all().includes(id); },
    toggle(id) {
        const a = this.all(), i = a.indexOf(id);
        if (i >= 0) a.splice(i, 1); else a.unshift(id);
        try { localStorage.setItem(this.key, JSON.stringify(a)); } catch (e) {}
        return i < 0;
    }
};

(function buildLayout() {

    const links = [
        ["index.html", "الرئيسية"],
        ["browse.html", "تصفح"],
        ["favorites.html", "المفضلة"]
    ];

    const current = location.pathname.split("/").pop() || "index.html";
    const isCurrent = href => href === current || href.replace(".html", "") === current;

    const items = links.map(([href, label]) =>
        `<a href="${href}" class="${isCurrent(href) ? "active" : ""}">${label}</a>`
    ).join("");

    const header = document.getElementById("app-header");
    if (header) {
        header.innerHTML = `
        <header class="site-header">
            <div class="site-header-inner">
                <a class="site-logo" href="index.html">
                    <img src="assets/vortex-mark-cyan.png" alt="" width="38" height="38">
                    <span class="logo-text"><b>VORTEX</b><em>GROUP</em></span>
                </a>
                <nav class="site-nav">${items}</nav>
                <div class="header-actions">
                    <a class="header-action" href="search.html" aria-label="بحث">${V.icon("search")}</a>
                    <button class="header-action mobile-menu-button" id="menu-btn" aria-label="القائمة">${V.icon("menu")}</button>
                </div>
            </div>
            <nav class="mobile-menu" id="mobile-menu">${items}</nav>
        </header>`;

        document.getElementById("menu-btn").addEventListener("click", () => {
            document.getElementById("mobile-menu").classList.toggle("open");
        });
    }

    const footer = document.getElementById("app-footer");
    if (footer) {
        footer.innerHTML = `
        <footer class="site-footer">
            <div class="site-footer-inner">
                <p>© ${new Date().getFullYear()} VORTEX GROUP</p>
                <div class="site-footer-links">
                    <a href="browse.html">تصفح</a>
                    <a href="search.html">بحث</a>
                </div>
            </div>
        </footer>`;
    }

})();
