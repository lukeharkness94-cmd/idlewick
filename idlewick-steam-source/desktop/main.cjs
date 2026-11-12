const {app,BrowserWindow,ipcMain,dialog}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {SaveStore}=require('./save-store.cjs');
const config=require('./steam-config.json');
app.setName('Idlewick');
let steam,client,window,store,closing=false,awaitingClose=false,closeTimer;
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
 const useSteam=app.isPackaged||process.argv.includes('--steam');
 if(useSteam){
  try{
   if(!Number.isSafeInteger(config.appId)||config.appId<=0)throw Error('Configure the Idlewick Steam App ID before starting a Steam build.');
   steam=require('steamworks.js');
   if(steam.restartAppIfNecessary(config.appId)){app.quit();return;}
   client=steam.init(config.appId);
   // Do not install the SDK helper's 60 Hz repaint interval: Chromium owns presentation.
   steam.electronEnableSteamOverlay(true);
  }catch(error){dialog.showErrorBox('Steam could not start Idlewick',error.message);app.quit();return;}
 }
 app.whenReady().then(()=>{
  try{
   const profile=client?String(client.localplayer.getSteamId().steamId64):'local';
   store=new SaveStore(app.getPath('appData'),profile);
  }catch(error){dialog.showErrorBox('Saves could not be opened',error.message);app.quit();return;}
  ipcMain.on('idlewick:storage',(event,message)=>{
   try{
    if(event.sender!==window?.webContents||!['getItem','setItem','removeItem'].includes(message?.operation))throw Error('Invalid save request');
    const value=store[message.operation](message.key,message.value);event.returnValue={ok:true,value};
   }catch(error){event.returnValue={ok:false,error:error.message};}
  });
  window=new BrowserWindow({width:1440,height:1000,minWidth:800,minHeight:600,backgroundColor:'#0d1215',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false}});
  const game=app.isPackaged?path.join(process.resourcesPath,'game','Play Idlewick.html'):path.join(__dirname,'..','Play Idlewick.html');
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(url.split('#')[0]!==pathToFileURL(game).href)event.preventDefault();});
  window.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  window.loadFile(game);
  function confirmClose(){
   clearTimeout(closeTimer);awaitingClose=false;
   const result=dialog.showMessageBoxSync(window,{type:'warning',message:'Your latest progress could not be saved.',detail:'Keep playing to export a backup, or close using your last successful save.',buttons:['Keep playing','Close without saving'],defaultId:0,cancelId:0});
   if(result===1){closing=true;window.close();}
  }
  window.on('close',event=>{
   if(closing)return;event.preventDefault();if(awaitingClose)return;awaitingClose=true;
   window.webContents.send('idlewick:before-close');closeTimer=setTimeout(confirmClose,5000);
  });
  ipcMain.on('idlewick:close-result',(event,ok)=>{
   if(event.sender!==window?.webContents||!awaitingClose)return;
   clearTimeout(closeTimer);awaitingClose=false;
   if(ok){closing=true;window.close();}else confirmClose();
  });
  app.on('window-all-closed',()=>app.quit());
 });
}
