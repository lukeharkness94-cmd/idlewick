const {harness}=require('./engine-harness.cjs');
function beasts(){const h=harness(),q=h.q;for(const n of ['creatures_expanded','skill_expansion_data','skills_new_data','beastmastery_data','hunting','skills_new','companions','journal','beastmastery'])h.load(n);if(process.env.INTEGRATION_CANDIDATE){q.integrationCandidate=true;h.load('hunting_loop_data');h.load('hunting_loop');h.load('shop_upgrades');}q.S=q.newState();q.S.unlocked.beastmastery=true;q.fxDirty();return h;}
module.exports={beasts};
