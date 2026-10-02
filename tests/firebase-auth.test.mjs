import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { verifyFirebaseUser } from '../lib/server/firebase-auth.ts';
const {publicKey, privateKey} = await generateKeyPair('RS256');
async function request(claims = {}, options = {}) {
  const token = await new SignJWT({auth_time: Math.floor(Date.now()/1000), email:'person@example.com', email_verified:true, firebase:{sign_in_provider:'google.com'}, ...claims})
    .setProtectedHeader({alg:'RS256'}).setSubject('user-123').setIssuedAt().setIssuer(options.issuer || 'https://securetoken.google.com/astroais').setAudience('astroais').setExpirationTime('5m').sign(privateKey);
  return new Request('https://astroais.app/api/chat',{headers:{Authorization:`Bearer ${token}`}});
}
test('accepts a verified Google session', async()=>assert.deepEqual(await verifyFirebaseUser(await request(),()=>publicKey),{uid:'user-123'}));
for(const provider of ['password','anonymous','custom']) test(`rejects ${provider} sessions`, async()=>assert.rejects(()=>request({firebase:{sign_in_provider:provider}}).then(r=>verifyFirebaseUser(r,()=>publicKey))));
test('rejects unverified Google email', async()=>assert.rejects(()=>request({email_verified:false}).then(r=>verifyFirebaseUser(r,()=>publicKey))));
test('rejects missing provider claims', async()=>assert.rejects(()=>request({firebase:null}).then(r=>verifyFirebaseUser(r,()=>publicKey))));
test('rejects tokens for another Firebase project', async()=>assert.rejects(()=>request({}, {issuer:'https://securetoken.google.com/other'}).then(r=>verifyFirebaseUser(r,()=>publicKey))));
test('rejects missing bearer token', async()=>assert.rejects(()=>verifyFirebaseUser(new Request('https://astroais.app/api/chat'),()=>publicKey)));
