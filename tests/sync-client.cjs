const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto').webcrypto;
// Mock server: one shared save, one account. `claimed` mirrors whether the old link secret LEGACY has been linked to it.
const HOME='https://wrp3hng.haniel.vn',LEGACY='c'.repeat(64),ACCOUNT={username:'tu',id:'acct-1'};
let cloud=null,failAfterWrite=false,onWrite,networkDown=false,claimed=false;const guests={};
function boot(storage={},hash='',origin=HOME,{session=true}={}){const nodes=new Map(),clicks=[],submits=[],classes=()=>({add(){},remove(){},toggle(){return false}});
function el(id){if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',value:'',style:{},classList:classes(),parentElement:{classList:classes()},setAttribute(k,v){this.attributes||={};this.attributes[k]=v},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},remove(){nodes.delete(this.id)}});return nodes.get(id)}
const json=(status,body)=>({ok:status<300,status,json:async()=>structuredClone(body)});
async function account(options){const body=options.body?JSON.parse(options.body):null;if(!body)return json(200,{account:ctx.session?ACCOUNT:null});
if(body.action==='legacy')return json(200,{claimed,exists:body.token===LEGACY&&!!cloud,name:'Tú',level:50});
if(body.action==='register'){const claim=body.legacy===LEGACY&&!claimed&&!!cloud;if(claim)claimed=true;ctx.session=true;return json(200,{account:ACCOUNT,claimed:claim})}
if(body.action==='login'){ctx.session=true;return json(200,{account:ACCOUNT})}
if(body.action==='logout'){ctx.session=false;return json(200,{ok:true})}return json(400,{error:'bad'})}
const ctx={console,crypto,URLSearchParams,session,localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},document:{getElementById:id=>id==='syncGate'?nodes.get(id)||null:el(id),querySelectorAll:()=>[],addEventListener:(t,fn)=>{if(t==='click')clicks.push(fn);if(t==='submit')submits.push(fn)},createElement:()=>({remove(){nodes.delete(this.id)}}),body:{appendChild:n=>nodes.set(n.id,n)}},setTimeout:()=>1,clearTimeout(){},setInterval(){},matchMedia:()=>({matches:false}),location:{origin,pathname:'/',search:'',hash,replace(url){ctx.redirect=url},reload(){ctx.reloaded=true}},history:{replaceState(_,__,url){ctx.location.hash=url.includes('#')?url.slice(url.indexOf('#')):''}},addEventListener(){},fetch:async(url,options)=>{if(networkDown)throw Error('offline');if(url==='/api/account')return account(options);
const bearer=options.headers?.Authorization?.slice(7);ctx.lastAuth=bearer||'session';if(!ctx.session&&!(bearer&&!(bearer===LEGACY&&claimed)))return json(401,{error:'Hãy đăng nhập để tiếp tục.'});
if(!ctx.session&&bearer!==LEGACY){const g=guests[bearer];if(options.method==='GET')return json(200,g||{revision:0,data:null});const job=JSON.parse(options.body);if(g?.mutation===job.mutation)return json(200,{revision:g.revision,updated:g.updated});if(job.revision!==(g?.revision||0))return json(409,{error:'conflict'});guests[bearer]={revision:job.revision+1,data:job.data,mutation:job.mutation,updated:Date.now()};return json(200,{revision:guests[bearer].revision,updated:guests[bearer].updated})}
if(options.method==='GET'){ctx.reads=(ctx.reads||0)+1;return json(200,cloud||{revision:0,data:null})}
const job=JSON.parse(options.body);if(cloud?.mutation===job.mutation)return json(200,{revision:cloud.revision,updated:cloud.updated});if(job.revision!==(cloud?.revision||0))return json(409,{error:'conflict'});cloud={revision:job.revision+1,data:job.data,mutation:job.mutation,updated:Date.now()};if(onWrite){const fn=onWrite;onWrite=null;fn()}if(failAfterWrite){failAfterWrite=false;throw Error('lost response')}return json(200,{revision:cloud.revision,updated:cloud.updated})}};
ctx.window=ctx;vm.createContext(ctx);for(const file of ['legacy-core.js','core.js','save-compat.js','cafe-engine.js','cards.js','expansion.js','customization.js','housing.js','village.js','game.js','cafe-ui.js','sync.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),ctx);
const gate=()=>nodes.get('syncGate')?.innerHTML||'';
return {ctx,storage,gate,run:code=>vm.runInContext(code,ctx),
click:async name=>{for(const fn of clicks)await fn({target:{closest:selector=>selector.includes('data-sync')?{dataset:{sync:name}}:null}})},
auth:async name=>{for(const fn of clicks)await fn({target:{closest:selector=>selector==='[data-auth]'?{dataset:{auth:name}}:null}})},
submitAuth:async(username,password)=>{el('authUser').value=username;el('authPass').value=password;el('authPass2').value=password;for(const fn of submits)await fn({target:{id:'authForm',querySelector:()=>({})},preventDefault(){}});await settle()}}}
const settle=async()=>{for(let i=0;i<20;i++)await new Promise(r=>setImmediate(r))};

(async()=>{
// First visit: sign-up/sign-in popup that also offers guest play; guests get a private device secret, not a link.
const guestVisit=boot({},'',HOME,{session:false});await settle();assert(guestVisit.ctx.farmSync.blocked);assert(guestVisit.gate().includes('Tạo tài khoản Làng Mây'));assert(guestVisit.gate().includes('Chơi ở chế độ khách'));
await guestVisit.auth('guest');await settle();assert(!guestVisit.ctx.farmSync.blocked);assert(guestVisit.ctx.farmSync.guest);const secret=guestVisit.storage['lang-may-sync-v1'];assert.match(secret,/^[a-f0-9]{64}$/);assert.equal(guestVisit.ctx.location.hash,'');
guestVisit.run("action({type:'profile',name:'Khách',gender:'female'});save()");await guestVisit.ctx.farmSync.flush();assert.equal(guests[secret].data.farm.profile.name,'Khách');assert.equal(cloud,null);
const visitor=boot({},'',HOME,{session:false});await settle();assert(visitor.gate().includes('Tạo tài khoản Làng Mây'));await visitor.submitAuth('tu','secret1');assert(!visitor.ctx.farmSync.blocked);assert.equal(visitor.ctx.farmSync.account,'tu');assert.equal(visitor.ctx.lastAuth,'session');
cloud=null;
const one=boot();await settle();assert(!one.ctx.farmSync.blocked);
one.run("action({type:'profile',name:'Tú',gender:'male'});s.coins=50000;s.xp=F.threshold(50);s.rewardLevel=50;s.unlocked.leisure=true;cardStake=5000;startCards('phom',true);cardSelected=[cardGame.hands[0][0]];saveCards();save();");
await one.ctx.farmSync.flush();await one.ctx.farmSync.flush();assert.equal(cloud.data.farm.coins,45000);assert.equal(cloud.data.cards.game.kind,'phom');
// A second device signs in to the same account with empty storage.
const second=boot();await settle();assert(!second.ctx.farmSync.blocked);assert.equal(second.run('s.profile.name'),'Tú');assert.equal(second.run('s.coins'),45000);assert.equal(second.run('cardGame.kind'),'phom');assert.equal(second.run('cardSelected.length'),1);assert.equal(second.run('cardGame.hands[0].join()'),one.run('cardGame.hands[0].join()'));
second.run('s.coins+=100;save()');await second.ctx.farmSync.flush();one.run('s.coins+=200;save()');await one.ctx.farmSync.flush();assert(one.ctx.farmSync.blocked);assert.equal(cloud.data.farm.coins,45100);await one.click('cloud');assert(!one.ctx.farmSync.blocked);assert.equal(one.run('s.coins'),45100);
failAfterWrite=true;onWrite=()=>second.run('s.coins+=50;save()');second.run('s.coins+=100;save()');await second.ctx.farmSync.flush();assert(JSON.parse(second.storage['lang-may-sync-cache-v1']).dirty);
const reboot=boot({...second.storage});await settle();await reboot.ctx.farmSync.flush();await settle();assert(!reboot.ctx.farmSync.blocked);assert.equal(cloud.data.farm.coins,45250);assert.equal(reboot.run('s.coins'),45250);assert.equal(cloud.data.cards.game.kind,'phom');assert.equal(cloud.data.cards.game.stake,5000);
const reads=reboot.ctx.reads;await Promise.all([reboot.ctx.farmSync.reload(),reboot.ctx.farmSync.reload()]);assert.equal(reboot.ctx.reads-reads,1);
console.log('PASS: first-visit popup with guest play and private guest saves, cross-device unfinished Phom and selected cards, conflict gate/recovery, lost-response retry with newer offline changes preserved, single concurrent reload.');

// Offline restart of a remembered account stays playable from the cache.
networkDown=true;const offline=boot({...reboot.storage});await settle();assert(!offline.ctx.farmSync.blocked);assert.equal(offline.run('s.profile.name'),'Tú');assert(offline.run("$('saveState').textContent").includes('Mất kết nối'));offline.run('s.coins+=25;save()');assert.equal(offline.run("$('saveState').textContent"),'Đang lưu…');await offline.ctx.farmSync.flush();assert(offline.run("$('saveState').textContent").includes('Mất kết nối'));assert(JSON.parse(offline.storage['lang-may-sync-cache-v1']).pending);
networkDown=false;await offline.ctx.farmSync.flush();assert.equal(cloud.data.farm.coins,45275);assert(!offline.ctx.farmSync.pending);assert(offline.run("$('saveState').textContent").includes('Đã lưu trực tuyến'));assert.equal(offline.ctx.location.hash,'');
offline.ctx.localStorage.setItem=()=>{throw Error('quota')};offline.run('s.coins+=5;save()');assert(offline.ctx.farmSync.pending);await offline.ctx.farmSync.flush();assert.equal(cloud.data.farm.coins,45280);
console.log('PASS: offline cached restart remains playable, pending state survives, accurate visible status, reconnect uploads, no secret in the address bar.');

const friendPlayer=boot();await settle();friendPlayer.run(`s.plots[0]={crop:'carrot',start:Date.now(),water:false,pest:false};s.bag.carrot=5;save()`);await friendPlayer.ctx.farmSync.flush();const priorCoins=friendPlayer.run('s.coins');friendPlayer.run(`s.coins+=10;action({type:'plot',index:0,tool:'water'});action({type:'plot',index:1,tool:'seed',crop:'corn'})`);cloud.data.farm.bag.carrot++;cloud.data.farm.plots[0].water=true;cloud.data.farm.plots[0].start=Date.now();cloud.data.farm.stats.watered++;cloud.data.farm.daily.stats.watered++;cloud.revision++;cloud.mutation='friend:'+crypto.randomUUID();cloud.updated=Date.now();await friendPlayer.ctx.farmSync.flush();assert(!friendPlayer.ctx.farmSync.blocked);await friendPlayer.ctx.farmSync.flush();assert.equal(cloud.data.farm.bag.carrot,6);assert.equal(cloud.data.farm.coins,priorCoins+10);assert.equal(cloud.data.farm.plots[1].crop,'corn');assert.equal(cloud.data.farm.stats.watered,1);assert.equal(cloud.data.cards.game.kind,'phom');
friendPlayer.run(`action({type:'plot',index:2,tool:'seed',crop:'tomato'})`);cloud.data.farm.bag.carrot++;cloud.revision++;cloud.mutation='friend:'+crypto.randomUUID();const friendReboot=boot({...friendPlayer.storage});await settle();await friendReboot.ctx.farmSync.flush();assert(!friendReboot.ctx.farmSync.blocked);assert.equal(cloud.data.farm.bag.carrot,7);assert.equal(cloud.data.farm.plots[2].crop,'tomato');
// A later friend mutation never disguises unrelated edits from another device.
friendReboot.run('s.coins+=10;save()');cloud.data.farm.coins+=999;cloud.data.farm.bag.carrot++;cloud.revision++;cloud.mutation='friend:'+crypto.randomUUID();await friendReboot.ctx.farmSync.flush();assert(friendReboot.ctx.farmSync.blocked);
console.log('PASS: friend gift/watering merges with unfinished local actions and cards, duplicate watering is counted once, offline restart preserves both, unrelated device edits remain protected.');

// Old link players: the claim prompt shows on every load, "later" keeps the link-based save, claiming keeps progress.
cloud={revision:1,data:structuredClone(cloud.data),mutation:'legacy',updated:Date.now()};const coins=cloud.data.farm.coins;
const old=boot({'lang-may-sync-v1':LEGACY},'',HOME,{session:false});await settle();assert(old.ctx.farmSync.blocked);assert(old.gate().includes('Giữ trang trại của bạn'));assert(old.gate().includes('data-auth="guest"'));
await old.auth('guest');await settle();assert(!old.ctx.farmSync.blocked);assert(old.ctx.farmSync.guest);assert.equal(old.run('s.profile.name'),'Tú');assert.equal(old.run('s.coins'),coins);
old.run('s.coins+=7;save()');await old.ctx.farmSync.flush();assert.equal(cloud.data.farm.coins,coins+7);assert.equal(old.ctx.lastAuth,LEGACY);
const again=boot({...old.storage},'',HOME,{session:false});await settle();assert(again.ctx.farmSync.blocked);assert(again.gate().includes('Giữ trang trại của bạn'));
again.run('s.coins+=3;save()');await again.auth('guest');await settle();assert.equal(again.run('s.coins'),coins+7);
await again.submitAuth('tu','secret1');assert(claimed);assert(!again.ctx.farmSync.blocked);assert(!again.ctx.farmSync.guest);assert.equal(again.ctx.farmSync.account,'tu');assert.equal(again.run('s.coins'),coins+7);assert.equal(again.storage['lang-may-sync-v1'],undefined);
again.run('s.coins+=1;save()');await again.ctx.farmSync.flush();assert.equal(cloud.data.farm.coins,coins+8);assert.equal(again.ctx.lastAuth,'session');
console.log('PASS: old farm prompt on every load, guest play saves through the old secret, account claim keeps progress and drops the secret.');

// After the claim the old link only shows sign-in; it no longer opens the farm.
const a='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';let link='',bits=0,v=0;for(let i=0;i<64;i+=2){v=(v<<8)|parseInt(LEGACY.slice(i,i+2),16);bits+=8;while(bits>=6){bits-=6;link+=a[(v>>bits)&63]}v&=(1<<bits)-1}if(bits)link+=a[(v<<(6-bits))&63];
const stranger=boot({},'#p='+link,HOME,{session:false});await settle();assert(stranger.ctx.farmSync.blocked);assert(stranger.gate().includes('Đăng nhập Làng Mây'));assert(stranger.gate().includes('đã được liên kết'));assert.equal(stranger.ctx.location.hash,'');
const before=structuredClone(cloud.data);await stranger.auth('guest');await settle();assert(stranger.ctx.farmSync.guest);assert.notEqual(stranger.storage['lang-may-sync-v1'],LEGACY);assert.notEqual(stranger.run('s.profile.name'),'Tú');assert.deepEqual(cloud.data.farm.profile,before.farm.profile);
const legacyGet=await stranger.ctx.fetch('/api/game-save',{method:'GET',headers:{Authorization:'Bearer '+LEGACY}});assert.equal(legacyGet.status,401);
// Old domains forward the secret to the new domain so the farm can be claimed there.
const moved=boot({'lang-may-sync-v1':'d'.repeat(64)},'','https://gamecuawr3hng.tu-vinhomes-97.chatgpt.site',{session:false});await settle();assert(moved.ctx.redirect.startsWith(HOME+'/#p='));assert.equal(moved.ctx.redirect.split('#p=')[1].length,43);
const previous=boot({'lang-may-sync-v1':'d'.repeat(64)},'','https://hang.haniel.vn',{session:false});await settle();assert(previous.ctx.redirect.startsWith(HOME+'/#p='));
// Logging out clears this browser's farm copy and returns to sign-in with the name remembered.
await again.click('logout');assert(again.ctx.reloaded);assert.equal(again.storage['lang-may-sync-cache-v1'],undefined);assert.equal(again.storage['lang-may-v1'],undefined);const after=boot({...again.storage},'',HOME,{session:false});await settle();assert(after.gate().includes('Đăng nhập Làng Mây'));
console.log('PASS: claimed links never reopen the farm (a stranger only gets a fresh guest farm), old-origin transfer, logout clears local farm copy.');
})().catch(e=>{console.error(e);process.exitCode=1});
