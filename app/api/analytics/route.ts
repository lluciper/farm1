import {analyticsDb} from '../../../lib/analytics';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function POST(request:Request){const h={'Cache-Control':'no-store'};try{
const origin=new URL(request.url).origin;if(request.headers.get('origin')!==origin||request.headers.get('sec-fetch-site')==='cross-site')return new Response(null,{status:403,headers:h});
if(Number(request.headers.get('content-length')||0)>1024)return new Response(null,{status:413,headers:h});const raw=await request.text();if(raw.length>1024)return new Response(null,{status:413,headers:h});const body=JSON.parse(raw);if(!uuid.test(body.id)||!['visit','play','heartbeat'].includes(body.type))return new Response(null,{status:400,headers:h});
const match=request.headers.get('cookie')?.match(/(?:^|;\s*)lm_browser=([^;]+)/);let browser=match?.[1];const fresh=!browser||!uuid.test(browser);if(fresh)browser=crypto.randomUUID();const db=analyticsDb(),now=Date.now();
if(body.type==='visit'){await db.prepare('INSERT INTO visits (id,browser,started,day,played,last_active) VALUES (?,?,?,?,0,?) ON CONFLICT(id) DO NOTHING').bind(body.id,browser,now,new Date(now+7*3600000).toISOString().slice(0,10),now).run()}
else if(!fresh){await db.prepare('UPDATE visits SET played=1,last_active=? WHERE id=? AND browser=?').bind(now,body.id,browser).run()}
return new Response(null,{status:204,headers:{...h,...(fresh?{'Set-Cookie':`lm_browser=${browser}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`}:{})}})
}catch(e){console.error('analytics write unavailable',e);return new Response(null,{status:503,headers:h})}}
