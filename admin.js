const cfg=window.SITE_CONFIG||{};
const CLOUD=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);
const DEFAULT={title:"\u0628\u0648\u0631\u0648\u062a\u0648: \u062f\u0648\u0627\u0645\u062a\u0627\u0646 \u0632\u0631\u0642\u0627\u0648\u062a\u0627\u0646",english:"BORUTO -TWO BLUE VORTEX-",japanese:"BORUTO -TWO BLUE VORTEX-",status:"\u0645\u0633\u062a\u0645\u0631\u0629 (\u0645\u0627\u0646\u062c\u0627 \u0634\u0647\u0631\u064a\u0629)",author:"Masashi Kishimoto",artist:"Mikio Ikemoto",genres:["\u0623\u0643\u0634\u0646","\u0645\u063a\u0627\u0645\u0631\u0627\u062a","\u0634\u0648\u0646\u064a\u0646","\u0642\u0648\u0629 \u062e\u0627\u0631\u0642\u0629","\u062f\u0631\u0627\u0645\u0627","\u062e\u064a\u0627\u0644 \u0639\u0644\u0645\u064a"],description:"\u0628\u0639\u062f \u0623\u0646 \u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0630\u0643\u0631\u064a\u0627\u062a \u0627\u0644\u062c\u0645\u064a\u0639\u060c \u064a\u062c\u062f \u0628\u0648\u0631\u0648\u062a\u0648 \u0646\u0641\u0633\u0647 \u0645\u0637\u0627\u0631\u062f\u0627\u064b \u0645\u0646 \u0642\u0631\u064a\u062a\u0647. \u0648\u0628\u0639\u062f \u0647\u0631\u0648\u0628\u0647 \u0645\u0639 \u0633\u0627\u0633\u0643\u064a\u060c \u0645\u0627 \u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644 \u0627\u0644\u0630\u064a \u064a\u0646\u062a\u0638\u0631 \u0628\u0648\u0631\u0648\u062a\u0648...\u061f",cover:"assets/cover.png",chapters:[]};
const localGet=()=>{try{return {...DEFAULT,...JSON.parse(localStorage.getItem("mangaData")||"{}")}}catch{return DEFAULT}};
const localSave=d=>localStorage.setItem("mangaData",JSON.stringify(d));
const el=id=>document.getElementById(id);
let supa=null, remoteManga=null;
el("modeLabel").textContent=CLOUD?"\u0648\u0636\u0639 \u0633\u062d\u0627\u0628\u064a":"\u0648\u0636\u0639 \u0645\u062d\u0644\u064a";
el("localModeBtn").onclick=()=>{el("loginCard").hidden=true;el("dashboard").hidden=false;loadLocal()};
async function setup(){
 if(CLOUD){
   const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=async()=>{supa=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);el("loginCard").hidden=false;const {data}=await supa.auth.getSession();if(data.session){el("loginCard").hidden=true;el("dashboard").hidden=false;await loadCloud()}else{el("dashboard").hidden=true}};document.head.appendChild(s);
 }else{el("loginCard").hidden=true;el("dashboard").hidden=false;loadLocal()}
}
function fill(d){window.__lastManga=d;if(window.taxState)window.taxState.set(d);el("fTitle").value=d.title||"";el("fEnglish").value=d.english||"";el("fJapanese").value=d.japanese||"";el("fStatus").value=d.status||"";el("fAuthor").value=d.author||"";el("fArtist").value=d.artist||"";el("fGenres").value=(d.genres||[]).join(", ");el("fDescription").value=d.description||""}
async function loadLocal(){fill(localGet());renderChapters(localGet().chapters||[])}
const BLANK={title:"",english:"",japanese:"",status:"\u0645\u0633\u062a\u0645\u0631\u0629",author:"",artist:"",genres:[],description:"",tags:[],type:"",demographic:"",chapters:[]};
let allManga=[], selectedId=null, creatingNew=false;

