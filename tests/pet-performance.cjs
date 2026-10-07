const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const petContext={};vm.createContext(petContext);vm.runInContext(fs.readFileSync('public/pet-roaming.js','utf8'),petContext);const {create}=petContext.PetRoaming;
let seed=17;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
const roam=create(random),b={x0:0,y0:0,x1:500,y1:400};
const hit=(x,y)=>x<0||y<0||x>500||y>400||(x>180&&x<300&&y>100&&y<320);
const pets=Array.from({length:4},()=>({x:NaN,y:NaN}));let walking=0,resting=0;
for(let i=0;i<12000;i++)for(const p of pets){const prev={x:p.x,y:p.y};roam.step(p,.05,b,hit,22);assert(!hit(p.x,p.y));if(Number.isFinite(prev.x))assert(Math.hypot(p.x-prev.x,p.y-prev.y)<=1.101);if(p.vx||p.vy)walking++;else resting++}
assert(walking>1000&&resting>1000);assert(new Set(pets.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1))).size===4);
// Renderer never computes idle previews at display refresh rate, and pauses hidden tabs.
const code=fs.readFileSync('public/world3d.js','utf8');const loop=code.slice(code.indexOf('let measureAt = 0, budget'),code.indexOf('\nconst World3D'));
let updates=0,renders=0,timers=0;const doc={hidden:false,addEventListener(){}};const view={canvas:{isConnected:true},visible:true,dirty:true,measure(){},render(){renders++;this.dirty=false}};
const ctx={PHONE:true,WEAK:false,document:doc,window:{addEventListener(){}},performance:{now:()=>0},views:new Set([view]),previews:new Map([[{}, {view,model:{update(){updates++;view.dirty=true}}}]]),setTimeout(){timers++;return 1},clearTimeout(){},requestAnimationFrame(){}};
vm.createContext(ctx);vm.runInContext(loop,ctx);for(let n=16;n<=480;n+=16)vm.runInContext(`frame(${n})`,ctx);
assert(updates<=4);assert(renders<=4);doc.hidden=true;const before=[updates,renders,timers];vm.runInContext('frame(1000)',ctx);assert.deepEqual([updates,renders,timers],before);
console.log('PASS: independent pet walks stay inside bounds, avoid obstacles and take rest breaks; mobile idle preview updates are throttled; hidden rendering stops.');
