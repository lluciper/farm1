const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('public/cards.js','utf8'),ctx);const C=ctx.Cards;
// The dealer (10 cards, discards first) is drawn at random: every seat deals about a quarter of the hands.
const seen=[0,0,0,0];for(let i=0;i<2000;i++){const g=C.newGame('phom',true);seen[g.dealer]++;assert.equal(g.hands[g.dealer].length,10);assert.ok(g.hands.every((h,s)=>s===g.dealer||h.length===9));assert.equal(g.turn,g.dealer,'the dealer discards first');assert.equal(new Set(g.hands.flat().concat(g.stock)).size,52,'one full deck')}
assert.ok(seen.every(n=>n>400&&n<600),'dealer spread '+seen.join('/'));
// Against the computer, a computer dealer plays its opening before your turn; in a friends' room nobody plays for you.
const until=(manual,want)=>{for(let i=0;i<500;i++){const g=C.newGame('phom',manual);if(g.dealer===want)return g}throw Error('no dealer '+want)};
const bot=until(false,3);assert.ok(bot.done||bot.turn===0,'computer seats played up to you');assert.ok(bot.done||bot.phase==='draw','your turn starts with a draw');
const room=until(true,3);assert.equal(room.turn,3,'room waits for the dealer');assert.equal(room.phase,'discard');
const you=until(false,0);assert.equal(you.turn,0);assert.equal(you.phase,'discard');
console.log('PASS: phỏm — random dealer ('+seen.join('/')+'), dealer has 10 cards and discards first, bots open for a bot dealer, rooms wait for the dealer');
