const fs=require('node:fs');
const path=require('node:path');
module.exports=()=>{
 const {appId}=require('./steam-config.json');
 if(!Number.isSafeInteger(appId)||appId<=0||appId===480)throw Error('A release requires your own Steam App ID in desktop/steam-config.json.');
 if(!fs.existsSync(path.join(__dirname,'..','Play Idlewick.html')))throw Error('Rebuild the standalone game before packaging.');
};
