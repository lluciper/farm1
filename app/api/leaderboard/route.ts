import {gameDb} from '../../../lib/game-save';
import {rankPlayers,type RankRow} from '../../../lib/leaderboard';
let cached:{players:ReturnType<typeof rankPlayers>;updatedAt:number}|null=null;
let pending:Promise<NonNullable<typeof cached>>|null=null;
async function readTop(){
 const db=gameDb();
 const result=await db.prepare(`SELECT
 json_extract(payload,'$.farm.profile.name') AS name,
 json_extract(payload,'$.farm.xp') AS xp,
 json_extract(payload,'$.farm.xpCurve') AS xpCurve,
 json_extract(payload,'$.farm.promotionVersion') AS promotionVersion,
 json_extract(payload,'$.farm.landVersion') AS landVersion,
 json_extract(payload,'$.farm.special.completed') AS completed,
 json_extract(payload,'$.farm.profile.gender') AS gender,
 json_extract(payload,'$.farm.wardrobe.equipped') AS outfit,
 json_extract(payload,'$.farm.appearance.hair') AS hair,
 json_extract(payload,'$.farm.footwear.equipped') AS shoe,
 updated FROM game_saves
 WHERE json_valid(payload) AND json_extract(payload,'$.farm.version')=3
 ORDER BY updated ASC,rowid ASC`).all();
 return {players:rankPlayers(result.results as RankRow[]),updatedAt:Date.now()};
}
export async function GET(){
 try{
  if(!cached||Date.now()-cached.updatedAt>=60000){pending??=readTop();try{cached=await pending}finally{pending=null}}
  return Response.json({...cached,ranking:'level_then_xp',refreshSeconds:60},{headers:{'Cache-Control':'public, max-age=0, s-maxage=30','Referrer-Policy':'no-referrer'}});
 }catch{return Response.json({error:'Chưa tải được bảng xếp hạng. Hãy thử lại khi có mạng.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
