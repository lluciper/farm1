'use strict';
// Life for the outdoor scenes, driven by one requestAnimationFrame loop, using the game's painted artwork:
// - the player walks a found path around plots and pens (A* + line-of-sight smoothing + rounded corners), eases in and
//   out, breaks into a run on long trips and slows to a walk before arriving; arrow keys / WASD steer continuously and
//   slide along obstacles; the painted outfit picture is cut into a puppet that steps, sways and turns; footfalls kick
//   up dust;
// - owned pets follow along the player's footprints and settle around them when the player stops;
// - herd animals wander inside their pens, legs stepping; a random animal now and then says how the herd feels.
// Cut lines come from rig-joints.js / critter-joints.js; the pig (no painting yet) from avatar-rig.js; game state
// (s, F, render, save, critterArt, rigSrc) from game.js.
(()=>{
const R=window.AvatarRig,world=document.getElementById('world'),stage=document.getElementById('stage'),avatar=document.getElementById('avatar');
if(!world||!avatar||typeof s==='undefined'||typeof F==='undefined')return;
document.documentElement.classList.add('avatar-world');
const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const OUTDOOR=['farm','village'],TAU=Math.PI*2,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,approach=(v,t,rate,dt)=>v+(t-v)*(1-Math.exp(-rate*dt));
const spring=(st,target,k,c,dt)=>{for(let i=0;i<2;i++){const h=dt/2;st.v+=(k*(target-st.x)-c*st.v)*h;st.x+=st.v*h}return st.x};
// Write a style only when it changed (most parts stand still most of the time).
const setStyle=(cache,el,prop,v)=>{if(cache.get(el)?.[prop]===v)return;const c=cache.get(el)||{};c[prop]=v;cache.set(el,c);el.style[prop]=v};
const turnStep=(st,dt)=>{if(!st.turn)return 1;const T=st.turn;T.u=Math.min(1,T.u+dt/.16);if(T.u>=.5&&!T.swapped){T.swapped=true;st.flip=T.want}const sq=1-.6*Math.sin(Math.PI*T.u);if(T.u>=1){st.turn=null;if(T.want!==st.flip)st.turn={u:0,want:T.want,swapped:false}}return sq};
const faceTo=(st,dir)=>{dir=dir<0?-1:1;if(st.turn){st.turn.want=dir;return}if(dir!==st.flip)st.turn={u:0,want:dir,swapped:false}};

// ---------- Player: the painted outfit picture, cut into a jointed puppet ----------
// The 320×400 outfit picture is shown several times, each copy clipped to one body part: head (with the hairstyle),
// torso, two arms, two legs and the two fitted shoes. Every joint is round: the edge between a part and the body is a
// circle around the joint's pivot (puppet-joints.js), so turning a limb slides it along that circle and never opens a
// gap or a jagged seam. Each frame the parts are posed from a walk cycle modelled on a real step:
//  - contact → down → passing → up: the body is lowest just after the heel lands and highest as the legs pass;
//  - the swinging leg lifts and bends (shorter), the planted one pushes back; the shoe lands toe-up and peels off heel-first;
//  - arms swing against the legs a moment behind them; the heavy chibi head bounces a beat late and keeps itself level;
//  - long hair swings after the head; the body leans into the walk (more when running) and overshoots when stopping;
//  - standing still it breathes, shifts its weight from foot to foot and now and then looks around.
const PP=(x,y)=>(x/3.2).toFixed(2)+'% '+(y/4).toFixed(2)+'%',POLY=pts=>'polygon('+pts.map(p=>PP(p[0],p[1])).join(',')+')';
const arcPts=(c,r,a0,a1,n=10)=>Array.from({length:n+1},(_,i)=>{const a=(a0+(a1-a0)*i/n)*Math.PI/180;return [c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)]});
// Top edge of a limb hanging from a round joint: the lower half of the joint circle, flat at pivot height outside it.
const jointEdge=(c,r)=>x=>Math.abs(x-c[0])<r?c[1]+Math.sqrt(r*r-(x-c[0])**2):c[1];
const curve=(f,x0,x1,n=14)=>Array.from({length:n+1},(_,i)=>{const x=x0+(x1-x0)*i/n;return [x,f(x)]});
const OV=1.4;// overlap (layer units) that hides the anti-aliased seam between neighbouring parts
class Puppet{
  constructor(host){
    const div=(cls,parent)=>{const d=document.createElement('div');d.className=cls;parent.appendChild(d);return d};
    this.shadow=div('pp-shadow',host);this.el=div('pp',host);
    this.hairBWrap=div('pp-group',this.el);this.hairB=div('pp-part',this.hairBWrap);
    this.legL=div('pp-part',this.el);this.legR=div('pp-part',this.el);this.shoeL=div('pp-part',this.el);this.shoeR=div('pp-part',this.el);
    this.upper=div('pp-group',this.el);this.torso=div('pp-part',this.upper);this.head=div('pp-group',this.upper);this.headImg=div('pp-part',this.head);this.hairF=div('pp-part',this.head);
    this.armL=div('pp-part',this.upper);this.armR=div('pp-part',this.upper);
    this.st={phase:0,w:0,run:0,flip:1,turn:null,t:Math.random()*9,cheer:0,jump:0,lean:{x:0,v:0},hair:{x:0,v:0},headY:{x:0,v:0},tilt:{x:0,v:0},armL:{x:0,v:0},armR:{x:0,v:0},
      weight:{x:0,v:0},weightTo:0,weightAt:2+Math.random()*3,lookTo:0,lookAt:1.5+Math.random()*3,lastStep:0,wasMoving:false,settle:0};
    this.key='';this.cache=new Map();this.G=null;
  }
  setLook(L){
    const key=[L.rig,L.feet,L.hairBack,L.hairFront].join('|');if(key===this.key)return;this.key=key;this.cache.clear();
    const j=L.joints,P=L.puppet,img=`url("${L.rig}")`,set=(el,bg,clip,origin)=>{el.hidden=!bg;el.style.backgroundImage=bg||'none';el.style.clipPath=clip||'none';if(origin)el.style.transformOrigin=origin};
    set(this.hairB,L.hairBack&&`url("${L.hairBack}")`);set(this.hairF,L.hairFront&&`url("${L.hairFront}")`);
    if(!j||!P){// a picture without measured joints still breathes and bobs as one piece
      set(this.torso,img);for(const e of [this.legL,this.legR,this.shoeL,this.shoeR,this.headImg,this.armL,this.armR])e.hidden=true;this.G=null;return}
    const sx=j.split,cy=j.crotch,fit=L.fit,shoe=L.feet?`url("${L.feet}")`:'',N=P.neck,R=P.hipR,[HL,HR]=P.hips,[SL,SR]=P.shoulders||[];
    const cutL=fit?fit.t[0]+7:400,cutR=fit?fit.t[1]+7:400;
    // Head: everything above the neck line, with a small dome around the neck that stays on the body.
    const rn=12,neckY=x=>Math.abs(x-N[0])<rn?N[1]-Math.sqrt(rn*rn-(x-N[0])**2):N[1];
    set(this.headImg,img,POLY([[0,0],[320,0],[320,N[1]],...curve(neckY,N[0]+rn,N[0]-rn,10),[0,N[1]]]));
    // Limb regions: column of the limb, below its round joint, down to its end.
    const legL=jointEdge(HL,R),legR=jointEdge(HR,R),armL=SL&&jointEdge(SL.p,SL.r),armR=SR&&jointEdge(SR.p,SR.r),A=j.armL,B=j.armR;
    const hasL=cutL>legL(sx-4)+4,hasR=cutR>legR(sx+4)+4;
    set(this.legL,hasL&&img,POLY([[0,HL[1]],...curve(legL,0,sx,16),[sx,cutL],[0,cutL]]),PP(HL[0],HL[1]));
    set(this.legR,hasR&&img,POLY([[sx,legR(sx)],...curve(legR,sx,320,16),[320,cutR],[sx,cutR]]),PP(HR[0],HR[1]));
    // The shoe picture holds both shoes; each is clipped along the curve between them (fit.s) and moves with its leg.
    const seam=fit?.s||[[sx,cy-8],[sx,400]],y0=seam[0][1],y1=seam[seam.length-1][1];
    set(this.shoeL,shoe,POLY([[0,y0],...seam,[0,y1]]),PP(HL[0],HL[1]));set(this.shoeR,shoe,POLY([[320,y0],...seam,[320,y1]]),PP(HR[0],HR[1]));
    if(A&&armL)set(this.armL,img,POLY([[0,SL.p[1]],...curve(armL,0,A.cut,14),[A.cut,A.bottom],[0,A.bottom]]),PP(SL.p[0],SL.p[1]));else this.armL.hidden=true;
    if(B&&armR)set(this.armR,img,POLY([[B.cut,armR(B.cut)],...curve(armR,B.cut,320,14),[320,B.bottom],[B.cut,B.bottom]]),PP(SR.p[0],SR.p[1]));else this.armR.hidden=true;
    // Torso: the rest, overlapping each neighbour a little (head and arms are drawn over it, legs under it).
    const low=Math.min(cutL,cutR),bot=(f,has,cut)=>x=>has?Math.min(f(x)+OV,cut):Math.min(cut,low),bl=bot(legL,hasL,cutL),br=bot(legR,hasR,cutR);
    const body=[...curve(x=>neckY(x)-4,0,320,24)];
    if(B&&armR)body.push([320,SR.p[1]],...curve(x=>armR(x)+OV,320,B.cut,12),[B.cut,B.bottom],[320,B.bottom]);
    body.push(...curve(br,320,sx,16),...curve(bl,sx,0,16));
    if(A&&armL)body.push([0,A.bottom],[A.cut,A.bottom],...curve(x=>armL(x)+OV,A.cut,0,12),[0,SL.p[1]]);
    set(this.torso,img,POLY(body));
    const pelvis=[(HL[0]+HR[0])/2,HL[1]];
    this.upper.style.transformOrigin=PP(...pelvis);this.torso.style.transformOrigin=PP(...pelvis);
    this.head.style.transformOrigin=PP(...N);this.hairBWrap.style.transformOrigin=PP(...pelvis);this.hairB.style.transformOrigin=PP(...N);
    // Where things are, for posing: hips, shoe soles, the length of each leg, the neck height above the hips.
    const sole=y1-4;
    this.G={HL,HR,N,pelvis,legLen:[sole-HL[1],sole-HR[1]],sole,roll:[[HL[0],sole],[HR[0],sole]],neckUp:pelvis[1]-N[1]};
  }
  face(dir){faceTo(this.st,dir)}
  cheer(){this.st.cheerT=0}
  // speed in px/s, AH = character height in px; returns true on the frame a foot touches the ground
  update(dt,{speed=0,AH=100}={}){
    const st=this.st,c=this.cache,G=this.G;dt=Math.min(dt,1/20);st.t+=dt;
    const v=speed/AH,moving=v>.05;st.w=approach(st.w,moving?1:0,moving?8:6,dt);st.run=approach(st.run,clamp((v-1.3)/.7,0,1),4,dt);
    const prev=st.phase;st.phase=(st.phase+v*dt/lerp(.62,.95,st.run))%1;
    const stepped=moving&&(Math.floor(prev*2)!==Math.floor(st.phase*2));
    if(st.wasMoving&&!moving)st.settle=1;st.wasMoving=moving;st.settle=Math.max(0,st.settle-dt*3.2);
    const sq=turnStep(st,dt),turnHop=st.turn?Math.sin(Math.PI*st.turn.u):0;
    if(st.cheerT!==undefined){st.cheerT+=dt;const u=st.cheerT/.75;st.cheer=u<1?Math.sin(Math.PI*Math.min(1,u*1.6))**.6*(u<.75?1:1-(u-.75)/.25):0;st.jump=u<.6?6*Math.sin(Math.PI*u/.6):0;if(u>=1){delete st.cheerT;st.cheer=st.jump=0}}
    const w=st.w,rw=st.run,p=st.phase*TAU,ch=st.cheer,idle=1-w;
    // Idle life: breathing, weight shifts from foot to foot, glances around.
    const br=reduced?0:Math.sin(st.t*TAU/3.6);
    // (People who asked their system for reduced motion get a calm figure: no fidgets, no breathing, smaller bounce.)
    st.weightAt-=dt*idle;if(reduced)st.weightAt=9;if(st.weightAt<=0){st.weightTo=st.weightTo>0?-1:st.weightTo<0?(Math.random()<.4?0:1):(Math.random()<.5?-1:1);st.weightAt=3.5+Math.random()*4.5}
    st.lookAt-=dt;if(reduced){st.lookAt=9;st.lookTo=0}if(st.lookAt<=0){st.lookTo=Math.random()<.45?0:(Math.random()*2-1)*5;st.lookAt=1.8+Math.random()*3.2}
    const wt=spring(st.weight,st.weightTo*idle,14,7,dt);
    // Walk cycle. Left foot forward offset cos(p), right -cos(p); a foot swings forward when its offset is growing.
    const A=lerp(17,27,rw)*w,fl=Math.cos(p),fr=-fl,liftL=Math.max(0,-Math.sin(p))**1.3*w,liftR=Math.max(0,Math.sin(p))**1.3*w;
    const u=2*p-.6,low=(1+Math.cos(u))/2,bob=(w*lerp(1.5,3.6,rw)*(1-low)+st.jump+turnHop*1.6)*(reduced?.35:1);// % of height, up
    if(G){
      const leg=(f,lift,relax)=>{const a=-A*f+relax,k=1-lift*lerp(.07,.12,rw)-Math.abs(relax)*.004;return {a,k}};
      const L=leg(fl,liftL,Math.max(0,-wt)*3),Rr=leg(fr,liftR,-Math.max(0,wt)*3);
      const shoeT=(g,i,f,lift)=>{const len=G.legLen[i],dy=(1-g.k)*len,roll=w*(f>0?-2.5*f*(1-lift):3*(-f)*(1-lift))-lift*2*w,rp=G.roll[i],hp=i?G.HR:G.HL;
        return `rotate(${g.a.toFixed(2)}deg) translateY(${(-dy/4).toFixed(2)}%) translate(${((rp[0]-hp[0])/3.2).toFixed(2)}%,${((rp[1]-hp[1])/4).toFixed(2)}%) rotate(${roll.toFixed(2)}deg) translate(${((hp[0]-rp[0])/3.2).toFixed(2)}%,${((hp[1]-rp[1])/4).toFixed(2)}%)`};
      setStyle(c,this.legL,'transform',`rotate(${L.a.toFixed(2)}deg) scaleY(${L.k.toFixed(4)})`);setStyle(c,this.legR,'transform',`rotate(${Rr.a.toFixed(2)}deg) scaleY(${Rr.k.toFixed(4)})`);
      setStyle(c,this.shoeL,'transform',shoeT(L,0,fl,liftL));setStyle(c,this.shoeR,'transform',shoeT(Rr,1,fr,liftR));
    }
    // Torso: rocks over the stance leg, squashes a touch as the weight lands, breathes at rest.
    const rock=w*lerp(1.4,.8,rw)*Math.sin(p)+wt*1.6,squash=w*(low-.5)*lerp(.025,.045,rw)+st.settle*.03;
    setStyle(c,this.upper,'transform',`rotate(${(rock-ch*2).toFixed(2)}deg)`);
    setStyle(c,this.torso,'transform',`scale(${(1+squash*.5).toFixed(4)},${(1-squash+idle*.011*br).toFixed(4)})`);
    // Head: bounces a beat after the body, stays level against the rock, glances around when idle.
    const breathUp=G?-idle*.011*br*G.neckUp/4:0,hy=spring(st.headY,-w*lerp(.5,1.1,rw)*Math.sin(u-1.2)+breathUp+st.settle*.8,60,8,dt);
    const tilt=spring(st.tilt,-rock*.55+idle*st.lookTo+w*1.2*Math.sin(u-.5)-ch*3,22,7,dt);
    setStyle(c,this.head,'transform',`translateY(${hy.toFixed(2)}%) rotate(${tilt.toFixed(2)}deg)`);
    // Long hair (behind the body) hangs from the head and swings after it.
    const hs=spring(st.hair,-st.lean.x*.9-w*2.5*Math.sin(u-1.6)+tilt*.4,38,5,dt);
    setStyle(c,this.hairBWrap,'transform',`rotate(${(rock-ch*2).toFixed(2)}deg)`);
    // The swing is a skew about the join with the hair on the head (row 216), so the join never moves and the ends sway.
    const jn=G?(216-G.N[1])/4:-2;
    setStyle(c,this.hairB,'transform',`translateY(${hy.toFixed(2)}%) rotate(${tilt.toFixed(2)}deg) translateY(${jn.toFixed(2)}%) skewX(${(-hs*1.6).toFixed(2)}deg) translateY(${(-jn).toFixed(2)}%)`);
    // Arms swing against the legs, a little late; idle they hang and sway with the breath; cheering they go up.
    const aw=lerp(20,38,rw)*w,lag=.35,al=spring(st.armL,aw*Math.cos(p-lag)+idle*(1.6*br+wt*2),70,9,dt),ar=spring(st.armR,-aw*Math.cos(p-lag)+idle*(-1.6*br+wt*2),70,9,dt);
    setStyle(c,this.armL,'transform',`translateY(${(breathUp*.7).toFixed(2)}%) rotate(${lerp(al,128,ch).toFixed(2)}deg)`);setStyle(c,this.armR,'transform',`translateY(${(breathUp*.7).toFixed(2)}%) rotate(${lerp(ar,-128,ch).toFixed(2)}deg)`);
    // Whole figure: bob and lean into the walk (springy, so it overshoots a little on start and stop). 3D turns are left
    // out on purpose: browsers paint 3D-transformed pictures at low resolution and the painting turns blurry.
    const lean=spring(st.lean,w*lerp(3,8,rw),48,7.5,dt);
    setStyle(c,this.el,'transform',`translate(${(wt*.7).toFixed(2)}%,${(-bob).toFixed(2)}%) rotate(${lean.toFixed(2)}deg) scaleX(${(st.flip*sq).toFixed(3)})`);
    setStyle(c,this.shadow,'transform',`scale(${(1-bob*.028).toFixed(3)},${(1-bob*.02).toFixed(3)})`);setStyle(c,this.shadow,'opacity',(1-bob*.04).toFixed(3));
    return stepped;
  }
}
const host=document.createElement('div');host.className='ar-player';host.setAttribute('aria-hidden','true');avatar.appendChild(host);
const player=new Puppet(host);
const playerLook=()=>{const g=s.profile.gender==='male'?'male':'female',k=s.wardrobe.equipped,o=F.outfits[k]||{},shoe=s.footwear.equipped,modular=o.modular!==undefined;
  return {rig:typeof rigSrc==='function'?rigSrc(g,k,shoe):`fashion/rig-${g}-${k}.png`,joints:window.XOM_RIG_JOINTS?.[`rig-${g}-${k}`],puppet:window.XOM_PUPPET?.[`rig-${g}-${k}`],hairBack:modular?`fashion/hair-${s.appearance.hair}.png?v=48.2`:'',hairFront:modular?`fashion/hair-${s.appearance.hair}-front.png?v=48.2`:'',feet:shoe==='bare'?'':`fashion/feet-${g}-${k}-${shoe}.png?v=49.0`,fit:shoe==='bare'?null:window.XOM_SHOE_FIT?.[`${g}-${k}-${shoe}`]}};
player.setLook(playerLook());
// ---------- 3D: once world3d.js has loaded (WebGL available) the player is a real 3D model instead of the puppet ----------
// The model is drawn into a canvas a bit larger than the avatar box (hat and swinging arms reach outside it), with its
// feet where the painted feet were. The box is 1.12 model units tall, so the 1-unit character fills ~90% of it.
let player3d=null;
const look3d=()=>R?R.look({gender:s.profile.gender,outfit:s.wardrobe.equipped,hair:s.appearance.hair,shoe:s.footwear.equipped,modular:F.outfits[s.wardrobe.equipped]?.modular!==undefined}):{gender:s.profile.gender,outfit:s.wardrobe.equipped};
function use3D(W){
  if(player3d||!W)return;
  try{const view=new W.View(host,{left:-.3,top:-.32,width:1.6,height:1.36,zoom:1.52,center:[0,.66],cls:'w3d-player',dpr:Math.min(3,devicePixelRatio||1)});view.priority=1;view.measure();player3d={view,ch:new W.Character(view,look3d())};player.el.hidden=player.shadow.hidden=true;avatar.classList.add('is-3d')}
  catch(e){console.warn('3D player unavailable',e);player3d=null}
}
// One face for the movement code, whichever drawing is active.
const actor={
  setLook(){if(player3d)player3d.ch.setLook(look3d());else player.setLook(playerLook())},
  update(dt,o){return player3d?player3d.ch.update(dt,{speed:o.speed/o.AH*1.12}):player.update(dt,o)},
  face(dir,vx,vy){if(player3d)player3d.ch.steer(vx,vy);else player.face(dir)},
  cheer(){(player3d?player3d.ch:player).cheer()},
  get phase(){return (player3d?player3d.ch:player).st.phase}
};
// When 3D arrives after the painted drawings are up, swap them: pets are rebuilt, herd pictures re-scanned.
function switchTo3D(){use3D(window.World3D);if(!player3d)return;for(const p of pets.values())p.el.remove();pets.clear();syncPets();for(const el of live)if(el._arHerd&&!el._ar?.view){delete el._ar;live.delete(el)}dirty=true}
if(window.World3D)queueMicrotask(switchTo3D);else window.addEventListener('world3d-ready',switchTo3D,{once:true});

// ---------- Painted animals: body + one clipped copy of the picture per leg (critter-joints.js), posed every frame ----------
// Legs swing about their hips in two alternating groups and lift while swinging; quadrupeds pitch and bob, birds
// waddle and peck, sitting pets hop. Hungry herds look thinner and fed ones rounder (body squashed about the leg line).
const PLUMP={hungry:-1,fed:1,ready:1},plumpScale=p=>p<0?[1+p*.03,1+p*.1]:[1+p*.05,1+p*.08];
class Critter{
  constructor(svg){
    this.svg=svg;svg._ar=this;const img=svg.querySelector('image');
    this.d=window.XOM_CRITTERS?.[(img?.getAttribute('href')||'').split('?')[0]]||{w:100,h:100};this.type=svg.getAttribute('data-critter');this.mood=svg.getAttribute('data-mood')||'';this.peck=+(svg.getAttribute('data-peck')||1);
    this.rig=svg.querySelector('.cr-rig');this.body=svg.querySelector('.cr-body');this.legs=[...svg.querySelectorAll('.cr-leg')].map(el=>({el,b:el.classList.contains('cr-leg-b')}));
    this.st={phase:Math.random(),w:0,flip:1,turn:null,t:Math.random()*20,plump:PLUMP[this.mood]||0,act:null,actAt:1+Math.random()*4};this.cache=new Map();
  }
  face(dir){faceTo(this.st,dir)}
  // speed in picture units / s; idle: let it graze / peck / look around; plump: -1..1 override
  update(dt,inp={}){
    const st=this.st,d=this.d,c=this.cache,bird=this.type==='bird',sit=this.type==='sitter';dt=Math.min(dt,1/20);st.t+=dt;
    const spd=Math.max(0,inp.speed||0);st.w=approach(st.w,spd>1?1:0,spd>1?10:7,dt);st.phase=(st.phase+spd*dt/(d.w*(sit?.32:bird?.28:.4)))%1;
    st.plump=inp.plump!==undefined?inp.plump:approach(st.plump,PLUMP[this.mood]||0,3,dt);
    const sq=turnStep(st,dt),w=st.w,ph=st.phase*TAU;
    if(st.act){st.act.u+=dt/st.act.dur;if(st.act.u>=1||w>.3)st.act=null}
    else if(inp.idle!==false&&w<.1&&!sit){st.actAt-=dt;if(st.actAt<=0){st.act={type:bird?(Math.random()<.7?'peck':'look'):(Math.random()<.6?'graze':'look'),u:0,dur:bird?1.2+Math.random():2+Math.random()*2.5};st.actAt=1.5+Math.random()*4.5}}
    const au=st.act?st.act.u:0,aw=st.act?Math.sin(Math.PI*Math.min(1,au))**.5:0,hungry=this.mood==='hungry';
    if(sit){// sitting pets hop along: squash on landing, stretch in the air; breathe at rest
      const hop=Math.abs(Math.sin(ph)),y=-d.h*.07*hop*w,land=w*(1-hop),br=(1-w)*.014*Math.sin(st.t*2.1);
      setStyle(c,this.rig,'transform',`translateY(${y.toFixed(1)}px) scale(${(st.flip*sq*(1+land*.06)).toFixed(3)},${(1-land*.07+hop*w*.04+br).toFixed(3)})`);return;
    }
    const A=bird?22:13,lift=d.h*(bird?.035:.022);
    for(const L of this.legs){const p=ph+(L.b?Math.PI:0);setStyle(c,L.el,'transform',`translateY(${(-w*lift*Math.max(0,Math.cos(p))).toFixed(2)}px) rotate(${(w*A*Math.sin(p)).toFixed(2)}deg)`)}
    const bob=-d.h*.012*w*Math.abs(Math.cos(ph)),tilt=bird?w*4.5*Math.sin(ph):w*1.3*Math.sin(ph);
    let bodyRot=0,bodyY=0;
    if(st.act?.type==='graze'){bodyRot=5*aw;bodyY=d.h*.012*aw}
    if(st.act?.type==='peck'){const k=Math.max(0,Math.sin(Math.PI*((au*3)%1)))*Math.min(1,au*4)*Math.min(1,(1-au)*4);bodyRot=this.peck*26*k}
    if(st.act?.type==='look')bodyRot=-3*aw;
    if(hungry)bodyRot+=2*(1-w);
    const [px,py]=plumpScale(st.plump);
    setStyle(c,this.body,'transform',`translateY(${bodyY.toFixed(2)}px) rotate(${bodyRot.toFixed(2)}deg) scale(${px.toFixed(3)},${py.toFixed(3)})`);
    setStyle(c,this.rig,'transform',`translateY(${bob.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scaleX(${(st.flip*sq).toFixed(3)})`);
  }
}
// 3D stand-in for a painted animal: a canvas over the picture's box with a World3D.Animal, answering the same calls as
// the painted Critter (update, face) plus steer(vx, vy) so it can turn toward any direction.
// FIT3D: model units shown across the box height (bigger animals get more room so each fills its box).
const FIT3D={cow:.6,pig:.48,goat:.6,sheep:.52,chicken:.4,duck:.36,cat:.4,dog:.4,lion:.46,pigeon:.3};
function animal3D(box,kind,mood){
  const W=window.World3D,fit=FIT3D[kind]||.5,padX=.3,padT=.4,h=1+padT+.06;
  const view=new W.View(box,{left:-padX,top:-padT,width:1+2*padX,height:h,zoom:fit*h,center:[0,fit*h/2-.1*fit]});
  const a=new W.Animal(view,kind,{mood});
  return {box,a,view,mood,kind,fit,px:box.offsetHeight||40,
    update(dt,o={}){return a.update(dt,{speed:(o.px||0)/(this.px/fit),idle:o.idle!==false,plump:o.plump})},
    face(d){a.face(d)},steer(x,y){a.steer(x,y)}};
}
function herd3D(el){
  const W=window.World3D,img=el.querySelector('image'),kind=el.dataset.arAnimal||W.SPECIES_OF[(img?.getAttribute('href')||'').split('?')[0]];if(!kind)return null;
  const box=document.createElement('div');box.className='herd-animal w3d-box';el.after(box);el.style.display='none';
  const ad=animal3D(box,kind,el.dataset.mood||el.dataset.arMood||'');el._ar=ad;return ad;
}
const animate=el=>el._ar||(window.World3D&&el.closest('.herd')&&herd3D(el))||(el.hasAttribute('data-critter')?new Critter(el):R?.hydrate(el));

// ---------- World measurements ----------
let W=world.clientWidth||1,H=world.clientHeight||1,AW=avatar.offsetWidth||70,AH=avatar.offsetHeight||100;
let snapReq=0;
const measure=()=>{if(bigFarm()&&(world.clientWidth!==W||world.clientHeight!==H))snapReq=performance.now()+60;W=world.clientWidth||1;H=world.clientHeight||1;AW=avatar.offsetWidth||AW;AH=avatar.offsetHeight||AH;sizePets();lite=null;petMap=null};
if(window.ResizeObserver){new ResizeObserver(measure).observe(world);new ResizeObserver(measure).observe(avatar)}else window.addEventListener('resize',measure);
// Same limits as the original movePlayer: keep the whole character inside the scene, feet between 15% and 97% height.
// On the phone farm map the player keeps to the lawn and the paths round it (not the house, trees and fences).
const bounds=()=>{if(bigFarm())return {x0:W*.09,x1:W*.93,y0:H*.2,y1:H*.93};const mx=Math.max(W*.03,AW/2+W*.01);return {x0:mx,x1:W-mx,y0:Math.max(H*.15,AH+H*.01),y1:H*.97}};
// Phones: the farm is a big field the camera moves over, and the player walks right across the rows to reach any plot.
function bigFarm(){return s.zone==='farm'&&!!window.matchMedia?.('(max-width:650px)').matches}
function obstacles(forPets=false){if(bigFarm()&&!forPets)return [];const wr=world.getBoundingClientRect(),kx=W/(wr.width||W),ky=H/(wr.height||H);const out=[];world.querySelectorAll('.plot,.real-pen').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&r.height)out.push({x0:(r.left-wr.left)*kx,y0:(r.top-wr.top)*ky,x1:(r.right-wr.left)*kx,y1:(r.bottom-wr.top)*ky})});return out}

