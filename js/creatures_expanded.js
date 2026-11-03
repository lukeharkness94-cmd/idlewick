/* Additional regional creatures. Each has its own 48px design recipe and anatomy. */
(() => {
const D=window.DQ.data;
const rows=[
 ['brambleback','Brambleback','willowbrook',2,4,1,2,2,[0,3],'#6f9854','beast','thorn',[['seed_potato',[1,2],.18]]],
 ['lanternmoth','Lantern moth','willowbrook',3,5,1,3,2,[0,4],'#d6b85f','winged','lamp',[['feather',[1,3],.3]]],
 ['rilljaw','Rilljaw','willowbrook',6,8,2,5,3,[2,8],'#4f9c91','clawed','fin',[['raw_shrimp',[1,2],.2]]],
 ['tattercap','Tattercap','willowbrook',9,12,2,7,6,[4,12],'#a56f91','humanoid','cap',[['rune',[1,2],.07]]],
 ['mossglass','Mossglass stag','mossbarrow',11,15,3,10,9,[2,11],'#77a98a','beast','antler',[['seed_strawberry',[1,2],.12]]],
 ['thimblefox','Thimblefox','mossbarrow',12,16,3,12,9,[3,13],'#c78354','beast','tail',[['feather',[2,4],.2]]],
 ['rootbound','The Rootbound','mossbarrow',17,24,4,16,16,[7,24],'#788754','humanoid','root',[['log_oak',[1,2],.22]]],
 ['bellhare','Belladonna hare','mossbarrow',19,26,5,18,14,[8,28],'#806a9b','beast','ears',[['seed_pumpkin',[1,2],.1]]],
 ['tideglass','Tideglass skitter','saltmere',14,19,3,12,15,[2,12],'#5da8a8','clawed','shell',[['gem_sapphire',[1,1],.015]]],
 ['kelplantern','Kelp lantern','saltmere',19,27,5,18,16,[8,30],'#5c9d78','spectral','fronds',[['rune',[1,3],.12]]],
 ['brineback','Brineback','saltmere',24,35,7,23,22,[18,55],'#728f99','beast','plates',[['old_bone',[1,1],.18]]],
 ['wreckling','Wreckling','saltmere',30,46,8,28,27,[35,100],'#9a765b','humanoid','wreck',[['gem_emerald',[1,1],.018]]],
 ['chimehorn','Chimehorn','ironpeak',32,34,6,29,23,[12,34],'#9cb7bd','beast','horn',[['ore_coal',[1,3],.24]]],
 ['snowcoil','Snowcoil','ironpeak',37,42,8,35,30,[10,38],'#b2d7d9','spectral','coil',[['frost_pelt',[1,1],.22]]],
 ['cairnmimic','Cairn mimic','ironpeak',44,58,10,43,49,[50,145],'#85857c','clawed','stones',[['gem_ruby',[1,1],.018]]],
 ['rimewing','Rimewing','ironpeak',49,72,12,48,41,[75,210],'#91b9cb','winged','ice',[['frost_pelt',[1,1],.35]]],
 ['murkbell','Murkbell','gloomfen',53,78,12,51,43,[55,155],'#718b6b','spectral','bell',[['rune',[2,5],.2]]],
 ['reedstalker','Reedstalker','gloomfen',57,88,14,57,52,[65,180],'#718b56','humanoid','reeds',[['old_bone',[1,2],.35]]],
 ['candletoad','Candletoad','gloomfen',63,112,17,63,65,[20,80],'#997b55','beast','candle',[['bogscale',[1,1],.28]]],
 ['siltmarionette','Silt marionette','gloomfen',69,128,19,72,63,[155,340],'#87768f','humanoid','strings',[['gem_diamond',[1,1],.012]]],
 ['ashveil','Ashveil','emberfall',66,96,16,64,58,[85,210],'#a36055','spectral','veil',[['rune',[3,8],.25]]],
 ['cinderloom','Cinderloom','emberfall',73,136,21,74,67,[125,320],'#d87a45','clawed','loom',[['ember_core',[1,1],.02]]],
 ['glassback','Glassback','emberfall',81,178,26,84,80,[210,500],'#ba765e','beast','glass',[['drakehide',[1,1],.36]]],
 ['furnacemite','Furnace mite','emberfall',88,230,31,90,86,[320,690],'#e09545','clawed','furnace',[['ember_core',[1,1],.045]]],
 ['nimbusgrazer','Nimbus grazer','skyreach',89,208,29,91,82,[310,720],'#b7d8d8','beast','cloud',[['feather',[6,18],.35]]],
 ['prismkite','Prism kite','skyreach',95,270,33,98,94,[420,930],'#b7a8d8','winged','prism',[['gem_diamond',[1,1],.03]]],
 ['thunderloom','Thunderloom','skyreach',101,315,37,102,97,[520,1140],'#7da9bb','clawed','storm',[['ore_astralite',[1,2],.2]]],
 ['galehermit','Gale hermit','skyreach',106,390,39,108,104,[720,1520],'#a5a28d','humanoid','kite',[['storm_feather',[1,1],.025]]],
 ['echohusk','Echo husk','hollow',105,330,39,106,106,[720,1540],'#625779','humanoid','echo',[['ore_voidstone',[1,1],.2]]],
 ['paleorbit','Pale orbit','hollow',109,355,41,112,102,[830,1760],'#a6a0bd','spectral','orbit',[['rune',[12,28],.35]]],
 ['threadsaint','Threadbare saint','hollow',114,400,43,115,111,[1050,2100],'#8a728b','humanoid','halo',[['gem_diamond',[1,2],.12]]],
 ['nullbloom','Nullbloom','hollow',119,470,45,119,116,[1300,2450],'#76527e','clawed','bloom',[['wyrm_scale',[1,1],.025]]]
];
D.EXTRA_CREATURES={};
for(const [id,name,town,cl,hp,max,att,def,coins,col,body,mark,drops] of rows){
 const m={id,name,town,cl,hp:Math.round(hp*.62),max:Math.max(1,Math.round(max*.72)),att,def,coins,col,drops};
 D.MON[id]=m;D.MONLIST.push(m);D.EXTRA_CREATURES[id]={body,mark,index:Object.keys(D.EXTRA_CREATURES).length};
}
})();
