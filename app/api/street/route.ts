import {currentAccount} from '../../../lib/accounts';
import {gameDb} from '../../../lib/game-save';
import {FarmEngine as F} from '../../../lib/farm-engine';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
const pairOf=(a:string,b:string)=>[a,b].sort().join(':');
const codeOK=(v:any)=>typeof v==='string'&&/^[A-F0-9]{12}$/.test(v);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const publicPlayer=(r:any)=>({code:r.code,name:r.name,level:r.level,look:JSON.parse(r.look),x:r.x,y:r.y});
async function target(db:any,code:string,own:string){if(!codeOK(code))return null;const r=await db.prepare('SELECT key_hash FROM farm_profiles WHERE code=?').bind(code).first();return r&&r.key_hash!==own?r.key_hash as string:null}
async function blocked(db:any,a:string,b:string){return !!await db.prepare('SELECT 1 AS n FROM social_blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)').bind(a,b,b,a).first()}
async function accepted(db:any,a:string,b:string){return !!await db.prepare("SELECT 1 AS n FROM friendships WHERE pair=? AND status='accepted'").bind(pairOf(a,b)).first()}
export async function GET(request:Request){try{
 const publicQuery=new URL(request.url).searchParams.get('channel')==='public';
 if(publicQuery){
  const account=await currentAccount(request);if(!account)return reply({error:'Đăng nhập và vào công viên để đọc chat trực tiếp.'},401);
  const db=gameDb(),now=Date.now(),own=account.keyHash,p=await db.prepare('SELECT joined FROM street_presence WHERE key_hash=? AND active=1 AND updated>?').bind(own,now-60000).first();if(!p)return reply({messages:[]});
  await db.prepare('DELETE FROM street_messages WHERE created<=?').bind(now-30000).run();
  const rows=await db.prepare('SELECT m.id,m.code,m.name,m.body,m.created FROM street_messages m JOIN street_presence sender ON sender.key_hash=m.sender WHERE sender.active=1 AND sender.updated>? AND m.created>=? AND m.created>? AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE (b.actor=? AND b.target=m.sender) OR (b.target=? AND b.actor=m.sender)) ORDER BY created DESC,id DESC LIMIT 60').bind(now-60000,p.joined,now-30000,own,own).all();return reply({messages:rows.results.reverse().map((r:any)=>({id:r.id,code:r.code,name:r.name,text:r.body,created:r.created}))})}

 const account=await currentAccount(request);if(!account)return reply({error:'Đăng nhập tài khoản để gặp bạn bè và nhắn tin.'},401);
 const db=gameDb(),own=account.keyHash,u=new URL(request.url),code=u.searchParams.get('with');
 if(code){const peer=await target(db,code,own);if(!peer)return reply({error:'Không tìm thấy người chơi.'},404);if(await blocked(db,own,peer)||!await accepted(db,own,peer))return reply({error:'Hai người cần đồng ý kết bạn trước khi nhắn tin.'},403);
  const before=Number(u.searchParams.get('before')||Date.now()+1);if(!Number.isSafeInteger(before)||before<1)return reply({error:'Mốc tin nhắn không hợp lệ.'},400);
  const rows=await db.prepare('SELECT id,sender,body,created FROM private_messages WHERE pair=? AND created<? ORDER BY created DESC,id DESC LIMIT 50').bind(pairOf(own,peer),before).all();
  return reply({messages:rows.results.reverse().map((r:any)=>({id:r.id,mine:r.sender===own,text:r.body,created:r.created})),hasMore:rows.results.length===50});
 }
 const online=await db.prepare('SELECT key_hash,code,name,level,look,x,y FROM street_presence p WHERE active=1 AND updated>? AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE (b.actor=? AND b.target=p.key_hash) OR (b.target=? AND b.actor=p.key_hash)) ORDER BY updated DESC LIMIT 100').bind(Date.now()-60000,own,own).all();
 const contacts=await db.prepare('SELECT f.status,f.requested_by,p.code,p.name,p.level,p.look,p.x,p.y,p.updated,p.active FROM friendships f JOIN street_presence p ON p.key_hash=CASE WHEN f.low=? THEN f.high ELSE f.low END WHERE (f.low=? OR f.high=?) AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE (b.actor=? AND b.target=p.key_hash) OR (b.target=? AND b.actor=p.key_hash)) ORDER BY f.created DESC LIMIT 100').bind(own,own,own,own,own).all();
 const blocks=await db.prepare('SELECT p.code,p.name FROM social_blocks b JOIN street_presence p ON p.key_hash=b.target WHERE b.actor=? ORDER BY b.created DESC LIMIT 100').bind(own).all();
 const gestureRows=await db.prepare('SELECT g.id,g.kind,g.state,g.created,a.code AS actor,t.code AS target FROM street_gestures g JOIN street_presence a ON a.key_hash=g.actor LEFT JOIN street_presence t ON t.key_hash=g.target WHERE g.created>? AND a.active=1 AND a.updated>? AND (g.target IS NULL OR (t.active=1 AND t.updated>?)) AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE (b.actor=? AND b.target IN (g.actor,g.target)) OR (b.target=? AND b.actor IN (g.actor,g.target)))').bind(Date.now()-15000,Date.now()-60000,Date.now()-60000,own,own).all();
 const self=online.results.find((r:any)=>r.key_hash===own);
 return reply({gestures:gestureRows.results,self:self?.code||null,players:online.results.map(publicPlayer),contacts:contacts.results.map((r:any)=>({...publicPlayer(r),status:r.status,incoming:r.requested_by!==own,online:!!r.active&&r.updated>Date.now()-60000})),blocked:blocks.results});
}catch{return reply({error:'Chưa kết nối được phố đi bộ. Thử lại khi có mạng.'},503)}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Yêu cầu không hợp lệ.'},403);
 const account=await currentAccount(request);if(!account)return reply({error:'Hãy đăng nhập tài khoản để tiếp tục.'},401);
 const raw=await request.text();if(raw.length>3000)return reply({error:'Yêu cầu quá lớn.'},413);let body;try{body=JSON.parse(raw)}catch{return reply({error:'Yêu cầu không hợp lệ.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply({error:'Yêu cầu không hợp lệ.'},400);
 const db=gameDb(),own=account.keyHash,now=Date.now();
 if(body.action==='leave'){await db.prepare('UPDATE street_presence SET active=0 WHERE key_hash=?').bind(own).run();return reply({ok:true})}
 if(body.action==='presence'){
  if(!Number.isFinite(body.x)||!Number.isFinite(body.y))return reply({error:'Vị trí không hợp lệ.'},400);
  const save=await db.prepare('SELECT payload FROM game_saves WHERE key_hash=?').bind(own).first();if(!save)return reply({error:'Lưu trang trại trước khi vào phố nhé.'},409);
  const f=F.migrate(JSON.parse(save.payload as string).farm);if(!f.profile.name)return reply({error:'Đặt tên nhân vật trước nhé.'},400);
  const look={gender:f.profile.gender,outfit:f.wardrobe.equipped,hair:f.appearance.hair,shoe:f.footwear.equipped,hat:f.headwear.equipped};
  let profile=await db.prepare('SELECT code FROM farm_profiles WHERE key_hash=? LIMIT 1').bind(own).first();if(!profile){const code=Array.from(crypto.getRandomValues(new Uint8Array(6))).map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();await db.prepare('INSERT INTO farm_profiles (code,key_hash) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM farm_profiles WHERE key_hash=?)').bind(code,own,own).run();profile=await db.prepare('SELECT code FROM farm_profiles WHERE key_hash=? LIMIT 1').bind(own).first()}
  await db.prepare('INSERT INTO street_presence (key_hash,code,name,level,look,x,y,updated,active,joined) VALUES (?,?,?,?,?,?,?,?,1,?) ON CONFLICT(key_hash) DO UPDATE SET name=excluded.name,level=excluded.level,look=excluded.look,x=excluded.x,y=excluded.y,joined=CASE WHEN street_presence.active=0 OR street_presence.updated<excluded.updated-60000 THEN excluded.joined ELSE street_presence.joined END,updated=excluded.updated,active=1').bind(own,profile!.code,f.profile.name,F.level(f),JSON.stringify(look),Math.round(Math.max(1,Math.min(99,body.x))),Math.round(Math.max(15,Math.min(99,body.y))),now,now).run();return reply({ok:true,code:profile!.code})
 }
 if(body.action==='gesture'||body.action==='respondGesture'){
  await db.prepare('DELETE FROM street_gestures WHERE created<=?').bind(now-15000).run();
  const present=await db.prepare('SELECT 1 AS n FROM street_presence WHERE key_hash=? AND active=1 AND updated>?').bind(own,now-60000).first();if(!present)return reply({error:'Vào công viên để tương tác nhé.'},409);
  if(body.action==='respondGesture'){
   if(!UUID.test(body.id||'')||typeof body.accept!=='boolean')return reply({error:'Lời mời không hợp lệ.'},400);
   const r=await db.prepare("UPDATE street_gestures SET state=?,created=? WHERE id=? AND target=? AND state='pending' AND created>? AND EXISTS (SELECT 1 FROM street_presence p WHERE p.key_hash=street_gestures.actor AND active=1 AND updated>?) AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE (b.actor=street_gestures.actor AND b.target=?) OR (b.actor=? AND b.target=street_gestures.actor))").bind(body.accept?'active':'declined',now,body.id,own,now-15000,now-60000,own,own).run();return Number(r.meta?.changes)?reply({ok:true}):reply({error:'Lời mời đã hết hạn.'},409);
  }
  if(!['hand','kiss','punch','sit','jump','wish'].includes(body.kind)||!UUID.test(body.id||''))return reply({error:'Tương tác không hợp lệ.'},400);
  let peer=null;if(['hand','kiss','punch'].includes(body.kind)){peer=await target(db,body.code,own);if(!peer||await blocked(db,own,peer))return reply({error:'Không thể tương tác với người này.'},403);const p=await db.prepare('SELECT 1 AS n FROM street_presence WHERE key_hash=? AND active=1 AND updated>?').bind(peer,now-60000).first();if(!p)return reply({error:'Người chơi đã rời công viên.'},409)}
  const prior=await db.prepare('SELECT actor FROM street_gestures WHERE id=?').bind(body.id).first();if(prior)return prior.actor===own?reply({ok:true,duplicate:true}):reply({error:'Mã tương tác không hợp lệ.'},409);
  const r=await db.prepare('INSERT INTO street_gestures (id,actor,target,kind,state,created) SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM street_gestures WHERE actor=? AND created>?)').bind(body.id,own,peer,body.kind,['hand','kiss'].includes(body.kind)?'pending':'active',now,own,now-3000).run();return Number(r.meta?.changes)?reply({ok:true}):reply({error:'Chờ một chút rồi tương tác tiếp nhé.'},429);
 }
 if(body.action==='publicMessage'){
  const text=typeof body.text==='string'?body.text.trim():'';if(!text||text.length>300||!UUID.test(body.id||''))return reply({error:'Tin chat chung cần từ 1 đến 300 ký tự.'},400);
  const p=await db.prepare('SELECT code,name FROM street_presence WHERE key_hash=? AND active=1 AND updated>?').bind(own,now-60000).first();if(!p)return reply({error:'Vào công viên trước khi gửi chat chung nhé.'},409);
  const prior=await db.prepare('SELECT sender,body FROM street_messages WHERE id=?').bind(body.id).first();if(prior)return prior.sender===own&&prior.body===text?reply({ok:true,duplicate:true}):reply({error:'Mã tin nhắn không hợp lệ.'},409);
  const sent=await db.prepare('INSERT INTO street_messages (id,sender,code,name,body,created) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM street_presence WHERE key_hash=? AND active=1 AND updated>?) AND NOT EXISTS (SELECT 1 FROM street_messages WHERE sender=? AND created>?) AND (SELECT COUNT(*) FROM street_messages WHERE sender=? AND created>?)<20 ON CONFLICT(id) DO NOTHING').bind(body.id,own,p.code,p.name,text,now,own,now-60000,own,now-2000,own,now-60000).run();
  return Number(sent.meta?.changes)?reply({ok:true}):reply({error:'Chờ một chút rồi gửi tiếp nhé, tránh chat quá nhanh.'},429)
 }
 const peer=await target(db,body.code,own);if(!peer)return reply({error:'Không tìm thấy người chơi này.'},404);const pair=pairOf(own,peer),[low,high]=[own,peer].sort();
 if(body.action==='unblock'){await db.prepare('DELETE FROM social_blocks WHERE actor=? AND target=?').bind(own,peer).run();return reply({ok:true})}
 if(body.action==='block'){await db.batch([db.prepare('INSERT INTO social_blocks (pair,actor,target,created) VALUES (?,?,?,?) ON CONFLICT(pair) DO NOTHING').bind(own+':'+peer,own,peer,now),db.prepare('DELETE FROM friendships WHERE pair=?').bind(pair)]);return reply({ok:true})}
 if(await blocked(db,own,peer))return reply({error:'Không thể tương tác với người chơi này.'},403);
 if(body.action==='request'){
  const present=await db.prepare('SELECT 1 AS n FROM street_presence WHERE key_hash=?').bind(peer).first();if(!present)return reply({error:'Hãy gặp người chơi trong phố đi bộ trước nhé.'},400);
  const count=await db.prepare('SELECT COUNT(*) AS n FROM friendships WHERE requested_by=? AND created>?').bind(own,now-86400000).first();if(Number(count?.n)>=20)return reply({error:'Hôm nay đã gửi 20 lời mời. Hãy đợi bạn bè trả lời nhé.'},429);
  await db.prepare("INSERT INTO friendships (pair,low,high,requested_by,status,created) VALUES (?,?,?,?,'pending',?) ON CONFLICT(pair) DO NOTHING").bind(pair,low,high,own,now).run();return reply({ok:true})
 }
 if(body.action==='accept'){const result=await db.prepare("UPDATE friendships SET status='accepted' WHERE pair=? AND status='pending' AND requested_by=?").bind(pair,peer).run();return Number(result.meta?.changes)?reply({ok:true}):reply({error:'Lời mời này không còn hoặc không gửi cho bạn.'},409)}
 if(body.action==='decline'||body.action==='remove'){await db.prepare('DELETE FROM friendships WHERE pair=?').bind(pair).run();return reply({ok:true})}
 if(body.action==='message'){
  if(!await accepted(db,own,peer))return reply({error:'Người nhận cần đồng ý kết bạn trước.'},403);
  const text=typeof body.text==='string'?body.text.trim():'';if(!text||text.length>400||!UUID.test(body.id||''))return reply({error:'Tin nhắn cần từ 1 đến 400 ký tự.'},400);
  const prior=await db.prepare('SELECT sender,recipient,body FROM private_messages WHERE id=?').bind(body.id).first();if(prior)return prior.sender===own&&prior.recipient===peer&&prior.body===text?reply({ok:true,duplicate:true}):reply({error:'Mã tin nhắn không hợp lệ.'},409);
  // Atomic gates prevent concurrent sends from bypassing the rate limit or a removed friendship/block.
  const sent=await db.prepare("INSERT INTO private_messages (id,pair,sender,recipient,body,created) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM friendships WHERE pair=? AND status='accepted') AND NOT EXISTS (SELECT 1 FROM social_blocks WHERE (actor=? AND target=?) OR (actor=? AND target=?)) AND NOT EXISTS (SELECT 1 FROM private_messages WHERE sender=? AND created>?) AND (SELECT COUNT(*) FROM private_messages WHERE sender=? AND created>?)<60 ON CONFLICT(id) DO NOTHING").bind(body.id,pair,own,peer,text,now,pair,own,peer,peer,own,own,now-1000,own,now-60000).run();
  return Number(sent.meta?.changes)?reply({ok:true}):reply({error:'Chờ một chút rồi gửi lại, hoặc kiểm tra trạng thái kết bạn.'},429)
 }
 return reply({error:'Thao tác không hợp lệ.'},400);
}catch{return reply({error:'Chưa thực hiện được. Kiểm tra mạng và thử lại.'},503)}}