// ---------- Path finding ----------
function makeMap(){
  const b=bounds(),obs=obstacles(),pad=clamp(AW*.17,5,12),C=Math.max(9,Math.round(Math.min(W,H)/52)),cols=Math.ceil(W/C),rows=Math.ceil(H/C);
  const hit=(x,y)=>x<b.x0||x>b.x1||y<b.y0||y>b.y1||obs.some(r=>x>r.x0-pad&&x<r.x1+pad&&y>r.y0-pad*.5&&y<r.y1+pad*.35);
  const grid=new Uint8Array(cols*rows);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)grid[r*cols+c]=hit((c+.5)*C,(r+.5)*C)?1:0;
  return {b,C,cols,rows,grid,hit};
}
function clearLine(m,a,p,skip=0){const d=Math.hypot(p.x-a.x,p.y-a.y),n=Math.ceil(d/(m.C/3));for(let i=1;i<n;i++){const t=i/n;if(t*d<skip)continue;if(m.hit(a.x+(p.x-a.x)*t,a.y+(p.y-a.y)*t))return false}return true}
function nearestFree(m,c0,r0){const seen=new Uint8Array(m.cols*m.rows),q=[[c0,r0]];seen[r0*m.cols+c0]=1;for(let i=0;i<q.length&&i<20000;i++){const [c,r]=q[i];if(!m.grid[r*m.cols+c])return [c,r];for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(nc<0||nr<0||nc>=m.cols||nr>=m.rows||seen[nr*m.cols+nc])continue;seen[nr*m.cols+nc]=1;q.push([nc,nr])}}return null}
function closestReachable(m,c0,r0,t){const seen=new Uint8Array(m.cols*m.rows),q=[[c0,r0]];seen[r0*m.cols+c0]=1;let best=null,bd=Infinity;for(let i=0;i<q.length;i++){const [c,r]=q[i],d=Math.hypot((c+.5)*m.C-t.x,(r+.5)*m.C-t.y);if(d<bd){bd=d;best=[c,r]}for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr,j=nr*m.cols+nc;if(nc<0||nr<0||nc>=m.cols||nr>=m.rows||seen[j]||m.grid[j])continue;seen[j]=1;q.push([nc,nr])}}return best}
function astar(m,sc,sr,gc,gr){
  const N=m.cols*m.rows,g=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),closed=new Uint8Array(N),heap=[],start=sr*m.cols+sc,goal=gr*m.cols+gc;
  const h=i=>{const dx=Math.abs(i%m.cols-gc),dy=Math.abs((i/m.cols|0)-gr);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
  const push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}};
  const pop=()=>{const top=heap[0],end=heap.pop();if(heap.length){heap[0]=end;let k=0;for(;;){const l=2*k+1,r=l+1;let m2=k;if(l<heap.length&&heap[l][0]<heap[m2][0])m2=l;if(r<heap.length&&heap[r][0]<heap[m2][0])m2=r;if(m2===k)break;[heap[m2],heap[k]]=[heap[k],heap[m2]];k=m2}}return top};
  g[start]=0;push(start,h(start));
  while(heap.length){const [,i]=pop();if(closed[i])continue;if(i===goal)break;closed[i]=1;const c=i%m.cols,r=i/m.cols|0;
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dc&&!dr)continue;const nc=c+dc,nr=r+dr;if(nc<0||nr<0||nc>=m.cols||nr>=m.rows)continue;const j=nr*m.cols+nc;if(m.grid[j]||closed[j])continue;if(dc&&dr&&(m.grid[r*m.cols+nc]||m.grid[nr*m.cols+c]))continue;const ng=g[i]+(dc&&dr?1.414:1);if(ng<g[j]){g[j]=ng;from[j]=i;push(j,ng+h(j))}}}
  if(from[goal]<0&&goal!==start)return null;const cells=[];for(let i=goal;i!==-1;i=from[i]){cells.push(i);if(i===start)break}return cells.reverse();
}
function findPath(a,t){
  const m=makeMap(),cell=p=>[clamp(Math.floor(p.x/m.C),0,m.cols-1),clamp(Math.floor(p.y/m.C),0,m.rows-1)],ctr=([c,r])=>({x:(c+.5)*m.C,y:(r+.5)*m.C});
  let goal={x:clamp(t.x,m.b.x0,m.b.x1),y:clamp(t.y,m.b.y0,m.b.y1)},[gc,gr]=cell(goal);
  if(m.hit(goal.x,goal.y)){const f=nearestFree(m,gc,gr);if(!f)return null;[gc,gr]=f;goal=ctr(f)}
  let [sc,sr]=cell(a);const pre=[],startBlocked=m.hit(a.x,a.y);
  if(startBlocked){const f=nearestFree(m,sc,sr);if(!f)return [a,goal];[sc,sr]=f;pre.push(ctr(f))}
  if(!startBlocked&&clearLine(m,a,goal))return [a,goal];
  let cells=astar(m,sc,sr,gc,gr);
  // Goal cut off (e.g. tightly packed plots on phones): walk to the reachable spot closest to it instead.
  if(!cells){const c=closestReachable(m,sc,sr,goal);if(!c)return null;[gc,gr]=c;goal=ctr(c);cells=astar(m,sc,sr,gc,gr);if(!cells)return null;if(cells.length<2)return pre.length?[a,...pre]:null}
  const pts=[a,...pre,...cells.slice(1,-1).map(i=>ctr([i%m.cols,i/m.cols|0])),goal];
  // String-pulling: keep only the turns that a straight line cannot skip.
  const out=[pts[0]];for(let i=0;i<pts.length-1;){let j=pts.length-1;while(j>i+1&&!clearLine(m,pts[i],pts[j],i?0:m.C))j--;out.push(pts[j]);i=j}
  // Round the corners (one Chaikin pass) wherever the rounded corner is still clear.
  if(out.length<3)return out;const smooth=[out[0]];
  for(let i=1;i<out.length-1;i++){const p=out[i-1],q=out[i],n=out[i+1],k=.3,u={x:q.x+(p.x-q.x)*k,y:q.y+(p.y-q.y)*k},v={x:q.x+(n.x-q.x)*k,y:q.y+(n.y-q.y)*k};if(clearLine(m,u,v)){const mid={x:(u.x+2*q.x+v.x)/4,y:(u.y+2*q.y+v.y)/4};smooth.push(u,mid,v)}else smooth.push(q)}
  smooth.push(out[out.length-1]);return smooth;
}

