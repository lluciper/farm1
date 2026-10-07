// Detect limb joints for every 320x400 character layer from its alpha channel.
const fs=require('fs');const dir=process.argv[2];const W=320,H=400;
const runs=(b,y)=>{const out=[];let s=-1;for(let x=40;x<280;x++){const on=b[y*W+x]>110;if(on&&s<0)s=x;if(!on&&s>=0){if(x-s>=3)out.push([s,x-1]);s=-1}}if(s>=0)out.push([s,279]);return out};
const med=a=>{const v=[...a].sort((p,q)=>p-q);return v[Math.floor(v.length/2)]};
function detect(b){
  // Legs: from the feet upward, the rows where a gap separates two legs near the centre.
  const gapAt=y=>{const r=runs(b,y);for(let i=0;i+1<r.length;i++){const g0=r[i][1],g1=r[i+1][0],mid=(g0+g1)/2;if(g1-g0>=3&&mid>135&&mid<205&&r[i][1]-r[i][0]>=10&&r[i+1][1]-r[i+1][0]>=10)return mid}return null};
  // Longest unbroken run of rows (reaching below y=330) where the two legs are apart; its top is the crotch.
  let best=null,cur=null;for(let y=376;y>=240;y--){const m=gapAt(y);if(m!==null){if(!cur)cur={bottom:y,top:y,mids:[]};cur.top=y;cur.mids.push(m)}else if(cur){if(cur.bottom>=330&&(!best||cur.bottom-cur.top>best.bottom-best.top))best=cur;cur=null}}if(cur&&cur.bottom>=330&&(!best||cur.bottom-cur.top>best.bottom-best.top))best=cur;
  if(!best||best.bottom-best.top<5)return null;const crotch=best.top,mids=best.mids;
  const split=Math.round(med(mids.slice(-Math.min(mids.length,20))));
  // Arms: rows above the hips where a hand/arm run sits clearly outside the torso.
  const side=(isLeft)=>{const rows=[];for(let y=240;y<crotch-2;y++){const r=runs(b,y);if(r.length<2)continue;if(isLeft){const a=r[0],t=r[1];if(a[1]<split-28&&t[0]-a[1]>=2&&a[1]-a[0]<=46)rows.push({y,cut:(a[1]+t[0])/2})}else{const a=r[r.length-1],t=r[r.length-2];if(a[0]>split+22&&a[0]-t[1]>=2&&a[1]-a[0]<=46)rows.push({y,cut:(t[1]+a[0])/2})}}
    if(rows.length<5)return null;const top=rows[0].y,bottom=Math.min(crotch-2,rows[rows.length-1].y+6),cut=Math.round(med(rows.map(r=>r.cut)));return {cut,top:Math.max(246,top-20),bottom}};
  let armL=side(true),armR=side(false);
  // One arm hidden against the body: mirror the other across the leg split.
  if(armL&&!armR)armR={cut:2*split-armL.cut,top:armL.top,bottom:armL.bottom,mirrored:true};if(armR&&!armL)armL={cut:2*split-armR.cut,top:armR.top,bottom:armR.bottom,mirrored:true};
  return {split,crotch,armL,armR}}
const out={};for(const f of fs.readdirSync(dir).filter(f=>/^(rig|body)-.*\.raw$/.test(f.replace(/^alpha-/,''))&&f.startsWith('alpha-')).sort()){const key=f.slice(6,-4);out[key]=detect(fs.readFileSync(dir+'/'+f))}
fs.writeFileSync(process.argv[3],JSON.stringify(out));
for(const [k,v] of Object.entries(out))console.log(k.padEnd(24),v?`split ${v.split} crotch ${v.crotch} | armL ${v.armL?v.armL.cut+' '+v.armL.top+'-'+v.armL.bottom:'-'} | armR ${v.armR?v.armR.cut+' '+v.armR.top+'-'+v.armR.bottom:'-'}`:'NO LEGS');
