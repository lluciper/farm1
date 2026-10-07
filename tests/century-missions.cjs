const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const c={};vm.createContext(c);for(const f of ['legacy-core','core','save-compat'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),c);
for(const F of [c.LegacyFarm,c.NewFarm]){
 let s=F.initial();s.xp=F.threshold(100);s.special.completed=99;s.rewardLevel=100;s.coins=1000000;F.ensureSpecial(s);
 const initial=F.specialMission(s);assert.equal(initial.tasks.length,10);assert.equal(initial.ready,false);
 s.xp=F.threshold(102);assert.equal(F.level(s),100);assert.throws(()=>F.perform(s,{type:'claimSpecial'}));
 for(const t of initial.tasks)if(t.key in s.stats)s.stats[t.key]+=t.target;
 assert.equal(F.specialMission(s).ready,false,'eight activity goals cannot bypass decoration');
 F.perform(s,{type:'buyFarmDecor',key:'fence'});assert.equal(F.specialMission(s).ready,false,'stored decor is not placed');F.perform(s,{type:'moveFarmDecor',id:1,x:7,y:30});
 s.house.owned=['modern_bed'];s.house.placed[0]='modern_bed';assert.equal(F.specialMission(s).ready,true);F.validate(s);
 const before=s.coins;F.perform(s,{type:'claimSpecial'});assert.equal(F.level(s),101);assert(s.coins>before);assert.equal(F.specialMission(s).tasks.length,10);assert.equal(F.specialMission(s).ready,false,'new activity goals restart');
 let reloaded=F.migrate(JSON.parse(JSON.stringify(s)));assert.equal(F.level(reloaded),101);assert.equal(F.specialMission(reloaded).tasks.find(t=>t.key==='farmDecor').progress,1);
 s.xp=F.threshold(150);s.special.completed=149;s.rewardLevel=150;F.ensureSpecial(s);const harder=F.specialMission(s);assert(harder.tasks[0].target>initial.tasks[0].target);assert(harder.coins>initial.coins);
}
const legacy=c.LegacyFarm.initial();legacy.xp=c.LegacyFarm.threshold(99);legacy.special.completed=98;c.LegacyFarm.ensureSpecial(legacy);assert(c.LegacyFarm.specialMission(legacy).tasks.length<10);
console.log('PASS: both save formats require exactly ten goals and XP from level100, one-level claim, persistent decorations, increasing difficulty, no change below100.');