// ---------- Movement ----------
const mv={x:0,y:0,path:null,cum:null,u:0,speed:0,vx:0,vy:0,zone:'',moving:false,idle:0,held:new Map(),kv:{x:0,y:0},saveAt:0};
// Perspective: the scene is seen from above at an angle, so the farther up the screen, the smaller and slower things
// look (0.84 at the top of the walkable area, 1 at the bottom).
const depth=y=>{const b=bounds();return lerp(.84,1,clamp((y-b.y0)/Math.max(1,b.y1-b.y0),0,1))};
// On the big phone farm trips are longer, so the player runs a bit faster there.
const speeds=()=>{const k=depth(mv.y),r=bigFarm()?3:2.2;return {walk:AH*1.05*k,run:AH*r*k,acc:AH*3.4*k,dec:AH*4.2*k}};
const canMove=()=>OUTDOOR.includes(s.zone)&&!window.farmSync?.blocked&&avatar.style.display!=='none';
function syncFromState(){mv.x=s.pos.x/100*W;mv.y=s.pos.y/100*H}
function writeState(){s.pos.x=Math.round(mv.x/W*1000)/10;s.pos.y=Math.round(mv.y/H*1000)/10}
function goTo(t,onArrive){
  if(!canMove())return false;if(!mv.moving)syncFromState();
  const path=findPath({x:mv.x,y:mv.y},t);mv.onArrive=null;
  if(!path||path.length<2){if(onArrive)setTimeout(onArrive,0);return !!onArrive}
  const cum=[0];for(let i=1;i<path.length;i++)cum.push(cum[i-1]+Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y));
  if(cum[cum.length-1]<1){if(onArrive)setTimeout(onArrive,0);return !!onArrive}
  mv.path=path;mv.cum=cum;mv.u=0;mv.held.clear();mv.onArrive=onArrive||null;mv.runTrip=cum[cum.length-1]>AH*2.4;return true;
}
function pathAt(u){const p=mv.path,c=mv.cum;let i=1;while(i<c.length-1&&c[i]<u)i++;const t=(u-c[i-1])/((c[i]-c[i-1])||1);return {x:p[i-1].x+(p[i].x-p[i-1].x)*t,y:p[i-1].y+(p[i].y-p[i-1].y)*t,dx:p[i].x-p[i-1].x,dy:p[i].y-p[i-1].y}}
// Replaces game.js movePlayer (click on the ground, tap on a plot, village doors): x / y are percentages of the scene.
// onArrive runs once the player has actually walked there; returns true when it will be called.
window.movePlayer=function(x,y=s.pos.y,onArrive){return goTo({x:x/100*W,y:y/100*H},onArrive)};

