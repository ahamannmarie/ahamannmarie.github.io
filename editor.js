// In-page editor. Loaded only when you click "✎ Edit site" in the footer.
// It edits the real pages and saves your changes to GitHub with your private key.
(()=>{
if(window.SiteEditor)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,y]of Object.entries(a)){x==='class'?e.className=y:x.startsWith('on')?e[x]=y:e.setAttribute(x,y)}e.append(...k);return e};
const page=document.body.dataset.page;
let token=sessionStorage.gh||localStorage.gh||'',repo=localStorage.repo||'ahamannmarie/ahamannmarie.github.io';
let docs={},on=false,status;const dirty=new Set(),prev={};
const DEFAULT_THEME={colors:{paper:'#f2f0ed',ink:'#4a3d58',pink:'#e5607f',yellow:'#f3d24c',orange:'#f28c52',blush:'#f4cfe2',plum:'#38213f',peach:'#f6d9c6',salmon:'#f9b79b'},fonts:{display:'Bricolage Grotesque',body:'DM Sans',serif:'Instrument Serif'}};

// ---------- GitHub
const api=(p,o={})=>fetch('https://api.github.com/repos/'+repo+'/contents/'+p,{cache:'no-store',...o,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}});
const dec=c=>new TextDecoder().decode(Uint8Array.from(atob(c.replace(/\n/g,'')),x=>x.charCodeAt(0)));
const enc=s=>btoa(unescape(encodeURIComponent(s)));
async function loadDoc(file){const r=await api(file+'?_='+Date.now());if(r.status===404)return{data:{},sha:null,file};const j=await r.json();if(!r.ok)throw new Error(j.message);return{data:JSON.parse(dec(j.content)),sha:j.sha,file}}
function shrink(f){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>{const s=Math.min(1,1800/Math.max(i.width,i.height)),c=el('canvas'),png=f.type==='image/png';c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);const x=c.getContext('2d');if(!png){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}x.drawImage(i,0,0,c.width,c.height);c.toBlob(b=>b?res(b):rej(new Error('could not read image')),png?'image/png':'image/jpeg',.88)};i.onerror=()=>rej(new Error('could not read that image (export HEIC photos as JPG or PNG first)'));i.src=URL.createObjectURL(f)})}
async function upload(f){const b=await shrink(f),name=Date.now()+'-'+f.name.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+(b.type==='image/png'?'.png':'.jpg');
  const content=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result.split(',')[1]);fr.readAsDataURL(b)});
  const r=await api('images/'+name,{method:'PUT',body:JSON.stringify({message:'Upload '+name,content})});if(!r.ok)throw new Error((await r.json()).message);
  const p='/images/'+name;prev[p]=URL.createObjectURL(b);return p}

// ---------- data helpers: which file does a key live in?
const getp=(d,p)=>p.reduce((a,k)=>a==null?a:a[k],d.data);
function setp(d,p,v){let o=d.data;p.slice(0,-1).forEach(k=>{if(o[k]==null||typeof o[k]!=='object')o[k]={};o=o[k]});o[p[p.length-1]]=v;touch(d)}
function touch(d){dirty.add(d);if(status){status.className='';status.textContent='Unsaved changes'}}
function loc(key){const p=key.split('.');if(p[0]==='site')return[docs.site,p.slice(1)];
  if(docs.page.data[p[0]]!==undefined||p[0]!=='cta')return[docs.page,p];return[docs.home,p]}
