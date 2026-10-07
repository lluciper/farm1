const assert=require('node:assert/strict');
require('../public/core.js');
const F=globalThis.Farm;
const locked=F.initial();locked.xp=F.threshold(99);
assert.throws(()=>F.perform(locked,{type:'travel',zone:'pets'}),/cấp 100/i);
const old=F.initial();old.xp=F.threshold(100);old.rewardLevel=100;delete old.pets;delete old.unlocked.pets;
let s=F.migrate(old);
assert.equal(s.unlocked.pets,true,'level 100 unlocks the pet area on old saves');
assert.deepEqual(Object.keys(s.pets).sort(),['cat','dog','lion','pigeon']);
assert(Object.values(s.pets).every(v=>v===false),'old saves start with no owned pets');
assert.equal(F.perform(s,{type:'travel',zone:'pets'}).message,'Đã đến Khu thú cưng');
s.coins=3800000;
const costs={cat:500000,dog:500000,lion:2000000,pigeon:800000};
for(const [key,cost] of Object.entries(costs)){
 const before=s.coins;
 F.perform(s,{type:'buyPet',key});
 assert.equal(s.coins,before-cost,`exact ${key} price`);
 assert.equal(s.pets[key],true);
 assert.throws(()=>F.perform(s,{type:'buyPet',key}),/đã có/i,'duplicate purchase rejected');
}
assert.equal(s.coins,0);
const reload=F.migrate(JSON.parse(JSON.stringify(s)));
assert.deepEqual(reload.pets,s.pets,'purchases survive save reload');
assert.throws(()=>F.perform(reload,{type:'buyPet',key:'unknown'}),/không hợp lệ/i);
console.log('PASS: level 100 unlock, old-save migration, exact prices, one-time purchase, persisted pets.');
