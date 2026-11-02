const { chromium } = require('playwright'); const fs=require('fs');
const theme=process.argv[2]||'light';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(900);
  await p.evaluate(t=>{ DQ.S.settings.notify=false; DQ.setTheme(t); const X=DQ.data.XPF; Object.keys(DQ.data.SK).forEach(k=>{DQ.S.unlocked[k]=true; DQ.S.xp[k]=Math.max(DQ.S.xp[k]||0,X[22]);}); DQ.S.coins=50000; DQ.S.house.owned=true; DQ.S.house.rooms={parlour:true}; DQ.S.farm.plots[0]={crop:'potato',at:0,dur:1e9}; DQ.startAct('fish','shrimp',{quiet:true}); ['iron_sword','bronze_helm','log_normal','ore_copper','tool_hoe_2'].forEach(i=>DQ.S.inv[i]=3); DQ.startQuest('miners_pick'); },theme);
  const pages=['overview','fishing','mining','farming','cooking','magic','combat','bestiary','map','quests','shop','character','bank','house','hirelings','mastery','achievements','settings'];
  const agg={};
  for (const v of pages) { await p.evaluate(v=>DQ.go(v), v); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(450);
    const r = await p.evaluate(()=>{
      const parse=c=>{ const cs=c.match(/color\(srgb ([^)]+)\)/); if(cs){ const a=cs[1].split(/[ \/]+/).map(Number); return {r:a[0]*255,g:a[1]*255,b:a[2]*255,a:a.length>3?a[3]:1}; } const m=c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const a=m[1].split(/[ ,\/]+/).map(Number); return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}; };
      const lum=({r,g,b})=>{ const f=v=>{v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
      const over=(f,b)=>({r:f.r*f.a+b.r*(1-f.a),g:f.g*f.a+b.g*(1-f.a),b:f.b*f.a+b.b*(1-f.a),a:1});
      const bgOf=el=>{ let stack=[]; for(let e=el;e;e=e.parentElement){ const cs=getComputedStyle(e); let c=parse(cs.backgroundColor); const gi=cs.backgroundImage; if(gi&&gi!=='none'){ const m=gi.match(/rgba?\([^)]+\)/g); if(m){ const cols=m.map(parse).filter(Boolean); if(cols.length){ const avg={r:0,g:0,b:0,a:0}; cols.forEach(q=>{avg.r+=q.r;avg.g+=q.g;avg.b+=q.b;avg.a+=q.a}); const n=cols.length; c={r:avg.r/n,g:avg.g/n,b:avg.b/n,a:avg.a/n}; } } } if(c&&c.a>0) { stack.push(c); if(c.a>=.99) break; } }
        let base={r:239,g:232,b:214,a:1}; const bodyBg=parse(getComputedStyle(document.body).backgroundColor); if(bodyBg&&bodyBg.a>0) base=bodyBg; for(let i=stack.length-1;i>=0;i--) base=over(stack[i],base); return base; };
      const res=[]; const w=document.createTreeWalker(document.querySelector('#app'),NodeFilter.SHOW_TEXT); let n;
      while(n=w.nextNode()){ const t=n.textContent.trim(); if(!t) continue; const el=n.parentElement; const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||!el.offsetParent&&cs.position!=='fixed') continue; if(el.closest('[hidden],.locked,[disabled]')) continue;
        const fg=parse(cs.color); if(!fg) continue; const bg=bgOf(el); const f=over(fg,bg); const L1=lum(f), L2=lum(bg); const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05); const px=parseFloat(cs.fontSize), bold=+cs.fontWeight>=700; const need=(px>=24||(px>=18.66&&bold))?3:4.5;
        if(ratio<need) res.push([ratio.toFixed(2), (el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:el.tagName.toLowerCase())+(el.parentElement&&el.parentElement.className&&typeof el.parentElement.className==='string'?' < .'+el.parentElement.className.split(' ')[0]:''), t.slice(0,24), cs.color]); }
      return res; });
    r.forEach(([ratio,sel,t,col])=>{ const k=sel+' '+col; agg[k]=agg[k]||{n:0,min:99,ex:t,pages:new Set()}; agg[k].n++; agg[k].min=Math.min(agg[k].min,+ratio); agg[k].pages.add(v); });
  }
  const rows=Object.entries(agg).sort((a,b)=>b[1].n-a[1].n);
  console.log(theme,'failing groups:',rows.length,'total text nodes:',rows.reduce((s,[,v])=>s+v.n,0));
  rows.slice(0,45).forEach(([k,v])=>console.log(String(v.n).padStart(4),String(v.min).padStart(5),k.padEnd(52),'"'+v.ex+'"',[...v.pages].slice(0,3).join(',')));
  await b.close();
})();
