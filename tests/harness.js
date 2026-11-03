const fs=require('fs'),vm=require('vm');
const root=require('path').join(__dirname,'../js/');
const store={};
const noop=()=>{};
const el=()=>({addEventListener:noop,classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},style:{},querySelector:()=>null,querySelectorAll:()=>[],appendChild:noop});
const win={localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},addEventListener:noop,matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()},innerWidth:1200,innerHeight:800,devicePixelRatio:1,setTimeout,clearTimeout,setInterval,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),unescape,escape};
win.window=win;
win.document={addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:el,body:el(),hidden:false};
const ctx=vm.createContext(Object.assign(win,{console,Math,Date,JSON,Object,Array,Number,String,Set,Map,Promise,parseInt,parseFloat,isNaN,Error,decodeURIComponent,encodeURIComponent}));
for(const f of ['util','data','data2','data3','state','audio']) vm.runInContext(fs.readFileSync(root+f+'.js','utf8'),ctx,{filename:f});
vm.runInContext(`
 DQ.notify=function(o){ (DQ.__notes=DQ.__notes||[]).push(o); }; DQ.pulse=DQ.floatAt=DQ.flash=DQ.burstAt=DQ.burstEl=DQ.toast=()=>{}; DQ.go=()=>{};
`,ctx);
vm.runInContext(fs.readFileSync(root+'engine.js','utf8'),ctx,{filename:'engine'});vm.runInContext(fs.readFileSync(root+'systems.js','utf8'),ctx,{filename:'systems'});vm.runInContext(fs.readFileSync(root+'plan.js','utf8'),ctx,{filename:'plan'});
module.exports=ctx.DQ;
