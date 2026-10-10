'use strict';
// Cờ caro (gomoku) against the computer in the leisure zone: 15×15, five or more in a row wins. Who starts is drawn at
// random each game. The computer scores every cell for its own lines and for blocking yours, and now and then misses
// the best move, so a careful player can beat it — the result depends on how you play.
(function(root){
const N=15,DIRS=[[1,0],[0,1],[1,1],[1,-1]];
const at=(g,x,y)=>x<0||y<0||x>=N||y>=N?-1:g.board[y*N+x];
function newCaro(first=Math.random()<.5?1:2){return {board:Array(N*N).fill(0),turn:first,first,done:false,winner:0,line:[],moves:0,last:-1}}
// the run of `who` through (x,y) along (dx,dy), assuming (x,y) is `who`
function run(g,x,y,dx,dy,who){const cells=[y*N+x];let open=0;for(const s of [1,-1]){let i=1;for(;;i++){const v=at(g,x+dx*i*s,y+dy*i*s);if(v!==who){if(v===0)open++;break}cells.push((y+dy*i*s)*N+x+dx*i*s)}}return {cells,open}}
function place(g,idx,who){if(g.done)throw Error('Ván đã kết thúc.');if(g.turn!==who)throw Error('Chưa tới lượt.');if(!Number.isInteger(idx)||idx<0||idx>=N*N||g.board[idx])throw Error('Ô này không đánh được.');
  g.board[idx]=who;g.moves++;g.last=idx;const x=idx%N,y=Math.floor(idx/N);
  for(const [dx,dy] of DIRS){const r=run(g,x,y,dx,dy,who);if(r.cells.length>=5){g.done=true;g.winner=who;g.line=r.cells.sort((a,b)=>a-b);return g}}
  if(g.moves===N*N){g.done=true;g.winner=3;return g}
  g.turn=3-who;return g}
// how good it is for `who` to take (x,y): the lines it would make, open ends counted
const VALUE=(len,open)=>len>=5?1e7:len===4?(open===2?2e5:open===1?2e4:0):len===3?(open===2?6e3:open===1?600:0):len===2?(open===2?300:open===1?40:0):open*4;
function cellScore(g,x,y,who){let sum=0;g.board[y*N+x]=who;for(const [dx,dy] of DIRS){const r=run(g,x,y,dx,dy,who);sum+=VALUE(r.cells.length,r.open)}g.board[y*N+x]=0;return sum}
function botMove(g,who=2,random=Math.random){if(!g.moves)return Math.floor(N*N/2);
  const options=[];for(let i=0;i<N*N;i++){if(g.board[i])continue;const x=i%N,y=Math.floor(i/N);let near=false;for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++)if(at(g,x+dx,y+dy)>0){near=true;break}if(!near)continue;
    const attack=cellScore(g,x,y,who),defend=cellScore(g,x,y,3-who);options.push({i,score:attack+defend*.9,attack,defend})}
  options.sort((a,b)=>b.score-a.score);const best=options[0];
  // never misses a win or a block of five / an open four; otherwise sometimes plays the second or third best move
  const forced=best.attack>=1e7||best.defend>=1e7||best.defend>=2e5||best.attack>=2e5;
  if(!forced&&options.length>2&&random()<.22)return options[1+Math.floor(random()*2)].i;return best.i}
root.Caro={N,newCaro,place,botMove};
if(typeof document==='undefined')return;  // the UI below uses the game's globals (s, F, modal, render…) only when played

// ---- UI (leisure zone) ----
let game=null,view=false,stats={played:0,wins:0},thinking=false;
try{const saved=JSON.parse(localStorage.getItem('lang-may-caro-v1')||'null');if(saved){game=saved.game||null;stats=saved.stats||stats;view=!!saved.view}}catch{}
const persist=()=>{try{localStorage.setItem('lang-may-caro-v1',JSON.stringify({game,stats,view}))}catch{}};
root.caroActive=()=>view;
function settle(){if(!game.done||game.paid)return;game.paid=true;stats.played++;if(game.winner===1)stats.wins++;const pay=game.winner===1?game.stake*2:game.winner===3?game.stake:0;s.coins+=pay;game.payout=pay;persist();save()}
function botTurn(){if(!game||game.done||game.turn!==2||thinking)return;thinking=true;setTimeout(()=>{thinking=false;if(!game||game.done||game.turn!==2)return;place(game,botMove(game),2);settle();persist();render()},420)}
function startCaro(){if(F.level(s)<50||!s.unlocked.leisure)return toast('Khu giải trí mở từ cấp 50.');if(window.farmSync?.blocked)return;
  if(game&&!game.done&&game.stake)return modal('Bắt đầu ván mới?',`<p>Ván caro đang chơi sẽ bị huỷ và bạn mất ${game.stake.toLocaleString('vi-VN')} xu đã cược.</p><button class="primary full" data-caro="force">Ván mới</button><button class="text-link full" data-action="close">Tiếp tục ván cũ</button>`,'caroConfirm');
  begin()}
function begin(){const stake=typeof cardStake==='number'&&Cards.validStake(cardStake)?cardStake:0;if(s.coins<stake)return toast('Không đủ xu cho mức cược này. Chọn mức thấp hơn hoặc Chơi vui.');
  s.coins-=stake;game={...newCaro(),stake,paid:false,payout:0};view=true;persist();save();if(modalView)close();render();if(game.turn===2)botTurn();window.farmAnalytics?.played()}
root.caroBoard=()=>{const g=game;if(!g)return `<div class="card-welcome"><span>✕ ◯</span><h3>Cờ caro</h3><p>Đánh 5 ô liền (ngang, dọc hoặc chéo) trước máy là thắng. Ai đi trước được bốc ngẫu nhiên.</p><button class="primary" data-caro="new">Bắt đầu ván caro</button></div>`;
  const you=g.first===1?'Bạn đi trước (✕)':'Máy đi trước (◯) · bạn là ✕',status=g.done?(g.winner===1?`🎉 Bạn thắng!${g.stake?' Nhận '+g.payout.toLocaleString('vi-VN')+' xu.':''}`:g.winner===2?'Máy thắng ván này.':'Hoà · hoàn lại cược.'):g.turn===1?'Tới lượt bạn · chạm một ô':'Máy đang nghĩ…';
  return `<section class="caro-wrap" aria-label="Bàn cờ caro"><div class="caro-status"><strong>${status}</strong><small>${you} · ${g.stake?'Cược '+g.stake.toLocaleString('vi-VN')+' xu':'Chơi vui'} · ${stats.wins}/${stats.played} ván thắng</small></div><div class="caro-board" style="--n:${N}">${g.board.map((v,i)=>`<button class="caro-cell ${v===1?'x':v===2?'o':''} ${g.last===i?'last':''} ${g.line.includes(i)?'win':''}" data-caro-cell="${i}" ${v||g.done||g.turn!==1?'disabled':''} aria-label="Ô ${i%N+1},${Math.floor(i/N)+1}${v===1?' · ✕':v===2?' · ◯':''}">${v===1?'✕':v===2?'◯':''}</button>`).join('')}</div><div class="caro-actions"><button class="primary" data-caro="new">${g.done?'Ván mới':'Chơi lại từ đầu'}</button><button data-caro="cards">Về bàn bài</button></div></section>`};
document.addEventListener('click',e=>{const cell=e.target.closest('[data-caro-cell]'),b=e.target.closest('[data-caro]');
  if(e.target.closest('[data-action="newCard"],[data-action="confirmNewCard"]'))view=false,persist();
  if(cell&&game&&!game.done&&game.turn===1){try{place(game,Number(cell.dataset.caroCell),1);window.farmAudio?.effect?.('tap')}catch(err){return toast(err.message)}settle();persist();render();botTurn();return}
  if(!b)return;const a=b.dataset.caro;if(a==='new')startCaro();if(a==='force')begin();if(a==='cards'){view=false;persist();render()}if(a==='open'){view=true;persist();render();botTurn()}});
if(game&&!game.done&&game.turn===2)setTimeout(botTurn,600);
})(typeof window==='undefined'?globalThis:window);
