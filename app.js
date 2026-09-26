const DEFAULT_DATA={
 title:"بوروتو: دوامتان زرقاوتان", english:"BORUTO -TWO BLUE VORTEX-", japanese:"BORUTO -TWO BLUE VORTEX-",
 status:"مستمرة (مانجا شهرية)", author:"Masashi Kishimoto", artist:"Mikio Ikemoto",
 genres:["أكشن","مغامرات","شونين","قوة خارقة","دراما","خيال علمي"],
 description:"بعد أن تم تعديل ذكريات الجميع، يجد بوروتو نفسه مطارداً من قريته. وبعد هروبه مع ساسكي، ما المستقبل الذي ينتظر بوروتو...؟",
 cover:"assets/cover.png", chapters:[]
};

function localData(){
 try{return {...DEFAULT_DATA,...JSON.parse(localStorage.getItem("mangaData")||"{}")}}
 catch{return DEFAULT_DATA}
}
function esc(s){
 return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))
}

async function loadData(){
 const cfg=window.SITE_CONFIG||{};
 if(!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY))return localData();

 try{
   const s=document.createElement("script");
   s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
   await new Promise((ok,fail)=>{
     s.onload=ok;s.onerror=fail;document.head.appendChild(s)
   });

   const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);

   const m=await sb.from("manga").select("*").limit(1).maybeSingle();
   if(m.error||!m.data)return localData();

   const c=await sb.from("chapters")
     .select("id,number,title,published_at")
     .eq("manga_id",m.data.id)
     .order("number",{ascending:false});

   if(c.error) throw c.error;

   return {
     ...DEFAULT_DATA,
     ...m.data,
     cover:m.data.cover_url||"assets/cover.png",
     chapters:(c.data||[]).map(x=>({
       ...x,
       number:Number(x.number),
       date:x.published_at
     }))
   };
 }catch(e){
   console.error("loadData:",e);
   return localData();
 }
}

function chapterNumber(value){
 const n=Number(value);
 return Number.isInteger(n)&&n>0?n:null;
}

async function render(){
 const d=await loadData();

 for(const k of ["title","english","description","author","artist","japanese","status"]){
   const el=document.getElementById(k);
   if(el)el.textContent=d[k]||"";
 }

 const cover=document.getElementById("cover");
 if(cover)cover.src=d.cover||"assets/cover.png";

 const genres=document.getElementById("genres");
 if(genres)genres.innerHTML=(d.genres||[]).map(g=>`<span>${esc(g)}</span>`).join("");

 const about=document.getElementById("aboutDescription");
 if(about)about.textContent=d.description||"";

 const count=document.getElementById("chapterCount");
 if(count)count.textContent=(d.chapters||[]).length;

 const grid=document.getElementById("chapterGrid");
 if(!grid)return;

 const q=(document.getElementById("search")?.value||"").trim().toLowerCase();
 const sort=document.getElementById("sort")?.value||"desc";

 let ch=(d.chapters||[])
   .filter(c=>chapterNumber(c.number)!==null)
   .filter(c=>`${c.number} ${c.title||""}`.toLowerCase().includes(q));

 ch.sort((a,b)=>{
   const diff=chapterNumber(a.number)-chapterNumber(b.number);
   return sort==="desc"?-diff:diff;
 });

 if(!ch.length){
   grid.innerHTML=`<div class="empty-chapters"><div class="empty-icon"><img src="assets/vortex-mark-cyan.png" alt=""></div><h3>لا توجد فصول منشورة بعد</h3><p>أضف أول فصل من لوحة الإدارة.</p></div>`;
   return;
 }

 grid.innerHTML=ch.map((c,i)=>{
   const n=chapterNumber(c.number);

   // مهم جدًا:
   // reader.html يستقبل رقم الفصل، وليس UUID الخاص بالفصل.
   const href=`reader.html?chapter=${encodeURIComponent(n)}`;

   return `<a class="chapter-card ${i===0?"latest":""}" href="${href}">
     <div class="chapter-number">${esc(String(n).padStart(2,"0"))}</div>
     <div class="chapter-info">
       <span>${i===0?"الأحدث":"الفصل"}</span>
       <h3>${esc(c.title||"الفصل "+n)}</h3>
       <small>${esc(c.date||"")}</small>
     </div>
     <span class="chapter-arrow">←</span>
   </a>`;
 }).join("");
}

document.getElementById("search")?.addEventListener("input",render);
document.getElementById("sort")?.addEventListener("change",render);
render();