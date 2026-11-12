/* The exact same UTF-8 game schema and filenames are used on both platforms. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const FILES=Object.freeze({'dashboard-quest-save-v2':'hero.json','dashboard-quest-backups':'backups.json'});
const MAX_BYTES=16*1024*1024;
class SaveStore {
 constructor(appData,profile){
  if(profile!=='local'&&!/^\d{17}$/.test(profile))throw Error('Invalid Steam save profile');
  this.directory=path.join(appData,'Idlewick','saves',profile);
  fs.mkdirSync(this.directory,{recursive:true,mode:0o700});
 }
 file(key){if(!Object.hasOwn(FILES,key))throw Error('Unknown save key');return path.join(this.directory,FILES[key]);}
 getItem(key){
  const file=this.file(key);
  try{if(fs.statSync(file).size>MAX_BYTES)throw Error('Save is too large');return fs.readFileSync(file,'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
 }
 setItem(key,value){
  const file=this.file(key);if(typeof value!=='string'||Buffer.byteLength(value,'utf8')>MAX_BYTES)throw Error('Invalid save size');
  const data=JSON.parse(value);
  if(key==='dashboard-quest-save-v2'&&(!data||data.v!==2||!data.xp||typeof data.xp!=='object'||Array.isArray(data.xp)))throw Error('Invalid hero save');
  if(key==='dashboard-quest-backups'&&!Array.isArray(data))throw Error('Invalid backup list');
  const temporary=file+'.'+crypto.randomUUID()+'.tmp';let fd;
  try{
   fd=fs.openSync(temporary,'wx',0o600);fs.writeFileSync(fd,value,'utf8');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
   fs.renameSync(temporary,file);
  }finally{if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(temporary);}catch(e){if(e.code!=='ENOENT')throw e;}}
 }
 removeItem(key){try{fs.unlinkSync(this.file(key));}catch(e){if(e.code!=='ENOENT')throw e;}}
}
module.exports={SaveStore,FILES};
