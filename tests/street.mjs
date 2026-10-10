import {createHash} from 'node:crypto';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('drizzle-kit/api'))('esbuild');import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const sql=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+file,'utf8'));
const db={prepare(query){let args=[];return {bind(...v){args=v;return this},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sql.prepare(query).get(...args)},async all(){return {results:sql.prepare(query).all(...args)}}}},async batch(ss){sql.exec('BEGIN');try{const r=[];for(const s of ss)r.push(await s.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};globalThis.TEST_ENV={DB:db};
const result=await build({entryPoints:['app/api/street/route.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'mock',setup(b){b.onResolve({filter:/cloudflare:workers/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const env=globalThis.TEST_ENV'}))}}]});const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const ctx={};vm.createContext(ctx);for(const f of ['legacy-core.js','core.js','save-compat.js','cafe-engine.js'])vm.runInContext(readFileSync('public/'+f,'utf8'),ctx);
const origin='https://game.test',tokens=['a','b','c'].map(c=>c.repeat(64)),sha=s=>createHash('sha256').update(s).digest('hex'),keys=tokens.map(sha);
for(let i=0;i<3;i++){const farm=ctx.Farm.initial();farm.profile.name=['Tú','Hằng','Linh'][i];assert(farm.unlocked.street);const old=JSON.parse(readFileSync('tests/fixtures/v58-progress.json','utf8'));const migrated=ctx.Farm.migrate(old);assert(migrated.unlocked.street);assert.equal(migrated.coins,old.coins);assert.equal(ctx.Farm.level(migrated),700);const travelled=ctx.Farm.perform(farm,{type:'travel',zone:'street'});assert.equal(farm.zone,'street');sql.prepare('INSERT INTO accounts (id,username,password_hash,key_hash,created) VALUES (?,?,?,?,0)').run('a'+i,'player'+i,'x',keys[i]);sql.prepare('INSERT INTO sessions (token_hash,account_id,created,expires) VALUES (?,?,0,?)').run(keys[i],'a'+i,Date.now()+86400000);sql.prepare('INSERT INTO game_saves (key_hash,revision,payload,mutation,updated) VALUES (?,1,?,?,0)').run(keys[i],JSON.stringify({version:1,farm,cards:{}}),'test')}
const snapshot=sql.prepare('SELECT * FROM game_saves ORDER BY key_hash').all();
function req(method,body,who=0,query='',headers={}){return new Request(origin+'/api/street'+query,{method,headers:{origin,cookie:'lm_session='+tokens[who],'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})})}
async function post(body,who=0){return api.POST(req('POST',body,who))}async function get(who=0,query=''){return api.GET(req('GET',null,who,query))}
assert.equal((await api.GET(req('GET',null,0,'',{cookie:'',authorization:'Bearer '+tokens[0]}))).status,401);
assert.equal((await api.POST(req('POST',{action:'presence',x:50,y:70},0,'',{origin:'https://evil.test'}))).status,403);
const codes=[];for(let i=0;i<3;i++){const r=await post({action:'presence',x:500,y:-50},i);assert.equal(r.status,200);codes.push((await r.json()).code)}
let d=await (await get()).json();assert.equal(d.players.length,3);assert.equal(d.self,codes[0]);assert(d.players.every(p=>p.x===99&&p.y===15));for(const key of keys)assert(!JSON.stringify(d).includes(key));assert(!JSON.stringify(d).includes('key_hash'));assert(!JSON.stringify(d).includes('password'));
assert.equal((await get(0,'?with='+codes[1])).status,403);assert.equal((await post({action:'message',code:codes[1],text:'Không được',id:crypto.randomUUID()})).status,403);
assert.equal((await post({action:'request',code:codes[1]})).status,200);d=await (await get(1)).json();assert(d.contacts.find(p=>p.code===codes[0]).incoming);assert.equal((await post({action:'accept',code:codes[1]})).status,409);assert.equal((await post({action:'accept',code:codes[0]},1)).status,200);
const message={action:'message',code:codes[1],text:'Xin chào <script> & Hằng!',id:crypto.randomUUID()};assert.equal((await post(message)).status,200);assert((await (await post(message)).json()).duplicate);assert.equal((await post({...message,text:'Khác'})).status,409);assert.equal((await post({...message,id:crypto.randomUUID()})).status,429);
let thread=await (await get(1,'?with='+codes[0])).json();assert.equal(thread.messages.length,1);assert(!thread.messages[0].mine);assert.equal(thread.messages[0].text,message.text);assert((await (await get(0,'?with='+codes[1])).json()).messages[0].mine);
// A third account cannot read or send into the pair, even by guessing a valid participant code.
assert.equal((await get(2,'?with='+codes[0])).status,403);assert.equal((await post({...message,code:codes[0]},2)).status,403);
assert.equal((await post({action:'leave'},1)).status,200);assert(!(await (await get()).json()).players.some(p=>p.code===codes[1]));assert.equal((await get(1,'?with='+codes[0])).status,200);
assert.equal((await post({action:'block',code:codes[0]},1)).status,200);assert.equal((await get(0,'?with='+codes[1])).status,403);assert.equal((await post({action:'request',code:codes[1]})).status,403);assert(!(await (await get()).json()).contacts.length);assert(!(await (await get(1)).json()).players.some(p=>p.code===codes[0]));assert((await (await get(1)).json()).blocked.some(p=>p.code===codes[0]));
assert.equal((await post({action:'unblock',code:codes[0]},1)).status,200);assert.equal((await get(1,'?with='+codes[0])).status,403);await post({action:'request',code:codes[1]});await post({action:'accept',code:codes[0]},1);assert.equal((await get(1,'?with='+codes[0])).status,200);
// Stale presence expires from the visible square; friendship and private history survive.
sql.prepare('UPDATE street_presence SET updated=? WHERE key_hash=?').run(Date.now()-61000,keys[2]);assert(!(await (await get()).json()).players.some(p=>p.code===codes[2]));assert.deepEqual(sql.prepare('SELECT * FROM game_saves ORDER BY key_hash').all(),snapshot);
console.log('PASS: real session identity, legacy progress and street travel, online expiry, explicit friendship consent, private DM history/ownership, duplicate/rate gates, blocking, no wallet or save mutations.');
// Shared chat requires simultaneous online membership and expires.
assert.equal((await api.GET(req('GET',null,0,'?channel=public',{cookie:''}))).status,401);
assert.equal((await post({action:'publicMessage',text:'Ngoại tuyến',id:crypto.randomUUID()},1)).status,409);
const shared={action:'publicMessage',text:'Chào cả công viên <b>Mây</b>!',id:crypto.randomUUID(),name:'Mạo danh Hằng'};
assert.equal((await post(shared)).status,200);assert((await (await post(shared)).json()).duplicate);assert.equal((await post({...shared,text:'Thay đổi'})).status,409);assert.equal((await post({...shared,id:crypto.randomUUID()})).status,429);
const publicHistory=await (await get(0,'?channel=public')).json();assert.equal(publicHistory.messages.at(-1).text,shared.text);assert.equal(publicHistory.messages.at(-1).name,'Tú');assert.equal(publicHistory.messages.at(-1).code,codes[0]);for(const key of keys)assert(!JSON.stringify(publicHistory).includes(key));assert(!JSON.stringify(publicHistory).includes(message.text));assert.equal((await post({action:'publicMessage',text:'x'.repeat(301),id:crypto.randomUUID()})).status,400);
assert.deepEqual(sql.prepare('SELECT * FROM game_saves ORDER BY key_hash').all(),snapshot);
await post({action:'presence',x:50,y:70},1);
assert.equal((await (await get(1,'?channel=public')).json()).messages.length,0,'late join cannot read old chat');
await post({action:'leave'});assert.equal((await (await get(1,'?channel=public')).json()).messages.length,0,'sender leaves, shared chat disappears');await post({action:'presence',x:50,y:70});sql.prepare('UPDATE street_messages SET created=?').run(Date.now()-31000);
assert.equal((await (await get(0,'?channel=public')).json()).messages.length,0);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM street_messages').get().n,0);
const gesture={action:'gesture',kind:'hand',code:codes[1],id:crypto.randomUUID()};assert.equal((await post(gesture)).status,200);
let gs=(await (await get(1)).json()).gestures;assert.equal(gs[0].state,'pending');assert.equal(gs[0].actor,codes[0]);assert.equal(gs[0].target,codes[1]);
assert.equal((await post({action:'respondGesture',id:gesture.id,accept:true},2)).status,409);
assert.equal((await post({action:'respondGesture',id:gesture.id,accept:true},1)).status,200);assert.equal((await (await get()).json()).gestures[0].state,'active');
assert.equal((await post({...gesture,id:crypto.randomUUID(),kind:'jump'})).status,429);
sql.prepare('UPDATE street_gestures SET created=?').run(Date.now()-4000);
assert.equal((await post({...gesture,id:crypto.randomUUID(),kind:'jump'})).status,200);
await post({action:'block',code:codes[0]},1);sql.prepare('DELETE FROM street_gestures').run();assert.equal((await post({...gesture,id:crypto.randomUUID(),kind:'kiss'})).status,403);
await post({action:'unblock',code:codes[0]},1);
for(const kind of ['kiss','punch','sit','jump','wish']){sql.prepare('DELETE FROM street_gestures').run();assert.equal((await post({...gesture,id:crypto.randomUUID(),kind})).status,200)}
sql.prepare('UPDATE street_gestures SET created=?').run(Date.now()-16000);assert.equal((await (await get()).json()).gestures.length,0);
sql.prepare('DELETE FROM street_gestures').run();assert.equal((await post({...gesture,id:crypto.randomUUID(),kind:'fly'})).status,400,'unknown gesture refused');
// a seat on the park swing (y 22) and a bench by the edge keep their place; off-map positions are pulled back onto it
for(const [x,y,want] of [[80,22,[80,22]],[13,35,[13,35]],[-50,-50,[1,15]],[500,500,[99,99]]]){await post({action:'presence',x,y});const me=(await (await get()).json()).players.find(p=>p.code===codes[0]);assert.deepEqual([me.x,me.y],want,`presence ${x},${y}`)}
assert.deepEqual(sql.prepare('SELECT * FROM game_saves ORDER BY key_hash').all(),snapshot);
console.log('PASS: simultaneous chat membership, late-entry cutoff, 30s deletion, server identity, consent recipient ownership, gestures/rate/block/expiry gates, park seats kept and unchanged saves.');
