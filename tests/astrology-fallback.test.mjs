import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateChart } from '../lib/server/chart.ts';
import { astrologyFallback } from '../lib/server/astrology-fallback.ts';
import { chatHandler } from '../lib/server/chat.ts';
import { chatLanguages } from '../lib/languages.ts';
const now=Date.parse('2026-10-03T10:00:00Z');
const profile={firstName:'Test',birth:'1997-03-05',birthTime:'12:30',birthplace:{name:'Jaipur',country:'India',latitude:26.9124,longitude:75.7873}};
const chart=calculateChart(profile,new Date(now));
function question(content){return [{role:'user',content}];}
let sequence=0;
function request(message='When will I get a job?', options={}){return new Request('https://astroais.app/api/chat',{method:'POST',headers:{origin:'https://astroais.app','content-type':'application/json','cf-connecting-ip':`fallback-test-${sequence++}`,...options.headers},body:JSON.stringify({profile,messages:question(message),...options.body})});}
for(const status of [401,402,429,500]) test(`provider HTTP ${status} returns a calculated response, not a service error`,async()=>{
  const handler=chatHandler({key:'test-key',secret:'test-secret',now:()=>now,paidAccess:async()=>null,fetcher:async()=>new Response('{}',{status,headers:status===429?{'x-ratelimit-limit':'50'}:{}})});
  const response=await handler(request());const body=await response.json();
  assert.equal(response.status,200);assert.equal(body.source,'astrology-engine');assert.match(body.reply,/birth chart/);assert.ok(!body.error);assert.equal(body.expiresAt,now+120000);assert.match(response.headers.get('set-cookie'),/astrois_chat_trial=/);
});
test('network failure across all models falls back',async()=>{let calls=0;const handler=chatHandler({key:'test',secret:'secret',now:()=>now,paidAccess:async()=>null,fetcher:async()=>{calls++;throw Error('network');}});const response=await handler(request());assert.equal((await response.json()).source,'astrology-engine');assert.equal(calls,3);});
test('working AI response is preserved',async()=>{const handler=chatHandler({key:'test',secret:'secret',now:()=>now,paidAccess:async()=>null,fetcher:async()=>Response.json({choices:[{message:{content:'A useful AI answer'},finish_reason:'stop'}]})});const body=await(await handler(request())).json();assert.equal(body.reply,'A useful AI answer');assert.equal(body.source,'ai');});
test('content refusal is not replaced with a fallback',async()=>{const handler=chatHandler({key:'test',secret:'secret',now:()=>now,paidAccess:async()=>null,fetcher:async()=>Response.json({choices:[{message:{refusal:'No'},finish_reason:'content_filter'}]})});const body=await(await handler(request())).json();assert.equal(body.source,'ai');assert.match(body.reply,/safely/);});
test('missing AI key uses local engine without contacting API',async()=>{const handler=chatHandler({key:'',secret:'secret',now:()=>now,paidAccess:async()=>null,fetcher:async()=>{throw Error('should not call');}});assert.equal((await(await handler(request())).json()).source,'astrology-engine');});
test('expired trials remain expired during an API outage',async()=>{
 const handler=chatHandler({key:'',secret:'secret',now:()=>now,paidAccess:async()=>null});const first=await handler(request());const cookie=first.headers.get('set-cookie').split(';')[0];
 const later=chatHandler({key:'',secret:'secret',now:()=>now+120001,paidAccess:async()=>null});assert.equal((await later(request('job',{headers:{cookie}}))).status,402);
});
test('paid expiry is preserved in local mode',async()=>{const expiry=now+86400000;const handler=chatHandler({key:'',secret:'secret',now:()=>now,paidAccess:async()=>({expiresAt:expiry})});const response=await handler(request());assert.equal((await response.json()).expiresAt,expiry);assert.equal(response.headers.get('set-cookie'),null);});
test('invalid profile is not replaced with a fabricated chart',async()=>{const handler=chatHandler({key:'',secret:'secret',now:()=>now,paidAccess:async()=>null});assert.equal((await handler(request('job',{body:{profile:{...profile,birth:'2099-01-01'}}}))).status,400);});
test('different birth details produce different calculated readings',()=>{const other=calculateChart({...profile,birth:'2001-09-15',birthTime:'04:20'},new Date(now));const first=astrologyFallback(chart,question('Help me with my career'));const second=astrologyFallback(other,question('Help me with my career'));assert.notEqual(first,second);for(const p of [chart,other])assert.ok(astrologyFallback(p,question('job')).includes(p.natal.find(x=>x.body==='Mercury').degree.toFixed(2)));});
test('timing answers only use relevant supplied windows',()=>{const context={...chart,timing:{...chart.timing,windows:[{topic:'career',start:'2027-03-01',end:'2027-04-04',factors:['Jupiter trine natal Mercury (orb 1.0°)']},{topic:'relationships',start:'2027-08-01',end:'2027-08-07',factors:['Saturn trine natal Venus (orb 1.0°)']}]}};const answer=astrologyFallback(context,question('When will I get a job?'));assert.match(answer,/March 2027 – April 2027/);assert.doesNotMatch(answer,/August/);assert.match(answer,/not dates.*guaranteed/);});
test('no window does not invent an event date',()=>{const context={...chart,timing:{...chart.timing,windows:[]}};assert.match(astrologyFallback(context,question('When will I marry?')),/does not identify a clear timing window/);});
test('all selectable languages have a local response',()=>{for(const {code} of chatLanguages){const answer=astrologyFallback(chart,question('When will I get a job?'),code);assert.ok(answer.length>80,code);assert.ok(answer.includes('Mercury'),code);}});
test('Hindi questions automatically receive Hindi guidance',()=>assert.match(astrologyFallback(chart,question('मुझे नौकरी कब मिलेगी?')),/गणना/));
test('daily mode includes fresh calculated factors and local date metadata',async()=>{const handler=chatHandler({key:'',secret:'secret',now:()=>now,paidAccess:async()=>null});const response=await handler(request('Guidance for today',{body:{mode:'daily'}}));const body=await response.json();assert.equal(body.readingDate,'2026-10-03');assert.equal(body.timezone,'Asia/Kolkata');assert.match(body.reply,/Today’s calculated chart factor/);});
test('urgent self-harm gets support rather than a prediction',()=>{const answer=astrologyFallback(chart,question('I want to kill myself'));assert.match(answer,/local emergency number/);assert.doesNotMatch(answer,/Your birth chart has/);});