const KEYS={arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0],arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1]};
const typing=e=>document.getElementById('modal')?.open||e.target?.closest?.('input,textarea,select,[contenteditable=true]');
window.addEventListener('keydown',e=>{const k=KEYS[e.key.toLowerCase()];if(!k||e.ctrlKey||e.metaKey||e.altKey||typing(e)||!canMove())return;e.preventDefault();e.stopPropagation();if(!mv.held.has(e.key.toLowerCase()))mv.held.set(e.key.toLowerCase(),performance.now());mv.path=null;mv.onArrive=null},true);
window.addEventListener('keyup',e=>{mv.held.delete(e.key.toLowerCase())},true);
window.addEventListener('blur',()=>mv.held.clear());

function stepPlayer(dt){
  const sp=speeds();let vx=0,vy=0;
  if(mv.path){
    // Long trips: run, then ease down to a walk about one body length before arriving; braking follows v = sqrt(2·a·d).
    const len=mv.cum[mv.cum.length-1],left=len-mv.u,cruise=mv.runTrip&&left>AH*1.2?sp.run:sp.walk,brake=Math.sqrt(2*sp.dec*.55*Math.max(0,left))+AH*.06;
    mv.speed=approach(mv.speed,cruise,cruise>mv.speed?5.5:6,dt);if(mv.speed>brake)mv.speed=brake;
    mv.u=Math.min(len,mv.u+mv.speed*dt);const p=pathAt(mv.u),d=Math.hypot(p.dx,p.dy)||1;
    mv.x=p.x;mv.y=p.y;vx=p.dx/d*mv.speed;vy=p.dy/d*mv.speed;
    if(mv.u>=len-.01){mv.path=null;mv.speed=0;vx=vy=0;mv.saveAt=performance.now()+120;const done=mv.onArrive;mv.onArrive=null;if(done){writeState();setTimeout(done,60)}}
  }else{
    let dx=0,dy=0,held=0;const now=performance.now();for(const [k,t0] of mv.held){dx+=KEYS[k][0];dy+=KEYS[k][1];held=Math.max(held,now-t0)}
    const n=Math.hypot(dx,dy),target=n?(held>700?sp.run:sp.walk):0,tx=n?dx/n*target:0,ty=n?dy/n*target:0;
    mv.kv.x=approach(mv.kv.x,tx,n?7:9,dt);mv.kv.y=approach(mv.kv.y,ty,n?7:9,dt);
    if(Math.hypot(mv.kv.x,mv.kv.y)<2&&!n){if(mv.kv.x||mv.kv.y)mv.saveAt=performance.now()+120;mv.kv.x=mv.kv.y=0}
    if(mv.kv.x||mv.kv.y){const m=makeMapLite(),nx=mv.x+mv.kv.x*dt,ny=mv.y+mv.kv.y*dt;
      if(!m.hit(nx,ny)){mv.x=nx;mv.y=ny}else if(!m.hit(nx,mv.y)){mv.x=nx;mv.kv.y*=.5}else if(!m.hit(mv.x,ny)){mv.y=ny;mv.kv.x*=.5}else{mv.kv.x=mv.kv.y=0}
      vx=mv.kv.x;vy=mv.kv.y}
    mv.speed=Math.hypot(vx,vy);
  }
  mv.vx=vx;mv.vy=vy;mv.moving=mv.speed>.5;
  if(mv.moving)writeState();
  else if(mv.saveAt&&performance.now()>mv.saveAt){mv.saveAt=0;writeState();try{save()}catch{}}
}
// Collision test for keyboard steering (rebuilt at most every 250 ms; plots don't move while you walk).
let lite=null,liteAt=0;function makeMapLite(){const now=performance.now();if(!lite||now-liteAt>2000){const b=bounds(),obs=obstacles(),pad=clamp(AW*.17,5,12);lite={hit:(x,y)=>x<b.x0||x>b.x1||y<b.y0||y>b.y1||obs.some(r=>x>r.x0-pad&&x<r.x1+pad&&y>r.y0-pad*.5&&y<r.y1+pad*.35)};liteAt=now}return lite}