const imgSrc=v=>prev[v]||v.replace(/^\//,'');

// ---------- small UI pieces
const btn=(t,f,cls='b s',aria)=>el('button',{class:cls,type:'button',onclick:f,'aria-label':aria||t},t);
function editable(e,onChange){e.contentEditable='true';e.classList.add('ed');e.spellcheck=true;
  e.addEventListener('input',()=>onChange(e.textContent));
  e.addEventListener('keydown',ev=>{if(ev.key==='Enter')ev.preventDefault()});
  e.addEventListener('paste',ev=>{ev.preventDefault();document.execCommand('insertText',false,((ev.clipboardData||window.clipboardData).getData('text')||'').replace(/\s+/g,' '))})}
function pickImage(onDone){const inp=el('input',{type:'file',accept:'image/*',hidden:'',class:'ed-file'});document.body.append(inp);
  inp.onchange=async()=>{const f=inp.files[0];inp.remove();if(!f)return;status.className='';status.textContent='Uploading…';try{onDone(await upload(f));status.textContent='Image added. Click Save changes.'}catch(e){status.className='ed-err';status.textContent='Upload failed: '+e.message}};
  inp.click()}
function showImg(e,v){const im=document.createElement('img');im.src=imgSrc(v);im.alt='';const old=e.querySelector(':scope>svg,:scope>img');old?old.replaceWith(im):e.prepend(im);e.classList.add('has-img')}

// ---------- sign in
function lab(t,i){return el('label',{class:'ed-l'},t,i)}
function signIn(){return new Promise(res=>{
  const dlg=el('dialog',{class:'ed-dlg','aria-label':'Sign in to edit your site'});
  const tk=el('input',{type:'password',autocomplete:'off'}),rp=el('input',{type:'text'}),rem=el('input',{type:'checkbox'}),err=el('p',{role:'alert',class:'ed-err'});rp.value=repo;rem.checked=true;
  const done=v=>{dlg.close();dlg.remove();res(v)};
  const go=el('button',{class:'b',type:'button'},'Sign in');
  go.onclick=async()=>{err.textContent='';token=tk.value.trim();repo=rp.value.trim();
    const r=await fetch('https://api.github.com/repos/'+repo,{headers:{Authorization:'Bearer '+token}}).catch(()=>null);
    if(!r)return err.textContent='Could not reach GitHub. Check your connection.';
    if(r.status===401)return err.textContent='That key did not work. Copy it again from GitHub.';
    if(r.status===404)return err.textContent='The key cannot see that repository. Check the name and the key’s repository access.';
    const j=await r.json();if(!j.permissions||!j.permissions.push)return err.textContent='The key is read-only. It needs permission to write to Contents.';
    sessionStorage.gh=token;if(rem.checked){localStorage.gh=token;localStorage.repo=repo}done(true)};
  const cancel=el('button',{class:'b s',type:'button',onclick:()=>done(false)},'Cancel');
  dlg.addEventListener('cancel',()=>{res(false)});
  const lk=(h,t)=>el('a',{href:h,target:'_blank',rel:'noopener'},t);
  dlg.append(el('h2',{},'Edit your site'),el('p',{},'Only you can edit. You need a private key from GitHub, made once.'),
    el('p',{},el('b',{},'Quick way: '),lk('https://github.com/settings/tokens/new?scopes=repo&description=Site%20editor','make a key'),', scroll down, click Generate token, and copy it. This key can reach all your GitHub repositories, so keep it private.'),
    el('p',{},el('b',{},'Safer way: '),lk('https://github.com/settings/personal-access-tokens/new','make a key for just this site'),'. Choose "Only select repositories", pick your site, then Add permissions, search Contents, and set it to Read and write.'),
    lab('Key',tk),lab('Repository',rp),el('label',{class:'ed-l ed-c'},rem,' Remember me on this computer'),err,el('div',{class:'ed-row'},go,cancel));
  document.body.append(dlg);dlg.showModal();tk.focus()})}

// ---------- apply saved content + make it editable
function setLogo(v){const a=$('.logo');if(!a||!v)return;const[x,y]=v.split('✦');a.textContent=x;if(y!==undefined){const s=document.createElement('span');s.textContent='✦';a.append(s,y)}}
function setNav(n){const l=$$('header nav a');['home','illustration','game','commissions','about'].forEach((k,i)=>{if(l[i]&&n&&n[k])l[i].textContent=n[k]})}
function wireText(){$$('[data-text]').forEach(e=>{const[d,p]=loc(e.dataset.text),v=getp(d,p);if(typeof v==='string'&&v)e.textContent=v;
  if(e.closest('.band'))return;editable(e,t=>setp(d,p,t))})}
function wireLists(){$$('[data-list]').forEach(box=>{const[d,p]=loc(box.dataset.list),tag=box.dataset.item||'li',arr=getp(d,p);
  const mk=t=>{const n=document.createElement(tag);n.textContent=t;return n};
  if(Array.isArray(arr)&&arr.length)box.replaceChildren(...arr.map(mk));
  const sync=()=>setp(d,p,[...box.children].map(x=>x.textContent.trim()).filter(Boolean));
  const wire=n=>editable(n,sync);[...box.children].forEach(wire);
  box.after(el('div',{class:'ed-ui'},btn('+ Add line',()=>{const n=mk('New line');wire(n);box.append(n);sync()}),btn('− Remove last',()=>{if(box.lastElementChild){box.lastElementChild.remove();sync()}})))})}
function wireImages(){$$('[data-img]').forEach(e=>{const[d,p]=loc(e.dataset.img),v=getp(d,p);if(typeof v==='string'&&v)showImg(e,v);
  if(getComputedStyle(e).position==='static')e.style.position='relative';
  e.append(btn('📷 Change image',()=>pickImage(path=>{setp(d,p,path);showImg(e,path)}),'b s ed-img'))})}
function drawGallery(){const box=$('[data-gallery]');if(!box)return;const D=docs.page,items=D.data.items=D.data.items||[];box.replaceChildren();
  const move=(i,n)=>{if(n<0||n>=items.length)return;[items[i],items[n]]=[items[n],items[i]];touch(D);drawGallery()};
  items.forEach((it,i)=>{const tile=el('div',{class:'tile t'+(i%6+1)}),wrap=el('div',{style:'position:relative'});
    wrap.append(it.image?el('img',{src:imgSrc(it.image),alt:''}):el('div',{class:'ph'},'your art here'),
      btn('📷 '+(it.image?'Change':'Add')+' image',()=>pickImage(p=>{it.image=p;touch(D);drawGallery()}),'b s ed-img'));
    const cap=el('div',{class:'cap'}),t=el('span',{},it.title||''),s=el('small',{},it.subtitle||'');
    editable(t,v=>{it.title=v;touch(D)});editable(s,v=>{it.subtitle=v;touch(D)});cap.append(t,s);
    const more=it.more=Array.isArray(it.more)?it.more:[];
    const ui=el('div',{class:'ed-ui'},btn('←',()=>move(i,i-1),'b s','Move earlier'),btn('→',()=>move(i,i+1),'b s','Move later'),
      btn('+ Extra image ('+more.length+')',()=>pickImage(p=>{more.push(p);touch(D);drawGallery()}),'b s','Add an extra image to this piece'),
      ...(more.length?[btn('− Extra',()=>{more.pop();touch(D);drawGallery()},'b s','Remove last extra image')]:[]),
      btn('Delete',()=>{if(confirm('Delete this piece?')){items.splice(i,1);touch(D);drawGallery()}}));
    tile.append(wrap,cap,ui);box.append(tile)});
  box.append(el('div',{class:'tile ed-add'},btn('+ Add a piece',()=>{items.push({image:'',more:[],title:'New piece',subtitle:'Short description'});touch(D);drawGallery()},'b')))}

// ---------- panels (colors, fonts, menu)
function panel(title,...kids){$('.ed-panel')?.remove();const p=el('dialog',{class:'ed-dlg ed-panel','aria-label':title},el('h2',{},title),...kids);
  p.append(btn('Close',()=>p.remove(),'b'));document.body.append(p);p.show();p.querySelector('button').focus();return p}
const tin=(label,get,set)=>{const i=el('input',{type:'text'});i.value=get()||'';i.oninput=()=>set(i.value);return lab(label,i)};
function themePanel(){const T=docs.theme,C={paper:'Page background',ink:'Text and outlines',pink:'Pink accent',yellow:'Yellow',orange:'Orange',blush:'Light pink',plum:'Dark purple',peach:'Peach circle',salmon:'Bottom section'};
  const rows=Object.entries(C).map(([k,l])=>{const i=el('input',{type:'color'});i.value=T.data.colors[k];i.oninput=()=>{setp(T,['colors',k],i.value);applyTheme(T.data)};return lab(l,i)});
  const F={display:'Headings',body:'Body text',serif:'Pink accent words'};
  const sel=Object.entries(F).map(([k,l])=>{const s=el('select');Object.keys(FONTS[k]).forEach(n=>s.append(el('option',{value:n},n)));s.value=T.data.fonts[k];s.onchange=()=>{setp(T,['fonts',k],s.value);applyTheme(T.data)};return lab(l,s)});
  panel('Colors & fonts',...rows,...sel)}
function sitePanel(){const S=docs.site,H=docs.home,n=k=>()=>getp(S,['nav',k]);
  const nav=[['home','Menu: Home'],['illustration','Menu: Illustration'],['game','Menu: Game design'],['commissions','Menu: Commissions'],['about','Menu: About me']].map(([k,l])=>tin(l,n(k),v=>{setp(S,['nav',k],v);setNav(S.data.nav)}));
  panel('Menu & site',tin('Logo text (keep the ✦)',()=>S.data.logo,v=>{setp(S,['logo'],v);setLogo(v)}),...nav,tin('Contact email',()=>S.data.email,v=>setp(S,['email'],v)),
    tin('Scrolling banner text (home page)',()=>H.data.band,v=>{setp(H,['band'],v);$$('.band span').forEach(x=>x.textContent=v)}))}


// ---------- inbox (commission requests stored in your Supabase project)
const SQL=`create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200),
  message text not null check (char_length(message) between 1 and 4000),
  budget text check (char_length(budget) <= 100),
  is_read boolean not null default false
);
alter table public.commissions enable row level security;
grant usage on schema public to anon, authenticated;
grant insert on public.commissions to anon;
grant select, update, delete on public.commissions to authenticated;
create policy "visitors can send" on public.commissions for insert to anon with check (is_read = false);
create policy "owner can read" on public.commissions for select to authenticated using (true);
create policy "owner can update" on public.commissions for update to authenticated using (true) with check (true);
create policy "owner can delete" on public.commissions for delete to authenticated using (true);`;
let sbToken=sessionStorage.sbt||'';
const sbBase=()=>docs.site.data.supabaseUrl.replace(/\/$/,'');
const sbHead=(t,x={})=>{const k=docs.site.data.supabaseKey,h={apikey:k,'Content-Type':'application/json',...x};if(t)h.Authorization='Bearer '+t;else if(k.startsWith('eyJ'))h.Authorization='Bearer '+k;return h};
function inboxPanel(){const S=docs.site.data;
  if(!S.supabaseUrl||!S.supabaseKey){
    const ta=el('textarea',{class:'ed-sql',rows:9,readonly:''});ta.value=SQL;
    const p=panel('Set up your inbox (free, one time)',
      el('ol',{class:'ed-steps'},el('li',{},'Go to supabase.com, sign up, and click New project. Choose any name and a database password, and save the password.'),
        el('li',{},'When the project is ready, open ',el('b',{},'SQL Editor'),', click New query, paste the code below, and click Run.'),
        el('li',{},'Open ',el('b',{},'Authentication → Users → Add user → Create new user'),'. Enter your email and a password, and tick Auto Confirm.'),
        el('li',{},'In ',el('b',{},'Authentication'),', find the sign-in settings and turn off "Allow new users to sign up", so only you can have an account.'),
        el('li',{},'Open ',el('b',{},'Project Settings → API Keys'),'. Copy the Project URL and the publishable (or anon) key into the boxes below.')),
      ta,btn('Copy the code',()=>{navigator.clipboard&&navigator.clipboard.writeText(SQL);ta.select()}),
      tin('Project URL (starts with https://)',()=>S.supabaseUrl,v=>setp(docs.site,['supabaseUrl'],v.trim())),
      tin('Publishable (anon) key',()=>S.supabaseKey,v=>setp(docs.site,['supabaseKey'],v.trim())),
      btn('Save and continue',async()=>{await save();if(S.supabaseUrl&&S.supabaseKey)inboxPanel()},'b'));
    p.classList.add('ed-wide');return}
  if(!sbToken){
    const em=el('input',{type:'text',autocomplete:'username'}),pw=el('input',{type:'password',autocomplete:'current-password'}),err=el('p',{role:'alert',class:'ed-err'});em.value=localStorage.sbe||'';
    const p=panel('Sign in to your inbox',el('p',{},'Use the email and password you made in Supabase (not your GitHub key).'),lab('Email',em),lab('Password',pw),err,
      btn('Sign in',async()=>{err.textContent='';const r=await fetch(sbBase()+'/auth/v1/token?grant_type=password',{method:'POST',headers:sbHead(null),body:JSON.stringify({email:em.value.trim(),password:pw.value})}).catch(()=>null);
        if(!r)return err.textContent='Could not reach Supabase. Check the project URL, and that the project is not paused.';
        const j=await r.json().catch(()=>({}));if(!r.ok||!j.access_token)return err.textContent='Sign-in failed. Check your email and password.';
        sbToken=j.access_token;sessionStorage.sbt=sbToken;localStorage.sbe=em.value.trim();inboxPanel()},'b'));
    p.classList.add('ed-wide');return}
  const list=el('div',{style:'display:grid;gap:10px'},el('p',{},'Loading…'));
  const p=panel('Commission requests',list);p.classList.add('ed-wide');
  const load=async()=>{const r=await fetch(sbBase()+'/rest/v1/commissions?select=*&order=created_at.desc',{headers:sbHead(sbToken)}).catch(()=>null);
    if(!r){list.replaceChildren(el('p',{class:'ed-err'},'Could not reach Supabase.'));return}
    if(r.status===401||r.status===403){sbToken='';sessionStorage.removeItem('sbt');p.remove();inboxPanel();return}
    if(!r.ok){list.replaceChildren(el('p',{class:'ed-err'},'Could not load requests. Did the SQL code run without errors?'));return}
    const rows=await r.json();
    if(!rows.length){list.replaceChildren(el('p',{},'No requests yet. They will show up here.'));return}
    list.replaceChildren(...rows.map(m=>{const ok=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(m.email||'');
      const act=async(method,body,u)=>{await fetch(sbBase()+'/rest/v1/commissions?id=eq.'+m.id,{method,headers:sbHead(sbToken,{Prefer:'return=minimal'}),body:body&&JSON.stringify(body)});load()};
      return el('div',{class:'ib-card'+(m.is_read?'':' new')},
        el('b',{},(m.is_read?'':'NEW · ')+(m.name||'')),
        el('span',{class:'meta'},new Date(m.created_at).toLocaleString()+(m.budget?' · Budget: '+m.budget:'')),
        ok?el('a',{href:'mailto:'+m.email+'?subject=Re:%20Your%20commission%20request'},m.email):el('span',{},m.email||''),
        el('pre',{},m.message||''),
        el('div',{class:'ed-row'},btn(m.is_read?'Mark unread':'Mark read',()=>act('PATCH',{is_read:!m.is_read})),btn('Delete',()=>{if(confirm('Delete this request for good?'))act('DELETE')})))}))};
  load()}

// ---------- toolbar, save, start/stop
async function save(){status.className='';status.textContent='Saving…';
  try{for(const d of[...dirty]){const body={message:'Edit site (in-page editor)',content:enc(JSON.stringify(d.data,null,2)+'\n')};if(d.sha)body.sha=d.sha;
      const r=await api(d.file,{method:'PUT',body:JSON.stringify(body)}),j=await r.json();
      if(!r.ok)throw new Error(r.status===409||r.status===422?'this page changed somewhere else. Reload and try again':j.message);d.sha=j.content.sha;dirty.delete(d)}
    try{localStorage.theme=JSON.stringify(docs.theme.data)}catch(e){}
    status.textContent='Saved. Visitors see it in about a minute.'}catch(e){status.className='ed-err';status.textContent='Could not save: '+e.message}}
function leave(){if(dirty.size&&!confirm('You have unsaved changes. Leave without saving?'))return false;sessionStorage.removeItem('edit');return true}
function bar(){status=el('span',{class:'ed-status',role:'status'});
  const b=el('div',{class:'ed-bar',role:'region','aria-label':'Site editor'},el('b',{},'✎ Editing'),btn('Save changes',save,'b'),btn('Colors & fonts',themePanel),btn('Menu & site',sitePanel),btn('📥 Inbox',inboxPanel),btn('Sign out',()=>{if(!leave())return;sessionStorage.removeItem('sbt');sessionStorage.removeItem('gh');localStorage.removeItem('gh');location.reload()}),btn('Done',()=>{if(leave())location.reload()}),status);
  document.body.append(b)}
async function start(){if(on)return;if(!token&&!await signIn())return;
  try{docs.site=await loadDoc('data/site.json');docs.theme=await loadDoc('data/theme.json');docs.home=await loadDoc('data/home.json');docs.page=page==='home'?docs.home:await loadDoc('data/'+page+'.json')}
  catch(e){sessionStorage.removeItem('gh');localStorage.removeItem('gh');token='';alert('Could not open your content ('+e.message+'). Please sign in again.');return}
  docs.theme.data={colors:{...DEFAULT_THEME.colors,...docs.theme.data.colors},fonts:{...DEFAULT_THEME.fonts,...docs.theme.data.fonts}};
  on=true;sessionStorage.edit='1';document.body.classList.add('editing');bar();
  setLogo(docs.site.data.logo);setNav(docs.site.data.nav);wireText();wireLists();wireImages();drawGallery();
  document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.target.closest('.ed-bar,.ed-dlg,.ed-ui,.ed-img,input,button'))return;if(a.classList.contains('admin-link'))return;
    if(a.closest('header')){if(dirty.size&&!confirm('You have unsaved changes. Leave this page?'))e.preventDefault();return}e.preventDefault()},true);
  addEventListener('beforeunload',e=>{if(dirty.size)e.preventDefault()})}
window.SiteEditor={start,toggle(){on?(leave()&&location.reload()):start()}};
})();
