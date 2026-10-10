const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);for(const name of ['legacy-core.js','core.js','save-compat.js'])vm.runInContext(fs.readFileSync('public/'+name,'utf8'),ctx);
const F=ctx.Farm,v58=JSON.parse(fs.readFileSync('tests/fixtures/v58-progress.json','utf8'));
// Both engines (a new farm and a v58 save): a fish that gets away takes the bait — the spot is free again, no fish, no XP.
for(const [label,s] of [['new',(()=>{const s=F.initial();s.unlocked.pond=true;s.coins=1000;return s})()],['v58',(()=>{const s=F.migrate(v58);s.unlocked.pond=true;return s})()]]){
  s.zone='pond';s.fishing[0]=0;if(s.fishingBaits)delete s.fishingBaits[0];
  assert.throws(()=>F.perform(s,{type:'missFish',index:0}),/Chưa có cá/,label+': nothing on the line');
  F.perform(s,{type:'fish',index:0,bait:'basic'});const coins=s.coins;
  assert.throws(()=>F.perform(s,{type:'missFish',index:0}),/Chưa có cá/,label+': not biting yet');
  s.fishing[0]=Date.now()-1;const fish=s.bag.fish,xp=s.xp;
  F.perform(s,{type:'missFish',index:0});
  assert.equal(s.fishing[0],0,label+': spot freed');assert.equal(s.bag.fish,fish,label+': no fish');assert.equal(s.xp,xp,label+': no XP');assert.equal(s.coins,coins,label+': bait not refunded');
  assert.ok(!s.fishingBaits||!Object.hasOwn(s.fishingBaits,0),label+': bait record cleared');
  assert.throws(()=>F.perform(s,{type:'missFish',index:99}),/không hợp lệ/);assert.throws(()=>F.perform(s,{type:'missFish',index:'0'}),/không hợp lệ/);
  F.validate(s);
}
console.log('PASS: fishing miss — an escaped fish frees the spot with no catch, no XP and no refund; only while biting; both engines');
