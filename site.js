// ---- colors and fonts from data/theme.json (set on the admin page)
const FONTS={display:{'Bricolage Grotesque':'wght@500;800','Poppins':'wght@500;800','Nunito':'wght@500;800','Space Grotesk':'wght@500;700','Baloo 2':'wght@500;800','Fredoka':'wght@500;700','Lilita One':'wght@400','Syne':'wght@500;800','DM Serif Display':'wght@400'},
 body:{'DM Sans':'wght@400;500;700','Nunito':'wght@400;700','Poppins':'wght@400;500;700','Inter':'wght@400;500;700','Lora':'wght@400;500;700'},
 serif:{'Instrument Serif':'ital@1','Playfair Display':'ital,wght@1,400','DM Serif Display':'ital@1','Fraunces':'ital,wght@1,400','Lora':'ital,wght@1,400','Caveat':'wght@400'}};
function applyTheme(t){if(!t)return;const r=document.documentElement.style,fam=[];
 Object.entries(t.colors||{}).forEach(([k,v])=>v&&r.setProperty('--'+k,v));
 [['display','--display'],['body','--body'],['serif','--serif']].forEach(([k,v])=>{const n=(t.fonts||{})[k];if(n&&FONTS[k][n]){r.setProperty(v,'"'+n+'",'+(k==='serif'?'Georgia,serif':'Arial,sans-serif'));if(!['Bricolage Grotesque','DM Sans','Instrument Serif'].includes(n))fam.push('family='+n.replace(/ /g,'+')+':'+FONTS[k][n])}});
 if(fam.length){const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?'+fam.join('&')+'&display=swap';document.head.append(l)}}
try{applyTheme(JSON.parse(localStorage.theme||'null'))}catch(e){}
fetch('data/theme.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(t=>{if(t&&JSON.stringify(t)!==localStorage.theme){localStorage.theme=JSON.stringify(t);applyTheme(t)}}).catch(()=>{});

// star marker on the scroll trail
const dot=document.getElementById('dot'),trail=document.getElementById('trail');
function move(){const m=document.documentElement.scrollHeight-innerHeight;dot.style.top=((m>0?scrollY/m:0)*(trail.clientHeight-22))+'px'}
addEventListener('scroll',move,{passive:true});addEventListener('resize',move);move();
// the trail IS the scrollbar: click it or drag the star to scroll
if(dot&&trail){const go=y=>{const r=trail.getBoundingClientRect(),p=Math.min(1,Math.max(0,(y-r.top-11)/(r.height-22)));scrollTo({top:p*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'})};
 let drag=false;
 trail.addEventListener('pointerdown',e=>{drag=true;trail.setPointerCapture(e.pointerId);go(e.clientY);e.preventDefault()});
 trail.addEventListener('pointermove',e=>{if(drag)go(e.clientY)});
 const up=()=>{drag=false};trail.addEventListener('pointerup',up);trail.addEventListener('pointercancel',up)}

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
 if(site.logo){const a=document.querySelector('.logo'),[x,y]=site.logo.split('✦');if(a){a.textContent=x;if(y!==undefined){const s=document.createElement('span');s.textContent='✦';a.append(s,y)}}}
 const nv=site.nav||{},links=document.querySelectorAll('header nav a');['home','illustration','game','commissions','about'].forEach((k,i)=>{if(links[i]&&nv[k])links[i].textContent=nv[k]});
 document.querySelectorAll('footer').forEach(f=>{const a=document.createElement('a');a.href='#edit';a.onclick=ev=>{ev.preventDefault();openEditor(true)};a.className='admin-link';a.textContent='✎ Edit site';f.append(a)});
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
 renderSocials(site.social);
 // commission form -> Supabase inbox (falls back to opening your email app if the inbox isn't set up yet)
 document.querySelectorAll('form[data-commission]').forEach(f=>{const msg=f.querySelector('.fmsg');
  f.addEventListener('submit',async e=>{e.preventDefault();msg.className='fmsg';const v=Object.fromEntries(new FormData(f));if(v.website)return;
   const bad=t=>{msg.textContent=t;msg.classList.add('bad')};
   if(!v.name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())||!v.message.trim())return bad('Please add your name, a valid email, and what you would like drawn.');
   const url=site.supabaseUrl,key=site.supabaseKey;
   if(!url||!key){location.href='mailto:'+(site.email||'')+'?subject=Commission%20inquiry&body='+encodeURIComponent(v.message+'\n\n'+v.name+' ('+v.email+')');return}
   msg.textContent='Sending…';
   try{const hd={apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'};if(key.startsWith('eyJ'))hd.Authorization='Bearer '+key;
    const r=await fetch(url.replace(/\/$/,'')+'/rest/v1/commissions',{method:'POST',headers:hd,body:JSON.stringify({name:v.name.trim(),email:v.email.trim(),message:v.message.trim(),budget:(v.budget||'').trim()||null})});
    if(!r.ok)throw new Error();f.reset();msg.textContent='Thank you! Your request was sent. I will reply by email.'}
   catch(err){bad('Sorry, that did not send. Please try again, or email me directly.')}})});
if(sessionStorage.edit==='1'&&(sessionStorage.gh||localStorage.gh))openEditor(false);
})();

// loads editor.js on demand (only when you click "Edit site")
function openEditor(toggle){const go=()=>toggle?window.SiteEditor.toggle():window.SiteEditor.start();
  if(window.SiteEditor)return go();const s=document.createElement('script');s.src='editor.js';s.onload=go;document.head.append(s)}

// social links in every footer (set them in the editor: Menu & site)
function renderSocials(s){document.querySelectorAll('footer .socials').forEach(n=>n.remove());s=s||{};
  const url=(v,base)=>/^https?:\/\//i.test(v)?v:base+v.replace(/^@/,'');
  const ICONS={instagram:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.2\" cy=\"6.8\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/></svg>",twitter:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 4h3.8l12.2 16h-3.8z\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M19.6 4L4.4 20\"/></svg>",tiktok:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14 3v11.2a3.8 3.8 0 1 1-3.8-3.8\"/><path d=\"M14 3c.3 2.6 2.1 4.3 5 4.5\"/></svg>"};
  const defs=[['instagram','Instagram','https://instagram.com/'],['twitter','X (Twitter)','https://x.com/'],['tiktok','TikTok','https://tiktok.com/@']].filter(([k])=>s[k]&&s[k].trim());
  if(!defs.length)return;
  document.querySelectorAll('footer').forEach(ft=>{const d=document.createElement('div');d.className='socials';
    defs.forEach(([k,l,b])=>{const a=document.createElement('a');a.href=url(s[k].trim(),b);a.innerHTML=ICONS[k];a.setAttribute('aria-label',l+' (opens in a new tab)');a.title=l;a.target='_blank';a.rel='noopener noreferrer';d.append(a)});ft.prepend(d)})}
