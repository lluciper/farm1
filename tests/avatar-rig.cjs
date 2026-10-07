// Avatar-style paper dolls (public/avatar-rig.js): every outfit / hair / shoe combination draws a posable character,
// every farm animal and pet has a skeleton, and the game uses these drawings when the rig is loaded.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
const rigCtx={};vm.createContext(rigCtx);vm.runInContext(read('avatar-rig.js'),rigCtx);
const R=rigCtx.AvatarRig;assert(R,'AvatarRig exported');

const farmCtx={};vm.createContext(farmCtx);vm.runInContext(read('core.js'),farmCtx);const F=farmCtx.Farm;
const count=(s,re)=>(s.match(re)||[]).length;
const parts=['lNo','lNs','lFo','lFs','lNf','lFf','aNo','aNs','aFo','aFs','aNh','aFh','tor','head','pel','root','shadow'];
let drawings=0;
for(const outfit of Object.keys(F.outfits)){assert(R.outfits[outfit],'outfit drawn: '+outfit);for(const gender of ['female','male'])for(const hair of Object.keys(F.hairStyles))for(const shoe of Object.keys(F.footwear))for(const view of ['front','back']){
  const svg=R.char(R.look({gender,outfit,hair,shoe,modular:F.outfits[outfit].modular!==undefined}),{view,label:'x'});
  for(const k of parts)assert(svg.includes(`data-k="${k}"`),`${outfit}/${gender}/${hair}/${shoe}/${view} has ${k}`);
  assert(!/NaN|undefined/.test(svg),`${outfit}/${gender}/${hair}/${shoe}/${view} has no broken numbers`);
  assert.strictEqual(count(svg,/<svg/g),1);drawings++;
}}
assert.strictEqual(drawings,Object.keys(F.outfits).length*2*8*7*2);
// Clip-path ids are unique per drawing, so many previews can share one page.
const a=R.char({gender:'female',outfit:'aodai'}),b=R.char({gender:'female',outfit:'aodai'}),id=s=>s.match(/clipPath id="([^"]+)"/)[1];
assert.notStrictEqual(id(a),id(b));
// Hair rule: modular outfits wear the chosen hair, classic outfits keep their designed hair; bare feet use the outfit's shoes.
assert.deepStrictEqual(JSON.parse(JSON.stringify(R.look({gender:'male',outfit:'hoodie',hair:'curly',shoe:'bare',modular:true}))),{gender:'male',outfit:'hoodie',hair:'curly',shoe:''});
assert.strictEqual(R.look({gender:'female',outfit:'base',hair:'curly',shoe:'boots',modular:false}).hair,'bob');
assert(R.char({gender:'female',outfit:'base',shoe:''}).includes('#8b5a33'),'base outfit keeps its sandals');
// Fixed poses for still pictures.
const fisher=R.fisher({gender:'male',outfit:'hoodie',hair:'side'},'Ngồi câu');
assert(fisher.includes('|fish"')&&fisher.includes('class="ar-char lake-fisher"')&&fisher.includes('data-ar-over'),'fisher holds a rod');
assert(R.img(R.char({gender:'male',outfit:'sport'},{label:false}),'Ghế').startsWith('<img src="data:image/svg+xml'),'still picture as img');
// Every animal the game shows has a skeleton.
for(const k of Object.keys(F.animals)){const key=R.speciesOf('pens/'+k+'-animal.png');assert(key,'farm animal rigged: '+k);const svg=R.animal(key,{label:k});assert(count(svg,/data-k="ls\d"/g)>=2&&svg.includes('data-k="head"')&&!/NaN|undefined/.test(svg),k)}
for(const [k,d] of Object.entries(F.pets)){const key=R.speciesOf('pets/'+d.art+'.png?v=40.0');assert(key,'pet rigged: '+k);assert(R.animal(key).includes('data-ar-animal="'+key+'"'))}
assert.strictEqual(count(R.animal('cow'),/data-k="ls\d"/g),4);assert.strictEqual(count(R.animal('chicken'),/data-k="ls\d"/g),2);

// Game screens use the painted artwork (posed by avatar-world.js); only the pig herd is drawn by the rig.
const nodes=new Map(),classes=()=>({add(){},remove(){},toggle(){return false},contains(){return false}});
const el=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',style:{setProperty(){}},classList:classes(),parentElement:{classList:classes()},setAttribute(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false},click(){}});return nodes.get(id)};
const ctx={console,localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},setInterval(){},setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:false})};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['core.js','cards.js','expansion.js','customization.js','housing.js','village.js','critter-joints.js','avatar-rig.js','game.js'])vm.runInContext(read(file),ctx);
assert(el('modalBody').innerHTML.includes('farmer.png'),'profile picker shows the painted characters');
vm.runInContext(`s.profile.name='Mây';s.profile.gender='male';close();
if(!outfitArt('silk').includes('fashion/'))throw Error('wardrobe preview uses the painted outfit');
s.animals.cow.owned=true;s.animals.cow.count=3;s.zone='barn';render();if(($('scene').innerHTML.match(/<svg class="herd-animal" data-critter="quad"/g)||[]).length!==3)throw Error('herd drawn from the painted picture');
if(!$('scene').innerHTML.includes('data-mood="hungry"')||!$('scene').innerHTML.includes('Đói quá!')||!$('scene').innerHTML.includes('paddock-button pen-hungry'))throw Error('hungry herd shows thin animals and asks for food');
if($('scene').innerHTML.includes('class="herd-tip')||($('scene').innerHTML.match(/class="paddock-front front-/g)||[]).length!==6)throw Error('bubbles are picked at random by avatar-world.js; front fences drawn over the herd');
for(const k in s.animals)s.animals[k].readyAt=Date.now()+60000;render();if(!$('scene').innerHTML.includes('data-mood="fed"')||!$('scene').innerHTML.includes('No căng')||$('scene').innerHTML.includes('Đói quá!'))throw Error('fed herd turns round and content');
for(const k of ['sheep','buffalo']){s.animals[k].owned=true;s.animals[k].count=2}for(const k in s.animals)s.animals[k].readyAt=Date.now()-1;render();if(!$('scene').innerHTML.includes('data-mood="ready"')||!$('scene').innerHTML.includes('Thu hoạch!'))throw Error('ready herd offers its product');
if(!$('scene').innerHTML.includes('Chuồng heo')||!$('scene').innerHTML.includes('data-ar-animal="pig"')||!$('scene').innerHTML.includes('goods/wool.svg')||!$('scene').innerHTML.includes('goods/pork.svg'))throw Error('pig pen gives pork; sheep give white wool');
s.unlocked.pets=true;s.zone='pets';render();if($('scene').innerHTML.split('<img src="pets/').length-1!==4)throw Error('pet shop shows the painted pets');
s.unlocked.pond=true;s.zone='pond';render();if(!$('scene').innerHTML.includes('fishing-male.png'))throw Error('seated fisher painting');`,ctx);
console.log(`PASS: ${drawings} character drawings (18 outfits × 2 × 8 hair × 7 shoes × front/back), unique clips, hair/shoe rule, fisher and still poses, ${Object.keys(F.animals).length+Object.keys(F.pets).length} rigged animals, painted art on game screens, herd mood (thin/round, bubble lines), pig pen and white wool.`);