// ---------- Footfall dust ----------
let lastPhase=0;
function dust(dt){
  const ph=actor.phase,cross=(lastPhase<.5&&ph>=.5)||ph<lastPhase;lastPhase=ph;
  if(reduced||!cross||mv.speed<AH*.6)return;const el=document.createElement('span');el.className='ar-dust';const back=-Math.sign(mv.vx||1);
  el.style.cssText=`left:${mv.x+back*AW*.12}px;top:${mv.y-2}px;--dx:${back*AW*.2}px;--s:${clamp(mv.speed/(AH*2.2),.45,1)}`;world.appendChild(el);setTimeout(()=>el.remove(),650);
}

// ---------- Pets roam independently around the farm ----------
const petLayer=document.createElement('div');petLayer.className='ar-pets';petLayer.setAttribute('aria-hidden','true');world.appendChild(petLayer);
const pets=new Map(),roaming=window.PetRoaming.create();let avatarZ=5,petMap=null;
function syncPets(){
  const owned=Object.entries(F.pets).filter(([k])=>s.pets?.[k]);let i=0;
  for(const [k,d] of owned){if(!pets.has(k)){const src='pets/'+d.art+'.png?v=47.2',el=document.createElement('div');el.className='ar-pet pet-'+k;const base={el,src:src.split('?')[0],x:NaN,y:NaN,vx:0,vy:0,order:i++};
    if(window.World3D){const kind=window.World3D.SPECIES_OF[base.src];if(!kind)continue;petLayer.appendChild(el);el.classList.add('is-3d');pets.set(k,{...base,a:animal3D(el,kind,''),d:{w:13,h:10}});continue}
    el.innerHTML=critterArt(src,'critter',d.name,'',`<img src="${src}" alt="${d.name}">`);const svg=el.querySelector('svg');if(!svg)continue;petLayer.appendChild(el);pets.set(k,{...base,a:new Critter(svg),d:window.XOM_CRITTERS[src.split('?')[0]]})}if(pets.has(k))pets.get(k).order=i++}
  for(const [k,p] of pets)if(!s.pets?.[k]){p.el.remove();pets.delete(k)}
  sizePets();
}
// Pet pictures are 560×560 with the animal in the middle; each is sized so it looks right beside the player.
const PET_SIZE={'pets/black-cat.png':.6,'pets/black-dog.png':.62,'pets/lion.png':.66,'pets/pigeon.png':.42};
function sizePets(){for(const p of pets.values()){const h=AH*(p.a.view?.5:(PET_SIZE[p.src]||.6));p.h=h;p.el.style.height=h+'px';p.el.style.width=h*p.d.w/p.d.h+'px';p.upp=p.d.h/h;if(p.a.view)p.a.px=h}}
function stepPets(dt,show){
  show=show&&s.zone==='farm';if(petLayer.hidden===show)petLayer.hidden=petTips.hidden=!show;if(!show)return;
  if(!petMap){const b=bounds(),obs=obstacles(true),pad=clamp(AW*.12,4,10);petMap={b,hit:(x,y)=>x<b.x0||x>b.x1||y<b.y0||y>b.y1||obs.some(r=>x>r.x0-pad&&x<r.x1+pad&&y>r.y0-pad*.5&&y<r.y1+pad*.35)}}
  for(const p of pets.values()){
    roaming.step(p,dt,petMap.b,petMap.hit,AH*(.3+.04*(p.order%3)));
    if(!Number.isFinite(p.x))continue;
    const v=Math.hypot(p.vx,p.vy);
    if(v>0){if(p.a.steer)p.a.steer(p.vx,p.vy);else p.a.face(Math.sign(p.vx)||1)}
    p.a.update(dt,{speed:v*p.upp,px:v/depth(p.y),idle:v===0});
    p.el.style.transform=`translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) translate(-50%,-100%) scale(${depth(p.y).toFixed(3)})`;p.el.style.zIndex=p.y<mv.y?avatarZ-1:avatarZ+1;
  }
}

