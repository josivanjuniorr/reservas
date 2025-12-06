// Módulo de Autenticação com Supabase
(function(global) {
  global.Auth = {
    user: null,
    session: null,
    initialized: false
  };

  // Inicializar autenticação
  async function init() {
    if (!window.SB || !window.SB.client) {
      console.error('❌ Supabase client não disponível');
      return false;
    }

    try {
      // Verificar sessão existente
      const { data: { session }, error } = await window.SB.client.auth.getSession();
      
      if (error) throw error;

      if (session) {
        global.Auth.session = session;
        global.Auth.user = session.user;
        console.log('✅ Usuário autenticado:', session.user.email);
        showApp();
        return true;
      } else {
        console.log('ℹ️ Nenhuma sessão ativa');
        showLogin();
        return false;
      }
    } catch (e) {
      console.error('❌ Erro ao verificar sessão:', e);
      showLogin();
      return false;
    }
  }

  // Login com email/senha
  async function login(email, password) {
    try {
      const { data, error } = await window.SB.client.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      global.Auth.session = data.session;
      global.Auth.user = data.user;
      
      console.log('✅ Login realizado:', data.user.email);
      showApp();
      return { success: true, user: data.user };
    } catch (e) {
      console.error('❌ Erro no login:', e);
      return { success: false, error: e.message };
    }
  }

  // Registro de novo usuário
  async function signup(email, password, name) {
    try {
      const { data, error } = await window.SB.client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error) throw error;

      console.log('✅ Cadastro realizado:', data.user?.email);
      
      // Alguns provedores exigem confirmação de email
      if (data.user && !data.session) {
        return { 
          success: true, 
          message: 'Verifique seu email para confirmar o cadastro',
          needsConfirmation: true 
        };
      }

      global.Auth.session = data.session;
      global.Auth.user = data.user;
      showApp();
      return { success: true, user: data.user };
    } catch (e) {
      console.error('❌ Erro no cadastro:', e);
      return { success: false, error: e.message };
    }
  }

  // Logout
  async function logout() {
    try {
      const { error } = await window.SB.client.auth.signOut();
      if (error) throw error;

      global.Auth.session = null;
      global.Auth.user = null;
      
      console.log('✅ Logout realizado');
      showLogin();
      return { success: true };
    } catch (e) {
      console.error('❌ Erro no logout:', e);
      return { success: false, error: e.message };
    }
  }

  // Mostrar tela de login
  function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
    document.getElementById('loginEmail').focus();
  }

  // Mostrar aplicação
  function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    
    // Atualizar nome do usuário no header
    if (global.Auth.user) {
      const userInfo = document.getElementById('userInfo');
      if (userInfo) {
        const name = global.Auth.user.user_metadata?.full_name || global.Auth.user.email;
        userInfo.innerHTML = `
          <span>👤 ${name}</span>
          <button onclick="Auth.logout()" class="btn-logout">🚪 Sair</button>
        `;
      }
    }
  }

  // Alternar entre login e cadastro
  function toggleMode() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const isLoginVisible = loginForm.style.display !== 'none';

    if (isLoginVisible) {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
      document.getElementById('signupName').focus();
    } else {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      document.getElementById('loginEmail').focus();
    }
  }

  // Verificar se usuário está autenticado
  function isAuthenticated() {
    return global.Auth.session !== null;
  }

  // Obter usuário atual
  function getCurrentUser() {
    return global.Auth.user;
  }

  // Exportar métodos públicos
  global.Auth.init = init;
  global.Auth.login = login;
  global.Auth.signup = signup;
  global.Auth.logout = logout;
  global.Auth.showLogin = showLogin;
  global.Auth.showApp = showApp;
  global.Auth.toggleMode = toggleMode;
  global.Auth.isAuthenticated = isAuthenticated;
  global.Auth.getCurrentUser = getCurrentUser;

})(window);
