import {getChatGPTUser} from '../../../chatgpt-auth';
import {isOwner} from '../../../../lib/owner';
import {stats} from '../../../../lib/analytics';
export async function GET(){if(!isOwner(await getChatGPTUser()))return Response.json({error:'Chỉ chủ game được xem.'},{status:403,headers:{'Cache-Control':'private, no-store'}});try{return Response.json(await stats(),{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({error:'Thống kê tạm thời chưa tải được.'},{status:503,headers:{'Cache-Control':'private, no-store'}})}}