const picker=document.createElement("div");
picker.className="card";
picker.style.cssText="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center";
picker.innerHTML='<strong>\u0627\u0644\u0639\u0645\u0644:</strong><select id="mangaSelect" style="flex:1;min-width:180px"></select><button type="button" class="mini-btn" id="newMangaBtn">+ \u0645\u0627\u0646\u062c\u0627 \u062c\u062f\u064a\u062f\u0629</button><button type="button" class="mini-btn danger" id="delMangaBtn">\u062d\u0630\u0641 \u0627\u0644\u0639\u0645\u0644</button><p class="hint" id="newMangaHint" style="flex-basis:100%;margin:0" hidden>\u0623\u0646\u062a \u062a\u0636\u064a\u0641 \u0645\u0627\u0646\u062c\u0627 \u062c\u062f\u064a\u062f\u0629: \u0627\u0645\u0644\u0623 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0648\u0627\u062e\u062a\u0631 \u0627\u0644\u063a\u0644\u0627\u0641 \u062b\u0645 \u0627\u0636\u063a\u0637 \u062d\u0641\u0638\u060c \u0648\u0628\u0639\u062f\u0647\u0627 \u0623\u0636\u0641 \u0627\u0644\u0641\u0635\u0648\u0644.</p>';
el("dashboard").insertAdjacentElement("afterbegin",picker);

function drawPicker(){
 const sel=el("mangaSelect");
 sel.innerHTML=(creatingNew?'<option value="">\u2014 \u0645\u0627\u0646\u062c\u0627 \u062c\u062f\u064a\u062f\u0629 \u2014</option>':"")+allManga.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join("");
 if(!creatingNew&&selectedId)sel.value=selectedId;
 el("newMangaHint").hidden=!creatingNew;
 el("delMangaBtn").hidden=creatingNew||!allManga.length;
}
el("mangaSelect").onchange=e=>{if(!e.target.value)return;creatingNew=false;selectedId=e.target.value;loadCloud()};
el("newMangaBtn").onclick=()=>{creatingNew=true;loadCloud()};
el("delMangaBtn").onclick=async()=>{
 if(!remoteManga||!confirm(`\u062d\u0630\u0641 \u00ab${remoteManga.title}\u00bb \u0645\u0639 \u0643\u0644 \u0641\u0635\u0648\u0644\u0647 \u0648\u0635\u0641\u062d\u0627\u062a\u0647\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.`))return;
 const ch=await supa.from("chapters").select("id").eq("manga_id",remoteManga.id);
 const ids=(ch.data||[]).map(c=>c.id);
 if(ids.length){
  const pg=await supa.from("pages").select("storage_path").in("chapter_id",ids);
  const paths=(pg.data||[]).map(p=>p.storage_path).filter(p=>p&&!/^https?:/.test(p));
  if(paths.length){try{await supa.storage.from(cfg.STORAGE_BUCKET).remove(paths)}catch{}}
 }
 const r=await supa.from("manga").delete().eq("id",remoteManga.id);
 if(r.error){alert(r.error.message);return}
 selectedId=null;await loadCloud();
};

