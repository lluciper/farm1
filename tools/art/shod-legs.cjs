// Outfits drawn with tall boots (denim, denimjacket, green, master) show the boot shafts behind any lower shoe from the
// shoe shop. This builds rig-{gender}-{outfit}-shod.png: the same outfit with the boots replaced by the bare shins and
// feet of the base outfit, moved under each trouser leg. The game uses it whenever shop shoes are worn.
// Run before tools/art/recolor-outfits.cjs (jade/legend are recoloured from green/master, -shod included).
//   node tools/art/shod-legs.cjs        (needs ImageMagick 7)
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const dir=path.join(__dirname,'../../public/fashion'),W=320,H=400,SPLIT=179,FOOT=346;
const load=f=>execFileSync('magick',[path.join(dir,f),'-depth','8','rgba:-'],{maxBuffer:1e8});
const save=(f,buf)=>execFileSync('magick',['-size',`${W}x${H}`,'-depth','8','rgba:-',path.join(dir,f)],{input:buf});
// Source legs (base outfit): first bare-shin row per gender.
const SRC={female:{top:334},male:{top:329}};
// Row where each outfit's boots begin (just under the trouser cuff).
const CUT={female:{denim:329,green:329,denimjacket:337,master:333},male:{denim:332,green:331,denimjacket:337,master:333}};
const centers=(p,y)=>{const runs=[];let st=-1;for(let x=0;x<=W;x++){const a=x<W?p[(y*W+x)*4+3]:0;if(a>100&&st<0)st=x;if(a<=100&&st>=0){if(x-st>6)runs.push((st+x-1)/2);st=-1}}
  const l=runs.filter(c=>c<SPLIT),r=runs.filter(c=>c>=SPLIT);return [l.at(-1),r[0]]};
// Middle of the widest see-through gap between the two legs on a source row (the feet cross SPLIT on some rows).
const gap=(p,y)=>{let best=SPLIT,len=0,st=-1;for(let x=150;x<=210;x++){const clear=p[(y*W+x)*4+3]<60;if(clear&&st<0)st=x;if((!clear||x===210)&&st>=0){if(x-st>len){len=x-st;best=(st+x)/2}st=-1}}return best};
for(const g of ['female','male']){
  const src=load(`rig-${g}-base.png`),top=SRC[g].top;
  const [sL,sR]=centers(src,top+2),[fL,fR]=centers(src,358);
  for(const [o,cut] of Object.entries(CUT[g])){
    const t=load(`rig-${g}-${o}.png`),out=Buffer.from(t);
    const [tL,tR]=centers(t,cut+3),[bL,bR]=centers(t,358);
    // 1. Erase the boots.
    for(let y=cut;y<H;y++)for(let x=90;x<250;x++)out[(y*W+x)*4+3]=0;
    // 2. Close the trouser hem with the art's outline colour where the cut went through cloth.
    for(let x=90;x<250;x++){const i=((cut-1)*W+x)*4;if(t[i+3]>100){const dark=Math.max(t[i],t[i+1],t[i+2])<90;if(!dark){for(const yy of [cut-2,cut-1]){const k=(yy*W+x)*4;out[k]=74;out[k+1]=44;out[k+2]=30;out[k+3]=255}}}}
    // 3. Legs underneath: shins stretched from the hem down to the feet, feet copied 1:1; each leg shifted under its cuff.
    for(let y=cut-3;y<H;y++){
      const sy=y>=FOOT?y:Math.round(top+(y-(cut-3))*(FOOT-top)/(FOOT-(cut-3)));
      const k=y>=FOOT?Math.min(1,(y-FOOT)/12):0;
      const dL=Math.round((tL-sL)*(1-k)+(bL-fL)*k),dR=Math.round((tR-sR)*(1-k)+(bR-fR)*k);
      const split=gap(src,sy);
      for(let sx=90;sx<250;sx++){const x=sx+(sx>=split?dR:dL);if(x<0||x>=W)continue;
        const si=(sy*W+sx)*4,di=(y*W+x)*4;const a=src[si+3]/255;if(!a)continue;const b=out[di+3]/255;
        // destination-over: what is left of the outfit stays on top.
        const oa=b+a*(1-b);for(let c=0;c<3;c++)out[di+c]=Math.round((out[di+c]*b+src[si+c]*a*(1-b))/oa);out[di+3]=Math.round(oa*255)}}
    save(`rig-${g}-${o}-shod.png`,out);
  }
}
console.log('built rig-{female,male}-{denim,denimjacket,green,master}-shod.png');