// ---------- Pets talk: every few seconds a random pet says something (speech bubble + its voice) ----------
// Each turn waits 4–9 s, picks a pet other than the last one, and shows one of its lines for about 3 s. Lines depend
// on what the pet is doing (walking along or resting by the player).
const PET_TALK={
  cat:{voice:['meow','meow','purr'],walk:['Meo~','Meo meo!','Đi dạo thôi~'],rest:['Meo~ ♥','Prrr… 💤','Meo meo!','Vuốt ve tớ đi~']},
  dog:{voice:['woof'],walk:['Gâu gâu!','Gâu! Đi dạo thôi!','Gâu~ ♪'],rest:['Gâu gâu!','Gâu~ ♥','Chơi ném bóng đi!','Hừm hừm…']},
  lion:{voice:['roar'],walk:['Grừừ~','Gừ gừ!','Grào~'],rest:['Grào~ ♥','Ngáp~ 💤','Gừ gừ…','Grừừ!']},
  pigeon:{voice:['coo'],walk:['Gù gù!','Gù gù~','Cúc cu~'],rest:['Gù gù~ ♪','Gù~ ♥','Cúc cu!']}
};
const petTalk={next:performance.now()+2500+Math.random()*3000,last:'',bubble:null,lastLine:''};
// Bubbles live in their own layer above the player, following their pet, so a pet behind the player is still heard.
const petTips=document.createElement('div');petTips.className='ar-pet-tips';petTips.setAttribute('aria-hidden','true');world.appendChild(petTips);
function stepPetTalk(now,show){
  const b=petTalk.bubble;
  if(b&&(now>=b.end||!show||!pets.has(b.k))){b.el.classList.add('tip-out');const el=b.anchor;setTimeout(()=>el.remove(),260);petTalk.bubble=null}
  else if(b){const p=pets.get(b.k);b.anchor.style.transform=`translate3d(${p.x.toFixed(1)}px,${(p.y-p.h*depth(p.y)*.9).toFixed(1)}px,0)`}
  if(!show||document.hidden||now<petTalk.next||petTalk.bubble||!pets.size)return;
  const keys=[...pets.keys()].filter(k=>PET_TALK[k]),pick=keys.filter(k=>k!==petTalk.last);if(!keys.length)return;
  const k=(pick.length?pick:keys)[Math.floor(Math.random()*(pick.length||keys.length))],p=pets.get(k),T=PET_TALK[k];
  const pool=(Math.hypot(p.vx,p.vy)<1?T.rest:T.walk).filter(x=>x!==petTalk.lastLine),line=pool[Math.floor(Math.random()*pool.length)];
  const el=document.createElement('span');el.className='herd-tip pet-tip tip-fed';el.textContent=line;el.style.setProperty('--tip-delay',(-Math.random()*2.6).toFixed(2)+'s');const anchor=document.createElement('div');anchor.className='pet-tip-anchor';anchor.appendChild(el);petTips.appendChild(anchor);
  anchor.style.transform=`translate3d(${p.x.toFixed(1)}px,${(p.y-p.h*depth(p.y)*.9).toFixed(1)}px,0)`;
  petTalk.bubble={el,anchor,k,end:now+2600+Math.random()*900};petTalk.last=k;petTalk.lastLine=line;petTalk.next=now+4000+Math.random()*5000;
  window.farmAudio?.effect?.(T.voice[Math.floor(Math.random()*T.voice.length)]);
}

// ---------- Everything else on screen: wardrobe / shop previews breathe, herd animals wander their pens ----------
const live=new Set(),herd=new Map(),herds=new Set(),talk=new Map(),herdStyle=new WeakMap();let dirty=true,scanAt=0,odd=false;
new MutationObserver(muts=>{for(const m of muts)for(const n of m.addedNodes)if(n.nodeType===1&&!n.classList?.contains('ar-dust')&&!n.classList?.contains('herd-tip')){dirty=true;return}}).observe(document.body,{childList:true,subtree:true});
function rescan(now){
  dirty=false;scanAt=now;
  document.querySelectorAll('svg[data-critter],svg[data-ar-animal]').forEach(el=>{if(petLayer.contains(el))return;if(animate(el))live.add(el)});
  // Layout is read here (a few times a second), never inside the per-frame loop.
  for(const el of live){if(!el.isConnected){live.delete(el);continue}const box=el.parentElement;el._arVis=!!(box&&box.getClientRects().length);el._arHerd=!!el.closest('.herd');if(el._arHerd){const r=(el._ar?.box||el).getBoundingClientRect(),slot=el.parentElement.classList.contains('herd-slot')?el.parentElement:el;if(el._ar?.box)el._ar.px=r.height||el._ar.px;el._arW=r.width||40;el._arH=r.height||32;el._arKey=(el.getAttribute('aria-label')||'')+(el.closest('.pen-portrait')?'|p':'|b');el._arBox=slot}}
  herds.clear();document.querySelectorAll('.herd[data-tips]').forEach(h=>{if(!h.getClientRects().length)return;const pen=h.parentElement,w=pen.getBoundingClientRect().width;h._key=(h.closest('[data-key]')?.dataset.key||pen.querySelector('.paddock-base')?.alt||'')+(h.closest('.pen-portrait')?'|p':'|b');h._mood=h.dataset.mood;h._tips=h.dataset.tips?h.dataset.tips.split('|'):[];h._cols=parseInt(h.style.getPropertyValue('--herd-cols'))||3;h._max=w>250?2:1;herds.add(h)});
  if(herd.size>400)herd.clear();
}
// Plumpness per mood (PLUMP above) is kept per animal across re-renders so feeding visibly fattens the herd.
function stepHerd(el,a,dt){
  const key=el._arKey,hungry=a.mood==='hungry',plump=PLUMP[a.mood]||0;let h=herd.get(key);
  const w=el._arW,ht=el._arH,bx=w*.42,by=ht*.24;
  if(!h){h={x:(Math.random()*2-1)*bx*.6,y:(Math.random()*2-1)*by*.6,v:0,wait:Math.random()*4,tx:0,ty:0,go:false,plump};herd.set(key,h)}
  h.plump=approach(h.plump,plump,2.2,dt);
  if(!h.go){h.wait-=dt;if(h.wait<=0){h.tx=(Math.random()*2-1)*bx;h.ty=(Math.random()*2-1)*by;h.go=true}}
  let want=0;const dx=h.tx-h.x,dy=h.ty-h.y,d=Math.hypot(dx,dy);
  // Hungry animals shuffle slowly and stand around longer.
  if(h.go){if(d<.8){h.go=false;h.wait=(hungry?4:2.5)+Math.random()*5}else{want=Math.min(ht*(hungry?.3:.55),d*2.4);if(Math.abs(dx)>.6){if(a.steer)a.steer(dx,dy*1.6);else a.face(Math.sign(dx))}}}
  h.v=approach(h.v,want,5,dt);if(d>.01){const st=Math.min(d,h.v*dt);h.x+=dx/d*st;h.y+=dy/d*st}
  const box=el._arBox||el;setStyle(herdStyle,box,'transform',`translate(${h.x.toFixed(1)}px,${h.y.toFixed(1)}px)`);setStyle(herdStyle,box,'zIndex',String(Math.round(60+h.y+(box._tip?300:0))));
  const vb=el.viewBox?.baseVal;a.update(dt,{speed:h.v*(vb?vb.height/ht:1),px:h.v,plump:h.plump});
}
// Speech bubbles: every second or two a random animal in each pen says one of the herd's lines (game.js herdTips)
// for a few seconds, then another animal takes a turn. Bubbles survive re-renders and switch at once when the mood
// changes (feed the herd and someone immediately says it's full).
function bubbleEl(html,mood,pop){const b=document.createElement('span');b.className='herd-tip tip-'+mood+(pop?'':' tip-keep');b.innerHTML=html;b.style.setProperty('--tip-delay',(-Math.random()*2.6).toFixed(2)+'s');return b}
function dropBubble(b){const el=b.el;if(!el)return;if(el.parentElement)el.parentElement._tip=false;el.classList.add('tip-out');setTimeout(()=>el.remove(),260)}
function stepTalk(now){
  for(const h of herds){
    if(!h.isConnected||!h._tips.length)continue;const slots=h.children;if(!slots.length)continue;
    let st=talk.get(h._key);if(!st){st={mood:h._mood,next:now+200+Math.random()*1000,bubbles:[]};talk.set(h._key,st)}
    if(st.mood!==h._mood){st.mood=h._mood;st.bubbles.forEach(dropBubble);st.bubbles=[];st.next=now+150}
    st.bubbles=st.bubbles.filter(b=>{if(now>=b.end||!slots[b.i]){dropBubble(b);return false}const slot=slots[b.i];if(!b.el||!b.el.isConnected||b.el.parentElement!==slot){b.el=bubbleEl(b.html,h._mood,false);slot.appendChild(b.el);slot._tip=true}return true});
    const max=Math.min(h._max,slots.length<4?1:2);
    if(now>=st.next&&st.bubbles.length<max){
      // Skip animals whose bubble would overlap one already showing (measured on screen; this runs once per spawn).
      const shown=st.bubbles.map(x=>x.el.getBoundingClientRect()),near=i=>{const r=slots[i].getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height*.28-10;return shown.some(q=>Math.abs(cx-(q.left+q.width/2))<q.width*1.1&&Math.abs(cy-(q.top+q.height/2))<q.height*1.8)},free=[...slots].map((_,i)=>i).filter(i=>i!==st.last&&!near(i));
      const lines=h._tips.filter(x=>!st.bubbles.some(b=>b.html===x)&&x!==st.lastLine);
      if(free.length&&lines.length){const i=free[Math.floor(Math.random()*free.length)],html=lines[Math.floor(Math.random()*lines.length)],b={i,html,end:now+2600+Math.random()*1800,el:bubbleEl(html,h._mood,true)};slots[i].appendChild(b.el);slots[i]._tip=true;st.bubbles.push(b);st.last=i;st.lastLine=html}
      st.next=now+800+Math.random()*1600;
    }
  }
}
function stepLive(dt,now){
  if(dirty&&now-scanAt>150||now-scanAt>1500)rescan(now);
  stepTalk(now);
  odd=!odd;
  for(const el of live){if(!el._arVis||!el._ar)continue;const a=el._ar;
    if(el._arHerd){if(odd)stepHerd(el,a,dt*2)}
    else if(odd)a.update(dt*2,{speed:0})}
}

