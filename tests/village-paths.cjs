const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const ctx={document:{addEventListener(){}},console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/village.js'),'utf8')+';this.doors=villageDoors;this.walk=villageWalkable;this.rows=VILLAGE_PATHS',ctx);
const {doors,walk,rows}=ctx;
assert.strictEqual(rows.length,56);rows.forEach(r=>assert.match(r,/^[0-9a-f]{25}$/));
// arriving from the farm/street the player stands at (50,92); every door's arrival point must be on a path
assert.ok(walk(50,92),'village spawn is on a path');
for(const d of doors)assert.ok(walk(d.arrival.x,d.arrival.y),d.key+' arrival is on a path');
// all of them on one road network (4-connected cells)
const C=100,R=56,cell=(x,y)=>[Math.floor(x),Math.floor(y*.56)],on=(c,r)=>walk(c+.5,(r+.5)/.56),seen=new Set();
const [c0,r0]=cell(50,92),q=[[c0,r0]];seen.add(r0*C+c0);
while(q.length){const [c,r]=q.pop();for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(nc<0||nr<0||nc>=C||nr>=R||seen.has(nr*C+nc)||!on(nc,nr))continue;seen.add(nr*C+nc);q.push([nc,nr])}}
for(const d of doors){const [c,r]=cell(d.arrival.x,d.arrival.y);assert.ok(seen.has(r*C+c),d.key+' is reachable from the spawn')}
// buildings, trees, water and fields are not walkable
for(const [x,y,what] of [[62,8,'tạp hoá roof'],[88,42,'café terrace'],[12,60,'beauty salon'],[86,72,'karaoke'],[48,42,'plaza tree'],[52,76,'pond'],[10,15,'vegetable field'],[30,95,'river']])assert.ok(!walk(x,y),what+' is blocked');
// tags sit on the map, arrivals within the walkable band below the title
for(const d of doors){assert.ok(d.x>0&&d.x<100&&d.y>0&&d.y<100,d.key+' tag on the map');assert.ok(d.arrival.y>=17,d.key+' arrival below the title')}
console.log('PASS: village paths — '+seen.size+' path cells, '+doors.length+' doors reachable, buildings/water blocked');
