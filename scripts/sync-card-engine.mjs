import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('public/cards.js','utf8');
const engine=source.replace("'use strict';\n(function(root){",'// Generated from public/cards.js by scripts/sync-card-engine.mjs.\n').replace('root.Cards=','export const RoomCards=').replace("})(typeof window==='undefined'?globalThis:window);",'');
writeFileSync('lib/card-engine.ts',engine);

const files=['public/legacy-core.js','public/core.js','public/save-compat.js','public/cafe-engine.js'];
const farm='// Generated: same compatibility engines used by the browser.\nconst engineRoot:any={};\n'+files.map(path=>readFileSync(path,'utf8').replace("typeof window==='undefined'?globalThis:window",'engineRoot').replace('})(Farm);','})(engineRoot.Farm);')).join('\n')+'\nexport const FarmEngine=engineRoot.Farm;\n';
writeFileSync('lib/farm-engine.ts',farm);