async function loadCloud(){
 const {data,error}=await supa.from("manga").select("*").order("created_at",{ascending:true});
 if(error){alert("\u062a\u062d\u0642\u0642 \u0645\u0646 \u0625\u0639\u062f\u0627\u062f \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0641\u064a supabase.sql");return}
 allManga=data||[];
 if(creatingNew){remoteManga=null}
 else{remoteManga=allManga.find(m=>m.id===selectedId)||allManga[0]||null;selectedId=remoteManga?remoteManga.id:null}
 drawPicker();
 const chapters=remoteManga?await getCloudChapters(remoteManga.id):[];
 fill(remoteManga?{...DEFAULT,...remoteManga,chapters}:{...BLANK});
 renderChapters(chapters)
}
async function getCloudChapters(mangaId){const {data,error}=await supa.from("chapters").select("id,number,title,published_at").eq("manga_id",mangaId).order("number",{ascending:false});if(error)return[];return data||[]}
let statusTimer;
function status(t,keep){const m=el("chapterMsg");m.textContent=t;m.style.display="block";clearTimeout(statusTimer);if(!keep)statusTimer=setTimeout(()=>m.style.display="none",5000)}
el("saveInfo").onclick=async()=>{
 const d={title:el("fTitle").value,english:el("fEnglish").value,japanese:el("fJapanese").value,status:el("fStatus").value,author:el("fAuthor").value,artist:el("fArtist").value,genres:el("fGenres").value.split(",").map(x=>x.trim()).filter(Boolean),description:el("fDescription").value};
 if(window.taxState)Object.assign(d,window.taxState.extra());
 if(!CLOUD){const old=localGet();localSave({...old,...d});el("saveState").textContent="\u25cf \u0645\u062d\u0641\u0648\u0638";return}
 const coverFile=el("coverFile").files[0];
 if(coverFile){
   const path=`site/cover-${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
   const up=await supa.storage.from(cfg.STORAGE_BUCKET).upload(path,coverFile,{upsert:true,contentType:coverFile.type});
   if(up.error){alert(up.error.message);return}
   d.cover_url=supa.storage.from(cfg.STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
 }
 if(!remoteManga){const r=await supa.from("manga").insert({...d}).select().single();if(r.error){alert(r.error.message);return}remoteManga=r.data;creatingNew=false;selectedId=r.data.id}else{const r=await supa.from("manga").update(d).eq("id",remoteManga.id);if(r.error){alert(r.error.message);return}}
 await loadCloud();
 alert("\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a.")
};

/* ===== \u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0642\u0628\u0644 \u0627\u0644\u0631\u0641\u0639 ===== */
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
  `<p class="hint">\u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0635\u0641\u062d\u0627\u062a (${ordered.length}) \u2014 \u0627\u0644\u0623\u0648\u0644\u0649 \u0628\u0627\u0644\u0623\u0639\u0644\u0649. \u0631\u0627\u062c\u0639\u0647\u0627 \u0642\u0628\u0644 \u0627\u0644\u0631\u0641\u0639:</p>`+
  `<div class="row-actions" style="margin-bottom:10px"><button type="button" class="mini-btn" data-act="name">\u062d\u0633\u0628 \u0627\u0644\u0627\u0633\u0645</button><button type="button" class="mini-btn" data-act="date">\u062d\u0633\u0628 \u0648\u0642\u062a \u0627\u0644\u0645\u0644\u0641</button><button type="button" class="mini-btn" data-act="rev">\u0639\u0643\u0633 \u0627\u0644\u062a\u0631\u062a\u064a\u0628</button></div>`+
  ordered.map((f,i)=>`<div class="chapter-row"><div style="display:flex;align-items:center;gap:10px"><img src="${thumb(f)}" alt="" loading="lazy" style="width:44px;height:62px;object-fit:cover;border-radius:6px"><div><strong>\u0635\u0641\u062d\u0629 ${i+1}</strong><br><small>${esc(f.name)}</small></div></div><div class="row-actions"><button type="button" class="mini-btn" data-up="${i}">\u2191</button><button type="button" class="mini-btn" data-down="${i}">\u2193</button></div></div>`).join("");
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
 const number=Number(el("chapterNumber").value), title=el("chapterTitle").value.trim()||`\u0627\u0644\u0641\u0635\u0644 ${number}`,date=el("chapterDate").value,files=[...ordered];
 if(!number||!files.length){status("\u0623\u062f\u062e\u0644 \u0631\u0642\u0645 \u0627\u0644\u0641\u0635\u0644 \u0648\u0627\u062e\u062a\u0631 \u0635\u0648\u0631 \u0627\u0644\u0635\u0641\u062d\u0627\u062a.");return}

 if(!CLOUD){
   const id=crypto.randomUUID(),db=await openDB(),pages=[];
   for(let i=0;i<files.length;i++){const key=`${id}-${i+1}`;await put(db,key,files[i]);pages.push({key,name:files[i].name})}
   const d=localGet();d.chapters=d.chapters||[];d.chapters.push({id,number,title,date,pages});d.chapters.sort((a,b)=>Number(b.number)-Number(a.number));localSave(d);renderChapters(d.chapters);status(`\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 ${title} (${files.length} \u0635\u0641\u062d\u0629).`);resetOrder();return;
 }
 if(!remoteManga){status("\u0627\u062d\u0641\u0638 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0627\u0646\u062c\u0627 \u0623\u0648\u0644\u0627\u064b.");return}

 busy=true;el("addChapter").disabled=true;
 const uploaded=[];let chapter=null;
 try{
   /* 1) \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0635\u0644 */
   const ins=await supa.from("chapters").insert({manga_id:remoteManga.id,number,title,published_at:date||null}).select().single();
   if(ins.error){throw new Error(ins.error.code==="23505"?"\u064a\u0648\u062c\u062f \u0641\u0635\u0644 \u0628\u0646\u0641\u0633 \u0627\u0644\u0631\u0642\u0645. \u0627\u062d\u0630\u0641\u0647 \u0623\u0648\u0644\u0627\u064b \u0623\u0648 \u063a\u064a\u0651\u0631 \u0627\u0644\u0631\u0642\u0645.":ins.error.message)}
   chapter=ins.data;

   /* 2) \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u0628\u0627\u0644\u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0645\u062d\u062f\u062f: \u0635\u0641\u062d\u0629 1 = \u0623\u0648\u0644 \u0639\u0646\u0635\u0631 \u0628\u0627\u0644\u0642\u0627\u0626\u0645\u0629 */
   const rows=[];
   for(let i=0;i<files.length;i++){
     status(`\u062c\u0627\u0631\u064d \u0631\u0641\u0639 \u0627\u0644\u0635\u0641\u062d\u0629 ${i+1} \u0645\u0646 ${files.length}...`,true);
     const path=`${remoteManga.id}/${chapter.id}/${String(i+1).padStart(4,"0")}${extOf(files[i])}`;
     const up=await supa.storage.from(cfg.STORAGE_BUCKET).upload(path,files[i],{upsert:true,contentType:files[i].type||"image/jpeg"});
     if(up.error)throw new Error(`\u0641\u0634\u0644 \u0631\u0641\u0639 \u0627\u0644\u0635\u0641\u062d\u0629 ${i+1}: ${up.error.message}`);
     uploaded.push(path);
     rows.push({chapter_id:chapter.id,page_number:i+1,storage_path:path});
   }

   /* 3) \u062d\u0641\u0638 \u0643\u0644 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u062f\u0641\u0639\u0629 \u0648\u0627\u062d\u062f\u0629 */
   status("\u062c\u0627\u0631\u064d \u062d\u0641\u0638 \u0627\u0644\u0635\u0641\u062d\u0627\u062a...",true);
   const pg=await supa.from("pages").insert(rows);
   if(pg.error)throw new Error(pg.error.message);

   /* 4) \u062a\u062d\u0642\u0642 \u0646\u0647\u0627\u0626\u064a: \u0646\u0642\u0631\u0623 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0645\u0646 \u0627\u0644\u0642\u0627\u0639\u062f\u0629 \u0648\u0646\u0642\u0627\u0631\u0646\u0647\u0627 \u0628\u0627\u0644\u0645\u062a\u0648\u0642\u0639 */
   const chk=await supa.from("pages").select("page_number,storage_path").eq("chapter_id",chapter.id).order("page_number",{ascending:true});
   if(chk.error)throw new Error(chk.error.message);
   const ok=chk.data.length===rows.length&&chk.data.every((r,i)=>r.page_number===i+1&&r.storage_path===rows[i].storage_path);
   if(!ok)throw new Error("\u0641\u0634\u0644 \u0627\u0644\u062a\u062d\u0642\u0642: \u062a\u0631\u062a\u064a\u0628 \u0627\u0644\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0645\u062d\u0641\u0648\u0638 \u0644\u0627 \u064a\u0637\u0627\u0628\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628.");

   status(`\u2714 \u062a\u0645 \u0646\u0634\u0631 ${title} (${files.length} \u0635\u0641\u062d\u0629) \u0648\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u062a\u0631\u062a\u064a\u0628.`);
   resetOrder();await loadCloud();
 }catch(err){
   /* \u062a\u0631\u0627\u062c\u0639 \u0643\u0627\u0645\u0644: \u0644\u0627 \u064a\u0628\u0642\u0649 \u0641\u0635\u0644 \u0646\u0627\u0642\u0635 \u0623\u0648 \u0645\u062e\u0644\u0648\u0637 */
   try{if(uploaded.length)await supa.storage.from(cfg.STORAGE_BUCKET).remove(uploaded)}catch{}
   try{if(chapter){await supa.from("pages").delete().eq("chapter_id",chapter.id);await supa.from("chapters").delete().eq("id",chapter.id)}}catch{}
   status("\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0646\u0634\u0631: "+err.message);
 }finally{
   busy=false;el("addChapter").disabled=false;
 }
};
async function renderChapters(chapters){
 const box=el("chaptersAdmin");el("chapterSummary").textContent=`${chapters.length} \u0641\u0635\u0644`;
 if(!chapters.length){box.innerHTML='<p class="hint">\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0635\u0648\u0644 \u0645\u0646\u0634\u0648\u0631\u0629.</p>';return}
 box.innerHTML=chapters.map(c=>`<div class="chapter-row"><div><strong>${esc(c.title||"\u0627\u0644\u0641\u0635\u0644 "+c.number)}</strong><br><small>\u0627\u0644\u0641\u0635\u0644 ${esc(c.number)} \u2022 ${esc(c.date||c.published_at||"")}</small></div><div class="row-actions"><a class="mini-btn" href="reader.html?chapter=${c.id}">\u0645\u0639\u0627\u064a\u0646\u0629</a><button class="mini-btn danger" data-id="${c.id}">\u062d\u0630\u0641</button></div></div>`).join("");
 box.querySelectorAll("button").forEach(b=>b.onclick=async()=>{if(!confirm("\u062d\u0630\u0641 \u0627\u0644\u0641\u0635\u0644 \u0648\u0635\u0641\u062d\u0627\u062a\u0647\u061f"))return;await deleteChapter(b.dataset.id)})
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
el("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{localSave(JSON.parse(r.result));loadLocal()}catch{alert("\u0645\u0644\u0641 JSON \u063a\u064a\u0631 \u0635\u0627\u0644\u062d.")}};r.readAsText(f)}
el("resetBtn").onclick=()=>{if(confirm("\u0625\u0639\u0627\u062f\u0629 \u0636\u0628\u0637 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062d\u0644\u064a\u0629\u061f")){localStorage.removeItem("mangaData");location.reload()}}
el("loginBtn").onclick=async()=>{const {error}=await supa.auth.signInWithPassword({email:el("loginEmail").value,password:el("loginPassword").value});if(error)el("loginMsg").textContent=error.message;else{el("loginCard").hidden=true;el("dashboard").hidden=false;await loadCloud()}}
el("logoutBtn").onclick=async()=>{if(CLOUD)await supa.auth.signOut();location.reload()}

/* ===== \u0627\u0644\u062a\u0635\u0646\u064a\u0641\u0627\u062a \u0627\u0644\u0645\u062a\u0642\u062f\u0645\u0629 (\u062a\u064f\u062d\u0645\u064e\u0651\u0644 \u0645\u0646 js/taxonomy.js) ===== */
window.taxState=null;
(function(){
 const sc=document.createElement("script");sc.src="js/taxonomy.js";
 sc.onload=()=>{
  const st={genres:new Set(),tags:new Set(),type:"",demographic:""};
  const panel=document.createElement("div");panel.style.margin="14px 0";
  el("saveInfo").insertAdjacentElement("beforebegin",panel);
  const groups=[["genres","\u0627\u0644\u062a\u0635\u0646\u064a\u0641\u0627\u062a",TAX.genres,true],["type","\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644",TAX.types],["demographic","\u0627\u0644\u062f\u064a\u0645\u0648\u063a\u0631\u0627\u0641\u064a\u0629",TAX.demographics],["status","\u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0645\u0644",TAX.status],["tags","\u0627\u0644\u0648\u0633\u0648\u0645",TAX.tags,true]];
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
