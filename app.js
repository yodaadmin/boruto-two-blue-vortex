const key='boruto_chapters';const defaultChapters=[{num:1,name:'بوروتو',date:'2023-08-26'}];
let chapters=JSON.parse(localStorage.getItem(key)||'null')||defaultChapters;
const box=document.querySelector('#chapters'),search=document.querySelector('#search');
function render(){let q=(search.value||'').trim().toLowerCase();box.innerHTML=chapters.filter(c=>(c.name+c.num).toLowerCase().includes(q)).sort((a,b)=>a.num-b.num).map(c=>`<article class="chapter"><div><b>الفصل ${c.num}: ${c.name}</b><br><small>${c.date}</small></div><a href="reader.html?chapter=${c.num}">قراءة الفصل ←</a></article>`).join('')||'<p style="text-align:center;color:#789">لا توجد نتائج.</p>'}
search.addEventListener('input',render);render();