'use strict';
(()=>{
const zones=new Set(['home','cafe','beauty','karaoke','street']);let queued=false;
function fit(){queued=false;const active=zones.has(s.zone);document.documentElement.classList.toggle('venue-layout',active);if(!active)return;const header=document.querySelector('.game > header'),nav=document.getElementById('zoneNav'),vv=window.visualViewport,height=vv?.height||innerHeight;const top=Math.min(Math.max(0,header?.getBoundingClientRect().bottom||0,nav?.getBoundingClientRect().bottom||0)+12,height*.4);document.documentElement.style.setProperty('--venue-top',top+'px');document.documentElement.style.setProperty('--venue-height',Math.max(100,height-top-12)+'px')}
function schedule(){if(!queued){queued=true;requestAnimationFrame(fit)}}
new MutationObserver(schedule).observe(document.getElementById('world'),{attributes:true,attributeFilter:['class']});window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);if(typeof ResizeObserver==='function'){const o=new ResizeObserver(schedule);for(const el of [document.querySelector('.game > header'),document.getElementById('zoneNav')])if(el)o.observe(el)}document.fonts?.ready.then(schedule);fit();
})();

 document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('game-hidden',document.hidden));
