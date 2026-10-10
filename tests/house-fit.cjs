const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ctx={document:{addEventListener(){}},console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('public/housing.js','utf8')+';this.H={HOUSE_FRAMES,SPOT_PLAN,spotFor,fitSpot,turnFor}',ctx);
const {HOUSE_FRAMES,SPOT_PLAN,spotFor,fitSpot,turnFor}=ctx.H,box=x=>10.94+x*.78125,kinds=['bed','sofa','table','lamp','plant','art'],E=.01;
// a piece stands on a floor inside the trapezoid between the back wall and the front edge; a picture hangs on the back wall
function inside(style,kind,p,label){const f=HOUSE_FRAMES[style][p.fl],[bx0,bx1,W,B,F,fx0,fx1]=f;
  if(kind==='art'){assert.ok(p.x-p.w/2>=box(bx0)-E&&p.x+p.w/2<=box(bx1)+E,label+' picture within the back wall');assert.ok(p.y<B&&p.y-p.w*1.4>W,label+' picture between floor and ceiling');return}
  assert.ok(p.y>=B-E&&p.y<=F+E,label+' stands on the floor');const t=(p.y-B)/(F-B);
  assert.ok(p.x-p.w/2>=box(bx0+t*(fx0-bx0))-E&&p.x+p.w/2<=box(bx1+t*(fx1-bx1))+E,label+' does not poke into a side wall')}
const overlap=(a,b)=>a.x-a.w/2<b.x+b.w/2&&b.x-b.w/2<a.x+a.w/2;
for(const style of Object.keys(HOUSE_FRAMES)){
  // the default spots, with the planned piece and with any piece put there
  SPOT_PLAN.forEach(([plan],i)=>{for(const kind of kinds)inside(style,kind,spotFor(style,i,kind),`${style} spot ${i} ${kind}`);assert.equal(spotFor(style,i).fl,SPOT_PLAN[i][2][0])});
  // nothing in "Sắp xếp gọn" hides another piece: the picture and lamp beside the bed, the sofa beside the table
  const sp=i=>spotFor(style,i);for(const [a,b] of [[0,1],[0,2],[4,5],[5,7]])assert.ok(!overlap(sp(a),sp(b)),`${style}: ${SPOT_PLAN[a][0]} ${a} and ${SPOT_PLAN[b][0]} ${b} side by side`);
  // anywhere the player drags a piece it lands inside the house, and inside what the engine accepts once the client clamps it
  for(let n=0;n<400;n++){const kind=kinds[n%6],p=fitSpot(style,{x:Math.random()*120-10,y:Math.random()*120-10},kind);inside(style,kind,p,`${style} drag ${kind}`);assert.ok(p.x>15&&p.x<85&&p.y>38,`${style} drag ${kind} within the engine's bounds`)}
  // a dragged spot that is already inside stays where it was put
  const s0=spotFor(style,5,'table'),again=fitSpot(style,s0,'table');assert.ok(Math.abs(again.x-s0.x)<.01&&Math.abs(again.y-s0.y)<.01,style+' fitting is stable');
  // pieces nearer the front are drawn a little bigger
  assert.ok(fitSpot(style,{x:50,y:HOUSE_FRAMES[style].l[4]},'sofa').w>fitSpot(style,{x:50,y:HOUSE_FRAMES[style].l[3]},'sofa').w,style+' perspective');
}
assert.equal(turnFor('sofa',0),30);assert.equal(turnFor('sofa',1),-30);assert.equal(turnFor('sofa',.5),0);assert.equal(turnFor('art',0),0);assert.equal(turnFor('bed',0),0);
console.log('PASS: house fit — every spot and dragged position keeps furniture on a floor inside each of the 7 houses, pictures flat on the back wall, default pieces side by side');
