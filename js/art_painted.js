/* Painted natural-history fish atlas. Keep unrelated art on its existing renderer. */
(() => {
  const Q=window.DQ,base=Q.artImage;
  const atlas='assets/painted/fish-atlas.png';
  const trees='assets/painted/tree-atlas.png';
  const treeIds=['normal','oak','willow','maple','yew','magic','birch','elder','gloomwood'];
  const ids=['shrimp','sardine','herring','trout','salmon','tuna','lobster','swordfish','monkfish','shark','anglerfish','carp','pike','skyfin','voideel'];
  Q.artImage=(kind,id,size=96,cls='',alt='')=>{
    const fish=kind==='fish'?id:kind==='item'&&id.startsWith('raw_')?id.slice(4):null;
    const isTree=kind==='wood';
    const index=isTree?treeIds.indexOf(id):ids.indexOf(fish),cols=isTree?3:5;
    if(index<0)return base(kind,id,size,cls,alt);
    return `<span class="painted-sprite ${cls}" role="img" aria-label="${Q.esc(alt||Q.data.NODE[fish]?.name||fish)}" style="width:${size}px;height:${size}px;background-image:url('${isTree?trees:atlas}');background-size:${cols*100}% 300%;background-position:${index%cols*100/(cols-1)}% ${Math.floor(index/cols)*50}%"></span>`;
  };
})();
