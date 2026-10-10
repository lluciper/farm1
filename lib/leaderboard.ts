import {FarmEngine as F} from './farm-engine';
export type RankRow={name:unknown;xp:unknown;xpCurve:unknown;promotionVersion:unknown;landVersion:unknown;completed:unknown;updated:unknown;gender:unknown;outfit:unknown;hair:unknown;shoe:unknown;hat?:unknown};
// Only public display fields leave this function. Save keys and account names never enter the query.
export function rankPlayers(rows:RankRow[]){
 const eligible=rows.flatMap((r,i)=>{
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>32||!Number.isSafeInteger(r.xp)||Number(r.xp)<0)return [];
  const farm={version:3,xp:r.xp,xpCurve:r.xpCurve,landVersion:r.landVersion,promotionVersion:r.promotionVersion,special:Number.isSafeInteger(r.completed)&&Number(r.completed)>=0?{completed:r.completed}:undefined};
  try{const level=F.level(farm);if(!Number.isSafeInteger(level)||level<1)return [];
   return [{name:r.name.trim(),level,xp:Number(r.xp),gender:r.gender==='male'?'male':'female',outfit:typeof r.outfit==='string'&&Object.hasOwn(F.outfits,r.outfit)?r.outfit:'base',hair:typeof r.hair==='string'&&Object.hasOwn(F.hairStyles,r.hair)?r.hair:'short',shoe:typeof r.shoe==='string'&&Object.hasOwn(F.footwear,r.shoe)?r.shoe:'bare',hat:typeof r.hat==='string'&&Object.hasOwn(F.headwear,r.hat)?r.hat:'',updated:Number(r.updated)||0,order:i}];
  }catch{return []}
 });
 eligible.sort((a,b)=>b.level-a.level||b.xp-a.xp||a.updated-b.updated||a.order-b.order);
 return eligible.slice(0,10).map(({updated,order,...player},i)=>({rank:i+1,...player}));
}
