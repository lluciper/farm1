'use strict';
const villageDoors=[
 {key:'street',name:'Phố đi bộ',icon:'🚶',x:81,y:51,arrival:{x:74,y:56}},
 {key:'farm',name:'Nông trại',icon:'🌱',x:23,y:28,arrival:{x:32,y:38}},
 {key:'market',name:'Tạp hoá',icon:'🛒',x:58,y:22,arrival:{x:56,y:33}},
 {key:'cafe',name:'Quán cà phê',icon:'☕',x:62,y:34,arrival:{x:62,y:43}},
 {key:'beauty',name:'Khu làm đẹp',icon:'💇',x:22,y:70,arrival:{x:34,y:69}},
 {key:'karaoke',name:'Karaoke',icon:'🎤',x:60,y:74,arrival:{x:60,y:82}}
];
function villageScene(){return `<div class="village-square"><img class="village-art" src="village-map-hd.webp" alt="Bản đồ làng với đường nối tới nông trại, tạp hoá, quán cà phê, khu làm đẹp và karaoke"><div class="village-title"><span>🏘️</span><div><b>Làng Mây</b><small>Chạm vào cửa để đến từng khu</small></div></div>${villageDoors.map(d=>{const locked=!s.unlocked[d.key];return `<button class="village-door ${locked?'locked':''}" style="left:${d.x}%;top:${d.y}%" data-door="${d.key}" data-x="${d.arrival.x}" data-y="${d.arrival.y}" ${locked?'aria-label="'+d.name+' · mở cấp '+F.zones[d.key].level+'"':''}><span>${d.icon}</span><b>${d.name}</b>${locked?`<small>🔒 Cấp ${F.zones[d.key].level}</small>`:''}</button>`}).join('')}</div>`}
document.addEventListener('click',e=>{const d=e.target.closest('[data-door]');if(!d||!d.dataset.door||window.farmSync?.blocked)return;const key=d.dataset.door;if(!s.unlocked[key]){travel(key);return}const x=Number(d.dataset.x),y=Number(d.dataset.y);clearTimeout(window.villageWalkTimer);if(movePlayer(x,y,()=>{if(s.zone==='village')travel(key)})===true)return;window.villageWalkTimer=setTimeout(()=>{if(s.zone==='village'&&Math.abs(s.pos.x-x)<4&&Math.abs(s.pos.y-y)<5)travel(key)},600)});
