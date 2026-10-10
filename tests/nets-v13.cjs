const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);for(const name of ['legacy-core.js','core.js','save-compat.js'])vm.runInContext(fs.readFileSync('public/'+name,'utf8'),ctx);
const F=ctx.Farm,copy=x=>JSON.parse(JSON.stringify(x)),v58=JSON.parse(fs.readFileSync('tests/fixtures/v58-progress.json','utf8'));
const rnd=v=>vm.runInContext('Math.random=()=>'+v,ctx);
const pondAt=(base,level,nets)=>{const s=copy(base);s.unlocked.pond=true;s.zone='pond';s.pond={level,nets};return s};
for(const [label,base] of [['new',F.initial()],['v58',v58]]){
  // Older saves with 5–8 nets: cast nets move into free spots among the first four; what does not fit is pulled in.
  const t=Date.now()+60000,nets=[{kind:'fish',readyAt:t},null,{kind:'crab',readyAt:t},null,{kind:'eel',readyAt:t},{kind:'clam',readyAt:t},null,{kind:'lotusfish',readyAt:t}];
  const old=pondAt(base,8,nets),bag=copy(old.bag),m=F.migrate(old);
  assert.equal(m.pond.level,8,label+': pond level kept');assert.equal(m.pond.nets.length,4,label+': four spots');
  assert.deepEqual(copy(m.pond.nets.map(n=>n&&n.kind)),['fish','eel','crab','clam'],label+': cast nets moved into the free spots');
  assert.equal(m.bag.lotusfish-(bag.lotusfish||0),F.netTypes.lotusfish.amount,label+': the net with no room is pulled in');
  F.validate(m);assert.deepEqual(copy(F.migrate(m)),copy(m),label+': idempotent');
  // Saves with four nets or fewer are untouched.
  const small=pondAt(base,3,[{kind:'fish',readyAt:t},null,null]);assert.deepEqual(copy(F.migrate(small).pond),small.pond,label+': small pond untouched');
}
// Upgrading past level 4 opens new net kinds but no fifth spot.
const s=pondAt(F.initial(),4,[null,null,null,null]);s.xp=F.threshold(90);s.rewardLevel=F.level(s);s.coins=1e6;
const r=F.perform(s,{type:'upgradePond'});assert.equal(s.pond.level,5);assert.equal(s.pond.nets.length,4);assert.match(r.message,/Mở lưới lươn\./);assert.doesNotMatch(r.message,/vị trí/);
assert.throws(()=>F.perform(s,{type:'castNet',kind:'eel',index:4}),/không hợp lệ/);F.validate(s);
const grow=pondAt(F.initial(),1,[null]);grow.xp=F.threshold(10);grow.rewardLevel=F.level(grow);grow.coins=1e4;assert.match(F.perform(grow,{type:'upgradePond'}).message,/thêm một vị trí/);assert.equal(grow.pond.nets.length,2);
// Hauls: the chosen kind 1.5× (rounded up) plus 1–3 random animals, only of kinds this pond holds.
assert.deepEqual(Object.fromEntries(Object.entries(F.netTypes).map(([k,d])=>[k,d.amount])),{fish:6,shrimp:5,crab:5,tilapia:6,eel:6,prawn:6,clam:8,lotusfish:8});
const haul=(level,kind,r)=>{rnd(r);const p=pondAt(F.initial(),level,Array(Math.min(4,level)).fill(null));p.coins=1e5;F.perform(p,{type:'castNet',kind,index:0});p.pond.nets[0].readyAt=Date.now()-1;const before=copy(p.bag);const res=F.perform(p,{type:'collectNet',index:0});return {got:Object.fromEntries(Object.keys(F.netTypes).map(k=>[k,p.bag[k]-(before[k]||0)]).filter(([,n])=>n)),res}};
assert.deepEqual(haul(1,'fish',0).got,{fish:7},'level 1: one bonus fish');
const most=haul(3,'crab',.999).got;assert.equal(Object.values(most).reduce((a,b)=>a+b),5+3,'three extras at most');assert.ok(Object.keys(most).every(k=>['fish','shrimp','crab'].includes(k)),'only kinds a level-3 pond holds');
for(let i=0;i<200;i++){vm.runInContext('Math.random=Math.__r||(Math.__r=Math.random)',ctx);const {got,res}=haul(8,'lotusfish',Math.random());const n=Object.values(got).reduce((a,b)=>a+b);assert.ok(n>=9&&n<=11,'8 + 1–3');assert.ok(got.lotusfish>=8);assert.match(res.message,/^Kéo lưới: \+/)}
console.log('PASS: nets v13 — at most four spots, older 5–8 net saves fitted without loss (both engines), upgrades past 4 open kinds only, hauls 1.5× plus 1–3 random animals of unlocked kinds');
