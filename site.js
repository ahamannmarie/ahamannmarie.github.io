
// moves the star marker down the trail as you scroll
const dot=document.getElementById('dot'),trail=document.getElementById('trail');
function move(){
  const max=document.documentElement.scrollHeight-innerHeight;
  const p=max>0?scrollY/max:0;
  dot.style.top=(p*(trail.clientHeight-22))+'px';
}
addEventListener('scroll',move,{passive:true});addEventListener('resize',move);move();
