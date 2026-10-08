// star marker on the scroll trail
const dot=document.getElementById('dot'),trail=document.getElementById('trail');
function move(){const m=document.documentElement.scrollHeight-innerHeight;dot.style.top=((m>0?scrollY/m:0)*(trail.clientHeight-22))+'px'}
addEventListener('scroll',move,{passive:true});addEventListener('resize',move);move();

// ---- fill the page from data/*.json (edited in Pages CMS). Defaults stay in the HTML if a file is missing.
const get=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const load=async n=>{try{return await (await fetch('data/'+n+'.json',{cache:'no-cache'})).json()}catch(e){return {}}};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const src=u=>u.replace(/^\//,'');

const lb=(()=>{let el,track,cap,slides=[],cur=0,opener;
 function build(){el=document.createElement('div');el.className='lb';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Image viewer');
  el.innerHTML='<button class="lb-x" aria-label="Close">✕</button><button class="lb-p" aria-label="Previous image">‹</button><button class="lb-n" aria-label="Next image">›</button><div class="lb-track" tabindex="0" aria-label="Images, swipe or scroll sideways"></div><p class="lb-cap" aria-live="polite"></p>';
  document.body.append(el);track=el.querySelector('.lb-track');cap=el.querySelector('.lb-cap');
  el.querySelector('.lb-x').onclick=close;el.querySelector('.lb-p').onclick=()=>step(-1);el.querySelector('.lb-n').onclick=()=>step(1);
  el.addEventListener('click',e=>{if(e.target===el||e.target.classList.contains('lb-slide'))close()});
  let t;track.addEventListener('scroll',()=>{clearTimeout(t);t=setTimeout(sync,60)});
  addEventListener('keydown',e=>{if(el.hidden)return;
   if(e.key==='Escape')close();else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1);
   else if(e.key==='Tab'){const f=[...el.querySelectorAll('button,.lb-track')],a=document.activeElement;
    if(e.shiftKey&&a===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus()}}});}
 function step(d){track.scrollBy({left:d*track.clientWidth,behavior:reduce?'auto':'smooth'})}
 function sync(){cur=Math.max(0,Math.min(slides.length-1,Math.round(track.scrollLeft/track.clientWidth)));cap.textContent=slides[cur].cap+(slides.length>1?'  ('+(cur+1)+' of '+slides.length+')':'')}
 function open(list,i,from){if(!el)build();slides=list;opener=from;track.replaceChildren();
  list.forEach((s,k)=>{const d=document.createElement('div');d.className='lb-slide';const im=document.createElement('img');im.src=s.src;im.alt=s.alt;if(Math.abs(k-i)>1)im.loading='lazy';d.append(im);track.append(d)});
  el.hidden=false;document.body.style.overflow='hidden';track.scrollTo({left:i*track.clientWidth,behavior:'auto'});sync();el.querySelector('.lb-x').focus()}
 function close(){el.hidden=true;document.body.style.overflow='';if(opener)opener.focus()}
 return {open}})();

(async()=>{
 const page=document.body.dataset.page;
 const [site,data,home]=await Promise.all([load('site'),load(page),page==='home'?{}:load('home')]);
 const d={...data,site}; if(!d.cta&&home.cta) d.cta=home.cta;
 document.querySelectorAll('[data-text]').forEach(e=>{const v=get(d,e.dataset.text);if(typeof v==='string'&&v)e.textContent=v});
 document.querySelectorAll('[data-list]').forEach(e=>{const v=get(d,e.dataset.list);if(Array.isArray(v)&&v.length){e.replaceChildren(...v.map(t=>{const i=document.createElement(e.dataset.item||'li');i.textContent=t;return i}))}});
 document.querySelectorAll('[data-mailto]').forEach(e=>{const v=get(d,e.dataset.mailto);if(v)e.href='mailto:'+v+'?subject=Commission%20inquiry'});
 document.querySelectorAll('[data-img]').forEach(e=>{const v=get(d,e.dataset.img);if(typeof v==='string'&&v){const im=document.createElement('img');im.src=src(v);im.alt='';im.loading='lazy';const old=e.querySelector('svg,img');old?old.replaceWith(im):e.prepend(im);e.classList.add('has-img')}});
 const box=document.querySelector('[data-gallery]');
 if(box){const items=d.items||[],slides=[];
  items.forEach((it,i)=>{
   const imgs=[it.image,...(it.more||[])].filter(Boolean),first=slides.length,title=it.title||'';
   imgs.forEach(u=>slides.push({src:src(u),alt:title,cap:title+(it.subtitle?' · '+it.subtitle:'')}));
   const tile=document.createElement('div');tile.className='tile t'+(i%6+1);
   if(imgs.length){const b=document.createElement('button');b.className='open';b.type='button';b.setAttribute('aria-label','View larger: '+title);
    const im=document.createElement('img');im.src=src(imgs[0]);im.alt=title;im.loading='lazy';b.append(im);
    if(imgs.length>1){const m=document.createElement('span');m.className='more';m.textContent='+'+(imgs.length-1);b.append(m)}
    b.onclick=()=>lb.open(slides,first,b);tile.append(b)}
   else{const ph=document.createElement('div');ph.className='ph';ph.textContent='your art here';tile.append(ph)}
   const c=document.createElement('div');c.className='cap';c.textContent=title;
   if(it.subtitle){const s=document.createElement('small');s.textContent=it.subtitle;c.append(s)}
   tile.append(c);box.append(tile)});
 }
})();
