const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const c={};vm.createContext(c);for(const f of ['legacy-core.js','core.js','save-compat.js','cafe-engine.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);const F=c.Farm;
for(const base of [c.NewFarm.initial(),JSON.parse(fs.readFileSync('tests/fixtures/v58-progress.json','utf8'))]){
 let s=F.migrate(base);s.xp=F.threshold(90);s.special.completed=F.progressionStart(s)===50?89:99;s.rewardLevel=90;s.zone='cafe';s.unlocked.cafe=true;s.town.cafe.jobs=[];s.coins=5000000;for(const k in s.bag)s.bag[k]=500;
 F.refreshCafe(s);const preserved=s.coins;F.perform(s,{type:'cafeUpgradeEquipment',key:'bar'},1000);assert.equal(F.cafeCapacity(s),2);assert.equal(s.coins,preserved-150000);
 F.perform(s,{type:'cafeUpgradeEquipment',key:'juicer'},1000);F.perform(s,{type:'cafeUpgradeEquipment',key:'espresso'},1000);
 const seen=new Set();for(let i=0;i<4;i++){
 const o=F.cafeRequests(s)[0],recipe=F.cafeRecipe(o.key);seen.add(F.cafeDrinks[o.key].category);const before=s.coins,ingredients=JSON.parse(JSON.stringify(s.bag));F.perform(s,{type:'startService',key:o.key,orderId:o.id},1000);const j=s.town.cafe.jobs.at(-1);assert.equal(j.readyAt,0);assert.equal(j.brew.step,0);assert(j.brew.seconds<=51);assert.throws(()=>F.perform(s,{type:'startService',key:o.key,orderId:o.id},1000));
 assert.throws(()=>F.perform(s,{type:'cafeBrewStep',orderId:o.id,step:'finish',sugar:o.sugar,ice:o.ice},1000));assert.equal(j.brew.step,0);
 F.perform(s,{type:'cafeBrewStep',orderId:o.id,step:'ingredients'},2000);F.perform(s,{type:'cafeBrewStep',orderId:o.id,step:recipe[1].key},3000);
 const saved=JSON.parse(JSON.stringify(s));s=F.migrate(saved);const reloaded=s.town.cafe.jobs.find(j=>j.orderId===o.id);assert.equal(reloaded.brew.step,2);assert.deepEqual(JSON.parse(JSON.stringify(s.bag)),JSON.parse(JSON.stringify(saved.bag)));assert.throws(()=>F.perform(s,{type:'cafeBrewStep',orderId:o.id,step:'finish',sugar:(o.sugar+50)%150,ice:o.ice},4000));assert.equal(reloaded.brew.step,2);
 F.perform(s,{type:'cafeBrewStep',orderId:o.id,step:'finish',sugar:o.sugar,ice:o.ice},4000);assert.equal(reloaded.brew.step,3);assert.throws(()=>F.perform(s,{type:'cafeServe',orderId:o.id},4001));F.validate(s);
 F.perform(s,{type:'cafeServe',orderId:o.id},1000000);assert.equal(s.coins,before-40+F.drinkPrices[o.key]);assert.equal(s.cafe.shop.drinks,i+1);assert.throws(()=>F.perform(s,{type:'cafeServe',orderId:o.id},1000000));for(const [g,n]of Object.entries(F.services[o.key].needs))assert.equal(s.bag[g],ingredients[g]-n,'deduct once');
 }
 assert.equal(seen.size,4);
 // A pre-update job keeps its timer and sells without redoing a recipe.
 const old={key:'gardenCoffee',customer:'Hằng',readyAt:2000000};s.town.cafe.jobs.push(old);s=F.migrate(JSON.parse(JSON.stringify(s)));assert.equal(s.town.cafe.jobs[0].readyAt,2000000);assert.equal(s.town.cafe.jobs[0].brew,undefined);assert.throws(()=>F.perform(s,{type:'collectService',key:'cafe',index:0},1000000));F.perform(s,{type:'collectService',key:'cafe',index:0},2000000);F.validate(s);
 // Both engines accept extra active stations bought with a bar upgrade.
 for(let i=0;i<2;i++){const o=F.cafeRequests(s)[0];F.perform(s,{type:'startService',key:o.key,orderId:o.id},1000)}F.validate(s);s=F.migrate(JSON.parse(JSON.stringify(s)));assert.equal(s.town.cafe.jobs.length,2);const o=F.cafeRequests(s)[0];assert.throws(()=>F.perform(s,{type:'startService',key:o.key,orderId:o.id},1000));
 const bad=JSON.parse(JSON.stringify(s));bad.town.cafe.jobs[0].brew.step=99;assert.throws(()=>F.validate(bad));assert.throws(()=>F.migrate(bad));
}
console.log('PASS: both save formats: four drink recipes, correct steps/sugar/ice, reload mid-brew, no double charges/payouts, equipment speed/capacity, legacy timers and validation.');
