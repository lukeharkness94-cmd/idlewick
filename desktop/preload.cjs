const {contextBridge,ipcRenderer}=require('electron');
function request(operation,key,value){
 const result=ipcRenderer.sendSync('idlewick:storage',{operation,key,value});
 if(!result?.ok)throw Error(result?.error||'Desktop save unavailable');return result.value;
}
contextBridge.exposeInMainWorld('idlewickDesktop',{
 storage:{getItem:key=>request('getItem',key),setItem:(key,value)=>request('setItem',key,value),removeItem:key=>request('removeItem',key)},
 onBeforeClose:callback=>ipcRenderer.on('idlewick:before-close',()=>{let ok=false;try{ok=callback()!==false;}catch{}ipcRenderer.send('idlewick:close-result',ok);})
});
