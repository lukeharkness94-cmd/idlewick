/* Pack independent cards without letting one tall card hold the next row down. */
(() => {
  const UI = window.DQ.ui;
  let observer, frame;
  const arrange = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const grid = document.querySelector('.combat-dashboard');
      if (!grid) return;
      /* Two stable columns instead of height-based packing: the fight (live) on the left, everything else stacked in
         reading order on the right. Cards no longer jump between positions when the window is resized or zoomed. */
      if (!grid.querySelector('.combat-side')) {
        const side = document.createElement('div'); side.className = 'combat-side';
        for (const card of [...grid.children]) if (!card.classList.contains('combat-live')) side.append(card);
        grid.append(side);
      }
      for (const card of grid.querySelectorAll(':scope > *')) card.style.gridRowEnd = '';
    });
  };
  /* Keep related status with its action, independent of the choice list height. */
  const organize = () => {
    const view=document.getElementById('view');if(!view)return;
    const workspace=view.querySelector(':scope > .activity-workspace, :scope > .farm-workspace');
    if(workspace && !workspace.querySelector('.workspace-focus')){
      const stage=workspace.querySelector(':scope > .activity-stage, :scope > .farm-task');
      const choices=workspace.querySelector(':scope > .activity-choices, :scope > .farm-animals');
      if(stage && choices){
        const focus=document.createElement('div'),options=document.createElement('div');
        focus.className='workspace-focus';options.className='workspace-options';
        workspace.prepend(focus);workspace.append(options);
        const progress=view.querySelector(':scope > [id$="-progress"]');
        if(progress){const card=progress.querySelector('.skillhero');if(card){card.id=progress.id;focus.append(card);progress.remove();}}
        focus.append(stage);options.append(choices);
        const panels=[...view.querySelectorAll(':scope > .reference-panel, :scope > .guidep')];
        if(panels.length){const references=document.createElement('div');references.className='workspace-references';options.append(references);references.append(...panels);}
      }
    }else if(!workspace){
      const progress=view.querySelector(':scope > [id$="-progress"]');
      if(progress){
        const card=progress.querySelector('.skillhero');
        if(card){
          card.id=progress.id;
          const support=document.createElement('div'),focus=document.createElement('div'),options=document.createElement('div');
          support.className='activity-workspace support-workspace';focus.className='workspace-focus';options.className='workspace-options';
          view.insertBefore(support,view.querySelector(':scope > .panel')||progress);support.append(focus,options);focus.append(card);progress.remove();
          for(const panel of [...view.querySelectorAll(':scope > .panel:not(.page-notice)')])options.append(panel);
        }
      }
    }
  };
  const render = UI.render;
  UI.render = fresh => {
    observer?.disconnect();
    render(fresh);
    organize();
    const grid = document.querySelector('.combat-dashboard');
    if (grid) {
      observer ||= new ResizeObserver(arrange);
      observer.observe(grid);
      for (const card of grid.children) observer.observe(card);
      arrange();
    }
  };
  const rail=document.getElementById('rail');
  const reserveNavigation=()=>{if(!rail)return;const fixed=getComputedStyle(rail).position==='fixed';document.documentElement.style.setProperty('--bottom-navigation-space',fixed?Math.ceil(rail.getBoundingClientRect().height)+24+'px':'24px');};
  if(rail){new ResizeObserver(reserveNavigation).observe(rail);reserveNavigation();}
  addEventListener('resize',()=>{arrange();reserveNavigation();});
})();
