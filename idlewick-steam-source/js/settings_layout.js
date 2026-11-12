/* One settings navigation, composed from the original controls so all existing actions and save keys remain intact. */
(() => {
const Q=window.DQ,UI=Q.ui,{esc,ico}=Q;
const source=UI.V.settings;
const groups=[['display','Display','gear'],['audio','Audio','sound'],['gameplay','Gameplay','attack'],['saves','Saves & backups','save'],['help','Help & extras','book']];
const legacy={Interface:'display','Interface size':'display',Lettering:'display',Backdrop:'display',Audio:'audio',Gameplay:'gameplay',Time:'gameplay','Help & learning':'gameplay','Save data':'saves',Shortcuts:'help',About:'help',Playtest:'help','Art showcase':'help'};
const card=(title,body,cls='')=>`<section class="panel settings-card ${cls}"><div class="phead"><h2>${title}</h2></div><div class="stack">${body}</div></section>`;
UI.V.settings=()=>{
 const t=document.createElement('template');t.innerHTML=source();const panels=new Map(),used=new Set();
 for(const p of t.content.querySelectorAll('section.panel')){const h=p.querySelector('h2');if(h&&!panels.has(h.textContent.trim()))panels.set(h.textContent.trim(),p);}
 const get=name=>{used.add(name);return panels.get(name);};
 const take=(p,selector)=>{const n=p?.querySelector(selector);if(!n)return '';const h=n.outerHTML;n.remove();return h;};
 const body=p=>{if(!p)return '';p.querySelector(':scope>.phead')?.remove();return p.innerHTML;};
 const iface=get('Interface'),audio=get('Audio'),game=get('Gameplay'),save=get('Save data'),about=get('About');
 const themeBlock=iface?.querySelector('.seg [data-do="theme"]')?.closest('.seg')?.parentElement;
 const themeHtml=themeBlock?.outerHTML||'';themeBlock?.remove();
 const name=take(iface,'.nameedit'),dev=take(about,'[data-do="devtog"]');
 const size=body(get('Interface size'));
 const backdrop=body(get('Backdrop'));
 const display=[card('Appearance',themeHtml+`<div class="settings-field"><h3>Interface size</h3>${size}<small class="dim">Size preference applies on desktop.</small></div><div class="settings-field"><h3>Backdrop</h3>${backdrop}</div>`),card('Lettering',body(get('Lettering')),'lettering-set'),card('Notifications & accessibility',body(iface))];
 const volume=take(audio,'[data-do="set"][data-a="muted"]')+['masterVol','vol','musicVol','ambVol'].map(k=>take(audio,`label:has([data-in="${k}"])`)).join('');
 const musicLabel=audio?.querySelector('[data-do="set"][data-a="music"] b');if(musicLabel)musicLabel.textContent='Music';
 const layers=['music','ambience','sfx'].map(k=>take(audio,`[data-do="set"][data-a="${k}"]`)).join('');
 const task=audio?.querySelector('[data-do="tasksound"]')?.closest('.seg')?.parentElement;const taskHtml=task?.outerHTML||'';task?.remove();
 const filters=audio?.querySelector('[data-do="sndcat"]')?.closest('.stack.tight')?.parentElement;
 filters?.querySelector(':scope>.k')?.remove();
 if(filters)for(const b of filters.querySelectorAll('[data-do="sndcat"] b'))b.textContent=(b.textContent==='Rewards'?'Reward':b.textContent)+' sounds';
 const audioCards=[card('Volume',volume),card('Music & effects',layers+taskHtml),card('Sound filters',(filters?.outerHTML||'')+'<p class="sm dim">These filters apply while sound effects are enabled.</p>')];
 const lessons=get('Help & learning');const lessonText=lessons?.querySelector('p');if(lessonText)lessonText.textContent='Quick guides explain each skill when you first open it. Revisit them whenever you need.';
 const story=`<button class="tog ${Q.S.settings.storyScenes!==false?'on':''}" data-do="storysetting"><span class="sw"></span><span><b>Automatic story scenes</b><small>Major events offer skippable scenes. Replay them in Home → Journal.</small></span></button>`;
 const gameCards=[card('Combat & offline progress',body(game)),card('Your hero',name),card('Story & learning',story+body(lessons)),card('Play time',body(get('Time')))];
 const danger=take(save,'[data-do="newgame"]'),backupList=save?.querySelector('.bklist')?.parentElement;
 const backupHtml=backupList?.outerHTML||'<p class="dim">No automatic backups yet. Your recent backups on this device will appear here.</p>';backupList?.remove();
 const autosave=save?.querySelector('.phead small')?.textContent||'';
 const saveCards=[card('Backup & transfer',`<p class="sm dim">${esc(autosave)}</p>`+body(save)),card('Automatic backups',backupHtml),card('Start over','<p>Make a backup before starting a new hero.</p>'+danger,'settings-danger')];
 const shortcuts=get('Shortcuts');shortcuts?.querySelector('.keys')?.insertAdjacentHTML('beforeend','<dt><kbd>L</kbd></dt><dd>Switch light/dark theme</dd>');
 const tools=card('Testing & artwork',body(get('Playtest'))+body(get('Art showcase'))+dev);
 const helpCards=[card('Keyboard shortcuts',body(shortcuts)),card('About Idlewick',body(about)),tools];
 for(const[name,p]of panels)if(!used.has(name))helpCards.push(card(esc(name),body(p)));
 const content={display,audio:audioCards,gameplay:gameCards,saves:saveCards,help:helpCards};
 const old=UI.tab.settingsPanel,selected=groups.some(g=>g[0]===old)?old:Object.prototype.hasOwnProperty.call(legacy,old)?legacy[old]:'display';UI.tab.settingsPanel=selected;
 return `<section class="panel settings-navigation"><h1>Settings</h1><nav aria-label="Settings categories">${groups.map(([id,label,ic])=>`<button class="btn ${selected===id?'on':''}" data-do="settingsgroup" data-a="${id}" aria-pressed="${selected===id}">${ico(ic)}${esc(label)}</button>`).join('')}</nav></section><div class="settings-workspace" data-settings-group="${selected}">${content[selected].join('')}</div>`;
};
/* The old after-hook made one tab per contributed panel; this renderer already supplies the grouped navigation. */
UI.after.settings=()=>{};
const render0=UI.render;UI.render=(...args)=>{const r=render0(...args);if(UI.view==='settings'){const nav=document.getElementById('subnav');if(nav?.querySelectorAll('.stab').length===1&&nav.querySelector('[data-a="settings"]'))nav.innerHTML='';}return r;};
UI.DO.settingsgroup=id=>{if(groups.some(g=>g[0]===id)){UI.tab.settingsPanel=id;UI.render(false);document.querySelector('.settings-navigation [data-a="'+id+'"]')?.focus({preventScroll:true});}};
})();
