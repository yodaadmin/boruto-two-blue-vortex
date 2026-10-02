/* VORTEX — CORE JS (هيدر، فوتر، أدوات مشتركة) */

const V = {

    esc(text) {
        return String(text ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    },

    mangaCard(m) {
        const cover = VortexAPI.fileUrl(m.cover_url);
        return `
        <article class="manga-card">
            <a class="manga-cover" href="manga.html?id=${m.id}">
                ${cover ? `<img src="${V.esc(cover)}" alt="${V.esc(m.title)}" loading="lazy">` : ""}
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
        ["search.html", "بحث"],
        ["library.html", "مكتبتي"],
        ["favorites.html", "المفضلة"],
        ["history.html", "السجل"],
        ["lists.html", "القوائم"]
    ];

    const current = location.pathname.split("/").pop() || "index.html";

    const items = links.map(([href, label]) =>
        `<a href="${href}" class="${href === current ? "active" : ""}">${label}</a>`
    ).join("");

    const header = document.getElementById("app-header");
    if (header) {
        header.innerHTML = `
        <header class="site-header">
            <div class="site-header-inner">
                <a class="site-logo" href="index.html">
                    <span class="site-logo-mark">V</span>
                    <span>VORTEX</span>
                </a>
                <nav class="site-nav">${items}</nav>
                <div class="header-actions">
                    <a class="header-action" href="search.html" aria-label="بحث">⌕</a>
                    <button class="header-action mobile-menu-button" id="menu-btn" aria-label="القائمة">☰</button>
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
                <p>© ${new Date().getFullYear()} VORTEX — جميع الحقوق محفوظة</p>
                <div class="site-footer-links">
                    <a href="browse.html">تصفح</a>
                    <a href="library.html">مكتبتي</a>
                </div>
            </div>
        </footer>`;
    }

})();
