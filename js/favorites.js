/* VORTEX GROUP — FAVORITES JS */
(async function () {

    const grid = document.getElementById("fav-grid");

    const empty = () => {
        grid.innerHTML = V.empty(V.icon("heart", 26), "لا توجد أعمال في المفضلة",
            "اضغط زر «إضافة للمفضلة» في صفحة أي عمل ليظهر هنا.");
        grid.querySelector(".empty").insertAdjacentHTML("beforeend", `<a class="btn primary" href="browse.html">تصفح الأعمال</a>`);
    };

    async function render() {
        const ids = V.favs.all();
        if (!ids.length) { empty(); return; }
        try {
            const list = `(${ids.map(i => encodeURIComponent(i)).join(",")})`;
            const rows = await VortexAPI.rawGet(`manga?select=id,title,status,cover_url&id=in.${list}`);
            const map = Object.fromEntries(rows.map(r => [r.id, r]));
            const ordered = ids.map(i => map[i]).filter(Boolean);
            if (!ordered.length) { empty(); return; }
            grid.innerHTML = ordered.map(m =>
                `<div class="fav-item">${V.mangaCard(m)}<button type="button" class="fav-x" data-id="${V.esc(m.id)}" aria-label="إزالة من المفضلة">${V.icon("heart")}</button></div>`).join("");
        } catch (err) {
            console.error("VORTEX favorites error:", err);
            grid.innerHTML = V.empty(V.icon("info", 26), "تعذر تحميل المفضلة", "تحقق من الاتصال وحاول مرة ثانية.");
        }
    }

    grid.addEventListener("click", e => {
        const b = e.target.closest(".fav-x");
        if (!b) return;
        V.favs.toggle(b.dataset.id);
        render();
    });

    render();

})();
