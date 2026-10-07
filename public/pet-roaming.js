// Independent, bounded pet walks. No player position or saved game data is used.
(function(root){
function create(random=Math.random){
  function spot(b,hit){for(let i=0;i<80;i++){const p={x:b.x0+random()*(b.x1-b.x0),y:b.y0+random()*(b.y1-b.y0)};if(!hit(p.x,p.y))return p}return null}
  function clear(p,t,hit){const n=Math.ceil(Math.hypot(t.x-p.x,t.y-p.y)/4);for(let i=1;i<=n;i++)if(hit(p.x+(t.x-p.x)*i/n,p.y+(t.y-p.y)*i/n))return false;return true}
  function step(p,dt,b,hit,speed){
    dt=Math.min(.12,Math.max(0,dt));p.vx=p.vy=0;
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||hit(p.x,p.y)){const t=spot(b,hit);if(!t)return;p.x=t.x;p.y=t.y;p.target=null;p.wait=1+random()*4}
    if(!p.target){p.wait=(p.wait||0)-dt;if(p.wait>0)return;
      for(let i=0;i<12;i++){const a=random()*Math.PI*2,r=speed*(2+random()*5),t={x:Math.max(b.x0,Math.min(b.x1,p.x+Math.cos(a)*r)),y:Math.max(b.y0,Math.min(b.y1,p.y+Math.sin(a)*r))};if(Math.hypot(t.x-p.x,t.y-p.y)>speed&&clear(p,t,hit)){p.target=t;break}}
      if(!p.target){p.wait=1+random()*2;return}
    }
    const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.hypot(dx,dy),move=Math.min(d,speed*dt),x=p.x+dx/d*move,y=p.y+dy/d*move;
    if(d<.5||!clear(p,{x,y},hit)){p.target=null;p.wait=2+random()*5;return}
    p.vx=dx/d*speed;p.vy=dy/d*speed;p.x=x;p.y=y;
    if(move===d){p.target=null;p.wait=2+random()*5}
  }
  return {step};
}
root.PetRoaming={create};if(typeof module!=='undefined')module.exports=root.PetRoaming;
})(typeof window!=='undefined'?window:globalThis);
