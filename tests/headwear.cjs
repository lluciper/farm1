const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);for(const name of ['legacy-core.js','core.js','save-compat.js'])vm.runInContext(fs.readFileSync('public/'+name,'utf8'),ctx);
const F=ctx.Farm,copy=x=>JSON.parse(JSON.stringify(x));
const v58=JSON.parse(fs.readFileSync('tests/fixtures/v58-progress.json','utf8'));
assert.ok(Object.keys(F.headwear).length>=13,'a dozen hats plus "none"');
assert.deepEqual(copy(F.headwear.nonla),{name:'Nón lá',level:1,cost:0});

// Saves from before the hat shop (v58 engine and the new engine) gain headwear on load; the outfit decides whether the
// free nón lá is worn, so characters look as they did. Nothing else in the save changes.
for(const [label,base,outfit,worn] of [['v58 + hat outfit',v58,'aodai','nonla'],['v58 + hoodie',v58,'hoodie','none'],['new + base',F.initial(),'base','nonla'],['new + stripes',F.initial(),'stripes','none']]){
  const old=copy(base);delete old.headwear;old.wardrobe.equipped=outfit;if(!old.wardrobe.owned.includes(outfit))old.wardrobe.owned.push(outfit);
  const m=F.migrate(old);
  assert.deepEqual(copy(m.headwear),{owned:['none','nonla'],equipped:worn},label);
  for(const key of ['coins','xp','wardrobe','footwear','house','plots'])assert.deepEqual(copy(m[key]),old[key],label+': '+key+' unchanged');
  F.validate(m);assert.deepEqual(copy(F.migrate(m)),copy(m),label+': migration is idempotent');
}

// New players start with the nón lá on.
assert.deepEqual(copy(F.initial().headwear),{owned:['none','nonla'],equipped:'nonla'});

// Buying and wearing: the shopping street must be unlocked (same rule as shoes), the hat's level reached and the coins
// there; only owned hats can be worn.
const locked=F.initial();locked.coins=1e6;locked.xp=F.threshold(80);
assert.throws(()=>F.perform(locked,{type:'buyHat',key:'cap'}),/mở khóa/,'shopping street locked');
const s=F.migrate(copy(v58));assert.ok(s.unlocked.shopping);
assert.throws(()=>F.perform(s,{type:'buyHat',key:'crown'}),/Nón không hợp lệ/);
assert.throws(()=>F.perform(s,{type:'buyHat',key:'__proto__'}),/Nón không hợp lệ/);
const before=s.coins;F.perform(s,{type:'buyHat',key:'fedora'});
assert.equal(s.coins,before-F.headwear.fedora.cost);assert.ok(s.headwear.owned.includes('fedora'));
assert.throws(()=>F.perform(s,{type:'buyHat',key:'fedora'}),/đã có/);
F.perform(s,{type:'equipHat',key:'fedora'});assert.equal(s.headwear.equipped,'fedora');
F.perform(s,{type:'equipHat',key:'none'});assert.equal(s.headwear.equipped,'none');
assert.throws(()=>F.perform(s,{type:'equipHat',key:'cowboy'}),/chưa có/);
F.validate(s);

const poor=F.initial();poor.unlocked.shopping=true;poor.coins=10;poor.xp=F.threshold(80);
assert.throws(()=>F.perform(poor,{type:'buyHat',key:'flower'}),/xu/i,'not enough coins');
const low=F.initial();low.unlocked.shopping=true;low.coins=1e6;
assert.throws(()=>F.perform(low,{type:'buyHat',key:'flower'}),/cấp/i,'level too low');

// Tampered saves are rejected.
for(const bad of [{owned:['nonla'],equipped:'nonla'},{owned:['none','crown'],equipped:'none'},{owned:['none'],equipped:'cap'},{owned:['none','none'],equipped:'none'}]){
  const t=copy(s);t.headwear=bad;assert.throws(()=>F.validate(t),/Nón không hợp lệ/,JSON.stringify(bad));
}
console.log('PASS: headwear — old saves get a worn nón lá when their outfit had one, buy/equip/remove, unlock/level/coin gates, tampered saves rejected');
