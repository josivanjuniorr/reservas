// Carregador de configuração adaptável para desenvolvimento e produção
(function() {
  // Detectar se está rodando no GitHub Pages ou localmente
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  if (isGitHubPages) {
    // Configuração para GitHub Pages (produção)
    console.log('🌐 Detectado GitHub Pages - usando configuração de produção');
    
    window.SUPABASE_CONFIG = {
      url: 'https://abcjhhzqyknvgashtpbm.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2poaHpxeWtudmdhc2h0cGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODM5MTAsImV4cCI6MjA4MDU1OTkxMH0.yl5DPDQrrkh2Ds9UyAMaQGnuoxOZ9B2fAGspJxK4EsI'
    };
  } else {
    // Modo desenvolvimento - tentar carregar config.js local
    console.log('💻 Modo desenvolvimento - tentando carregar config.js local');
    
    // Criar um script tag para carregar config.js
    const script = document.createElement('script');
    script.src = 'config.js';
    script.onerror = function() {
      console.warn('⚠️ config.js não encontrado - usando configuração padrão');
      // Fallback para mesma configuração
      if (!window.SUPABASE_CONFIG) {
        window.SUPABASE_CONFIG = {
          url: 'https://abcjhhzqyknvgashtpbm.supabase.co',
          anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2poaHpxeWtudmdhc2h0cGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODM5MTAsImV4cCI6MjA4MDU1OTkxMH0.yl5DPDQrrkh2Ds9UyAMaQGnuoxOZ9B2fAGspJxK4EsI'
        };
      }
    };
    document.head.appendChild(script);
  }
})();
