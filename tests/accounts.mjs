import {createHash} from 'node:crypto';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('drizzle-kit/api'))('esbuild');import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const sql=new DatabaseSync(':memory:');for(const file of ['0001_perpetual_harpoon.sql','0002_complex_siren.sql','0003_redundant_sister_grimm.sql','0004_silly_colonel_america.sql','0005_many_fabian_cortez.sql'])sql.exec(readFileSync('drizzle/'+file,'utf8'));const db={prepare(query){let args=[];return {bind(...v){args=v;return this},async run(){return sql.prepare(query).run(...args)},async first(){return sql.prepare(query).get(...args)}}}};globalThis.TEST_ENV={DB:db};
async function load(entry){const result=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'mock',setup(b){b.onResolve({filter:/cloudflare:workers/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const env=globalThis.TEST_ENV'}))}}]});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))}
const accounts=await load('app/api/account/route.ts'),saves=await load('app/api/game-save/route.ts');const ctx={};vm.createContext(ctx);for(const f of ['legacy-core.js','core.js','save-compat.js'])vm.runInContext(readFileSync('public/'+f,'utf8'),ctx);const origin='https://game.test';
const sha=t=>createHash('sha256').update(t).digest('hex');
function post(body,{cookie='',from=origin}={}){return new Request(origin+'/api/account',{method:'POST',headers:{origin:from,'Content-Type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)})}
function save(method,{cookie='',bearer='',body}={}){return new Request(origin+'/api/game-save',{method,headers:{origin,'Content-Type':'application/json',...(cookie?{cookie}:{}),...(bearer?{Authorization:'Bearer '+bearer}:{})},...(body?{body:JSON.stringify(body)}:{})})}
const cookieOf=res=>res.headers.get('set-cookie')?.match(/lm_session=([a-f0-9]{64})/)?.[0]||'';
function farmData(name,coins){const farm=ctx.Farm.initial();farm.profile.name=name;farm.coins=coins;return {version:1,farm,cards:{opponents:['Băng','Nam','Hiên'],stake:5000,game:null,stats:{played:0,wins:0},recorded:false}}}
function legacySave(token,name,coins){sql.prepare('INSERT INTO game_saves (key_hash,revision,payload,mutation,updated) VALUES (?,1,?,?,0)').run(sha(token),JSON.stringify({...farmData(name,coins),farm:{...JSON.parse(readFileSync('tests/fixtures/v58-progress.json','utf8')),profile:{name,gender:'female'},coins}}),'legacy')}

// Sign-up, sign-in and protected saves.
let res=await accounts.POST(post({action:'register',username:'Tu.Nong',password:'secret1'}));assert.equal(res.status,200);const tu=cookieOf(res);assert(tu);assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.match(res.headers.get('set-cookie'),/Secure/);assert.equal((await res.json()).account.username,'tu.nong');
assert.equal((await accounts.POST(post({action:'register',username:'tu.nong',password:'secret1'}))).status,409);
assert.equal((await accounts.POST(post({action:'register',username:'ab',password:'secret1'}))).status,400);
assert.equal((await accounts.POST(post({action:'register',username:'hang',password:'123'}))).status,400);
assert.equal((await accounts.POST(post({action:'login',username:'tu.nong',password:'secret1'},{from:'https://evil.test'}))).status,403);
assert.equal((await (await accounts.GET(new Request(origin+'/api/account',{headers:{cookie:tu}}))).json()).account.username,'tu.nong');
assert.equal((await saves.GET(save('GET'))).status,401);
let put=await saves.PUT(save('PUT',{cookie:tu,body:{revision:0,mutation:crypto.randomUUID(),data:farmData('Tú',300)}}));assert.equal(put.status,200);
assert.equal((await (await saves.GET(save('GET',{cookie:tu}))).json()).data.farm.coins,300);
assert.equal(sql.prepare('SELECT password_hash FROM accounts').get().password_hash.startsWith('pbkdf2$100000$'),true);assert(!JSON.stringify(sql.prepare('SELECT * FROM sessions').all()).includes(tu.split('=')[1]));
// Wrong passwords lock the account for a while.
for(let i=0;i<7;i++)assert.equal((await accounts.POST(post({action:'login',username:'tu.nong',password:'wrong!!'}))).status,401);
assert.equal((await accounts.POST(post({action:'login',username:'tu.nong',password:'wrong!!'}))).status,401);assert.equal((await accounts.POST(post({action:'login',username:'tu.nong',password:'secret1'}))).status,429);
sql.prepare('UPDATE accounts SET locked_until=0').run();res=await accounts.POST(post({action:'login',username:'TU.NONG',password:'secret1'}));assert.equal(res.status,200);
console.log('PASS: sign-up validation, HttpOnly session cookie, hashed passwords/sessions, CSRF origin check, saves require a session, failed-login lockout.');

// Guest secret (new or from old links): plays without an account until claimed, then the claim keeps the same save.
const OLD='c'.repeat(64);legacySave(OLD,'Lão Nông',12345);
assert.deepEqual(await (await saves.GET(save('GET',{bearer:'d'.repeat(64)}))).json(),{revision:0,data:null});
assert.equal((await saves.PUT(save('PUT',{bearer:'d'.repeat(64),body:{revision:0,mutation:crypto.randomUUID(),data:farmData('Khách',1)}}))).status,200);
assert.equal((await (await saves.GET(save('GET',{bearer:OLD}))).json()).data.farm.coins,12345);
put=await saves.PUT(save('PUT',{bearer:OLD,body:{revision:1,mutation:crypto.randomUUID(),data:farmData('Lão Nông',12400)}}));assert.equal(put.status,200);
assert.deepEqual(await (await accounts.POST(post({action:'legacy',token:OLD}))).json(),{claimed:false,exists:true,name:'Lão Nông',level:1});
res=await accounts.POST(post({action:'register',username:'laonong',password:'matkhau1',legacy:OLD}));assert.equal(res.status,200);assert.equal((await res.json()).claimed,true);const lao=cookieOf(res);
assert.equal((await (await saves.GET(save('GET',{cookie:lao}))).json()).data.farm.coins,12400);
assert.equal((await saves.GET(save('GET',{bearer:OLD}))).status,401);
assert.equal((await accounts.POST(post({action:'register',username:'thief',password:'matkhau1',legacy:OLD}))).status,409);
assert.equal((await (await accounts.POST(post({action:'legacy',token:OLD}))).json()).claimed,true);
console.log('PASS: guest secrets start and keep farms without an account, claim moves the same save into the account and disables the secret.');

// An account that never started a farm may adopt an unclaimed old farm; a started one may not.
const OLD2='e'.repeat(64);legacySave(OLD2,'Bà Ba',777);res=await accounts.POST(post({action:'register',username:'trong',password:'abc12345'}));const empty=cookieOf(res);
assert.equal((await accounts.POST(post({action:'link',token:OLD2},{cookie:tu}))).status,409);
assert.equal((await accounts.POST(post({action:'link',token:OLD2},{cookie:empty}))).status,200);
assert.equal((await (await saves.GET(save('GET',{cookie:empty}))).json()).data.farm.profile.name,'Bà Ba');assert.equal((await saves.GET(save('GET',{bearer:OLD2}))).status,401);
// Password change ends other sessions; logout ends this one.
const other=cookieOf(await accounts.POST(post({action:'login',username:'trong',password:'abc12345'})));
assert.equal((await accounts.POST(post({action:'password',current:'nope12',next:'newpass1'},{cookie:empty}))).status,401);
res=await accounts.POST(post({action:'password',current:'abc12345',next:'newpass1'},{cookie:empty}));assert.equal(res.status,200);const renewed=cookieOf(res);
assert.equal((await saves.GET(save('GET',{cookie:other}))).status,401);assert.equal((await saves.GET(save('GET',{cookie:renewed}))).status,200);
res=await accounts.POST(post({action:'logout'},{cookie:renewed}));assert.match(res.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await saves.GET(save('GET',{cookie:renewed}))).status,401);
console.log('PASS: empty account adopts an old farm, started account refused, password change revokes sessions, logout ends the session.');

const oldToken='9'.repeat(64);legacySave(oldToken,'Giữ cấp cao',3456789);
const before=sql.prepare('SELECT payload FROM game_saves WHERE key_hash=?').get(sha(oldToken)).payload;
const registered=await accounts.POST(post({action:'register',username:'giu.cap700',password:'keep700',legacy:oldToken}));assert.equal(registered.status,200);
const accountCookie=cookieOf(registered),received=await (await saves.GET(save('GET',{cookie:accountCookie}))).json();
assert.equal(JSON.stringify(received.data),before);assert.equal(ctx.Farm.level(ctx.Farm.migrate(received.data.farm)),700);assert.equal(received.data.farm.plots.length,51);
assert.equal((await saves.PUT(save('PUT',{cookie:accountCookie,body:{revision:received.revision,mutation:crypto.randomUUID(),data:received.data}}))).status,200);
console.log('PASS: claiming a real v58-shaped level-700 save retains its original payload, 51 plots and possessions; account can save and read it without resetting.');
