/* Music (21 Nov 2026, owner: "something different for combat and each region"): every region has its own theme, fights
   and boss fights switch to their own, themes differ in tempo/key/mode/instrument, and levels stay sane. */
const{chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'],headless:true});try{
const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#cr-go').click();await p.waitForTimeout(900);
const data=await p.evaluate(()=>{const M=DQ.data.MUSIC,towns=DQ.data.TOWNS.map(t=>t.id);return {missing:towns.filter(t=>!M[t]),sigs:towns.map(t=>[M[t].bpm,M[t].root,M[t].mode,M[t].lead,M[t].steps,M[t].acc].join('|')),has:['title','combat','boss'].filter(k=>M[k])};});
assert.deepEqual(data.missing,[],'every region has a theme');assert.equal(new Set(data.sigs).size,data.sigs.length,'no two regions share a theme signature');assert.deepEqual(data.has,['title','combat','boss']);
await p.evaluate(()=>{const s=DQ.S.settings;s.music=true;s.musicVol=1;s.ambience=false;DQ.paused=true;DQ.musicStart();});
const seen=[];
for(const t of ['willowbrook','saltmere','hollow']){await p.evaluate(t=>{DQ.act=null;DQ.S.town=t;},t);await p.waitForTimeout(500);seen.push(await p.evaluate(()=>DQ.musicNow()));}
assert.deepEqual(seen.map(s=>s.theme),['willowbrook','saltmere','hollow'],'follows the region');
await p.evaluate(()=>{DQ.S.town='saltmere';DQ.act={kind:'fight',id:'bandit'};DQ.fight={id:'bandit'};});await p.waitForTimeout(500);const f=await p.evaluate(()=>DQ.musicNow());
assert.equal(f.theme,'combat');assert.equal(f.root,57,'combat in the region key');assert.ok(f.bpm>seen[1].bpm,'combat is faster than its region (lo-fi tempos, 26 Nov)');
await p.evaluate(()=>{DQ.act={kind:'fight',id:'grubnash'};DQ.fight={id:'grubnash'};});await p.waitForTimeout(500);assert.equal((await p.evaluate(()=>DQ.musicNow())).theme,'boss');
assert.equal(await p.evaluate(()=>DQ.audioState().music),'boss');
await p.evaluate(()=>{DQ.act=null;DQ.fight=null;});await p.waitForTimeout(1500);
const lv=await p.evaluate(async()=>{let pk=0,rs=0;for(let i=0;i<20;i++){const l=DQ.musicLevel();pk=Math.max(pk,l.peak);rs+=l.rms;await new Promise(r=>setTimeout(r,100));}return {pk,rms:rs/20};});
assert.ok(lv.rms>.01&&lv.pk<.9,'audible and unclipped '+JSON.stringify(lv));
/* switching music off stops the sequencer */
await p.evaluate(()=>{DQ.S.settings.music=false;DQ.musicRefresh();});assert.equal((await p.evaluate(()=>DQ.musicNow())).running,false);
assert.deepEqual(errors,[]);console.log('PASS music: a theme per region, combat and boss themes in the region key, sane levels, stops when off');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
