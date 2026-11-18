const {harness}=require('./engine-harness.cjs');
function setup(){const h=harness(),q=h.q;for(const n of ['creatures_expanded','skill_expansion_data','skills_new_data','beastmastery_data','hunting','skills_new','journal','secret_recipes','minibosses','lore','towers','companions','beastmastery','companion_choice','preparation_roles','worker_jobs','local_standing','shops'])h.load(n);q.S=q.newState();q.fxDirty();return h;}
module.exports={setup};
