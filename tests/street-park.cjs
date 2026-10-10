const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
// the park map part of street.js: the paving, the things on the square and the way-finding
const source=fs.readFileSync('public/street.js','utf8'),code=source.slice(source.indexOf('// The park picture'),source.indexOf('// use a thing on the square'));
const ctx={Math,Array,Int32Array,Infinity,position:{x:50,y:70}};vm.createContext(ctx);vm.runInContext(code+';this.P={walkable,route,SPOTS,seatAt,snap,beside,clear}',ctx);
const {walkable,route,SPOTS,seatAt,snap,beside,clear}=ctx.P;
// the plaza is walkable; benches, flower beds, lawns, the fountain and the swing seats are not
for(const [x,y] of [[50,60],[50,90],[30,45],[70,45],[5,62],[50,30],[83,26]])assert.ok(walkable(x,y),`paving at ${x},${y}`);
for(const [x,y,what] of [[50,12,'fountain'],[15,28,'bench'],[91,38,'bench'],[11,80,'bench'],[90,78,'bench'],[6,50,'flower bed'],[37,27,'lawn'],[62,29,'lawn'],[90,90,'flower bed'],[10,95,'flower bed'],[82,15,'swing']])assert.ok(!walkable(x,y),`${what} at ${x},${y} is blocked`);
// every thing on the square is reached from its paving spot; seats are off the paving (on the bench) and found by position
for(const sp of SPOTS){assert.ok(walkable(...sp.at),sp.name+' is reached from the paving');
  for(const [x,y] of sp.seats||[]){assert.ok(!walkable(x,y),sp.name+' seat sits on the bench, not the path');assert.equal(seatAt(x,y),sp);assert.equal(seatAt(x+.4,y-.4),sp,'rounding by the server keeps the seat');assert.ok(Number.isInteger(x)&&Number.isInteger(y)&&y>=15,'the server keeps seat positions as they are')}}
assert.equal(seatAt(50,60),undefined);
// from anywhere to anywhere: a way exists, every leg stays on the paving and it ends where asked
const pts=[[50,90],[5,62],[17,39],[50,30],[83,26],[86,47],[75,80],[26,84],[30,60],[70,60]];
for(const a of pts)for(const b of pts){const r=route(a,b);assert.ok(r.length>=1);assert.deepEqual([...r.at(-1)],b,'ends at the target');for(let i=0;i<r.length-1;i++)assert.ok(clear(r[i],r[i+1]),`leg ${i} of ${a}→${b} stays on the paving`)}
// a way around the left lawn, not across it: from the fountain front to the top-left bench takes a turn
assert.ok(route([50,30],[17,39]).length>2,'walks around the lawn');
// taps off the paving are moved to the nearest paving; from a seat the way starts by stepping off the bench
assert.ok(walkable(...snap(50,10)));assert.ok(walkable(...snap(15,28)));
const off=route([13,35],[50,60]);assert.ok(walkable(...off[0]));
// next to another player: on the paving, on your side
ctx.position={x:30,y:70};const by=beside({x:50,y:70});assert.deepEqual([...by],[44,70]);ctx.position={x:70,y:70};assert.deepEqual([...beside({x:50,y:70})],[56,70]);
// beside someone else (Cô Hoa coming up to you): the side nearer to her
assert.deepEqual([...beside({x:50,y:70},{x:80,y:70})],[56,70]);
assert.ok(walkable(...beside({x:76,y:80})),'next to someone at the edge stays on the paving');
console.log('PASS: street park — paving vs benches/beds/lawns/fountain, every spot reachable, routes stay on the paving, seats found after rounding, standing beside others');
