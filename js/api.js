/* VORTEX — API (Supabase REST) */

const VortexAPI = (() => {

    const cfg =
        (typeof VORTEX_CONFIG !== "undefined" && VORTEX_CONFIG) ||
        (typeof CONFIG !== "undefined" && CONFIG) ||
        (typeof APP_CONFIG !== "undefined" && APP_CONFIG) ||
        (typeof SUPABASE_CONFIG !== "undefined" && SUPABASE_CONFIG) ||
        {};

    const url = (
        cfg.supabaseUrl || cfg.SUPABASE_URL || cfg.url ||
        (typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : "") || ""
    ).replace(/\/$/, "");

    const key =
        cfg.supabaseAnonKey || cfg.SUPABASE_ANON_KEY || cfg.anonKey || cfg.supabaseKey || cfg.key ||
        (typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : "") || "";

    const bucket = cfg.bucket || "manga-pages";

    if (!url || !key) {
        console.error("VORTEX: لم يتم العثور على إعدادات Supabase في config.js");
    }

    async function get(path) {
        const res = await fetch(`${url}/rest/v1/${path}`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }

    function fileUrl(path) {
        if (!path) return "";
        if (/^https?:\/\//i.test(path)) return path;
        return `${url}/storage/v1/object/public/${bucket}/${path.replace(/^\/+/, "")}`;
    }

    return {
        fileUrl,
        latestChapters: (n = 8) =>
            get(`chapters?select=id,number,title,published_at,created_at,manga(id,title,cover_url)&order=created_at.desc&limit=${n}`),
        recentManga: (n = 12) =>
            get(`manga?select=*&order=created_at.desc&limit=${n}`),
        popularManga: (n = 6) =>
            get(`manga?select=*&order=title.asc&limit=${n}`)
    };

})();
