// Supabase integration helper. Relies on the UMD `supabase` client included in the page
// and an optional `window.SUPABASE_CONFIG` (see `config.example.js`).
(function(global){
  global.SB = {
    initialized: false,
    useSupabase: false,
    client: null
  };

  async function init(){
    if (window.SUPABASE_CONFIG && typeof window.supabase !== 'undefined'){
      try {
        global.SB.client = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
        global.SB.useSupabase = true;
        global.SB.initialized = true;
        console.log('Supabase client initialized');
      } catch(e){
        console.warn('Failed to initialize Supabase client', e);
      }
    } else {
      console.log('Supabase config not found; using localStorage fallback. Copy config.example.js → config.js to enable.');
    }
  }

  async function loadAll(){
    if (!global.SB.useSupabase) return null;
    try {
      const { data, error } = await global.SB.client.from('reservas').select('*');
      if (error) throw error;
      return data;
    } catch(e){
      console.warn('Supabase loadAll error', e);
      return null;
    }
  }

  async function upsertMany(rows){
    if (!global.SB.useSupabase) return;
    try {
      await global.SB.client.from('reservas').upsert(rows, { onConflict: 'id' });
    } catch(e){
      console.warn('Supabase upsertMany error', e);
    }
  }

  async function deleteById(id){
    if (!global.SB.useSupabase) return;
    try {
      await global.SB.client.from('reservas').delete().eq('id', id);
    } catch(e){
      console.warn('Supabase delete error', e);
    }
  }

  global.SB.init = init;
  global.SB.loadAll = loadAll;
  global.SB.upsertMany = upsertMany;
  global.SB.deleteById = deleteById;

  // auto-init (config.js may be loaded with defer/async; it's fine if not present yet)
  setTimeout(() => { init(); }, 10);
})(window);
