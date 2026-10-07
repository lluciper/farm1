import {gameHTML} from "./game-html";
export function GET(){return new Response(gameHTML,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"}})}
