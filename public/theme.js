'use strict';
// Xóm nhỏ theme helpers: daylight by local time, drifting leaves, and a centred village map on narrow screens.
// Phones get the low-power look (responsive-v61.css): no backdrop blur or scenery filter, no decorative CSS loops.
if(matchMedia('(pointer:coarse)').matches||matchMedia('(max-width:700px)').matches)document.documentElement.classList.add('low-power');
(()=>{
const root=document.documentElement,world=document.getElementById('world'),stage=document.getElementById('stage');
root.classList.add('xom');
const forced=new URLSearchParams(location.search).get('daypart');
function daypart(){if(['dawn','day','golden','dusk','night'].includes(forced))return forced;const d=new Date(),h=d.getHours()+d.getMinutes()/60;return h>=5&&h<7?'dawn':h>=7&&h<16?'day':h<17.5&&h>=16?'golden':h<19&&h>=17.5?'dusk':'night'}
const tick=()=>{root.dataset.daypart=daypart()};tick();setInterval(tick,300000);
if(world&&!world.querySelector('.xom-ambient')){const layer=document.createElement('div');layer.className='xom-ambient';layer.setAttribute('aria-hidden','true');for(let i=0;i<8;i++){const leaf=document.createElement('i');leaf.style.left=(6+i*12+Math.random()*6).toFixed(1)+'%';leaf.style.setProperty('--dur',(11+Math.random()*9).toFixed(1)+'s');leaf.style.setProperty('--delay',(-Math.random()*18).toFixed(1)+'s');layer.appendChild(leaf)}world.appendChild(layer)}
// Village map: as large as the play area allows while every door (22%–62% across) stays on screen; wider maps pan sideways.
const RATIO=1672/941,DOORS={from:.22,to:.62},DOOR_W=96;let lastZone='';
function sizeVillage(recentre){if(!world.classList.contains('zone-village')){world.style.removeProperty('--village-w');if(recentre)stage.scrollLeft=0;return}const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const fit=Math.min(w,h*RATIO),doors=(w-DOOR_W)/(DOORS.to-DOORS.from),width=Math.round(Math.max(fit,Math.min(doors,h*RATIO)));world.style.setProperty('--village-w',width+'px');if(recentre)requestAnimationFrame(()=>{stage.scrollLeft=Math.max(0,Math.round(width*(DOORS.from+DOORS.to)/2-w/2))})}
function zoneChanged(){const zone=world.classList.contains('zone-village')?'village':'other';const entered=zone!==lastZone;lastZone=zone;sizeVillage(entered)}
if(world&&stage){new MutationObserver(zoneChanged).observe(world,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',()=>sizeVillage(true));zoneChanged()}
// Toasts drop just below the header and zone tabs so they never cover the title or top buttons.
const nav=document.getElementById('zoneNav');const placeToast=()=>{if(nav)root.style.setProperty('--toast-top',Math.round(nav.getBoundingClientRect().bottom+8)+'px')};placeToast();window.addEventListener('resize',placeToast);if(nav&&window.ResizeObserver)new ResizeObserver(placeToast).observe(nav);
// Street lamps: four at the corners of the farm lawn, six along the village paths. CSS lights them at dusk and night.
const LAMP_SVG='<svg viewBox="0 0 40 120" aria-hidden="true"><rect x="12" y="110" width="16" height="9" rx="2" fill="#6d5a48"/><rect x="14" y="106" width="12" height="5" rx="1.5" fill="#57473a"/><rect x="18" y="40" width="4" height="68" fill="#3d3129"/><rect x="18.7" y="40" width="1.1" height="68" fill="#7a6654"/><rect x="16" y="64" width="8" height="3" rx="1" fill="#3d3129"/><path d="M15 40h10l-2-3h-6z" fill="#3d3129"/><path d="M9 21 20 11l11 10z" fill="#3d3129"/><circle cx="20" cy="9.5" r="2.2" fill="#3d3129"/><rect x="11" y="20.5" width="18" height="17" rx="2" fill="#3d3129"/><rect class="glass" x="13" y="22.5" width="14" height="13" rx="1"/><rect class="glass-shine" x="14.5" y="24" width="3" height="10" rx="1"/><path d="M20 22.5v13M13 29h14" stroke="#3d3129" stroke-width="1.2"/></svg>';
const FARM_LAMPS=[[285,395],[1295,335],[300,790],[1225,840]];
const VILLAGE_LAMPS=[[30,40],[45,27],[36,54],[64,50],[33,77],[72,84]];
let lamps=null;
function ensureLamps(n){if(!lamps){lamps=document.createElement('div');lamps.className='xom-lamps';lamps.setAttribute('aria-hidden','true');world.appendChild(lamps)}while(lamps.children.length<n){const lamp=document.createElement('div');lamp.className='xom-lamp';lamp.innerHTML='<span class="pool"></span>'+LAMP_SVG+'<span class="halo"></span>';lamps.appendChild(lamp)}[...lamps.children].forEach((lamp,i)=>{lamp.hidden=i>=n});return [...lamps.children].slice(0,n)}
function place(lamp,x,y,h){lamp.style.left=x+'px';lamp.style.top=y+'px';lamp.style.setProperty('--lamp-h',Math.round(h)+'px')}
function layoutLamps(){if(!world)return;const zone=world.classList.contains('zone-farm')?'farm':world.classList.contains('zone-village')?'village':'';if(!zone){if(lamps)lamps.hidden=true;return}const w=world.clientWidth,h=world.clientHeight;if(!w||!h)return;ensureLamps(0);lamps.hidden=false;
if(zone==='village'){const size=h*.12;ensureLamps(VILLAGE_LAMPS.length).forEach((lamp,i)=>place(lamp,w*VILLAGE_LAMPS[i][0]/100,h*VILLAGE_LAMPS[i][1]/100,size));return}
// Farm: the corners of the green lawn in farm art (pixels of the 1536 x 1024 original), mapped through the image's object-fit:cover crop.
const nw=1536,nh=1024,scale=Math.max(w/nw,h/nh),ox=(w-nw*scale)/2,oy=(h-nh*scale)/2,size=Math.max(64,Math.min(130,170*scale)),edge=size*.22;
ensureLamps(FARM_LAMPS.length).forEach((lamp,i)=>{const [px,py]=FARM_LAMPS[i];place(lamp,Math.min(w-edge,Math.max(edge,ox+px*scale)),Math.min(h-4,Math.max(size,oy+py*scale)),size)})}
const scene=document.getElementById('scene');let lampFrame=0;const relayout=()=>{cancelAnimationFrame(lampFrame);lampFrame=requestAnimationFrame(layoutLamps)};
if(world){new MutationObserver(relayout).observe(world,{attributes:true,attributeFilter:['class']});if(scene)new MutationObserver(relayout).observe(scene,{childList:true});window.addEventListener('resize',relayout);if(window.ResizeObserver)new ResizeObserver(relayout).observe(world);relayout()}
// Mouse wheels scroll the zone tabs sideways (their scrollbar is hidden).
const tabs=document.getElementById('zoneNav');if(tabs)tabs.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&tabs.scrollWidth>tabs.clientWidth){tabs.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});
// ---------- Motion: plot effects, coin counter, butterflies (walking lives in avatar-world.js) ----------
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function fx(kind,x,y,extra={}){if(reduced||!world)return null;const el=document.createElement(kind==='harvest'?'img':'span');el.className='xom-fx '+kind;el.style.left=x+'px';el.style.top=y+'px';for(const [k,v] of Object.entries(extra))k==='src'?el.src=v:el.style.setProperty(k,v);world.appendChild(el);setTimeout(()=>el.remove(),1000);return el}
// Compare every plot with the previous render and play the matching effect.
let prevPlots=null,prevZone='';
function plotEffects(){if(!world||typeof s==='undefined'||!s?.plots)return;const zone=world.classList.contains('zone-farm')?'farm':'';const snap=s.plots.map(p=>p?{crop:p.crop,water:p.water,pest:p.pest,stage:cropStageKey(p)}:null);
  if(zone==='farm'&&prevZone==='farm'&&prevPlots&&!reduced){const wr=world.getBoundingClientRect();
    document.querySelectorAll('.plot[data-index]').forEach(el=>{const idx=Number(el.dataset.index),cur=snap[idx],old=prevPlots[idx];if(!cur&&!old)return;const r=el.getBoundingClientRect(),cx=r.left+r.width/2-wr.left,cy=r.top+r.height/2-wr.top;
      if(cur&&!old){el.classList.add('xom-planted');for(let k=0;k<5;k++)fx('dirt',cx+(k-2)*7,cy+r.height*.25,{'--dx':(k-2)*9+'px','--dy':(-10-Math.random()*14)+'px'})}
      else if(!cur&&old){const img=window.goodsArtSrc?.(old.crop)||old.src;if(img)fx('harvest',cx,cy,{src:img});for(let k=0;k<4;k++)fx('spark',cx+(k-1.5)*14,cy,{'--dx':(k-1.5)*16+'px','--dy':(-24-Math.random()*16)+'px'})}
      else if(cur&&old){if(cur.water&&!old.water){el.classList.add('xom-watered');fx('ring',cx,cy+r.height*.2);for(let k=0;k<4;k++)setTimeout(()=>fx('drop',cx+(k-1.5)*11,cy+r.height*.1),k*70)}
        if(old.pest&&!cur.pest)for(let k=0;k<3;k++)fx('puff',cx+(k-1)*12,cy,{'--dx':(k-1)*10+'px'});
        if(cur.stage!==old.stage&&cur.water&&old.water){el.classList.add('xom-grew');if(cur.stage==='ready')for(let k=0;k<5;k++)fx('spark',cx+(k-2)*10,cy-r.height*.1,{'--dx':(k-2)*12+'px','--dy':(-20-Math.random()*20)+'px'})}}})}
  document.querySelectorAll('.plot[data-index]').forEach(el=>{const cur=snap[Number(el.dataset.index)];if(cur)cur.src=el.querySelector('img.crop-img')?.src||''});
  prevPlots=snap;prevZone=zone}
const cropStageKey=p=>typeof cropStage==='function'?cropStage(p).key:'';
// subtree: some actions re-render only the field inside the scene. Coalesce bursts into one check per frame.
let fxFrame=0;if(scene)new MutationObserver(()=>{if(!fxFrame)fxFrame=requestAnimationFrame(()=>{fxFrame=0;plotEffects()})}).observe(scene,{childList:true,subtree:true});requestAnimationFrame(plotEffects);
// Coins count up/down instead of jumping. Runs right after each game render (no observer on the number itself,
// which would re-trigger on its own writes).
const coinsEl=document.getElementById('coins'),coinBox=coinsEl?.closest('.coins');
if(coinsEl&&!reduced&&typeof render==='function'){let shown=null,target=null,raf=0;const fmt=n=>Math.round(n).toLocaleString('vi-VN');
  const baseRender=render;
  render=function(...args){const out=baseRender.apply(this,args);const next=Math.floor(Number(s?.coins)||0);
    if(shown===null){shown=target=next;return out}
    if(next!==target){const from=shown,start=performance.now(),dur=Math.min(900,300+Math.log10(Math.abs(next-from)+1)*150);target=next;cancelAnimationFrame(raf);coinBox?.classList.remove('xom-bump');void coinBox?.offsetWidth;coinBox?.classList.add('xom-bump');
      const step=now=>{const k=Math.min(1,(now-start)/dur),e=1-Math.pow(1-k,3);shown=k<1?from+(target-from)*e:target;coinsEl.textContent=fmt(shown);if(k<1)raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step)}
    coinsEl.textContent=fmt(shown);return out}}
// Two butterflies drift over outdoor scenes by day (hidden by CSS at night and indoors).
if(world&&!reduced&&!world.querySelector('.xom-butterfly'))[['22%','35%','#f4a3b5','17s','0s'],['64%','55%','#f8ca4c','21s','-7s']].forEach(([x,y,c,d,dl])=>{const b=document.createElement('span');b.className='xom-butterfly';b.setAttribute('aria-hidden','true');b.style.cssText='--bx:'+x+';--by:'+y+';--bcol:'+c+';--bdur:'+d+';--bdelay:'+dl;world.appendChild(b)});
})();
