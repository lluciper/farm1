'use strict';
(function(root){
const old=root.LegacyFarm,next=root.NewFarm;
if(!old||!next)throw Error('Không tải được bộ đọc bản lưu.');
// Retain products and possessions introduced after the exported GitHub version.
for(const key of new Set([...Object.keys(old),...Object.keys(next)])){
 const a=old[key],b=next[key];
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
  const merged={...a,...b};Object.assign(a,merged);Object.assign(b,merged);
 }
}
let active=next;
function engine(s){return s&&s.version===3&&(s.promotionVersion===1||s.landVersion===3||s.xpCurve===3)?old:next;}
const api={};
for(const key of new Set([...Object.keys(old),...Object.keys(next)])){
 const value=next[key]??old[key];
 if(typeof value==='function')api[key]=function(...args){const e=args[0]?.version===3?engine(args[0]):active;return (e[key]||next[key]||old[key])(...args)};
 else if(key!=='MAX_LEVEL')api[key]=value;
}
api.initial=function(){active=next;return next.initial()};
api.migrate=function(state){const e=engine(state);const migrated=e.migrate(state);active=e;return migrated};
Object.defineProperty(api,'MAX_LEVEL',{get(){return active.MAX_LEVEL}});
api.progressionStart=function(state){return engine(state)===old?50:100};
root.Farm=api;
})(typeof window==='undefined'?globalThis:window);
