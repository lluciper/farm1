'use strict';
// crypto.randomUUID only exists on secure pages (https or localhost). Opened over plain http on the local network
// (testing on a phone), saves, friend actions and street messages would fail without it, so build a standard v4 UUID
// from crypto.getRandomValues, which works everywhere.
if(globalThis.crypto&&!crypto.randomUUID&&crypto.getRandomValues)crypto.randomUUID=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
