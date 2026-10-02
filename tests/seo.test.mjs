import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://localhost:5183';
const canonicalOrigin='https://astroais.app';
const paths=['/','/birth-chart','/astrology-chat','/daily-advice'];
const titles=new Set();
for(const path of paths){
 const response=await fetch(origin+path);assert.equal(response.status,200,path);const html=await response.text();
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title,path+' title');assert.ok(!titles.has(title),'unique titles');titles.add(title);
 const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]; assert.equal(canonical?.replace(/\/$/,''),(`${canonicalOrigin}${path}`).replace(/\/$/,''),path+' canonical');
 assert.match(html,/<meta name="description" content="[^"]+"/);assert.match(html,/property="og:title"/);assert.match(html,/name="twitter:card" content="summary_large_image"/);
 assert.equal([...html.matchAll(/<h1\b/g)].length,1,path+' has one main heading');
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match=>JSON.parse(match[1]));assert.ok(schemas.some(schema=>schema['@graph']?.some(item=>item['@type']==='WebApplication')));
 assert.ok(!html.includes('noindex'),path+' indexable');
 if(path==='/')for(const link of paths.slice(1))assert.ok(html.includes(`href="${link}"`),'homepage link '+link);
}
const robots=await fetch(origin+'/robots.txt');assert.equal(robots.status,200);const rules=await robots.text();assert.match(rules,/Allow: \//);assert.match(rules,/Disallow: \/api\//);assert.ok(rules.includes(canonicalOrigin+'/sitemap.xml'));
const sitemap=await fetch(origin+'/sitemap.xml');assert.equal(sitemap.status,200);const xml=await sitemap.text();for(const path of paths)assert.ok(xml.includes(`<loc>${canonicalOrigin}${path}</loc>`));
const image=await fetch(origin+'/opengraph-image');assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/png/);const png=Buffer.from(await image.arrayBuffer());assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
const verification=await fetch(origin+'/google6ec898df0120f792.html',{redirect:'manual'});assert.equal(verification.status,200);assert.equal(await verification.text(),'google-site-verification: google6ec898df0120f792.html');
console.log('SEO checks passed: 4 public pages, metadata, schema, links, robots, sitemap, social image and ownership file.');
