const params=new URLSearchParams(location.search),num=params.get('chapter')||'1';document.querySelector('#title').textContent='الفصل '+num;
document.querySelector('#theme').onclick=()=>document.body.classList.toggle('light');
const pages=JSON.parse(localStorage.getItem('chapter_pages_'+num)||'[]');const box=document.querySelector('#pages');
if(pages.length){box.innerHTML=pages.map(src=>`<img class="page" src="${src}" loading="lazy">`).join('')}