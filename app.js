const DEFAULT_DATA={
 title:"بوروتو: دوامتان زرقاوتان", english:"BORUTO -TWO BLUE VORTEX-", japanese:"BORUTO -TWO BLUE VORTEX-",
 status:"مستمرة (مانجا شهرية)", author:"Masashi Kishimoto", artist:"Mikio Ikemoto",
 genres:["أكشن","مغامرات","شونين","قوة خارقة","دراما","خيال علمي"],
 description:"بعد أن تم تعديل ذكريات الجميع، يجد بوروتو نفسه مطارداً من قريته. وبعد هروبه مع ساسكي، ما المستقبل الذي ينتظر بوروتو...؟",
 cover:"assets/cover.png", chapters:[]
};
function localData(){try{return {...DEFAULT_DATA,...JSON.parse(localStorage.getItem("mangaData")||"{}")}}catch{return DEFAULT_DATA}}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function loadData(){
 const cfg=window.SITE_CONFIG||{};
 if(!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY))return localData();
 try{
   const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
   await new Promise((ok,fail)=>{s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
   const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
   const m=await sb.from("manga").select("*").limit(1).maybeSingle();
   if(m.error||!m.data)return localData();
   const c=await sb.from("chapters").select("id,number,title,published_at").eq("manga_id",m.data.id).order("number",{ascending:false});
   return {...DEFAULT_DATA,...m.data,cover:m.data.cover_url||"assets/cover.png",chapters:(c.data||[]).map(x=>({...x,date:x.published_at}))};
 }catch{return localData()}
}
async function render(){
 const d=await loadData();
 for(const k of ["title","english","description","author","artist","japanese","status"]){const el=document.getElementById(k);if(el)el.textContent=d[k]||""}
 const cover=document.getElementById("cover");if(cover)cover.src=d.cover||"assets/cover.png";
 const genres=document.getElementById("genres");if(genres)genres.innerHTML=(d.genres||[]).map(g=>`<span>${esc(g)}</span>`).join("");
 const about=document.getElementById("aboutDescription");if(about)about.textContent=d.description||"";
 const count=document.getElementById("chapterCount");if(count)count.textContent=(d.chapters||[]).length;
 const grid=document.getElementById("chapterGrid");if(!grid)return;
 const q=(document.getElementById("search")?.value||"").trim().toLowerCase(),sort=document.getElementById("sort")?.value||"desc";
 let ch=(d.chapters||[]).filter(c=>`${c.number} ${c.title}`.toLowerCase().includes(q));
 ch.sort((a,b)=>(sort==="desc"?1:-1)*(Number(a.number)-Number(b.number)));
 if(!ch.length){grid.innerHTML=`<div class="empty-chapters"><div class="empty-icon">渦</div><h3>لا توجد فصول منشورة بعد</h3><p>أضف أول فصل من لوحة الإدارة.</p></div>`;return}
 grid.innerHTML=ch.map((c,i)=>`<a class="chapter-card ${i===0?"latest":""}" href="reader.html?chapter=${encodeURIComponent(c.id)}"><div class="chapter-number">${esc(String(c.number).padStart(2,"0"))}</div><div class="chapter-info"><span>${i===0?"الأحدث":"الفصل"}</span><h3>${esc(c.title||"الفصل "+c.number)}</h3><small>${esc(c.date||"")}</small></div><span class="chapter-arrow">←</span></a>`).join("");
}
document.getElementById("search")?.addEventListener("input",render);
document.getElementById("sort")?.addEventListener("change",render);
render();