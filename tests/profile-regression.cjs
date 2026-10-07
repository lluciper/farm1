const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const read = file => fs.readFileSync(path.join(__dirname, '../public', file), 'utf8');
const html = read('index.html');
assert(!/<[^>]*data-action="profile"/.test(html), 'Play surface must not open the character editor');
assert(read('style.css').match(/\.avatar\{[^}]*pointer-events:none/g).length >= 2, 'Avatar must pass clicks through to crops');
let saved;
function boot() {
  const nodes = new Map(); let tick;
  const classes = { add(){}, remove(){}, toggle(){return false} };
  const el = id => { if (!nodes.has(id)) nodes.set(id, {innerHTML:'', textContent:'', value:'', style:{}, classList:classes, parentElement:{classList:classes}, setAttribute(){}, addEventListener(){}, showModal(){this.open=true}, close(){this.open=false}}); return nodes.get(id); };
  const ctx = {console, localStorage:{getItem:()=>saved||null,setItem:(key,value)=>saved=value}, document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},setInterval(fn){tick=fn},setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:false})};
  ctx.window=ctx; vm.createContext(ctx);
  for (const file of ['core.js','cards.js','expansion.js','customization.js','housing.js','village.js','game.js']) vm.runInContext(read(file),ctx);
  return {ctx,el,tick,run:code=>vm.runInContext(code,ctx)};
}
const first=boot();
first.run(`$('characterName').value='Mây';profileGender='male';$('profileForm').onsubmit({preventDefault(){}});close();`);
for(let i=0;i<3;i++) {
  assert(first.run(`action({type:'plot',index:${i},tool:'seed',crop:'carrot'})`));
  assert(first.run(`action({type:'plot',index:${i},tool:'water'})`));
  first.tick(); assert(!first.el('modal').open);
}
first.run(`s.plots.forEach(p=>{if(p)p.start=Date.now()-120000});save()`);
first.tick(); assert(!first.el('modal').open);
assert(first.run(`action({type:'plot',index:0,tool:'harvest'})`));
const snapshot = JSON.parse(saved);
const reloaded=boot();
assert(!reloaded.el('modal').open, 'Reload must preserve a completed character');
assert.deepStrictEqual(JSON.parse(saved),snapshot,'Reload must preserve character and farm');
reloaded.run(`showModal('settings')`);
assert(reloaded.el('modalBody').innerHTML.includes('data-action="profile"'));
reloaded.run(`showModal('profile')`);
assert(reloaded.el('modalBody').innerHTML.includes('value="Mây"'));
console.log('PASS: no profile hotspots on play surface; planting, watering, timer, harvest and reload retain character; settings still allows editing.');
