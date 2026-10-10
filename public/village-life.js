'use strict';
// Reeling in: a fish is on the line. Hold Space (or hold the button / the bar on a phone) to lift the green hook zone;
// let go and it sinks. Keep the fish inside the zone to fill the catch bar; leave it outside too long and it gets away
// with the bait — the spot is empty again ('missFish'). Each fish has its own strength: better bait hooks bigger fish,
// and now and then a big one turns up; strong fish dart faster and slip away quicker. Tuned by simulating a player who
// reacts ~0.2 s late: about 9 in 10 fish land on plain bait, 8 in 10 on good bait, 2 in 3 on special bait.
let reel=null;
function startReel(index){if(reel)return;const bait=F.fishingBait(s,index),big=Math.random()<.18,power=(({basic:.2,good:.35,premium:.5})[bait]??.35)+Math.random()*.45+(big?.45:0);
 reel={index,power,zone:.1,v:0,fish:.4,target:.5,turnAt:0,progress:.3,hold:false,last:performance.now()};
 modal(big?'Cá lớn cắn câu! Kéo cần':'Cá cắn câu! Kéo cần',`<p class="modal-note">Giữ <kbd>Space</kbd> (hoặc giữ nút bên dưới) để nâng vùng móc lên, thả ra thì móc chìm xuống. Giữ con cá trong vùng xanh cho tới khi thanh đầy.</p><div class="reel-game"><div class="reel-track" id="reelTrack"><span class="reel-zone" id="reelZone"></span><span class="reel-fish" id="reelFish" style="font-size:${(26+power*12).toFixed(0)}px">🐟</span></div><div class="reel-meter"><span id="reelFill"></span></div></div><p id="reelProgress" role="status">Giữ cá trong vùng xanh!</p><button class="primary full reel-hold" id="reelHold" type="button">Giữ để kéo</button>`,'reel');
 const hold=v=>e=>{if(!reel)return;e.preventDefault?.();reel.hold=v};for(const el of [$('reelHold'),$('reelTrack')]){el.addEventListener('pointerdown',hold(true));for(const t of ['pointerup','pointerleave','pointercancel'])el.addEventListener(t,hold(false))}
 window.farmAudio?.effect('fish');requestAnimationFrame(reelStep)}
function reelStep(now){if(!reel)return;if(modalView!=='reel'||!$('modal').open){reel=null;return}
 const r=reel,dt=Math.min(.1,(now-r.last)/1000),Z=.31;r.last=now;
 r.v+=(r.hold?2.6:-2.2)*dt;r.zone+=r.v*dt;if(r.zone<0){r.zone=0;r.v=Math.max(0,-r.v*.3)}if(r.zone>1-Z){r.zone=1-Z;r.v=Math.min(0,-r.v*.3)}
 if(now>r.turnAt){r.target=.05+Math.random()*.9;r.turnAt=now+(500+Math.random()*900)/(1+r.power*.42)}r.fish+=(r.target-r.fish)*Math.min(1,dt*(1.52+r.power));
 const inside=r.fish>=r.zone&&r.fish<=r.zone+Z;r.progress=Math.max(0,Math.min(1,r.progress+(inside?.37-r.power*.05:-.15-r.power*.085)*dt));
 $('reelZone').style.bottom=(r.zone*100).toFixed(1)+'%';$('reelZone').classList.toggle('on',inside);$('reelFish').style.bottom=(r.fish*100).toFixed(1)+'%';$('reelFill').style.height=(r.progress*100).toFixed(1)+'%';
 if(r.progress>=1){const i=r.index;reel=null;close();action({type:'fish',index:i,bait:selectedBait});return}
 if(r.progress<=0){const i=r.index;reel=null;close();window.farmAudio?.effect('water');action({type:'missFish',index:i});return}
 requestAnimationFrame(reelStep)}
document.addEventListener('keydown',e=>{if(!reel||e.code!=='Space')return;e.preventDefault();reel.hold=true},true);
document.addEventListener('keyup',e=>{if(!reel||e.code!=='Space')return;e.preventDefault();reel.hold=false},true);
function weeklyDialog(){const list=F.weeklyMissions(s);modal('Chuyện làng · Nhiệm vụ tuần',`<div class="modal-tabs"><button data-action="questTab" data-key="journey">Hành trình</button><button data-action="questTab" data-key="daily">Hằng ngày</button><button class="active" data-action="questTab" data-key="weekly">Chuyện làng · Tuần</button><button data-action="questTab" data-key="special">Đặc biệt · 100+</button></div><p class="modal-note">Tuần bắt đầu ${s.weekly.week}. Làm mới thứ Hai lúc 00:00 giờ Việt Nam. Mỗi câu chuyện nhận thưởng một lần trong tuần.</p>${list.map(m=>`<article class="story-card"><h3>${m.name}</h3><p>${m.story}</p>${m.tasks.map(t=>`<label>${t.name}: ${t.progress}/${t.target}<progress value="${t.progress}" max="${t.target}"></progress></label>`).join('')}<p>🎁 ${m.coins} xu · ${Math.floor(m.xp*(F.level(s)>=70?.9:1))} XP · 1 phân bón</p><button class="primary" data-action="claimWeekly" data-key="${m.id}" ${s.weekly.claimed.includes(m.id)||m.tasks.some(t=>t.progress<t.target)?'disabled':''}>${s.weekly.claimed.includes(m.id)?'Đã nhận · Cảm ơn bạn!':'Nhận lời cảm ơn'}</button></article>`).join('')}`,'quests');}
