
// moves the star marker down the trail as you scroll
const dot=document.getElementById('dot'),trail=document.getElementById('trail');
function move(){
  const max=document.documentElement.scrollHeight-innerHeight;
  const p=max>0?scrollY/max:0;
  dot.style.top=(p*(trail.clientHeight-22))+'px';
}
addEventListener('scroll',move,{passive:true});addEventListener('resize',move);move();

// builds the gallery tiles from the data/*.json files (edited through Pages CMS)
document.querySelectorAll('[data-gallery]').forEach(async box=>{
  try{
    const items=await (await fetch(box.dataset.gallery,{cache:'no-cache'})).json();
    items.forEach((it,i)=>{
      const tile=document.createElement('div');tile.className='tile t'+(i%6+1);
      if(it.image){const img=document.createElement('img');img.src=it.image.replace(/^\//,'');img.alt=it.title||'';img.loading='lazy';tile.append(img)}
      else{const ph=document.createElement('div');ph.className='ph';ph.textContent='your art here';tile.append(ph)}
      const cap=document.createElement('div');cap.className='cap';cap.textContent=it.title||'';
      if(it.subtitle){const s=document.createElement('small');s.textContent=it.subtitle;cap.append(s)}
      tile.append(cap);box.append(tile);
    });
  }catch(e){box.textContent='Gallery could not load. Open the site from its web address, not from the file.'}
});