// ---------- Camera: keep the walking player in view on wide (scrolling) maps ----------
// The view does not chase the player while walking (players swipe to look around). It only centres on the player once
// when a scene opens or the phone farm map changes size, so the character starts on screen.
function follow(dt,snap){
  if(!stage||!snap)return;
  const k=snap?1:1-Math.exp(-(reduced?60:5)*dt),wr=world.getBoundingClientRect(),sr=stage.getBoundingClientRect(),kx=wr.width/W,ky=wr.height/H;
  if(zoom.on&&zoom.fits){zoom.centre();zoom.clamp();return}
  if(stage.scrollWidth>stage.clientWidth+4){const ax=wr.left-sr.left+mv.x*kx,lo=stage.clientWidth*(snap?.5:.3),hi=stage.clientWidth*(snap?.5:.7),want=ax<lo?stage.scrollLeft-(lo-ax):ax>hi?stage.scrollLeft+(ax-hi):stage.scrollLeft;if(want!==stage.scrollLeft)stage.scrollLeft+=(want-stage.scrollLeft)*k}
  if(stage.scrollHeight>stage.clientHeight+4){const ay=wr.top-sr.top+(mv.y-AH*.5)*ky,lo=stage.clientHeight*(snap?.5:.32),hi=stage.clientHeight*(snap?.5:.68),want=ay<lo?stage.scrollTop-(lo-ay):ay>hi?stage.scrollTop+(ay-hi):stage.scrollTop;if(want!==stage.scrollTop)stage.scrollTop+=(want-stage.scrollTop)*k}
}

// ---------- Farm zoom (+ / −) ----------
// When the field does not fit the screen (phones, landscape tablets), five zoom steps go from life size down to the scale
// at which every plot of the current field is in view. The scene is scaled with a transform, so walking, plots and the
// camera keep working in the scene's own coordinates. The step is remembered on this device.
// Dragging stops at the edges of the farm picture by itself: the farm clips what reaches past it (CSS), and a scaled
// scene is taken out of the flow so the stage's scroll area is exactly the scaled picture. Nothing is corrected while a
// finger drags; one check runs after the drag ends.
const zoom={on:false,level:0,fit:1,fits:false,scale:1,el:null,key:'lm-farm-zoom',
  steps(){const f=this.fit;return [1,1-(1-f)*.25,1-(1-f)*.5,1-(1-f)*.75,f]},
  // The part of the stage the player actually sees: below the zone bar, above the bottom bar (both float over it).
  view(){const sr=stage.getBoundingClientRect();let t=sr.top,b=sr.bottom;
    for(const el of [document.querySelector('.zone-nav'),document.querySelector('header')]){const r=el?.getBoundingClientRect();if(r&&r.height&&r.bottom>t&&r.top<t+20)t=Math.max(t,r.bottom)}
    const pb=document.querySelector('.play-bottom')?.getBoundingClientRect();if(pb&&pb.height&&pb.top<b&&pb.bottom>b-20)b=Math.min(b,pb.top);
    return {l:sr.left,r:sr.right,t,b,w:sr.width,h:Math.max(1,b-t),sr}},
  // world-space box of the plots (unscaled), from their boxes on screen
  field(){const ps=world.querySelectorAll('#scene [data-action="plot"]');if(!ps.length)return null;const wr=world.getBoundingClientRect(),k=wr.width/W||1;let l=1e9,t=1e9,r=-1e9,b=-1e9;for(const p of ps){const q=p.getBoundingClientRect();if(!q.width)continue;l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);b=Math.max(b,q.bottom)}if(r<l)return null;return {l:(l-wr.left)/k,t:(t-wr.top)/k,r:(r-wr.left)/k,b:(b-wr.top)/k}},
  ui(){if(this.el)return this.el;const el=document.createElement('div');el.className='farm-zoom';el.setAttribute('role','group');el.setAttribute('aria-label','Thu phóng vườn');
    el.innerHTML='<button type="button" data-zoom="in" aria-label="Phóng to">+</button><span aria-live="polite"></span><button type="button" data-zoom="out" aria-label="Thu nhỏ">−</button>';
    el.addEventListener('click',e=>{const b=e.target.closest('[data-zoom]');if(!b||b.disabled)return;e.stopPropagation();this.set(this.level+(b.dataset.zoom==='out'?1:-1))});
    (document.querySelector('.game')||document.body).appendChild(el);return this.el=el},
  // back to the scene's own layout (life size, in the flow)
  natural(){for(const p of ['transform','transform-origin','position','left','top','width','height'])world.style.removeProperty(p);this.scale=1},
  off(){this.on=false;this.natural();if(this.el)this.el.hidden=true},
  // Re-measure after renders and resizes: does the field fit the visible part of the screen, and if not, down to what
  // scale? Nothing moves unless that answer changed.
  update(force,keep){
    if(s.zone!=='farm'){if(this.on||this.el&&!this.el.hidden)this.off();return}
    const f=this.field(),v=this.view();if(!f||v.w<2)return;
    const fw=f.r-f.l,fh=f.b-f.t;
    if(fw<=v.w&&fh<=v.h){if(this.on)this.off();return}            // every plot already visible at life size
    const pad=Math.max(10,Math.min(v.w,v.h)*.04);
    // smallest step: the whole field in view; where the farm picture can still cover the whole screen at a scale that
    // shows every plot, stop there instead, so no empty band appears round the picture
    const fit=Math.min(v.w/(fw+pad*2),v.h/(fh+pad*2+AH*.35)),cover=Math.max(v.w/W,v.h/H);
    const want=Math.max(.3,Math.min(.95,cover<1&&fw*cover<=v.w&&fh*cover<=v.h?Math.max(fit,cover):fit)),changed=!this.on||force||Math.abs(want-this.fit)>.005;
    this.fit=want;this.on=true;
    if(this.restored===undefined){let n=0;try{n=+localStorage.getItem(this.key)||0}catch{}this.level=Math.max(0,Math.min(4,n));this.restored=true}
    const el=this.ui();el.hidden=false;const g=el.offsetParent?.getBoundingClientRect();if(g)el.style.top=Math.round(v.t-g.top+8)+'px';
    if(changed)this.apply(keep||false);
  },
  // the world point in the middle of the visible area
  middle(){const v=this.view(),wr=world.getBoundingClientRect(),k=wr.width/W||1;return {x:((v.l+v.r)/2-wr.left)/k,y:((v.t+v.b)/2-wr.top)/k}},
  apply(keepView){
    cancelAnimationFrame(pan.raf);const z=this.steps()[this.level],v=this.view();
    // the point of the scene in the middle of the visible area stays there while zooming
    const wr=world.getBoundingClientRect(),k=wr.width/W||1,cx=((v.l+v.r)/2-wr.left)/k,cy=((v.t+v.b)/2-wr.top)/k;
    if(z>=.999)this.natural();
    else{
      // out of the flow at its own size, scaled about the top-left corner; narrower / shorter than the visible area: centred
      const top=v.t-v.sr.top,tx=Math.max(0,(v.w-W*z)/2),ty=Math.max(0,top+(v.h-H*z)/2);
      Object.assign(world.style,{position:'absolute',left:'0',top:'0',width:W+'px',height:H+'px',transformOrigin:'0 0',transform:`translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${z.toFixed(4)})`});
      this.scale=z;
    }
    const f=this.field();this.fits=!!f&&(f.r-f.l)*z<=v.w+1&&(f.b-f.t)*z<=v.h+1;
    if(this.fits)this.centre();else if(keepView&&typeof keepView==='object')this.look(keepView.x,keepView.y);else if(keepView)this.look(cx,cy);this.clamp();
    const el=this.el;if(el){el.querySelector('[data-zoom="in"]').disabled=this.level===0;el.querySelector('[data-zoom="out"]').disabled=this.level===4;el.querySelector('span').textContent=Math.round(z*100)+'%'}
  },
  // scroll so that world point (x, y) sits in the middle of the visible area
  look(x,y){const v=this.view(),wr=world.getBoundingClientRect(),k=wr.width/W||1;stage.scrollLeft+=wr.left+x*k-(v.l+v.r)/2;stage.scrollTop+=wr.top+y*k-(v.t+v.b)/2},
  // the whole field fits: keep it in the middle of the visible area
  centre(){const f=this.field();if(f)this.look((f.l+f.r)/2,(f.t+f.b)/2)},
  set(l){l=Math.max(0,Math.min(4,l));if(l===this.level)return;this.level=l;try{localStorage.setItem(this.key,String(l))}catch{}this.apply(true);dirty=true},
  // Safety net, run once after a drag ends (and after zooming): an edge of the farm picture inside the visible area is
  // pulled back to the edge of the screen.
  clamp(){
    if(s.zone!=='farm')return;const img=document.getElementById('scenery');if(!img)return;const p=img.getBoundingClientRect();if(!p.width)return;const v=this.view();
    const dx=p.width<=v.w?(p.left+p.right-v.l-v.r)/2:p.left>v.l?p.left-v.l:p.right<v.r?p.right-v.r:0,dy=p.height<=v.h?(p.top+p.bottom-v.t-v.b)/2:p.top>v.t?p.top-v.t:p.bottom<v.b?p.bottom-v.b:0;
    if(Math.abs(dx)>=1)stage.scrollLeft+=dx;if(Math.abs(dy)>=1)stage.scrollTop+=dy;
  }
};
// debounce: the safety check waits until the drag (and its momentum) has stopped for 200 ms
let clampLater=0;stage?.addEventListener('scroll',()=>{if(s.zone!=='farm')return;clearTimeout(clampLater);clampLater=setTimeout(()=>zoom.clamp(),200)},{passive:true});
window.farmZoom=zoom;
// Touch panning on the farm is done here rather than by the browser (the farm stage has touch-action:none in CSS): the
// stage follows the finger, a flick glides on and slows down, and everything stops dead at the edge of the farm
// picture — no rubber-band bounce that would show what lies behind the farm. A tap still reaches the plots as a click.
const pan={id:null,x:0,y:0,t:0,vx:0,vy:0,sx:0,sy:0,raf:0};
// move the stage to (x, y), kept as floats so slow drags add up; reports which sides ran into the edge
const panTo=(x,y)=>{stage.scrollLeft=x;stage.scrollTop=y;const ax=stage.scrollLeft,ay=stage.scrollTop,hx=Math.abs(ax-x)>=1,hy=Math.abs(ay-y)>=1;pan.sx=hx?ax:x;pan.sy=hy?ay:y;return [hx,hy]};
const farmPan=()=>s.zone==='farm'&&stage;
stage?.addEventListener('touchstart',e=>{if(!farmPan()||e.touches.length!==1){pan.id=null;return}cancelAnimationFrame(pan.raf);const t=e.touches[0];Object.assign(pan,{id:t.identifier,x:t.clientX,y:t.clientY,t:performance.now(),vx:0,vy:0,sx:stage.scrollLeft,sy:stage.scrollTop})},{passive:true});
stage?.addEventListener('touchmove',e=>{if(pan.id===null)return;const t=[...e.touches].find(q=>q.identifier===pan.id);if(!t||e.touches.length!==1){pan.id=null;return}
  const now=performance.now(),dx=t.clientX-pan.x,dy=t.clientY-pan.y,dt=Math.max(8,now-pan.t);panTo(pan.sx-dx,pan.sy-dy);
  pan.vx=pan.vx*.5+(-dx/dt)*.5;pan.vy=pan.vy*.5+(-dy/dt)*.5;pan.x=t.clientX;pan.y=t.clientY;pan.t=now},{passive:true});
