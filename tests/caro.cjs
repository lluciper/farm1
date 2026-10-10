const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/caro.js','utf8'),ctx);const C=ctx.Caro,N=C.N;
const at=(x,y)=>y*N+x,play=(g,moves)=>{for(const [x,y,w] of moves){g.turn=w;C.place(g,at(x,y),w)}return g};
// five in a row wins in every direction, and the winning line is reported
for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){const g=C.newCaro(1);play(g,Array.from({length:5},(_,i)=>[5+dx*i,5+dy*i,1]));assert.equal(g.done,true);assert.equal(g.winner,1);assert.equal(g.line.length,5)}
const four=play(C.newCaro(1),[[0,0,1],[1,0,1],[2,0,1],[3,0,1]]);assert.equal(four.done,false,'four is not a win');
// illegal moves are refused
const g=C.newCaro(1);C.place(g,at(7,7),1);assert.throws(()=>C.place(g,at(7,7),2),/không đánh được/);assert.throws(()=>C.place(g,at(0,0),1),/Chưa tới lượt/);assert.throws(()=>C.place(g,-1,2),/không đánh được/);assert.throws(()=>C.place(g,N*N,2),/không đánh được/);assert.throws(()=>C.place(g,1.5,2),/không đánh được/);
// the computer takes a win and blocks yours
const win=play(C.newCaro(2),[[3,3,2],[4,3,2],[5,3,2],[6,3,2],[0,10,1],[1,10,1]]);win.turn=2;assert.ok([at(2,3),at(7,3)].includes(C.botMove(win)),'completes its five');
const block=play(C.newCaro(2),[[3,3,1],[4,3,1],[5,3,1],[6,3,1],[10,10,2]]);block.turn=2;assert.ok([at(2,3),at(7,3)].includes(C.botMove(block)),'blocks your four');
const open3=play(C.newCaro(2),[[5,5,1],[6,5,1],[7,5,1],[0,14,2]]);open3.turn=2;for(let i=0;i<30;i++)assert.ok([at(4,5),at(8,5),at(3,5),at(9,5)].includes(C.botMove(open3,2,()=>.99)),'answers an open three');
// who starts is random; the computer is beatable: against a careful player it loses some games, against a random one it wins
const firsts=new Set(Array.from({length:40},()=>C.newCaro().first));assert.deepEqual([...firsts].sort(),[1,2]);
const match=(p1)=>{const g=C.newCaro();while(!g.done){g.turn===2?C.place(g,C.botMove(g,2),2):C.place(g,p1(g),1)}return g.winner};
const rand=g=>{let i;do i=Math.floor(Math.random()*N*N);while(g.board[i]);return i};
const careful=g=>{const t={...g,board:g.board.map(v=>v===1?2:v===2?1:0)};return C.botMove(t,2)};
let botVsRandom=0,carefulWins=0;for(let i=0;i<60;i++){if(match(rand)===2)botVsRandom++;if(match(careful)===1)carefulWins++}
assert.ok(botVsRandom>=55,'beats random play ('+botVsRandom+'/60)');assert.ok(carefulWins>=6,'a careful player wins sometimes ('+carefulWins+'/60)');
console.log('PASS: caro — wins in 4 directions, illegal moves refused, computer takes wins and blocks, random first move; computer beats random play '+botVsRandom+'/60, careful player wins '+carefulWins+'/60');
