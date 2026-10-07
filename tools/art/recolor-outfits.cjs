// Builds the three reward outfits that used to be a whole-picture CSS tint (which also recoloured skin, hair, hat and
// shoes). Only the main garment is recoloured: pixels of that garment's colour inside the clothing band of the picture.
// The shoe layers (feet-*.png) hold shoes only, so they stay copies of the source outfit's. Sources that have a
// shoe-ready -shod variant (tools/art/shod-legs.cjs, run that first) get a recoloured -shod too.
//   node tools/art/recolor-outfits.cjs        (needs ImageMagick 7)
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const dir=path.join(__dirname,'../../public/fashion'),W=320,H=400;
// out, source, garment hue range, min saturation/value, clothing band (y), new hue, saturation ×, value ×
const SPECS=[
  {out:'moon',src:'festival',h:[255,345],s:.15,v:.15,y:[170,400],hue:222,sat:1.0,val:1.0},   // áo dài: purple → moonlit blue
  {out:'jade',src:'green',h:[60,130],s:.2,v:.15,y:[170,400],hue:160,sat:1.1,val:1.0},        // overalls: green → jade
  {out:'legend',src:'master',h:[15,45],s:.6,v:.55,y:[200,320],hue:352,sat:1.05,val:.9},      // tunic: orange → crimson
];
const hsv=(r,g,b)=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return [h,mx?d/mx:0,mx]};
const rgb=(h,s,v)=>{const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return [r+m,g+m,b+m].map(n=>Math.round(Math.min(1,n)*255))};
for(const g of ['female','male'])for(const o of SPECS)for(const suffix of ['','-shod']){
  const file=path.join(dir,`rig-${g}-${o.src}${suffix}.png`);if(!fs.existsSync(file))continue;
  const p=execFileSync('magick',[file,'-depth','8','rgba:-'],{maxBuffer:1e8});
  const mask=new Float32Array(W*H);let mid=(o.h[0]+o.h[1])/2;
  for(let y=o.y[0];y<o.y[1];y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(p[i+3]<8)continue;const [h,s,v]=hsv(p[i],p[i+1],p[i+2]);
    if(h>=o.h[0]&&h<=o.h[1]&&s>=o.s&&v>=o.v)mask[y*W+x]=1}
  // Soften the mask edge by one pixel so the outline blends instead of stair-stepping.
  const soft=new Float32Array(W*H);
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){let t=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)t+=mask[(y+dy)*W+x+dx]*(dx||dy?1:4);soft[y*W+x]=Math.max(mask[y*W+x]*.5,t/12)}
  const out=Buffer.from(p);
  for(let k=0;k<W*H;k++){const w=soft[k];if(!w)continue;const i=k*4;const [h,s,v]=hsv(p[i],p[i+1],p[i+2]);
    const [r,gg,b]=rgb((h-mid+o.hue+720)%360,Math.min(1,s*o.sat),Math.min(1,v*o.val));
    out[i]=Math.round(p[i]*(1-w)+r*w);out[i+1]=Math.round(p[i+1]*(1-w)+gg*w);out[i+2]=Math.round(p[i+2]*(1-w)+b*w)}
  execFileSync('magick',['-size',`${W}x${H}`,'-depth','8','rgba:-',path.join(dir,`rig-${g}-${o.out}${suffix}.png`)],{input:out});
}
console.log('recoloured rig-{female,male}-{moon,jade,legend}.png and the jade/legend -shod variants');
