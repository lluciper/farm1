const fs=require('fs'),vm=require('vm'),a=require('assert/strict'),ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/cards.js','utf8'),ctx);const C=ctx.Cards;
const card=(r,s=0)=>(r-3)*4+s;
a.equal(C.gameCombo([card(5,0),card(5,2)],'bac'),null);a(C.gameCombo([card(5,0),card(5,1)],'bac'));a.equal(C.gameCombo([card(3,0),card(4,1),card(5,0)],'bac'),null);a(C.gameCombo([card(3),card(4),card(5)],'bac'));
a(!C.gameBeats(C.gameCombo([card(7,1)],'bac'),C.gameCombo([card(6,0)],'bac'),'bac'));a(C.gameBeats(C.gameCombo([card(7,0)],'bac'),C.gameCombo([card(6,0)],'bac'),'bac'));
a(!C.gameBeats(C.gameCombo([card(7,3)],'sam'),C.gameCombo([card(7,0)],'sam'),'sam'));a(C.gameBeats(C.gameCombo([card(8,0)],'sam'),C.gameCombo([card(7,3)],'sam'),'sam'));
a.equal(C.gameCombo([card(3,0),card(3,1),card(4,0),card(4,1),card(5,0),card(5,1)],'sam'),null);
for(const kind of ['bac','sam'])for(let round=0;round<30;round++){let g=C.newGame(kind,true,Math.random,round%2?2:4);a(g.hands.every(h=>h.length===(kind==='sam'?10:13)));let steps=0;while(!g.done&&steps++<600){let i=g.turn,choice=C.choose(g,i);if(choice){a(C.legal(g,i,choice));C.tienMove(g,i,choice)}else C.tienPass(g,i);C.validateGame(JSON.parse(JSON.stringify(g)));}a(g.done,kind+' complete round');a.equal(g.winners.length,1);}
for(const n of [5000,5001,12500,200000])a(C.validStake(n));for(const n of [4999,200001,5.5,NaN,Infinity,-5000])a(!C.validStake(n));console.log('PASS: North matching suits/colors, Sam rank-only, 60 completed variant rounds, snapshot validation and wager boundaries.');
