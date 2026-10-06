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
    c.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap";
    document.head.append(a, b, c);
})();

const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    chevron: '<path d="m15 6-6 6 6 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    book: '<path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h9"/>'
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


(function buildLayout() {

    const links = [
        ["index.html", "الرئيسية"],
        ["browse.html", "تصفح"],
        ["library.html", "مكتبتي"],
        ["favorites.html", "المفضلة"],
        ["history.html", "السجل"],
        ["lists.html", "القوائم"]
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
                    <span>VORTEX GROUP</span>
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
                    <a href="library.html">مكتبتي</a>
                </div>
            </div>
        </footer>`;
    }

})();
