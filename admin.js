const cfg=window.SITE_CONFIG||{};
const CLOUD=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);
const DEFAULT={title:"بوروتو: دوامتان زرقاوتان",english:"BORUTO -TWO BLUE VORTEX-",japanese:"BORUTO -TWO BLUE VORTEX-",status:"مستمرة (مانجا شهرية)",author:"Masashi Kishimoto",artist:"Mikio Ikemoto",genres:["أكشن","مغامرات","شونين","قوة خارقة","دراما","خيال علمي"],description:"بعد أن تم تعديل ذكريات الجميع، يجد بوروتو نفسه مطارداً من قريته. وبعد هروبه مع ساسكي، ما المستقبل الذي ينتظر بوروتو...؟",cover:"assets/cover.png",chapters:[]};
const localGet=()=>{try{return {...DEFAULT,...JSON.parse(localStorage.getItem("mangaData")||"{}")}}catch{return DEFAULT}};
const localSave=d=>localStorage.setItem("mangaData",JSON.stringify(d));
const el=id=>document.getElementById(id);
let supa=null, remoteManga=null;
el("modeLabel").textContent=CLOUD?"وضع سحابي":"وضع محلي";
el("localModeBtn").onclick=()=>{el("loginCard").hidden=true;el("dashboard").hidden=false;loadLocal()};
async function setup(){
 if(CLOUD){
   const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=async()=>{supa=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);el("loginCard").hidden=false;const {data}=await supa.auth.getSession();if(data.session){el("loginCard").hidden=true;el("dashboard").hidden=false;await loadCloud()}else{el("dashboard").hidden=true}};document.head.appendChild(s);
 }else{el("loginCard").hidden=true;el("dashboard").hidden=false;loadLocal()}
}
function fill(d){window.__lastManga=d;if(window.taxState)window.taxState.set(d);el("fTitle").value=d.title||"";el("fEnglish").value=d.english||"";el("fJapanese").value=d.japanese||"";el("fStatus").value=d.status||"";el("fAuthor").value=d.author||"";el("fArtist").value=d.artist||"";el("fGenres").value=(d.genres||[]).join(", ");el("fDescription").value=d.description||""}
async function loadLocal(){fill(localGet());renderChapters(localGet().chapters||[])}
async function loadCloud(){
 const {data,error}=await supa.from("manga").select("*").limit(1).maybeSingle();if(error){alert("تحقق من إعداد قاعدة البيانات في supabase.sql");return}
 remoteManga=data||null;const chapters=await getCloudChapters();fill({...DEFAULT,...(data||{}),chapters});renderChapters(chapters)
}
async function getCloudChapters(){const {data,error}=await supa.from("chapters").select("id,number,title,published_at").order("number",{ascending:false});if(error)return[];return data||[]}
let statusTimer;
function status(t,keep){const m=el("chapterMsg");m.textContent=t;m.style.display="block";clearTimeout(statusTimer);if(!keep)statusTimer=setTimeout(()=>m.style.display="none",5000)}
el("saveInfo").onclick=async()=>{
 const d={title:el("fTitle").value,english:el("fEnglish").value,japanese:el("fJapanese").value,status:el("fStatus").value,author:el("fAuthor").value,artist:el("fArtist").value,genres:el("fGenres").value.split(",").map(x=>x.trim()).filter(Boolean),description:el("fDescription").value};
 if(window.taxState)Object.assign(d,window.taxState.extra());
 if(!CLOUD){const old=localGet();localSave({...old,...d});el("saveState").textContent="● محفوظ";return}
 const coverFile=el("coverFile").files[0];
 if(coverFile){
   const path=`site/cover-${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
   const up=await supa.storage.from(cfg.STORAGE_BUCKET).upload(path,coverFile,{upsert:true,contentType:coverFile.type});
   if(up.error){alert(up.error.message);return}
   d.cover_url=supa.storage.from(cfg.STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
 }
 if(!remoteManga){const r=await supa.from("manga").insert({...d}).select().single();if(r.error){alert(r.error.message);return}remoteManga=r.data}else{const r=await supa.from("manga").update(d).eq("id",remoteManga.id);if(r.error){alert(r.error.message);return}}
 alert("تم حفظ المعلومات.")
};

/* ===== ترتيب الصفحات قبل الرفع ===== */
let ordered=[];
const thumbs=new Map();
const thumb=f=>{if(!thumbs.has(f))thumbs.set(f,URL.createObjectURL(f));return thumbs.get(f)};
const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:"base"});
const orderBox=document.createElement("div");
orderBox.id="pageOrder";
orderBox.style.marginTop="12px";
el("pageFiles").insertAdjacentElement("afterend",orderBox);

function renderOrder(){
 if(!ordered.length){orderBox.innerHTML="";return}
 orderBox.innerHTML=
  `<p class="hint">ترتيب الصفحات (${ordered.length}) — الأولى بالأعلى. راجعها قبل الرفع:</p>`+
  `<div class="row-actions" style="margin-bottom:10px"><button type="button" class="mini-btn" data-act="name">حسب الاسم</button><button type="button" class="mini-btn" data-act="date">حسب وقت الملف</button><button type="button" class="mini-btn" data-act="rev">عكس الترتيب</button></div>`+
  ordered.map((f,i)=>`<div class="chapter-row"><div style="display:flex;align-items:center;gap:10px"><img src="${thumb(f)}" alt="" loading="lazy" style="width:44px;height:62px;object-fit:cover;border-radius:6px"><div><strong>صفحة ${i+1}</strong><br><small>${esc(f.name)}</small></div></div><div class="row-actions"><button type="button" class="mini-btn" data-up="${i}">↑</button><button type="button" class="mini-btn" data-down="${i}">↓</button></div></div>`).join("");
}
orderBox.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.act==="name")ordered.sort(byName);
 else if(b.dataset.act==="date")ordered.sort((a,b)=>a.lastModified-b.lastModified||byName(a,b));
 else if(b.dataset.act==="rev")ordered.reverse();
 else if(b.dataset.up!==undefined){const i=+b.dataset.up;if(i>0)[ordered[i-1],ordered[i]]=[ordered[i],ordered[i-1]]}
 else if(b.dataset.down!==undefined){const i=+b.dataset.down;if(i<ordered.length-1)[ordered[i+1],ordered[i]]=[ordered[i],ordered[i+1]]}
 else return;
 renderOrder();
});
function resetOrder(){thumbs.forEach(u=>URL.revokeObjectURL(u));thumbs.clear();ordered=[];renderOrder();el("pageFiles").value=""}
el("pageFiles").addEventListener("change",()=>{ordered=[...el("pageFiles").files].sort(byName);renderOrder()});

let busy=false;
const extOf=f=>({"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif","image/avif":".avif"}[f.type]||(f.name.match(/\.[a-zA-Z0-9]+$/)||[".jpg"])[0].toLowerCase());

el("addChapter").onclick=async()=>{
 if(busy)return;
 const number=Number(el("chapterNumber").value), title=el("chapterTitle").value.trim()||`الفصل ${number}`,date=el("chapterDate").value,files=[...ordered];
 if(!number||!files.length){status("أدخل رقم الفصل واختر صور الصفحات.");return}

 if(!CLOUD){
   const id=crypto.randomUUID(),db=await openDB(),pages=[];
   for(let i=0;i<files.length;i++){const key=`${id}-${i+1}`;await put(db,key,files[i]);pages.push({key,name:files[i].name})}
   const d=localGet();d.chapters=d.chapters||[];d.chapters.push({id,number,title,date,pages});d.chapters.sort((a,b)=>Number(b.number)-Number(a.number));localSave(d);renderChapters(d.chapters);status(`تمت إضافة ${title} (${files.length} صفحة).`);resetOrder();return;
 }
 if(!remoteManga){status("احفظ معلومات المانجا أولاً.");return}

 busy=true;el("addChapter").disabled=true;
 const uploaded=[];let chapter=null;
 try{
   /* 1) إنشاء الفصل */
   const ins=await supa.from("chapters").insert({manga_id:remoteManga.id,number,title,published_at:date||null}).select().single();
   if(ins.error){throw new Error(ins.error.code==="23505"?"يوجد فصل بنفس الرقم. احذفه أولاً أو غيّر الرقم.":ins.error.message)}
   chapter=ins.data;

   /* 2) رفع الصور بالترتيب المحدد: صفحة 1 = أول عنصر بالقائمة */
   const rows=[];
   for(let i=0;i<files.length;i++){
     status(`جارٍ رفع الصفحة ${i+1} من ${files.length}...`,true);
     const path=`${remoteManga.id}/${chapter.id}/${String(i+1).padStart(4,"0")}${extOf(files[i])}`;
     const up=await supa.storage.from(cfg.STORAGE_BUCKET).upload(path,files[i],{upsert:true,contentType:files[i].type||"image/jpeg"});
     if(up.error)throw new Error(`فشل رفع الصفحة ${i+1}: ${up.error.message}`);
     uploaded.push(path);
     rows.push({chapter_id:chapter.id,page_number:i+1,storage_path:path});
   }

   /* 3) حفظ كل الصفحات دفعة واحدة */
   status("جارٍ حفظ الصفحات...",true);
   const pg=await supa.from("pages").insert(rows);
   if(pg.error)throw new Error(pg.error.message);

   /* 4) تحقق نهائي: نقرأ الصفحات من القاعدة ونقارنها بالمتوقع */
   const chk=await supa.from("pages").select("page_number,storage_path").eq("chapter_id",chapter.id).order("page_number",{ascending:true});
   if(chk.error)throw new Error(chk.error.message);
   const ok=chk.data.length===rows.length&&chk.data.every((r,i)=>r.page_number===i+1&&r.storage_path===rows[i].storage_path);
   if(!ok)throw new Error("فشل التحقق: ترتيب الصفحات المحفوظ لا يطابق المطلوب.");

   status(`✔ تم نشر ${title} (${files.length} صفحة) وتم التحقق من الترتيب.`);
   resetOrder();await loadCloud();
 }catch(err){
   /* تراجع كامل: لا يبقى فصل ناقص أو مخلوط */
   try{if(uploaded.length)await supa.storage.from(cfg.STORAGE_BUCKET).remove(uploaded)}catch{}
   try{if(chapter){await supa.from("pages").delete().eq("chapter_id",chapter.id);await supa.from("chapters").delete().eq("id",chapter.id)}}catch{}
   status("لم يتم النشر: "+err.message);
 }finally{
   busy=false;el("addChapter").disabled=false;
 }
};
async function renderChapters(chapters){
 const box=el("chaptersAdmin");el("chapterSummary").textContent=`${chapters.length} فصل`;
 if(!chapters.length){box.innerHTML='<p class="hint">لا توجد فصول منشورة.</p>';return}
 box.innerHTML=chapters.map(c=>`<div class="chapter-row"><div><strong>${esc(c.title||"الفصل "+c.number)}</strong><br><small>الفصل ${esc(c.number)} • ${esc(c.date||c.published_at||"")}</small></div><div class="row-actions"><a class="mini-btn" href="reader.html?chapter=${c.id}">معاينة</a><button class="mini-btn danger" data-id="${c.id}">حذف</button></div></div>`).join("");
 box.querySelectorAll("button").forEach(b=>b.onclick=async()=>{if(!confirm("حذف الفصل وصفحاته؟"))return;await deleteChapter(b.dataset.id)})
}
async function deleteChapter(id){
 if(!CLOUD){
   const d=localGet(),c=d.chapters.find(x=>x.id===id),db=await openDB();for(const p of c?.pages||[])await del(db,p.key);d.chapters=d.chapters.filter(x=>x.id!==id);localSave(d);renderChapters(d.chapters);return;
 }
 const pr=await supa.from("pages").select("storage_path").eq("chapter_id",id);
 const paths=(pr.data||[]).map(p=>p.storage_path).filter(p=>p&&!/^https?:/.test(p));
 if(paths.length){try{await supa.storage.from(cfg.STORAGE_BUCKET).remove(paths)}catch{}}
 await supa.from("pages").delete().eq("chapter_id",id);await supa.from("chapters").delete().eq("id",id);await loadCloud()
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open("mangaCMS",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("pages"))r.result.createObjectStore("pages")};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function put(db,key,val){return new Promise((res,rej)=>{const r=db.transaction("pages","readwrite").objectStore("pages").put(val,key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function del(db,key){return new Promise((res,rej)=>{const r=db.transaction("pages","readwrite").objectStore("pages").delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
el("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(localGet(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="manga-backup.json";a.click();URL.revokeObjectURL(a.href)}
el("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{localSave(JSON.parse(r.result));loadLocal()}catch{alert("ملف JSON غير صالح.")}};r.readAsText(f)}
el("resetBtn").onclick=()=>{if(confirm("إعادة ضبط البيانات المحلية؟")){localStorage.removeItem("mangaData");location.reload()}}
el("loginBtn").onclick=async()=>{const {error}=await supa.auth.signInWithPassword({email:el("loginEmail").value,password:el("loginPassword").value});if(error)el("loginMsg").textContent=error.message;else{el("loginCard").hidden=true;el("dashboard").hidden=false;await loadCloud()}}
el("logoutBtn").onclick=async()=>{if(CLOUD)await supa.auth.signOut();location.reload()}

/* ===== التصنيفات المتقدمة (تُحمَّل من js/taxonomy.js) ===== */
window.taxState=null;
(function(){
 const sc=document.createElement("script");sc.src="js/taxonomy.js";
 sc.onload=()=>{
  const st={genres:new Set(),tags:new Set(),type:"",demographic:""};
  const panel=document.createElement("div");panel.style.margin="14px 0";
  el("saveInfo").insertAdjacentElement("beforebegin",panel);
  const groups=[["genres","التصنيفات",TAX.genres,true],["type","نوع العمل",TAX.types],["demographic","الديموغرافية",TAX.demographics],["status","حالة العمل",TAX.status],["tags","الوسوم",TAX.tags,true]];
  panel.innerHTML=groups.map(([k,t,items])=>`<details style="margin-bottom:8px"><summary style="cursor:pointer;font-weight:800;padding:8px 0">${t}</summary><div>${items.map(i=>`<button type="button" class="mini-btn" data-k="${k}" data-v="${esc(i.v)}" style="margin:3px">${esc(i.ar)}</button>`).join("")}</div></details>`).join("");
  const isOn=(k,v)=>k==="status"?el("fStatus").value.includes(v):(k==="genres"||k==="tags")?st[k].has(v):st[k]===v;
  function refresh(){panel.querySelectorAll("button").forEach(b=>{const on=isOn(b.dataset.k,b.dataset.v);b.style.background=on?"#13abd2":"";b.style.color=on?"#041015":""})}
  panel.addEventListener("click",e=>{
   const b=e.target.closest("button");if(!b)return;
   const k=b.dataset.k,v=b.dataset.v;
   if(k==="status")el("fStatus").value=v;
   else if(k==="genres"||k==="tags"){st[k].has(v)?st[k].delete(v):st[k].add(v);if(k==="genres")el("fGenres").value=[...st.genres].join(", ")}
   else st[k]=st[k]===v?"":v;
   refresh();
  });
  window.taxState={
   extra:()=>({type:st.type||null,tags:[...st.tags],demographic:st.demographic||null}),
   set:d=>{st.genres=new Set(d.genres||[]);st.tags=new Set(d.tags||[]);st.type=d.type||"";st.demographic=d.demographic||"";refresh()}
  };
  if(window.__lastManga)window.taxState.set(window.__lastManga);
 };
 document.head.appendChild(sc);
})();

setup();