const panEnd=()=>{if(pan.id===null)return;pan.id=null;if(performance.now()-pan.t>90)return;
  let last=performance.now();const step=now=>{const dt=Math.min(32,now-last);last=now;const k=Math.pow(.994,dt);pan.vx*=k;pan.vy*=k;
    if(Math.hypot(pan.vx,pan.vy)<.03||s.zone!=='farm')return;const [hx,hy]=panTo(pan.sx+pan.vx*dt,pan.sy+pan.vy*dt);if(hx)pan.vx=0;if(hy)pan.vy=0;pan.raf=requestAnimationFrame(step)};
  pan.raf=requestAnimationFrame(step)};
stage?.addEventListener('touchend',panEnd,{passive:true});stage?.addEventListener('touchcancel',panEnd,{passive:true});
// Two fingers on the farm change the farm's zoom step (about one step per 30% of pinch) instead of zooming the whole page;
// Safari's own page pinch-zoom is switched off (it ignores touch-action for that), so a page zoomed in by accident can
// never be dragged past the farm either.
const pinch={d:0,base:0,on:false};
const pinchStep=r=>{if(!zoom.on)return;const n=Math.round(Math.log(r)/Math.log(1.3));zoom.set(pinch.base-n)};
const gap=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
stage?.addEventListener('touchstart',e=>{if(s.zone!=='farm'||e.touches.length!==2)return;cancelAnimationFrame(pan.raf);pan.id=null;pinch.on=true;pinch.d=gap(e.touches)||1;pinch.base=zoom.level},{passive:true});
stage?.addEventListener('touchmove',e=>{if(!pinch.on||e.touches.length!==2||'ongesturechange' in window)return;pinchStep(gap(e.touches)/pinch.d)},{passive:true});
stage?.addEventListener('touchend',e=>{if(e.touches.length<2)pinch.on=false},{passive:true});
for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,e=>{e.preventDefault();if(s.zone!=='farm')return;if(type==='gesturestart')pinch.base=zoom.level;else if(type==='gesturechange')pinchStep(e.scale)},{passive:false});
// debounce: renders come in bursts; measure 250 ms after the last one (newly added plots have finished popping in by
// then); a resize or rotation re-applies the scale for the new screen.
let zoomLater=0,zoomForce=false,stageSize='';const queueZoom=e=>{if(e?.type){const sz=stage?stage.clientWidth+'x'+stage.clientHeight:'';if(sz===stageSize&&!zoomForce)return;stageSize=sz;zoomForce=true}clearTimeout(zoomLater);zoomLater=setTimeout(()=>{const f=zoomForce;zoomForce=false;let keep=null;if(f&&zoom.on){keep=zoom.middle();zoom.natural()}zoom.update(f,keep)},e?.type?150:250)};
window.addEventListener('resize',queueZoom);window.addEventListener('orientationchange',queueZoom);
// ---------- Game hooks ----------
const baseRender=window.render;
if(typeof baseRender==='function')window.render=function(...args){const out=baseRender.apply(this,args);actor.setLook();syncPets();dirty=true;lite=null;petMap=null;queueZoom();return out};
let cheering=false;new MutationObserver(()=>{const on=avatar.classList.contains('action-cheer');if(on&&!cheering)actor.cheer();cheering=on}).observe(avatar,{attributes:true,attributeFilter:['class']});

// ---------- Main loop ----------
let last=performance.now();
// While the player moves, every display frame (the walk must stay smooth); otherwise a slower tick for pets and herds.
function scheduleAnimation(){if(!document.hidden&&(mv.moving||mv.path||mv.held.size)){requestAnimationFrame(frame);return}setTimeout(()=>requestAnimationFrame(frame),document.hidden?1000:(s.zone==='farm'&&[...pets.values()].some(p=>p.target)?50:100));}
function frame(now){
  if(document.hidden||now-(frame.lastDraw||0)<30){scheduleAnimation();return}frame.lastDraw=now;
  const dt=Math.min(.12,Math.max(0,(now-last)/1000));last=now;
  const show=OUTDOOR.includes(s.zone)&&avatar.style.display!=='none';if(player3d){player3d.view.active=show&&(mv.moving||!!mv.path||cheering);player3d.view.suspended=!show}
  if(s.zone!==mv.zone){snapReq=now+120;mv.zone=s.zone;mv.path=null;mv.onArrive=null;avatarZ=+getComputedStyle(avatar).zIndex||5;mv.speed=0;mv.held.clear();mv.kv.x=mv.kv.y=0;measure();syncFromState();lite=null;petMap=null;for(const p of pets.values()){p.target=null}}
  if(show){
    if(!mv.moving&&!mv.path&&!mv.saveAt)syncFromState();
    stepPlayer(dt);
    const k=depth(mv.y);avatar.style.setProperty('--ar-x',mv.x.toFixed(1)+'px');avatar.style.setProperty('--ar-y',mv.y.toFixed(1)+'px');avatar.style.setProperty('--ar-s',k.toFixed(3));
    if(mv.moving){const v=mv.speed,dir=Math.abs(mv.vx)>v*.22?Math.sign(mv.vx):player.st.flip;actor.face(dir,mv.vx,mv.vy);avatar.setAttribute('data-facing',dir<0?'left':'right')}
    // Footsteps: a soft tap on each footfall (the audio module keeps it quiet and respects the sound settings).
    if(snapReq&&now>=snapReq){snapReq=0;if(!mv.moving&&!mv.path)syncFromState();follow(0,true)}
    if(actor.update(dt,{speed:mv.speed/k,AH})&&mv.speed>AH*.3)window.farmAudio?.effect?.('step');dust(dt);follow(dt);
  }
  stepPets(dt,show);stepPetTalk(now,show);stepLive(dt,now);
  scheduleAnimation();
}
syncPets();syncFromState();scheduleAnimation();
})();
