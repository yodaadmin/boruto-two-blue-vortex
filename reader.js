const DEFAULT_DATA={title:"بوروتو: دوامتان زرقاوتان",chapters:[]};
const cfg=window.SITE_CONFIG||{}, q=new URLSearchParams(location.search);
let settings={mode:localStorage.getItem("readerMode")||"vertical",fit:localStorage.getItem("readerFit")||"width",bg:localStorage.getItem("readerBg")||"dark",rtl:localStorage.getItem("readerRTL")!=="false",remember:localStorage.getItem("readerRemember")!=="false"};
function localData(){try{return {...DEFAULT_DATA,...JSON.parse(localStorage.getItem("mangaData")||"{}")}}catch{return DEFAULT_DATA}}
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open("mangaCMS",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("pages"))r.result.createObjectStore("pages")};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function getBlob(db,key){return new Promise((res,rej)=>{const r=db.transaction("pages","readonly").objectStore("pages").get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function cloudClient(){
 const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
 await new Promise((ok,fail)=>{s.onload=ok;s.onerror=fail;document.head.appendChild(s)});
 return window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY)
}
async function getCloud(){
 const sb=await cloudClient();
 const m=await sb.from("manga").select("*").limit(1).maybeSingle();if(m.error||!m.data)throw m.error||new Error("No manga");
 const chapters=await sb.from("chapters").select("id,number,title,published_at").eq("manga_id",m.data.id).order("number",{ascending:false});
 const chaptersData=chapters.data||[];
 let selected=chaptersData.find(x=>String(x.id)===String(q.get("chapter")));
 if(!selected&&q.get("latest"))selected=chaptersData[0];
 if(!selected)return {d:{...DEFAULT_DATA,...m.data,cover:m.data.cover_url},ch:null};
 const pages=await sb.from("pages").select("page_number,storage_path").eq("chapter_id",selected.id).order("page_number",{ascending:true});
 const urls=(pages.data||[]).map(p=>({url:sb.storage.from(cfg.STORAGE_BUCKET||"manga-pages").getPublicUrl(p.storage_path).data.publicUrl,name:String(p.page_number)}));
 return {d:{...DEFAULT_DATA,...m.data,chapters:chaptersData},ch:{...selected,date:selected.published_at,pages:urls,remotePages:true}}
}
async function getLocal(){
 const d=localData();let ch=(d.chapters||[]).find(x=>String(x.id)===String(q.get("chapter")));if(!ch&&q.get("latest"))ch=[...(d.chapters||[])].sort((a,b)=>Number(b.number)-Number(a.number))[0];return {d,ch}
}
(async()=>{
 let result;
 try{result=(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY)?await getCloud():await getLocal()}catch{result=await getLocal()}
 const {d,ch}=result;
 document.getElementById("mangaName").textContent=d.title||"دوامتان زرقاوتان";
 if(!ch){document.getElementById("chapterName").textContent="لا يوجد فصل";reader.innerHTML='<div class="reader-empty"><b>لا يوجد فصل منشور بعد.</b><a href="index.html#chapters">العودة إلى الفصول</a></div>';return}
 document.title=`${ch.title} — ${d.title}`;document.getElementById("chapterName").textContent=ch.title;
 renderPages(await loadPages(ch));
 function nav(){const idx=(d.chapters||[]).findIndex(x=>x.id===ch.id),prev=d.chapters?.[idx+1],next=d.chapters?.[idx-1];document.getElementById("bottomNav").innerHTML=`<a href="index.html#chapters">الفصول</a>${prev?`<a href="reader.html?chapter=${prev.id}">‹ السابق</a>`:""}${next?`<a class="next" href="reader.html?chapter=${next.id}">التالي ›</a>`:""}`}
 nav();
})().catch(()=>reader.innerHTML='<div class="reader-empty">تعذر تحميل الفصل.</div>');
async function loadPages(ch){
 if(ch.remotePages)return ch.pages||[];
 const db=await openDB(),out=[];for(const p of ch.pages||[]){const blob=await getBlob(db,p.key);if(blob)out.push({name:p.name,blob})}return out
}
function renderPages(pages){
 reader.className=`reader-canvas mode-${settings.mode} fit-${settings.fit} bg-${settings.bg} ${settings.rtl?"rtl":"ltr"}`;
 if(!pages.length){reader.innerHTML='<div class="reader-empty"><b>هذا الفصل لا يحتوي على صفحات.</b><a href="index.html#chapters">العودة إلى الفصول</a></div>';return}
 reader.innerHTML="";
 pages.forEach((p,i)=>{const img=document.createElement("img");img.className="manga-page";img.alt=`صفحة ${i+1}`;img.dataset.index=i;if(p.blob)img.src=URL.createObjectURL(p.blob);else img.src=p.url;reader.appendChild(img)});
}
document.getElementById("settingsBtn").onclick=()=>settingsPanel.hidden=!settingsPanel.hidden;
document.getElementById("closeSettings").onclick=()=>settingsPanel.hidden=true;
document.getElementById("fullscreenBtn").onclick=()=>document.documentElement.requestFullscreen?.();
document.getElementById("readerMode").value=settings.mode;document.getElementById("fitMode").value=settings.fit;document.getElementById("readerBg").value=settings.bg;document.getElementById("rtlMode").checked=settings.rtl;document.getElementById("rememberPos").checked=settings.remember;
for(const [id,key,storage] of [["readerMode","mode","readerMode"],["fitMode","fit","readerFit"],["readerBg","bg","readerBg"]])document.getElementById(id).onchange=e=>{settings[key]=e.target.value;localStorage.setItem(storage,e.target.value);location.reload()};
document.getElementById("rtlMode").onchange=e=>{settings.rtl=e.target.checked;localStorage.setItem("readerRTL",e.target.checked);location.reload()};
document.getElementById("rememberPos").onchange=e=>{settings.remember=e.target.checked;localStorage.setItem("readerRemember",e.target.checked)};
addEventListener("scroll",()=>{const id=q.get("chapter");if(id&&settings.remember)localStorage.setItem("pos_"+id,scrollY)});
addEventListener("load",()=>{const id=q.get("chapter"),pos=Number(localStorage.getItem("pos_"+id)||0);if(settings.remember&&pos>50)setTimeout(()=>scrollTo(0,pos),200)});
addEventListener("keydown",e=>{if(e.key==="Escape")settingsPanel.hidden=true;if(e.key.toLowerCase()==="f")document.documentElement.requestFullscreen?.()});