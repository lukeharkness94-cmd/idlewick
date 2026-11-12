const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {SaveStore}=require('../desktop/save-store.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'idlewick-save-test-'));
const key='dashboard-quest-save-v2',backup='dashboard-quest-backups';
const hero=JSON.stringify({v:2,xp:{fishing:83},name:'Test hero — 星',lastSeen:123});
try{
 const windows=new SaveStore(path.join(root,'WindowsAppData'),'76561198000000001');
 const mac=new SaveStore(path.join(root,'MacApplicationSupport'),'76561198000000001');
 assert.equal(windows.getItem(key),null);windows.setItem(key,hero);assert.equal(windows.getItem(key),hero);
 assert.equal(path.basename(windows.file(key)),'hero.json');
 windows.setItem(backup,JSON.stringify([{data:hero,reason:'test'}]));
 assert.ok(windows.getItem(backup).includes('Test hero'));
 // Simulate Steam Auto-Cloud transferring the same named UTF-8 files between OS roots.
 fs.cpSync(windows.directory,mac.directory,{recursive:true});assert.equal(mac.getItem(key),hero);
 const other=new SaveStore(path.join(root,'WindowsAppData'),'76561198000000002');assert.equal(other.getItem(key),null);
 const local=new SaveStore(path.join(root,'WindowsAppData'),'local');assert.equal(local.getItem(key),null);
 assert.throws(()=>new SaveStore(root,'../other'));assert.throws(()=>windows.getItem('../credentials'));
 assert.throws(()=>windows.setItem(key,'{"bad":true}'));assert.equal(windows.getItem(key),hero);
 assert.throws(()=>windows.setItem(backup,'{}'));
 const rename=fs.renameSync;try{fs.renameSync=()=>{throw Error('disk unavailable');};assert.throws(()=>windows.setItem(key,JSON.stringify({v:2,xp:{},name:'Rejected'})));}finally{fs.renameSync=rename;}
 assert.equal(windows.getItem(key),hero);assert.ok(fs.readdirSync(windows.directory).every(name=>!name.endsWith('.tmp')));
 fs.writeFileSync(windows.file(key),'broken JSON');assert.equal(windows.getItem(key),'broken JSON','damaged originals remain available for recovery');
 mac.removeItem(key);assert.equal(mac.getItem(key),null);mac.removeItem(key);
 console.log('PASS desktop saves: atomic writes, failure preservation, Unicode cross-platform transfer, profile isolation, backups and restricted keys.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
