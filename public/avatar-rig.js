'use strict';
// Avatar-style paper dolls. Characters and animals are SVG drawings re-posed every frame from a small skeleton
// (hips, knees, ankles, shoulders, elbows, neck, tail), so walking, running, turning and idling stay smooth at any
// speed. This file only draws and animates; avatar-world.js moves the player, walks the pets and wires the shops.
(function(root){
const INK='#5a3920',SKIN='#ffdcbc',SKIN2='#f0bc98',BLUSH='#f59a92',HAIR='#4b2e1c',HAIR2='#33200f',HAIR3='#7d5236';
const TAU=Math.PI*2,RAD=Math.PI/180;
const r2=n=>Math.round(n*100)/100,clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
let seq=0;
const uid=()=>'ar'+(++seq).toString(36)+Math.random().toString(36).slice(2,5);

// ---------- Geometry ----------
const pt=p=>r2(p[0])+' '+r2(p[1]);
// "Rubber hose" limb: a quadratic curve that passes through the middle joint, so knees and elbows bend smoothly.
const hose=(a,j,b)=>[a,[2*j[0]-(a[0]+b[0])/2,2*j[1]-(a[1]+b[1])/2],b];
const qd=q=>'M'+pt(q[0])+'Q'+pt(q[1])+' '+pt(q[2]);
// Piece of a quadratic curve between t0 and t1 (blossoming), used for sleeves, shorts, cuffs and boot shafts.
function qsub(q,t0,t1){const b=(s,t)=>{const a=(1-s)*(1-t),m=(1-s)*t+s*(1-t),c=s*t;return [a*q[0][0]+m*q[1][0]+c*q[2][0],a*q[0][1]+m*q[1][1]+c*q[2][1]]};return [b(t0,t0),b(t0,t1),b(t1,t1)]}
// Two-bone IK: joint position for a limb from h to a with segment lengths l1, l2; bend picks the side the joint pokes out.
function ik(h,a,l1,l2,bend){let dx=a[0]-h[0],dy=a[1]-h[1],d=Math.hypot(dx,dy)||1e-6;const max=(l1+l2)*.999;if(d>max){dx*=max/d;dy*=max/d;d=max;a=[h[0]+dx,h[1]+dy]}const x=(l1*l1-l2*l2+d*d)/(2*d),y=Math.sqrt(Math.max(0,l1*l1-x*x));return [[h[0]+dx*x/d-bend*dy*y/d,h[1]+dy*x/d+bend*dx*y/d],a]}
const rot=(p,deg)=>{const c=Math.cos(deg*RAD),s=Math.sin(deg*RAD);return [p[0]*c-p[1]*s,p[0]*s+p[1]*c]};
// One foot over a gait cycle: planted and sliding back under the body for `stance` of the cycle, then swung forward.
function foot(p,stance){p-=Math.floor(p);if(p<stance)return {x:.5-p/stance,lift:0,plant:1,u:p/stance};const u=(p-stance)/(1-stance);return {x:-.5+ease(u),lift:Math.sin(Math.PI*u),plant:0,u}}
// Critically-damped-ish spring for follow-through (hair, áo dài panels, tails).
function spring(s,target,k,c,dt){for(let i=0;i<2;i++){const h=dt/2,a=k*(target-s.x)-c*s.v;s.v+=a*h;s.x+=s.v*h}return s.x}
const approach=(v,t,rate,dt)=>v+(t-v)*(1-Math.exp(-rate*dt));
function shade(hex,f){const n=parseInt(hex.slice(1),16),c=x=>Math.round(clamp(x*f,0,255)).toString(16).padStart(2,'0');return '#'+c(n>>16)+c(n>>8&255)+c(n&255)}

// ---------- Markup helpers ----------
const OL=`stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"`;
const pth=(d,f,x='')=>`<path d="${d}" fill="${f}" ${OL}${x}/>`;
const ell=(cx,cy,rx,ry,f,x='')=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" ${OL}${x}/>`;
const dot=(cx,cy,r,f,x='')=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${x}/>`;
const ln=(d,c,w,x='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function A(D,k){let s=` data-k="${k}"`;const a=D[k];if(a)for(const n in a)s+=` ${n}="${a[n]}"`;return s}
// Scalloped edge along an ellipse arc (angles in degrees, SVG orientation: 90 = down, 270 = up).
function bumps(cx,cy,rx,ry,a0,a1,n,amp,move=true){let d='';for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*RAD,p=[cx+rx*Math.cos(a),cy+ry*Math.sin(a)];if(!i){d+=(move?'M':'L')+pt(p);continue}const m=(a0+(a1-a0)*(i-.5)/n)*RAD;d+='Q'+pt([cx+(rx+amp)*Math.cos(m),cy+(ry+amp)*Math.sin(m)])+' '+pt(p)}return d}
// Scalloped straight edge (curly fringe, wool).
function wave(x0,y0,x1,y1,n,amp){let d='';for(let i=1;i<=n;i++){const t=i/n,m=(i-.5)/n;d+='Q'+pt([lerp(x0,x1,m),lerp(y0,y1,m)+amp])+' '+pt([lerp(x0,x1,t),lerp(y0,y1,t)])}return d}

// ---------- Wardrobe catalogue (keys match Farm.outfits / hairStyles / footwear) ----------
// Values given as {female, male} differ by character. `shoe` is what the outfit wears when no shop shoes are on.
const OUTFITS={
  base:{hat:1,top:'tunic',c:'#5fb3a8',c2:'#418f86',trim:'#2e6c65',sleeve:'short',bottom:'shorts',b:'#8d5b3a',b2:'#6d4329',shoe:'sandals'},
  green:{hat:1,top:'overalls',under:'#fff3dc',c:'#5f8f3e',c2:'#47702d',btn:'#e9c46a',bottom:'pants',b:'#5f8f3e',b2:'#47702d',shoe:'farmboots'},
  denim:{hat:1,top:'overalls',under:'#fff3dc',c:'#5d87ba',c2:'#456b9a',btn:'#e9c46a',bottom:'pants',b:'#5d87ba',b2:'#456b9a',shoe:'farmboots'},
  festival:{hat:1,top:'aodai',c:'#8e3fa8',c2:'#6c2b85',motif:'#f4c55c',bottom:'wide',b:'#fbf0d9',b2:'#e6d3b0',shoe:'loafers-brown'},
  master:{hat:1,top:'sash',c:'#f2a33a',c2:'#d07f1f',sash:'#8a4a1f',sleeve:'short',bottom:'baggy',b:'#7a4a2a',b2:'#5c341c',shoe:'farmboots'},
  casual:{hat:1,top:'tee',c:'#f2836b',c2:'#d6624d',pocket:1,collar:{female:1,male:0},sleeve:'short',bottom:'jeans',b:'#4f80c0',b2:'#3b659b',cuff:'#86aadb',shoe:'sneakers'},
  sport:{hat:1,top:'track',c:'#2f63c4',c2:'#234d9c',inner:'#ffffff',stripe:'#ffffff',sleeve:'long',bottom:'track',b:'#2f63c4',b2:'#234d9c',shoe:'running'},
  aodai:{hat:1,top:'aodai',c:'#6c3a9e',c2:'#512a7c',motif:'#f4c55c',dragon:1,bottom:'wide',b:'#fbf0d9',b2:'#e6d3b0',shoe:'loafers-brown'},
  cardigan:{hat:1,top:'cardigan',c:'#f6e3bd',c2:'#e0c592',inner:'#ffffff',sleeve:'long',bottom:{female:'skirt',male:'pants'},b:'#8d5b3a',b2:'#6d4329',motif:'#f2d6a8',shoe:'loafers-brown'},
  denimjacket:{hat:1,top:'jacket',c:'#5b85c0',c2:'#45699c',inner:'#ffffff',sleeve:'long',bottom:'jeans',b:'#41689f',b2:'#30507e',cuff:'#6f93c8',shoe:'farmboots'},
  redfestival:{hat:1,top:'aodai',c:'#d8403a',c2:'#ad2c26',motif:'#f6c453',bottom:'wide',b:'#fbf0d9',b2:'#e6d3b0',shoe:'festive'},
  hoodie:{top:'hoodie',c:'#30497a',c2:'#22365e',sleeve:'long',bottom:'shorts',b:'#7a5236',b2:'#5c3c26',shoe:'sandals'},
  overalls:{top:'overalls',under:'#fff8ea',c:'#c99b5f',c2:'#a77b45',btn:'#7a5236',bottom:'shorts',b:'#c99b5f',b2:'#a77b45',shoe:'sandals'},
  stripes:{top:'tee',stripes:'#30497a',c:'#ffffff',c2:'#e3e7ef',sleeve:'short',bottom:'shorts',b:'#7a5236',b2:'#5c3c26',shoe:'sandals'},
  silk:{top:'aodai',c:{female:'#f7b8c8',male:'#30508c'},c2:{female:'#e693a8',male:'#223b6a'},motif:{female:'#ffffff',male:'#a9c0e8'},bottom:'wide',b:'#ffffff',b2:'#e4e6ee',shoe:'loafers'},
  moon:{hat:1,top:'aodai',c:'#2f53a0',c2:'#223c7c',motif:'#f4c55c',bottom:'wide',b:'#fbf0d9',b2:'#e6d3b0',shoe:'loafers-brown'},
  jade:{hat:1,top:'overalls',under:'#fff3dc',c:'#2f8c5c',c2:'#226c46',btn:'#f4c55c',bottom:'pants',b:'#2f8c5c',b2:'#226c46',shoe:'farmboots'},
  legend:{hat:1,top:'sash',c:'#d6443c',c2:'#ad2f2a',sash:'#f4c55c',sleeve:'short',bottom:'baggy',b:'#6b2f2a',b2:'#4f201c',shoe:'farmboots'}
};
const SHOES={
  sandals:{type:'sandal',c:'#8b5a33',c2:'#6b4226'},
  sneakers:{type:'sneaker',c:'#fbf8f0',c2:'#ddd5c6',sole:'#d8cdb8',lace:'#c9bea9'},
  boots:{type:'boot',c:'#f3c230',c2:'#cf9a17'},
  farmboots:{type:'boot',c:'#7d4b2a',c2:'#5a331b'},
  running:{type:'sneaker',c:'#3a78d6',c2:'#2a5cab',sole:'#ffffff',lace:'#ffffff',stripe:'#ffffff'},
  loafers:{type:'loafer',c:'#2d2523',c2:'#1a1514',shine:'#7a6c66'},
  'loafers-brown':{type:'loafer',c:'#7d4b2a',c2:'#5a331b',shine:'#b07f55'},
  festive:{type:'loafer',c:'#d8403a',c2:'#ad2c26',shine:'#f6c453',strap:'#f6c453'}
};
// Leg coverings: pe = how far down the leg (0 hip .. 1 ankle), w = extra width over the bare leg.
const BOTTOMS={shorts:{pe:.5,w:3.4},pants:{pe:.97,w:2.6},jeans:{pe:.95,w:2.6,cuff:[.8,.93]},baggy:{pe:.9,w:5,cuff:[.82,.92]},wide:{pe:1,w:5.2},track:{pe:.97,w:2.8,stripe:1},skirt:{pe:0,w:0}};
const DEFAULT_HAIR={female:'bob',male:'short'};

// ---------- Hair (head-local coordinates: head centre 0,0, ellipse rx 28, ry 26; face turned to +x) ----------
const HS={
  short:{
    front:`<path d="M-27 5C-32 -7 -30 -23 -17 -30C-6 -36 11 -36 21 -29C30 -23 33 -10 30 3L27 -3Q24 -2 22 -8Q19 -3 14 -3Q13 -8 10 -12Q6 -5 1 -5Q0 -10 -4 -13Q-7 -6 -12 -5Q-12 -10 -15 -12Q-18 -6 -22 -5Q-22 -1 -24 3Z"/>`,
    back:`<path d="M-29 6C-33 -10 -28 -27 -12 -32C2 -36 18 -33 26 -24C33 -14 32 4 28 14Q24 19 19 15Q14 21 8 17Q2 22 -4 17Q-10 21 -15 16Q-21 19 -25 14Q-28 11 -29 6Z"/>`,
    shine:'M-15 -26Q-4 -32 9 -30'},
  bob:{
    front:`<path d="M-31 21C-35 0 -33 -22 -19 -30C-7 -37 12 -37 23 -30C34 -22 36 0 32 21Q28 24 24 21C25 10 25 0 23 -6Q18 -3 14 -6Q9 -3 4 -6Q-1 -3 -6 -6Q-11 -3 -15 -6Q-19 -4 -21 -7C-22 2 -22 12 -22 21Q-26 24 -31 21Z"/>`,
    back:`<path d="M-31 23C-36 0 -33 -24 -16 -32C0 -38 18 -35 27 -25C35 -15 36 4 32 23Q24 28 16 25Q8 29 0 25Q-8 29 -16 25Q-24 28 -31 23Z"/>`,
    shine:'M-17 -25Q-4 -32 11 -29'},
  pony:{
    front:`<path d="M-27 5C-31 -8 -29 -24 -16 -30C-4 -36 14 -35 23 -28C31 -21 33 -8 30 4C28 -1 26 -5 23 -7C15 -3 5 -6 -1 -12C-5 -6 -13 -4 -20 -6C-23 -2 -24 1 -27 5Z"/>`,
    tail:{at:[-24,-15],d:'M-21 -19C-36 -17 -42 -3 -39 11C-37 23 -42 31 -35 40C-33 30 -27 26 -27 14C-27 4 -22 -4 -16 -11Z'},
    back:`<path d="M-29 6C-33 -10 -28 -27 -12 -32C2 -36 18 -33 26 -24C33 -14 32 4 29 13Q14 21 0 20Q-16 20 -29 11Z"/>`,
    tailBack:{at:[1,-9],d:'M-4 -10C-10 0 -9 16 -5 28C-3 34 -4 40 2 45C5 36 9 30 9 20C10 8 7 -2 6 -10Z'},
    tie:'#e05a4f',shine:'M-14 -27Q-2 -32 10 -30'},
  wave:{
    front:`<path d="M-30 30Q-36 12 -32 -6C-31 -24 -18 -33 -2 -34C16 -34 30 -24 31 -6Q34 12 30 30Q26 36 23 30Q27 20 22 12Q25 4 22 -4C14 -6 6 -10 2 -15C-2 -8 -12 -5 -20 -6Q-24 2 -21 12Q-26 20 -22 30Q-26 36 -30 30Z"/>`,
    mass:{at:[0,-12],d:'M-31 -6C-40 10 -37 30 -33 42Q-24 47 -15 43Q-6 48 3 43Q12 48 21 43Q30 46 32 40Q35 22 31 -6Z'},
    back:`<path d="M-31 -4C-34 -22 -20 -34 0 -34C20 -34 33 -22 31 -4Q36 20 34 44Q26 50 18 45Q10 51 2 45Q-6 51 -14 45Q-22 50 -30 44Q-36 20 -31 -4Z"/>`,
    shine:'M-16 -26Q-2 -32 12 -29'},
  curly:{
    front:`<path d="${bumps(0,-3,30,29,158,382,11,5.5)}${wave(25,-1,-23,-1,7,6.5)}Z"/>`,
    back:`<path d="${bumps(0,-2,30,29,140,400,14,5.5)}Z"/>`,
    shine:'M-12 -27Q0 -31 10 -29'},
  buns:{
    front:`<path d="M-27 5C-31 -8 -29 -24 -16 -30C-4 -36 14 -35 23 -28C31 -21 33 -8 30 4C27 -2 24 -5 18 -7C10 -8 6 -12 4 -16C2 -12 -4 -8 -12 -7C-18 -6 -23 -2 -27 5Z"/>`,
    back:`<path d="M-29 6C-33 -10 -28 -27 -12 -32C2 -36 18 -33 26 -24C33 -14 32 4 29 13Q14 21 0 20Q-16 20 -29 11Z"/>`,
    buns:[[-17,-28],[18,-29]],tie:'#e05a4f',shine:'M-13 -27Q-3 -31 6 -30'},
  braid:{
    front:`<path d="M-27 5C-31 -8 -29 -24 -16 -30C-4 -36 14 -35 23 -28C31 -21 33 -8 30 4C27 -2 24 -5 18 -7C10 -8 6 -12 4 -16C2 -12 -4 -8 -12 -7C-18 -6 -23 -2 -27 5Z"/>`,
    braid:{at:[-22,4],x:-22,y0:8,n:6,step:5.6,dx:-.5},
    back:`<path d="M-29 6C-33 -10 -28 -27 -12 -32C2 -36 18 -33 26 -24C33 -14 32 4 29 13Q14 21 0 20Q-16 20 -29 11Z"/>`,
    braidBack:{at:[1,6],x:1,y0:9,n:6,step:5.6,dx:0},
    tie:'#e05a4f',shine:'M-13 -27Q-3 -31 6 -30'},
  side:{
    front:`<path d="M-28 6C-32 -8 -30 -24 -16 -31C-4 -36 14 -35 24 -28C32 -20 33 -6 30 8Q27 3 25 -3C16 -2 6 -6 0 -12Q-4 -6 -10 -3Q-16 -1 -22 -5Q-24 0 -28 6Z"/>`,
    back:`<path d="M-29 6C-33 -10 -28 -27 -12 -32C2 -36 18 -33 26 -24C33 -14 32 4 28 15Q14 22 0 20Q-16 22 -29 8Z"/>`,
    shine:'M-17 -24Q-8 -30 2 -30'}
};
function braidSVG(b){let s='';for(let i=b.n-1;i>=0;i--){const y=b.y0+i*b.step,x=b.x+b.dx*i+(i%2?1.3:-1.3);s+=ell(r2(x),r2(y),6.2-i*.3,4.8,shade(HAIR,1.18))}const yt=b.y0+b.n*b.step-2,xt=b.x+b.dx*b.n;return s+pth(`M${r2(xt-3)} ${r2(yt)}L${r2(xt+3)} ${r2(yt)}L${r2(xt+4)} ${r2(yt+6)}Q${r2(xt)} ${r2(yt+8)} ${r2(xt-4)} ${r2(yt+6)}Z`,HAIR)}
function hairSVG(key,view,part,sp){
  const h=HS[key]||HS.short,fill=`fill="${HAIR}" ${OL}`,paint=s=>s.replace(/<path /g,`<path ${fill} `);
  if(view==='back'){
    if(part==='hb')return '';
    let s=paint(h.back);
    if(h.buns)s=h.buns.map(([x,y])=>ell(x,y,9.5,9,HAIR)+ln(`M${x-4} ${y+1}Q${x} ${y-5} ${x+4} ${y+1}`,HAIR2,1.2)+ell(x*.86,y+8,3.2,2,h.tie)).join('')+s;
    if(h.tailBack)s+=`<g data-k="hs">${pth(h.tailBack.d,HAIR)}${ell(h.tailBack.at[0],h.tailBack.at[1],4.5,3.5,h.tie)}</g>`;
    if(h.braidBack)s+=`<g data-k="hs">${braidSVG(h.braidBack)}${ell(h.braidBack.x,h.braidBack.y0+h.braidBack.n*h.braidBack.step-3,3.6,2.2,h.tie)}</g>`;
    return s+ln(h.shine,HAIR3,2.2,' opacity=".8"');
  }
  if(part==='hb'){
    if(h.tail)return `<g data-k="hs">${pth(h.tail.d,HAIR)}${ell(h.tail.at[0]+3,h.tail.at[1]-1,3.4,4.4,h.tie)}</g>`;
    if(h.mass)return `<g data-k="hs">${pth(h.mass.d,shade(HAIR,.82))}</g>`;
    return '';
  }
  let s='';
  if(h.buns)s+=`<g data-k="bun">${h.buns.map(([x,y])=>ell(x,y,9.5,9,HAIR)+ln(`M${x-4} ${y+1}Q${x} ${y-5} ${x+4} ${y+1}`,HAIR2,1.2)+ell(x*.86,y+8,3.2,2,h.tie)).join('')}</g>`;
  s+=paint(h.front);
    s+=ln(h.shine,HAIR3,2.2,' opacity=".8"');
  if(h.braid)s+=`<g data-k="hs">${braidSVG(h.braid)}${ell(h.braid.x+h.braid.dx*h.braid.n,h.braid.y0+h.braid.n*h.braid.step-3,3.6,2.2,h.tie)}</g>`;
  return s;
}
const hairAnchor=(key,view)=>{const h=HS[key]||{};return view==='back'?(h.tailBack||h.braidBack||{at:[0,0]}).at:(h.tail||h.mass||h.braid||{at:[0,0]}).at};

// Conical leaf hat (nón lá), head-local.
const HAT=`<g transform="rotate(-7 2 -21)">${pth('M-41 -17Q2 -9 45 -17L5 -51Z','#efcb7d')}<path d="M5 -51L45 -17Q32 -13 20 -12Z" fill="#d9ad5c" opacity=".75"/>${ln('M5 -51L-25 -14M5 -51L-9 -11M5 -51L11 -10M5 -51L29 -12',"#c9974a",.9)}${ln('M-17 -30Q4 -25 25 -30M-8 -40Q4 -37 16 -40',"#c9974a",.9)}${pth('M-41 -17Q2 -4 45 -17Q2 -11 -41 -17Z','#c9974a')}</g>`;

// ---------- Torso (torso-local: origin at the hips, shoulders at y -25, hem at +3.5) ----------
const TORSO='M-12 -25Q-15.5 -24 -15.5 -19L-14 .5Q-14 3.5 -10.5 3.5L11.5 3.5Q15 3.5 15 .5L16 -19Q16 -24 12.5 -25Q0 -27.5 -12 -25Z';
const DRESS='M-12 -25Q-15.5 -24 -15.5 -19L-12.5 -5L-12.5 3L13.5 3L13.5 -5L16 -19Q16 -24 12.5 -25Q0 -27.5 -12 -25Z';
const SHADE='M7 -28L21 -28L21 7L5 7Q9 -10 7 -28Z';
function motif(c,x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round">${dot(0,0,1.6,c)}<path d="M0 -3.6Q2.6 -2.6 0 0Q-2.6 -2.6 0 -3.6ZM3.4 1Q2.4 3.6 0 0Q3.2 -.6 3.4 1ZM-3.4 1Q-2.4 3.6 0 0Q-3.2 -.6 -3.4 1Z" fill="${c}" stroke="none"/></g>`}
function torsoSVG(sp,view,id){
  const back=view==='back',c=sp.c,c2=sp.c2,T=sp.top==='aodai'?DRESS:TORSO,base=sp.top==='overalls'?sp.under:c;
  let d='';
  switch(sp.top){
    case 'tunic':d+=back?ln('M-4 -25.6Q2 -23.6 9 -25.6',sp.trim,2):ln('M-4 -25.6Q3 -22 10 -25.6',sp.trim,2)+ln('M3.5 -23V3.5',sp.trim,1.2)+[-18,-12,-6].map(y=>ln(`M1 ${y}h5`,sp.trim,1.6)+dot(6.6,y,1,sp.trim)).join('')+ln('M-11.5 -6h6v5h-6z',c2,1)+ln('M7.5 -6h6v5h-6z',c2,1);break;
    case 'sash':d+=(back?'':ln('M-7 -26L7 -11',c2,1.6)+ln('M-3 -26L9 -14',sp.trim||c2,1))+`<path d="M-17 -8H18V-1.5H-17Z" fill="${sp.sash}" ${OL}/>`;break;
    case 'overalls':d+=back?ln('M-9 -25L10 -6M11 -25L-8 -6',c,3.6)+`<path d="M-17 -5H18V5H-17Z" fill="${c}" ${OL}/>`+ln('M-12 -1h5M9 -1h4',c2,1):ln('M-3 -25.6Q3 -23 9 -25.6',shade(sp.under,.9),1.6)+pth('M-9.5 -14L10.5 -14L11.5 4L-9.5 4Z',c)+ln('M-8.5 -14L-10 -25.5M9.5 -14L11.5 -25.5',c,3.4)+ln('M-8.5 -14L-10 -25.5M9.5 -14L11.5 -25.5',INK,.5,' opacity=".5"')+dot(-7.6,-12.4,1.5,sp.btn)+dot(8.8,-12.4,1.5,sp.btn)+ln('M-3.5 -10.5h8v5.5h-8z',c2,1.1);break;
    case 'tee':if(sp.stripes)d+=[-21,-14.5,-8,-1.5].map(y=>`<rect x="-17" y="${y}" width="35" height="3.4" fill="${sp.stripes}"/>`).join('');d+=back?ln('M-3 -25.6Q2 -24 8 -25.6',c2,1.6):(sp.collar?pth('M-3 -26L3 -21L1 -26ZM9 -26L4 -21L7 -26Z',shade(c,1.08)):ln('M-3 -25.6Q3 -22 9 -25.6',c2,1.8))+(sp.pocket?ln('M7 -19h6v5.5h-6z',c2,1.1):'');break;
    case 'hoodie':d+=back?pth('M-10 -25Q-12 -12 2 -10Q15 -12 14 -25Z',c2)+`<path d="M-17 0H18V5H-17Z" fill="${c2}"/>`:pth('M-12 -24.5Q-13 -30 -6 -29.5L10 -29.5Q16 -30 14.5 -24.5Q2 -21 -12 -24.5Z',c2)+ln('M0 -23.5V-15M6 -23.5V-15',"#f4efe6",1.2)+dot(0,-14.6,1,"#f4efe6")+dot(6,-14.6,1,"#f4efe6")+pth('M-7 -8L11 -8L13 .5L-9 .5Z',shade(c,.92))+`<path d="M-17 .5H18V5H-17Z" fill="${c2}"/>`;break;
    case 'jacket':case 'track':case 'cardigan':{
      const tr=sp.top==='track',cg=sp.top==='cardigan';
      if(back){d+=ln('M-14 -17Q1 -14 16 -17',c2,1.1)+(tr?`<path d="M-17 -12H-13V5H-17ZM14 -12H18V5H14Z" fill="${sp.stripe}"/>`:'')+(cg?`<path d="M-17 0H18V5H-17Z" fill="${c2}"/>`:'');break}
      d+=`<path d="M-1 -26L9 -26L${tr?6:7} 4L${tr?2:0} 4Z" fill="${sp.inner}" ${OL}/>`;
      if(tr)d+=pth('M-15 -24L-1 -26L2 4L-15 4Z',c)+pth('M9 -26L16 -24L16 4L6 4Z',c)+ln('M2 -18V4',INK,.9)+`<path d="M-15 -10H-12V4H-15Z" fill="${sp.stripe}"/>`+pth('M-1 -26.5L2 -21L4 -26.5Z',c2)+pth('M9 -26.5L6 -21L5 -26.5Z',c2);
      else if(cg)d+=pth('M-15 -24L-1 -26L1 4L-15 4Z',c)+pth('M9 -26L16 -24L16 4L7 4Z',c)+[-17,-10,-3].map(y=>dot(8.6,y,1.2,c2)).join('')+`<path d="M-15 0H16V4H-15Z" fill="${c2}" opacity=".7"/>`+ln('M-10 -18V-2M-5 -18V-2M12 -18V-2',c2,.6,' opacity=".7"');
      else d+=pth('M-15 -24L-1 -26L0 4L-15 4Z',c)+pth('M9 -26L16 -24L16 4L7 4Z',c)+pth('M-1 -26.5L-5 -19L2 -22Z',c2)+pth('M9 -26.5L13 -19L6 -22Z',c2)+ln('M-12 -19h7v5h-7zM9 -19h6v5h-6z',c2,1)+ln('M-14 -1H16',c2,1,' stroke-dasharray="1.6 1.4"')+dot(8,-8,1.1,'#e9c46a')+dot(8,-1.5,1.1,'#e9c46a');
      break}
    case 'aodai':d+=back?ln('M-2 -26.5h11',c2,2.4)+(sp.motif?motif(sp.motif,1,-14,.8):''):pth('M-3 -27.5L10 -27.5L10 -24.5L-3 -24.5Z',c2)+ln('M9 -24.5Q13 -23 15.5 -16',sp.motif,1.3)+dot(12.4,-21.6,1,sp.motif)+dot(14.6,-18,1,sp.motif)+(sp.dragon?ln('M-9 -18Q-4 -22 0 -17Q4 -12 8 -16',sp.motif,1.3)+motif(sp.motif,-8,-9,.8):motif(sp.motif,-6,-15,.9)+motif(sp.motif,1,-7,.7));break;
  }
  const shadeTop=sp.top==='overalls'?'':`<path d="${SHADE}" fill="${shade(base,.86)}" opacity=".8"/>`;
  return `<path d="${T}" fill="${base}"/><g clip-path="url(#${id}t)">${shadeTop}${d}</g><path d="${T}" fill="none" ${OL}/>`;
}
// Áo dài panels hang from the waist and sway; skirt flares. Origin of each group: the waist (0, 2).
const PANEL_N='M-11 0L11 0L14 21Q0 23.6 -14 21Z',PANEL_F='M-12 0L12 0L15.6 20Q0 22 -15.6 20Z';
function panelSVG(sp,near){const c=near?sp.c:sp.c2;return pth(near?PANEL_N:PANEL_F,c)+(near&&sp.motif?ln('M-8 12Q-4 9 0 12Q4 15 8 12',sp.motif,1.1)+motif(sp.motif,0,6,.75):'')}
const SKIRT='M-12.5 -1L12.5 -1L17.5 12Q0 15.5 -17.5 12Z';
function pelvisSVG(sp){const b=BOTTOMS[sp.bottom];if(!b||!b.pe)return '';const w=b.w>4?13:11;return pth(`M-${w} -2L${w} -2L${w} 3.5Q0 7.5 -${w} 3.5Z`,sp.b)}

// ---------- Limbs ----------
const LEG_W=7.6,ARM_W=6.6,LEG_L=[13,12.6],ARM_L=[8.6,8];
function shoeSVG(sh,far){
  const c=far?sh.c2:sh.c;
  switch(sh.type){
    case 'sneaker':return pth('M-4.2 -2.4C-6 -1 -6 3.4 -4 3.6L8 3.6C10.6 3.6 11 1.2 9.2 -.2C7 -1.8 4 -3 .6 -3Z',c)+pth('M-5.6 2L10.4 2L10 4.6L-5 4.6Z',sh.sole)+ln('M1.5 -2.2L3.4 -.4M3.8 -2.7L5.6 -.9',sh.lace,.9)+(sh.stripe?ln('M-2.5 .6Q2 -.8 7 1.4',sh.stripe,1.2):'');
    case 'sandal':return pth('M-3.6 -2C-4.8 0 -4.8 3 -3.2 3.4L7.4 3.4C9.4 3.4 9.8 1.2 8 0C6 -1.4 3 -2.4 0 -2.4Z',far?SKIN2:SKIN)+pth('M-4.6 2.6L9.6 2.6L9.4 4.5L-4.4 4.5Z',c)+ln('M-2 -1.6L-1 2.6M3.6 -1.4L4.6 2.6',c,2.2);
    case 'boot':return pth('M-4.6 -6L4.4 -6L4.8 -1.6C8 -1.2 11 0 10.6 2.6L10.4 4.4L-5 4.4Z',c)+`<path d="M-5 2.6L10.6 2.6L10.4 4.4L-5 4.4Z" fill="${shade(c,.7)}"/>`;
    default:return pth('M-4.2 -2C-5.8 -.6 -5.6 3.6 -3.6 3.8L8.6 3.8C11 3.6 11 1 9 -.2C6.6 -1.6 3 -2.4 -.2 -2.4Z',c)+`<path d="M-4.6 3L10.4 3L10.2 4.4L-4.4 4.4Z" fill="${shade(c,.6)}"/>`+ln('M2.5 -1.4Q4.6 .2 7.6 -.2',sh.shine,1)+(sh.strap?ln('M-.6 -2.2L1 .8',sh.strap,1.4)+dot(6,1,1.2,sh.strap):'');
  }
}
function legSVG(sp,i,D){
  const far=i==='F',b=BOTTOMS[sp.bottom]||BOTTOMS.shorts,sh=SHOES[sp.shoe]||SHOES.sandals,skin=far?SKIN2:SKIN,pc=far?sp.b2:sp.b,pw=LEG_W+b.w,k='l'+i;
  let s=`<path${A(D,k+'o')} fill="none" stroke="${INK}" stroke-width="${LEG_W+3.4}" stroke-linecap="round"/><path${A(D,k+'s')} fill="none" stroke="${skin}" stroke-width="${LEG_W}" stroke-linecap="round"/>`;
  if(b.pe)s+=`<path${A(D,k+'po')} fill="none" stroke="${INK}" stroke-width="${pw+3.4}" stroke-linecap="round"/><path${A(D,k+'p')} fill="none" stroke="${pc}" stroke-width="${pw}" stroke-linecap="round"/>`;
  if(b.cuff)s+=`<path${A(D,k+'c')} fill="none" stroke="${sp.cuff||shade(pc,1.15)}" stroke-width="${pw}"/>`;
  if(b.stripe)s+=`<path${A(D,k+'t')} fill="none" stroke="${sp.stripe||'#fff'}" stroke-width="1.5" stroke-linecap="round"/>`;
  if(sh.type==='boot')s+=`<path${A(D,k+'bo')} fill="none" stroke="${INK}" stroke-width="${LEG_W+5.6}" stroke-linecap="round"/><path${A(D,k+'b')} fill="none" stroke="${far?sh.c2:sh.c}" stroke-width="${LEG_W+2.2}" stroke-linecap="round"/>`;
  return s+`<g${A(D,k+'f')}>${shoeSVG(sh,far)}</g>`;
}
const SLEEVE={short:[.46,3.6],long:[.9,1.8],none:[0,0]};
function armSVG(sp,i,D){
  const far=i==='F',k='a'+i,skin=far?SKIN2:SKIN,sl=SLEEVE[sp.top==='aodai'?'long':sp.top==='overalls'?'short':sp.sleeve||'short'],sc=sp.top==='overalls'?sp.under:sp.c,scol=far?shade(sc,.88):sc;
  let s=`<path${A(D,k+'o')} fill="none" stroke="${INK}" stroke-width="${ARM_W+3.4}" stroke-linecap="round"/><path${A(D,k+'s')} fill="none" stroke="${skin}" stroke-width="${ARM_W}" stroke-linecap="round"/>`;
  if(sl[0])s+=`<path${A(D,k+'vo')} fill="none" stroke="${INK}" stroke-width="${ARM_W+sl[1]+3.4}" stroke-linecap="round"/><path${A(D,k+'v')} fill="none" stroke="${scol}" stroke-width="${ARM_W+sl[1]}" stroke-linecap="round"/>`;
  if(sl[0]>.8)s+=`<path${A(D,k+'c')} fill="none" stroke="${far?shade(sp.c2,.9):sp.c2}" stroke-width="${ARM_W+sl[1]}"/>`;
  if(sp.top==='track')s+=`<path${A(D,k+'t')} fill="none" stroke="${sp.stripe}" stroke-width="1.4" stroke-linecap="round"/>`;
  if(sp.stripes)s+=`<path${A(D,k+'t')} fill="none" stroke="${sp.stripes}" stroke-width="${ARM_W+sl[1]}" stroke-dasharray="2.2 2.6"/>`;
  return s+`<g${A(D,k+'h')}>${dot(0,0,3.7,skin,' '+OL)}</g>`;
}

// ---------- Head ----------
function headSVG(sp,view,id,D){
  const fem=sp.g==='female';let s='';
  if(view==='back'){
    s+=ell(-27,5,4.4,5.8,SKIN2)+ell(0,0,28,26,SKIN)+hairSVG(sp.hair,'back','head',sp);
  }else{
    s+=ell(-27,4,4.6,6,SKIN)+ln('M-28 1.6Q-25.6 4 -27.6 7',SKIN2,1.2);
    s+=`<ellipse cx="0" cy="0" rx="28" ry="26" fill="${SKIN2}"/><g clip-path="url(#${id}h)"><ellipse cx="-3.4" cy="-3" rx="28" ry="26" fill="${SKIN}"/></g><ellipse cx="0" cy="0" rx="28" ry="26" fill="none" ${OL}/>`;
    s+=`<ellipse cx="-9" cy="10.5" rx="4.2" ry="2.4" fill="${BLUSH}" opacity=".55"/><ellipse cx="19.5" cy="10.5" rx="3.4" ry="2.2" fill="${BLUSH}" opacity=".55"/>`;
    const eye=(x,rx)=>`<ellipse cx="${x}" cy="2" rx="${rx}" ry="5.6" fill="#2b1a12"/>${dot(x+1.3,-.4,1.7,'#fff')}${dot(x-1.1,4.2,.8,'#fff')}`;
    const lash=fem?ln('M-8.4 -1.6L-10.4 -3.4M-8 .2L-10.6 -.4',INK,1.1)+ln('M17.6 -1.6L19.4 -3.2',INK,1.1):'';
    s+=`<g${A(D,'eyN')}><g${A(D,'eyes')}>${eye(-4,4.3)}${eye(14,3.8)}${lash}</g></g>`;
    s+=`<g${A(D,'eyH')}>${ln('M-8 3.2Q-4 -2 0 3.2M10.6 3.2Q14 -1.6 17.4 3.2',INK,1.9)}</g>`;
    s+=ln(fem?'M-8 -8.6Q-4 -10.6 -.4 -8.8M10.6 -8.8Q14 -10.6 17.4 -8.4':'M-8.6 -8Q-4.4 -10.8 0 -8.6M10.2 -8.8Q14 -11 17.8 -8.2',HAIR2,fem?1.2:1.7);
    s+=ln('M6.6 7.2Q7.8 8 9 7.2',SKIN2,1.2);
    s+=`<g${A(D,'mS')}>${ln('M3 12Q6.4 15.2 9.8 12',INK,1.5)}</g><g${A(D,'mO')}>${pth('M2.4 11.4Q6.4 19 10.4 11.4Z','#c2453f')}<path d="M4.4 15.4Q6.4 13.6 8.4 15.4Q6.4 17.6 4.4 15.4Z" fill="#f08a80"/></g>`;
    s+=hairSVG(sp.hair,'front','head',sp);
  }
  if(sp.hat)s+=HAT;
  return s;
}

// ---------- Character ----------
function charSpec(look){
  const g=look&&look.gender==='male'?'male':'female',o=OUTFITS[look&&look.outfit]||OUTFITS.base,pick=v=>v&&typeof v==='object'?(v[g]!==undefined?v[g]:v.female):v,sp={g,outfit:OUTFITS[look&&look.outfit]?look.outfit:'base'};
  for(const k in o)sp[k]=pick(o[k]);
  sp.hair=HS[look&&look.hair]?look.hair:DEFAULT_HAIR[g];
  if(look&&SHOES[look.shoe])sp.shoe=look.shoe;
  return sp;
}
function charState(){return {t:Math.random()*10,phase:0,w:0,run:0,flip:1,turn:null,blinkAt:1+Math.random()*3,blink:0,cheer:0,jump:0,tilt:{x:0,v:0},tiltTo:0,tiltAt:2,look:0,hair:{x:0,v:0},panel:{x:0,v:0},bun:{x:0,v:0},sit:0}}
// Pose: every joint for this frame. `st` is the animation state, `pose` a fixed pose for previews ('idle' / 'sit').
function charPose(sp,st){
  const w=st.w,rw=st.run,ph=st.phase,br=Math.sin(st.t*TAU/3.4),ch=st.cheer;
  const S=lerp(15,23,rw),lift=lerp(4.5,8.5,rw),stance=lerp(.6,.4,rw);
  const bob=w*lerp(1.4*(1+Math.cos(2*TAU*ph))/2,2.6*(1+Math.cos(2*TAU*(ph+.2)))/2,rw);
  const sit=st.sit,hip=[w*lerp(.3,1.8,rw)+sit*-2,-30+bob+sit*11];
  const tr=w*lerp(3,9,rw)+w*(1-rw)*1.2*Math.sin(TAU*ph)-ch*4+sit*-4,tsy=1+(1-w)*.016*br;
  const T=p=>{const q=rot([p[0],p[1]*tsy],tr);return [hip[0]+q[0],hip[1]+q[1]]};
  const neck=T([1,-25]),hr=-w*lerp(1.5,4,rw)+w*1.8*Math.sin(2*TAU*ph-1.1)+(1-w)*st.tilt.x-ch*6+sit*3;
  const legs=[];
  for(let i=0;i<2;i++){
    const f=foot(ph+(i?.5:0),stance),hj=[hip[0]+(i?5.6:-5.6),hip[1]+2];
    let ax=(i?6:-6)+w*(f.x*S+lerp(.5,2,rw)),ay=-2.6-w*f.lift*lift,fr=0;
    if(w>.01){if(f.plant)fr=f.u<.18?-8*(1-f.u/.18):f.u>.68?24*((f.u-.68)/.32):0;else fr=lerp(24,-10,ease(Math.min(1,f.u*2.2)));fr*=w;if(fr>0)ay-=8.5*Math.sin(fr*RAD)}
    if(sit){ax=lerp(ax,hj[0]+(i?14:10),sit);ay=lerp(ay,-2.6,sit)}
    const [k,a]=ik(hj,[ax,ay],LEG_L[0],LEG_L[1],-1);legs.push({h:hj,k,a,r:fr});
  }
  const arms=[];
  for(let i=0;i<2;i++){
    const sw=Math.cos(TAU*ph)*(i?1:-1),amp=lerp(26,42,rw);
    let a=(i?9:-7)+w*amp*sw+(1-w)*(i?1:-1)*1.6*br,b=(i?10:12)+w*lerp(14+12*Math.max(0,sw),72,rw);
    a=lerp(a,i?155:-150,ch);b=lerp(b,i?-18:20,ch);if(sit){a=lerp(a,38,sit);b=lerp(b,40,sit)}
    const s=T(i?[12,-22]:[-11,-22]);
    if(st.hold){const [e,h]=ik(s,st.hold[i],ARM_L[0],ARM_L[1],1);arms.push({s,e,h});continue}
    const e=[s[0]+ARM_L[0]*Math.sin(a*RAD),s[1]+ARM_L[0]*Math.cos(a*RAD)],h=[e[0]+ARM_L[1]*Math.sin((a+b)*RAD),e[1]+ARM_L[1]*Math.cos((a+b)*RAD)];
    arms.push({s,e,h});
  }
  const panel=st.panel.x;
  return {hip,tr,tsy,neck,hr,legs,arms,panel,hair:st.hair.x,bun:st.bun.x,blink:st.blink,look:st.look,happy:ch>.35,jump:st.jump,flip:st.flip,squash:st.turn?1-.62*Math.sin(Math.PI*st.turn.u):1,shadow:1-w*.05*Math.abs(Math.sin(TAU*ph))-st.jump*.025};
}
function charDyn(sp,view,P){
  const D={},b=BOTTOMS[sp.bottom]||BOTTOMS.shorts,sh=SHOES[sp.shoe]||{},sl=SLEEVE[sp.top==='aodai'?'long':sp.top==='overalls'?'short':sp.sleeve||'short'];
  D.root={transform:`translate(0 ${r2(-P.jump)}) scale(${r2(P.flip*P.squash)} 1)`};
  D.shadow={transform:`scale(${r2(P.shadow)} 1)`};
  ['N','F'].forEach((n,i)=>{const L=P.legs[i],q=hose(L.h,L.k,L.a),d=qd(q),k='l'+n;D[k+'o']={d};D[k+'s']={d};if(b.pe){const ds=qd(qsub(q,0,b.pe));D[k+'po']={d:ds};D[k+'p']={d:ds}}if(b.cuff)D[k+'c']={d:qd(qsub(q,b.cuff[0],b.cuff[1]))};if(b.stripe)D[k+'t']={d:qd(qsub(q,.06,b.pe-.06))};if(sh.type==='boot'){const db=qd(qsub(q,.62,1));D[k+'bo']={d:db};D[k+'b']={d:db}}D[k+'f']={transform:`translate(${pt(L.a)}) rotate(${r2(L.r)})`}});
  ['N','F'].forEach((n,i)=>{const R=P.arms[i],q=hose(R.s,R.e,R.h),d=qd(q),k='a'+n;D[k+'o']={d};D[k+'s']={d};if(sl[0]){const dv=qd(qsub(q,0,sl[0]));D[k+'vo']={d:dv};D[k+'v']={d:dv};if(sl[0]>.8)D[k+'c']={d:qd(qsub(q,.84,.93))}}if(sp.top==='track')D[k+'t']={d:qd(qsub(q,.08,.82))};if(sp.stripes)D[k+'t']={d:qd(qsub(q,.05,sl[0]))};D[k+'h']={transform:`translate(${pt(R.h)})`}});
  const tt=`translate(${pt(P.hip)}) rotate(${r2(P.tr)}) scale(1 ${r2(P.tsy)})`;
  D.pel={transform:`translate(${pt(P.hip)})`};D.tor={transform:tt};D.bp={transform:tt};
  D.pn={transform:`rotate(${r2(P.panel)} 0 2)`};D.pf={transform:`rotate(${r2(P.panel*.85)} 0 2)`};D.sk={transform:`rotate(${r2(P.panel*.35)} 0 -1)`};D.tl={transform:`rotate(${r2(P.panel*1.4)} 8 -3)`};
  const ht=`translate(${pt(P.neck)}) rotate(${r2(P.hr)}) translate(1 -29)`;D.head={transform:ht};D.hb={transform:ht};
  const an=hairAnchor(sp.hair,view);D.hs={transform:`rotate(${r2(P.hair)} ${an[0]} ${an[1]})`};D.bun={transform:`translate(0 ${r2(P.bun)})`};
  D.eyes={transform:`translate(${r2(P.look)} 2) scale(1 ${r2(1-P.blink*.9)}) translate(0 -2)`};
  D.eyN={opacity:P.happy?0:1};D.eyH={opacity:P.happy?1:0};D.mS={opacity:P.happy?0:1};D.mO={opacity:P.happy?1:0};
  return D;
}
function charInner(sp,view,id,D){
  const back=view==='back',dress=sp.top==='aodai',skirt=sp.bottom==='skirt';
  const defs=`<defs><clipPath id="${id}t"><path d="${dress?DRESS:TORSO}"/></clipPath><clipPath id="${id}h"><ellipse cx="0" cy="0" rx="28" ry="26"/></clipPath></defs>`;
  const farPanel=dress?`<g${A(D,'bp')}><g${A(D,'pf')}>${panelSVG(sp,false)}</g></g>`:'';
  const torso=`<g${A(D,'tor')}>${skirt?`<g${A(D,'sk')}>${pth(SKIRT,sp.b)}${[[-9,6],[-2,9],[6,5],[11,10],[-12,11]].map(([x,y])=>dot(x,y,1.3,sp.motif||'#f2d6a8')).join('')}</g>`:''}${torsoSVG(sp,view,id)}${sp.top==='sash'&&!back?`<g${A(D,'tl')}>${pth('M6.5 -3L3.5 6.5L6.5 6.8L8.4 -2ZM9 -3L11 6L14 5.6L10.6 -3.4Z',sp.sash)}${ell(8.4,-4.4,2.6,2.2,sp.sash)}</g>`:''}${dress?`<g${A(D,'pn')}>${panelSVG(sp,true)}</g>`:''}</g>`;
  return defs+`<g${A(D,'root')}><ellipse${A(D,'shadow')} cx="1" cy="-.4" rx="19" ry="4.6" fill="#3b2a12" opacity=".26"/>`+
    `<g${A(D,'hb')}>${hairSVG(sp.hair,view,'hb',sp)}</g>`+armSVG(sp,'F',D)+farPanel+legSVG(sp,'F',D)+legSVG(sp,'N',D)+`<g${A(D,'pel')}>${pelvisSVG(sp)}</g>`+torso+`<g${A(D,'head')}>${headSVG(sp,view,id,D)}</g>`+armSVG(sp,'N',D)+'</g>';
}
const CHAR_VB='-50 -142 100 144';
// Fixed poses for still pictures: 'sit' on a stool, 'fish' = sitting with both hands on a rod.
const ROD=[[3,-29],[16,-39]];
function posed(st,pose){st.sit=pose==='sit'||pose==='fish'?1:0;st.hold=pose==='fish'?ROD:null}
const STOOL=pth('M-16 -17.4h25v3.8h-25z','#c08a52')+pth('M-13.6 -13.6h3.4L-11.6 0h-3.4zM4.4 -13.6h3.4L9.2 0h-3.4z','#94623a');
const FISH_ROD=ln('M-6 -22L104 -112',INK,4.2)+ln('M-6 -22L104 -112','#c99a55',2.2)+ln('M104 -112Q110 -84 107 -56','#fbf6ea',.8)+dot(107,-54,2.8,'#e5483d',' '+OL)+`<path d="M104.4 -54h5.2" stroke="#fff" stroke-width="1.4"/>`;
// Player sitting on the lake bank with a rod (pond scene).
const fisher=(look,label)=>charMarkup(look,{pose:'fish',cls:'lake-fisher',label,viewBox:'-48 -142 160 146',under:STOOL,extra:FISH_ROD});
// Static picture as an <img> (keeps existing <img> styling, e.g. card-room seats).
const asImg=(markup,alt='',cls='')=>`<img${cls?` class="${cls}"`:''} src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}" alt="${esc(alt)}">`;
// Hair rule shared by every drawing of the player: modular outfits show the chosen hair, the classic outfits keep
// the hair they were designed with (bob / short), exactly like the old artwork.
const lookFor=o=>({gender:o.gender==='male'?'male':'female',outfit:o.outfit,hair:o.modular?o.hair:DEFAULT_HAIR[o.gender==='male'?'male':'female'],shoe:o.shoe==='bare'?'':o.shoe,hat:o.hat});
const lookKey=l=>[l.gender==='male'?'male':'female',l.outfit,l.hair,l.shoe].join('|');
// Static markup (wardrobe cards, profile picker, card room). avatar-world.js brings these to life (blink, breathe).
function charMarkup(look,o={}){
  const sp=charSpec(look),view=o.view==='back'?'back':'front',st=charState();st.t=0;posed(st,o.pose);if(o.face==='left')st.flip=-1;
  const id=uid(),D=charDyn(sp,view,charPose(sp,st));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="ar-char${o.cls?' '+o.cls:''}" viewBox="${o.viewBox||CHAR_VB}" data-ar-char="${esc(lookKey(look))}|${view}|${o.pose||'idle'}" ${o.label===false?' aria-hidden="true" focusable="false"':` role="img" aria-label="${esc(o.label||'Nhân vật')}"`}${o.style?` style="${esc(o.style)}"`:''}>${o.under||''}${charInner(sp,view,id,D)}${o.extra?`<g data-ar-over>${o.extra}</g>`:''}</svg>`;
}

class Character{
  constructor(svg){this.svg=svg;this.st=charState();this.cache=new Map();const d=(svg.getAttribute('data-ar-char')||'').split('|');this.look={gender:d[0],outfit:d[1],hair:d[2],shoe:d[3]};this.view=d[4]==='back'?'back':'front';posed(this.st,d[5]);this.sp=charSpec(this.look);this.idPrefix=uid();this.collect();svg._ar=this}
  static create(look,o={}){const tmp=document.createElement('div');tmp.innerHTML=charMarkup(look,o);return new Character(tmp.firstChild)}
  collect(){this.nodes={};this.svg.querySelectorAll('[data-k]').forEach(n=>{const k=n.getAttribute('data-k');(this.nodes[k]=this.nodes[k]||[]).push(n)});this.cache.clear()}
  rebuild(){const id=uid(),D=charDyn(this.sp,this.view,charPose(this.sp,this.st));this.svg.querySelectorAll(':scope>defs,:scope>g[data-k="root"]').forEach(n=>n.remove());const tmp=document.createElementNS('http://www.w3.org/2000/svg','g');tmp.innerHTML=charInner(this.sp,this.view,id,D);const before=this.svg.querySelector(':scope>[data-ar-over]');while(tmp.firstChild)this.svg.insertBefore(tmp.firstChild,before);const d=this.svg.getAttribute('data-ar-char').split('|');d.splice(0,5,...lookKey(this.look).split('|'),this.view);this.svg.setAttribute('data-ar-char',d.join('|'));this.collect()}
  setLook(look){const k=lookKey(look);if(k===lookKey(this.look))return;this.look={...look};this.sp=charSpec(look);this.rebuild()}
  // Smooth paper-turn: squash to 38% width, swap facing / front-back at the narrowest moment, open again.
  face(dir,view){dir=dir<0?-1:1;view=view||this.view;const want={dir,view};if(this.st.turn){this.st.turn.want=want;return}if(dir===this.st.flip&&view===this.view)return;this.st.turn={u:0,want,swapped:false}}
  cheer(){this.st.cheerT=0}
  // input: {speed: rig units / s along the ground, sit: 0..1}
  update(dt,inp={}){
    const st=this.st;dt=Math.min(dt,1/20);st.t+=dt;
    const spd=Math.max(0,inp.speed||0),cycle=lerp(62,96,st.run);
    st.phase=(st.phase+spd*dt/cycle)%1;
    st.w=approach(st.w,spd>4?1:0,spd>4?9:7,dt);st.run=approach(st.run,clamp((spd-150)/90,0,1),5,dt);
    if(inp.sit!==undefined)st.sit=approach(st.sit,inp.sit,8,dt);
    if(st.turn){const T=st.turn;T.u=Math.min(1,T.u+dt/.17);if(T.u>=.5&&!T.swapped){T.swapped=true;st.flip=T.want.dir;if(T.want.view!==this.view){this.view=T.want.view;this.rebuild()}}if(T.u>=1){st.turn=null;if(T.want.dir!==st.flip||T.want.view!==this.view)this.face(T.want.dir,T.want.view)}}
    if(st.cheerT!==undefined){st.cheerT+=dt;const u=st.cheerT/.7;st.cheer=u<1?Math.sin(Math.PI*Math.min(1,u*1.6))**.6*(u<.75?1:1-(u-.75)/.25):0;st.jump=u<.6?7*Math.sin(Math.PI*u/.6):0;if(u>=1){delete st.cheerT;st.cheer=0;st.jump=0}}
    st.blinkAt-=dt;if(st.blinkAt<=0){st.blinkT=0;st.blinkAt=2+Math.random()*3.5+(Math.random()<.15?-1.7:0)}
    if(st.blinkT!==undefined){st.blinkT+=dt;const u=st.blinkT/.15;st.blink=u<1?Math.sin(Math.PI*u):0;if(u>=1)delete st.blinkT}
    st.tiltAt-=dt;if(st.tiltAt<=0){st.tiltTo=Math.random()<.5?0:(Math.random()*2-1)*5;st.lookTo=(Math.random()*2-1)*1.3;st.tiltAt=2.5+Math.random()*4}
    spring(st.tilt,st.tiltTo*(1-st.w),18,7,dt);st.look=approach(st.look,(st.lookTo||0)*(1-st.w),6,dt);
    const w=st.w,rw=st.run;
    spring(st.hair,-w*lerp(5,13,rw)+w*4*Math.sin(2*TAU*st.phase-2),70,7,dt);
    spring(st.panel,-w*lerp(7,15,rw)+w*3.2*Math.sin(2*TAU*st.phase)+(st.cheer*6),55,6,dt);
    spring(st.bun,w*1.4*Math.sin(2*TAU*st.phase-2.2)-st.cheer*2,90,8,dt);
    this.apply();
  }
  apply(){const D=charDyn(this.sp,this.view,charPose(this.sp,this.st));for(const k in D){const ns=this.nodes[k];if(!ns)continue;const a=D[k];for(const n in a){const ck=k+'|'+n,v=String(a[n]);if(this.cache.get(ck)===v)continue;this.cache.set(ck,v);for(const el of ns)el.setAttribute(n,v)}}}
}

// ---------- Animals (side view, facing +x, ground at y 0) ----------
// Each species: viewBox, legs (attach point, segment lengths, width, colours, fore/hind, near/far), neck pivot,
// tail pivot, and drawings for body / head / tail in local coordinates (head drawn relative to the neck pivot).
const eyeA=(x,y,rx=2.3,ry=2.9,c='#24160f')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>${dot(x+.7,y-1,rx*.38,'#fff')}`;
const hoof=c=>pth('M-3.6 -1.4L3.6 -1.4L4 2.8Q0 3.6 -4 2.8Z',c);
const paw=c=>ell(.8,1.2,3.6,2.2,c);
function quadLegs(fx,hx,y,l,w,near,far,end,opt={}){return [
  {at:[hx[0],y],l,w,c:far,end,hind:1,near:0,o:opt.o?opt.o[2]:.5},{at:[fx[0],y],l,w,c:far,end,hind:0,near:0,o:opt.o?opt.o[3]:.75},
  {at:[hx[1],y],l,w,c:near,end,hind:1,near:1,o:0},{at:[fx[1],y],l,w,c:near,end,hind:0,near:1,o:opt.o?opt.o[1]:.25}]}
const SPECIES={
  cow:{vb:'-38 -62 80 66',kind:'quad',size:1,neck:[11,-35],tailAt:[-24,-35],
    legs:quadLegs([8,12],[-21,-17],-19,[8.3,8.3],7.2,'#fffdf7','#e6ded2',hoof('#4a3a33')),
    body:id=>`<defs><clipPath id="${id}b"><path d="M-14 -41Q-25 -41 -25 -30L-25 -27Q-25 -16 -15 -16L10 -16Q20 -16 20 -27L20 -30Q20 -41 9 -41Z"/></clipPath></defs><path d="M-14 -41Q-25 -41 -25 -30L-25 -27Q-25 -16 -15 -16L10 -16Q20 -16 20 -27L20 -30Q20 -41 9 -41Z" fill="#fffdf7"/><g clip-path="url(#${id}b)"><path d="M-26 -22Q-3 -14 21 -22L21 -15L-26 -15Z" fill="#ebe3d6"/>${ell(-13,-34,7,5.4,'#2f2a2a',' stroke="none"')}${ell(4,-25,5,4,'#2f2a2a',' stroke="none"')}${ell(-24,-22,4,3.5,'#2f2a2a',' stroke="none"')}${ell(14,-38,4,3,'#2f2a2a',' stroke="none"')}<g data-k="ribs" opacity="0">${ln('M-9 -32q-2.4 4.5 0 9M-3.5 -33q-2.4 4.5 0 9M2 -33q-2.4 4.5 0 9','#a8977f',1.3)}</g></g><path d="M-14 -41Q-25 -41 -25 -30L-25 -27Q-25 -16 -15 -16L10 -16Q20 -16 20 -27L20 -30Q20 -41 9 -41Z" fill="none" ${OL}/>${ell(-6,-15.6,4.6,2.7,'#f6b8b0')}`,
    tail:ln('M0 0Q-6 4 -5 14','#2f2a2a',4.6)+ln('M0 0Q-6 4 -5 14','#fffdf7',2.2)+ell(-5,15,2.6,3.6,'#2f2a2a'),
    head:()=>`${ell(0,-15,6,2.6,'#e6ded2',' transform="rotate(-34 0 -15)"')}${pth('M2 -15Q1 -21 5 -21Q5 -17 6 -15Z','#f2e6c8')}${pth('M10 -16Q11 -22 15 -21Q13 -17 13 -15Z','#f2e6c8')}${ell(8,-5,13,12,'#fffdf7')}${ell(4,-12,5,3.4,'#2f2a2a',' stroke="none"')}${ell(15,1.5,8.6,6.4,'#f7c1b8')}${ell(18,.4,1,1.5,'#c97c74',' stroke="none"')}${ell(13.6,.8,1,1.5,'#c97c74',' stroke="none"')}${ln('M13 5.4Q15.6 6.8 18.4 5.4',INK,1)}<g data-k="eyes">${eyeA(8.6,-6)}</g>${ell(10.6,-.6,2.6,1.4,BLUSH,' stroke="none" opacity=".55"')}<g data-k="ear">${ell(-2,-12,6.4,3,'#fffdf7',' transform="rotate(-28 -2 -12)"')}${ell(-2.4,-12,3.6,1.3,'#f6b8b0',' stroke="none" transform="rotate(-28 -2 -12)"')}</g>`,
    gait:{S:11,lift:4,cycle:40},graze:1},
  buffalo:{vb:'-40 -66 84 70',kind:'quad',size:1.06,neck:[12,-37],tailAt:[-26,-37],
    legs:quadLegs([9,13],[-23,-19],-19,[8.3,8.4],7.6,'#5c606a','#474a52',hoof('#2f3036')),
    body:()=>`${pth('M-15 -43Q-27 -43 -27 -31L-27 -27Q-27 -16 -16 -16L11 -16Q21 -16 21 -27L21 -31Q21 -43 10 -43Z','#5c606a')}<path d="M-25 -22Q-3 -15 20 -22L20 -18Q19 -16.8 11 -16.8L-16 -16.8Q-24 -16.8 -25 -19Z" fill="#4b4e57"/>${ln('M-18 -38Q-4 -42 12 -38','#6e737e',1.4)}<g data-k="ribs" opacity="0">${ln('M-10 -34q-2.4 5 0 10M-4 -35q-2.4 5 0 10M2 -35q-2.4 5 0 10','#3c3f46',1.4)}</g>`,
    tail:ln('M0 0Q-5 5 -4 15',INK,3.6)+ln('M0 0Q-5 5 -4 15','#5c606a',1.8)+ell(-4,16,2.2,3.2,'#33353b'),
    head:()=>`${pth('M2 -14C-6 -24 -18 -22 -21 -12C-15 -18 -6 -17 0 -10Z','#d8ccb6')}${ell(-3,-8,6,2.6,'#474a52',' transform="rotate(-14 -3 -8)"')}${ell(9,-4,13,11.5,'#5c606a')}${pth('M10 -14C13 -26 26 -26 30 -16C24 -21 17 -20 14 -11Z','#e3d8c3')}${ell(16,2,8.6,6.4,'#767b86')}${ell(19,.8,1,1.5,'#33353b',' stroke="none"')}${ell(14.6,1.2,1,1.5,'#33353b',' stroke="none"')}<g data-k="eyes">${eyeA(9.6,-5)}</g>${ell(11,0,2.4,1.3,BLUSH,' stroke="none" opacity=".45"')}<g data-k="ear">${ell(-2,-6,6.2,2.8,'#5c606a',' transform="rotate(-10 -2 -6)"')}${ell(-2.4,-6,3.4,1.2,'#d99a96',' stroke="none" transform="rotate(-10 -2 -6)"')}</g>`,
    gait:{S:11,lift:4,cycle:40},graze:1},
  // Painted-style pig (soft gradients, rose outlines) so it sits with the hand-painted herds until a painting exists.
  pig:{vb:'-32 -50 70 54',kind:'quad',size:.84,neck:[11,-25],tailAt:[-22,-28],edge:'#b86a75',
    legs:quadLegs([6,10],[-15,-11],-14,[6,6.2],6.6,'#f7b8bf','#e9a0aa',`<path d="M-3.6 -1.4L3.6 -1.4L4 2.8Q0 3.8 -4 2.8Z" fill="#c98088" stroke="#a3545f" stroke-width="1.2" stroke-linejoin="round"/>`),
    body:id=>`<defs><radialGradient id="${id}pb" cx=".38" cy=".25" r=".85"><stop offset="0" stop-color="#ffe1e4"/><stop offset=".5" stop-color="#f8b9c0"/><stop offset="1" stop-color="#e18f9b"/></radialGradient><radialGradient id="${id}ph" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe4e7"/><stop offset=".55" stop-color="#f9bcc3"/><stop offset="1" stop-color="#e3939e"/></radialGradient><radialGradient id="${id}ps" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffc4cb"/><stop offset="1" stop-color="#ec8996"/></radialGradient><radialGradient id="${id}pk"><stop offset="0" stop-color="#f27f8c" stop-opacity=".7"/><stop offset="1" stop-color="#f27f8c" stop-opacity="0"/></radialGradient></defs><ellipse cx="-4" cy="-25" rx="21" ry="13" fill="url(#${id}pb)" stroke="#b86a75" stroke-width="1.4"/><path d="M-22 -21Q-4 -12 15 -20Q12 -13 -4 -12.4Q-19 -12.8 -22 -21Z" fill="#df8e9a" opacity=".55"/><ellipse cx="-9" cy="-32.5" rx="10" ry="2.6" fill="#fff" opacity=".45"/><path d="M-17 -27q2 -3 5 -1M-10 -30q2 -2.6 4.6 -.6" fill="none" stroke="#e59aa5" stroke-width=".9" stroke-linecap="round"/>`,
    tail:`<path d="M0 0q-4 -1.2 -4 -4.4q0 -3 3 -2.2q2.4 1 .2 3.4" fill="none" stroke="#b86a75" stroke-width="3.4" stroke-linecap="round"/><path d="M0 0q-4 -1.2 -4 -4.4q0 -3 3 -2.2q2.4 1 .2 3.4" fill="none" stroke="#f7b8bf" stroke-width="1.7" stroke-linecap="round"/>`,
    head:id=>`<path d="M-1 -11L-4.4 -21.6L5 -15Z" fill="#eea3ad" stroke="#b86a75" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="6" cy="-4" rx="11.4" ry="10.6" fill="url(#${id}ph)" stroke="#b86a75" stroke-width="1.4"/><ellipse cx="3" cy="-10" rx="5" ry="2" fill="#fff" opacity=".4"/><ellipse cx="16.6" cy="-1.4" rx="4.8" ry="5.6" fill="url(#${id}ps)" stroke="#b86a75" stroke-width="1.2"/><ellipse cx="15.4" cy="-2.6" rx="1" ry="1.8" fill="#9c4552"/><ellipse cx="18.2" cy="-2.6" rx="1" ry="1.8" fill="#9c4552"/><ellipse cx="15.8" cy="-5" rx="1.6" ry=".8" fill="#fff" opacity=".6"/><path d="M8.6 4.6Q11 6.2 13.4 4.8" fill="none" stroke="#a3545f" stroke-width="1" stroke-linecap="round"/><g data-k="eyes"><ellipse cx="7.6" cy="-6" rx="1.9" ry="2.4" fill="#3a1f18"/><circle cx="8.3" cy="-6.9" r=".8" fill="#fff"/><circle cx="7.1" cy="-4.9" r=".35" fill="#fff"/></g><ellipse cx="9.8" cy="0" rx="3.4" ry="2" fill="url(#${id}pk)"/><g data-k="ear"><path d="M3 -13L4 -23.4L12.4 -15Z" fill="url(#${id}ph)" stroke="#b86a75" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 -15L5.6 -20.4L9.8 -15.6Z" fill="#ef9aa6"/></g>`,
    gait:{S:9,lift:3.4,cycle:30},graze:1},
  goat:{vb:'-34 -66 72 70',kind:'quad',size:.9,neck:[10,-37],tailAt:[-20,-37],
    legs:quadLegs([6,10],[-17,-13],-21,[9.3,9.3],5.4,'#fbf3e3','#e3d6bf',hoof('#5a4636')),
    body:()=>`${pth('M-12 -42Q-21 -42 -21 -33L-21 -29Q-21 -20 -13 -20L8 -20Q16 -20 16 -29L16 -33Q16 -42 7 -42Z','#fbf3e3')}<path d="M-20 -25Q-2 -19 15 -25L15 -21.6Q14 -20.8 8 -20.8L-13 -20.8Q-19 -20.8 -20 -23Z" fill="#ebdfc7"/><g data-k="ribs" opacity="0">${ln('M-8 -36q-2 4 0 8M-3 -37q-2 4 0 8M2 -37q-2 4 0 8','#cdb994',1.2)}</g>`,
    tail:pth('M0 0L-4 -7L2 -2Z','#fbf3e3'),
    head:()=>`${pth('M3 -12C-1 -22 -10 -24 -13 -18C-8 -20 -3 -18 0 -10Z','#b9a07a')}${ell(-3,-6,6.4,2.4,'#e3d6bf',' transform="rotate(16 -3 -6)"')}${ell(8,-4,10,10,'#fbf3e3')}${pth('M10 4L13 14L16 4Z','#f2e6cf')}${ell(14,1,5.6,4.6,'#f8e6da')}${ell(16.4,.4,.9,1.2,'#b8867a',' stroke="none"')}${ln('M13.6 3.6Q15 4.6 16.6 3.6',INK,.9)}<g data-k="eyes">${eyeA(8.4,-5,2,2.6)}</g>${ell(9.6,-.6,2.2,1.2,BLUSH,' stroke="none" opacity=".5"')}<g data-k="ear">${ell(-2,-3,6.4,2.4,'#fbf3e3',' transform="rotate(22 -2 -3)"')}${ell(-2.4,-3,3.6,1.1,'#f2b3ad',' stroke="none" transform="rotate(22 -2 -3)"')}</g>`,
    gait:{S:11,lift:4.5,cycle:40},graze:1},
  sheep:{vb:'-34 -58 72 62',kind:'quad',size:.9,neck:[11,-32],tailAt:[-23,-31],
    legs:quadLegs([6,10],[-15,-11],-18,[7.8,7.8],5.6,'#6e5a4e','#55453c',hoof('#3e322c')),
    body:()=>`<path d="${bumps(-3,-30,21,13.5,0,360,16,4.2)}Z" fill="#fbf6ec" ${OL}/><path d="${bumps(-3,-26,16,6,20,160,6,2.2)}" fill="none" stroke="#e7dfcf" stroke-width="1.6"/>`,
    tail:`<path d="${bumps(-2,-1,4,4,0,360,6,1.6)}Z" fill="#fbf6ec" ${OL}/>`,
    head:()=>`${ell(-2,-2,6.6,2.6,'#f6e6d6',' transform="rotate(10 -2 -2)"')}${ell(9,-1,9.6,9.4,'#f6e6d6')}<path d="${bumps(6,-9,8,4.4,190,350,5,2.8)}Z" fill="#fbf6ec" ${OL}/>${ell(15.4,3,4.6,3.6,'#f7d9cf')}${ln('M14 5Q15.6 6.2 17.4 5',INK,.9)}<g data-k="eyes">${eyeA(10,-1.4,2,2.6)}</g>${ell(11.6,3,2.2,1.2,BLUSH,' stroke="none" opacity=".55"')}<g data-k="ear">${ell(-1,0,6.6,2.6,'#f6e6d6',' transform="rotate(14 -1 0)"')}${ell(-1.4,0,3.8,1.2,'#f2b3ad',' stroke="none" transform="rotate(14 -1 0)"')}</g>`,
    gait:{S:10,lift:4,cycle:36},graze:1},
  cat:{vb:'-34 -50 70 54',kind:'quad',size:.62,neck:[10,-24],tailAt:[-17,-23],
    legs:quadLegs([6,9.5],[-14,-11],-14,[5.8,5.8],4.6,'#2d2932','#1f1c23',paw('#3a3540')),
    body:()=>`${ell(-3,-20,15,7.6,'#2d2932')}${ln('M-12 -25Q-3 -27.6 6 -25','#4a4452',1.4)}`,
    tail:`<path data-k="tc" d="M0 0Q-10 -6 -8 -18" fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round"/><path data-k="tc" d="M0 0Q-10 -6 -8 -18" fill="none" stroke="#2d2932" stroke-width="3.4" stroke-linecap="round"/>`,
    head:()=>`${pth('M-2 -14L-1 -25L7 -17Z','#2d2932')}${pth('M8 -17L14 -26L17 -14Z','#2d2932')}${pth('M0 -16L.6 -22L5 -17.4Z','#f2a5b5',' stroke="none"')}${pth('M10 -17L13.6 -22.6L15.4 -15.6Z','#f2a5b5',' stroke="none"')}${ell(7,-6,11.6,10.4,'#2d2932')}<g data-k="eyes">${ell(5,-6,2.8,3.4,'#f2c94e',' stroke="none"')}${ell(5.6,-6,1,2.8,'#1a1410')}${dot(6.4,-7.4,.7,'#fff')}${ell(13.4,-6,2.4,3.2,'#f2c94e',' stroke="none"')}${ell(13.9,-6,.9,2.6,'#1a1410')}${dot(14.6,-7.4,.6,'#fff')}</g>${pth('M9.4 -1.4L11.6 -1.4L10.5 0Z','#f2a5b5',' stroke-width=".6"')}${ln('M8.4 1.4Q10.5 3 10.5 0Q10.5 3 12.6 1.4',"#8c8496",.9)}${ln('M14 0L21 -1.6M14 1.4L21 2',"#8c8496",.6)}<g data-k="ear"></g>`,
    gait:{S:9,lift:3.6,cycle:30},catTail:1},
  dog:{vb:'-34 -50 70 54',kind:'quad',size:.66,neck:[10,-25],tailAt:[-17,-25],
    legs:quadLegs([6,10],[-14,-10],-14,[5.8,5.8],5.2,'#2e2824','#211c19',paw('#3a332e')),
    body:()=>`<path d="${bumps(-3,-20,15,8,0,360,14,1.8)}Z" fill="#2e2824" ${OL}/>${ln('M-8 -24q2 -2 4 0M0 -25q2 -2 4 0M-12 -19q2 -2 4 0M-4 -18q2 -2 4 0',"#4a413a",1)}`,
    tail:`<g data-k="wag">${ln('M0 0Q-6 -4 -4 -11',INK,5.6)+ln('M0 0Q-6 -4 -4 -11','#2e2824',2.6)}</g>`,
    head:()=>`<path d="${bumps(6,-6,11.4,10.6,0,360,14,1.6)}Z" fill="#2e2824" ${OL}/>${ell(17,-1,6.4,4.8,'#3a332e')}${ell(22.4,-2.6,2.2,1.8,'#141010')}<g data-k="tongue">${pth('M15.6 3L19.4 3L19 8Q17.5 9.6 16 8Z','#f08a96',' stroke-width="1"')}</g><path d="M5 5.6Q11 8.6 17 5.4L17 7.6Q11 11 5 7.8Z" fill="#c9443a" ${OL}/>${dot(11,9,1.4,'#f2c25b')}<g data-k="eyes">${eyeA(8.4,-5.6,2.2,2.6,'#1a120c')}${eyeA(15.2,-5.6,2,2.4,'#1a120c')}</g><g data-k="ear">${pth('M-2 -12Q-8 -6 -4 4Q0 6 1 -2Q2 -9 -2 -12Z','#241f1b')}</g>`,
    gait:{S:9,lift:3.8,cycle:30},dogTail:1},
  lion:{vb:'-36 -54 74 58',kind:'quad',size:.74,neck:[10,-26],tailAt:[-18,-24],
    legs:quadLegs([6,10],[-15,-11],-15,[6.3,6.3],5.6,'#f4c25a','#dba944',paw('#fbe2b0')),
    body:()=>`${ell(-3,-21,16,8.4,'#f4c25a')}<path d="M-16 -17Q-3 -11 12 -17L12 -14Q-3 -10 -16 -14Z" fill="#fbe2b0"/>`,
    tail:`<path data-k="tc" d="M0 0Q-12 2 -14 -10" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path data-k="tc" d="M0 0Q-12 2 -14 -10" fill="none" stroke="#f4c25a" stroke-width="2" stroke-linecap="round"/><g data-k="tt">${pth('M-14 -10Q-19 -14 -16 -18Q-12 -16 -11 -12Z','#e8892e')}</g>`,
    head:()=>`<path d="${bumps(6,-6,14.6,13.6,0,360,16,3.6)}Z" fill="#e8892e" ${OL}/>${ell(-1,-14,3.4,3.4,'#f4c25a')}${ell(13,-15,3.2,3.2,'#f4c25a')}${ell(7,-5,10,9.4,'#f4c25a')}${ell(13,0,5.6,4.2,'#fbe2b0')}${pth('M11.6 -1.8L15.4 -1.8L13.5 .4Z','#8a4a2a',' stroke-width=".7"')}${ln('M11 2Q13.5 4 13.5 1Q13.5 4 16 2',INK,.9)}<g data-k="eyes">${eyeA(6.6,-6,2.2,2.6,'#3a2414')}${eyeA(13.4,-6,2,2.4,'#3a2414')}</g>${ell(8,-1,2,1.2,BLUSH,' stroke="none" opacity=".55"')}<g data-k="ear"></g>`,
    gait:{S:10,lift:4,cycle:32},catTail:1},
  chicken:{vb:'-24 -46 46 50',kind:'bird',size:.55,neck:[6,-25],tailAt:[-12,-24],hipY:-10,
    legs:[{at:[-1,-10],l:[4.6,5.2],w:2.2,c:'#d98a24',near:0,o:.5},{at:[2,-10],l:[4.6,5.2],w:2.2,c:'#f0a030',near:1,o:0}],
    toes:c=>ln('M0 0L4.6 1.4M0 0L3.2 2.4M0 0L-2.6 1.4',c,1.4),
    body:()=>`${ell(-1,-19,12.6,10.6,'#fffaf0')}<path d="M-12 -16Q-1 -9 11 -16Q9 -9.4 -1 -8.6Q-10 -9 -12 -16Z" fill="#ece2cf"/>`,
    tail:pth('M2 2C-6 0 -9 -8 -6 -12C-3 -8 -1 -6 2 -4Z','#fffaf0')+pth('M2 0C-3 -5 -3 -12 1 -14C2 -9 3 -6 4 -3Z','#fffaf0'),
    wing:pth('M-8 -2Q-6 -9 2 -8Q8 -6 6 0Q4 3 -2 3Q-7 3 -8 -2Z','#f6efe0')+ln('M-4 0Q-1 1 1 -1M-2 2Q1 2.6 3 1',"#d9cdb6",1),wingAt:[-1,-19],
    head:()=>`${pth('M0 -12Q1 -17 4 -14Q6 -18 8 -14Q11 -17 11 -11Z','#e5483d')}${ell(4,-6,7.6,7.6,'#fffaf0')}${pth('M10.6 -7L15.6 -5.4L10.6 -3.6Z','#f0a030')}${pth('M9.4 -2.6Q11.6 -1.4 10.4 2.4Q8.2 1 9.4 -2.6Z','#e5483d',' stroke-width="1"')}<g data-k="eyes">${eyeA(6.4,-7.4,1.5,1.9)}</g>${ell(6,-3.4,1.8,1,BLUSH,' stroke="none" opacity=".6"')}`,
    gait:{S:7,lift:3.4,cycle:16},bob:1},
  duck:{vb:'-24 -44 48 48',kind:'bird',size:.55,neck:[7,-22],tailAt:[-14,-19],hipY:-7,
    legs:[{at:[-2,-7.4],l:[3.4,3.8],w:2.4,c:'#e0882a',near:0,o:.5},{at:[2,-7.4],l:[3.4,3.8],w:2.4,c:'#f39a36',near:1,o:0}],
    toes:c=>pth('M-1.6 -.4L5.6 1.2L4.6 2.2L-1.6 2.2Z',c,' stroke-width="1"'),
    body:()=>`${pth('M-15 -20Q-14 -26 -6 -26L4 -25Q14 -24 14 -16Q14 -7 2 -7L-8 -7Q-15 -8 -15 -14Z','#fff2b3')}<path d="M-14 -13Q0 -6.6 13 -13Q12 -7.4 2 -7.4L-8 -7.4Q-14 -8.4 -14 -13Z" fill="#f2e09a"/>`,
    tail:pth('M2 0Q-2 -6 -4 -9Q2 -6 5 -2Z','#fff2b3'),
    wing:pth('M-9 -1Q-7 -7 2 -6Q8 -4 6 1Q3 4 -3 3Q-8 2.6 -9 -1Z','#fbe8a0'),wingAt:[-2,-16],
    head:()=>`${ell(4,-6,8,7.8,'#fff2b3')}${pth('M10 -7Q17 -8 19 -5Q18 -2 11 -2.6Z','#f39a36')}${ln('M11 -4.6Q15 -4.6 18 -4.8','#c66f1c',.8)}<g data-k="eyes">${eyeA(6.6,-8,1.6,2)}</g>${ell(6.4,-3.6,2,1.1,BLUSH,' stroke="none" opacity=".6"')}${pth('M2 -14Q4 -17 6 -14','#fff2b3',' stroke-width="1"')}`,
    gait:{S:6.6,lift:2.6,cycle:15},waddle:1},
  pigeon:{vb:'-24 -38 46 42',kind:'bird',size:.5,neck:[6,-19],tailAt:[-12,-15],hipY:-7,
    legs:[{at:[-2,-7],l:[3,3.2],w:2,c:'#c96a6a',near:0,o:.5},{at:[1.6,-7],l:[3,3.2],w:2,c:'#e07c7c',near:1,o:0}],
    toes:c=>ln('M0 0L4 1.2M0 0L2.8 2.2M0 0L-2.2 1.2',c,1.2),
    body:()=>`${ell(-2,-14.4,12,8.2,'#a3a9b8')}<path d="M-13 -11.4Q-2 -5.6 10 -11.4Q8 -6.6 -2 -6.4Q-11 -6.8 -13 -11.4Z" fill="#8f96a6"/>`,
    tail:pth('M3 0L-9 3L-8 -2Z','#7b8192')+ln('M-8 1.6L-6 -1.4','#3f4350',2),
    wing:pth('M-9 -1Q-7 -7 2 -6Q8 -4 6 1Q3 4 -3 3Q-8 2.6 -9 -1Z','#8f96a6')+ln('M-4 -1.6L-1 2.4M0 -2L3 2',"#3f4350",1.6),wingAt:[-2,-13.4],
    head:()=>`<path d="M-4 3Q-5 -4 0 -7L6 -6Q8 0 5 5Z" fill="#6fae8c" ${OL}/><path d="M-3 2Q-2 -3 2 -4L6 -2Q6 2 4 5Z" fill="#9a6fb8"/>${ell(3.6,-8,6.2,5.8,'#9aa3b8')}${pth('M9 -9L13 -7.4L9 -6.2Z','#3f4350',' stroke-width="1"')}${ell(8.8,-9.2,1.4,.9,'#f4f2ee',' stroke="none"')}<g data-k="eyes">${dot(5.6,-9,2,'#e8963a')}${dot(5.6,-9,1.1,'#1a1410')}${dot(6,-9.4,.4,'#fff')}</g>`,
    gait:{S:6,lift:2.8,cycle:14},bob:1,peck:-1}
};
// Image path used by the old artwork → species key. The 'buffalo' herd (key kept for saves) is now raised as pigs.
const SRC={'pens/cow-animal.png':'cow','pens/buffalo-animal.png':'pig','pens/goat-animal.png':'goat','pens/sheep-animal.png':'sheep','pens/chicken-animal.png':'chicken','pens/duck-animal.png':'duck','pets/black-cat.png':'cat','pets/black-dog.png':'dog','pets/lion.png':'lion','pets/pigeon.png':'pigeon'};

function animalState(){return {t:Math.random()*20,phase:Math.random(),w:0,trot:0,flip:1,turn:null,blinkAt:1+Math.random()*4,blink:0,act:null,actAt:1.5+Math.random()*4,head:{x:0,v:0},tail:{x:0,v:0},ear:0}}
// Plumpness from the herd's mood: -1 thin (hungry), 0 normal, 1 round (fed).
const MOOD_PLUMP={hungry:-1,fed:1,ready:1};
function animalPose(sp,st){
  const w=st.w,ph=st.phase,g=sp.gait,P={legs:[],w};
  const pl=st.plump||0,sx=1+(pl<0?pl*.05:pl*.08),sy=1+(pl<0?pl*.2:pl*.16),cx=sp.legs.reduce((a,L)=>a+L.at[0],0)/sp.legs.length,ay=sp.legs[0].at[1],swell=([x,y])=>[cx+(x-cx)*sx,ay+(y-ay)*sy];
  Object.assign(P,{sx,sy,cx,ay,ribs:Math.max(0,-pl)*.75,neck:swell(sp.neck),tailAt:swell(sp.tailAt),wingAt:sp.wingAt?swell(sp.wingAt):null});
  const tw=st.trot,S=g.S*lerp(1,1.35,tw),lift=g.lift*lerp(1,1.3,tw);
  const act=st.act,au=act?act.u:0,actW=act?Math.sin(Math.PI*Math.min(1,au))**.5:0;
  if(sp.kind==='quad'){
    const stance=lerp(.64,.46,tw),bob=w*lerp(.9,1.6,tw)*(1+Math.cos(2*TAU*ph))/2;
    P.body={y:bob,r:w*1.2*Math.sin(TAU*ph)};
    const offs=[.5,lerp(.75,0,tw),0,lerp(.25,.5,tw)];
    sp.legs.forEach((L,i)=>{const f=foot(ph+offs[i],stance),lx=cx+(L.at[0]-cx)*sx,at=[lx,L.at[1]+bob],ax=lx+w*f.x*S,ay=-2.6-w*f.lift*lift,[k,a]=ik(at,[ax,ay],L.l[0],L.l[1],L.hind?1:-1);P.legs.push({h:at,k,a})});
    let hr=w*2*Math.sin(2*TAU*ph+1)+(1-w)*st.head.x,hx=0,hy=bob;
    if(act&&act.type==='graze'){hr+=actW*34;hx+=actW*2;hy+=actW*7}
    if(act&&act.type==='look'){hr+=actW*-10}
    P.head={x:P.neck[0]+hx,y:P.neck[1]+hy,r:hr};
    P.tail={r:(sp.dogTail?(10+st.tail.x):st.tail.x),y:bob};
  }else{
    const stance=.56;
    P.body={y:0,r:sp.waddle?w*5*Math.sin(TAU*ph):0};
    sp.legs.forEach((L,i)=>{const f=foot(ph+L.o,stance),lx=cx+(L.at[0]-cx)*sx,at=[lx,L.at[1]],ax=lx+w*f.x*S,ay=-1.1-w*f.lift*lift,[k,a]=ik(at,[ax,ay],L.l[0],L.l[1],1);P.legs.push({h:at,k,a})});
    // Head bob (chicken, pigeon): the head holds still in space, then snaps forward, twice per stride.
    let hx=0,hr=0,hy=0;
    if(sp.bob){const u=(ph*2)%1,hold=.68;hx=w*(u<hold?2.4-4.8*u/hold:-2.4+4.8*ease((u-hold)/(1-hold)))}
    else hy=w*.8*Math.sin(2*TAU*ph);
    if(act&&act.type==='peck'){const k=Math.max(0,Math.sin(Math.PI*((au*3)%1)))*Math.min(1,au*4)*Math.min(1,(1-au)*4);hr+=k*48;hx+=k*3;hy+=k*7}
    if(act&&act.type==='look')hr+=actW*-14;
    hr+=(1-w)*st.head.x;
    P.head={x:P.neck[0]+hx,y:P.neck[1]+hy,r:hr};
    P.tail={r:st.tail.x,y:0};P.wing=act&&act.type==='flap'?Math.sin(au*TAU*4)*30*actW:0;
  }
  P.flip=st.flip;P.squash=st.turn?1-.6*Math.sin(Math.PI*st.turn.u):1;P.blink=st.blink;P.wag=st.wag||0;P.tongue=st.tongue||0;P.ear=st.ear;
  return P;
}
function animalDyn(sp,P){
  const D={root:{transform:`scale(${r2(P.flip*P.squash)} 1)`},shadow:{transform:`scale(${r2(1-P.w*.04)} 1)`}};
  P.legs.forEach((L,i)=>{const d=qd(hose(L.h,L.k,L.a));D['lo'+i]={d};D['ls'+i]={d};D['lf'+i]={transform:`translate(${pt(L.a)})`}});
  D.body={transform:`translate(0 ${r2(P.body.y)}) rotate(${r2(P.body.r)} 0 -16) translate(${r2(P.cx)} ${r2(P.ay)}) scale(${r2(P.sx)} ${r2(P.sy)}) translate(${r2(-P.cx)} ${r2(-P.ay)})`};D.ribs={opacity:r2(P.ribs)};
  D.head={transform:`translate(${pt([P.head.x,P.head.y])}) rotate(${r2(P.head.r)})`};
  D.tail={transform:`translate(${pt([P.tailAt[0],P.tailAt[1]+P.tail.y])}) rotate(${r2(P.tail.r)})`};
  if(P.wingAt)D.wing={transform:`translate(${pt([P.wingAt[0],P.wingAt[1]+P.body.y])}) scale(${r2(P.sx)} ${r2(P.sy)}) rotate(${r2(-(P.wing||0))} -6 -2)`};
  D.eyes={transform:`translate(0 ${r2(-6)}) scale(1 ${r2(1-P.blink*.9)}) translate(0 6)`};
  D.ear={transform:`rotate(${r2(P.ear)} -3 -8)`};
  if(sp.catTail){const s=P.tail.r,d=`M0 0Q${r2(-10-s*.15)} ${r2(-6+s*.1)} ${r2(-8-s*.35)} -18`;D.tc={d};D.tt={transform:`translate(${r2(-s*.3)} 0)`}}
  if(sp.dogTail)D.wag={transform:`rotate(${r2(P.wag)})`};
  D.tongue={opacity:P.tongue>.5?1:0};
  return D;
}
function animalInner(key,id,D){
  const sp=SPECIES[key];let far='',near='';
  sp.legs.forEach((L,i)=>{const lg=`<path${A(D,'lo'+i)} fill="none" stroke="${sp.edge||INK}" stroke-width="${L.w+(sp.kind==='bird'?2.2:sp.edge?2.6:3.2)}" stroke-linecap="round"/><path${A(D,'ls'+i)} fill="none" stroke="${L.c}" stroke-width="${L.w}" stroke-linecap="round"/><g${A(D,'lf'+i)}>${sp.kind==='bird'?sp.toes(L.c):(L.near?L.end:L.end.replace(/fill="#([0-9a-f]{6})"/,(m,h)=>`fill="${shade('#'+h,.8)}"`))}</g>`;if(L.near)near+=lg;else far+=lg});
  const vb=sp.vb.split(' ').map(Number);
  return `<g${A(D,'root')}><ellipse${A(D,'shadow')} cx="0" cy="-.4" rx="${r2(vb[2]*.3)}" ry="${r2(vb[3]*.06)}" fill="#3b2a12" opacity=".24"/>${far}<g${A(D,'tail')}>${sp.tail}</g><g${A(D,'body')}>${sp.body(id)}</g>${sp.wing?`<g${A(D,'wing')}>${sp.wing}</g>`:''}<g${A(D,'head')}>${sp.head(id).replace('data-k="eyes"',`data-k="eyes" transform="${D.eyes.transform}"`).replace('data-k="ear"',`data-k="ear" transform="${D.ear.transform}"`)}</g>${near}</g>`;
}
function animalMarkup(key,o={}){
  if(!SPECIES[key])return '';const st=animalState();st.phase=0;st.plump=MOOD_PLUMP[o.mood]||0;if(o.face==='left')st.flip=-1;const id=uid(),D=animalDyn(SPECIES[key],animalPose(SPECIES[key],st));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="ar-animal${o.cls?' '+o.cls:''}" viewBox="${SPECIES[key].vb}" data-ar-animal="${key}"${o.mood?` data-ar-mood="${esc(o.mood)}"`:''} ${o.label===false?' aria-hidden="true" focusable="false"':` role="img" aria-label="${esc(o.label||key)}"`}${o.style?` style="${esc(o.style)}"`:''}>${animalInner(key,id,D)}</svg>`;
}
class Animal{
  constructor(svg){this.svg=svg;this.key=svg.getAttribute('data-ar-animal');this.sp=SPECIES[this.key];this.mood=svg.getAttribute('data-ar-mood')||'';this.st=animalState();this.st.plump=MOOD_PLUMP[this.mood]||0;this.cache=new Map();this.nodes={};svg.querySelectorAll('[data-k]').forEach(n=>{const k=n.getAttribute('data-k');(this.nodes[k]=this.nodes[k]||[]).push(n)});svg._ar=this}
  static create(key,o={}){const tmp=document.createElement('div');tmp.innerHTML=animalMarkup(key,o);return new Animal(tmp.firstChild)}
  face(dir){dir=dir<0?-1:1;if(this.st.turn){this.st.turn.want=dir;return}if(dir!==this.st.flip)this.st.turn={u:0,want:dir,swapped:false}}
  act(type,dur){this.st.act={type,u:0,dur}}
  // input: {speed: units / s, idle: true lets the animal graze / peck / look around by itself, plump: -1..1 override}
  update(dt,inp={}){
    const st=this.st,sp=this.sp,g=sp.gait;dt=Math.min(dt,1/20);st.t+=dt;
    st.plump=inp.plump!==undefined?inp.plump:approach(st.plump,MOOD_PLUMP[this.mood]||0,3,dt);
    const spd=Math.max(0,inp.speed||0);
    st.trot=approach(st.trot,sp.kind==='quad'?clamp((spd-g.cycle*1.6)/(g.cycle*1.2),0,1):0,4,dt);
    st.phase=(st.phase+spd*dt/(g.cycle*lerp(1,1.45,st.trot)))%1;
    st.w=approach(st.w,spd>1.5?1:0,spd>1.5?10:7,dt);
    if(st.turn){const T=st.turn;T.u=Math.min(1,T.u+dt/.16);if(T.u>=.5&&!T.swapped){T.swapped=true;st.flip=T.want}if(T.u>=1){st.turn=null;if(T.want!==st.flip)this.face(T.want)}}
    if(st.act){st.act.u+=dt/st.act.dur;if(st.act.u>=1||st.w>.3)st.act=null}
    else if(inp.idle!==false&&st.w<.1){st.actAt-=dt;if(st.actAt<=0){const r=Math.random();if(sp.graze&&r<.55)this.act('graze',2.2+Math.random()*2.5);else if(sp.kind==='bird'&&!sp.waddle&&r<.6)this.act('peck',1.1+Math.random()*.8);else if(sp.kind==='bird'&&r<.75)this.act('flap',.6);else this.act('look',1.4+Math.random());st.actAt=1.5+Math.random()*4.5}}
    st.blinkAt-=dt;if(st.blinkAt<=0){st.blinkT=0;st.blinkAt=2+Math.random()*4}
    if(st.blinkT!==undefined){st.blinkT+=dt;const u=st.blinkT/.16;st.blink=u<1?Math.sin(Math.PI*u):0;if(u>=1)delete st.blinkT}
    // Standing still: the head settles on a new angle now and then and the tail flicks, instead of swaying non-stop.
    st.fidgetAt=(st.fidgetAt??Math.random()*3)-dt;if(st.fidgetAt<=0){st.headTo=(Math.random()*2-1)*4;st.flick=st.t;st.fidgetAt=2+Math.random()*4}
    spring(st.head,(1-st.w)*((st.headTo||0)+(this.mood==='hungry'?8:0)),20,8,dt);
    const flick=st.flick!==undefined&&st.t-st.flick<.7?Math.sin((st.t-st.flick)/.7*TAU)*16:0;
    st.wag=sp.dogTail?Math.sin(st.t*(st.w>.5?14:9))*(st.w>.5?14:22):0;st.tongue=sp.dogTail&&(st.w>.5||Math.sin(st.t*.4)>-.2)?1:0;
    spring(st.tail,sp.catTail?Math.sin(st.t*1.3)*12-st.w*8:sp.kind==='bird'?-st.w*4+flick*.25:st.w*(6+Math.sin(TAU*st.phase)*6)+flick,30,6,dt);
    st.ear=st.flick!==undefined&&st.t-st.flick>1&&st.t-st.flick<1.35?Math.sin((st.t-st.flick-1)/.35*TAU*2)*8:0;
    this.apply();
  }
  apply(){const D=animalDyn(this.sp,animalPose(this.sp,this.st));for(const k in D){const ns=this.nodes[k];if(!ns)continue;const a=D[k];for(const n in a){const ck=k+'|'+n,v=String(a[n]);if(this.cache.get(ck)===v)continue;this.cache.set(ck,v);for(const el of ns)el.setAttribute(n,v)}}}
}

// Bring a static drawing (made by charMarkup / animalMarkup) to life.
function hydrate(svg){if(svg._ar)return svg._ar;if(svg.hasAttribute('data-ar-char'))return new Character(svg);if(svg.hasAttribute('data-ar-animal')&&SPECIES[svg.getAttribute('data-ar-animal')])return new Animal(svg);return null}

root.AvatarRig={look:lookFor,char:charMarkup,fisher,img:asImg,animal:animalMarkup,Character,Animal,hydrate,outfits:OUTFITS,shoes:SHOES,hairs:HS,species:SPECIES,speciesOf:src=>SRC[String(src).split('?')[0]]||null,defaultHair:g=>DEFAULT_HAIR[g==='male'?'male':'female'],outfitShoe:k=>(OUTFITS[k]||OUTFITS.base).shoe,CHAR_VB};
})(typeof window==='undefined'?globalThis:window);
